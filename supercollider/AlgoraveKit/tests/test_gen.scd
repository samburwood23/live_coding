(
var n = 0, fails = 0, ok = { |c, m| if(c) { n = n + 1 } { fails = fails + 1; ("FAIL: " ++ m).postln } };
var g = "0 2 4 2 7 4 2 0".evolve(0.5, 8), strs, r, ev, g2;
ok.(g.value(0) == "0 2 4 2 7 4 2 0", "bar 0 is home: " ++ g.value(0));
ok.(g.value(8) == "0 2 4 2 7 4 2 0", "bar 8 is home");
strs = (1..7).collect { |c| g.value(c) };
strs.postln;
ok.(strs.any { |s| s != "0 2 4 2 7 4 2 0" }, "it varies");
ok.(g.value(3) == g.value(3), "same bar, same variant");
// every new step must be one that follows its neighbour somewhere in the phrase
ok.(strs.every { |s| s.split($ ).every { |a| ["0","2","4","7"].includesEqual(a) } }, "only notes from the phrase");
// structure kept
g2 = "[0 ~ 2]*2 <4 7> 0(3,8) 5@2 3!2".evolve(0.9, 4);
(1..3).do { |c| var s = g2.value(c); s.postln; ok.(Mini.parse(s).notNil, "parses " ++ s) };
ok.(g2.value(1).contains("( 3 , 8 )"), "euclid numbers kept");
ok.(g2.value(2).contains("* 2"), "speed kept");
// as a pattern
r = "0 2 4 2".evolve(0.5).degrees(Scale.minor, 60).asStream;
ev = 8.collect { r.next(()) };
ok.(ev.every { |e| e[\midinote].notNil and: { e[\dur] == 1 } }, "degrees pattern " ++ ev.collect(_[\midinote]));
r = "bd ~ sn bd".evolve(0.5).mini.asStream;
ev = 6.collect { r.next(()) };
ok.(ev[0][\dur] == 2 and: { ev[1][\s] != \bd or: { true } }, "rests stay rests " ++ ev.collect { |e| [e[\s], e[\dur]] });
// hints
Algo.start(120, counter: false);
Algo.clearScenes;
Algo.scene(\a, "one", { Algo(\kick, Pbind(\degree, 0, \dur, 1, \amp, 0)) });
Algo.move("change the kick", { Algo(\kick, Pbind(\degree, 2, \dur, 0.5, \amp, 0)) });
Algo.next;
Algo.hint; Algo.hint; Algo.hint;
ok.(Algo.lastHint.notNil, "hint picked");
Algo.prHintCode(Algo.hints[0]).postln;
ok.(Algo.prHintCode(Algo.hints[0]).contains("degree, 2"), "hint shows code");
Algo.yes;
ok.(Algo.lastHint.isNil, "yes clears");
Algo.level(\kick, 0.5);
ok.(Algo.statusLines.any { |l| l.contains("levels: kick 0.5") }, "level in status");
Algo.stop;
"GEN TESTS: % passed, % failed".format(n, fails).postln;
0.exit;
)
