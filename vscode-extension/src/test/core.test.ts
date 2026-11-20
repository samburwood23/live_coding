import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import {
  findBlock,
  firstCodeBlock,
  isOnlyComments,
  looksLikeGhciError,
  mapOffset,
  mapRanges,
  parsePatternsJs,
  parseTidalSections,
  toGhciInput,
} from '../core';

// out/test -> vscode-extension -> the kit repo root
const KIT = process.env.KIT_DIR ?? path.join(__dirname, '..', '..', '..');

test('findBlock picks the paragraph around the cursor', () => {
  const lines = ['d1 $ s "bd"', '', 'd2 $ s "hh*8"', '  # gain 0.8', '', 'hush'];
  assert.deepEqual(findBlock(lines, 0), { start: 0, end: 0 });
  assert.deepEqual(findBlock(lines, 3), { start: 2, end: 3 });
  assert.equal(findBlock(lines, 1), undefined);
  assert.deepEqual(findBlock(lines, 5), { start: 5, end: 5 });
});

test('toGhciInput wraps multi-line code and leaves one-liners alone', () => {
  assert.equal(toGhciInput('hush'), 'hush\n');
  assert.equal(toGhciInput('d1 $ s "bd"\n  # gain 1  \n'), ':{\nd1 $ s "bd"\n  # gain 1\n:}\n');
  assert.equal(toGhciInput(':set prompt ""\n:t d1'), ':set prompt ""\n:t d1\n');
  assert.equal(toGhciInput('\n  \n'), '');
  assert.equal(toGhciInput('a\r\nb'), ':{\na\nb\n:}\n');
});

test('isOnlyComments', () => {
  assert.ok(isOnlyComments('-- hello\n  -- there'));
  assert.ok(isOnlyComments('{- block\n comment -}'));
  assert.ok(!isOnlyComments('-- hi\nd1 $ s "bd"'));
});

test('mapOffset follows inserts and deletes', () => {
  // insert 3 chars at 5
  const ins = [{ rangeOffset: 5, rangeLength: 0, textLength: 3 }];
  assert.equal(mapOffset(2, ins), 2);
  assert.equal(mapOffset(5, ins, 'start'), 8);
  assert.equal(mapOffset(5, ins, 'end'), 5);
  assert.equal(mapOffset(9, ins), 12);
  // delete 4 chars at 10
  const del = [{ rangeOffset: 10, rangeLength: 4, textLength: 0 }];
  assert.equal(mapOffset(12, del), -1);
  assert.equal(mapOffset(20, del), 16);
  assert.equal(mapOffset(10, del, 'end'), 10);
});

test('mapRanges keeps untouched steps and drops edited ones', () => {
  const ranges: [number, number][] = [
    [3, 5],
    [10, 12],
    [20, 22],
  ];
  // typed 2 chars at offset 11, inside the 2nd step
  const changes = [{ rangeOffset: 11, rangeLength: 0, textLength: 2 }];
  assert.deepEqual(mapRanges(ranges, changes), [
    [3, 5],
    [22, 24],
  ]);
  // two edits in one event, VS Code sends them highest offset first
  const multi = [
    { rangeOffset: 15, rangeLength: 0, textLength: 1 },
    { rangeOffset: 0, rangeLength: 0, textLength: 1 },
  ];
  assert.deepEqual(mapRanges(ranges, multi), [
    [4, 6],
    [11, 13],
    [22, 24],
  ]);
});

test('parseTidalSections finds the framed headings', () => {
  const t = ['-- intro', '-- =========', '-- 1. AMEN ROLLER', '-- =========', '', 'd1 $ s "bd"'].join('\n');
  assert.deepEqual(parseTidalSections(t), [{ title: '1. AMEN ROLLER', line: 2 }]);
});

test('firstCodeBlock skips comment paragraphs', () => {
  const lines = ['-- 1. X', '-- ====', '', '-- explain', '-- more', '', 'd1 $ s "bd"', '  # cut 1'];
  assert.deepEqual(firstCodeBlock(lines, 2), { start: 6, end: 7 });
});

test('looksLikeGhciError', () => {
  assert.ok(looksLikeGhciError('<interactive>:3:6: error:\n    Variable not in scope: sd'));
  assert.ok(!looksLikeGhciError('tidal> '));
});

test("parses the real kit's patterns.js", { skip: !fs.existsSync(path.join(KIT, 'patterns.js')) }, () => {
  const pats = parsePatternsJs(fs.readFileSync(path.join(KIT, 'patterns.js'), 'utf8'));
  assert.ok(pats.length >= 70, `got ${pats.length}`);
  assert.match(pats[0].name, /First beat/);
  assert.ok(pats.every((p) => p.code.length > 0));
});

test("parses the real kit's .tidal sections", { skip: !fs.existsSync(path.join(KIT, 'tidal')) }, () => {
  for (const f of ['jungle.tidal', 'makina.tidal']) {
    const text = fs.readFileSync(path.join(KIT, 'tidal', f), 'utf8');
    const secs = parseTidalSections(text);
    assert.ok(secs.length > 2, `${f}: ${secs.length} sections`);
    const lines = text.split('\n');
    for (const s of secs) {
      const b = firstCodeBlock(lines, s.line + 2);
      assert.ok(b, `${f}: no code after "${s.title}"`);
      assert.ok(!isOnlyComments(lines.slice(b!.start, b!.end + 1).join('\n')));
    }
  }
});

test('patterns.js sandbox has no require/process', () => {
  assert.throws(() => parsePatternsJs('require("fs")'));
  assert.throws(() => parsePatternsJs('process.exit(1)'));
});
