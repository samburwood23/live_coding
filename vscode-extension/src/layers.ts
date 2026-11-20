// Reading and editing the layers of a Strudel pattern: mute / solo, the mutator,
// and the arrange() sections for the bar counter. No VS Code imports, so it's testable.
import * as acorn from 'acorn';

type Node = acorn.Node & Record<string, any>;

export interface Layer {
  /** what the user sees: the const name, or the first bit of an inline layer's code */
  label: string;
  /** a key that survives edits: `name:bass` or `inline:<text>` */
  key: string;
  muted: boolean;
  drums: boolean;
}

// Comments replaced by spaces (same length), except our "silence /*...*" mute markers
function blankComments(text: string): string {
  return text.replace(/(silence ?\/\*[\s\S]*?\*\/)|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, (m, keep) => (keep ? m : m.replace(/[^\n]/g, ' ')));
}

const MUTED_INLINE = /silence \/\*muted:([\s\S]*?)\*\//g;
const mutedNamed = (name: string) => `silence/*${name}*/`;

function parse(code: string): Node {
  return acorn.parse(code, {
    ecmaVersion: 'latest',
    sourceType: 'module',
    allowAwaitOutsideFunction: true,
    allowReturnOutsideFunction: true,
  }) as Node;
}

/** walk every node, with its parent */
function walk(node: Node, fn: (n: Node, parent: Node | undefined) => void, parent?: Node) {
  fn(node, parent);
  for (const key of Object.keys(node)) {
    if (key === 'type' || key === 'start' || key === 'end') continue;
    const v = (node as any)[key];
    if (Array.isArray(v)) v.forEach((c) => c && typeof c.type === 'string' && walk(c, fn, node));
    else if (v && typeof v.type === 'string') walk(v, fn, node);
  }
}

/** the call at the bottom of a method chain: stack(...) in stack(...).pianoroll() */
function rootCall(n: Node | undefined): Node | undefined {
  while (n && n.type === 'CallExpression' && n.callee.type === 'MemberExpression') n = n.callee.object;
  return n;
}
const calleeName = (n: Node | undefined) => {
  const r = rootCall(n);
  return r && r.type === 'CallExpression' && r.callee.type === 'Identifier' ? (r.callee.name as string) : undefined;
};

