// The controls an agent gets: the same ones you have, as tools. Shared by the MCP
// server (Claude Code, VS Code's agent mode) and the built-in Claude co-performer.

export type When = 'now' | 'next_phrase';

export interface EvalResult {
  ok: boolean;
  error?: string;
  /** for queued changes: the bar the new code starts on (1-based) */
  startsAtBar?: number;
  note?: string;
}

export interface Controller {
  state(): Record<string, unknown>;
  code(): { file: string; code: string } | undefined;
  setCode(code: string, when: When): Promise<EvalResult>;
  stop(): Promise<void>;
  patterns(): { name: string; about: string }[];
  loadPattern(name: string, when: When): Promise<EvalResult>;
  layers(action: 'mute' | 'unmute' | 'solo' | 'unmute_all', names: string[]): Promise<EvalResult & { layers?: unknown }>;
  drop(): Promise<EvalResult>;
  mutate(layer?: string): Promise<EvalResult & { transform?: string }>;
  setList(action: 'list' | 'next' | 'previous'): Promise<unknown>;
  tidal(code: string): Promise<EvalResult>;
  reference(): string;
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  run(c: Controller, args: any): Promise<unknown>;
}

const when = {
  type: 'string',
  enum: ['now', 'next_phrase'],
  description:
    "'next_phrase' (default while music plays) starts the change exactly on the next phrase line (every 4 bars), so it lands in time. 'now' applies it at once.",
};

export const TOOLS: Tool[] = [
  {
    name: 'get_state',
    description:
      'What is happening now: playing or stopped, tempo (cps and BPM), the current bar and arrange() section, the file being played, its layers (with mute state), anything queued, the set list position and the last error.',
    inputSchema: { type: 'object', properties: {} },
    run: async (c) => c.state(),
  },
  {
    name: 'get_code',
    description: 'The Strudel code of the pattern that is playing (or the open Strudel file), with its file name.',
    inputSchema: { type: 'object', properties: {} },
    run: async (c) => c.code() ?? { error: 'No Strudel file is open.' },
  },
  {
    name: 'set_code',
    description:
      'Replace the whole Strudel file with new code and play it. The code must be complete, valid Strudel (JavaScript): the last expression is what plays. Returns an error if it fails to evaluate.',
    inputSchema: {
      type: 'object',
      properties: { code: { type: 'string', description: 'The complete new code.' }, when },
      required: ['code'],
    },
    run: (c, a) => c.setCode(String(a.code), a.when ?? 'next_phrase'),
  },
  {
    name: 'edit_code',
    description:
      "Change part of the Strudel file: replace the exact text 'find' (it must appear exactly once) with 'replace', then play it. Best for small changes, e.g. one layer's filter or notes.",
    inputSchema: {
      type: 'object',
      properties: {
        find: { type: 'string', description: 'Exact text currently in the file (include enough to be unique).' },
        replace: { type: 'string', description: 'The text to put in its place.' },
        when,
      },
      required: ['find', 'replace'],
    },
    run: async (c, a) => {
      const cur = c.code();
      if (!cur) return { ok: false, error: 'No Strudel file is open.' };
      const find = String(a.find);
      const n = cur.code.split(find).length - 1;
      if (n !== 1) return { ok: false, error: n === 0 ? "'find' isn't in the code. Call get_code to see it." : `'find' appears ${n} times; include more text so it's unique.` };
      return c.setCode(cur.code.replace(find, () => String(a.replace)), a.when ?? 'next_phrase');
    },
  },
  {
    name: 'stop',
    description: 'Hush: stop all sound (Strudel and Tidal).',
    inputSchema: { type: 'object', properties: {} },
    run: async (c) => {
      await c.stop();
      return { ok: true };
    },
  },
  {
    name: 'list_patterns',
    description: "The patterns in the user's kit (patterns.js), with a one-line description each. Optionally filter by a search word.",
    inputSchema: { type: 'object', properties: { search: { type: 'string' } } },
    run: async (c, a) => {
      const q = String(a.search ?? '').toLowerCase();
      return c.patterns().filter((p) => !q || (p.name + ' ' + p.about).toLowerCase().includes(q));
    },
  },
  {
    name: 'load_pattern',
    description: 'Open a kit pattern by its name (from list_patterns) and play it.',
    inputSchema: { type: 'object', properties: { name: { type: 'string' }, when }, required: ['name'] },
    run: (c, a) => c.loadPattern(String(a.name), a.when ?? 'next_phrase'),
  },
  {
    name: 'layers',
    description:
      "Mute, unmute or solo layers of the playing pattern by name (the names from get_state), or unmute everything. The change is written into the code (a muted layer becomes silence/*name*/) and takes effect at once.",
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['mute', 'unmute', 'solo', 'unmute_all'] },
        names: { type: 'array', items: { type: 'string' }, description: 'Layer names. One name for solo; ignored for unmute_all.' },
      },
      required: ['action'],
    },
    run: (c, a) => c.layers(a.action, Array.isArray(a.names) ? a.names.map(String) : []),
  },
  {
    name: 'drop',
    description:
      'Do a drop: from the next suitable bar, filter everything up, take the kick and bass out and play a snare roll, then bring everything back on the next 8-bar line. Only while playing.',
    inputSchema: { type: 'object', properties: {} },
    run: (c) => c.drop(),
  },
  {
    name: 'mutate',
    description: 'Add a random transformation (rev, jux, ply, off, degradeBy...) to one layer, by name, or to the whole pattern, and play it.',
    inputSchema: { type: 'object', properties: { layer: { type: 'string', description: 'Layer name; leave out for the whole pattern.' } } },
    run: (c, a) => c.mutate(a.layer ? String(a.layer) : undefined),
  },
  {
    name: 'set_list',
    description: "The user's set list (running order with private notes): list it, or queue the next / previous item on the next phrase.",
    inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['list', 'next', 'previous'] } }, required: ['action'] },
    run: (c, a) => c.setList(a.action),
  },
  {
    name: 'tidal_eval',
    description: 'Send TidalCycles code to GHCi (boots Tidal if needed). Multi-line blocks are fine, e.g. d1 $ s "bd*4". Use hush to stop.',
    inputSchema: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] },
    run: (c, a) => c.tidal(String(a.code)),
  },
  {
    name: 'strudel_reference',
    description: "A cheat sheet for Strudel as this kit uses it: mini-notation, the functions, and the kit's conventions. Read it before writing code.",
    inputSchema: { type: 'object', properties: {} },
    run: async (c) => c.reference(),
  },
];

