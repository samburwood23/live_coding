// JUNGLE in SuperCollider: tidal/jungle.tidal rewritten with the Algorave Kit.
// ---------------------------------------------------------------------------
// 165 BPM, chopped breaks, sub bass, reese, rave stabs, a siren. C minor.
//
// Needs SuperDirt running with the Dirt-Samples. Then:
//   1. Evaluate the big block below once.
//   2. Algo.next; steps through the sections, each on the next 4-bar line.
// Layers: \break \sub \reese \skank \hoover \keys \siren \fx
// ---------------------------------------------------------------------------

(
Algo.start(165);
Algo.clearScenes;

// ---- the parts -----------------------------------------------------------------

// breaks165 cut into 16 slices. The numbers are slice indexes, so this is a re-edit.
// Each slice is time-stretched to fit its step (unit \c), so it follows the tempo.
~break = { |slices = "0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15"|
	Algo(\break, (Pbind(\cut, 1, \gain, 1) <> slices.splice(16, \breaks165)).dirt(0)) };

// the classic edit: kick, kick, snare... then a stutter on the last beat
~edit = "0 1 2 3 4 5 6 7 8 9 10 11 <12 [12 12]> 13 <14 6> <15 [15 15]>";

// jungbass: one long sub note per bar, n is semitones
~sub = { Algo(\sub, (Pbind(\legato, 1, \cut, 2, \gain, 1.1) <> "<jungbass:0 jungbass:0 jungbass:-2 jungbass:-5>".mini).dirt(1)) };

// the reese: detuned saws, filter breathing with a slow sine (jump-up)
~reese = { |base = 300, depth = 1500|
	Algo(\reese, (Pbind(\s, \superreese, \legato, 0.9, \gain, 0.8,
		\cutoff, Pfunc { sin(thisThread.beats * pi / 8) * depth / 2 + (base + (depth / 2)) })
		<> "<[c2 ~ ~ c2 ~ ~ eb2 ~] [ab1 ~ ~ ab1 ~ ~ bb1 ~]>".notes).dirt(2)) };

// ragga skank on the offbeats
~skank = { Algo(\skank, (Pbind(\s, \superhammond, \legato, 0.2, \room, 0.3, \gain, 0.6)
	<> "~ [c4,eb4,g4] ~ [c4,eb4,g4]".notes).dirt(3)) };

// the siren: once every 8 bars
~siren = { Algo(\siren, (Pbind(\s, \supersiren, \legato, 1, \room, 0.5, \gain, 0.55) <> "<c4 ~!7>".notes).dirt(4)) };

// ---- the set ---------------------------------------------------------------------

Algo.scene(\break, "the amen at 165, straight", { ~break.() });

Algo.scene(\edit, "re-edited break + sub", { ~break.(~edit); ~sub.() });

Algo.scene(\ragga, "skank on the offbeat, siren every 8 bars", { ~skank.(); ~siren.() });

Algo.scene(\darkside, "reese in, the last 4 bars of every 16 go dark, hoover", {
	Algo.only(\break, \sub, \reese, \hoover);
	~reese.(150, 600);
	// filter the break down for the last 4 bars of every 16
	Algo(\break, (Pbind(\cut, 1,
		\cutoff, Pfunc { if((Algo.bar - 1) % 16 >= 12) { 600 } { 20000 } })
		<> ~edit.splice(16, \breaks165)).dirt(0));
	Algo(\hoover, (Pbind(\s, \superhoover, \legato, 1, \room, 0.4, \gain, 0.6)
		<> "[[c3,g3] ~ ~ ~ ~ ~ [~ [b2,f#3]] ~]/2".notes).dirt(5));
});

Algo.scene(\liquid, "rolling piano arps over the sub, break softer", {
	Algo.only(\break, \sub, \keys);
	Algo(\break, (Pbind(\cut, 1, \gain, 0.85, \room, 0.2) <> ~edit.splice(16, \breaks165)).dirt(0));
	Algo(\keys, (Pbind(\s, \superpiano, \legato, 1.5, \room, 0.5, \size, 0.8, \gain, 0.6)
		<> "<[c3 e3 g3 b3] [a2 c3 e3 g3 e3 c3] [f2 a2 c3 e3] [g2 b2 d3 f3 d3 b2]>".notes).dirt(3));
});

Algo.scene(\jumpup, "build, then the reese wobbles hard", {
	~break.(~edit); ~sub.(); ~reese.(300, 3000); ~siren.();
	Algo.stopLayer(\keys);
	Algo.drop(4, 8);
});

Algo.scene(\drill, "drill'n'bass: amencutup chopped with chance", {
	Algo.only(\break, \sub, \reese);
	Algo(\break, (Pbind(\s, \amencutup,
		\n, Pwhite(0, 31),
		\speed, Pwrand([1, 2, -1], [0.75, 0.15, 0.1], inf),
		\cut, 1)
		<> "<x*16 [x*8 x*16]>".mini).dirt(0));
	Algo.mutate(\reese);
});

Algo.setList;
)

// ---- while it plays -----------------------------------------------------------------

Algo.next;
Algo.go(\darkside);
Algo.mute(\sub);  Algo.unmute(\sub);
Algo.solo(\break); Algo.unmuteAll;
Algo.mutate(\break);   // try it on the break: crush, echo, double speed...
Algo.drop;
Algo.status;
Algo.stop;
