import * as https from 'https';
import * as http from 'http';
import { callTool, Controller, STRUDEL_REFERENCE, TOOLS } from './tools';

/**
 * Claude as a co-performer. You say what you want ("darker bass", "build to a drop")
 * and Claude reads the state and the code, then uses the same tools you have to
 * change the music, landing changes on the next phrase. Jam mode asks it for one
 * change every N bars on its own.
 */

export interface ClaudeOptions {
  apiKey: string;
  model: string;
  apiBase: string;
  maxTurns: number;
}

type Block =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean };
interface Message {
  role: 'user' | 'assistant';
  content: string | Block[];
}

export const SYSTEM_PROMPT = `You are a live coding co-performer inside VS Code, playing music with the user in real time with Strudel (the JavaScript port of TidalCycles), often in front of an audience.

How to work:
- Start by calling get_state and get_code. Make the change the user asked for, then stop.
- Prefer edit_code for small changes; use set_code only to rewrite the whole file.
- While music is playing, use when="next_phrase" so the change lands on the beat. Never stop the music unless asked.
- Keep it danceable and in the same tempo, key and style unless asked otherwise. One clear musical idea per change.
- Write valid Strudel. If a change fails to evaluate, read the error, fix it and try again (at most twice).
- Use the layers tool for muting and soloing rather than editing code by hand.
- Don't add visuals (Hydra, pianoroll...) unless asked.
- Your final reply is shown in the status bar: one short sentence (under 15 words) saying what you changed. No markdown.

${STRUDEL_REFERENCE}`;

export const JAM_PROMPT = (bars: number) =>
  `Jam mode: you are the second performer. Listen to the state and the code and make ONE tasteful change that develops the track over the next ${bars} bars: e.g. vary a rhythm, open or close a filter, add or drop a layer, a fill, a counter-melody, a variation of the riff. Don't repeat your last change. Keep the groove going; queue it with when="next_phrase". Then reply with one short sentence about what you did.`;

/** POST /v1/messages */
export function callMessages(opts: ClaudeOptions, body: unknown, signal?: AbortSignal): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL('/v1/messages', opts.apiBase);
    const lib = url.protocol === 'http:' ? http : https;
    const data = JSON.stringify(body);
    const req = lib.request(
      url,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': opts.apiKey,
          'anthropic-version': '2023-06-01',
          'content-length': Buffer.byteLength(data),
        },
        timeout: 120000,
      },
      (res) => {
        let text = '';
        res.on('data', (c) => (text += c));
        res.on('end', () => {
          let json: any;
          try {
            json = JSON.parse(text);
          } catch {
            return reject(new Error(`Claude API: HTTP ${res.statusCode}: ${text.slice(0, 200)}`));
          }
          if ((res.statusCode ?? 500) >= 400) {
            return reject(new Error(`Claude API: ${json?.error?.message ?? 'HTTP ' + res.statusCode}`));
          }
          resolve(json);
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error('Claude API timed out')));
    req.on('error', reject);
    signal?.addEventListener('abort', () => req.destroy(new Error('cancelled')));
    req.end(data);
  });
}

export interface AgentEvents {
  onTool?: (name: string, input: unknown, result: { text: string; isError: boolean }) => void;
  onText?: (text: string) => void;
}

/** Run one request to completion: Claude calls tools until it answers in text. */
export async function runAgent(
  controller: Controller,
  opts: ClaudeOptions,
  prompt: string,
  history: Message[] = [],
  events: AgentEvents = {},
  signal?: AbortSignal,
): Promise<{ reply: string; messages: Message[] }> {
  const messages: Message[] = [...history, { role: 'user', content: prompt }];
  const tools = TOOLS.map((t) => ({ name: t.name, description: t.description, input_schema: t.inputSchema }));
  for (let turn = 0; turn < opts.maxTurns; turn++) {
    if (signal?.aborted) throw new Error('cancelled');
    const res = await callMessages(
      opts,
      { model: opts.model, max_tokens: 4096, system: SYSTEM_PROMPT, tools, messages },
      signal,
    );
    const content: Block[] = res.content ?? [];
    messages.push({ role: 'assistant', content });
    for (const b of content) if (b.type === 'text' && b.text.trim()) events.onText?.(b.text.trim());
    const uses = content.filter((b): b is Extract<Block, { type: 'tool_use' }> => b.type === 'tool_use');
    if (res.stop_reason !== 'tool_use' || !uses.length) {
      const reply = content
        .filter((b): b is Extract<Block, { type: 'text' }> => b.type === 'text')
        .map((b) => b.text)
        .join(' ')
        .trim();
      return { reply, messages };
    }
    const results: Block[] = [];
    for (const u of uses) {
      const r = await callTool(controller, u.name, u.input);
      events.onTool?.(u.name, u.input, r);
      results.push({ type: 'tool_result', tool_use_id: u.id, content: r.text.slice(0, 20000), is_error: r.isError || undefined });
    }
    messages.push({ role: 'user', content: results });
  }
  return { reply: '(stopped: too many steps)', messages };
}

/** Keep a short memory between requests so "more of that" works, without growing forever. */
export function trimHistory(messages: Message[], keepTurns = 6): Message[] {
  // keep only plain user prompts and Claude's final text replies
  const plain: Message[] = [];
  for (const m of messages) {
    if (typeof m.content === 'string') plain.push(m);
    else if (m.role === 'assistant' && m.content.every((b) => b.type === 'text')) {
      const text = m.content.map((b) => (b as any).text).join(' ').trim();
      if (text) plain.push({ role: 'assistant', content: text });
    }
  }
  // the API needs user/assistant to alternate, starting with user
  const out: Message[] = [];
  for (const m of plain) {
    if (out.length && out[out.length - 1].role === m.role) out[out.length - 1] = m;
    else out.push(m);
  }
  while (out.length && out[0].role !== 'user') out.shift();
  const sliced = out.slice(-keepTurns * 2);
  while (sliced.length && sliced[0].role !== 'user') sliced.shift();
  if (sliced.length && sliced[sliced.length - 1].role === 'user') sliced.pop();
  return sliced;
}
