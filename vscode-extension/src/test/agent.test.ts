import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as http from 'http';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { AddressInfo } from 'net';
import { CacheProxy, fromCachePath, toCachePath } from '../cache';
import { LocalServer } from '../server';
import { McpEndpoint } from '../mcp';
import { callTool, Controller, TOOLS } from '../tools';
import { runAgent, trimHistory } from '../claude';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'algorave-'));
const listen = (handler: http.RequestListener) =>
  new Promise<{ url: string; close: () => void }>((resolve) => {
    const s = http.createServer(handler).listen(0, '127.0.0.1', () =>
      resolve({ url: `http://127.0.0.1:${(s.address() as AddressInfo).port}`, close: () => s.close() }),
    );
  });
const get = (url: string, headers: Record<string, string> = {}) =>
  new Promise<{ status: number; body: string; headers: http.IncomingHttpHeaders }>((resolve, reject) => {
    http.get(url, { headers }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body, headers: res.headers }));
    }).on('error', reject);
  });
const post = (url: string, data: unknown, headers: Record<string, string> = {}) =>
  new Promise<{ status: number; body: string }>((resolve, reject) => {
    const req = http.request(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers } }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on('error', reject);
    req.end(JSON.stringify(data));
  });

test('cache paths round-trip', () => {
  const u = 'https://unpkg.com/@strudel/repl@1.3.0/dist/index.js';
  assert.equal(toCachePath(u), 'https/unpkg.com/@strudel/repl@1.3.0/dist/index.js');
  assert.equal(fromCachePath(toCachePath(u)), u);
});

test('cache: downloads once, then serves from disk with the network gone; follows redirects; 504 when offline and missing', async () => {
  let online = true;
  let hits = 0;
  const upstream = await listen((req, res) => {
    hits++;
    if (req.url === '/pkg') return void res.writeHead(302, { location: '/pkg/dist/index.js' }).end();
    if (req.url === '/pkg/dist/index.js') return void res.writeHead(200, { 'content-type': 'application/javascript' }).end('console.log(1)');
    if (req.url === '/a.wav') return void res.writeHead(200, { 'content-type': 'audio/wav' }).end('RIFF....WAVE');
    res.writeHead(404).end();
  });
  const dir = tmp();
  const cache = new CacheProxy(dir, () => true, () => {}, async (url) => {
    if (!online) throw new Error('offline');
    const { fetchOnce } = await import('../cache');
    return fetchOnce(url);
  });
  const server = new LocalServer(() => 0);
  server.route('/tok/cache/', (req, res, rest) => cache.handle(req, res, rest, '/tok/cache/'));
  await server.start();
  const via = (u: string) => `${server.base}/tok/cache/${toCachePath(u)}`;

  const r1 = await get(via(`${upstream.url}/a.wav`));
  assert.equal(r1.status, 200);
  assert.equal(r1.body, 'RIFF....WAVE');
  assert.equal(r1.headers['content-type'], 'audio/wav');
  assert.equal(r1.headers['access-control-allow-origin'], '*');

  const red = await get(via(`${upstream.url}/pkg`));
  assert.equal(red.status, 302);
  assert.equal(red.headers.location, `/tok/cache/${toCachePath(upstream.url + '/pkg/dist/index.js')}`);
  assert.equal((await get(server.base + red.headers.location)).body, 'console.log(1)');

  online = false;
  const before = hits;
  assert.equal((await get(via(`${upstream.url}/a.wav`))).body, 'RIFF....WAVE');
  assert.equal((await get(via(`${upstream.url}/pkg`))).status, 302); // the redirect is cached too
  assert.equal(hits, before, 'no network while serving from disk');
  assert.equal((await get(via(`${upstream.url}/nope.wav`))).status, 504);
  assert.ok(cache.stats().files >= 2);
  cache.clear();
  assert.equal(cache.stats().files, 0);
  server.dispose();
  upstream.close();
});

// A pretend extension for the tools
function fakeController() {
  const calls: string[] = [];
  let code = 'setcps(1)\nconst bass = note("c2 e2").lpf(800)\nstack(s("bd*4"), bass)';
  const c: Controller = {
    state: () => ({ playing: true, bar: 9, layers: [{ name: 'bass', muted: false }] }),
    code: () => ({ file: 'x.strudel', code }),
    setCode: async (next, when) => {
      calls.push(`setCode:${when}`);
      code = next;
      return { ok: true, startsAtBar: 13 };
    },
    stop: async () => void calls.push('stop'),
    patterns: () => [{ name: '01 · First beat', about: 'basics' }, { name: '26 · New Monkey: the tune', about: 'anthem' }],
    loadPattern: async (n, w) => (calls.push(`load:${n}:${w}`), { ok: true }),
    layers: async (a, names) => (calls.push(`layers:${a}:${names}`), { ok: true }),
    drop: async () => (calls.push('drop'), { ok: true }),
    mutate: async (l) => (calls.push(`mutate:${l}`), { ok: true }),
    setList: async (a) => (calls.push(`setlist:${a}`), []),
    tidal: async (t) => (calls.push(`tidal:${t}`), { ok: true }),
    reference: () => 'REF',
  };
  return { c, calls, code: () => code };
}

