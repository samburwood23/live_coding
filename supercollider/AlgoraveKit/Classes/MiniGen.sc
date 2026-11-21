// A phrase that evolves: "0 2 4 2 7 4 2 0".evolve(0.3)
//
// Reads which step follows which in the phrase you wrote (a Markov chain), then
// each bar swaps some steps for ones that could follow the step before. The rhythm,
// rests and brackets stay as written; only the notes (or sounds) change.
//
//   amount  chance of each step changing in a bar (0..1)
//   home    every `home` bars it plays the phrase exactly as written again
//   drift   true: each bar changes the bar before, so it wanders further over the phrase
//           false: each bar is a fresh variation of the original
//
// Use it anywhere you'd use the string:
//   "0 2 4 <7 6> ~ 4 2 ~".evolve(0.3).degrees(Scale.minor, 60)
//   "c2 c2 eb2 c3 bb1 c2 g1 c2".evolve(0.4, 16).notes
//   "bd ~ sn bd ~ bd sn ~".evolve(0.2).mini
//   "0 1 2 3 4 5 6 7".evolve(0.25).splice(8, \breaks165)

MiniGen {
	var <string, <>amount, <>home, <>drift;
	var tokens, atomIndexes, original, table, cache;

	*new { |string, amount = 0.3, home = 8, drift = true|
		^super.newCopyArgs(string.asString, amount, home, drift).init
	}

	init {
		var depth = 0, prev;
		tokens = Mini.tokenize(string);
		atomIndexes = List.new;
		tokens.do { |t, i|
			case
			{ t == "(" } { depth = depth + 1 }
			{ t == ")" } { depth = depth - 1 }
			{ "[]<>,*/!@?~".includes(t[0]) and: { t.size == 1 } } { }
			{ depth == 0 and: { #["*", "/", "!", "@"].includesEqual(prev).not } } { atomIndexes.add(i) };
			prev = t;
		};
		original = atomIndexes.collect { |i| tokens[i] }.asArray;
		// which steps follow which, wrapping round from the last to the first
		table = Dictionary.new;
		original.do { |a, i| if(table[a].isNil) { table[a] = List.new }; table[a].add(original.wrapAt(i + 1)) };
		cache = Dictionary.new;
	}

	// the steps for one bar
	atomsAt { |cycle|
		var base, out;
		if(original.isEmpty or: { cycle <= 0 } or: { home.notNil and: { cycle % home == 0 } }) { ^original };
		^cache[cycle] ?? {
			base = if(drift) { this.atomsAt(cycle - 1) } { original };
			out = Array.newClear(base.size);
			base.do { |a, i|
				var before = if(i == 0) { base.last } { out[i - 1] };
				out[i] = case
					// pulled back towards what you wrote, so it doesn't wander off completely
					{ drift and: { (amount * 0.35).coin } } { original[i] }
					{ amount.coin } { (table[before] ?? { table[a] }).choose }
					{ a };
			};
			cache[cycle] = out;
			if(cache.size > 64) { cache.removeAt(cache.keys.minItem) };
			out
		}
	}

	// the string for one bar
	value { |cycle = 0|
		var t = tokens.copy;
		this.atomsAt(cycle).do { |a, k| t[atomIndexes[k]] = a };
		^t.join(" ")
	}

	asString { ^string }
	printOn { |stream| stream << "MiniGen(" << string.cs << ")" }

	mini { ^Mini.sounds(this) }
	notes { ^Mini.notes(this) }
	degrees { |scale, root = 60| ^Mini.degrees(this, scale, root) }
	splice { |slices = 16, sample = \breaks165| ^Mini.splice(this, slices, sample) }
}
