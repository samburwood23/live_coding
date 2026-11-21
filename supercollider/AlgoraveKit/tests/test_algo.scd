var pass = 0, fail = 0, log = List.new;
var check = { |name, ok, detail = ""| if(ok) { pass = pass + 1 } { fail = fail + 1; "FAIL % %".format(name, detail).postln } };
var ev = { |s, dur = 1| Pbind(\type, \log, \s, s, \dur, dur) };
var at = { |s| log.select { |e| e[1] == s }.collect(_.first) };
var o, line, wait;
Event.addEventType(\log, { log.add([thisThread.beats, ~s]) });
Algo.rollSound = (type: \log, s: \roll);

fork {
	Algo.start(600, phrase: 4, counter: false);   // 10 beats a second
	o = Algo.origin;
	Algo(\kick, ev.(\bd));
	Algo(\bass, ev.(\bass, 0.5));
	wait = { |beat| (beat - TempoClock.default.beats).max(0).wait };

	// 1. first layers start on bar 1 (the next beat)
	wait.(o + 5);
	check.("first layer starts on bar 1", at.(\bd).first == o, at.(\bd).first - o);

	// 2. a change lands exactly on the next phrase line (bar 5 = beat 16)
	Algo(\kick, ev.(\bd2));
	line = Algo.nextLine;
	check.("next line is bar 5", Algo.barAt(line) == 5, Algo.barAt(line));
	wait.(line + 2);
	check.("old kick plays up to the line", at.(\bd).last == (line - 1), at.(\bd).last - o);
	check.("new kick from the line", at.(\bd2).first == line, at.(\bd2).first - o);

	// 3. mute is instant and keeps the groove: bass stays on its half-beat grid after unmute
	Algo.mute(\bass);
	wait.(TempoClock.default.beats + 3);
	{ var t0 = TempoClock.default.beats, before = at.(\bass).size;
		2.wait.(0); (2 / 10).wait;
	}.value;
	{ var b = TempoClock.default.beats; var n0 = at.(\bass).size; (0.3).wait; check.("muted bass is silent", at.(\bass).size == n0) }.value;
	Algo.unmute(\bass);
	0.3.wait;
	check.("bass back on its grid", at.(\bass).last.notNil and: { ((at.(\bass).last - o) % 0.5) == 0 }, (at.(\bass).last - o));

	// 4. solo and unmute all
	Algo.solo(\kick);
	check.("solo mutes the rest", Algo.muted.includes(\bass) and: { Algo.muted.includes(\kick).not });
	Algo.unmuteAll;

	// 5. drop: 2-bar build that lands on an 8-bar line; kick and bass out during the build
	log.clear;
	Algo.drop(2, 8);
	{ var d = Algo.dropInfo;
		check.("drop lands on an 8-bar line", ((d[\land] - o) % 32) == 0, d[\land] - o);
		check.("build is 2 bars", (d[\land] - d[\start]) == 8);
		wait.(d[\land] + 4.5);
		check.("no kick during the build", at.(\bd2).select { |b| b >= d[\start] and: { b < d[\land] } }.isEmpty);
		check.("no bass during the build", at.(\bass).select { |b| b >= d[\start] and: { b < d[\land] } }.isEmpty);
		check.("kick back on the drop", at.(\bd2).includes(d[\land]));
		check.("roll starts with the build", at.(\roll).first == d[\start], at.(\roll).first - d[\start]);
		check.("roll ends before the drop", at.(\roll).last < d[\land]);
		check.("roll speeds up: 8th notes then 32nds", (at.(\roll)[1] - at.(\roll)[0]) == 0.5 and: { (at.(\roll).last - at.(\roll)[at.(\roll).size - 2]) == 0.125 });
		check.("drop cleared afterwards", Algo.dropInfo.isNil);
	}.value;

	// 6. mutations apply to the next note and come off again
	Algo.mutate(\bass);
	check.("mutation listed", Algo.mutations[\bass].size == 1);
	Algo.unmutate(\bass);
	check.("mutation off", Algo.mutations[\bass].isNil);

	// 7. set list: scenes change layers on the next phrase line
	Algo.scene(\one, "first", { Algo(\kick, ev.(\sceneKick)) });
	Algo.scene(\two, { Algo(\kick, ev.(\scene2Kick)) });
	Algo.next;
	line = Algo.nextLine;
	wait.(line + 1);
	check.("scene 1 lands on the line", at.(\sceneKick).first == line, at.(\sceneKick).first - line);
	check.("scene index", Algo.sceneIndex == 0);
	Algo.next;
	check.("scene 2", Algo.sceneIndex == 1);
	Algo.next;
	check.("end of set stays put", Algo.sceneIndex == 1);

	// 8. tempo change on the next bar
	{ var nb = Algo.nextBar; Algo.bpm = 480; wait.(nb + 0.1); check.("bpm on the bar", TempoClock.default.tempo == 8) }.value;

	// 9. only: stop the others on the next line
	Algo.only(\kick);
	wait.(Algo.nextLine + 1);
	check.("only kick playing", Algo.playing == [\kick], Algo.playing);

	// 10. string shortcut, status lines
	Algo(\hats, "hh*4");
	check.("string layer is a Pdef", Pdef(\hats).source.notNil);
	check.("status lines", Algo.statusLines.size >= 2, Algo.statusLines);

	"ALGO TESTS: % passed, % failed".format(pass, fail).postln;
	Algo.stop;
	0.exit;
};
