// Shortcuts for typing patterns live.

+ String {
	// "bd*4, ~ cp" -> sound events (\s, \n)
	mini { ^Mini.sounds(this) }

	// "c2 eb2 <g2 bb2>" -> note events (\midinote, \note)
	notes { ^Mini.notes(this) }

	// "0 1 2 3 ...".splice(16, \breaks165) -> slices of a sample, each fitted to its step
	splice { |slices = 16, sample = \breaks165| ^Mini.splice(this, slices, sample) }

	// "0 2 4".degrees(Scale.minor, 60) -> scale degrees from a root note
	degrees { |scale, root = 60| ^Mini.degrees(this, scale, root) }

	// one word per bar, played on a rhythm (x marks the hits):
	// "c4 ab3".perBar("x ~ ~ x ~ ~ x ~") -> "<[c4 ~ ~ c4 ~ ~ c4 ~] [ab3 ~ ~ ab3 ~ ~ ab3 ~]>"
	perBar { |rhythm = "x"|
		^"<" ++ this.split($ ).reject(_.isEmpty).collect { |w| "[" ++ rhythm.replace("x", w) ++ "]" }.join(" ") ++ ">"
	}

	// "c2 ab1 bb1 g1".offbeats -> one note per bar, on every offbeat (the makina bajo)
	offbeats { ^this.perBar("[~ x]*4") }
}

+ Pattern {
	// Play through SuperDirt: sets the event type, the tempo SuperDirt needs (\cps),
	// and turns \sustain from beats into seconds. Put it last, after any Pbind of settings:
	//   (Pbind(\s, \supersaw, \legato, 0.5) <> "c2 ab1".notes).dirt
	dirt { |orbit = 0|
		^this.collect { |e|
			if(e.isKindOf(Event) and: { e[\type] != \rest }) {
				var tempo = thisThread.clock.tryPerform(\tempo) ? 1;
				e[\type] = \dirt;
				e[\orbit] = e[\orbit] ? orbit;
				e[\cps] = tempo / 4;
				// SuperDirt's own default is 0.4; otherwise the Event default of 0.1 applies (12 dB quieter)
				e[\amp] = e[\amp] ? 0.4;
				if(Algo.dirt.notNil and: { e[\dirt].isNil }) { e[\dirt] = Algo.dirt };
				// legato (as in Tidal) shortens or stretches the step; SuperDirt wants seconds
				if(e[\legato].notNil and: { e[\len].notNil }) { e[\sustain] = e[\len] * e[\legato] };
				if(e[\sustain].notNil) { e[\sustain] = e[\sustain] / tempo };
			};
			e
		}
	}
}
