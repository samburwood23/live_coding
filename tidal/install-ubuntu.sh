#!/usr/bin/env bash
# TidalCycles + SuperCollider + SuperDirt installer for Ubuntu 24.04 (also 22.04).
#
#   bash tidal/install-ubuntu.sh
#
# Run it as your normal user (it asks for your password for sudo).
# It's safe to run again: finished steps are quick the second time.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

step() { printf '\n\033[1;35m==> %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m  ✓ %s\033[0m\n' "$*"; }
bad()  { printf '\033[1;31m  ✗ %s\033[0m\n' "$*"; }

if [ "$(id -u)" -eq 0 ]; then
  echo "Run this as your normal user, not root (it uses sudo where needed)."
  exit 1
fi

# --------------------------------------------------------------------------
step "1/5  System packages: SuperCollider, sc3-plugins, audio and build tools"
# Answer jackd2's "enable realtime priority?" question with yes, up front.
echo "jackd2 jackd/tweak_rt_limits boolean true" | sudo debconf-set-selections
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
  git curl build-essential pkg-config libffi-dev libgmp-dev libncurses-dev zlib1g-dev \
  supercollider sc3-plugins jackd2 pipewire-jack
# If jackd2 was already installed with realtime off, switch it on now.
sudo DEBIAN_FRONTEND=noninteractive dpkg-reconfigure jackd2

# --------------------------------------------------------------------------
step "2/5  Realtime audio permissions"
sudo usermod -a -G audio "$USER"
ok "added $USER to the 'audio' group (takes effect after you log out and back in)"

# --------------------------------------------------------------------------
step "3/5  SuperDirt + Dirt-Samples (about 400 MB)"
tmp_scd="$(mktemp --suffix=.scd)"
{ cat "$HERE/install_superdirt.scd"; echo; echo '0.exit;'; } > "$tmp_scd"
QT_QPA_PLATFORM=offscreen sclang "$tmp_scd" 2>&1 | grep -E 'Installing|installed|codeberg|mirror|\*\*\*' || true
rm -f "$tmp_scd"

# --------------------------------------------------------------------------
step "4/5  Haskell toolchain (GHCup)"
if [ ! -x "$HOME/.ghcup/bin/ghcup" ]; then
  # Official GHCup installer, non-interactive, and adds itself to ~/.bashrc.
  curl --proto '=https' --tlsv1.2 -sSf https://get-ghcup.haskell.org | \
    BOOTSTRAP_HASKELL_NONINTERACTIVE=1 BOOTSTRAP_HASKELL_ADJUST_BASHRC=1 sh
else
  ok "GHCup already installed"
fi
# shellcheck disable=SC1091
source "$HOME/.ghcup/env"

# --------------------------------------------------------------------------
step "5/5  Tidal (compiles from source: 10-30 minutes the first time)"
cabal update
cabal install tidal --lib

# --------------------------------------------------------------------------
step "Checking everything"
fail=0
QUARKS="$HOME/.local/share/SuperCollider/downloaded-quarks"
# check "what" "how to fix" command...
check() {
  local what="$1" fix="$2"; shift 2
  if "$@" >/dev/null 2>&1; then ok "$what"; else bad "$what: $fix"; fail=1; fi
}
check "SuperCollider" "sudo apt install supercollider" command -v sclang
check "sc3-plugins" "sudo apt install sc3-plugins (the super* synths need it)" test -d /usr/share/SuperCollider/Extensions/SC3plugins
check "SuperDirt" "open tidal/install_superdirt.scd in SuperCollider and run it" test -f "$QUARKS/SuperDirt/SuperDirt.quark"
check "Dirt-Samples" "run tidal/install_superdirt.scd again" test -d "$QUARKS/Dirt-Samples"
check "Tidal" "run: cabal update && cabal install tidal --lib" ghc -e 'import Sound.Tidal.Context' -e 'putStrLn "ok"'
check "Realtime audio limits" "sudo dpkg-reconfigure jackd2 (answer Yes)" test -f /etc/security/limits.d/audio.conf

echo
if [ "$fail" -eq 0 ]; then
  printf '\033[1;32mAll done!\033[0m\n'
else
  printf '\033[1;31mSome parts need attention (see above).\033[0m\n'
fi
cat <<'EOF'

Next:
  1. LOG OUT AND BACK IN (or reboot) so the audio group and PATH changes apply.
  2. Install an editor + the TidalCycles extension, e.g.:
       sudo snap install code --classic
       code --install-extension tidalcycles.vscode-tidalcycles
  3. Follow "Every session" in tidal/INSTALL-UBUNTU.md.
EOF
