# Changelog

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
