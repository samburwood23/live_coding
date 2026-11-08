# TidalCycles + SuperCollider

This is the "native" algorave setup. You write patterns in **Tidal** (a Haskell
library) and send them to **SuperDirt**, a sampler/synth that runs inside
**SuperCollider**:

```
your editor ──(Ctrl+Enter)──▶ Tidal (ghci) ──OSC :57120──▶ SuperDirt (SuperCollider) ──▶ speakers
```

Versions this kit targets: **Tidal 1.10** and **SuperDirt v1.7.4**.

| File | What it is |
| --- | --- |
| `INSTALL-UBUNTU.md` / `install-ubuntu.sh` | Ubuntu install guide and one-command installer |
| `install_superdirt.scd` | One-time SuperDirt install, run in SuperCollider (falls back to GitHub if codeberg is down) |
| `superdirt_startup.scd` | Starts SuperDirt; run it every session, before Tidal |
| `BootTidal.hs` | Tidal boot file, with `bpm` and `brk` helpers added |
| `jungle.tidal` | Jungle patterns: amen rollers, ragga, darkside, liquid, jump-up, drill'n'bass |
| `makina.tidal` | Makina set: bombo kick, offbeat bass, piano riffs, hoovers, rave vocals, snare roll with automatic drop |

---

## 1. Install

The install takes 20–40 minutes the first time, mostly compiling Haskell packages.

### macOS

The official bootstrap script installs everything: Haskell, Tidal,
SuperCollider, SuperDirt and the Pulsar editor.

```bash
xcode-select --install
```

```bash
curl https://raw.githubusercontent.com/tidalcycles/tidal-bootstrap/master/tidal-bootstrap.command -sSf | sh
```

Then **open a new terminal** and skip to [Pick an editor](#2-pick-an-editor).

<details>
<summary>Manual install on macOS (if the script fails)</summary>

1. Install [SuperCollider](https://supercollider.github.io/downloads) and
   [sc3-plugins](https://supercollider.github.io/sc3-plugins/).
2. Install Haskell with [GHCup](https://www.haskell.org/ghcup/) (accept the defaults):

   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://get-ghcup.haskell.org | sh
   ```

3. Install Tidal:

   ```bash
   cabal update
   ```

   ```bash
   cabal install tidal --lib
   ```

4. Install SuperDirt (see [step 1b](#1b-install-superdirt-all-platforms)).
</details>

### Linux: Ubuntu (and Mint / Pop!_OS / Debian)

See the dedicated **[Ubuntu install guide](INSTALL-UBUNTU.md)**. It has a
one-command install script (`bash tidal/install-ubuntu.sh`), the manual steps,
PipeWire audio setup and troubleshooting.

On **Arch**, `sudo pacman -S supercollider sc3-plugins ghc ghc-libs haskell-tidal` covers everything.
On **Fedora**, see the [official Linux guide](https://tidalcycles.org/docs/getting-started/linux_install).

### Windows

Install [Chocolatey](https://chocolatey.org/install), then in an **administrator** PowerShell:

```powershell
choco install tidalcycles
```

This installs Haskell, Tidal, SuperCollider, SuperDirt and sc3-plugins. If it
stalls, see the [Windows guide](https://tidalcycles.org/docs/getting-started/windows_install).

### 1b. Install SuperDirt (all platforms)

Skip this if the macOS script or Chocolatey already did it. Otherwise open
SuperCollider, open `tidal/install_superdirt.scd`, put the cursor on the
`Quarks...` line and press **Cmd+Enter** (macOS) or **Ctrl+Enter**. Wait for it to finish
(it downloads about 400 MB of samples), then restart SuperCollider.

### Check it worked

```bash
ghc -e 'import Sound.Tidal.Context' -e 'putStrLn "tidal ok"'
```

If that prints `tidal ok`, Tidal is installed. In SuperCollider, **Language → Quarks**
should list SuperDirt as installed.

---

## 2. Pick an editor

Tidal is played from a text editor with a Tidal plugin:

- **VS Code**: install the [TidalCycles extension](https://marketplace.visualstudio.com/items?itemName=tidalcycles.vscode-tidalcycles).
  Good if you already use VS Code.
- **Pulsar**: install the `tidalcycles` package. This is what the macOS script sets up.
- Vim/Neovim (`vim-tidal`) and Emacs (`tidal.el`) also work.

To use this kit's `BootTidal.hs` (which adds `bpm` and `brk`), set the plugin's
boot file path to it:

- **VS Code**: Settings → search "tidal boot" → set **Tidalcycles: Boot Tidal Path**
  to the full path of `tidal/BootTidal.hs`.
- **Pulsar**: Settings → Packages → tidalcycles → **Boot Tidal Path**, then
  choose "Custom".

Without that, the plugin uses Tidal's built-in boot file. Everything in
`jungle.tidal` still works, because it doesn't use the helpers.

---

## 3. Every session

1. **Start SuperCollider**, open `tidal/superdirt_startup.scd`, click inside the
   big `( ... )` block and press **Cmd/Ctrl+Enter**. Wait for
   `SuperDirt: listening to Tidal on port 57120`.
   (You can make this automatic; see the comment at the top of the file.)
2. **Open `tidal/jungle.tidal`** in your editor.
3. Put the cursor on `setcps (170/60/4)` and press **Ctrl+Enter** (Shift+Enter
   in Pulsar). The first evaluation boots Tidal.
4. Evaluate a block like `d1 $ splice 16 ...` and the break starts.
5. `hush` stops everything.

### Core vocabulary

| Code | Meaning |
| --- | --- |
| `d1 $ s "bd sn"` | Play a pattern on channel 1 (`d1`–`d16` layer independently) |
| `# n 3` / `# speed 2` / `# lpf 800` | Add parameters to every event |
| `setcps (170/60/4)` | Tempo: 170 BPM, 4 beats per cycle |
| `splice 16 "0 1 2" $ s "breaks165"` | Slice a break and re-sequence it, fitted to the tempo |
| `every 4 (fast 2) $ ...` | Apply a change every 4th cycle |
| `sometimesBy 0.3 (# speed 2) $ ...` | Apply a change randomly to 30% of events |
| `once $ s "supersiren"` | Trigger something one time |
| `solo 1` / `unsolo 1` | Mute everything except d1 |
| `xfadeIn 1 8 $ ...` | Crossfade d1 into a new pattern over 8 cycles |
| `hush` | Stop everything |

---

## Troubleshooting

- **No sound but no errors**: SuperDirt isn't running. Re-run
  `superdirt_startup.scd` and watch the SuperCollider post window.
- **"late" messages** in SuperCollider: raise `s.latency` in
  `superdirt_startup.scd`, or close heavy apps.
- **`Could not find module 'Sound.Tidal.Context'`**: Tidal isn't installed for
  the GHC your editor runs. Re-run `cabal update && cabal install tidal --lib`
  and restart the editor.
- **`cabal update` fails with a signature error**: your `cabal` is too old.
  Install a current one with GHCup (`ghcup install cabal latest`).
- **Linux: no audio device / can't connect to JACK**: on PipeWire systems (Ubuntu 22.10+),
  start SuperCollider with `pw-jack scide`. See [INSTALL-UBUNTU.md](INSTALL-UBUNTU.md#troubleshooting).
- **Port 57120 in use**: another SuperCollider is already running. Quit it,
  or run `Server.killAll` in SuperCollider.

More: [tidalcycles.org](https://tidalcycles.org) · [Tidal Club forum](https://club.tidalcycles.org)
