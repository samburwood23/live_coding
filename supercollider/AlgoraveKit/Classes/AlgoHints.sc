// Hints: ideas for what to change next, shown with the code that does it.
// For when you're mid-set and your mind goes blank, and for learning the moves.
//
//   Algo.hint;     // prints an idea for the current scene, with its code
//   Algo.yes;      // do it
//   Algo.hint;     // another one
//
// Sets add their own ideas to each scene with Algo.move, after the scene:
//   Algo.scene(\riff, "the riff", { ... });
//   Algo.move("open the filter on the riff", { Algo(\riff, ...) });
// Hints also include general moves (mute, solo, mutate, drop, level) using whatever is playing.

+ Algo {

	*move { |desc, func|
		hints.add((scene: scenes.last !? { |s| s[\name] }, desc: desc, func: func));
	}

	*hint {
		var current = scenes[sceneIndex] !? { |s| s[\name] };
		var own = hints.select { |h| h[\scene].isNil or: { h[\scene] == current } };
		var pool = own ++ this.prGeneralMoves;
		var h, code;
		if(pool.isEmpty) { "Algo: nothing playing yet. Try Algo.next; or Algo(\\kick, \"bd*4\");".postln; ^this };
		// the set's own ideas come up more often than the general ones
		h = if(own.notEmpty and: { 0.6.coin }) { own.choose } { pool.choose };
		if(pool.size > 1) { while { h[\desc] == (lastHint !? { |l| l[\desc] }) } { h = pool.choose } };
		lastHint = h;
		code = this.prHintCode(h);
		"\nTry: %\n%\n  -> Algo.yes; to do it, Algo.hint; for another\n".format(h[\desc], code.split($\n).collect { |l| "    " ++ l }.join("\n")).postln;
	}

	*yes {
		var h = lastHint;
		if(h.isNil) { "Algo: no hint yet, run Algo.hint; first".postln; ^this };
		this.prSay("doing: " ++ h[\desc]);
		if(h[\func].notNil) { h[\func].value } { h[\code].interpret };
		lastHint = nil;
	}

	*prHintCode { |h|
		var src;
		if(h[\code].notNil) { ^h[\code] };
		src = h[\func].def.sourceCode;
		if(src.isNil) { ^"(code not available)" };
		// strip the outer { } and the indent
		src = src.copyRange(1, src.size - 2);
		^src.split($\n).collect { |l| l.replace("\t", "  ") }.reject { |l| l.every(_.isSpace) }.join("\n").stripWhiteSpace
	}

	*prGeneralMoves {
		var names = this.playing.reject { |n| muted.includes(n) }.asArray;
		var mutedNames = muted.asArray;
		var pick = { names.choose }, sym = { |n| "\\" ++ n };
		var moves = List.new;
		if(names.size > 1) {
			var n = pick.();
			moves.add((desc: "take the % out for a bit (Algo.unmute brings it back, in time)".format(n), code: "Algo.mute(%);".format(sym.(n))));
			n = pick.();
			moves.add((desc: "solo the %, then bring everything back after a few bars".format(n), code: "Algo.solo(%);\n// later: Algo.unmuteAll;".format(sym.(n))));
		};
		if(names.notEmpty) {
			var n = pick.();
			moves.add((desc: "give the % a random twist".format(n), code: "Algo.mutate(%);\n// Algo.unmutate(%); to undo".format(sym.(n), sym.(n))));
			n = pick.();
			moves.add((desc: "pull the % back in the mix".format(n), code: "Algo.level(%, 0.7);".format(sym.(n))));
			moves.add((desc: "a build and drop: everything comes back on the 8", code: "Algo.drop;"));
			moves.add((desc: "nudge the tempo up", code: "Algo.bpm = %;".format((this.bpm + 3).round)));
		};
		mutedNames.do { |n| moves.add((desc: "bring the % back in".format(n), code: "Algo.unmute(%);".format("\\" ++ n))) };
		if(scenes[sceneIndex + 1].notNil) {
			moves.add((desc: "move on to the next section: " ++ scenes[sceneIndex + 1][\note], code: "Algo.next;"));
		};
		^moves.asArray
	}
}
