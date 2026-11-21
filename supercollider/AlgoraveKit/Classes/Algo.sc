// Algorave Kit: live coding tools for SuperCollider.
//
//   Algo.start(175);                              // tempo, bar 1 starts now, phrase lines every 4 bars
//   Algo(\kick, "hardkick*4".mini.dirt);          // a layer: starts (or changes) on the next phrase line
//   Algo(\bass, Pbind(\s, \supersaw) <> "c2 ab1 bb1 g1".offbeats.notes.dirt);
//   Algo.mute(\bass); Algo.unmute(\bass); Algo.solo(\kick); Algo.unmuteAll;
//   Algo.drop;                                    // build + snare roll, everything back on the 8-bar line
//   Algo.mutate(\bass); Algo.unmutate(\bass);     // a random twist, and back
//   Algo.scene(\intro, "start soft", { ... }); Algo.next;  // the set list
//   Algo.bpm = 180;                               // tempo change on the next bar
//   Algo.counter;                                 // the bar counter window
//
// One cycle is one bar of 4 beats, as in Strudel and Tidal.

Algo {
	classvar <clock, <origin = 0, <phraseBars = 4, <beatsPerBar = 4;
	classvar <>dirt, <layers, <muted, <mutations, <mutationList;
	classvar <scenes, <sceneIndex = -1, <dropInfo, <>dropMutes;
	classvar <>announce = false, <lastMessage = "", <>rollSound;
	classvar counterWindow, counterSkip, announceSkip;

	*initClass {
		layers = IdentityDictionary.new;
		muted = IdentitySet.new;
		mutations = IdentityDictionary.new;
		scenes = List.new;
		dropMutes = [\kick, \bass, \bombo, \bajo, \sub, \reese, \jungbass, \bd];
		mutationList = [
			(name: "degrade", func: { |e| if(0.25.coin) { e.put(\type, \rest) }; e }),
			(name: "octave up on beat 4", func: { |e, beat| if(this.prBeatInBar(beat) >= 3) { this.prTranspose(e, 12) }; e }),
			(name: "fifth up sometimes", func: { |e| if(0.25.coin) { this.prTranspose(e, 7) }; e }),
			(name: "accents", func: { |e, beat|
				var a = [1.15, 0.75, 0.9, 0.8].wrapAt((this.prBeatInBar(beat) * 2).floor.asInteger);
				if(e[\type] == \dirt) { e[\gain] = (e[\gain] ? 1) * a } { e[\amp] = (e[\amp] ? 0.1) * a }; e }),
			(name: "echo", func: { |e| e[\delay] = 0.35; e[\delaytime] = 0.1875; e[\lock] = 1; e[\delayfeedback] = 0.45; e }),
			(name: "crush", func: { |e| if(0.35.coin) { e[\crush] = 5 }; e }),
			(name: "filter wobble", func: { |e, beat| e[\cutoff] = sin(beat * pi / 2).linexp(-1, 1, 400, 5000); e[\resonance] = 0.25; e }),
			(name: "ping-pong", func: { |e, beat| e[\pan] = if((beat * 2).round.asInteger.even) { 0.15 } { 0.85 }; e }),
			(name: "drop the last beat", func: { |e, beat| if(this.prBeatInBar(beat) >= 3) { e.put(\type, \rest) }; e }),
			(name: "double speed sometimes", func: { |e| if(0.2.coin) { e[\speed] = (e[\speed] ? 1) * 2 }; e })
		];
		Class.initClassTree(TempoClock);
		Class.initClassTree(CmdPeriod);
		clock = TempoClock.default;
		CmdPeriod.add(this);
	}

	// ---- tempo and the bar grid ------------------------------------------------------

	*start { |bpm = 120, phrase = 4, dirtInstance, counter = true|
		var sd = \SuperDirt.asClass;
		clock = TempoClock.default;
		dirt = dirtInstance ?? { topEnvironment[\dirt] } ?? { sd !? { sd.default } };
		if(sd.notNil and: { dirt.notNil } and: { sd.default.isNil }) { sd.default = dirt };
		clock.tempo = bpm / 60;
		origin = clock.nextTimeOnGrid(1); // bar 1 starts on the next beat
		phraseBars = phrase;
		this.prSetQuant;
		this.prAddSynths;
		if(counter and: { \Window.asClass.notNil }) { { this.counter }.defer };
		this.prSay("% BPM, bar 1 starts now, changes land every % bars%".format(
			bpm, phrase, if(dirt.notNil) { ", playing through SuperDirt" } { "" }));
	}

	*prSetQuant {
		var q = phraseBars * beatsPerBar;
		Pdef.defaultQuant = Quant(q, origin % q);
		Pdef.all.do { |p| p.quant = nil }; // use the default
	}

	// tempo change on the next bar line
	*bpm_ { |bpm|
		var at = this.nextBar;
		clock.schedAbs(at, { clock.tempo = bpm / 60; nil });
		this.prSay("% BPM from bar %".format(bpm, this.barAt(at)));
	}
	*bpm { ^clock.tempo * 60 }

	*phrase_ { |bars| phraseBars = bars; this.prSetQuant; this.prSay("changes land every % bars".format(bars)) }

	*bar { ^this.barAt(clock.beats) }
	*position { ^if(this.bar < 1) { "count-in" } { "%.%".format(this.bar, this.beatInBar) } }
	*barAt { |beat| ^((beat - origin) / beatsPerBar).floor.asInteger + 1 }
	*beatInBar { ^this.prBeatInBar(clock.beats).floor.asInteger + 1 }
	*prBeatInBar { |beat| ^(beat - origin) % beatsPerBar }
	*nextBar { ^this.prNextGrid(beatsPerBar) }
	*nextLine { ^this.prNextGrid(phraseBars * beatsPerBar) }
	*prNextGrid { |q| ^clock.nextTimeOnGrid(q, origin % q) }

	// ---- layers -----------------------------------------------------------------------

	// Algo(\name, pattern): define or change a layer. A new layer starts on the next phrase
	// line; a change to a playing one lands on the next phrase line too. A string is read as
	// mini-notation sounds through SuperDirt: Algo(\kick, "bd*4").
	*new { |name, pattern| ^this.layer(name, pattern) }

	*layer { |name, pattern|
		var pdef;
		if(pattern.isString) { pattern = if(dirt.notNil) { pattern.mini.dirt } { pattern.mini } };
		layers[name] = pattern;
		pdef = Pdef(name, this.prWrap(name, pattern));
		if(pdef.isPlaying.not) {
			pdef.play(clock);
			this.prSay("% starts on bar %".format(name, this.barAt(this.nextLine)));
		} {
			this.prSay("% changes on bar %".format(name, this.barAt(this.nextLine)));
		};
		^pdef
	}

	// every event of a layer passes through here: mutes, the drop and mutations
	// apply on the very next note, without restarting the pattern
	*prWrap { |name, pattern|
		^pattern.collect { |e| this.prFilter(name, e, thisThread.beats) }
	}

	*prFilter { |name, e, beat|
		var d = dropInfo;
		if(e.isKindOf(Event).not or: { e[\type] == \rest }) { ^e };
		if(muted.includes(name)) { ^e.put(\type, \rest) };
		if(d.notNil and: { beat >= d[\start] } and: { beat < d[\land] }) {
			if(this.prDropMutes(name)) { ^e.put(\type, \rest) };
			e[\hcutoff] = (beat - d[\start]).linexp(0, d[\land] - d[\start], 150, 3000); // SuperDirt high-pass sweep
		};
		mutations[name] !? { |list| list.do { |m| e = m[\func].(e, beat) } };
		^e
	}

	*prDropMutes { |name|
		var n = name.asString.toLower;
		^dropMutes.any { |m| n.contains(m.asString.toLower) }
	}

	*prTranspose { |e, semis|
		if(e[\note].notNil or: { e[\midinote].notNil }) {
			e[\note] !? { e[\note] = e[\note] + semis };
			e[\midinote] !? { e[\midinote] = e[\midinote] + semis };
		} {
			e[\speed] = (e[\speed] ? 1) * (2 ** (semis / 12));
		};
		^e
	}

	*playing { ^layers.keys.asArray.select { |n| Pdef(n).isPlaying }.sort }

	// stop every layer not named, on the next phrase line
	*only { |...names|
		var at = this.nextLine;
		clock.schedAbs(at, { layers.keys.do { |n| if(names.includes(n).not) { Pdef(n).stop } }; nil });
		this.prSay("only % from bar %".format(names.join(", "), this.barAt(at)));
	}

	*stopLayer { |name|
		var at = this.nextLine;
		clock.schedAbs(at, { Pdef(name).stop; nil });
		this.prSay("% stops on bar %".format(name, this.barAt(at)));
	}

	*stop {
		Pdef.all.do(_.stop);
		dropInfo = nil;
		this.prSay("stopped");
	}

	*cmdPeriod { dropInfo = nil }

	// ---- mute / solo (instant, on the next note) -------------------------------------------

	*mute { |...names| names.do { |n| muted.add(n) }; this.prSay("muted " ++ names.join(", ")) }
	*unmute { |...names| names.do { |n| muted.remove(n) }; this.prSay("unmuted " ++ names.join(", ")) }
	*toggle { |name| if(muted.includes(name)) { this.unmute(name) } { this.mute(name) } }
	*solo { |name|
		muted.clear;
		layers.keys.do { |n| if(n != name) { muted.add(n) } };
		this.prSay("solo " ++ name);
	}
	*unmuteAll { muted.clear; this.prSay("everything unmuted") }

	// ---- mutator -------------------------------------------------------------------------

	*mutate { |name|
		var have = (mutations[name] ? []).collect { |m| m[\name] };
		var m = mutationList.reject { |x| have.includesEqual(x[\name]) }.choose;
		if(layers[name].isNil) { ^this.prSay("no layer called %".format(name)) };
		if(m.isNil) { ^this.prSay("% already has every mutation".format(name)) };
		mutations[name] = (mutations[name] ? []).add(m);
		this.prSay("% + %".format(name, m[\name]));
	}

	*unmutate { |name|
		if(name.isNil) { mutations.clear; this.prSay("all mutations off") } {
			mutations[name] = nil; this.prSay("% back to normal".format(name))
		}
	}

	// ---- drop ---------------------------------------------------------------------------------

	// From the right bar, filter up, take the kick and bass out (any layer whose name contains
	// a word in Algo.dropMutes) and roll a snare; everything comes back on a landEvery-bar line.
	*drop { |buildBars = 4, landEvery = 8|
		var bpb = beatsPerBar, build = buildBars * bpb, grid = landEvery * bpb;
		var land = clock.nextTimeOnGrid(grid, origin % grid), start, info;
		while { (land - build) < (clock.beats + 0.25) } { land = land + grid };
		start = land - build;
		info = (start: start, land: land);
		dropInfo = info;
		clock.schedAbs(start, { this.prRoll(buildBars).play(clock, quant: 0); nil });
		clock.schedAbs(land + 1, { if(dropInfo === info) { dropInfo = nil }; nil });
		this.prSay("build from bar %, DROP on bar %".format(this.barAt(start), this.barAt(land)));
	}

	*prRoll { |bars|
		var durs = if(bars >= 4) {
			(1 ! 8) ++ (0.5 ! 8) ++ (0.25 ! 8) ++ (0.125 ! 16) // quarters, 8ths, 16ths, 32nds over 4 bars
		} {
			(0.5 ! 8) ++ (0.25 ! 8) ++ (0.125 ! 16)
		};
		// Algo.rollSound = (type: \dirt, s: \realclaps) to change it
		var sound = rollSound ?? { if(dirt.notNil) { (type: \dirt, s: \sn, n: 7, dirt: dirt) } { (instrument: \algoSnare) } };
		^Pbind(
			\dur, Pseq(durs),
			\speed, Pseries(1, 0.8 / durs.size, durs.size),
			\gain, Pseries(0.85, 0.2 / durs.size, durs.size),
			\amp, Pseries(0.15, 0.15 / durs.size, durs.size),
			\cps, Pfunc { clock.tempo / 4 }
		) <> sound
	}

	*prAddSynths {
		var server = Server.default;
		if(server.serverRunning) {
			SynthDef(\algoSnare, { |out = 0, amp = 0.2, speed = 1, pan = 0|
				var env = EnvGen.ar(Env.perc(0.001, 0.12), doneAction: 2);
				var sig = (WhiteNoise.ar(0.7) + SinOsc.ar(190 * speed, 0, 0.5)) * env * amp;
				Out.ar(out, Pan2.ar(sig, pan));
			}).add;
		}
	}

	// ---- set list ------------------------------------------------------------------------------

	// Algo.scene(\intro, "start soft", { Algo(\kick, ...) })   (the note is optional)
	*scene { |name, note, func|
		var i;
		if(note.isKindOf(Function)) { func = note; note = "" };
		i = scenes.detectIndex { |s| s[\name] == name };
		if(i.notNil) { scenes[i] = (name: name, note: note ? "", func: func) } {
			scenes.add((name: name, note: note ? "", func: func))
		};
	}

	*next { this.go(sceneIndex + 1) }
	*prev { this.go(sceneIndex - 1) }

	*go { |which|
		var i = if(which.isNumber) { which } { scenes.detectIndex { |s| s[\name] == which } }, s;
		if(i.isNil or: { i < 0 } or: { i >= scenes.size }) {
			^this.prSay(if(scenes.isEmpty) { "no scenes yet: Algo.scene(\\name, \"note\", { ... })" } { "end of the set" })
		};
		sceneIndex = i;
		s = scenes[i];
		this.prSay("scene % / %: %%".format(i + 1, scenes.size, s[\name], if(s[\note].size > 0) { " (" ++ s[\note] ++ ")" } { "" }));
		s[\func].value;
	}

	*clearScenes { scenes.clear; sceneIndex = -1 }

	*setList {
		scenes.do { |s, i| "% %. % %".format(if(i == sceneIndex) { "▶" } { " " }, i + 1, s[\name], s[\note]).postln };
	}

	// ---- status ------------------------------------------------------------------------------

	*statusLines {
		var lines = List.new, toLine = this.barAt(this.nextLine) - this.bar;
		var cur = scenes[sceneIndex], nxt = scenes[sceneIndex + 1], d = dropInfo;
		lines.add("% BPM · next change lands in % bar%".format(this.bpm.round(0.1), toLine.max(0), if(toLine == 1) { "" } { "s" }));
		if(d.notNil) {
			if(clock.beats < d[\start]) { lines.add("build in % bars".format(((d[\start] - clock.beats) / beatsPerBar).ceil.asInteger)) } {
				lines.add("DROP in % bars".format(((d[\land] - clock.beats) / beatsPerBar).ceil.asInteger))
			}
		};
		if(cur.notNil) { lines.add("scene %/%: % %".format(sceneIndex + 1, scenes.size, cur[\name], cur[\note])) };
		if(nxt.notNil) { lines.add("next: % %".format(nxt[\name], nxt[\note])) };
		lines.add("playing: " ++ this.playing.reject { |n| muted.includes(n) }.join(", "));
		if(muted.notEmpty) { lines.add("muted: " ++ muted.asArray.sort.join(", ")) };
		mutations.keysValuesDo { |n, list| if(list.notEmpty) { lines.add("% + %".format(n, list.collect { |m| m[\name] }.join(", "))) } };
		^lines.asArray
	}

	*status {
		("bar " ++ this.position).postln;
		this.statusLines.do(_.postln);
	}

	// the bar counter window
	*counter {
		var w, big, info;
		if(counterWindow.notNil and: { counterWindow.isClosed.not }) { ^counterWindow.front };
		w = Window("Algorave Kit", Rect(80, 80, 460, 280)).front;
		w.background = Color.black;
		big = StaticText(w, Rect(14, 8, 430, 80)).font_(Font.monospace(56)).stringColor_(Color.white);
		info = StaticText(w, Rect(14, 92, 430, 180)).font_(Font.monospace(15)).stringColor_(Color.grey(0.85)).align_(\topLeft);
		counterWindow = w;
		counterSkip.stop;
		counterSkip = SkipJack({
			big.string = this.position;
			info.string = this.statusLines.join("\n");
		}, 0.1, { w.isClosed }, "AlgoCounter");
		^w
	}

	*prSay { |s|
		lastMessage = s;
		("Algo: " ++ s).postln;
	}
}
