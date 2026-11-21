// ACID: a 303 line that evolves, over a 909 groove. 132 BPM, C minor.
// ---------------------------------------------------------------------------
// Needs SuperDirt running. Evaluate the big block, then Algo.next; through the scenes.
// Stuck for what to do? Algo.hint; shows an idea with its code, Algo.yes; does it.
//
// The 303 is the kit's own synth, \algo303. Its knobs:
//   ctf (filter, Hz)  res (resonance 0..1)  envmod (how far the filter opens on each note)
//   decay (how fast it closes)  accent (0..1)  wave (0 saw, 1 square)
// Steps with \slide 1 glide in from the note before (that's what .glide does).
// Layers: \kick \hats \clap \acid \acid2 \pad
// ---------------------------------------------------------------------------

(
Algo.start(132);
Algo.clearScenes;
Algo.master(glue: 0.5, gain: 1.3);   // glue compressor + limiter on everything
Algo.pump(0.45, 0.6);                 // everything but the kick (orbit 0) ducks on each kick

// ---- the parts -----------------------------------------------------------------------

~kick = { Algo(\kick, (Pbind(\shape, 0.25, \gain, 1.1) <> "909*4".mini).dirt) };

~hats = { Algo(\hats, Ppar([
	(Pbind(\gain, 0.9, \cut, 1) <> "[~ ho:1]*4".mini).dirt(2),
	(Pbind(\gain, Pseq([0.75, 0.9, 0.8, 1], inf), \speed, 1.1) <> "hh27*16".mini).dirt(2)
])) };

~clap = { Algo(\clap, (Pbind(\room, 0.25, \size, 0.5) <> "~ cp ~ cp".mini).dirt(3)) };

// the line, 16 steps. It changes a few notes each bar (Markov: only moves that are already in the
// line) and plays exactly as written every 8 bars
~line = "c2 c2 c3 c2 eb2 c2 bb1 c2 c2 g2 c2 c3 bb1 c2 f2 c2".evolve(0.25, 8);

~acid = { |ctf = 300, res = 0.8, envmod = 2500, wave = 0|
	Algo(\acid, (Pbind(\s, \algo303, \legato, 0.7, \gain, 1,
		\ctf, ctf, \res, res, \envmod, envmod, \decay, 0.2, \wave, wave,
		\accent, Pseq([1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0], inf),
		\slide,  Pseq([0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0], inf),
		\delay, 0.25, \delaytime, 3/16, \lock, 1, \delayfeedback, 0.4)
		<> ~line.notes).glide.dirt(1)) };

// ---- the set -------------------------------------------------------------------------------

Algo.scene(\groove, "909 kick, hats, clap", { ~kick.(); ~hats.(); ~clap.() });
Algo.move("swing the hats a little", {
	Algo(\hats, (Pbind(\gain, Pseq([0.75, 0.95], inf), \speed, 1.1, \lag, Pseq([0, 0.025], inf)) <> "hh27*16".mini).dirt(2)) });
Algo.move("a rolling clap on the last beat of every 4th bar", {
	Algo(\clap, (Pbind(\room, 0.25) <> "<[~ cp ~ cp]!3 [~ cp ~ [cp cp cp]]>".mini).dirt(3)) });

Algo.scene(\acid, "the 303 comes in, filter nearly closed", { ~acid.(200, 0.75, 900) });
Algo.move("open the filter a bit", { ~acid.(450, 0.8, 2000) });
Algo.move("more squelch: resonance up", { ~acid.(300, 0.92, 2200) });

Algo.scene(\open, "the filter opens and closes over 16 bars", {
	Algo(\acid, (Pbind(\s, \algo303, \legato, 0.7,
		\ctf, Pfunc { ((Algo.bar - 1) % 16 / 16 * 2pi).sin.linlin(-1, 1, 200, 1400) },
		\res, 0.85, \envmod, 3000, \decay, 0.2,
		\accent, Pseq([1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0], inf),
		\slide,  Pseq([0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0], inf),
		\delay, 0.25, \delaytime, 3/16, \lock, 1, \delayfeedback, 0.4)
		<> ~line.notes).glide.dirt(1));
});
Algo.move("let the line wander more", { ~line.amount = 0.5 });
Algo.move("square wave: harder, hollower", { ~acid.(500, 0.85, 3000, 1) });

Algo.scene(\second, "a second 303 an octave up, wandering further", {
	Algo(\acid2, (Pbind(\s, \algo303, \legato, 0.5, \gain, 0.8, \pan, 0.7,
		\ctf, 700, \res, 0.7, \envmod, 1800, \decay, 0.12, \wave, 1,
		\slide, Pseq([0, 1, 0, 0], inf), \room, 0.3)
		<> "c3 eb3 g3 c4 bb3 g3 f3 eb3".evolve(0.4, 16).notes).glide.dirt(4));
});
Algo.move("take the first 303 out so the second one talks", { Algo.mute(\acid) });

Algo.scene(\breakdown, "drums out: the 303 with a long delay, a pad underneath", {
	Algo.only(\acid, \pad, \hats);
	Algo.mute(\hats);
	Algo(\pad, (Pbind(\s, \supersaw, \legato, 1, \cutoff, 900, \room, 0.6, \size, 0.9, \gain, 0.55)
		<> "<[c3,eb3,g3] [ab2,c3,eb3] [bb2,d3,f3] [g2,bb2,d3]>".notes).dirt(5));
	Algo(\acid, (Pbind(\s, \algo303, \legato, 0.7, \ctf, 400, \res, 0.9, \envmod, 2500, \decay, 0.3,
		\slide, Pseq([0, 0, 1, 0], inf), \delay, 0.5, \delaytime, 3/8, \lock, 1, \delayfeedback, 0.65)
		<> ~line.notes).glide.dirt(1));
});

Algo.scene(\peak, "everything back after a drop, 303 wide open", {
	Algo.unmuteAll;
	~kick.(); ~hats.(); ~clap.();
	~acid.(600, 0.9, 4000);
	Algo.drop(4, 8);
});
Algo.move("faster: 136", { Algo.bpm = 136 });

Algo.setList;
)

// ---- while it plays ----------------------------------------------------------------------------

Algo.next;
Algo.hint;    // an idea for this scene, with the code
Algo.yes;     // do it

~line.amount = 0.6;   // the 303 wanders more (0 = exactly as written)
~line.home = 16;      // and comes home less often
Algo.level(\acid, 0.8);
Algo.pump(0.6);       // deeper pump
Algo.stop;
