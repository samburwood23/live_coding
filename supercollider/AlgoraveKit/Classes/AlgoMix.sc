// Mix and sound: per-layer levels, a master glue compressor + limiter, sidechain pump,
// and the kit's own SuperDirt synths (an acid 303).
//
//   Algo.level(\bass, 0.8)        // layer volume: 1 is as written. Instant
//   Algo.master                   // glue compressor + limiter on everything
//   Algo.master(glue: 0.8, gain: 1.5)
//   Algo.master(false)            // off
//   Algo.pump(0.6)                // everything except the kick ducks on each kick
//   Algo.pump(0.6, 0.5, \kick, [0])  // depth, release in beats, trigger layer, orbits left alone
//   Algo.pump(0)                  // off
//
// The pump works by routing every SuperDirt orbit except the `keep` ones (the kick's
// orbit, 0 by default) through a bus that ducks each time the trigger layer plays.
// So keep the kick on its own orbit: .dirt (orbit 0), everything else .dirt(1), .dirt(2)...

+ Algo {

	*level { |name, gain|
		if(gain.isNil) { levels.removeAt(name) } { levels[name] = gain };
		this.prSay("% level %".format(name, gain ? 1));
	}

	*master { |on = true, glue = 0.5, gain = 1.3, limit = 0.95|
		masterSettings = if(on) { (glue: glue, makeup: gain, limit: limit) } { nil };
		this.prUpdateMaster;
		this.prSay(if(on) { "master: glue % gain % limit %".format(glue, gain, limit) } { "master off" });
	}

	*pump { |depth = 0.6, release = 0.5, from = \kick, keep|
		pumpDepth = depth.clip(0, 1);
		pumpRelease = release;
		pumpFrom = from;
		pumpKeep = keep ?? { pumpKeep } ?? { [0] };
		this.prRouteOrbits;
		this.prUpdateMaster;
		this.prSay(if(pumpDepth > 0) {
			"pump: everything but orbit % ducks % on each %, back over % beats".format(pumpKeep.join(", "), depth, from, release)
		} { "pump off" });
	}

	// ---- internals --------------------------------------------------------------------

	*prResetMix {
		var wasPumping = pumpDepth > 0;
		pumpDepth = 0; masterSettings = nil;
		if(wasPumping and: { this.dirtReady(this.liveDirt) }) { this.prRouteOrbits };
		this.prUpdateMaster;
	}

	*prMasterNeeded { ^masterSettings.notNil or: { pumpDepth > 0 } }

	*prUpdateMaster {
		var server = Server.default;
		if(server.serverRunning.not) { ^this };
		if(this.prMasterNeeded.not) {
			masterSynth !? { masterSynth.free; masterSynth = nil; masterReady = false };
			^this
		};
		if(masterTreeAdded.not) {
			masterTreeAdded = true;
			// Ctrl+. frees every synth: bring the master back with SuperDirt's
			ServerTree.add({ |srv| if(this.prMasterNeeded and: { srv == Server.default }) { masterSynth = nil; masterReady = false; { this.prUpdateMaster }.defer(0.2) } }, server);
		};
		pumpBus = pumpBus ?? { Bus.audio(server, 2) };
		if(masterSynth.isNil or: { masterSynth.isPlaying.not }) {
			// make sure the SynthDef has landed on the server before starting it
			masterSynth = Synth.basicNew(\algoMaster, server);
			masterReady = false;
			NodeWatcher.register(masterSynth, true);
			fork {
				this.prAddMixSynths;
				server.sync;
				// right after the default group, where SuperDirt lives, and before anything that records the output
				server.sendMsg(*masterSynth.newMsg(server.defaultGroup, [\pumpBus, pumpBus.index] ++ this.prMasterArgs, \addAfter));
				server.sync;
				masterReady = true;
			};
		} {
			// (if it's still being created, it picks up the latest settings when it starts)
			if(masterReady) { masterSynth.set(*this.prMasterArgs) };
		};
	}

	*prMasterArgs {
		var m = masterSettings;
		^[
			\depth, pumpDepth,
			\glue, m !? { m[\glue] } ? 0,
			\makeup, m !? { m[\makeup] } ? 1,
			\limit, m !? { m[\limit] } ? 0.98
		]
	}

	*prRouteOrbits {
		var d = this.liveDirt, server = Server.default;
		if(this.dirtReady(d).not) { "Algo: start SuperDirt first, then call Algo.pump again".warn; ^this };
		pumpBus = pumpBus ?? { Bus.audio(server, 2) };
		d.orbits.do { |orbit, i|
			var target = if(pumpDepth > 0 and: { pumpKeep.includes(i).not }) { pumpBus.index } { 0 };
			if(orbit.respondsTo(\outBus_) and: { orbit.outBus != target }) { orbit.outBus = target };
		};
		// the master has to stay after SuperDirt's synths, or it reads the pump bus before they write to it
		masterSynth !? { |m| if(masterReady) { m.moveAfter(server.defaultGroup) } };
	}

	*prPumpHit {
		var server = Server.default;
		if(masterReady) {
			server.sendBundle(server.latency, [\n_set, masterSynth.nodeID, \t_duck, 1, \rel, pumpRelease / clock.tempo]);
		}
	}

	*prAddMixSynths {
		SynthDef(\algoMaster, { |pumpBus, depth = 0, rel = 0.25, t_duck = 0, glue = 0, makeup = 1, limit = 0.98|
			var main = In.ar(0, 2);
			var pumped = In.ar(pumpBus, 2);
			// a quick dip, then a curved swell back up: the classic pump
			var duck = EnvGen.kr(Env([1, 1 - depth, 1], [0.006, rel], [-3, 2.5]), t_duck);
			var sig = main + (pumped * duck);
			// glue: gentle 3:1 compression that pulls the layers together
			var squashed = Compander.ar(sig, sig, 0.35, 1, 1/3, 0.01, 0.12) * (1 + glue);
			sig = XFade2.ar(sig, squashed, glue * 2 - 1) * makeup;
			sig = LeakDC.ar(sig);
			ReplaceOut.ar(0, Limiter.ar(sig, limit, 0.005));
		}).add;
	}

	*prAddDirtSynths {
		var panner = \DirtPan.asClass, fscale = \DirtFreqScale.asClass;
		var numChannels = this.liveDirt !? { |d| d.numChannels } ? 2;
		if(panner.isNil) { ^this };

		// acid: a 303-style squelch. Parameters (all optional):
		//   ctf     filter base, Hz (300)      res     resonance 0..1 (0.8)
		//   envmod  filter envelope, Hz (3000) decay   envelope decay, s (0.25)
		//   accent  0..1: louder, brighter     wave    0 saw, 1 square
		//   slide   set by .glide: slides in from the previous note
		SynthDef(\algo303, { |out, sustain = 0.25, pan = 0, freq = 110, speed = 1, accelerate = 0,
			ctf = 300, res = 0.8, envmod = 3000, decay = 0.25, accent = 0, wave = 0, glide = 0, prevfreq = 0|
			var f = freq * fscale.kr(speed, accelerate, sustain);
			var from = Select.kr(prevfreq > 0, [f, prevfreq]);
			var fr = Select.kr(glide > 0, [f, EnvGen.kr(Env([from, f], [glide.max(0.001)], \exp))]);
			var env = EnvGen.ar(Env.linen(0.002, 1, 0.01, 1, -2), timeScale: sustain, doneAction: 2);
			var fenv = EnvGen.kr(Env.perc(0.001, decay * (1 - (accent * 0.4)), 1, -4)) * envmod * (1 + accent);
			var osc = SelectX.ar(wave.lag(0.01), [Saw.ar(fr), Pulse.ar(fr, 0.5)]);
			var sig = RLPF.ar(osc, (ctf + fenv).clip(40, 16000), (1.05 - res).clip(0.05, 1));
			sig = (sig * (1.5 + accent)).tanh * (0.45 + (accent * 0.25));
			OffsetOut.ar(out, panner.ar(sig, numChannels, pan, env));
		}).add;
	}
}

+ Pattern {
	// 303 slides: steps with \slide set to 1 glide in from the note before.
	//   (Pbind(\s, \algo303, \slide, Pseq([0, 0, 1, 0], inf)) <> "c2 c3 eb3 c2".notes).glide.dirt
	glide { |time = 0.06|
		var last;
		^this.collect { |e|
			if(e.isKindOf(Event) and: { e[\type] != \rest }) {
				var midi = e[\midinote];
				if((e[\slide] ? 0) > 0 and: { last.notNil }) {
					e[\prevfreq] = last.midicps;
					e[\glide] = time;
					e[\legato] = (e[\legato] ? 1).max(1.05); // tie into the note
				};
				midi !? { last = midi };
			};
			e
		}
	}
}
