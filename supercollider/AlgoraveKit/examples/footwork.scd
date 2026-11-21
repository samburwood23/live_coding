// FOOTWORK: 160 BPM, 808s, syncopated kicks, triplet hats, chopped vocals. F minor.
// ---------------------------------------------------------------------------
// Needs SuperDirt running. Evaluate the big block, then Algo.next; through the scenes.
// Stuck for what to do? Algo.hint; shows an idea with its code, Algo.yes; does it.
// Footwork lives on the 16th grid but feels in threes: kicks in groups of 3, hats in triplets.
// Layers: \kick \clap \hats \toms \vox \sub \keys
// ---------------------------------------------------------------------------

(
Algo.start(160);
Algo.clearScenes;
Algo.master(glue: 0.4, gain: 1.3);

// ---- the parts -----------------------------------------------------------------------

// kicks in groups of three across the bar (the 3-3-3-3-4 feel)
~kick = { Algo(\kick, (Pbind(\gain, 1.1, \shape, 0.2) <> "808bd:3 ~ ~ 808bd:3 ~ ~ 808bd:3 ~ ~ 808bd:3 ~ ~ 808bd:3 ~ 808bd:3 ~".mini).dirt) };

~clap = { Algo(\clap, (Pbind(\room, 0.2, \gain, 0.9) <> "~ ~ 808sd:4 ~".mini).dirt(3)) };

// triplet hats: 12 a bar
~hats = { Algo(\hats, (Pbind(\gain, Pseq([0.9, 0.7, 0.75], inf), \cut, 2) <> "808hc*12".mini).dirt(2)) };

// toms: a phrase that swaps toms around, Markov-style, each bar
~tomLine = "808lt ~ 808mt 808lt ~ 808ht ~ 808mt 808lt ~ 808lt 808mt ~ 808ht 808mt ~".evolve(0.35, 4);
~toms = { Algo(\toms, (Pbind(\gain, 0.85, \pan, Pwhite(0.3, 0.7)) <> ~tomLine.mini).dirt(4)) };

// the chopped vocal: one sample, stuttered
~vox = { |n = 3| Algo(\vox, (Pbind(\n, n, \cut, 5, \gain, 0.9, \room, 0.15)
	<> "yeah ~ ~ yeah ~ ~ [yeah yeah yeah] ~ yeah ~ ~ ~ [yeah yeah] ~ ~ ~".mini).dirt(5)) };

// 808 sub, sliding about under the kicks
~sub = { Algo(\sub, (Pbind(\s, \super808, \legato, 0.9, \gain, 0.9, \voice, 0.2)
	<> "<[f1 ~ ~ f1 ~ ~ ab1 ~] [f1 ~ ~ f1 ~ ~ eb1 ~] [db1 ~ ~ db1 ~ ~ eb1 ~] [c1 ~ ~ c1 ~ ~ eb1 ~]>".notes).dirt(1)) };

// ---- the set -------------------------------------------------------------------------------

Algo.scene(\drums, "kicks in threes, clap on 3, triplet hats", { ~kick.(); ~clap.(); ~hats.() });
Algo.move("busier kicks", {
	Algo(\kick, (Pbind(\gain, 1.1) <> "808bd:3 ~ 808bd:3 808bd:3 ~ ~ 808bd:3 ~ 808bd:3 ~ ~ 808bd:3 ~ 808bd:3 808bd:3 ~".mini).dirt) });

Algo.scene(\toms, "toms that rearrange themselves each bar", { ~toms.() });
Algo.move("toms wander more", { ~tomLine.amount = 0.6 });

Algo.scene(\vox, "the chopped vocal", { ~vox.() });
Algo.move("a different word", { ~vox.(8) });
Algo.move("pitch the vocal up", {
	Algo(\vox, (Pbind(\n, 3, \cut, 5, \speed, 1.5) <> "yeah ~ ~ yeah ~ ~ [yeah yeah yeah] ~ yeah ~ ~ ~ [yeah yeah] ~ ~ ~".mini).dirt(5)) });

Algo.scene(\sub, "808 sub under the kicks", { ~sub.() });

Algo.scene(\keys, "soul chords, half the time", {
	Algo(\keys, (Pbind(\s, \superpiano, \legato, 1.2, \room, 0.4, \gain, 0.6, \velocity, 0.6)
		<> "<[f3,ab3,c4,eb4] ~ [db3,f3,ab3,c4] ~>".notes).dirt(6));
});

Algo.scene(\drop, "kick and sub out for a build, back on the 8", {
	Algo.drop(4, 8);
});

Algo.setList;
)

// ---- while it plays ----------------------------------------------------------------------------

Algo.next;
Algo.hint;
Algo.yes;
Algo.stop;
