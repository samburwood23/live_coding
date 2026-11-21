// BREAKCORE: a re-edited amen that never repeats, gabber kicks, a sad piano. 180 BPM, D minor.
// ---------------------------------------------------------------------------
// Needs SuperDirt running. Evaluate the big block, then Algo.next; through the scenes.
// Stuck for what to do? Algo.hint; shows an idea with its code, Algo.yes; does it.
// The break is breaks165 cut into 16 slices. The slice order evolves: each bar swaps some slices
// for ones that follow them somewhere in the original, so it stays break-shaped but never loops.
// Layers: \break \kick \stutter \bass \piano \noise
// ---------------------------------------------------------------------------

(
Algo.start(180);
Algo.clearScenes;
Algo.master(glue: 0.6, gain: 1.3);

// ---- the parts -----------------------------------------------------------------------

// 16 slices, played in order: the straight break. 0 is the kick, 4 and 12 the snares
~slices = "0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15".evolve(0.35, 4, false);
~break = { |gain = 1|
	Algo(\break, (Pbind(\cut, 1, \gain, gain, \shape, 0.2) <> ~slices.splice(16, \breaks165)).dirt(2)) };

~kick = { Algo(\kick, (Pbind(\shape, 0.7, \cut, 3, \gain, 0.95) <> "gabbaloud ~ ~ ~ ~ ~ gabbaloud ~ ~ ~ gabbaloud ~ ~ ~ ~ ~".mini).dirt) };

// the sad piano: a phrase that wanders through its own notes
~melody = "d4 f4 a4 g4 f4 e4 d4 a3 bb3 d4 f4 e4 d4 c4 a3 d4".evolve(0.25, 8);
~piano = { Algo(\piano, (Pbind(\s, \superpiano, \legato, 1.5, \room, 0.5, \size, 0.8, \gain, 0.55, \velocity, 0.5)
	<> ~melody.notes).dirt(4)) };

// a reese that growls under it all
~bass = { Algo(\bass, (Pbind(\s, \superreese, \legato, 1, \gain, 0.75, \cutoff, 900, \shape, 0.3)
	<> "<d1 d1 bb0 [a0 c1]>".notes).dirt(1)) };

// ---- the set ----------------------------------------------------------------------------

Algo.scene(\piano, "start sad: just the piano", { ~piano.() });

Algo.scene(\break, "the amen comes in, re-editing itself every bar", { ~break.() });
Algo.move("chop harder: more slices swap each bar", { ~slices.amount = 0.7 });
Algo.move("keep it straight for a bit", { ~slices.amount = 0 });

Algo.scene(\chaos, "gabber kicks, reese, the break stutters", {
	~kick.(); ~bass.();
	Algo.mutate(\break, "double speed");
});
Algo.move("a stutter fill: one slice machine-gunned", {
	Algo(\stutter, (Pbind(\cut, 1, \gain, 0.9) <> "<~!3 [~ ~ ~ [4*8]]>".splice(16, \breaks165)).dirt(3)) });
Algo.move("crush the break and the bass", { Algo.mutate(\break, "crush"); Algo.mutate(\bass, "crush") });

Algo.scene(\halftime, "half time: 90 BPM, the break slowed right down", {
	Algo.bpm = 90;
	Algo.only(\break, \piano, \bass);
});
Algo.move("back to full speed", { Algo.bpm = 180 });

Algo.scene(\noise, "back to 180, everything, plus noise bursts", {
	Algo.bpm = 180;
	~break.(); ~kick.(); ~bass.(); ~piano.();
	Algo.unmutate;
	Algo(\noise, (Pbind(\gain, 0.6, \crush, 4, \coarse, 8, \cut, 4) <> "<glitch:2(5,16) glitch:5(3,8)>".mini).dirt(5));
});

Algo.scene(\end, "everything drops out but the piano", {
	Algo.only(\piano);
	~melody.amount = 0;
});

Algo.setList;
)

// ---- while it plays ----------------------------------------------------------------------------

Algo.next;
Algo.hint;
Algo.yes;
~slices.amount = 0.5;   // how much the break re-edits itself each bar
~melody.amount = 0.4;
Algo.stop;