export async function callTool(c: Controller, name: string, args: unknown): Promise<{ text: string; isError: boolean }> {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) return { text: `Unknown tool: ${name}`, isError: true };
  try {
    const out = await tool.run(c, args && typeof args === 'object' ? args : {});
    const text = typeof out === 'string' ? out : JSON.stringify(out, null, 2);
    const isError = !!(out && typeof out === 'object' && 'ok' in (out as any) && (out as any).ok === false);
    return { text, isError };
  } catch (e) {
    return { text: `Error: ${(e as Error).message}`, isError: true };
  }
}

/** The cheat sheet given to agents. */
export const STRUDEL_REFERENCE = `# Strudel in this kit

Conventions
- One cycle is one bar (4 beats). Tempo: setcps(BPM/60/4), e.g. setcps(170/60/4).
- The LAST expression in the file is what plays. Layers are usually consts combined with stack(...),
  and full tunes use arrange([bars, stack(...)], ...) with a // comment naming each section.
- Drums: s("bd*4").bank("RolandTR909"); also "RolandTR808", "LinnDrum". Breaks: s("brk").splice(16, "0 1 2 ...").
- Muted layers look like silence/*bass*/ or silence /*muted:...*/ - leave those markers alone; use the layers tool.
- Keep the code readable for the audience: short lines, a comment for a big change. Don't add Hydra / visuals.

Mini-notation (inside "double quotes")
- "a b c" steps in a cycle · "~" rest · "a*4" repeat · "[a b]" group · "<a b>" one per cycle
- "a, b" together · "a(3,8)" euclid · "a?" maybe · "a:2" sample 2 · "a@3" length 3 · "a!" repeat step

Sound
- s("bd sd") samples · n("0 2 4").scale("A3:minor") scale degrees · note("c2 e2") / note("<a1 f1 c2 g1>")
- chord("<Am F C G>").voicing() · synths: "sawtooth", "square", "triangle", "sine", "supersaw" (.detune, .unison)
- soundfonts: "gm_epiano1", "gm_voice_oohs", "piano"

Tone & space
- .lpf(800) .lpq(8) .hpf(200) .vowel("a") .shape(0.5) .crush(4) .coarse(8)
- .gain(0.8) .velocity(0.7) .pan(sine) .room(0.5).size(0.9) .delay(0.3).delaytime(0.375).delayfeedback(0.4)
- envelopes: .attack(0.01).decay(0.1).sustain(0).release(0.3) · pitch env: .penv(-12).pattack(0.15)

Time & change
- .fast(2) .slow(2) .early(1/8) .late(1/8) .ply(2) .rev() .palindrome() .iter(4) .chunk(4, x => x.hurry(2))
- .every(4, x => x.rev()) / .firstOf / .lastOf · .sometimesBy(0.3, x => x.speed(2)) · .degradeBy(0.3)
- .jux(rev) · .off(1/8, x => x.add(note(12))) · .struct("x ~ x ~") · .mask("<1 0>") · .swingBy(1/6, 4)
- .add(note(12)) transposes · arrange([4, a], [4, b]) sequences sections

Modulation
- sine, saw, square, tri, perlin, rand, irand(8) - e.g. .lpf(sine.range(300, 3000).slow(8))

Style for this kit: makina / New Monkey (offbeat bass "[~ x]*4", 3-3-2 stabs "x ~ ~ x ~ ~ x ~", 165-180 BPM)
and jungle (amen splices at 170 BPM, reese basses, ragga skanks).
`;
