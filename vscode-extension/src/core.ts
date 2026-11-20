// Pure helpers with no VS Code dependency, so they can be unit tested with node --test.
import * as vm from 'vm';

// ---------------------------------------------------------------------------
// Tidal blocks
// ---------------------------------------------------------------------------

export interface LineRange {
  start: number; // first line, inclusive
  end: number; // last line, inclusive
}

const isBlank = (s: string) => s.trim().length === 0;

/** The paragraph (run of non-blank lines) around `line`, or undefined on a blank line. */
export function findBlock(lines: string[], line: number): LineRange | undefined {
  if (line < 0 || line >= lines.length || isBlank(lines[line])) return undefined;
  let start = line;
  let end = line;
  while (start > 0 && !isBlank(lines[start - 1])) start--;
  while (end < lines.length - 1 && !isBlank(lines[end + 1])) end++;
  return { start, end };
}

/** True if the text has nothing for GHCi to run (only comments / whitespace). */
export function isOnlyComments(code: string): boolean {
  const noBlock = code.replace(/\{-[\s\S]*?-\}/g, '');
  return noBlock.split('\n').every((l) => isBlank(l) || l.trim().startsWith('--'));
}

/** Turn a chunk of Tidal code into what we write to GHCi's stdin. */
export function toGhciInput(code: string): string {
  const lines = code
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .filter((l) => !isBlank(l));
  if (lines.length === 0) return '';
  // GHCi commands (:set, :t, :script ...) can't go inside a :{ :} block.
  if (lines.length === 1 || lines.every((l) => l.startsWith(':'))) return lines.join('\n') + '\n';
  return ':{\n' + lines.join('\n') + '\n:}\n';
}

// ---------------------------------------------------------------------------
// Keeping Strudel highlight offsets in step with edits made after an eval
// ---------------------------------------------------------------------------

export interface TextChange {
  rangeOffset: number;
  rangeLength: number;
  textLength: number;
}

/** Map a character offset through a list of edits (applied in order). Returns -1 if the text under it was deleted. */
export function mapOffset(offset: number, changes: TextChange[], assoc: 'start' | 'end' = 'start'): number {
  let o = offset;
  for (const c of changes) {
    const delEnd = c.rangeOffset + c.rangeLength;
    if (o < c.rangeOffset) continue;
    if (o === c.rangeOffset) {
      // An end offset sits just before the edit, so it doesn't move.
      // A start offset moves past a pure insertion, but its own text is gone if this was a deletion.
      if (assoc === 'end') continue;
      if (c.rangeLength === 0) {
        o += c.textLength;
        continue;
      }
      return -1;
    }
    if (o >= delEnd) {
      o += c.textLength - c.rangeLength;
    } else {
      return -1; // inside a replaced range
    }
  }
  return o;
}

/** Map [start, end) ranges through edits, dropping ones whose text was edited. */
export function mapRanges(ranges: [number, number][], changes: TextChange[]): [number, number][] {
  if (changes.length === 0) return ranges;
  const out: [number, number][] = [];
  for (const [s, e] of ranges) {
    const ms = mapOffset(s, changes, 'start');
    const me = mapOffset(e, changes, 'end');
    if (ms < 0 || me < 0 || me <= ms) continue;
    // if the edit landed inside the step, its length changed: drop it
    if (me - ms !== e - s) continue;
    out.push([ms, me]);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Kit patterns
// ---------------------------------------------------------------------------

export interface StrudelPattern {
  name: string;
  about: string;
  code: string;
}

/**
 * Read `window.PATTERNS` out of the kit's patterns.js.
 * Runs the file in a bare vm context (no require, no process), with a timeout.
 * Only call this for trusted workspaces.
 */
export function parsePatternsJs(source: string): StrudelPattern[] {
  const sandbox: { window: { PATTERNS?: unknown } } = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { timeout: 1000, filename: 'patterns.js' });
  const list = sandbox.window.PATTERNS;
  if (!Array.isArray(list)) return [];
  return list
    .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object' && typeof (p as any).code === 'string')
    .map((p, i) => ({
      name: typeof p.name === 'string' ? p.name : `Pattern ${i + 1}`,
      about: typeof p.about === 'string' ? p.about : '',
      code: p.code as string,
    }));
}

export interface TidalSection {
  title: string;
  line: number; // line of the title text
}

/**
 * Sections in a .tidal file. A section is a comment line framed by `-- ====` rules:
 *
 *   -- =====================
 *   -- 1. AMEN ROLLER: ...
 *   -- =====================
 */
export function parseTidalSections(text: string): TidalSection[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const rule = /^--\s*[=\-]{8,}\s*$/;
  const out: TidalSection[] = [];
  for (let i = 1; i < lines.length - 1; i++) {
    if (rule.test(lines[i - 1].trim()) && rule.test(lines[i + 1].trim()) && /^--\s*\S/.test(lines[i].trim()) && !rule.test(lines[i].trim())) {
      out.push({ title: lines[i].trim().replace(/^--\s*/, ''), line: i });
    }
  }
  return out;
}

/** First line after `fromLine` that starts a block of runnable code (not just comments). */
export function firstCodeBlock(lines: string[], fromLine: number, toLine = lines.length - 1): LineRange | undefined {
  for (let i = fromLine; i <= toLine; i++) {
    const b = findBlock(lines, i);
    if (!b) continue;
    const code = lines.slice(b.start, b.end + 1).join('\n');
    if (!isOnlyComments(code)) return b;
    i = b.end;
  }
  return undefined;
}

/** Strip ANSI colour codes from GHCi / sclang output. */
export function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
}

/** Does a chunk of GHCi output look like an error? */
export function looksLikeGhciError(s: string): boolean {
  return /<interactive>:\d+:\d+: error|^\s*error:|\*\*\* Exception|parse error|Variable not in scope|Couldn't match/m.test(stripAnsi(s));
}
