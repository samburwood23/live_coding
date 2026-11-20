# Algorave Kit for VS Code

Live code **Strudel** and **TidalCycles** from VS Code, with your kit's patterns in the sidebar,
visuals beside the code and a mode for playing out.

![Projector view: pattern 60 with the pianoroll behind the code and the playing steps outlined](media/projector.png)

## What it does

| | Strudel (`.strudel`, `.str`) | Tidal (`.tidal`) |
| --- | --- | --- |
| `Ctrl+Enter` (`Cmd+Enter`) | Play / update the whole file | Run the block under the cursor (or the selection) |
| `Shift+Enter` | Same as Ctrl+Enter | Run the current line |
| `Ctrl+.` (`Cmd+.`) | Hush everything | Hush everything |
| `Ctrl+Alt+H` | Hush from anywhere | Hush from anywhere |
| `Ctrl+Alt+P` | Performance mode on / off | Performance mode on / off |
| `Ctrl+Alt+V` | Projector view on / off | n/a |

**Strudel** plays inside VS Code, in a panel that opens beside your code. If the panel has no
sound or no graphics on your machine, run **Algorave: Test Sound & Graphics in VS Code**: it plays a
beep, checks for WebGL and tells you what to fix (the Snap and Flatpak builds of VS Code often cut
webviews off from the sound card and GPU; the `.deb` from code.visualstudio.com doesn't). Or set
`algorave.strudel.engine` to `browser` to play through a browser tab that VS Code drives. It uses the same `@strudel/repl@1.3.0` as
the kit's `index.html`, so everything in `patterns.js` works: samples, `.pianoroll()`, `.punchcard()`,
`.scope()`, `.spiral()`, `_pianoroll()` inline widgets, and Hydra with `initHydra()` / `H()`.
While it plays, the mini-notation steps that are sounding get outlined in *your* editor, and they
stay in place as you type.

**Tidal** starts GHCi with your kit's `tidal/BootTidal.hs` the first time you evaluate (or from
*Algorave: Boot Tidal*). Output goes to the **Tidal** output panel, which pops up on errors without
taking focus. If you turn on `algorave.tidal.startSuperDirt`, it also launches `sclang` with
`tidal/superdirt_startup.scd`.

**Kit sidebar** (the wave icon in the activity bar) lists the Strudel patterns from `patterns.js`
and the numbered sections of each `.tidal` set. Click to open, ▶ to open and play. It reloads when
you edit `patterns.js`. *Algorave: Open Pattern from Kit…* does the same from the command palette.

**Performance mode** sets Strudel and Tidal files to a big font (22 by default), enters Zen Mode and
opens the visuals. Turning it off puts your font settings back.

If the panel has no WebGL, Hydra patterns still play: the music runs and the Hydra part is skipped,
with a note in the status bar.

**Projector view** shows the code that's playing over the visuals, with the steps lighting up, like
the kit's ⛶ Projector button. *Algorave: Put Visuals on the Projector Screen* moves the panel into
its own window to drag onto the projector. (With the browser engine, drag the tab there and press
**F** for fullscreen.)

## Playing live

| Key | What it does |
| --- | --- |
| `Ctrl+Shift+Enter` | **Queue**: evaluate the file on the next phrase line instead of straight away. The swap is exact: the old code plays up to the line, the new code from it, and a new `setcps()` changes the tempo on the line too. The ⏱ button on a pattern in the sidebar does the same. |
| `Ctrl+Alt+C` | Cancel a queued swap |
| `Ctrl+Alt+D` | **Drop**: filter everything up, take the kick and bass out and roll a snare for 4 bars, then drop it all back in on the next 8-bar line |
| `Ctrl+Alt+M` | **Mute / unmute** layers: tick them in a list |
| `Ctrl+Alt+1` … `9` | Mute / unmute layer 1-9 directly (the numbers from the list) |
| `Ctrl+Alt+S` | **Solo** a layer: everything else gets muted |
| `Ctrl+Alt+U` | Unmute everything |
| `Ctrl+Alt+R` | **Mutate**: add a random transformation (`rev`, `jux(rev)`, `ply`, `off`, `degradeBy`, `chunk`…) to the layer under the cursor and play it. `Ctrl+Z`, `Ctrl+Enter` takes it back |
| `Ctrl+Alt+N` / `Ctrl+Alt+B` | **Set list**: queue the next / previous item |

