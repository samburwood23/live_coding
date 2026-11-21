# Changelog

## 0.7.0
- Removed the Claude integration: the Anthropic API option, the API key command and Connect Claude Code.
  The co-performer runs on GitHub Copilot only; commands and settings are now `algorave.ai.*`.

## 0.6.0
- The co-performer (Ask / Jam) now uses GitHub Copilot through VS Code by default, so it works with no API key
  and on the free Copilot plan. The Claude API is still there with `algorave.agent.provider: "anthropic"`.

## 0.5.1
- Fix "Position N is out of range" in the Strudel panel after Download Kit for Offline: each pattern is
  now put in the panel's editor while it's read, and your code is put back afterwards.

## 0.5.0
- Offline: a disk cache for everything Strudel downloads, and **Download Kit for Offline** to fetch every
  sound the kit uses before a gig.
- Claude co-performer: **Ask Claude** (Ctrl+Alt+A) changes the music on request; **Jam** (Ctrl+Alt+J) makes a
  change every 16 bars. Uses your Anthropic API key from VS Code's secret storage.
- MCP server with tools for agents (state, code, play, queue, mute/solo, drop, mutate, set list, Tidal), for
  Claude Code (**Connect Claude Code**) and VS Code's agent mode.
- Needs VS Code 1.101 or newer.

## 0.4.0
- Queue (Ctrl+Shift+Enter, ⏱ in the sidebar): swap to new code exactly on the next 4-bar line, tempo included.
- Drop (Ctrl+Alt+D): filter up, kick and bass out, snare roll, drop on the next 8-bar line.
- Mute / solo layers by name (Ctrl+Alt+M / S / U, Ctrl+Alt+1-9), written into the code; Tidal mute / solo in .tidal files.
- Mutator (Ctrl+Alt+R): a random transformation on the layer under the cursor.
- Bar counter with arrange() sections and countdowns.
- Set list view (setlist.json) with private notes; Ctrl+Alt+N / B queue the next / previous item.

## 0.3.1
- Reset the drawing canvas before each run: after a spiral, a pianoroll's playhead was drawn as a fat bar,
  and after a Hydra pattern using feedStrudel the pianoroll stayed hidden.

## 0.3.0
- Strudel plays inside VS Code again by default (`algorave.strudel.engine`: `panel`); the browser is the fallback.
- New **Algorave: Test Sound & Graphics in VS Code**: plays a beep, checks audio and WebGL, and says what to fix
  (Snap / Flatpak builds of VS Code, or switch to the browser engine).
- Hydra patterns no longer stop the music when the panel has no WebGL: the Hydra part is skipped with a notice.

## 0.2.1
- Hydra is cleared when you play a pattern that doesn't use it, so the last scene doesn't stay on screen.

## 0.2.0
- Strudel now runs in your web browser by default (`algorave.strudel.engine`: `browser`). The VS Code
  panel engine had no WebGL (so no Hydra) and no audio on Snap/Flatpak builds of VS Code.
- Browser engine: one-click start, F / ⛶ for fullscreen, opening a new tab takes over from the old one.
- Clearer error when Hydra can't get WebGL in the panel engine.

## 0.1.0
- Strudel engine in a VS Code panel: Ctrl+Enter / Ctrl+., live step highlighting in your file, pianoroll / scope / Hydra visuals, projector view.
- Tidal: GHCi with your kit's BootTidal.hs, block and line eval, hush, optional SuperDirt launch.
- Kit sidebar: the 73 Strudel patterns from patterns.js and the sections of each .tidal set.
- Performance mode: big fonts, Zen Mode, visuals beside the code.
