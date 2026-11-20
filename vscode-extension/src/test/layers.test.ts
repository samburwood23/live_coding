import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';
import * as acorn from 'acorn';
import { applyMutes, arrangeSections, listLayers, mutate, sectionAt, setMuted, tidalChannels } from '../layers';
import { parsePatternsJs } from '../core';

const KIT = process.env.KIT_DIR ?? path.join(__dirname, '..', '..', '..');
const parses = (code: string) =>
  acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module', allowAwaitOutsideFunction: true });

const FLOW = `setcps(1)
const kick = s("bd*4")
const bass = note("c2 e2").s("sawtooth")
const lead = n("0 2 4").scale("C4:minor")
arrange(
  [8,  stack(kick, bass)],             // intro
  [16, stack(kick, bass, lead.fast(2))], // the tune
  [4,  stack(lead)],                   // breakdown
)`;

const INLINE = `setcps(1)
stack(
  s("bd*4").bank("RolandTR909"),
  note("<c2 a1>").struct("[~ x]*4").s("supersaw"), // bass
  n("0 2 4 7").scale("C4:minor").s("piano")
).pianoroll()`;

test('lists named and inline layers', () => {
  assert.deepEqual(
    listLayers(FLOW).map((l) => [l.label, l.muted, l.drums]),
    [
      ['kick', false, true],
      ['bass', false, false],
      ['lead', false, false],
    ],
  );
  const inl = listLayers(INLINE);
  assert.equal(inl.length, 3);
  assert.equal(inl[0].drums, true);
  assert.equal(inl[1].drums, false);
});

test('mute / unmute a named layer everywhere it plays, and back', () => {
  const muted = setMuted(FLOW, 'name:bass', true);
  assert.match(muted, /stack\(kick, silence\/\*bass\*\/\)/);
  assert.ok(!/stack\(kick, bass/.test(muted));
  assert.match(muted, /const bass = note/); // the definition stays
  assert.equal(listLayers(muted).find((l) => l.label === 'bass')!.muted, true);
  parses(muted);
  assert.equal(setMuted(muted, 'name:bass', false), FLOW);
});

test('mute an inline layer and back', () => {
  const key = listLayers(INLINE)[1].key;
  const muted = setMuted(INLINE, key, true);
  assert.match(muted, /silence \/\*muted:note\("<c2 a1>"\)/);
  parses(muted);
  const after = listLayers(muted);
  assert.equal(after.filter((l) => l.muted).length, 1);
  assert.equal(setMuted(muted, after.find((l) => l.muted)!.key, false), INLINE);
});

test('solo = everything else muted; unmute all restores', () => {
  const layers = listLayers(FLOW);
  const solo = applyMutes(FLOW, new Set(layers.filter((l) => l.label !== 'lead').map((l) => l.key)));
  assert.deepEqual(listLayers(solo).map((l) => l.muted), [true, true, false]);
  assert.equal(applyMutes(solo, new Set()), FLOW);
});

test('member chains on a muted layer still read: lead.fast(2) -> silence', () => {
  const muted = setMuted(FLOW, 'name:lead', true);
  assert.match(muted, /silence\/\*lead\*\/\.fast\(2\)/);
  parses(muted);
});

test('mutate adds a transform to the layer under the cursor', () => {
  const cursor = INLINE.indexOf('scale("C4');
  let i = 0;
  const m = mutate(INLINE, cursor, () => (i++ * 0.37) % 1);
  assert.equal(m.layer.startsWith('n("0 2 4 7")'), true);
  assert.ok(m.code.includes('.s("piano")' + m.transform));
  parses(m.code);
  const onDrums = mutate(INLINE, INLINE.indexOf('bd*4'), () => 0);
  assert.ok(onDrums.code.includes('.bank("RolandTR909")' + onDrums.transform));
  const onConst = mutate(FLOW, FLOW.indexOf('"0 2 4"'), () => 0.5);
  assert.equal(onConst.layer, 'lead');
  assert.ok(onConst.code.includes('scale("C4:minor")' + onConst.transform));
});

test('arrange sections with names from comments', () => {
  const secs = arrangeSections(FLOW);
  assert.deepEqual(secs, [
    { bars: 8, name: 'intro' },
    { bars: 16, name: 'the tune' },
    { bars: 4, name: 'breakdown' },
  ]);
  const at = sectionAt(secs, 10.5)!;
  assert.equal(at.section.name, 'the tune');
  assert.equal(at.next.name, 'breakdown');
  assert.equal(at.barsLeft, 13.5);
  assert.equal(sectionAt(secs, 28 + 1)!.section.name, 'intro'); // loops
  assert.deepEqual(arrangeSections('arrange([4, roll], [4, drop])').map((s) => s.name), ['roll', 'drop']);
  assert.deepEqual(arrangeSections(INLINE), []);
});

test('tidal channels', () => {
  assert.deepEqual(tidalChannels('d1 $ s "bd"\n  d3 $ s "hh"\n-- d4 nope\nd1 silence\np 2 $ s "x"'), [1, 2, 3]);
});

test("every kit pattern: layers read, mute-all / unmute-all round-trips, mutations parse", { skip: !fs.existsSync(path.join(KIT, 'patterns.js')) }, () => {
  const pats = parsePatternsJs(fs.readFileSync(path.join(KIT, 'patterns.js'), 'utf8'));
  let withLayers = 0;
  for (const p of pats) {
    const layers = listLayers(p.code);
    if (layers.length > 1) withLayers++;
    const all = applyMutes(p.code, new Set(layers.map((l) => l.key)));
    parses(all);
    assert.ok(listLayers(all).every((l) => l.muted), `${p.name}: not all muted`);
    assert.equal(applyMutes(all, new Set()), p.code, `${p.name}: unmute didn't restore`);
    const mid = Math.floor(p.code.length * 0.7);
    parses(mutate(p.code, mid, Math.random).code);
  }
  assert.ok(withLayers > 60, `only ${withLayers} patterns had layers`);
  const flow = pats.find((p) => p.name.startsWith('29 '))!;
  assert.deepEqual(arrangeSections(flow.code).map((s) => s.bars), [8, 8, 16, 8, 8, 4, 16]);
});
