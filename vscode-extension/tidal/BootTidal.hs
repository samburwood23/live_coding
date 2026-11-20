-- BootTidal.hs for Tidal 1.10.
-- Your editor plugin runs this when it starts Tidal. Point the plugin's
-- "boot file" setting at this file to use it; see tidal/README.md.

:set -fno-warn-orphans -Wno-type-defaults -XMultiParamTypeClasses -XOverloadedStrings
:set prompt ""

-- All the usual shortcuts: d1..d16, hush, once, setcps, solo, xfade, ...
import Sound.Tidal.Boot

default (Rational, Integer, Double, Pattern String)

-- Lower the latency if you're on a fast machine and want tighter timing, e.g.
-- tidalInst <- mkTidalWith [(superdirtTarget { oLatency = 0.05 }, [superdirtShape])] defaultConfig
tidalInst <- mkTidal

instance Tidally where tidal = tidalInst

-- Uncomment to sync tempo with other apps/players over Ableton Link:
-- enableLink

-- Kit helpers ----------------------------------------------------------------

-- Tempo in BPM (4 beats per cycle): bpm 172
let bpm b = setcps (b / 60 / 4)

-- Chop a break so it always fits one cycle, whatever its original tempo:
-- d1 $ brk 16 "0 1 [2 3] 4" "breaks165"
let brk slices pat sample = splice slices pat $ s sample

:set prompt "tidal> "
:set prompt-cont ""