const isDrums = (text: string) => /\bs\(\s*["'`]/.test(text) && !/\b(note|n|chord|freq)\(/.test(text);
const short = (text: string) => {
  const one = text.replace(/\/\/[^\n]*/g, '').replace(/\s+/g, ' ').trim();
  return one.length > 48 ? one.slice(0, 47) + '…' : one;
};

interface Model {
  code: string;
  last: Node; // the last top-level expression: what plays
  consts: Map<string, Node>; // top-level const name -> declarator
  /** const names used as layers in the last expression */
  named: string[];
  /** the ones still playing (not replaced by silence) */
  live: Set<string>;
  /** inline layers: the arguments of a top-level stack(...) that aren't plain names */
  inline: Node[];
}

function model(code: string): Model {
  const ast = parse(code);
  const body = ast.body as Node[];
  const lastStmt = [...body].reverse().find((s) => s.type === 'ExpressionStatement');
  if (!lastStmt) throw new Error('No pattern found: the last statement should be the pattern that plays.');
  const last = lastStmt.expression as Node;
  const consts = new Map<string, Node>();
  for (const st of body) {
    if (st.type !== 'VariableDeclaration') continue;
    for (const d of st.declarations as Node[]) if (d.id.type === 'Identifier' && d.init) consts.set(d.id.name, d);
  }
  const named: string[] = [];
  walk(last, (n, parent) => {
    if (n.type !== 'Identifier' || !consts.has(n.name)) return;
    if (parent?.type === 'MemberExpression' && parent.property === n && !parent.computed) return;
    if (parent?.type === 'Property' && parent.key === n) return;
    if (!named.includes(n.name)) named.push(n.name);
  });
  const live = new Set(named);
  // names muted earlier (silence/*bass*/) are layers too, even with no live reference
  const lastText = blankComments(code.slice(last.start, last.end));
  for (const m of lastText.matchAll(/silence\/\*([A-Za-z_$][\w$]*)\*\//g)) if (!named.includes(m[1])) named.push(m[1]);
  // keep them in the order they first appear, muted or not, so numbers don't shift
  const firstAt = (name: string) => {
    const re = new RegExp(`(silence\\/\\*)?(?<![\\w$])${name.replace(/\$/g, '\\$')}(?![\\w$])`);
    const i = lastText.search(re);
    return i < 0 ? Infinity : i;
  };
  named.sort((a, b) => firstAt(a) - firstAt(b));
  const inline: Node[] = [];
  const root = rootCall(last);
  if (calleeName(last) === 'stack' && root) {
    for (const a of root.arguments as Node[]) {
      if (a.type === 'Identifier') continue; // a named layer, or a muted one (silence)
      // riff.s("piano") belongs to the riff layer: muting riff mutes it
      let base: Node = a;
      while (base.type === 'CallExpression' || base.type === 'MemberExpression') base = base.type === 'CallExpression' ? base.callee : base.object;
      if (base.type === 'Identifier' && (consts.has(base.name) || base.name === 'silence')) continue;
      // arrange([4, sweep], [8, chops]) only arranges named layers: it isn't a layer itself
      let makesSound = false;
      walk(a, (n) => {
        if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && /^(s|sound|n|note|chord|freq)$/.test(n.callee.name)) makesSound = true;
      });
      if (!makesSound) continue;
      inline.push(a);
    }
  }
  return { code, last, consts, named, live, inline };
}

/** All the layers of the pattern that plays, in order, with their mute state. */
export function listLayers(code: string): Layer[] {
  const m = model(code);
  const lastText = blankComments(code.slice(m.last.start, m.last.end));
  const layers: Layer[] = m.named.map((name) => {
    const decl = m.consts.get(name);
    const text = decl ? code.slice(decl.init.start, decl.init.end) : '';
    return { label: name, key: `name:${name}`, muted: !m.live.has(name), drums: isDrums(text) || /kick|hat|clap|roll|drum|amen|break/i.test(name) };
  });
  for (const a of m.inline) {
    const text = code.slice(a.start, a.end);
    layers.push({ label: short(text), key: `inline:${text}`, muted: false, drums: isDrums(text) });
  }
  for (const mm of lastText.matchAll(MUTED_INLINE)) {
    layers.push({ label: short(mm[1]), key: `inline:${mm[1]}`, muted: true, drums: isDrums(mm[1]) });
  }
  return layers;
}

/** Mute or unmute one layer. The change is plain code you can read and undo. */
export function setMuted(code: string, key: string, mute: boolean): string {
  const m = model(code);
  if (key.startsWith('name:')) {
    const name = key.slice(5);
    if (!mute) return code.split(mutedNamed(name)).join(name);
    const spots: Node[] = [];
    walk(m.last, (n, parent) => {
      if (n.type !== 'Identifier' || n.name !== name) return;
      if (parent?.type === 'MemberExpression' && parent.property === n && !parent.computed) return;
      if (parent?.type === 'Property' && parent.key === n) return;
      spots.push(n);
    });
    let out = code;
    for (const n of spots.sort((a, b) => b.start - a.start)) out = out.slice(0, n.start) + mutedNamed(name) + out.slice(n.end);
    return out;
  }
  const text = key.slice(7);
  if (!mute) {
    const marker = `silence /*muted:${text}*/`;
    const i = code.indexOf(marker);
    return i < 0 ? code : code.slice(0, i) + text + code.slice(i + marker.length);
  }
  if (text.includes('*/')) throw new Error("This layer has a */ in it, so it can't be muted with a comment.");
  const arg = m.inline.find((a) => code.slice(a.start, a.end) === text);
  if (!arg) return code;
  return code.slice(0, arg.start) + `silence /*muted:${text}*/` + code.slice(arg.end);
}

/** Make exactly the given layers muted (by key), leaving the rest playing. */
export function applyMutes(code: string, mutedKeys: Set<string>): string {
  let out = code;
  for (const l of listLayers(code)) {
    const want = mutedKeys.has(l.key);
    if (want !== l.muted) out = setMuted(out, l.key, want);
  }
  return out;
}

// ---------------------------------------------------------------------------
// The mutator
// ---------------------------------------------------------------------------
export const DRUM_MUTATIONS = [
  '.ply("<1 2>")',
  '.degradeBy(0.25)',
  '.sometimesBy(0.3, x => x.speed(2))',
  '.chunk(4, x => x.hurry(2))',
  '.every(4, x => x.ply(2))',
  '.swingBy(1/6, 4)',
  '.jux(rev)',
  '.fast("<1 [1 2]>")',
  '.rarely(x => x.coarse(8))',
  '.off(1/16, x => x.gain(0.5))',
];
export const NOTE_MUTATIONS = [
  '.rev()',
  '.jux(rev)',
  '.off(1/8, x => x.add(note(12)))',
  '.ply("<1 2>")',
  '.degradeBy(0.3)',
  '.palindrome()',
  '.iter(4)',
  '.every(4, x => x.add(note(7)))',
  '.sometimesBy(0.25, x => x.add(note(12)))',
  '.lpf(sine.range(400, 4000).slow(4))',
];

export interface Mutation {
  code: string;
  transform: string;
  layer: string;
  /** where the transform went, for highlighting */
  at: number;
}

/** Add a random transformation to the layer under the cursor (offset in the code). */
export function mutate(code: string, cursor: number, rand: () => number = Math.random, avoid?: string): Mutation {
  const ast = parse(code);
  let target: { start: number; end: number; text: string; label: string } | undefined;
  // the smallest stack(...) argument around the cursor
  walk(ast, (n) => {
    if (n.type !== 'CallExpression' || n.callee.type !== 'Identifier' || n.callee.name !== 'stack') return;
    for (const a of n.arguments as Node[]) {
      if (a.start <= cursor && cursor <= a.end && (!target || a.end - a.start < target.end - target.start)) {
        const text = code.slice(a.start, a.end);
        target = { start: a.start, end: a.end, text, label: short(text) };
      }
    }
  });
  if (!target) {
    // a top-level const around the cursor
    for (const st of ast.body as Node[]) {
      if (st.type !== 'VariableDeclaration' || st.start > cursor || st.end < cursor) continue;
      const d = (st.declarations as Node[]).find((x) => x.start <= cursor && cursor <= x.end && x.init);
      if (d) target = { start: d.init.start, end: d.init.end, text: code.slice(d.init.start, d.init.end), label: d.id.name };
    }
  }
  if (!target) {
    const m = model(code);
    target = { start: m.last.start, end: m.last.end, text: code.slice(m.last.start, m.last.end), label: 'the whole pattern' };
  }
  const list = (isDrums(target.text) ? DRUM_MUTATIONS : NOTE_MUTATIONS).filter((t) => t !== avoid);
  const transform = list[Math.floor(rand() * list.length) % list.length];
  return {
    code: code.slice(0, target.end) + transform + code.slice(target.end),
    transform,
    layer: target.label,
    at: target.end,
  };
}

// ---------------------------------------------------------------------------
// arrange() sections, for the bar counter
// ---------------------------------------------------------------------------
export interface Section {
  bars: number;
  name: string;
}

/**
 * The sections of the arrange() that plays, with names from the comments:
 *   arrange(
 *     [8,  stack(kick, hats)],   // intro
 *     [16, stack(...)],          // the tune
 *   )
 * or one line: arrange([4, roll], [4, drop]) -> names "roll", "drop".
 */
export function arrangeSections(code: string): Section[] {
  let m: Model;
  try {
    m = model(code);
  } catch {
    return [];
  }
  if (calleeName(m.last) !== 'arrange') return [];
  const root = rootCall(m.last)!;
  const out: Section[] = [];
  for (const a of root.arguments as Node[]) {
    if (a.type !== 'ArrayExpression' || a.elements.length < 2) return [];
    const [n, pat] = a.elements as Node[];
    if (n.type !== 'Literal' || typeof n.value !== 'number') return [];
    // a comment after this entry on the same line names it
    const lineEnd = code.indexOf('\n', a.end);
    const rest = code.slice(a.end, lineEnd < 0 ? undefined : lineEnd);
    const comment = rest.match(/\/\/\s*(.+?)\s*$/);
    const name = comment ? comment[1] : pat.type === 'Identifier' ? pat.name : `section ${out.length + 1}`;
    out.push({ bars: n.value, name });
  }
  return out;
}

/** Where `cycle` falls in the sections: which one, and how far to the next. */
export function sectionAt(sections: Section[], cycle: number) {
  const total = sections.reduce((s, x) => s + x.bars, 0);
  if (!total) return undefined;
  const pos = ((cycle % total) + total) % total;
  let acc = 0;
  for (let i = 0; i < sections.length; i++) {
    if (pos < acc + sections[i].bars) {
      return {
        index: i,
        section: sections[i],
        next: sections[(i + 1) % sections.length],
        barsLeft: acc + sections[i].bars - pos,
      };
    }
    acc += sections[i].bars;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Tidal channels, for Tidal's own mute / solo
// ---------------------------------------------------------------------------
export function tidalChannels(text: string): number[] {
  const set = new Set<number>();
  for (const m of text.matchAll(/^\s*(?:d(\d+)\b|p\s+(\d+)\b)/gm)) set.add(Number(m[1] ?? m[2]));
  return [...set].sort((a, b) => a - b);
}