Phrase lines are every 4 bars (`algorave.launch.quantize`); the drop's length and landing are
`algorave.drop.buildBars` and `algorave.drop.landEvery`. One cycle is one bar in all the kit's patterns.

**Muting is in the code**, so the audience sees it: a named layer becomes `silence/*bass*/` everywhere
it plays (its `const` stays), and an unnamed layer of a `stack()` becomes `silence /*muted:…*/`.
Unmute puts them back exactly. In `.tidal` files the same keys use Tidal's own `mute 2` / `solo 1`
on the `d1`…`d16` channels.

**The bar counter** in the status bar shows bar.beat, and for patterns that end in `arrange()` the
section you're in, named from the comment on its line, and how many bars until the next one:
`⌚ 37.2 · the tune 3/7 · ▸ vocal hook in 4`. Queued swaps and drops count down there too.

**The set list** (a view under Patterns) is your running order, saved as `setlist.json` next to
`patterns.js` so it's versioned with the kit. Right-click a pattern → *Add to Set List*, or add the
file you're editing; each item gets a note that only you see (in the sidebar and the status bar,
never on the projector). `Ctrl+Alt+N` opens the next item and queues it on the next phrase; the
status bar shows where you are and the note.

Queue, drop, the bar counter and the mutator are for Strudel. Tidal already changes on the next cycle.

## First run

1. Install the prebuilt package in this folder: `code --install-extension vscode-extension/algorave-kit-0.4.0.vsix`
   (or build it yourself, see *Develop*)
2. Open your `live_coding` folder. The sidebar finds `patterns.js` and `tidal/` by itself
   (or set `algorave.kitPath`).
3. Open a pattern, press `Ctrl+Enter`. The Strudel panel opens beside the code; if it says
   **Click here once to switch on sound**, click it (web audio only starts after a click).
4. No sound? Run **Algorave: Test Sound & Graphics in VS Code**.

You need internet for Strudel the first time a session loads samples, same as the web kit.

## Settings

| Setting | Default | |
| --- | --- | --- |
| `algorave.kitPath` | auto | Folder with `patterns.js` / `tidal/` |
| `algorave.launch.quantize` | `4` | Queued swaps land on the next multiple of this many bars |
| `algorave.drop.buildBars` / `landEvery` | `4` / `8` | Drop build length, and the bar line it lands on |
| `algorave.strudel.engine` | `panel` | `panel` inside VS Code, or a `browser` tab |
| `algorave.strudel.replUrl` | unpkg `@strudel/repl@1.3.0` | Pin the Strudel version |
| `algorave.strudel.highlight` | `true` | Outline playing steps in the editor |
| `algorave.strudel.openPatternIn` | `newTab` | Or `activeEditor` to swap the code in the current tab |
| `algorave.flash` | `true` | Flash code when it's evaluated |
| `algorave.tidal.ghciPath` / `ghciArgs` | `ghci` | e.g. `stack` + `["exec","--package","tidal","--","ghci"]` |
| `algorave.tidal.bootFile` | kit, then bundled | Your `BootTidal.hs` |
| `algorave.tidal.startSuperDirt` | `false` | Launch `sclang` too |
| `algorave.performance.fontSize` | `22` | |
| `algorave.performance.zenMode` | `true` | |
| `algorave.performance.showVisuals` | `true` | |
| `algorave.performance.projector` | `false` | Start the visuals in projector view |

Colours for the step outline and the flash are themeable: `algorave.activeStep`, `algorave.flashBackground`.

## Notes

- If you also have the official TidalCycles extension, both will want `Ctrl+Enter` in `.tidal`
  files. Disable one of them for the workspace.
- Booting Tidal and reading `patterns.js` run code from the workspace, so they need a trusted workspace.
  Strudel playback works anywhere.
- Strudel evaluates the whole file on each `Ctrl+Enter`, the same as the web REPL. Use `$:` or
  `stack()` for parts and comment lines out (`Ctrl+/`) to mute them.

## Develop

```bash
cd vscode-extension
npm install
npm test          # compiles + unit tests, including parsing this repo's patterns.js and .tidal sets
npm run package   # builds the .vsix
```

Press F5 in VS Code to run it in an Extension Development Host.
