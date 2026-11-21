import * as vscode from 'vscode';
import { callTool, Controller, TOOLS } from './tools';
import { SYSTEM_PROMPT } from './claude';
import type { AgentEvents } from './claude';

/**
 * The co-performer on VS Code's own language models (GitHub Copilot, including the
 * free plan), so no API key or extra spending: the same tools, through vscode.lm.
 */

/** Pick a chat model: the configured family if given, else Copilot's first (on Free: auto). */
export async function pickModel(family: string): Promise<vscode.LanguageModelChat | undefined> {
  const all = await vscode.lm.selectChatModels({ vendor: 'copilot' });
  if (!all.length) return undefined;
  if (family) {
    const m = all.find((x) => x.family === family || x.id === family);
    if (m) return m;
  }
  return all.find((x) => x.family === 'auto') ?? all[0];
}

export async function runAgentLm(
  controller: Controller,
  model: vscode.LanguageModelChat,
  prompt: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  events: AgentEvents,
  token: vscode.CancellationToken,
  maxTurns = 10,
): Promise<{ reply: string; history: { role: 'user' | 'assistant'; content: string }[] }> {
  const M = vscode.LanguageModelChatMessage;
  // No system role in vscode.lm: the instructions go first as a user message
  const messages: vscode.LanguageModelChatMessage[] = [
    M.User(SYSTEM_PROMPT),
    M.Assistant('Understood. I will use the tools and keep changes in time with the music.'),
    ...history.map((h) => (h.role === 'user' ? M.User(h.content) : M.Assistant(h.content))),
    M.User(prompt),
  ];
  const tools: vscode.LanguageModelChatTool[] = TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }));
  for (let turn = 0; turn < maxTurns; turn++) {
    if (token.isCancellationRequested) throw new Error('cancelled');
    const res = await model.sendRequest(messages, { tools, toolMode: vscode.LanguageModelChatToolMode.Auto, justification: 'Change the music you are live coding' }, token);
    const text: string[] = [];
    const calls: vscode.LanguageModelToolCallPart[] = [];
    for await (const part of res.stream) {
      if (part instanceof vscode.LanguageModelTextPart) text.push(part.value);
      else if (part instanceof vscode.LanguageModelToolCallPart) calls.push(part);
    }
    const said = text.join('').trim();
    if (said) events.onText?.(said);
    if (!calls.length) {
      const next: typeof history = [...history, { role: 'user', content: prompt }, { role: 'assistant', content: said || '(done)' }];
      return { reply: said, history: next.slice(-12) };
    }
    messages.push(M.Assistant([...(said ? [new vscode.LanguageModelTextPart(said)] : []), ...calls]));
    const results: vscode.LanguageModelToolResultPart[] = [];
    for (const call of calls) {
      const r = await callTool(controller, call.name, call.input);
      events.onTool?.(call.name, call.input, r);
      results.push(new vscode.LanguageModelToolResultPart(call.callId, [new vscode.LanguageModelTextPart((r.isError ? 'ERROR: ' : '') + r.text.slice(0, 20000))]));
    }
    messages.push(M.User(results));
  }
  return { reply: '(stopped: too many steps)', history };
}
