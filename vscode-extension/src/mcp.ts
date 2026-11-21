import * as http from 'http';
import { readBody } from './server';
import { callTool, Controller, TOOLS } from './tools';

/**
 * A minimal MCP server over Streamable HTTP (JSON responses), so Claude Code,
 * VS Code's agent mode or any MCP client can drive the set:
 *   claude mcp add --transport http algorave http://127.0.0.1:47130/mcp --header "Authorization: Bearer <token>"
 */
export class McpEndpoint {
  constructor(
    private readonly controller: Controller,
    private readonly token: () => string,
    private readonly version: string,
    private readonly log: (s: string) => void = () => {},
  ) {}

  async handle(req: http.IncomingMessage, res: http.ServerResponse) {
    if (req.headers.authorization !== `Bearer ${this.token()}`) {
      res.writeHead(401, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'missing or wrong token' }));
      return;
    }
    if (req.method !== 'POST') {
      // no server-initiated stream
      res.writeHead(405, { allow: 'POST' }).end();
      return;
    }
    let msg: any;
    try {
      msg = JSON.parse(await readBody(req));
    } catch {
      return this.send(res, { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    }
    if (Array.isArray(msg)) {
      const out = (await Promise.all(msg.map((m) => this.dispatch(m)))).filter(Boolean);
      if (!out.length) return void res.writeHead(202).end();
      return this.send(res, out);
    }
    const out = await this.dispatch(msg);
    if (!out) return void res.writeHead(202).end();
    this.send(res, out);
  }

  private send(res: http.ServerResponse, body: unknown) {
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(body));
  }

  /** One JSON-RPC message in, a response out (or nothing for notifications). */
  async dispatch(m: any): Promise<unknown | undefined> {
    if (!m || m.jsonrpc !== '2.0' || typeof m.method !== 'string') {
      return { jsonrpc: '2.0', id: m?.id ?? null, error: { code: -32600, message: 'Invalid request' } };
    }
    const isNotification = m.id === undefined || m.id === null;
    const ok = (result: unknown) => (isNotification ? undefined : { jsonrpc: '2.0', id: m.id, result });
    const err = (code: number, message: string) => (isNotification ? undefined : { jsonrpc: '2.0', id: m.id, error: { code, message } });
    switch (m.method) {
      case 'initialize':
        return ok({
          protocolVersion: m.params?.protocolVersion ?? '2025-06-18',
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'algorave-kit', title: 'Algorave Kit (VS Code)', version: this.version },
          instructions:
            "Live coding music in VS Code with Strudel (and TidalCycles). Call get_state and get_code before changing anything, and strudel_reference before writing code. While music plays, prefer when='next_phrase' so changes land on the beat, and small edit_code changes over rewriting the file.",
        });
      case 'notifications/initialized':
      case 'notifications/cancelled':
        return undefined;
      case 'ping':
        return ok({});
      case 'tools/list':
        return ok({ tools: TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })) });
      case 'tools/call': {
        const name = m.params?.name;
        if (!TOOLS.some((t) => t.name === name)) return err(-32602, `Unknown tool: ${name}`);
        this.log(`agent → ${name} ${JSON.stringify(m.params?.arguments ?? {}).slice(0, 200)}`);
        const r = await callTool(this.controller, name, m.params?.arguments);
        return ok({ content: [{ type: 'text', text: r.text }], isError: r.isError });
      }
      default:
        return err(-32601, `Method not found: ${m.method}`);
    }
  }
}
