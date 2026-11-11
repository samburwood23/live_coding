// Starter patterns for the algorave kit.
// Each entry shows up in the sidebar of index.html. Add your own at the bottom.
// Syntax reference: https://strudel.cc/workshop/getting-started/

window.PATTERNS = [
  {
    name: "01 · First beat",
    about: "Mini-notation basics: spaces split a cycle, * repeats, ~ is a rest.",
    code: `// Ctrl+Enter = play / update, Ctrl+. = stop
setcps(0.55) // cycles per second (~132 bpm in 4/4)

s("bd*4, ~ cp ~ cp, hh*8")
  .bank("RolandTR909")`,
  },
  {
    name: "02 · Layers with stack",
    about: "stack() plays patterns together; .gain and .room shape each layer.",
    code: `setcps(0.55)

stack(
  s("bd ~ ~ bd ~ ~ bd ~").bank("RolandTR909"),
  s("~ sd").bank("RolandTR909").room(0.3),
  s("hh*16").bank("RolandTR909").gain("0.4 0.7".fast(4)),
  s("~ ~ ~ ~ ~ ~ ~ oh").bank("RolandTR909").gain(0.5)
)`,
  },
  {
    name: "03 · Acid bassline",
    about: "Notes from a scale, a sawtooth synth and an LFO sweeping the filter.",
    code: `setcps(0.55)

stack(
  s("bd*4").bank("RolandTR909"),
  n("0 0 [3 0] 5 <7 10> 0 [12 0] 3")
    .scale("A1:minor")
    .s("sawtooth")
    .lpf(sine.range(300, 2400).slow(8))
    .lpq(12)
    .decay(0.15).sustain(0)
    .gain(0.6)
)`,
  },
  {
    name: "04 · Polyrhythm",
    about: "{ } fits patterns of different lengths over each other: 3 against 4 against 5.",
    code: `setcps(0.5)

s("{bd sd cp, hh hh oh hh, rim ~ rim rim ~}%8")
  .bank("RolandTR808")
  .room(0.2)`,
  },
  {
    name: "05 · Euclidean rhythms",
    about: "(hits, steps) spreads hits evenly: the basis of loads of world rhythms.",
    code: `setcps(0.5)

stack(
  s("bd(3,8)"),
  s("sd(2,8,4)"),
  s("hh(5,8,<0 2>)").gain(0.6),
  s("rim(7,16)").gain(0.5).pan(sine.slow(4))
).bank("RolandTR707")`,
  },
  {
    name: "06 · Chords & arps",
    about: "Chord symbols, voicings and an arpeggio, with alternation using < >.",
    code: `setcps(0.45)

stack(
  chord("<Am7 Dm7 G7 Cmaj7>")
    .voicing()
    .s("gm_epiano1")
    .room(0.5)
    .gain(0.5),
  n("0 2 4 6 7 6 4 2")
    .chord("<Am7 Dm7 G7 Cmaj7>")
    .voicing()
    .s("triangle")
    .delay(0.3)
    .gain(0.4)
    .fast(2),
  s("bd ~ [~ bd] ~, ~ sd").bank("LinnDrum")
)`,
  },
  {
    name: "07 · Transformations",
    about: "every, sometimes, jux, rev: the functions that make patterns keep changing.",
    code: `setcps(0.55)

n("0 2 4 <5 7> 4 2")
  .scale("D3:dorian")
  .s("gm_lead_2_sawtooth")
  .every(4, x => x.rev())
  .sometimesBy(0.3, x => x.add(note(12)))
  .jux(x => x.fast(2))
  .lpf(1800)
  .room(0.4)
  .gain(0.4)`,
  },
  {
    name: "08 · Breakbeat chop",
    about: "Slice a break into pieces and rearrange them with a pattern.",
    code: `setcps(0.6)

s("brk") // the amen break
  .fit()
  .chop(16)
  .slice(16, "<0 4 8 12>*2 [6 7] 3 <15 2> [10 ~] 11 0 13")
  .lpf(perlin.range(800, 8000))
  .room(0.15)`,
  },
  {
    name: "09 · Ambient drone",
    about: "Slow, long notes, lots of reverb and gradual random change with perlin noise.",
    code: `setcps(0.2)

stack(
  note("<[c3,g3,e4] [a2,e3,c4] [f2,c3,a3] [g2,d3,b3]>")
    .s("sawtooth")
    .attack(1.5).release(3)
    .lpf(perlin.range(300, 1500).slow(8))
    .room(0.9).size(0.9)
    .gain(0.3),
  n(irand(8).segment(8))
    .scale("C5:major:pentatonic")
    .s("sine")
    .degradeBy(0.6)
    .delay(0.6).delayfeedback(0.5)
    .gain(0.3)
)`,
  },
  {
    name: "10 · Full set template",
    about: "A set skeleton: mute or unmute layers by commenting them out while it plays.",
    code: `// Comment layers in and out with Ctrl+/ and re-run with Ctrl+Enter.
setcps(0.56)

const drums = stack(
  s("bd*4"),
  s("~ cp").room(0.2),
  s("[~ hh]*4").gain(0.5),
  // s("hh*16").gain(perlin.range(0.2, 0.6)),
).bank("RolandTR909")

const bass = n("<0 0 3 5>(5,8)")
  .scale("F1:minor")
  .s("supersaw")
  .lpf(sine.range(200, 1200).slow(16))
  .gain(0.5)

const lead = n("[0 3 7 10]*2")
  .scale("F4:minor")
  .s("square")
  .degradeBy(0.4)
  .delay(0.4)
  .gain(0.25)

stack(
  drums,
  bass,
  // lead,
)`,
  },

  // ---------------------------------------------------------------- JUNGLE
  {
    name: "11 · Jungle: amen roller",
    about: "The amen break sliced into 16 and re-sequenced, over a sub bass. 170 BPM.",
    code: `setcps(170/60/4) // 170 BPM

stack(
  // splice: cut the break into 16 slices, each stretched to fit its step
  s("brk").splice(16, "<[0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15] [0 1 2 3 4 5 [6 6] 7 0 1 10 11 [12 13] 14 4 15]>")
    .lastOf(4, x => x.ply(2)) // roll every 4th bar
    .cut(1),

  note("<a1 a1 g1 e1>")
    .s("sine")
    .attack(0.01).release(0.4)
    .gain(0.9)
)`,
  },
  {
    name: "12 · Jungle: ragga",
    about: "Rolling break, detuned reese bass and an offbeat chord skank with dub delay.",
    code: `setcps(170/60/4)

stack(
  s("brk").splice(16, "0 1 2 3 4 5 [6 6] 7 8 9 10 11 [12 13] 14 4 15")
    .lastOf(8, x => x.ply(2))
    .cut(1),

  // reese: a detuned supersaw, low-passed
  note("<a1 a1 c2 [d2 c2]>")
    .s("supersaw").detune(0.4)
    .lpf(900)
    .gain(0.5),

  // skank on the backbeats
  note("~ [a3,c4,e4] ~ [a3,c4,e4]")
    .s("square")
    .decay(0.12).sustain(0)
    .lpf(2500)
    .delay(0.5).delaytime(0.375).delayfeedback(0.45)
    .gain(0.35)
)`,
  },
  {
    name: "13 · Jungle: darkside",
    about: "Gritty, filtered break, hoover-style stabs and a rumbling sub.",
    code: `setcps(168/60/4)

stack(
  s("brk").splice(16, "0 1 [2 2] 3 4 ~ 6 7 [8 9] 10 [11 11] ~ 12 13 [14 15] 15")
    .lpf("<8000 8000 8000 600>") // drop the filter every 4th bar
    .shape(0.3)
    .cut(1),

  note("a1 ~ ~ a1 ~ ~ <c2 f1> ~")
    .s("sine")
    .release(0.5)
    .shape(0.4)
    .gain(0.8),

  note("<[a2,e3] ~ ~ [~ [g#2,d#3]]>")
    .s("supersaw").detune(0.8)
    .attack(0.02).release(0.8)
    .lpf(1800)
    .room(0.4)
    .gain(0.35)
    .slow(2)
)`,
  },
  {
    name: "14 · Jungle: liquid",
    about: "A lighter break, warm Rhodes arpeggios and a soft sub. The emotional side of jungle.",
    code: `setcps(172/60/4)

stack(
  s("brk").splice(16, "0 ~ 2 3 4 ~ 6 7 ~ 9 10 ~ 12 ~ 14 15")
    .hpf(120)
    .gain(0.85)
    .cut(1),

  n("0 1 2 3 4 3 2 1")
    .chord("<Cmaj7 Am7 Fmaj7 G7>")
    .voicing()
    .s("gm_epiano1")
    .room(0.6).size(0.9)
    .gain(0.5),

  note("<c2 a1 f1 g1>")
    .s("sine")
    .release(0.6)
    .gain(0.8)
)`,
  },
  {
    name: "15 · Jungle: jump-up",
    about: "Bouncy, wobbling reese bass with a filter LFO. Call-and-response with the break.",
    code: `setcps(174/60/4)

stack(
  s("brk").splice(16, "0 1 2 3 4 5 6 7 0 1 10 11 [12 12] 13 14 15")
    .cut(1),

  note("e1 ~ [e1 e1] ~ <g1 a1> ~ e1 [~ d1]")
    .s("supersaw").detune(0.6)
    .lpf(sine.range(300, 2500).fast(2))
    .lpq(8)
    .gain(0.55)
)`,
  },
  {
    name: "16 · Jungle: drill'n'bass",
    about: "Hyper-edited amen: bite, random stutters, pitch jumps and bitcrush.",
    code: `setcps(170/60/4)

s("brk")
  .splice(32, "0 [1 1 1] 2 [3 7] <4 [4 4 4 4]> 5 [6 ~ 6] 7")
  .chunk(4, x => x.hurry(2))
  .sometimesBy(0.3, x => x.speed(2))
  .sometimesBy(0.15, x => x.crush(4))
  .lastOf(3, x => x.fast(2))
  .cut(1)
  .room(0.1)`,
  },
  {
    name: "17 · Jungle set template",
    about: "Break, sub, reese, pads: build up and break down by commenting layers in and out.",
    code: `// Ctrl+/ to mute or unmute a layer, then Ctrl+Enter.
setcps(170/60/4)

const amen = s("brk")
  .splice(16, "<[0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15] [0 1 2 3 4 5 [6 6] 7 0 1 10 11 [12 13] 14 4 15]>")
  .lastOf(4, x => x.ply(2))
  .cut(1)

const randomAmen = s("brk").splice(16, irand(16).segment(16)).cut(1)

const sub = note("<a1 a1 g1 e1>").s("sine").release(0.4).gain(0.9)

const reese = note("<a1 a1 g1 e1>")
  .s("supersaw").detune(0.5)
  .lpf(sine.range(300, 1500).slow(8))
  .gain(0.45)

const pads = note("<[a3,c4,e4,g4] [a3,c4,e4,g4] [g3,b3,d4,f#4] [e3,g3,b3,d4]>")
  .s("supersaw").attack(0.5).release(1.5)
  .lpf(1200).room(0.8).size(0.9)
  .gain(0.2)

stack(
  amen,
  // randomAmen,
  sub,
  // reese,
  pads,
)`,
  },

  // ---------------------------------------------------------------- MAKINA
  // Valencian / Catalan hard dance, ~175 BPM, C minor: Cm - Ab - Bb - Gm.
  // 18-23 build the tune up one section at a time; 24 plays the whole flow.
  {
    name: "18 · Makina: bombo & hats",
    about: "The intro: a distorted 909 kick on every beat, open hats on the offbeats, rolling 16ths.",
    code: `setcps(175/60/4) // 175 BPM

stack(
  // the bombo: push shape for more distortion
  s("bd*4").bank("RolandTR909").shape(0.5).gain(0.9),

  s("[~ oh]*4").bank("RolandTR909").gain(0.55),
  s("hh*16").bank("RolandTR909").gain(sine.range(0.25, 0.45).fast(4))
)`,
  },
  {
    name: "19 · Makina: groove",
    about: "Add the bajo, an offbeat saw bass following Cm - Ab - Bb - Gm, and claps on 2 and 4.",
    code: `setcps(175/60/4)

stack(
  s("bd*4").bank("RolandTR909").shape(0.5).gain(0.9),
  s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.4),
  s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.7),

  // the bajo: one note per bar, played on every offbeat
  note("<c2 ab1 bb1 g1>")
    .struct("[~ x]*4")
    .s("supersaw")
    .decay(0.12).sustain(0)
    .lpf(1400)
    .gain(0.6)
)`,
  },
  {
    name: "20 · Makina: pianos makineros",
    about: "The anthemic riff: piano doubled with a supersaw, 16 steps a bar. Bar 2 answers bar 1.",
    code: `setcps(175/60/4)

const riff = n("<[0 ~ 0 2 ~ 4 ~ 2 0 ~ 0 2 ~ 4 5 4] [0 ~ 0 2 ~ 4 ~ 2 7 ~ 6 ~ 4 ~ 2 ~]>")
  .scale("C5:minor")

stack(
  s("bd*4").bank("RolandTR909").shape(0.5).gain(0.9),
  s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.4),
  s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.7),
  note("<c2 ab1 bb1 g1>").struct("[~ x]*4")
    .s("supersaw").decay(0.12).sustain(0).lpf(1400).gain(0.6),

  riff.s("piano").room(0.25).gain(0.8),
  riff.s("supersaw").decay(0.15).sustain(0)
    .lpf(sine.range(1500, 5000).slow(16)) // slowly opens over 16 bars
    .gain(0.3)
)`,
  },
  {
    name: "21 · Makina: stabs & hoover",
    about: "Rave chord stabs on a 3-3-2 rhythm and a detuned hoover with a pitch swoop on each bar.",
    code: `setcps(175/60/4)

stack(
  s("bd*4").bank("RolandTR909").shape(0.5).gain(0.9),
  s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.4),
  note("<c2 ab1 bb1 g1>").struct("[~ x]*4")
    .s("supersaw").decay(0.12).sustain(0).lpf(1400).gain(0.6),

  // stabs on the classic 3-3-2: x ~ ~ x ~ ~ x ~
  chord("<Cm Ab Bb Gm>")
    .voicing()
    .struct("x ~ ~ x ~ ~ x ~")
    .s("supersaw")
    .decay(0.2).sustain(0)
    .lpf(3000)
    .room(0.3)
    .gain(0.45),

  // hoover: wide supersaw that swoops up into each note
  note("<c3 ab2 bb2 [g2 b2]>")
    .s("supersaw").detune(0.9).unison(7)
    .penv(-12).pattack(0.15)
    .lpf(2200)
    .room(0.3)
    .gain(0.35)
)`,
  },
  {
    name: "22 · Makina: breakdown",
    about: "Drop the kick and bass, keep the emotion: riff on piano, pads and lots of reverb.",
    code: `setcps(175/60/4)

stack(
  n("<[0 ~ 0 2 ~ 4 ~ 2 0 ~ 0 2 ~ 4 5 4] [0 ~ 0 2 ~ 4 ~ 2 7 ~ 6 ~ 4 ~ 2 ~]>")
    .scale("C5:minor")
    .s("piano")
    .room(0.7).size(0.9)
    .gain(0.8),

  chord("<Cm Ab Bb Gm>")
    .voicing()
    .s("supersaw")
    .attack(0.3).release(1.2)
    .lpf(1500)
    .room(0.8).size(0.9)
    .gain(0.25),

  s("[~ oh]*4").bank("RolandTR909").gain(0.35)
)`,
  },
  {
    name: "23 · Makina: build & drop",
    about: "A 4-bar snare roll that speeds up and rises in pitch, then everything drops back in.",
    code: `setcps(175/60/4)

const roll = arrange(
  [2, s("sd*4")],         // quarters
  [1, s("sd*8")],         // eighths
  [1, s("[sd*8 sd*16]")], // sixteenths, then 32nds
).bank("RolandTR909")
  .speed(saw.range(1, 1.8).slow(4)) // pitch rises over the 4 bars
  .gain(saw.range(0.6, 1).slow(4))

const drop = stack(
  s("bd*4").bank("RolandTR909").shape(0.5).gain(0.9),
  s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.4),
  s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.7),
  note("<c2 ab1 bb1 g1>").struct("[~ x]*4")
    .s("supersaw").decay(0.12).sustain(0).lpf(1400).gain(0.6),
  n("<[0 ~ 0 2 ~ 4 ~ 2 0 ~ 0 2 ~ 4 5 4] [0 ~ 0 2 ~ 4 ~ 2 7 ~ 6 ~ 4 ~ 2 ~]>")
    .scale("C5:minor").s("piano").room(0.25).gain(0.8)
)

// 4 bars of roll, then 4 bars of drop, on repeat
arrange([4, roll], [4, drop])`,
  },
  {
    name: "24 · Makina: full flow",
    about: "The whole tune, arranged: intro, groove, riff, stabs, breakdown, build, drop. About 1:30 a lap.",
    code: `// Plays the full flow by itself. Edit any part and press Ctrl+Enter;
// change the numbers in arrange() to lengthen or shorten a section (in bars).
setcps(175/60/4)

const kick  = s("bd*4").bank("RolandTR909").shape(0.5).gain(0.9)
const hats  = s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.4)
const claps = s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.7)

const bass = note("<c2 ab1 bb1 g1>").struct("[~ x]*4")
  .s("supersaw").decay(0.12).sustain(0).lpf(1400).gain(0.6)

const melody = n("<[0 ~ 0 2 ~ 4 ~ 2 0 ~ 0 2 ~ 4 5 4] [0 ~ 0 2 ~ 4 ~ 2 7 ~ 6 ~ 4 ~ 2 ~]>")
  .scale("C5:minor")
const riff = stack(
  melody.s("piano").room(0.25).gain(0.8),
  melody.s("supersaw").decay(0.15).sustain(0).lpf(4000).gain(0.25)
)

const stabs = chord("<Cm Ab Bb Gm>").voicing().struct("x ~ ~ x ~ ~ x ~")
  .s("supersaw").decay(0.2).sustain(0).lpf(3000).room(0.3).gain(0.45)

const hoover = note("<c3 ab2 bb2 [g2 b2]>")
  .s("supersaw").detune(0.9).unison(7).penv(-12).pattack(0.15)
  .lpf(2200).room(0.3).gain(0.3)

const pads = chord("<Cm Ab Bb Gm>").voicing()
  .s("supersaw").attack(0.3).release(1.2).lpf(1500).room(0.8).size(0.9).gain(0.25)

const roll = arrange([2, s("sd*4")], [1, s("sd*8")], [1, s("[sd*8 sd*16]")])
  .bank("RolandTR909").speed(saw.range(1, 1.8).slow(4))

arrange(
  [8,  stack(kick, hats)],                                       // intro
  [8,  stack(kick, hats, claps, bass)],                          // groove
  [16, stack(kick, hats, claps, bass, riff)],                    // the riff
  [8,  stack(kick, hats, claps, bass, stabs, hoover)],           // stabs & hoover
  [8,  stack(melody.s("piano").room(0.7).size(0.9), pads)],      // breakdown
  [4,  stack(pads.gain(0.15), roll)],                            // build
  [16, stack(kick, hats, claps, bass, riff, stabs, hoover)],     // drop
)`,
  },
  // ---------------------------------------------------------------- NEW MONKEY
  // North East "New Monkey" (Sunderland, early 2000s): makina's bouncier cousin.
  // ~168 BPM, A minor, the hands-up progression Am - F - C - G.
  // 25-28 build it up one section at a time; 29 plays the whole flow.
  {
    name: "25 · New Monkey: kick & bounce",
    about: "The engine room: hard kick on every beat and the bouncing bass, an offbeat saw jumping an octave each beat.",
    code: `setcps(168/60/4) // 168 BPM

stack(
  s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9),
  s("[~ oh]*4").bank("RolandTR909").gain(0.5),
  s("hh*16").bank("RolandTR909").gain(sine.range(0.2, 0.4).fast(4)),

  // the bounce: one root per bar, on every offbeat, low then high
  note("<a1 f1 c2 g1>")
    .struct("[~ x]*4")
    .add(note("[0 12]*2"))
    .s("supersaw")
    .decay(0.1).sustain(0)
    .lpf(1800).lpq(4)
    .gain(0.6)
)`,
  },
  {
    name: "26 · New Monkey: the tune",
    about: "The anthem: a 4-bar trance lead over Am - F - C - G, supersaw doubled with a square an octave up.",
    code: `setcps(168/60/4)

// one bar per chord: Am, F, C, G. The last bar climbs back into the top.
const tune = n(\`<
  [7 ~ 7 4 ~ 7 ~ 9 ~ 7 ~ 4 2 ~ 4 ~]
  [7 ~ 7 5 ~ 7 ~ 9 ~ 7 ~ 5 2 ~ 5 ~]
  [6 ~ 6 4 ~ 6 ~ 9 ~ 6 ~ 4 2 ~ 4 ~]
  [6 ~ 6 3 ~ 6 ~ 8 ~ 6 ~ 8 9 ~ 10 ~]
>\`).scale("A3:minor")

stack(
  s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9),
  s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35),
  s("~ [cp,sd] ~ [cp,sd]").bank("RolandTR909").room(0.2).gain(0.6),
  note("<a1 f1 c2 g1>").struct("[~ x]*4").add(note("[0 12]*2"))
    .s("supersaw").decay(0.1).sustain(0).lpf(1800).lpq(4).gain(0.6),

  tune.s("supersaw").detune(0.5)
    .decay(0.18).sustain(0.2)
    .lpf(4500)
    .delay(0.3).delaytime(0.375).delayfeedback(0.3)
    .room(0.3)
    .gain(0.4),
  tune.add(note(12)).s("square") // doubled an octave up
    .decay(0.1).sustain(0)
    .lpf(3000)
    .gain(0.12)
)`,
  },
  {
    name: "27 · New Monkey: vocal hook & stabs",
    about: "A pitched-up 'chipmunk' vocal line (choir oohs standing in for the sped-up pop vocal) and skippy offbeat chord stabs.",
    code: `setcps(168/60/4)

stack(
  s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9),
  s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35),
  s("~ [cp,sd] ~ [cp,sd]").bank("RolandTR909").room(0.2).gain(0.6),
  note("<a1 f1 c2 g1>").struct("[~ x]*4").add(note("[0 12]*2"))
    .s("supersaw").decay(0.1).sustain(0).lpf(1800).lpq(4).gain(0.6),

  // the hook, high and bright like a sped-up vocal
  n("<[4 ~ 4 5 4 ~ 2 ~] [0 ~ 0 2 0 ~ -1 ~] [2 ~ 2 4 2 ~ 4 ~] [1 ~ 1 2 3 ~ 4 ~]>")
    .scale("A5:minor")
    .s("gm_voice_oohs")
    .room(0.4)
    .delay(0.25).delaytime(0.375)
    .gain(0.7),

  // stabs skipping around the offbeats
  chord("<Am F C G>")
    .voicing()
    .struct("~ x ~ x x ~ x ~")
    .s("supersaw")
    .decay(0.15).sustain(0)
    .hpf(400).lpf(3500)
    .gain(0.35)
)`,
  },
  {
    name: "28 · New Monkey: breakdown & build",
    about: "Kick and bass out: piano chords and the vocal hook in reverb, then a snare roll that rises into the drop.",
    code: `setcps(168/60/4)

const breakdown = stack(
  chord("<Am F C G>").voicing()
    .s("piano")
    .struct("x ~ ~ x ~ ~ x ~")
    .room(0.6).size(0.9)
    .gain(0.7),
  n("<[4 ~ 4 5 4 ~ 2 ~] [0 ~ 0 2 0 ~ -1 ~] [2 ~ 2 4 2 ~ 4 ~] [1 ~ 1 2 3 ~ 4 ~]>")
    .scale("A5:minor").s("gm_voice_oohs")
    .room(0.8).size(0.9).gain(0.6),
  chord("<Am F C G>").voicing()
    .s("supersaw").attack(0.4).release(1.5)
    .lpf(1200).room(0.8).gain(0.2)
)

const roll = arrange(
  [2, s("sd*4")],
  [1, s("sd*8")],
  [1, s("[sd*8 sd*16]")],
).bank("RolandTR909")
  .speed(saw.range(1, 2).slow(4))
  .gain(saw.range(0.5, 1).slow(4))

// the bounce comes in under the roll with its filter opening
const riser = note("<a1 f1 c2 g1>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("supersaw").decay(0.1).sustain(0)
  .lpf(saw.range(200, 1800).slow(4))
  .gain(0.55)

// 8 bars of breakdown, then 4 bars of build, on repeat
arrange([8, breakdown], [4, stack(roll, riser)])`,
  },
  {
    name: "29 · New Monkey: full flow",
    about: "The whole tune, arranged: kick & bounce, the tune, vocal hook, breakdown, build and a double-hook drop. About 1:40 a lap.",
    code: `// Plays the full flow by itself. Edit any part and press Ctrl+Enter;
// change the numbers in arrange() to lengthen or shorten a section (in bars).
setcps(168/60/4)

const kick  = s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9)
const hats  = s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35)
const claps = s("~ [cp,sd] ~ [cp,sd]").bank("RolandTR909").room(0.2).gain(0.6)

const bounce = note("<a1 f1 c2 g1>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("supersaw").decay(0.1).sustain(0).lpf(1800).lpq(4).gain(0.6)

const melody = n(\`<
  [7 ~ 7 4 ~ 7 ~ 9 ~ 7 ~ 4 2 ~ 4 ~]
  [7 ~ 7 5 ~ 7 ~ 9 ~ 7 ~ 5 2 ~ 5 ~]
  [6 ~ 6 4 ~ 6 ~ 9 ~ 6 ~ 4 2 ~ 4 ~]
  [6 ~ 6 3 ~ 6 ~ 8 ~ 6 ~ 8 9 ~ 10 ~]
>\`).scale("A3:minor")
const tune = stack(
  melody.s("supersaw").detune(0.5).decay(0.18).sustain(0.2).lpf(4500)
    .delay(0.3).delaytime(0.375).delayfeedback(0.3).room(0.3).gain(0.4),
  melody.add(note(12)).s("square").decay(0.1).sustain(0).lpf(3000).gain(0.12)
)

const hook = n("<[4 ~ 4 5 4 ~ 2 ~] [0 ~ 0 2 0 ~ -1 ~] [2 ~ 2 4 2 ~ 4 ~] [1 ~ 1 2 3 ~ 4 ~]>")
  .scale("A5:minor").s("gm_voice_oohs").room(0.4).delay(0.25).delaytime(0.375).gain(0.7)

const stabs = chord("<Am F C G>").voicing().struct("~ x ~ x x ~ x ~")
  .s("supersaw").decay(0.15).sustain(0).hpf(400).lpf(3500).gain(0.35)

const piano = chord("<Am F C G>").voicing().s("piano")
  .struct("x ~ ~ x ~ ~ x ~").room(0.6).size(0.9).gain(0.7)
const pads = chord("<Am F C G>").voicing()
  .s("supersaw").attack(0.4).release(1.5).lpf(1200).room(0.8).gain(0.2)

const roll = arrange([2, s("sd*4")], [1, s("sd*8")], [1, s("[sd*8 sd*16]")])
  .bank("RolandTR909").speed(saw.range(1, 2).slow(4))

arrange(
  [8,  stack(kick, hats)],                                        // intro
  [8,  stack(kick, hats, bounce)],                                // the bounce
  [16, stack(kick, hats, claps, bounce, tune)],                   // the tune
  [8,  stack(kick, hats, claps, bounce, hook, stabs)],            // vocal hook
  [8,  stack(piano, hook.room(0.8), pads)],                       // breakdown
  [4,  stack(pads.gain(0.15), roll)],                             // build
  [16, stack(kick, hats, claps, bounce, tune, hook, stabs)],      // drop
)`,
  },
  // ---------------------------------------------------------------- NEW MONKEY II
  // A second New Monkey tune: faster (172 BPM), F# minor, F#m - D - A - E.
  // Pluckier pitch-dropping bass, a piano riff that trades phrases with a
  // hoover, and a kick-roll build. 30-33 build it up; 34 plays the whole flow.
  {
    name: "30 · New Monkey II: pluck bounce",
    about: "Kick, rolling hats and a plucky offbeat bass whose pitch drops on every hit, with a double-kick fill every 8th bar.",
    code: `setcps(172/60/4) // 172 BPM

stack(
  s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9)
    .lastOf(8, x => x.inside(4, y => y.ply("<1 1 1 2>"))), // double kicks on the last beat

  s("[~ oh]*4").bank("RolandTR909").gain(0.5),
  s("hh*16").bank("RolandTR909").gain("[0.25 0.3 0.45 0.3]*4"),

  // the pluck: each hit starts an octave up and drops fast into the note
  note("<f#1 d1 a1 e1>")
    .struct("[~ x]*4")
    .add(note("[0 12]*2"))
    .s("square")
    .penv(12).pattack(0).pdecay(0.04)
    .decay(0.12).sustain(0)
    .lpf(1600)
    .gain(0.55)
)`,
  },
  {
    name: "31 · New Monkey II: piano riff",
    about: "A bouncing 4-bar piano riff over F#m - D - A - E, doubled by a bright supersaw.",
    code: `setcps(172/60/4)

// one bar per chord: F#m, D, A, E
const riff = n(\`<
  [4 ~ 2 ~ 0 ~ 2 4 ~ 4 ~ 2 4 ~ 7 ~]
  [5 ~ 4 ~ 2 ~ 4 5 ~ 5 ~ 4 2 ~ 0 ~]
  [4 ~ 2 ~ 1 ~ 2 4 ~ 4 ~ 6 4 ~ 2 ~]
  [3 ~ 1 ~ -1 ~ 1 3 ~ 3 ~ 4 6 ~ 8 ~]
>\`).scale("F#4:minor")

stack(
  s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9),
  s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35),
  s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65),
  note("<f#1 d1 a1 e1>").struct("[~ x]*4").add(note("[0 12]*2"))
    .s("square").penv(12).pattack(0).pdecay(0.04)
    .decay(0.12).sustain(0).lpf(1600).gain(0.55),

  riff.s("piano").room(0.3).gain(0.8),
  riff.s("supersaw").decay(0.12).sustain(0)
    .hpf(500).lpf(5000)
    .gain(0.25)
)`,
  },
  {
    name: "32 · New Monkey II: piano vs hoover",
    about: "Call and response: the piano plays the riff for 4 bars, then a swooping hoover answers for 4.",
    code: `setcps(172/60/4)

const riff = n(\`<
  [4 ~ 2 ~ 0 ~ 2 4 ~ 4 ~ 2 4 ~ 7 ~]
  [5 ~ 4 ~ 2 ~ 4 5 ~ 5 ~ 4 2 ~ 0 ~]
  [4 ~ 2 ~ 1 ~ 2 4 ~ 4 ~ 6 4 ~ 2 ~]
  [3 ~ 1 ~ -1 ~ 1 3 ~ 3 ~ 4 6 ~ 8 ~]
>\`).scale("F#4:minor")

// the hoover: wide detuned saws that swoop up into each note
const hoover = note("<[f#3 ~ ~ a3] [d3 ~ ~ f#3] [a3 ~ c#4 ~] [e3 ~ g#3 b3]>")
  .s("supersaw").detune(1).unison(7)
  .penv(-12).pattack(0.12)
  .release(0.3)
  .lpf(2500)
  .room(0.3)
  .gain(0.4)

stack(
  s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9),
  s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35),
  s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65),
  note("<f#1 d1 a1 e1>").struct("[~ x]*4").add(note("[0 12]*2"))
    .s("square").penv(12).pattack(0).pdecay(0.04)
    .decay(0.12).sustain(0).lpf(1600).gain(0.55),

  riff.s("piano").room(0.3).gain(0.8).mask("<1!4 0!4>"),  // bars 1-4
  hoover.mask("<0!4 1!4>")                                  // bars 5-8
)`,
  },
  {
    name: "33 · New Monkey II: breakdown & kick roll",
    about: "Piano riff alone in a big room with choir chords, then a kick roll that speeds up into the drop.",
    code: `setcps(172/60/4)

const breakdown = stack(
  n(\`<
    [4 ~ 2 ~ 0 ~ 2 4 ~ 4 ~ 2 4 ~ 7 ~]
    [5 ~ 4 ~ 2 ~ 4 5 ~ 5 ~ 4 2 ~ 0 ~]
    [4 ~ 2 ~ 1 ~ 2 4 ~ 4 ~ 6 4 ~ 2 ~]
    [3 ~ 1 ~ -1 ~ 1 3 ~ 3 ~ 4 6 ~ 8 ~]
  >\`).scale("F#4:minor")
    .s("piano")
    .room(0.8).size(0.9)
    .gain(0.75),
  chord("<F#m D A E>").voicing()
    .s("gm_choir_aahs")
    .room(0.8)
    .gain(0.45)
)

// the kick comes back first, doubling up bar by bar, its filter opening
const kickRoll = arrange(
  [2, s("bd*4")],
  [1, s("bd*8")],
  [1, s("[bd*8 bd*16]")],
).bank("RolandTR909")
  .shape(0.5)
  .lpf(saw.range(300, 8000).slow(4))
  .gain(0.85)

// a hoover that rises across the whole build
const riser = note("f#3").s("supersaw").detune(1).unison(7)
  .attack(0.5).release(0.5)
  .lpf(saw.range(400, 4000).slow(4))
  .gain(0.3)

// 8 bars of breakdown, then 4 bars of kick roll, on repeat
arrange([8, breakdown], [4, stack(kickRoll, riser)])`,
  },
  {
    name: "34 · New Monkey II: full flow",
    about: "The second tune, arranged: pluck bounce, piano riff, piano vs hoover, breakdown, kick roll and drop. About 1:35 a lap.",
    code: `// Plays the full flow by itself. Edit any part and press Ctrl+Enter;
// change the numbers in arrange() to lengthen or shorten a section (in bars).
setcps(172/60/4)

const kick  = s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9)
  .lastOf(8, x => x.inside(4, y => y.ply("<1 1 1 2>")))
const hats  = s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35)
const claps = s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65)

const pluck = note("<f#1 d1 a1 e1>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("square").penv(12).pattack(0).pdecay(0.04)
  .decay(0.12).sustain(0).lpf(1600).gain(0.55)

const melody = n(\`<
  [4 ~ 2 ~ 0 ~ 2 4 ~ 4 ~ 2 4 ~ 7 ~]
  [5 ~ 4 ~ 2 ~ 4 5 ~ 5 ~ 4 2 ~ 0 ~]
  [4 ~ 2 ~ 1 ~ 2 4 ~ 4 ~ 6 4 ~ 2 ~]
  [3 ~ 1 ~ -1 ~ 1 3 ~ 3 ~ 4 6 ~ 8 ~]
>\`).scale("F#4:minor")
const piano = melody.s("piano").room(0.3).gain(0.8)
const riff = stack(
  piano,
  melody.s("supersaw").decay(0.12).sustain(0).hpf(500).lpf(5000).gain(0.25)
)

const hoover = note("<[f#3 ~ ~ a3] [d3 ~ ~ f#3] [a3 ~ c#4 ~] [e3 ~ g#3 b3]>")
  .s("supersaw").detune(1).unison(7).penv(-12).pattack(0.12)
  .release(0.3).lpf(2500).room(0.3).gain(0.4)

const choir = chord("<F#m D A E>").voicing().s("gm_choir_aahs").room(0.8).gain(0.45)

const kickRoll = arrange([2, s("bd*4")], [1, s("bd*8")], [1, s("[bd*8 bd*16]")])
  .bank("RolandTR909").shape(0.5).lpf(saw.range(300, 8000).slow(4)).gain(0.85)

arrange(
  [8,  stack(kick, hats)],                                              // intro
  [8,  stack(kick, hats, claps, pluck)],                                // pluck bounce
  [16, stack(kick, hats, claps, pluck, riff)],                          // piano riff
  [4,  stack(kick, hats, claps, pluck, piano)],                         // piano calls...
  [4,  stack(kick, hats, claps, pluck, hoover)],                        // ...hoover answers
  [8,  stack(melody.s("piano").room(0.8).size(0.9), choir)],            // breakdown
  [4,  stack(kickRoll, choir.gain(0.3))],                               // kick roll
  [16, stack(kick, hats, claps, pluck, riff, hoover.gain(0.3))],        // drop
)`,
  },
];
