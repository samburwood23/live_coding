// GABBER / HARDCORE: distorted kicks, hoovers, rave stabs. 180 BPM, A minor.
// ---------------------------------------------------------------------------
// Needs SuperDirt running. Evaluate the big block, then Algo.next; through the scenes.
// Stuck for what to do? Algo.hint; shows an idea with its code, Algo.yes; does it.
// Layers: \kick \hats \clap \hoover \stabs \pad \vocal \noise
// ---------------------------------------------------------------------------

(
Algo.start(180);
Algo.clearScenes;
Algo.master(glue: 0.6, gain: 1.4);  // the limiter keeps the distorted kick from clipping
Algo.pump(0.5, 0.4);                 // everything but the kick ducks: gives the hoover that surge

// ---- the parts -----------------------------------------------------------------------

// the gabber kick: a distorted kick, shaped harder. Try n 0..3 and shape 0.3..0.9
~kick = { |shape = 0.6| Algo(\kick, (Pbind(\n, 0, \shape, shape, \gain, 1, \cut, 1) <> "gabbaloud*4".mini).dirt) };

~hats = { Algo(\hats, (Pbind(\gain, 0.85, \cut, 2) <> "[~ hh27:6]*4".mini).dirt(2)) };
~clap = { Algo(\clap, (Pbind(\room, 0.2, \shape, 0.3) <> "~ cp ~ cp".mini).dirt(3)) };

// the hoover riff: evolves a little each bar, home every 8
~riff = "a2 ~ a2 c3 ~ a2 e3 ~ a2 ~ g2 ~ a2 c3 b2 g2".evolve(0.2, 8);
~hoover = { |cutoff = 5000|
	Algo(\hoover, (Pbind(\s, \superhoover, \legato, 0.9, \cutoff, cutoff, \room, 0.25, \gain, 0.8) <> ~riff.notes).dirt(1)) };

// rave stabs on the 3-3-2
~stabs = { Algo(\stabs, (Pbind(\s, \supersaw, \legato, 0.25, \cutoff, 4000, \room, 0.3, \gain, 0.65)
	<> "[a3,c4,e4] [f3,a3,c4] [g3,b3,d4] [e3,g3,b3]".perBar("x ~ ~ x ~ ~ x ~").notes).dirt(4)) };

// ---- the set ----------------------------------------------------------------------------

Algo.scene(\kick, "just the kick", { ~kick.() });
Algo.move("harder kick", { ~kick.(0.85) });
Algo.move("a different kick: gabbalouder", {
	Algo(\kick, (Pbind(\shape, 0.6, \cut, 1) <> "gabbalouder*4".mini).dirt) });

Algo.scene(\drive, "hats on the offbeat, claps, a rave shout every 8 bars", {
	~hats.(); ~clap.();
	Algo(\vocal, (Pbind(\room, 0.4, \gain, 0.9) <> "<rave:3 ~!7>".mini).dirt(6));
});
Algo.move("16th hats that swell with each beat", {
	Algo(\hats, (Pbind(\cut, 2, \gain, Pfunc { (thisThread.beats * 2pi).sin * 0.15 + 0.8 }) <> "hh27:6*16".mini).dirt(2)) });

Algo.scene(\hoover, "the hoover riff (it changes a little each bar)", { ~hoover.() });
Algo.move("let the riff wander", { ~riff.amount = 0.45 });
Algo.move("darker hoover", { ~hoover.(1500) });

Algo.scene(\stabs, "rave stabs on the 3-3-2", { ~stabs.() });

Algo.scene(\breakdown, "kick out, held chords, the hoover slowed down", {
	Algo.only(\pad, \hoover, \vocal);
	Algo(\pad, (Pbind(\s, \supersaw, \legato, 1, \cutoff, 1800, \room, 0.7, \size, 0.95, \gain, 0.5)
		<> "<[a3,c4,e4] [f3,a3,c4] [g3,b3,d4] [e3,g3,b3]>".notes).dirt(5));
	Algo(\hoover, (Pbind(\s, \superhoover, \legato, 1, \room, 0.5, \gain, 0.7) <> "<a2 f2 g2 e2>".notes).dirt(1));
});

Algo.scene(\drop, "snare roll, then everything slams back in", {
	~kick.(0.7); ~hats.(); ~clap.(); ~hoover.(); ~stabs.();
	Algo.stopLayer(\pad);
	Algo.drop(4, 8);
});

Algo.scene(\terror, "terror: 200 BPM, double kicks, industrial noise", {
	Algo.bpm = 200;
	Algo(\kick, (Pbind(\shape, 0.8, \cut, 1) <> "<gabbaloud*4!3 [gabbaloud gabbaloud*2 gabbaloud gabbaloud*4]>".mini).dirt);
	Algo(\noise, (Pbind(\gain, 0.7, \crush, 5, \cut, 3) <> "<industrial:3(3,8,2) industrial:7(3,8,2)>".mini).dirt(3));
	~riff.amount = 0.5;
});
Algo.move("crush the hoover", { Algo.mutate(\hoover, "crush") });

Algo.setList;
)

// ---- while it plays ----------------------------------------------------------------------------

Algo.next;
Algo.hint;
Algo.yes;
Algo.stop;
