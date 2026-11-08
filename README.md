# Algorave Kit

A small, browser-based live coding setup for making algorave-style music. It uses
[Strudel](https://strudel.cc), the JavaScript version of
[TidalCycles](https://tidalcycles.org). The kit has an editor, a play/stop
toolbar and 17 starter patterns: basics first, then a set of jungle styles
(amen rollers, ragga, darkside, liquid, jump-up, drill'n'bass).

Want the full native setup? **[`tidal/`](tidal/README.md)** has a TidalCycles +
SuperCollider install guide for macOS, Linux and Windows, a SuperDirt startup file
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
  name: "11 · My tune",
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
