var pass = 0, fail = 0;
var check = { |name, got, want|
	if(got == want) { pass = pass + 1 } { fail = fail + 1; "FAIL %\n  got:  %\n  want: %".format(name, got, want).postln };
};
var r = { |str, cyc = 0| Mini.render(Mini.parse(str), cyc).collect { |e| [e[0].round(0.0001), e[1].round(0.0001), e[2]] } };
var texts = { |str, cyc = 0| r.(str, cyc).collect { |e| e[2] } };
var starts = { |str, cyc = 0| r.(str, cyc).collect { |e| e[0] } };

check.("steps", r.("bd ~ sd ~"), [[0, 0.25, "bd"], [0.5, 0.25, "sd"]]);
check.("fast", starts.("hh*4"), [0, 0.25, 0.5, 0.75]);
check.("group", r.("bd [sd sd]"), [[0, 0.5, "bd"], [0.5, 0.25, "sd"], [0.75, 0.25, "sd"]]);
check.("alt cycle 0..4", (0..4).collect { |c| texts.("<a b c>", c) }, [["a"], ["b"], ["c"], ["a"], ["b"]]);
check.("stack", texts.("bd*2, hh*4").sort, ["bd", "bd", "hh", "hh", "hh", "hh"]);
check.("euclid 3,8", starts.("bd(3,8)"), [0, 0.375, 0.75]);
check.("bjorklund 3,8 / 7,16", [Mini.bjorklund(3, 8), Mini.bjorklund(7, 16)], [[1,0,0,1,0,0,1,0], [1,0,0,1,0,1,0,1,0,0,1,0,1,0,1,0]]);
check.("euclid rotated", starts.("bd(3,8,2)"), [0.125, 0.5, 0.75]);
check.("replicate", texts.("bd!3 sd"), ["bd", "bd", "bd", "sd"]);
check.("weight", r.("bd@3 sd"), [[0, 0.75, "bd"], [0.75, 0.25, "sd"]]);
check.("slow", (0..1).collect { |c| r.("[a b]/2", c) }, [[[0, 1, "a"]], [[0, 1, "b"]]]);
check.("offbeats string", "c2 ab1".offbeats, "<[[~ c2]*4] [[~ ab1]*4]>");
check.("offbeats render", (0..1).collect { |c| r.("c2 ab1".offbeats, c).collect { |e| [e[0], e[2]] } },
	[[[0.125, "c2"], [0.375, "c2"], [0.625, "c2"], [0.875, "c2"]], [[0.125, "ab1"], [0.375, "ab1"], [0.625, "ab1"], [0.875, "ab1"]]]);
check.("nested alt in fast", (0..1).collect { |c| texts.("<a b>*2", c) }, [["a", "b"], ["a", "b"]]);
check.("chord", r.("[c2,e2,g2] ~"), [[0, 0.5, "c2"], [0, 0.5, "e2"], [0, 0.5, "g2"]]);
check.("notes", ["c4", "a4", "c2", "eb2", "f#3", "c", "60", "bb1"].collect { |n| Mini.noteToMidi(n) }, [60, 69, 36, 39, 54, 48, 60, 34]);
check.("bjorklund 5,8", Mini.bjorklund(5, 8), [1, 0, 1, 1, 0, 1, 1, 0]);

// streams: durations add up to 4 beats a bar, rests where nothing plays
{
	var s = "bd ~ sd".mini.asStream, evs = Array.fill(4, { s.next(()) });
	check.("mini stream (thirds of a bar)", evs.collect { |e| [e[\s], (e[\dur] * 3).round.asInteger, e[\type]] },
		[[\bd, 8, nil], [\sd, 4, nil], [\bd, 8, nil], [\sd, 4, nil]]);
	s = "~ bd:3".mini.asStream; evs = Array.fill(2, { s.next(()) });
	check.("leading rest + n", evs.collect { |e| [e[\type], e[\s], e[\n], e[\dur]] }, [[\rest, nil, nil, 2.0], [nil, \bd, 3.0, 2.0]]);
	s = "c2 [e2,g2]".notes.asStream; evs = Array.fill(3, { s.next(()) });
	check.("notes stream", evs.collect { |e| [e[\midinote], e[\note], e[\dur], e[\sustain]] }, [[36, -24, 2.0, 2.0], [40, -20, 0.0, 2.0], [43, -17, 2.0, 2.0]]);
	s = "0 15".splice(16, \breaks165).asStream; evs = Array.fill(2, { s.next(()) });
	check.("splice", evs.collect { |e| [e[\s], e[\begin], e[\end], e[\unit], e[\speed].round(0.001)] },
		[[\breaks165, 0.0, 1/16, \c, 0.125], [\breaks165, 15/16, 1.0, \c, 0.125]]);
	s = "bd*4, hh*8".mini.asStream; evs = Array.fill(12, { s.next(()) });
	check.("stack stream total time", evs.sum { |e| e[\delta] ? e[\dur] }, 4.0);
}.value;
try { Mini.parse("bd [sd") } { |e| check.("error message", e.errorString.contains("Mini"), true) };

"MINI TESTS: % passed, % failed".format(pass, fail).postln;
0.exit;
