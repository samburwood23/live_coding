# AlgoraveKit for SuperCollider

A Quark that adds the kit's live tools to SuperCollider, so you can perform
in sclang the same way you would in the VS Code extension:

- **Changes land on the line.** Every layer is a `Pdef` quantised to the
  next 4-bar phrase, counted from when you started. Tempo changes wait for
  the next bar.
- **Mute, solo, toggle by name.** These are instant and stay in time, because
  they filter events rather than stopping and restarting patterns.
- **Drop.** A filter build and a snare roll, then everything comes back on
  the next 8-bar line.
- **Mutator.** Random twists you can stack: echo, crush, accents, octave
  jumps, degrade.
- **Set list.** Named scenes you step through with `Algo.next`.
- **Bar counter.** A big window showing bar.beat, the next change, the scene
  and what's playing.
- **Strudel-style writing.** Mini-notation strings straight to SuperDirt
  (`"bd*4"`, `"<bd(3,8) bd(5,8,2)>"`, `"[c4,eb4,g4]"`), plus helpers for notes,
  scale degrees, offbeats, chords per bar and sliced breaks.

It plays through SuperDirt, so the Tidal sounds (Dirt-Samples, `superpiano`,
`supersaw`, `superhoover`...) all work. It also runs without SuperDirt: plain
event patterns play through the default synth.

## Install

1. Install SuperDirt if you haven't already (see [`tidal/README.md`](../tidal/README.md)).
2. In SuperCollider, run this once, using your own path to this repo:
   ```supercollider
   Quarks.install("/path/to/live_coding/supercollider/AlgoraveKit");
   ```
3. Recompile: Language > Recompile Class Library (Ctrl+Shift+L).

## Play

1. Start SuperDirt: run [`tidal/superdirt_startup.scd`](../tidal/superdirt_startup.scd).
2. Open [`examples/quickstart.scd`](AlgoraveKit/examples/quickstart.scd) and evaluate it a line at a time.

```supercollider
Algo.start(175);                 // BPM; the bar counter opens
Algo(\kick, "hardkick*4");       // a layer: lands on the next 4-bar line
Algo(\hats, "[~ ho]*4");
Algo(\bass, (Pbind(\s, \supersaw, \legato, 0.5) <> "c2 ab1 bb1 g1".offbeats.notes).dirt(1));

Algo.mute(\kick);  Algo.solo(\bass);  Algo.unmuteAll;
Algo.mutate(\bass);
Algo.drop;
Algo.bpm = 180;
```

Re-evaluate a line to change a layer. The new version lands on the next line.

## The sets

Two Tidal sets have been rewritten as scenes. Evaluate the big block, then
call `Algo.next` to move through the sections:

| File | Set | Scenes |
| --- | --- | --- |
| [`examples/makina.scd`](AlgoraveKit/examples/makina.scd) | `makina.tidal`, 175 BPM | intro, groove, riff, hoover, breakdown, drop, peak |
| [`examples/jungle.scd`](AlgoraveKit/examples/jungle.scd) | `jungle.tidal`, 165 BPM | break, edit, ragga, darkside, liquid, jump-up, drill'n'bass |

## Reference

**Writing**

| Code | Gives |
| --- | --- |
| `"bd*4 [~ sn:3]".mini` | sound events (`s`, `n`) |
| `"c2 [eb2 g2]".notes` | note events. `c4` = 60, a bare name is octave 3, a number is MIDI |
| `"0 2 4 <7 6>".degrees(Scale.minor, 60)` | scale degrees from a root |
| `"c2 ab1".offbeats` | one note per bar, on the offbeats: `"<[[~ c2]*4] [[~ ab1]*4]>"` |
| `"[c4,eb4,g4] [ab3,c4,eb4]".perBar("x ~ ~ x ~ ~ x ~")` | one chord per bar, in a rhythm |
| `"0 1 2 3".splice(16, \breaks165)` | break slices, stretched to fit the step |
| `pattern.dirt(orbit)` | sends a pattern to SuperDirt. Put it last |

A string passed to `Algo(\name, ...)` is treated as `.mini.dirt`. Anything a
`Pbind` can do goes in front with `<>`. Mini-notation supports `~ [ ] < > , * / ! @ ? (k,n,r)` and `:n`.
`\legato` works with SuperDirt synths (sustain = step length × legato).

**Live**

| Code | Does |
| --- | --- |
| `Algo.start(bpm, phrase)` | start the clock (bar 1 = now) |
| `Algo(\name, pattern)` | add or replace a layer on the next line |
| `Algo.only(\a, \b)` / `Algo.stopLayer(\a)` / `Algo.stop` | stop layers |
| `Algo.mute` / `unmute` / `toggle` / `solo` / `unmuteAll` | instant mixer |
| `Algo.mutate(\a)` / `Algo.unmutate(\a)` | random twists. `unmutate` with no name clears all |
| `Algo.drop(buildBars, landEvery)` | build and roll; defaults to 4 and 8 |
| `Algo.bpm = 180` / `Algo.phrase = 8` | tempo on the next bar / line length |
| `Algo.scene(\name, "note", { ... })` | add a scene |
| `Algo.next` / `prev` / `go(\name)` / `setList` | step through scenes |
| `Algo.bar` / `Algo.status` / `Algo.counter` | where you are |
| `Algo.dropMutes = [\kick, \bass]` | layers that cut out during the build |
| `Algo.announce = true` | print bar changes in the post window |

## Tests

These run headless (`sclang tests/test_mini.scd`):

- `test_mini.scd`: the parser and timing
- `test_helpers.scd`: the writing helpers
- `test_algo.scd`: changes landing on the line, mute, drop, scenes. Runs at 600 BPM with a logging event type.

Both sets were also run with SuperDirt, scene by scene, and checked for errors and silence.
