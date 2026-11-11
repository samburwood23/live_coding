# Algorave Kit

A small, browser-based live coding setup for making algorave-style music. It uses
[Strudel](https://strudel.cc), the JavaScript version of
[TidalCycles](https://tidalcycles.org). The kit has an editor, a play/stop
toolbar, a projector mode and 73 starter patterns: basics first, then a set of jungle styles
(amen rollers, ragga, darkside, liquid, jump-up, drill'n'bass), then a makina
flow and seven North East "New Monkey" flows. The makina patterns build one tune
section by section, from kick and hats to the piano riff, a breakdown and a
snare-roll drop; **24 · Makina: full flow** plays the whole arrangement by itself.
The New Monkey patterns do the same for makina's bouncier Sunderland cousin: an
octave-bouncing offbeat bass, a hands-up trance lead over Am - F - C - G, a
pitched-up vocal hook and skippy stabs, ending in **29 · New Monkey: full flow**.
**New Monkey II** (30-34) is a second, faster tune in F# minor: a plucky
pitch-dropping bass, a piano riff that trades phrases with a hoover and a
kick-roll build, ending in **34 · New Monkey II: full flow**.
Five more follow the same shape (four build-up patterns, then a full flow):

| Patterns | Tune | Key, tempo | What makes it different |
| --- | --- | --- | --- |
| 35-39 | New Monkey III, "Sunrise" | D minor, 165 BPM | Gated trance arp that slowly opens, 3-3-2 lead hook, warm pads |
| 40-44 | New Monkey IV, "Hoover Stomper" | G minor, 170 BPM | Driven kick, reese bass, orchestra-hit stabs, hoover riff, rave siren |
| 45-49 | New Monkey V, "Bells" | B minor, 174 BPM | Glockenspiel and music-box riff, offbeat pianos, kick-roll build |
| 50-54 | New Monkey VI, "Happy Monkey" | E major, 170 BPM | Skippy happy-hardcore pianos, squelchy lead, high vocal-style hook |
| 55-59 | New Monkey VII, "Last Tune" | Bb minor, 176 BPM | Acid bass, 3-3-2 lead with octave jumps and stutters, snare + kick roll |

## Visuals

Patterns **60-73** add visuals that move with the music:

| Pattern | What it shows |
| --- | --- |
| 60 · pianoroll | `.pianoroll()`: every note scrolls past behind the code, coloured per layer with `.color()` |
| 61 · punchcard & spiral | `.punchcard()` (drums included) and `.spiral()` |
| 62 · inline scopes | `._punchcard()`, `._scope()`, `._pianoroll()`: small drawings under each line of code |
| 63 · Hydra basics | [Hydra](https://hydra.ojack.xyz) video synthesis: `osc` → `kaleid` → `modulate` → `.out()` |
| 64 · Hydra on the beat | `H("...")` turns a pattern into a Hydra value: pulses on the kick, a shape and colour per chord |
| 65 · pianoroll through Hydra | `initHydra({ feedStrudel: 1 })` puts the pianoroll into Hydra so it gets kaleidoscoped |
| 66 · strobe & tunnel | A feedback tunnel zooming on the kick, with flashes on the claps |
| 67 · full flow + Hydra | New Monkey flow 29 with a Hydra scene per section, switching on the same bars |
| 68 · New Monkey II + Hydra | Voronoi cells that multiply and warp, red for the riff, blue for the breakdown |
| 69 · New Monkey III + Hydra | "Sunrise": a red dot that grows into a big yellow sun with spreading rays |
| 70 · New Monkey IV + Hydra | Dark red noise twisting harder each section, white hits on the 3-3-2 stabs |
| 71 · New Monkey V + Hydra | A grid of icy stars that fills up and spins faster |
| 72 · New Monkey VI + Hydra | A rainbow kaleidoscope that hops on the offbeats with the bass |
| 73 · New Monkey VII + Hydra | An acid swirl that follows the bass filter's sweep and goes blocky in the breakdown |

In 67-73 each Hydra setting holds one value per section of the tune
(`H("<0.3@8 1@16 ...>")`, using the same bar counts as `arrange()`), so the
visuals change scene exactly when the music does. The kick pulse only appears
in sections that have a kick.

Add `.pianoroll()`, `.punchcard()`, `.spiral()` or `.scope()` to the end of any
pattern, or start one with `await initHydra()`, to put visuals on your own code.

**⛶ Projector** (top right) goes full screen with just the code over the
visuals, at a size people can read on a big screen. Press **Esc** to come back.

Want the full native setup? **[`tidal/`](tidal/README.md)** has a TidalCycles +
SuperCollider install guide for macOS, Linux and Windows (plus a
[one-command Ubuntu installer](tidal/INSTALL-UBUNTU.md)), a SuperDirt startup file
and a jungle set written in Tidal.

## Run it locally

You only need a browser and any static file server. You don't need to install a
build step or audio software.

```bash
git clone https://github.com/samburwood23/live_coding.git
```

```bash
cd live_coding
```

Start a local server with Python, which is already installed on macOS and most Linux systems:

```bash
python3 -m http.server 8000
```

…or with Node:

```bash
npx serve -l 8000
```

Then open <http://localhost:8000> in Chrome, Firefox or Edge.

> Opening `index.html` directly from disk (`file://`) can also work. A local
> server is more reliable, though, because browsers restrict some audio features on `file://` pages.

The first time you load the page, it downloads the Strudel engine from unpkg and samples
from GitHub, so you need an internet connection.

## Playing

| Key | Action |
| --- | --- |
| `Ctrl` + `Enter` (`Cmd` + `Enter` on Mac) | Play, or apply your edits without stopping |
| `Ctrl` + `.` | Stop |
| `Ctrl` + `/` | Comment a line in or out (good for muting layers) |

The live coding loop is to **edit while it plays, then press `Ctrl+Enter`**. The
change lands on the next cycle, so the music never stops.

## Mini-notation cheat sheet

Everything inside `"quotes"` is mini-notation, and each pattern fits into one cycle.

| Syntax | Meaning | Example |
| --- | --- | --- |
| `a b c` | Divide the cycle into equal steps | `s("bd sd hh")` |
| `~` | Rest | `s("bd ~ sd ~")` |
| `*n` | Repeat (speed up) | `s("hh*8")` |
| `[a b]` | Group steps into one step | `s("bd [sd sd]")` |
| `<a b>` | Alternate, playing one per cycle | `s("bd <sd cp>")` |
| `a, b` | Play patterns at the same time | `s("bd*4, hh*8")` |
| `(k,n)` | Euclidean rhythm (k hits in n steps) | `s("bd(3,8)")` |
| `?` | Randomly drop the step | `s("hh*16?")` |
| `a:2` | Pick sample number 2 | `s("bd:2")` |

## Useful functions

- **Sound**: `s()`, `n()`, `note()`, `.bank("RolandTR909")`, `.scale("C:minor")`
- **Tone**: `.lpf()`, `.hpf()`, `.lpq()`, `.room()`, `.delay()`, `.gain()`, `.pan()`
- **Time**: `.fast()`, `.slow()`, `setcps()`, `.swingBy()`
- **Change over time**: `.every(4, x => x.rev())`, `.sometimes()`, `.jux()`, `.degradeBy()`
- **Modulation**: `sine`, `saw`, `perlin`, `rand`, used as `.lpf(sine.range(200, 2000).slow(8))`

## Adding your own patterns

Add an entry to the end of `patterns.js`:

```js
{
  name: "25 · My tune",
  about: "One-line description",
  code: `s("bd*4, hh*8")`,
},
```

Reload the page and your pattern appears in the sidebar.

## Going further

- [Strudel workshop](https://strudel.cc/workshop/getting-started/): the best next step
- [strudel.cc](https://strudel.cc): the full online REPL, where you can paste any pattern from this kit
- **Native setups**, if you want to go deeper:
  - TidalCycles with SuperDirt: see [`tidal/README.md`](tidal/README.md)
  - [Sonic Pi](https://sonic-pi.net): a Ruby-based app with a friendly built-in tutorial
- Find an event or stream at [algorave.com](https://algorave.com) and
  [toplap.org](https://toplap.org)

Strudel is AGPL-3.0 licensed. This kit loads it from a CDN; it doesn't bundle it.
