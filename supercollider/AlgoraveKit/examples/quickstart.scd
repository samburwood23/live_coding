// ALGORAVE KIT QUICKSTART
// Evaluate one line or block at a time (Ctrl+Enter / Shift+Enter).
// Needs SuperDirt running (SuperDirt.start, or tidal/superdirt_startup.scd).

// 1. Start the clock: 140 BPM, changes land on 4-bar lines, the bar counter opens.
Algo.start(140);

// 2. Layers. A string is Strudel/Tidal mini-notation for SuperDirt sounds.
//    Re-evaluate a line to change it: the new version lands on the next line.
Algo(\kick, "bd*4");
Algo(\hats, "[~ hh]*4");
Algo(\snare, "~ sn:3 ~ sn:3");
Algo(\perc, "<bd(3,8) bd(5,8,2)>");   // euclid, alternating per bar

// mini-notation: ~ rest   [a b] subdivide   <a b> one per bar   a*2 faster
//                a/2 slower   a!3 repeat   a@3 longer   a? sometimes
//                a(3,8) euclid   [a,b] stack   bd:3 sample number

// 3. Anything Pbind can do goes in front with <>. Put .dirt last.
Algo(\hats, (Pbind(\gain, Pwhite(0.7, 1.0), \pan, Pwhite(0.3, 0.7)) <> "hh*16".mini).dirt);

// 4. Notes and synths. c4 is middle C, bare names are octave 3.
Algo(\bass, (Pbind(\s, \supersaw, \legato, 0.5, \cutoff, 1200) <> "c2 ab1 bb1 g1".offbeats.notes).dirt(1));

// scale degrees (0 is the root)
Algo(\lead, (Pbind(\s, \superpiano, \legato, 0.8) <> "0 2 4 <7 6> ~ 4 2 ~".degrees(Scale.minor, 60)).dirt(2));

// one chord per bar, in a rhythm
Algo(\stabs, (Pbind(\s, \supersaw, \legato, 0.3, \gain, 0.6)
	<> "[c4,eb4,g4] [ab3,c4,eb4]".perBar("x ~ ~ x ~ ~ x ~").notes).dirt(3));

// sliced breaks: 16 slices, stretched to the tempo
Algo(\break, "0 1 <2 2*2> 3 4 5 6 7".splice(8, \breaks165).dirt);

// 5. Live tools
Algo.mute(\kick);        Algo.unmute(\kick);    // instant, stays in time
Algo.solo(\break);       Algo.unmuteAll;
Algo.toggle(\hats);
Algo.only(\kick, \bass); // stop the rest on the next line
Algo.stopLayer(\lead);
Algo.mutate(\stabs);     Algo.unmutate;         // random twists
Algo.drop;               // filter build + snare roll, back in on the 8
Algo.bpm = 150;          // on the next bar
Algo.phrase = 8;         // changes now land on 8-bar lines
Algo.status;             // what's playing, what's muted
Algo.counter;            // reopen the bar counter
Algo.announce = true;    // print bar changes in the post window

// 6. Scenes: a set list you step through
(
Algo.clearScenes;
Algo.scene(\a, "just drums", { Algo.only(\kick, \hats) ; Algo(\kick, "bd*4"); Algo(\hats, "[~ hh]*4") });
Algo.scene(\b, "add the bass", { Algo(\bass, (Pbind(\s, \supersaw, \legato, 0.5) <> "c2 ab1".offbeats.notes).dirt(1)) });
Algo.setList;
)
Algo.next;  Algo.prev;  Algo.go(\a);

// 7. Stop
Algo.stop;   // or Ctrl+. (CmdPeriod)
