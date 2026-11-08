# Installing TidalCycles on Ubuntu

For **Ubuntu 24.04 LTS** (22.04 works too). By the end you'll have:

- **SuperCollider 3.13** + **sc3-plugins**: the audio engine, from Ubuntu's own packages
- **SuperDirt v1.7.4** + **Dirt-Samples**: Tidal's sampler and around 200 sample banks
- **Tidal 1.10**: the pattern language, built with GHCup's Haskell toolchain
- Realtime audio permissions, so timing stays tight

Time needed: about 30–45 minutes, mostly waiting for Tidal to compile.

---

## Option A: the install script (recommended)

```bash
git clone -b claude/adoring-euler-p8jm8t https://github.com/samburwood23/live_coding.git
```

```bash
cd live_coding
```

```bash
bash tidal/install-ubuntu.sh
```

Run it as your normal user, not with `sudo`; it asks for your password when it
needs it. It ends with a checklist:

```
==> Checking everything
  ✓ SuperCollider
  ✓ sc3-plugins
  ✓ SuperDirt
  ✓ Dirt-Samples
  ✓ Tidal
  ✓ Realtime audio limits
```

Then **log out and back in** (or reboot) and jump to [Set up your editor](#set-up-your-editor).

If something fails, fix it using the hint next to the ✗ and run the script again.
Steps that already finished go quickly the second time.

---

## Option B: step by step

These are the same steps the script runs.

### 1. SuperCollider and audio packages

Answer "yes" in advance to the realtime-priority question that `jackd2` asks:

```bash
echo "jackd2 jackd/tweak_rt_limits boolean true" | sudo debconf-set-selections
```

```bash
sudo apt update
```

```bash
sudo apt install -y git curl build-essential pkg-config libffi-dev libgmp-dev libncurses-dev zlib1g-dev supercollider sc3-plugins jackd2 pipewire-jack
```

> **Install `sc3-plugins`, not just `supercollider`.** Without it, SuperDirt
> skips all of its `super*` synths (`superreese`, `superhoover`, `superpiano`, …)
> and you get `no synth or sample named 'superreese'`.

### 2. Realtime audio permissions

```bash
sudo usermod -a -G audio $USER
```

```bash
sudo dpkg-reconfigure jackd2
```

Choose **Yes** when asked about realtime priority. Then **log out and back in**.

### 3. SuperDirt

Open SuperCollider (`scide`), then **File → Open** `tidal/install_superdirt.scd`.
Click inside the `( ... )` block and press **Ctrl+Enter**. Wait for:

```
*** SuperDirt OK: restart SuperCollider (or recompile the class library) ***
```

Then close and reopen SuperCollider.

SuperDirt now lives on codeberg.org. If codeberg can't be reached, the file
falls back to SuperDirt's GitHub mirror on its own.

### 4. Haskell (GHCup)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://get-ghcup.haskell.org | sh
```

Accept the defaults, and say **yes** when it offers to add itself to your PATH. Then
open a new terminal, or run:

```bash
source ~/.ghcup/env
```

> **Don't use `sudo apt install cabal-install ghc`.** Ubuntu's `cabal` (3.8) is
> too old to verify Hackage's current signing keys, so `cabal update` fails with
> *"root.json does not have enough signatures"*. GHCup installs a current one.

### 5. Tidal

```bash
cabal update
```

```bash
cabal install tidal --lib
```

### 6. Check it

```bash
ghc -e 'import Sound.Tidal.Context' -e 'putStrLn "tidal ok"'
```

---

## Set up your editor

VS Code is the easiest option:

```bash
sudo snap install code --classic
```

```bash
code --install-extension tidalcycles.vscode-tidalcycles
```

Optional: to get this kit's `bpm` and `brk` helpers, open VS Code **Settings**,
search for `tidal boot`, and set **Tidalcycles: Boot Tidal Path** to the full path of
`tidal/BootTidal.hs`.

---

## Every session

Ubuntu 24.04 uses **PipeWire** for sound, and SuperCollider talks to it through
PipeWire's JACK layer.

1. **Start SuperCollider through PipeWire:**

   ```bash
   pw-jack scide
   ```

2. In SuperCollider, open `tidal/superdirt_startup.scd`, click inside the big
   `( ... )` block and press **Ctrl+Enter**. Wait for:

   ```
   SuperDirt: listening on port 57120
   ```

3. In VS Code, open `tidal/jungle.tidal`, put the cursor on
   `setcps (170/60/4)` and press **Shift+Enter**. Then evaluate a `d1 $ ...`
   block. You should hear a break.

4. `hush` stops everything.

To skip typing `pw-jack` each time, you can make every JACK app use PipeWire
automatically. This is a system-wide change; Ubuntu Studio does the same:

```bash
sudo cp /usr/share/doc/pipewire/examples/ld.so.conf.d/pipewire-jack-*.conf /etc/ld.so.conf.d/
```

```bash
sudo ldconfig
```

After that, starting `scide` from the app menu works.

---

## Troubleshooting

### `Couldn't set realtime scheduling priority 1: Operation not permitted`

This is a **warning, not an error**. SuperCollider still runs and makes sound.
It means your user isn't allowed realtime priority yet, so timing can stutter under
heavy CPU load. To fix it:

1. Turn on Ubuntu's realtime limits for the `audio` group (choose **Yes**):

   ```bash
   sudo dpkg-reconfigure jackd2
   ```

   This turns `/etc/security/limits.d/audio.conf.disabled` into `audio.conf`.

2. Add yourself to the `audio` group:

   ```bash
   sudo usermod -a -G audio $USER
   ```

3. **Log out and back in.** Group and limit changes only apply to new logins.

4. Check that it worked. It should print `95`, not `0`:

   ```bash
   ulimit -r
   ```

### `could not connect to JACK server` / server fails to boot

SuperCollider is looking for JACK, but Ubuntu is running PipeWire. Start it with
`pw-jack scide`, or apply the `ldconfig` change above. Make sure
`pipewire-jack` is installed.

### `no synth or sample named 'superreese'` (or any `super…` synth)

`sc3-plugins` is missing. Install it, then restart SuperCollider:

```bash
sudo apt install sc3-plugins
```

### `SuperDirt installed`, but then `SuperDirt` is an unknown class

The download failed; SuperCollider's package manager prints "installed" anyway.
Run `tidal/install_superdirt.scd` again: it checks the files really arrived and
falls back to the GitHub mirror.

### `cabal update`: *root.json does not have enough signatures*

Your `cabal` is Ubuntu's old 3.8 one. Remove it and use GHCup's:

```bash
sudo apt remove cabal-install ghc
```

```bash
curl --proto '=https' --tlsv1.2 -sSf https://get-ghcup.haskell.org | sh
```

### `Could not find module 'Sound.Tidal.Context'` in VS Code

VS Code was opened before GHCup's PATH change. Log out and back in, or start
VS Code from a terminal that has run `source ~/.ghcup/env`.

### `late 0.05…` messages in the SuperCollider post window

Tidal's messages arrive after their scheduled time. Raise `s.latency` in
`tidal/superdirt_startup.scd` (try `0.4`), or close heavy apps. Fixing realtime
priority (above) helps too.

### No sound, no errors

- Is SuperDirt running? The post window should show `SuperDirt: listening on port 57120`.
- Is the right output selected? Check **Settings → Sound**, or install
  `qpwgraph` to see whether SuperCollider's outputs are connected to your speakers.
- Is something already using port 57120? Run `Server.killAll` in SuperCollider
  and start SuperDirt again.
