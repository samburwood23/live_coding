(
var p, ev, r, n=0, ok = { |c, m| if(c) { n = n+1 } { ("FAIL: " ++ m).postln } };
r = "0 2 4 7".degrees(Scale.minor, 60).asStream;
ev = 4.collect { r.next(()) };
ok.(ev.collect(_[\midinote]) == [60, 63, 67, 72], "degrees " ++ ev.collect(_[\midinote]));
ok.("c2 ab1".offbeats == "<[[~ c2]*4] [[~ ab1]*4]>", "offbeats " ++ "c2 ab1".offbeats);
ok.("a b".perBar("x ~") == "<[a ~] [b ~]>", "perBar");
r = "c2 ab1".offbeats.notes.asStream;
ev = 3.collect { r.next(()) };
("offbeat evs: " ++ ev.collect { |e| [e[\type], e[\midinote], e[\dur]] }).postln;
r = "[c4,eb4,g4] [ab3,c4,eb4]".perBar("x ~ ~ x ~ ~ x ~").notes.asStream;
ev = r.next(()); ("stab ev: " ++ ev).postln;
r = (Pbind(\s, \supersaw, \legato, 0.5) <> "c2 ab1".notes).dirt.asStream;
ev = r.next(()); ("dirt ev: " ++ ev).postln;
ok.(ev[\type] == \dirt and: { ev[\sustain].notNil }, "dirt legato");
("PASSED " ++ n ++ "/4").postln;
0.exit;
)