test('tools: edit_code needs a unique match; list_patterns filters', async () => {
  const f = fakeController();
  const bad = await callTool(f.c, 'edit_code', { find: 'nothere', replace: 'x' });
  assert.equal(bad.isError, true);
  const ok = await callTool(f.c, 'edit_code', { find: '.lpf(800)', replace: '.lpf(300)' });
  assert.equal(ok.isError, false);
  assert.match(f.code(), /lpf\(300\)/);
  assert.deepEqual(f.calls, ['setCode:next_phrase']);
  const pats = JSON.parse((await callTool(f.c, 'list_patterns', { search: 'monkey' })).text);
  assert.equal(pats.length, 1);
  assert.equal((await callTool(f.c, 'nope', {})).isError, true);
});

test('MCP over HTTP: token, initialize, tools/list, tools/call, notifications', async () => {
  const f = fakeController();
  const mcp = new McpEndpoint(f.c, () => 'secret', '0.5.0');
  const server = new LocalServer(() => 0);
  server.route('/mcp', (req, res) => mcp.handle(req, res));
  await server.start();
  const url = `${server.base}/mcp`;
  const auth = { authorization: 'Bearer secret' };
  assert.equal((await post(url, { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} })).status, 401);
  const init = JSON.parse((await post(url, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } }, auth)).body);
  assert.equal(init.result.serverInfo.name, 'algorave-kit');
  assert.equal(init.result.protocolVersion, '2025-06-18');
  assert.equal((await post(url, { jsonrpc: '2.0', method: 'notifications/initialized' }, auth)).status, 202);
  const list = JSON.parse((await post(url, { jsonrpc: '2.0', id: 2, method: 'tools/list' }, auth)).body);
  assert.deepEqual(list.result.tools.map((t: any) => t.name), TOOLS.map((t) => t.name));
  const call = JSON.parse(
    (await post(url, { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'layers', arguments: { action: 'mute', names: ['bass'] } } }, auth)).body,
  );
  assert.equal(call.result.isError, false);
  assert.deepEqual(f.calls, ['layers:mute:bass']);
  const unknown = JSON.parse((await post(url, { jsonrpc: '2.0', id: 4, method: 'nope' }, auth)).body);
  assert.equal(unknown.error.code, -32601);
  assert.equal((await get(url, auth)).status, 405);
  server.dispose();
});

test('Claude agent loop: tools until a text answer, tool results matched by id', async () => {
  const f = fakeController();
  const seen: any[] = [];
  const api = await listen((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const b = JSON.parse(body);
      seen.push({ headers: req.headers, body: b });
      const n = seen.length;
      const reply =
        n === 1
          ? { stop_reason: 'tool_use', content: [{ type: 'text', text: 'Looking.' }, { type: 'tool_use', id: 'tu_1', name: 'get_code', input: {} }] }
          : n === 2
            ? { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 'tu_2', name: 'edit_code', input: { find: '.lpf(800)', replace: '.lpf(400).lpq(8)' } }] }
            : { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Darker, squelchier bass from bar 13.' }] };
      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ id: 'msg', role: 'assistant', ...reply }));
    });
  });
  const tools: string[] = [];
  const { reply, messages } = await runAgent(
    f.c,
    { apiKey: 'k', model: 'claude-sonnet-5-5', apiBase: api.url, maxTurns: 5 },
    'darker bass',
    [],
    { onTool: (name) => tools.push(name) },
  );
  assert.equal(reply, 'Darker, squelchier bass from bar 13.');
  assert.deepEqual(tools, ['get_code', 'edit_code']);
  assert.match(f.code(), /lpf\(400\)\.lpq\(8\)/);
  assert.equal(seen[0].headers['x-api-key'], 'k');
  assert.equal(seen[0].headers['anthropic-version'], '2023-06-01');
  assert.equal(seen[0].body.model, 'claude-sonnet-5-5');
  assert.ok(seen[0].body.tools.some((t: any) => t.name === 'edit_code' && t.input_schema));
  const second = seen[1].body.messages;
  assert.equal(second[second.length - 1].content[0].type, 'tool_result');
  assert.equal(second[second.length - 1].content[0].tool_use_id, 'tu_1');
  // history keeps only prompts and final replies, alternating
  const h = trimHistory(messages);
  assert.deepEqual(h.map((m) => m.role), ['user', 'assistant']);
  assert.equal(h[1].content, 'Darker, squelchier bass from bar 13.');
  api.close();
});

test('Claude API errors come back readable', async () => {
  const f = fakeController();
  const api = await listen((req, res) => {
    req.resume();
    res.writeHead(401, { 'content-type': 'application/json' }).end(JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }));
  });
  await assert.rejects(runAgent(f.c, { apiKey: 'bad', model: 'm', apiBase: api.url, maxTurns: 2 }, 'hi'), /invalid x-api-key/);
  api.close();
});
