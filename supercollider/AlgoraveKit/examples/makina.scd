// MAKINA in SuperCollider: tidal/makina.tidal rewritten with the Algorave Kit.
// ---------------------------------------------------------------------------
// Valencian / Catalan hard dance at 175 BPM in C minor: Cm - Ab - Bb - Gm.
//
// Needs SuperDirt running with the Dirt-Samples (run tidal/superdirt_startup.scd,
// or SuperDirt.start). Then:
//   1. Evaluate the big block below once (cursor inside it, Ctrl+Enter).
//   2. Algo.next; steps to the next section. Each lands on the next 4-bar line.
//   3. Change any layer and re-evaluate its line: it lands on the line too.
// Layers: \kick \hats \claps \bass \riff \stabs \hoover \vocal
// ---------------------------------------------------------------------------

(
Algo.start(175);
Algo.clearScenes;

// ---- the parts, as functions so each scene can bring them in ----------------

// the bombo: distorted hardkick on every beat. Try \n 0..5
~kick = { Algo(\kick, (Pbind(\n, 1, \cut, 1, \shape, 0.3) <> "hardkick*4".mini).dirt) };

// open hat on every offbeat, plus rolling 16ths that swell with each beat
~hats = { |gain = 1|
	Algo(\hats, Ppar([
		(Pbind(\cut, 3, \gain, gain) <> "[~ ho:2]*4".mini).dirt(2),
		(Pbind(\gain, Pfunc { (sin(thisThread.beats * 2pi) * 0.125 + 0.775) * gain }) <> "hh*16".mini).dirt(2)
	]))
};

~claps = { Algo(\claps, (Pbind(\room, 0.2) <> "~ realclaps:1 ~ realclaps:1".mini).dirt(2)) };

// the bajo: an offbeat supersaw, one note per chord
~bass = { Algo(\bass, (Pbind(\s, \supersaw, \legato, 0.5, \cutoff, 1400, \gain, 0.9) <> "c2 ab1 bb1 g1".offbeats.notes).dirt(1)) };

// the pianos makineros: piano and supersaw together, 16 steps a bar, bar 2 answers bar 1
~melody = "<[0 ~ 0 2 ~ 4 ~ 2 0 ~ 0 2 ~ 4 5 4] [0 ~ 0 2 ~ 4 ~ 2 7 ~ 6 ~ 4 ~ 2 ~]>";
~riff = { |cutoff = 4000, room = 0.25|
	Algo(\riff, (Pbind(\legato, 0.6, \cutoff, cutoff, \room, room, \gain, 0.75) <> Ppar([
		Pbind(\s, \superpiano) <> ~melody.degrees(Scale.minor, 60),
		Pbind(\s, \supersaw) <> ~melody.degrees(Scale.minor, 60)
	])).dirt(3))
};

// rave chord stabs on the classic 3-3-2
~stabs = { Algo(\stabs, (Pbind(\s, \supersaw, \legato, 0.3, \cutoff, 3000, \room, 0.3, \gain, 0.6)
	<> "[c4,eb4,g4] [ab3,c4,eb4] [bb3,d4,f4] [g3,bb3,d4]".perBar("x ~ ~ x ~ ~ x ~").notes).dirt(4)) };

// the hoover, sliding into every 4th bar
~hoover = { Algo(\hoover, (Pbind(\s, \superhoover, \legato, 1, \room, 0.3, \gain, 0.7,
	\slide, Pfunc { if(Algo.bar % 4 == 0) { 1 } { 0 } }) <> "<c3 ab2 bb2 [g2 b2]>".notes).dirt(5)) };

// ---- the set ---------------------------------------------------------------------

Algo.scene(\intro, "kick and hats", { ~kick.(); ~hats.() });

Algo.scene(\groove, "bass on the offbeats, claps on 2 and 4", { ~bass.(); ~claps.() });

Algo.scene(\riff, "the pianos makineros + 3-3-2 stabs", { ~riff.(); ~stabs.() });

Algo.scene(\hoover, "hoover slides into every 4th bar", { ~hoover.() });

Algo.scene(\breakdown, "kick and bass out, the riff on a roomy piano, held chords", {
	Algo.only(\hats, \riff, \stabs, \vocal);
	~hats.(0.7);
	Algo(\riff, (Pbind(\s, \superpiano, \legato, 1, \room, 0.6, \size, 0.9, \gain, 0.75) <> ~melody.degrees(Scale.minor, 60)).dirt(3));
	Algo(\stabs, (Pbind(\s, \supersaw, \legato, 1, \cutoff, 1500, \room, 0.7, \size, 0.9, \gain, 0.4)
		<> "<[c3,eb3,g3] [ab2,c3,eb3] [bb2,d3,f3] [g2,bb2,d3]>".notes).dirt(4));
	// a vocal shot every 8 bars (rave n 0..7: different shouts)
	Algo(\vocal, (Pbind(\room, 0.4) <> "<rave:0 ~!7>".mini).dirt(6));
});

Algo.scene(\drop, "snare roll, then kick and bass drop back in on the 8", {
	~kick.(); ~bass.(); ~riff.(); ~stabs.();
	Algo.stopLayer(\vocal);
	Algo.drop(4, 8);
	// a vocal on the downbeat of the drop
	Algo.dropInfo !? { |d| TempoClock.default.schedAbs(d[\land], { (type: \dirt, s: \rave, n: 5, orbit: 6, dirt: Algo.dirt).play; nil }) };
});

Algo.scene(\peak, "180 BPM: riff opens over 8 bars, up an octave every 4th, kick fills", {
	Algo.bpm = 180;
	// double kicks on the last beat of every 8th bar
	Algo(\kick, (Pbind(\n, 1, \cut, 1, \shape, 0.3) <> "<hardkick*4!7 [hardkick hardkick hardkick hardkick*2]>".mini).dirt);
	Algo(\riff, (Pbind(\legato, 0.6, \room, 0.25, \gain, 0.75,
		\cutoff, Pfunc { (((Algo.bar - 1) % 8) / 8).linexp(0, 1, 400, 6000) },
		\octave, Pfunc { if((Algo.bar - 1) % 4 == 0) { 6 } { 5 } }) <> Ppar([
		Pbind(\s, \superpiano) <> ~melody.degrees(Scale.minor, 60),
		Pbind(\s, \supersaw) <> ~melody.degrees(Scale.minor, 60)
	])).dirt(3));
	~hoover.();
});

Algo.setList;
)

// ---- while it plays -----------------------------------------------------------------

Algo.next;              // next section, on the next 4-bar line
Algo.prev;
Algo.go(\breakdown);    // jump to a section

Algo.mute(\bass);       // Tidal's mute 2: instant, and it comes back in time
Algo.unmute(\bass);
Algo.solo(\kick);       // Tidal's solo 1
Algo.unmuteAll;

Algo.mutate(\riff);     // a random twist (echo, crush, accents, octave jumps...)
Algo.unmutate(\riff);

Algo.drop;              // build + roll, back on the next 8-bar line
Algo.bpm = 178;         // tempo change on the next bar
Algo.status;
Algo.stop;              // or Ctrl+. to hush
