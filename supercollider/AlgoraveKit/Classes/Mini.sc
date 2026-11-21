// Mini-notation for SuperCollider, after Tidal / Strudel.
// One cycle is one bar of 4 beats.
//
//   "bd ~ sd ~"        steps share the bar; ~ is a rest
//   "hh*8"             play a step n times in its space
//   "[bd bd] sd"       group steps into one step
//   "<c2 ab1 bb1 g1>"  one per bar, in turn
//   "bd*4, ~ cp"       comma: layers at the same time
//   "bd(3,8)"          euclid: 3 hits spread over 8 (optional rotation: (3,8,2))
//   "bd:3"             sample 3 (sets \n)
//   "bd!3 sd"          repeat a step (same as "bd bd bd sd")
//   "bd@3 sd"          weight: bd takes 3/4 of the bar
//   "hh?"              play it half the time
//   "c2/2"             a step stretched over 2 bars
//
// Mini.render returns [start, length, text] for one cycle, in fractions of the cycle.

Mini {
	classvar <beatsPerCycle = 4;

	// ---- parsing --------------------------------------------------------------

	*parse { |string|
		var tokens = this.tokenize(string), pos = 0, node;
		var peek = { tokens[pos] }, next = { pos = pos + 1; tokens[pos - 1] };
		var parseLayers, parseSeq, parseStep;

		// layers := seq (',' seq)*   (ends at endTok)
		parseLayers = { |endTok|
			var layers = [parseSeq.(endTok)];
			while { peek.() == "," } { next.(); layers = layers.add(parseSeq.(endTok)) };
			if(layers.size == 1) { layers[0] } { (type: \stack, layers: layers) }
		};

		// seq := step*   (stops at ',' or endTok)
		parseSeq = { |endTok|
			var steps = [];
			while { peek.().notNil and: { peek.() != "," } and: { peek.() != endTok } } {
				steps = steps ++ parseStep.()
			};
			(type: \seq, steps: steps)
		};

		// one step and its modifiers; returns an array (because of '!')
		parseStep = {
			var tok = next.(), node, weight = 1, copies = 1;
			node = case
			{ tok == "~" } { (type: \rest) }
			{ tok == "[" } { var n = parseLayers.("]"); next.(); n }
			{ tok == "<" } { var n = parseLayers.(">"); next.(); (type: \alt, node: n) }
			{ (tok.size > 0) and: { "[]<>,*/!@?()~".includes(tok[0]).not } } { (type: \atom, value: tok) }
			{ Error("Mini: unexpected '%' in \"%\"".format(tok, string)).throw };
			// modifiers, in any order
			while { peek.().notNil and: { ["*", "/", "!", "@", "?", "("].includesEqual(peek.()) } } {
				var m = next.();
				case
				{ m == "*" } { node = (type: \fast, n: next.().asFloat, node: node) }
				{ m == "/" } { node = (type: \slow, n: next.().asFloat, node: node) }
				{ m == "!" } { copies = next.().asInteger.max(1) }
				{ m == "@" } { weight = next.().asFloat }
				{ m == "?" } { node = (type: \degrade, node: node) }
				{ m == "(" } {
					var k = next.().asInteger, n, r = 0;
					next.(); // ','
					n = next.().asInteger;
					if(peek.() == ",") { next.(); r = next.().asInteger };
					next.(); // ')'
					node = (type: \euclid, k: k, n: n, r: r, node: node);
				};
			};
			Array.fill(copies, { (node: node, weight: weight) })
		};

		node = parseLayers.(nil);
		if(pos < tokens.size) { Error("Mini: couldn't read past '%' in \"%\"".format(tokens[pos], string)).throw };
		^node
	}

	*tokenize { |string|
		var tokens = [], word = "";
		var flush = { if(word.size > 0) { tokens = tokens.add(word); word = "" } };
		string.do { |c|
			case
			{ c.isSpace } { flush.() }
			{ "[]<>,*/!@?()~".includes(c) } { flush.(); tokens = tokens.add(c.asString) }
			{ word = word ++ c };
		};
		flush.();
		^tokens
	}

	// ---- rendering one cycle ----------------------------------------------------

	*render { |node, cycle = 0, t0 = 0, dur = 1|
		var out = List.new;
		this.prRender(node, cycle, t0, dur, out);
		// stable: notes that start together keep the order they were written in
		^out.asArray.collect { |e, i| [e, i] }
			.sort { |a, b| (a[0][0] < b[0][0]) or: { (a[0][0] == b[0][0]) and: { a[1] < b[1] } } }
			.collect(_.first)
	}

	*prRender { |node, cycle, t0, dur, out|
		switch(node[\type],
			\atom, { out.add([t0, dur, node[\value]]) },
			\rest, {},
			\seq, {
				var total = node[\steps].sum { |s| s[\weight] }, t = t0;
				node[\steps].do { |s|
					var d = dur * s[\weight] / total;
					this.prRender(s[\node], cycle, t, d, out);
					t = t + d;
				}
			},
			\stack, { node[\layers].do { |l| this.prRender(l, cycle, t0, dur, out) } },
			\alt, {
				// one step per cycle, in turn; nested alternations count their own turns
				var steps = this.prAltSteps(node[\node]), n = steps.size;
				if(n > 0) { this.prRender(steps[cycle % n], (cycle / n).floor.asInteger, t0, dur, out) }
			},
			\fast, {
				var n = node[\n].round.asInteger.max(1);
				n.do { |i| this.prRender(node[\node], cycle * n + i, t0 + (i * dur / n), dur / n, out) }
			},
			\slow, {
				// one cycle of the inner node spread over n cycles: show the part that falls in this one
				var n = node[\n].max(1), inner = List.new, part = cycle % n.asInteger;
				this.prRender(node[\node], (cycle / n).floor.asInteger, t0 - (part * dur), dur * n, inner);
				inner.do { |e| if((e[0] >= (t0 - 1e-9)) and: { e[0] < (t0 + dur - 1e-9) }) { out.add(e) } };
			},
			\euclid, {
				var hits = this.bjorklund(node[\k], node[\n]).rotate(node[\r].neg), n = node[\n];
				hits.do { |hit, i| if(hit == 1) { this.prRender(node[\node], cycle, t0 + (i * dur / n), dur / n, out) } }
			},
			\degrade, {
				var inner = List.new;
				this.prRender(node[\node], cycle, t0, dur, inner);
				inner.do { |e| if(0.5.coin) { out.add(e) } };
			}
		);
	}

	// <a b c> and <a, b> (layers alternate together)
	*prAltSteps { |node|
		^switch(node[\type],
			\seq, { node[\steps].collect { |s| s[\node] } },
			\stack, {
				// alternate each layer separately, as a stack of alternations
				[(type: \stack, layers: node[\layers].collect { |l| (type: \alt, node: l) })]
			},
			{ [node] }
		)
	}

	// Bjorklund's algorithm, as Tidal uses: (3,8) = x..x..x. and (5,8) = x.xx.xx.
	*bjorklund { |k, n|
		var a, b;
		if(k <= 0) { ^0 ! n };
		if(k >= n) { ^1 ! n };
		a = Array.fill(k, { [1] });
		b = Array.fill(n - k, { [0] });
		while { b.size > 1 } {
			var m = min(a.size, b.size);
			var restA = a.copyToEnd(m), restB = b.copyToEnd(m);
			a = Array.fill(m, { |i| a[i] ++ b[i] });
			b = if(restA.size > 0) { restA } { restB };
		};
		^(a ++ b).flatten
	}

	// ---- patterns --------------------------------------------------------------------

	// A pattern of events, one cycle at a time: \dur is the time to the next event,
	// \len the length of this step (both in beats), \text the step's text.
	*pattern { |string, makeEvent|
		var tree = this.parse(string);
		var layers = if(tree[\type] == \stack) { tree[\layers] } { [tree] };
		var streams = layers.collect { |layer|
			Prout { |inval|
				var cycle = 0;
				loop {
					var events = this.render(layer, cycle), t = 0;
					events.do { |e, i|
						var start = e[0], nextStart = events[i + 1] !? { |x| x[0] } ?? { 1 };
						if(start > (t + 1e-9)) { inval = (dur: (start - t) * beatsPerCycle, type: \rest).yield; t = start };
						inval = makeEvent.(e[2], e[1] * beatsPerCycle).put(\dur, (nextStart - start) * beatsPerCycle).yield;
						t = nextStart;
					};
					if(t < (1 - 1e-9)) { inval = (dur: (1 - t) * beatsPerCycle, type: \rest).yield };
					cycle = cycle + 1;
				}
			}
		};
		^if(streams.size == 1) { streams[0] } { Ppar(streams) }
	}

	// "bd*4 sd:3" -> (s: \bd), (s: \sd, n: 3)
	*sounds { |string|
		^this.pattern(string, { |text, len|
			var parts = text.split($:);
			var ev = (s: parts[0].asSymbol, len: len, text: text);
			if(parts.size > 1) { ev[\n] = parts[1].asFloat };
			ev
		})
	}

	// "c2 eb2 [g2,bb2]" -> notes. Names follow Strudel: c4 is middle C (MIDI 60),
	// a name without an octave is in octave 3, and plain numbers are MIDI notes.
	// Sets \midinote, and \note (MIDI - 60) for SuperDirt synths.
	*notes { |string|
		^this.pattern(string, { |text, len|
			var midi = this.noteToMidi(text);
			(midinote: midi, note: midi - 60, len: len, sustain: len, text: text)
		})
	}

	// "0 1 2 3".splice(16, \breaks165): play slices of a sample, each stretched to fit its step
	*splice { |string, slices, sample|
		^this.pattern(string, { |text, len|
			var i = text.asInteger;
			(s: sample.asSymbol, begin: i / slices, end: (i + 1) / slices, unit: \c,
				speed: (1 / slices) / (len / beatsPerCycle), len: len, text: text)
		})
	}

	// "0 2 4 <5 7>".degrees(Scale.minor, 60): scale degrees from a root (MIDI), like Tidal's
	// n (scale "minor" "...") at octave 5. Negative and large degrees wrap into other octaves.
	*degrees { |string, scale, root = 60|
		scale = scale ?? { Scale.minor };
		^this.pattern(string, { |text, len|
			var midi = root + scale.performDegreeToKey(text.asInteger);
			(midinote: midi, note: midi - 60, len: len, sustain: len, text: text)
		})
	}

	*noteToMidi { |text|
		var s = text.asString, letter, i = 1, acc = 0, oct = 3;
		if(s.size == 0) { ^nil };
		if(s[0].isDecDigit or: { s[0] == $- }) { ^s.asFloat };
		letter = s[0].toLower;
		while { i < s.size and: { "#sbf".includes(s[i]) } } {
			acc = acc + (if("#s".includes(s[i])) { 1 } { -1 });
			i = i + 1;
		};
		if(i < s.size) { oct = s.copyToEnd(i).asInteger };
		^(12 * (oct + 1)) + (c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11)[letter.asSymbol] + acc
	}
}
