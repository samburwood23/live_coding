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

  // ---------------------------------------------------------------- NEW MONKEY III
  // A third New Monkey tune, "Sunrise": 165 BPM, D minor, Dm - Bb - F - C.
  // A gated trance arp that slowly opens up, and a 3-3-2 lead hook.
  // 35-38 build it up one section at a time; 39 plays the whole flow.
  {
    name: "35 · New Monkey III: dawn groove",
    about: "Kick, hats, claps and the octave-bouncing offbeat bass over Dm - Bb - F - C.",
    code: `setcps(165/60/4) // 165 BPM

const kick = s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9)
const hats = s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35)
const claps = s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65)

// octave-bouncing offbeat bass, one root per bar
const bass = note("<d2 bb1 f1 c2>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("supersaw").decay(0.1).sustain(0).lpf(1600).lpq(4).gain(0.55)

stack(kick, hats, claps, bass)`,
  },
  {
    name: "36 · New Monkey III: gated arp",
    about: "A 16th-note supersaw arp that follows the chords, its filter opening and closing over 16 bars.",
    code: `setcps(165/60/4) // 165 BPM

const kick = s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9)
const hats = s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35)
const claps = s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65)

// octave-bouncing offbeat bass, one root per bar
const bass = note("<d2 bb1 f1 c2>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("supersaw").decay(0.1).sustain(0).lpf(1600).lpq(4).gain(0.55)

// a 16th-note arp moved onto each chord: +0 Dm, -2 Bb, +2 F, -1 C
const arp = n("[0 2 4 7 4 2 4 7]*2").add(n("<0 -2 2 -1>")).scale("D4:minor")
  .s("supersaw").decay(0.08).sustain(0)
  .lpf(sine.range(800, 5000).slow(16)) // opens and closes over 16 bars
  .delay(0.25).delaytime(0.27).gain(0.35)

stack(kick, hats, claps, bass, arp)`,
  },
  {
    name: "37 · New Monkey III: the hook",
    about: "The lead hook on a 3-3-2 rhythm over the arp and warm pads.",
    code: `setcps(165/60/4) // 165 BPM

const kick = s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9)
const hats = s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35)
const claps = s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65)

// octave-bouncing offbeat bass, one root per bar
const bass = note("<d2 bb1 f1 c2>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("supersaw").decay(0.1).sustain(0).lpf(1600).lpq(4).gain(0.55)

// a 16th-note arp moved onto each chord: +0 Dm, -2 Bb, +2 F, -1 C
const arp = n("[0 2 4 7 4 2 4 7]*2").add(n("<0 -2 2 -1>")).scale("D4:minor")
  .s("supersaw").decay(0.08).sustain(0)
  .lpf(sine.range(800, 5000).slow(16)) // opens and closes over 16 bars
  .delay(0.25).delaytime(0.27).gain(0.35)

// the hook: 3-3-2 rhythm, two chord tones per bar
const lead = n("<[4 ~ ~ 4 ~ ~ 2 ~] [2 ~ ~ 2 ~ ~ 0 ~] [4 ~ ~ 4 ~ ~ 6 ~] [3 ~ ~ 3 ~ ~ 1 ~]>")
  .scale("D5:minor")
  .s("supersaw").detune(0.4).release(0.2)
  .lpf(4000).room(0.3).gain(0.35)

const pads = chord("<Dm Bb F C>").voicing().s("gm_pad_warm").room(0.6).gain(0.5)

stack(kick, hats, claps, bass, arp, lead, pads)`,
  },
  {
    name: "38 · New Monkey III: breakdown & build",
    about: "No kick: the arp wide open in a big room with pads and the hook, then a snare roll back in.",
    code: `setcps(165/60/4) // 165 BPM

// a 16th-note arp moved onto each chord: +0 Dm, -2 Bb, +2 F, -1 C
const arp = n("[0 2 4 7 4 2 4 7]*2").add(n("<0 -2 2 -1>")).scale("D4:minor")
  .s("supersaw").decay(0.08).sustain(0)
  .lpf(sine.range(800, 5000).slow(16)) // opens and closes over 16 bars
  .delay(0.25).delaytime(0.27).gain(0.35)

// the hook: 3-3-2 rhythm, two chord tones per bar
const lead = n("<[4 ~ ~ 4 ~ ~ 2 ~] [2 ~ ~ 2 ~ ~ 0 ~] [4 ~ ~ 4 ~ ~ 6 ~] [3 ~ ~ 3 ~ ~ 1 ~]>")
  .scale("D5:minor")
  .s("supersaw").detune(0.4).release(0.2)
  .lpf(4000).room(0.3).gain(0.35)

const pads = chord("<Dm Bb F C>").voicing().s("gm_pad_warm").room(0.6).gain(0.5)

// snare roll: quarters, eighths, then 16ths into 32nds, pitch rising
const roll = arrange([2, s("sd*4")], [1, s("sd*8")], [1, s("[sd*8 sd*16]")])
  .bank("RolandTR909").speed(saw.range(1, 2).slow(4)).gain(saw.range(0.5, 1).slow(4))

// octave-bouncing offbeat bass, one root per bar
const bass = note("<d2 bb1 f1 c2>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("supersaw").decay(0.1).sustain(0).lpf(1600).lpq(4).gain(0.55)

// 8 bars of breakdown, then 4 bars of build, on repeat
arrange(
  [8, stack(arp.lpf(5000).room(0.8).size(0.9), lead.room(0.7), pads)],
  [4, stack(roll, bass.lpf(saw.range(200, 1600).slow(4)), pads.gain(0.3))],
)`,
  },
  {
    name: "39 · New Monkey III: full flow",
    about: "The whole tune arranged (68 bars): intro, groove, gated arp, the hook, breakdown, build, drop. About 1:40 a lap.",
    code: `// Plays the full flow by itself. Edit any part and press Ctrl+Enter;
// change the numbers in arrange() to lengthen or shorten a section (in bars).
setcps(165/60/4) // 165 BPM

const kick = s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9)
const hats = s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35)
const claps = s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65)

// octave-bouncing offbeat bass, one root per bar
const bass = note("<d2 bb1 f1 c2>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("supersaw").decay(0.1).sustain(0).lpf(1600).lpq(4).gain(0.55)

// a 16th-note arp moved onto each chord: +0 Dm, -2 Bb, +2 F, -1 C
const arp = n("[0 2 4 7 4 2 4 7]*2").add(n("<0 -2 2 -1>")).scale("D4:minor")
  .s("supersaw").decay(0.08).sustain(0)
  .lpf(sine.range(800, 5000).slow(16)) // opens and closes over 16 bars
  .delay(0.25).delaytime(0.27).gain(0.35)

// the hook: 3-3-2 rhythm, two chord tones per bar
const lead = n("<[4 ~ ~ 4 ~ ~ 2 ~] [2 ~ ~ 2 ~ ~ 0 ~] [4 ~ ~ 4 ~ ~ 6 ~] [3 ~ ~ 3 ~ ~ 1 ~]>")
  .scale("D5:minor")
  .s("supersaw").detune(0.4).release(0.2)
  .lpf(4000).room(0.3).gain(0.35)

const pads = chord("<Dm Bb F C>").voicing().s("gm_pad_warm").room(0.6).gain(0.5)

// snare roll: quarters, eighths, then 16ths into 32nds, pitch rising
const roll = arrange([2, s("sd*4")], [1, s("sd*8")], [1, s("[sd*8 sd*16]")])
  .bank("RolandTR909").speed(saw.range(1, 2).slow(4)).gain(saw.range(0.5, 1).slow(4))

arrange(
  [8,  stack(kick, hats)],                                                    // intro
  [8,  stack(kick, hats, claps, bass)],                                       // groove
  [16, stack(kick, hats, claps, bass, arp)],                                  // gated arp
  [8,  stack(kick, hats, claps, bass, arp, lead, pads)],                      // the hook
  [8,  stack(arp.lpf(5000).room(0.8).size(0.9), lead.room(0.7), pads)],       // breakdown
  [4,  stack(roll, bass.lpf(saw.range(200, 1600).slow(4)), pads.gain(0.3))],  // build
  [16, stack(kick, hats, claps, bass, arp.lpf(5000), lead, pads)],            // drop
)`,
  },

  // ---------------------------------------------------------------- NEW MONKEY IV
  // A fourth New Monkey tune, "Hoover Stomper": 170 BPM, G minor, Gm - Eb - Cm - D.
  // Darker: a heavily driven kick, a reese bass, orchestra-hit stabs and a hoover riff.
  // 40-43 build it up one section at a time; 44 plays the whole flow.
  {
    name: "40 · New Monkey IV: stomp & reese",
    about: "A heavily driven kick, choppy hats and a distorted reese bass on every offbeat.",
    code: `setcps(170/60/4) // 170 BPM

const kick = s("bd*4").bank("RolandTR909").shape(0.75).gain(0.85)
const hats = s("[~ oh]*4, [hh hh ~ hh]*4").bank("RolandTR909").gain(0.35)
const claps = s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65)

// a rubbery reese on every offbeat, a little distorted
const bass = note("<g1 eb1 c2 d2>").struct("[~ x]*4")
  .s("supersaw").detune(0.6).decay(0.15).sustain(0)
  .lpf(1000).shape(0.3).gain(0.55)

stack(kick, hats, claps, bass)`,
  },
  {
    name: "41 · New Monkey IV: orchestra stabs",
    about: "Orchestra hits on the 3-3-2 rhythm over Gm - Eb - Cm - D.",
    code: `setcps(170/60/4) // 170 BPM

const kick = s("bd*4").bank("RolandTR909").shape(0.75).gain(0.85)
const hats = s("[~ oh]*4, [hh hh ~ hh]*4").bank("RolandTR909").gain(0.35)
const claps = s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65)

// a rubbery reese on every offbeat, a little distorted
const bass = note("<g1 eb1 c2 d2>").struct("[~ x]*4")
  .s("supersaw").detune(0.6).decay(0.15).sustain(0)
  .lpf(1000).shape(0.3).gain(0.55)

// orchestra hits on the 3-3-2
const stabs = chord("<Gm Eb Cm D>").voicing().struct("x ~ ~ x ~ ~ x ~")
  .s("gm_orchestra_hit").room(0.3).gain(0.5)

stack(kick, hats, claps, bass, stabs)`,
  },
  {
    name: "42 · New Monkey IV: hoover riff",
    about: "The main riff on a swooping hoover, with the stabs underneath.",
    code: `setcps(170/60/4) // 170 BPM

const kick = s("bd*4").bank("RolandTR909").shape(0.75).gain(0.85)
const hats = s("[~ oh]*4, [hh hh ~ hh]*4").bank("RolandTR909").gain(0.35)
const claps = s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65)

// a rubbery reese on every offbeat, a little distorted
const bass = note("<g1 eb1 c2 d2>").struct("[~ x]*4")
  .s("supersaw").detune(0.6).decay(0.15).sustain(0)
  .lpf(1000).shape(0.3).gain(0.55)

// orchestra hits on the 3-3-2
const stabs = chord("<Gm Eb Cm D>").voicing().struct("x ~ ~ x ~ ~ x ~")
  .s("gm_orchestra_hit").room(0.3).gain(0.5)

// wide detuned saws swooping up into each note
const hoover = note("<[g2 ~ ~ ~ bb2 ~ a2 ~] [g2 ~ ~ ~ eb2 ~ ~ ~] [c3 ~ ~ ~ eb3 ~ d3 ~] [d3 ~ ~ ~ f#3 ~ a3 ~]>")
  .s("supersaw").detune(1).unison(7)
  .penv(-12).pattack(0.1).release(0.4)
  .lpf(2200).room(0.3).gain(0.4)

stack(kick, hats, claps, bass, stabs, hoover)`,
  },
  {
    name: "43 · New Monkey IV: siren breakdown & clap roll",
    about: "Strings, a rave siren and the hoover in reverb, then a clap roll back in.",
    code: `setcps(170/60/4) // 170 BPM

const strings = chord("<Gm Eb Cm D>").voicing().s("gm_synth_strings_1").room(0.7).gain(0.45)

// a rave siren: a sine sweeping up and down, twice a bar
const siren = note(sine.range(70, 82).fast(2).segment(32)).s("sine").release(0.05).gain(0.2)

// wide detuned saws swooping up into each note
const hoover = note("<[g2 ~ ~ ~ bb2 ~ a2 ~] [g2 ~ ~ ~ eb2 ~ ~ ~] [c3 ~ ~ ~ eb3 ~ d3 ~] [d3 ~ ~ ~ f#3 ~ a3 ~]>")
  .s("supersaw").detune(1).unison(7)
  .penv(-12).pattack(0.1).release(0.4)
  .lpf(2200).room(0.3).gain(0.4)

// clap roll that speeds up and rises in pitch
const roll = arrange([2, s("cp*4")], [1, s("cp*8")], [1, s("[cp*8 cp*16]")])
  .bank("RolandTR909").speed(saw.range(1, 1.8).slow(4)).gain(saw.range(0.5, 1).slow(4))

// a rubbery reese on every offbeat, a little distorted
const bass = note("<g1 eb1 c2 d2>").struct("[~ x]*4")
  .s("supersaw").detune(0.6).decay(0.15).sustain(0)
  .lpf(1000).shape(0.3).gain(0.55)

// 8 bars of breakdown, then 4 bars of build, on repeat
arrange(
  [8, stack(strings, siren, hoover.room(0.8).size(0.9).gain(0.3))],
  [4, stack(roll, bass.lpf(saw.range(200, 1000).slow(4)), siren)],
)`,
  },
  {
    name: "44 · New Monkey IV: full flow",
    about: "The whole tune arranged (68 bars): intro, stomp & reese, stabs, hoover riff, breakdown, clap roll, drop. About 1:35 a lap.",
    code: `// Plays the full flow by itself. Edit any part and press Ctrl+Enter;
// change the numbers in arrange() to lengthen or shorten a section (in bars).
setcps(170/60/4) // 170 BPM

const kick = s("bd*4").bank("RolandTR909").shape(0.75).gain(0.85)
const hats = s("[~ oh]*4, [hh hh ~ hh]*4").bank("RolandTR909").gain(0.35)
const claps = s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65)

// a rubbery reese on every offbeat, a little distorted
const bass = note("<g1 eb1 c2 d2>").struct("[~ x]*4")
  .s("supersaw").detune(0.6).decay(0.15).sustain(0)
  .lpf(1000).shape(0.3).gain(0.55)

// orchestra hits on the 3-3-2
const stabs = chord("<Gm Eb Cm D>").voicing().struct("x ~ ~ x ~ ~ x ~")
  .s("gm_orchestra_hit").room(0.3).gain(0.5)

// wide detuned saws swooping up into each note
const hoover = note("<[g2 ~ ~ ~ bb2 ~ a2 ~] [g2 ~ ~ ~ eb2 ~ ~ ~] [c3 ~ ~ ~ eb3 ~ d3 ~] [d3 ~ ~ ~ f#3 ~ a3 ~]>")
  .s("supersaw").detune(1).unison(7)
  .penv(-12).pattack(0.1).release(0.4)
  .lpf(2200).room(0.3).gain(0.4)

// a rave siren: a sine sweeping up and down, twice a bar
const siren = note(sine.range(70, 82).fast(2).segment(32)).s("sine").release(0.05).gain(0.2)

const strings = chord("<Gm Eb Cm D>").voicing().s("gm_synth_strings_1").room(0.7).gain(0.45)

// clap roll that speeds up and rises in pitch
const roll = arrange([2, s("cp*4")], [1, s("cp*8")], [1, s("[cp*8 cp*16]")])
  .bank("RolandTR909").speed(saw.range(1, 1.8).slow(4)).gain(saw.range(0.5, 1).slow(4))

arrange(
  [8,  stack(kick, hats)],                                                  // intro
  [8,  stack(kick, hats, claps, bass)],                                     // stomp & reese
  [8,  stack(kick, hats, claps, bass, stabs)],                              // stabs
  [16, stack(kick, hats, claps, bass, stabs, hoover)],                      // hoover riff
  [8,  stack(strings, siren, hoover.room(0.8).size(0.9).gain(0.3))],        // breakdown
  [4,  stack(roll, bass.lpf(saw.range(200, 1000).slow(4)), siren)],         // clap roll
  [16, stack(kick, hats, claps, bass, stabs, hoover, strings.gain(0.25))],  // drop
)`,
  },

  // ---------------------------------------------------------------- NEW MONKEY V
  // A fifth New Monkey tune, "Bells": 174 BPM, B minor, Bm - G - D - A.
  // A glockenspiel riff doubled on music box, offbeat pianos and a kick-roll build.
  // 45-48 build it up one section at a time; 49 plays the whole flow.
  {
    name: "45 · New Monkey V: skip bounce",
    about: "Kick, hats, claps with a rim and a sawtooth bass bouncing an octave on the offbeats.",
    code: `setcps(174/60/4) // 174 BPM

const kick = s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9)
const hats = s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.3)
const claps = s("~ [cp,rim] ~ cp").bank("RolandTR909").room(0.2).gain(0.6)

const bass = note("<b1 g1 d2 a1>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("sawtooth").decay(0.1).sustain(0).lpf(1400).gain(0.5)

stack(kick, hats, claps, bass)`,
  },
  {
    name: "46 · New Monkey V: bell riff",
    about: "The riff on glockenspiel doubled with a music box over Bm - G - D - A.",
    code: `setcps(174/60/4) // 174 BPM

const kick = s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9)
const hats = s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.3)
const claps = s("~ [cp,rim] ~ cp").bank("RolandTR909").room(0.2).gain(0.6)

const bass = note("<b1 g1 d2 a1>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("sawtooth").decay(0.1).sustain(0).lpf(1400).gain(0.5)

// one bar per chord: Bm, G, D, A
const melody = n(\`<
  [7 ~ 4 ~ 7 ~ 4 ~ 9 7 4 ~ 2 ~ 4 ~]
  [7 ~ 5 ~ 7 ~ 5 ~ 9 7 5 ~ 2 ~ 5 ~]
  [6 ~ 4 ~ 6 ~ 4 ~ 9 6 4 ~ 2 ~ 4 ~]
  [6 ~ 3 ~ 6 ~ 3 ~ 8 6 3 ~ 1 ~ 3 ~]
>\`).scale("B4:minor")

const bells = stack(
  melody.s("gm_glockenspiel").gain(0.7),
  melody.s("gm_music_box").room(0.3).gain(0.5)
)

stack(kick, hats, claps, bass, bells)`,
  },
  {
    name: "47 · New Monkey V: offbeat pianos",
    about: "Piano chords on every offbeat and strings under the bells.",
    code: `setcps(174/60/4) // 174 BPM

const kick = s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9)
const hats = s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.3)
const claps = s("~ [cp,rim] ~ cp").bank("RolandTR909").room(0.2).gain(0.6)

const bass = note("<b1 g1 d2 a1>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("sawtooth").decay(0.1).sustain(0).lpf(1400).gain(0.5)

// one bar per chord: Bm, G, D, A
const melody = n(\`<
  [7 ~ 4 ~ 7 ~ 4 ~ 9 7 4 ~ 2 ~ 4 ~]
  [7 ~ 5 ~ 7 ~ 5 ~ 9 7 5 ~ 2 ~ 5 ~]
  [6 ~ 4 ~ 6 ~ 4 ~ 9 6 4 ~ 2 ~ 4 ~]
  [6 ~ 3 ~ 6 ~ 3 ~ 8 6 3 ~ 1 ~ 3 ~]
>\`).scale("B4:minor")

const bells = stack(
  melody.s("gm_glockenspiel").gain(0.7),
  melody.s("gm_music_box").room(0.3).gain(0.5)
)

// piano chords on every offbeat, with the bass
const pianos = chord("<Bm G D A>").voicing().struct("[~ x]*4").s("piano").gain(0.5)

const strings = chord("<Bm G D A>").voicing().s("gm_synth_strings_1").room(0.6).gain(0.4)

stack(kick, hats, claps, bass, bells, pianos, strings)`,
  },
  {
    name: "48 · New Monkey V: breakdown & kick roll",
    about: "The riff alone on music box in a big room with strings, then a kick roll into the drop.",
    code: `setcps(174/60/4) // 174 BPM

// one bar per chord: Bm, G, D, A
const melody = n(\`<
  [7 ~ 4 ~ 7 ~ 4 ~ 9 7 4 ~ 2 ~ 4 ~]
  [7 ~ 5 ~ 7 ~ 5 ~ 9 7 5 ~ 2 ~ 5 ~]
  [6 ~ 4 ~ 6 ~ 4 ~ 9 6 4 ~ 2 ~ 4 ~]
  [6 ~ 3 ~ 6 ~ 3 ~ 8 6 3 ~ 1 ~ 3 ~]
>\`).scale("B4:minor")

const strings = chord("<Bm G D A>").voicing().s("gm_synth_strings_1").room(0.6).gain(0.4)

// the kick comes back first, doubling up, its filter opening
const kickRoll = arrange([2, s("bd*4")], [1, s("bd*8")], [1, s("[bd*8 bd*16]")])
  .bank("RolandTR909").shape(0.5).lpf(saw.range(300, 8000).slow(4)).gain(0.85)

// 8 bars of breakdown, then 4 bars of build, on repeat
arrange(
  [8, stack(melody.s("gm_music_box").room(0.8).size(0.9).gain(0.6), strings)],
  [4, stack(kickRoll, strings.gain(0.3))],
)`,
  },
  {
    name: "49 · New Monkey V: full flow",
    about: "The whole tune arranged (68 bars): intro, skip bounce, bell riff, offbeat pianos, breakdown, kick roll, drop. About 1:35 a lap.",
    code: `// Plays the full flow by itself. Edit any part and press Ctrl+Enter;
// change the numbers in arrange() to lengthen or shorten a section (in bars).
setcps(174/60/4) // 174 BPM

const kick = s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9)
const hats = s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.3)
const claps = s("~ [cp,rim] ~ cp").bank("RolandTR909").room(0.2).gain(0.6)

const bass = note("<b1 g1 d2 a1>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("sawtooth").decay(0.1).sustain(0).lpf(1400).gain(0.5)

// one bar per chord: Bm, G, D, A
const melody = n(\`<
  [7 ~ 4 ~ 7 ~ 4 ~ 9 7 4 ~ 2 ~ 4 ~]
  [7 ~ 5 ~ 7 ~ 5 ~ 9 7 5 ~ 2 ~ 5 ~]
  [6 ~ 4 ~ 6 ~ 4 ~ 9 6 4 ~ 2 ~ 4 ~]
  [6 ~ 3 ~ 6 ~ 3 ~ 8 6 3 ~ 1 ~ 3 ~]
>\`).scale("B4:minor")

const bells = stack(
  melody.s("gm_glockenspiel").gain(0.7),
  melody.s("gm_music_box").room(0.3).gain(0.5)
)

// piano chords on every offbeat, with the bass
const pianos = chord("<Bm G D A>").voicing().struct("[~ x]*4").s("piano").gain(0.5)

const strings = chord("<Bm G D A>").voicing().s("gm_synth_strings_1").room(0.6).gain(0.4)

// the kick comes back first, doubling up, its filter opening
const kickRoll = arrange([2, s("bd*4")], [1, s("bd*8")], [1, s("[bd*8 bd*16]")])
  .bank("RolandTR909").shape(0.5).lpf(saw.range(300, 8000).slow(4)).gain(0.85)

arrange(
  [8,  stack(kick, hats)],                                                       // intro
  [8,  stack(kick, hats, claps, bass)],                                          // skip bounce
  [16, stack(kick, hats, claps, bass, bells)],                                   // bell riff
  [8,  stack(kick, hats, claps, bass, bells, pianos, strings)],                  // offbeat pianos
  [8,  stack(melody.s("gm_music_box").room(0.8).size(0.9).gain(0.6), strings)],  // breakdown
  [4,  stack(kickRoll, strings.gain(0.3))],                                      // kick roll
  [16, stack(kick, hats, claps, bass, bells, pianos, strings)],                  // drop
)`,
  },

  // ---------------------------------------------------------------- NEW MONKEY VI
  // A sixth New Monkey tune, "Happy Monkey": 170 BPM, E major, E - B - C#m - A.
  // The cheesy, happy-hardcore side: skippy pianos, a squelchy lead and a vocal-style hook.
  // 50-53 build it up one section at a time; 54 plays the whole flow.
  {
    name: "50 · New Monkey VI: happy bounce",
    about: "Kick, hats, claps and an octave-bouncing bass over the happy E - B - C#m - A.",
    code: `setcps(170/60/4) // 170 BPM

const kick = s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9)
const hats = s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35)
const claps = s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65)

const bass = note("<e2 b1 c#2 a1>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("supersaw").decay(0.1).sustain(0).lpf(1600).lpq(4).gain(0.55)

stack(kick, hats, claps, bass)`,
  },
  {
    name: "51 · New Monkey VI: skippy pianos",
    about: "Happy-hardcore piano chords on a skippy rhythm.",
    code: `setcps(170/60/4) // 170 BPM

const kick = s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9)
const hats = s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35)
const claps = s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65)

const bass = note("<e2 b1 c#2 a1>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("supersaw").decay(0.1).sustain(0).lpf(1600).lpq(4).gain(0.55)

// skippy happy-hardcore piano chords
const pianos = chord("<E B C#m A>").voicing().struct("x ~ x x ~ x ~ x")
  .s("piano").room(0.3).gain(0.6)

stack(kick, hats, claps, bass, pianos)`,
  },
  {
    name: "52 · New Monkey VI: squelch lead & vocal",
    about: "A squelchy square lead with a wobbling resonant filter, and a high vocal-style hook.",
    code: `setcps(170/60/4) // 170 BPM

const kick = s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9)
const hats = s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35)
const claps = s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65)

const bass = note("<e2 b1 c#2 a1>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("supersaw").decay(0.1).sustain(0).lpf(1600).lpq(4).gain(0.55)

// skippy happy-hardcore piano chords
const pianos = chord("<E B C#m A>").voicing().struct("x ~ x x ~ x ~ x")
  .s("piano").room(0.3).gain(0.6)

// one bar per chord: E, B, C#m, A
const melody = n(\`<
  [4 ~ 4 ~ 2 4 ~ 7 ~ 7 ~ 4 2 ~ 0 ~]
  [4 ~ 4 ~ 1 4 ~ 6 ~ 6 ~ 4 1 ~ -1 ~]
  [5 ~ 5 ~ 2 5 ~ 7 ~ 7 ~ 5 2 ~ 0 ~]
  [5 ~ 5 ~ 3 5 ~ 7 ~ 7 ~ 9 8 ~ 7 ~]
>\`).scale("E4:major")

// squelchy: a resonant filter wobbling twice a bar
const lead = melody.s("square").decay(0.15).sustain(0.3)
  .lpf(sine.range(800, 3500).fast(2)).lpq(10)
  .delay(0.25).delaytime(0.26).gain(0.3)

// the hook on a voice lead, high like a sped-up vocal
const vocal = n("<[7 ~ 7 ~ 8 ~ 7 ~] [6 ~ 6 ~ 4 ~ 6 ~] [7 ~ 7 ~ 9 ~ 7 ~] [7 ~ 5 ~ 4 ~ 3 ~]>")
  .scale("E5:major").s("gm_lead_6_voice").room(0.4).gain(0.5)

stack(kick, hats, claps, bass, pianos, lead, vocal)`,
  },
  {
    name: "53 · New Monkey VI: breakdown & build",
    about: "Pianos and the vocal hook in reverb, then a snare roll with the pianos' filter opening.",
    code: `setcps(170/60/4) // 170 BPM

// skippy happy-hardcore piano chords
const pianos = chord("<E B C#m A>").voicing().struct("x ~ x x ~ x ~ x")
  .s("piano").room(0.3).gain(0.6)

// the hook on a voice lead, high like a sped-up vocal
const vocal = n("<[7 ~ 7 ~ 8 ~ 7 ~] [6 ~ 6 ~ 4 ~ 6 ~] [7 ~ 7 ~ 9 ~ 7 ~] [7 ~ 5 ~ 4 ~ 3 ~]>")
  .scale("E5:major").s("gm_lead_6_voice").room(0.4).gain(0.5)

const roll = arrange([2, s("sd*4")], [1, s("sd*8")], [1, s("[sd*8 sd*16]")])
  .bank("RolandTR909").speed(saw.range(1, 2).slow(4)).gain(saw.range(0.5, 1).slow(4))

const bass = note("<e2 b1 c#2 a1>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("supersaw").decay(0.1).sustain(0).lpf(1600).lpq(4).gain(0.55)

// 8 bars of breakdown, then 4 bars of build, on repeat
arrange(
  [8, stack(pianos.room(0.8).size(0.9), vocal.room(0.8))],
  [4, stack(roll, pianos.lpf(saw.range(300, 5000).slow(4)), bass.lpf(saw.range(200, 1600).slow(4)))],
)`,
  },
  {
    name: "54 · New Monkey VI: full flow",
    about: "The whole tune arranged (68 bars): intro, happy bounce, skippy pianos, lead & vocal, breakdown, build, drop. About 1:35 a lap.",
    code: `// Plays the full flow by itself. Edit any part and press Ctrl+Enter;
// change the numbers in arrange() to lengthen or shorten a section (in bars).
setcps(170/60/4) // 170 BPM

const kick = s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9)
const hats = s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35)
const claps = s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65)

const bass = note("<e2 b1 c#2 a1>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("supersaw").decay(0.1).sustain(0).lpf(1600).lpq(4).gain(0.55)

// skippy happy-hardcore piano chords
const pianos = chord("<E B C#m A>").voicing().struct("x ~ x x ~ x ~ x")
  .s("piano").room(0.3).gain(0.6)

// one bar per chord: E, B, C#m, A
const melody = n(\`<
  [4 ~ 4 ~ 2 4 ~ 7 ~ 7 ~ 4 2 ~ 0 ~]
  [4 ~ 4 ~ 1 4 ~ 6 ~ 6 ~ 4 1 ~ -1 ~]
  [5 ~ 5 ~ 2 5 ~ 7 ~ 7 ~ 5 2 ~ 0 ~]
  [5 ~ 5 ~ 3 5 ~ 7 ~ 7 ~ 9 8 ~ 7 ~]
>\`).scale("E4:major")

// squelchy: a resonant filter wobbling twice a bar
const lead = melody.s("square").decay(0.15).sustain(0.3)
  .lpf(sine.range(800, 3500).fast(2)).lpq(10)
  .delay(0.25).delaytime(0.26).gain(0.3)

// the hook on a voice lead, high like a sped-up vocal
const vocal = n("<[7 ~ 7 ~ 8 ~ 7 ~] [6 ~ 6 ~ 4 ~ 6 ~] [7 ~ 7 ~ 9 ~ 7 ~] [7 ~ 5 ~ 4 ~ 3 ~]>")
  .scale("E5:major").s("gm_lead_6_voice").room(0.4).gain(0.5)

const roll = arrange([2, s("sd*4")], [1, s("sd*8")], [1, s("[sd*8 sd*16]")])
  .bank("RolandTR909").speed(saw.range(1, 2).slow(4)).gain(saw.range(0.5, 1).slow(4))

arrange(
  [8,  stack(kick, hats)],                                                                              // intro
  [8,  stack(kick, hats, claps, bass)],                                                                 // happy bounce
  [8,  stack(kick, hats, claps, bass, pianos)],                                                         // skippy pianos
  [16, stack(kick, hats, claps, bass, pianos, lead, vocal)],                                            // lead & vocal
  [8,  stack(pianos.room(0.8).size(0.9), vocal.room(0.8))],                                             // breakdown
  [4,  stack(roll, pianos.lpf(saw.range(300, 5000).slow(4)), bass.lpf(saw.range(200, 1600).slow(4)))],  // build
  [16, stack(kick, hats, claps, bass, pianos, lead, vocal)],                                            // drop
)`,
  },

  // ---------------------------------------------------------------- NEW MONKEY VII
  // A seventh New Monkey tune, "Last Tune": 176 BPM, Bb minor, Bbm - Gb - Db - Ab.
  // The fastest: an acid bounce, a 3-3-2 lead with peak-time tricks and a double roll.
  // 55-58 build it up one section at a time; 59 plays the whole flow.
  {
    name: "55 · New Monkey VII: acid bounce",
    about: "Kick with fills, hats, claps and a resonant acid bass bouncing on the offbeats.",
    code: `setcps(176/60/4) // 176 BPM

// double kick on the last beat of every 8th bar
const kick = s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9)
  .lastOf(8, x => x.inside(4, y => y.ply("<1 1 1 2>")))

const hats = s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35)
const claps = s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65)

// acid: a resonant sawtooth whose filter sweeps over 8 bars
const bass = note("<bb1 gb1 db2 ab1>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("sawtooth").decay(0.12).sustain(0)
  .lpf(sine.range(400, 2400).slow(8)).lpq(14).gain(0.5)

stack(kick, hats, claps, bass)`,
  },
  {
    name: "56 · New Monkey VII: 3-3-2 lead",
    about: "The lead: a 3-3-2 riff twice a bar on supersaw, doubled an octave up on square.",
    code: `setcps(176/60/4) // 176 BPM

// double kick on the last beat of every 8th bar
const kick = s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9)
  .lastOf(8, x => x.inside(4, y => y.ply("<1 1 1 2>")))

const hats = s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35)
const claps = s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65)

// acid: a resonant sawtooth whose filter sweeps over 8 bars
const bass = note("<bb1 gb1 db2 ab1>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("sawtooth").decay(0.12).sustain(0)
  .lpf(sine.range(400, 2400).slow(8)).lpq(14).gain(0.5)

// 3-3-2 twice a bar, one bar per chord: Bbm, Gb, Db, Ab
const melody = n(\`<
  [7 ~ ~ 7 ~ ~ 4 ~ 9 ~ ~ 9 ~ ~ 7 ~]
  [7 ~ ~ 7 ~ ~ 5 ~ 9 ~ ~ 9 ~ ~ 7 ~]
  [6 ~ ~ 6 ~ ~ 4 ~ 9 ~ ~ 9 ~ ~ 6 ~]
  [6 ~ ~ 6 ~ ~ 3 ~ 8 ~ ~ 8 ~ ~ 10 ~]
>\`).scale("Bb4:minor")

const lead = stack(
  melody.s("supersaw").detune(0.5).release(0.15).lpf(4500).room(0.3).gain(0.35),
  melody.add(note(12)).s("square").decay(0.1).sustain(0).lpf(3000).gain(0.1)
)

stack(kick, hats, claps, bass, lead)`,
  },
  {
    name: "57 · New Monkey VII: peak tricks",
    about: "The lead jumps an octave every 4th bar and stutters every 8th, with tremolo strings underneath.",
    code: `setcps(176/60/4) // 176 BPM

// double kick on the last beat of every 8th bar
const kick = s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9)
  .lastOf(8, x => x.inside(4, y => y.ply("<1 1 1 2>")))

const hats = s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35)
const claps = s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65)

// acid: a resonant sawtooth whose filter sweeps over 8 bars
const bass = note("<bb1 gb1 db2 ab1>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("sawtooth").decay(0.12).sustain(0)
  .lpf(sine.range(400, 2400).slow(8)).lpq(14).gain(0.5)

// 3-3-2 twice a bar, one bar per chord: Bbm, Gb, Db, Ab
const melody = n(\`<
  [7 ~ ~ 7 ~ ~ 4 ~ 9 ~ ~ 9 ~ ~ 7 ~]
  [7 ~ ~ 7 ~ ~ 5 ~ 9 ~ ~ 9 ~ ~ 7 ~]
  [6 ~ ~ 6 ~ ~ 4 ~ 9 ~ ~ 9 ~ ~ 6 ~]
  [6 ~ ~ 6 ~ ~ 3 ~ 8 ~ ~ 8 ~ ~ 10 ~]
>\`).scale("Bb4:minor")

const lead = stack(
  melody.s("supersaw").detune(0.5).release(0.15).lpf(4500).room(0.3).gain(0.35),
  melody.add(note(12)).s("square").decay(0.1).sustain(0).lpf(3000).gain(0.1)
)

// up an octave every 4th bar, stuttering every 8th
const peakLead = lead.lastOf(4, x => x.add(note(12))).lastOf(8, x => x.ply(2))

const strings = chord("<Bbm Gb Db Ab>").voicing().s("gm_tremolo_strings").room(0.7).gain(0.45)

stack(kick, hats, claps, bass, peakLead, strings)`,
  },
  {
    name: "58 · New Monkey VII: breakdown & double roll",
    about: "The riff on piano with tremolo strings, then snares and kicks rolling together into the drop.",
    code: `setcps(176/60/4) // 176 BPM

// 3-3-2 twice a bar, one bar per chord: Bbm, Gb, Db, Ab
const melody = n(\`<
  [7 ~ ~ 7 ~ ~ 4 ~ 9 ~ ~ 9 ~ ~ 7 ~]
  [7 ~ ~ 7 ~ ~ 5 ~ 9 ~ ~ 9 ~ ~ 7 ~]
  [6 ~ ~ 6 ~ ~ 4 ~ 9 ~ ~ 9 ~ ~ 6 ~]
  [6 ~ ~ 6 ~ ~ 3 ~ 8 ~ ~ 8 ~ ~ 10 ~]
>\`).scale("Bb4:minor")

const strings = chord("<Bbm Gb Db Ab>").voicing().s("gm_tremolo_strings").room(0.7).gain(0.45)

// snares and kicks rolling together
const roll = arrange([2, s("sd*4, bd*4")], [1, s("sd*8, bd*8")], [1, s("[sd*8 sd*16], [bd*8 bd*16]")])
  .bank("RolandTR909").speed(saw.range(1, 1.8).slow(4))
  .lpf(saw.range(500, 10000).slow(4)).gain(saw.range(0.5, 0.95).slow(4))

// acid: a resonant sawtooth whose filter sweeps over 8 bars
const bass = note("<bb1 gb1 db2 ab1>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("sawtooth").decay(0.12).sustain(0)
  .lpf(sine.range(400, 2400).slow(8)).lpq(14).gain(0.5)

// 8 bars of breakdown, then 4 bars of build, on repeat
arrange(
  [8, stack(melody.s("piano").room(0.8).size(0.9).gain(0.75), strings)],
  [4, stack(roll, bass, strings.gain(0.3))],
)`,
  },
  {
    name: "59 · New Monkey VII: full flow",
    about: "The whole tune arranged (68 bars): intro, acid bounce, 3-3-2 lead, breakdown, double roll, drop, outro. About 1:30 a lap.",
    code: `// Plays the full flow by itself. Edit any part and press Ctrl+Enter;
// change the numbers in arrange() to lengthen or shorten a section (in bars).
setcps(176/60/4) // 176 BPM

// double kick on the last beat of every 8th bar
const kick = s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9)
  .lastOf(8, x => x.inside(4, y => y.ply("<1 1 1 2>")))

const hats = s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35)
const claps = s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65)

// acid: a resonant sawtooth whose filter sweeps over 8 bars
const bass = note("<bb1 gb1 db2 ab1>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("sawtooth").decay(0.12).sustain(0)
  .lpf(sine.range(400, 2400).slow(8)).lpq(14).gain(0.5)

// 3-3-2 twice a bar, one bar per chord: Bbm, Gb, Db, Ab
const melody = n(\`<
  [7 ~ ~ 7 ~ ~ 4 ~ 9 ~ ~ 9 ~ ~ 7 ~]
  [7 ~ ~ 7 ~ ~ 5 ~ 9 ~ ~ 9 ~ ~ 7 ~]
  [6 ~ ~ 6 ~ ~ 4 ~ 9 ~ ~ 9 ~ ~ 6 ~]
  [6 ~ ~ 6 ~ ~ 3 ~ 8 ~ ~ 8 ~ ~ 10 ~]
>\`).scale("Bb4:minor")

const lead = stack(
  melody.s("supersaw").detune(0.5).release(0.15).lpf(4500).room(0.3).gain(0.35),
  melody.add(note(12)).s("square").decay(0.1).sustain(0).lpf(3000).gain(0.1)
)

// up an octave every 4th bar, stuttering every 8th
const peakLead = lead.lastOf(4, x => x.add(note(12))).lastOf(8, x => x.ply(2))

const strings = chord("<Bbm Gb Db Ab>").voicing().s("gm_tremolo_strings").room(0.7).gain(0.45)

// snares and kicks rolling together
const roll = arrange([2, s("sd*4, bd*4")], [1, s("sd*8, bd*8")], [1, s("[sd*8 sd*16], [bd*8 bd*16]")])
  .bank("RolandTR909").speed(saw.range(1, 1.8).slow(4))
  .lpf(saw.range(500, 10000).slow(4)).gain(saw.range(0.5, 0.95).slow(4))

arrange(
  [8,  stack(kick, hats)],                                                 // intro
  [8,  stack(kick, hats, claps, bass)],                                    // acid bounce
  [16, stack(kick, hats, claps, bass, lead)],                              // 3-3-2 lead
  [8,  stack(melody.s("piano").room(0.8).size(0.9).gain(0.75), strings)],  // breakdown
  [4,  stack(roll, bass, strings.gain(0.3))],                              // double roll
  [16, stack(kick, hats, claps, bass, peakLead, strings)],                 // drop
  [8,  stack(kick, hats, claps, bass, lead)],                              // outro
)`,
  },
  // ---------------------------------------------------------------- VISUALS
  // Visuals that follow the music. 60-62 use Strudel's built-in drawings;
  // 63-67 use Hydra (hydra.ojack.xyz), a live-coding language for video.
  // Hit "⛶ Projector" for full screen with just the code over the visuals.
  {
    name: "60 · Visuals: pianoroll",
    about: "Add .pianoroll() and every note scrolls past behind the code. .color() picks each layer's colour; the line in the middle is now.",
    code: `setcps(168/60/4)

stack(
  s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9).color("white"),
  s("~ [cp,sd] ~ [cp,sd]").bank("RolandTR909").gain(0.6).color("white"),

  note("<a1 f1 c2 g1>").struct("[~ x]*4").add(note("[0 12]*2"))
    .s("supersaw").decay(0.1).sustain(0).lpf(1800).lpq(4).gain(0.6)
    .color("cyan"),

  n(\`<
    [7 ~ 7 4 ~ 7 ~ 9 ~ 7 ~ 4 2 ~ 4 ~]
    [7 ~ 7 5 ~ 7 ~ 9 ~ 7 ~ 5 2 ~ 5 ~]
    [6 ~ 6 4 ~ 6 ~ 9 ~ 6 ~ 4 2 ~ 4 ~]
    [6 ~ 6 3 ~ 6 ~ 8 ~ 6 ~ 8 9 ~ 10 ~]
  >\`).scale("A3:minor")
    .s("supersaw").detune(0.5).decay(0.18).sustain(0.2).lpf(4500).room(0.3).gain(0.4)
    .color("magenta"),

  chord("<Am F C G>").voicing().struct("~ x ~ x x ~ x ~")
    .s("supersaw").decay(0.15).sustain(0).hpf(400).lpf(3500).gain(0.3)
    .color("yellow")
).pianoroll({ fold: 1 }) // fold: 1 squashes out the empty rows`,
  },
  {
    name: "61 · Visuals: punchcard & spiral",
    about: ".punchcard() is the pianoroll drawn from the final pattern, colours and all. Swap it for .spiral() to wind the bar round a spiral.",
    code: `setcps(174/60/4)

const riff = n(\`<
  [7 ~ 4 ~ 7 ~ 4 ~ 9 7 4 ~ 2 ~ 4 ~]
  [7 ~ 5 ~ 7 ~ 5 ~ 9 7 5 ~ 2 ~ 5 ~]
  [6 ~ 4 ~ 6 ~ 4 ~ 9 6 4 ~ 2 ~ 4 ~]
  [6 ~ 3 ~ 6 ~ 3 ~ 8 6 3 ~ 1 ~ 3 ~]
>\`).scale("B4:minor")

stack(
  s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9),
  s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.3),
  note("<b1 g1 d2 a1>").struct("[~ x]*4").add(note("[0 12]*2"))
    .s("sawtooth").decay(0.1).sustain(0).lpf(1400).gain(0.5)
    .color("orange"),
  riff.s("gm_glockenspiel").gain(0.7).color("cyan"),
  chord("<Bm G D A>").voicing().struct("[~ x]*4").s("piano").gain(0.5).color("magenta")
).punchcard()
// .spiral()  // try this instead of .punchcard()`,
  },
  {
    name: "62 · Visuals: inline scopes",
    about: "Put _ in front (._pianoroll(), ._scope(), ._punchcard()) and the drawing sits small under that line instead of full screen.",
    code: `setcps(172/60/4)

stack(
  s("bd*4, [~ oh]*4, ~ cp ~ cp").bank("RolandTR909").shape(0.5).gain(0.8)
    ._punchcard({ labels: 1 }),

  // the bass's waveform
  note("<f#1 d1 a1 e1>").struct("[~ x]*4").add(note("[0 12]*2"))
    .s("square").penv(12).pattack(0).pdecay(0.04)
    .decay(0.12).sustain(0).lpf(1600).gain(0.55)
    ._scope(),

  n(\`<
    [4 ~ 2 ~ 0 ~ 2 4 ~ 4 ~ 2 4 ~ 7 ~]
    [5 ~ 4 ~ 2 ~ 4 5 ~ 5 ~ 4 2 ~ 0 ~]
    [4 ~ 2 ~ 1 ~ 2 4 ~ 4 ~ 6 4 ~ 2 ~]
    [3 ~ 1 ~ -1 ~ 1 3 ~ 3 ~ 4 6 ~ 8 ~]
  >\`).scale("F#4:minor").s("piano").room(0.3).gain(0.8)
    ._pianoroll()
)`,
  },
  {
    name: "63 · Visuals: Hydra basics",
    about: "Hydra chains video like a modular synth: a source (osc, noise, voronoi, shape), effects, then .out(). The music carries on underneath.",
    code: `await initHydra()

// stripes -> kaleidoscope -> warped by noise -> slowly turning
osc(30, 0.05, 1.2)
  .kaleid(5)
  .modulate(noise(2), 0.2)
  .rotate(0, 0.1)
  .out()

// try: osc(30, 0.05, 1.2).kaleid(5).out()     just the kaleidoscope
//      voronoi(8, 0.5).color(1, 0.2, 0.8).out()  cells
//      noise(3).colorama(0.4).out()             colour noise

setcps(168/60/4)

stack(
  s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9),
  s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35),
  note("<a1 f1 c2 g1>").struct("[~ x]*4").add(note("[0 12]*2"))
    .s("supersaw").decay(0.1).sustain(0).lpf(1800).lpq(4).gain(0.6)
)`,
  },
  {
    name: "64 · Visuals: Hydra on the beat",
    about: "H(\"...\") turns a mini-notation pattern into a Hydra value, so the visuals move in time: a pulse on every kick, a new shape on every chord.",
    code: `await initHydra()

shape(H("<3 4 5 6>"), 0.35, 0.02)     // a new shape on every chord (Am F C G)
  .scale(H("[1.5 1 1 1]*4"))          // jumps on every kick
  // a colour per chord: red, green and blue amounts
  .color(H("<1 0.2 0.3 1>"), H("<0.2 1 0.6 0.5>"), H("<0.8 1 0.2 0.2>"))
  .repeat(3, 3)
  .modulateRotate(osc(2), 0.3)
  .out()

setcps(168/60/4)

stack(
  s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9),
  s("~ [cp,sd] ~ [cp,sd]").bank("RolandTR909").room(0.2).gain(0.6),
  s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35),
  note("<a1 f1 c2 g1>").struct("[~ x]*4").add(note("[0 12]*2"))
    .s("supersaw").decay(0.1).sustain(0).lpf(1800).lpq(4).gain(0.6),
  chord("<Am F C G>").voicing().struct("~ x ~ x x ~ x ~")
    .s("supersaw").decay(0.15).sustain(0).hpf(400).lpf(3500).gain(0.35)
)`,
  },
  {
    name: "65 · Visuals: pianoroll through Hydra",
    about: "feedStrudel sends Strudel's own drawing into Hydra as s0, so the pianoroll itself gets kaleidoscoped and warped in time with the music.",
    code: `await initHydra({ feedStrudel: 1 })

src(s0)                                // s0 = the pianoroll below
  .kaleid(H("<4 4 6 8>"))
  .modulate(osc(3, 0.1), 0.04)
  .scale(H("[1.15 1 1 1]*4"))          // breathe on the kick
  .blend(o0, 0.6)                      // a little trail from the last frame
  .out()

setcps(172/60/4)

stack(
  s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9).color("white"),
  s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35).color("white"),
  note("<f#1 d1 a1 e1>").struct("[~ x]*4").add(note("[0 12]*2"))
    .s("square").penv(12).pattack(0).pdecay(0.04)
    .decay(0.12).sustain(0).lpf(1600).gain(0.55)
    .color("cyan"),
  n(\`<
    [4 ~ 2 ~ 0 ~ 2 4 ~ 4 ~ 2 4 ~ 7 ~]
    [5 ~ 4 ~ 2 ~ 4 5 ~ 5 ~ 4 2 ~ 0 ~]
    [4 ~ 2 ~ 1 ~ 2 4 ~ 4 ~ 6 4 ~ 2 ~]
    [3 ~ 1 ~ -1 ~ 1 3 ~ 3 ~ 4 6 ~ 8 ~]
  >\`).scale("F#4:minor").s("piano").room(0.3).gain(0.8)
    .color("magenta")
).pianoroll({ fold: 1 })`,
  },
  {
    name: "66 · Visuals: strobe & tunnel",
    about: "Peak-time Hydra: a tunnel that zooms on the kick and colour flashes on the claps, over the acid bounce.",
    code: `await initHydra()

// the tunnel: feed the last frame back in, slightly zoomed and turned
src(o0)
  .scale(H("[1.08 1.02 1.02 1.02]*4"))   // zooms harder on each kick
  .rotate(0.01)
  .blend(
    shape(4, 0.6, 0.01)
      .color(H("<1 0.2 0.6 1>"), 0.3, H("<0.6 1 0.3 0.8>")), // colour per chord
    0.3)
  .add(solid(1, 1, 1), H("[0 0.4 0 0]*2")) // flash on the claps
  .out()

setcps(176/60/4)

stack(
  s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9),
  s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65),
  s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35),
  note("<bb1 gb1 db2 ab1>").struct("[~ x]*4").add(note("[0 12]*2"))
    .s("sawtooth").decay(0.12).sustain(0)
    .lpf(sine.range(400, 2400).slow(8)).lpq(14).gain(0.5)
)`,
  },
  {
    name: "67 · Visuals: New Monkey full flow + Hydra",
    about: "The first New Monkey flow (29) with a Hydra scene for each section, switching on the same bars as the music. Best in projector mode.",
    code: `await initHydra()

// One value per section, using the same bar counts as arrange() below:
// intro 8, bounce 8, tune 16, vocal 8, breakdown 8, build 4, drop 16
const sides = H("<1@8 2@8 4@16 6@8 3@8 2@4 8@16>")      // kaleidoscope sides
const warp  = H("<0@8 0.1@8 0.2@16 0.3@8 0.05@8 0.6@4 0.4@16>")
const red   = H("<0.3@8 0.3@8 1@16 0.8@8 0.2@8 1@4 1@16>")
const blue  = H("<1@8 1@8 0.4@16 1@8 1@8 0.2@4 0.6@16>")
const kickPulse = H("[1.25 1 1 1]*4")

osc(20, 0.05, 1.3)
  .color(red, 0.3, blue)
  .kaleid(sides)
  .modulate(noise(3), warp)
  .scale(kickPulse)
  .out()

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

  // ------------------------------------------------- NEW MONKEY FLOWS + HYDRA
  // Flows II-VII with a Hydra scene each (67 does flow I).
  {
    name: "68 · Visuals: New Monkey II full flow + Hydra",
    about: "Flow II with voronoi cells that multiply through the tune, warping harder when the hoover answers the piano.",
    code: `await initHydra()

// One value per section, in the same order and bar counts as arrange() below:
// intro 8, pluck bounce 8, piano riff 16, piano calls... 4, ...hoover answers 4, breakdown 8, kick roll 4, drop 16
const cells  = H("<3@8 5@8 8@16 8@4 12@4 4@8 6@4 10@16>")  // how many cells
const warp   = H("<0@8 0.1@8 0.2@16 0.2@4 0.5@4 0.05@8 0.4@4 0.3@16>")  // how much they wobble
const red    = H("<0.3@8 0.4@8 1@16 1@4 0.4@4 0.2@8 1@4 1@16>")
const blue   = H("<1@8 1@8 0.4@16 0.4@4 1@4 1@8 0.3@4 0.6@16>")
const kickIn = H("<1@8 1@8 1@16 1@4 1@4 0@8 1@4 1@16>")  // 1 where there's a kick

// the kick pulse, only in sections that have a kick. H() gives a function,
// so two can be combined in a function of your own like this
const pulse = H("[1.2 1 1 1]*4")
const kickPulse = () => 1 + kickIn() * (pulse() - 1)

voronoi(cells, 0.3, 0.3)
  .color(red, 0.2, blue)
  .modulateScale(osc(4, 0.1), warp)
  .scale(kickPulse)
  .out()

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
  {
    name: "69 · Visuals: New Monkey III full flow + Hydra",
    about: "Flow III, \"Sunrise\": a sun that grows from a red dot to a big yellow glow through the tune, its rays spreading with each section.",
    code: `await initHydra()

// One value per section, in the same order and bar counts as arrange() below:
// intro 8, groove 8, gated arp 16, the hook 8, breakdown 8, build 4, drop 16
const sunSize = H("<0.15@8 0.2@8 0.3@16 0.35@8 0.5@8 0.2@4 0.4@16>")
const green   = H("<0.3@8 0.4@8 0.6@16 0.7@8 0.8@8 0.5@4 0.7@16>")  // 0.3 = red sky, 0.8 = yellow
const rays    = H("<4@8 4@8 8@16 8@8 12@8 6@4 8@16>")
const glow    = H("<0@8 0.05@8 0.2@16 0.3@8 0.1@8 0.4@4 0.3@16>")
const warp    = H("<0@8 0.05@8 0.1@16 0.15@8 0.05@8 0.3@4 0.2@16>")
const kickIn  = H("<1@8 1@8 1@16 1@8 0@8 0@4 1@16>")

// the kick pulse, only in sections that have a kick. H() gives a function,
// so two can be combined in a function of your own like this
const pulse = H("[1.2 1 1 1]*4")
const kickPulse = () => 1 + kickIn() * (pulse() - 1)

shape(100, sunSize, 0.4)                     // 100 sides = a soft circle
  .color(1, green, 0.2)
  .add(osc(8, 0.03, 1.2).kaleid(rays), glow)  // the rays
  .modulate(noise(2), warp)
  .scale(kickPulse)
  .out()

setcps(165/60/4) // 165 BPM

const kick = s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9)
const hats = s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35)
const claps = s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65)

// octave-bouncing offbeat bass, one root per bar
const bass = note("<d2 bb1 f1 c2>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("supersaw").decay(0.1).sustain(0).lpf(1600).lpq(4).gain(0.55)

// a 16th-note arp moved onto each chord: +0 Dm, -2 Bb, +2 F, -1 C
const arp = n("[0 2 4 7 4 2 4 7]*2").add(n("<0 -2 2 -1>")).scale("D4:minor")
  .s("supersaw").decay(0.08).sustain(0)
  .lpf(sine.range(800, 5000).slow(16)) // opens and closes over 16 bars
  .delay(0.25).delaytime(0.27).gain(0.35)

// the hook: 3-3-2 rhythm, two chord tones per bar
const lead = n("<[4 ~ ~ 4 ~ ~ 2 ~] [2 ~ ~ 2 ~ ~ 0 ~] [4 ~ ~ 4 ~ ~ 6 ~] [3 ~ ~ 3 ~ ~ 1 ~]>")
  .scale("D5:minor")
  .s("supersaw").detune(0.4).release(0.2)
  .lpf(4000).room(0.3).gain(0.35)

const pads = chord("<Dm Bb F C>").voicing().s("gm_pad_warm").room(0.6).gain(0.5)

// snare roll: quarters, eighths, then 16ths into 32nds, pitch rising
const roll = arrange([2, s("sd*4")], [1, s("sd*8")], [1, s("[sd*8 sd*16]")])
  .bank("RolandTR909").speed(saw.range(1, 2).slow(4)).gain(saw.range(0.5, 1).slow(4))

arrange(
  [8,  stack(kick, hats)],                                                    // intro
  [8,  stack(kick, hats, claps, bass)],                                       // groove
  [16, stack(kick, hats, claps, bass, arp)],                                  // gated arp
  [8,  stack(kick, hats, claps, bass, arp, lead, pads)],                      // the hook
  [8,  stack(arp.lpf(5000).room(0.8).size(0.9), lead.room(0.7), pads)],       // breakdown
  [4,  stack(roll, bass.lpf(saw.range(200, 1600).slow(4)), pads.gain(0.3))],  // build
  [16, stack(kick, hats, claps, bass, arp.lpf(5000), lead, pads)],            // drop
)`,
  },
  {
    name: "70 · Visuals: New Monkey IV full flow + Hydra",
    about: "Flow IV, \"Hoover Stomper\": dark red noise that twists harder each section, with white hits on the 3-3-2 orchestra stabs.",
    code: `await initHydra()

// One value per section, in the same order and bar counts as arrange() below:
// intro 8, stomp & reese 8, stabs 8, hoover riff 16, breakdown 8, clap roll 4, drop 16
const grain   = H("<2@8 3@8 4@8 6@16 1@8 8@4 5@16>")  // noise size
const twist   = H("<0@8 0.1@8 0.2@8 0.4@16 0.05@8 0.8@4 0.5@16>")
const red     = H("<1@8 1@8 1@8 1@16 0.2@8 1@4 1@16>")
const blue    = H("<0.15@8 0.15@8 0.15@8 0.3@16 1@8 0.2@4 0.3@16>")  // the breakdown goes blue
const stabsIn = H("<0@8 0@8 1@8 1@16 0@8 0@4 1@16>")  // 1 where the stabs play
const kickIn  = H("<1@8 1@8 1@8 1@16 0@8 0@4 1@16>")

// the kick pulse, only in sections that have a kick. H() gives a function,
// so two can be combined in a function of your own like this
const pulse = H("[1.2 1 1 1]*4")
const kickPulse = () => 1 + kickIn() * (pulse() - 1)

// a flash on each 3-3-2 stab, only in sections with stabs
const stabHits = H("[0.5 0 0 0.5 0 0 0.5 0]")
const stabFlash = () => stabsIn() * stabHits()

noise(grain, 0.1)
  .thresh(0.5, 0.1)
  .color(red, 0.05, blue)
  .modulateRotate(osc(1), twist)
  .add(solid(1, 1, 1), stabFlash)
  .scale(kickPulse)
  .out()

setcps(170/60/4) // 170 BPM

const kick = s("bd*4").bank("RolandTR909").shape(0.75).gain(0.85)
const hats = s("[~ oh]*4, [hh hh ~ hh]*4").bank("RolandTR909").gain(0.35)
const claps = s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65)

// a rubbery reese on every offbeat, a little distorted
const bass = note("<g1 eb1 c2 d2>").struct("[~ x]*4")
  .s("supersaw").detune(0.6).decay(0.15).sustain(0)
  .lpf(1000).shape(0.3).gain(0.55)

// orchestra hits on the 3-3-2
const stabs = chord("<Gm Eb Cm D>").voicing().struct("x ~ ~ x ~ ~ x ~")
  .s("gm_orchestra_hit").room(0.3).gain(0.5)

// wide detuned saws swooping up into each note
const hoover = note("<[g2 ~ ~ ~ bb2 ~ a2 ~] [g2 ~ ~ ~ eb2 ~ ~ ~] [c3 ~ ~ ~ eb3 ~ d3 ~] [d3 ~ ~ ~ f#3 ~ a3 ~]>")
  .s("supersaw").detune(1).unison(7)
  .penv(-12).pattack(0.1).release(0.4)
  .lpf(2200).room(0.3).gain(0.4)

// a rave siren: a sine sweeping up and down, twice a bar
const siren = note(sine.range(70, 82).fast(2).segment(32)).s("sine").release(0.05).gain(0.2)

const strings = chord("<Gm Eb Cm D>").voicing().s("gm_synth_strings_1").room(0.7).gain(0.45)

// clap roll that speeds up and rises in pitch
const roll = arrange([2, s("cp*4")], [1, s("cp*8")], [1, s("[cp*8 cp*16]")])
  .bank("RolandTR909").speed(saw.range(1, 1.8).slow(4)).gain(saw.range(0.5, 1).slow(4))

arrange(
  [8,  stack(kick, hats)],                                                  // intro
  [8,  stack(kick, hats, claps, bass)],                                     // stomp & reese
  [8,  stack(kick, hats, claps, bass, stabs)],                              // stabs
  [16, stack(kick, hats, claps, bass, stabs, hoover)],                      // hoover riff
  [8,  stack(strings, siren, hoover.room(0.8).size(0.9).gain(0.3))],        // breakdown
  [4,  stack(roll, bass.lpf(saw.range(200, 1000).slow(4)), siren)],         // clap roll
  [16, stack(kick, hats, claps, bass, stabs, hoover, strings.gain(0.25))],  // drop
)`,
  },
  {
    name: "71 · Visuals: New Monkey V full flow + Hydra",
    about: "Flow V, \"Bells\": a grid of icy stars that fills up and spins faster through the tune.",
    code: `await initHydra()

// One value per section, in the same order and bar counts as arrange() below:
// intro 8, skip bounce 8, bell riff 16, offbeat pianos 8, breakdown 8, kick roll 4, drop 16
const grid     = H("<2@8 3@8 5@16 6@8 8@8 3@4 6@16>")  // stars across and down
const starSize = H("<0.2@8 0.25@8 0.3@16 0.3@8 0.15@8 0.3@4 0.35@16>")
const spin     = H("<0@8 0.05@8 0.1@16 0.15@8 0.03@8 0.4@4 0.2@16>")
const wobble   = H("<0@8 0@8 0.1@16 0.2@8 0.3@8 0.1@4 0.2@16>")
const kickIn   = H("<1@8 1@8 1@16 1@8 0@8 1@4 1@16>")

// the kick pulse, only in sections that have a kick. H() gives a function,
// so two can be combined in a function of your own like this
const pulse = H("[1.2 1 1 1]*4")
const kickPulse = () => 1 + kickIn() * (pulse() - 1)

shape(4, starSize, 0.01)
  .repeat(grid, grid)
  .rotate(0, spin)
  .color(0.6, 0.9, 1)
  .modulateScale(osc(3, 0.05), wobble)
  .scale(kickPulse)
  .out()

setcps(174/60/4) // 174 BPM

const kick = s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9)
const hats = s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.3)
const claps = s("~ [cp,rim] ~ cp").bank("RolandTR909").room(0.2).gain(0.6)

const bass = note("<b1 g1 d2 a1>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("sawtooth").decay(0.1).sustain(0).lpf(1400).gain(0.5)

// one bar per chord: Bm, G, D, A
const melody = n(\`<
  [7 ~ 4 ~ 7 ~ 4 ~ 9 7 4 ~ 2 ~ 4 ~]
  [7 ~ 5 ~ 7 ~ 5 ~ 9 7 5 ~ 2 ~ 5 ~]
  [6 ~ 4 ~ 6 ~ 4 ~ 9 6 4 ~ 2 ~ 4 ~]
  [6 ~ 3 ~ 6 ~ 3 ~ 8 6 3 ~ 1 ~ 3 ~]
>\`).scale("B4:minor")

const bells = stack(
  melody.s("gm_glockenspiel").gain(0.7),
  melody.s("gm_music_box").room(0.3).gain(0.5)
)

// piano chords on every offbeat, with the bass
const pianos = chord("<Bm G D A>").voicing().struct("[~ x]*4").s("piano").gain(0.5)

const strings = chord("<Bm G D A>").voicing().s("gm_synth_strings_1").room(0.6).gain(0.4)

// the kick comes back first, doubling up, its filter opening
const kickRoll = arrange([2, s("bd*4")], [1, s("bd*8")], [1, s("[bd*8 bd*16]")])
  .bank("RolandTR909").shape(0.5).lpf(saw.range(300, 8000).slow(4)).gain(0.85)

arrange(
  [8,  stack(kick, hats)],                                                       // intro
  [8,  stack(kick, hats, claps, bass)],                                          // skip bounce
  [16, stack(kick, hats, claps, bass, bells)],                                   // bell riff
  [8,  stack(kick, hats, claps, bass, bells, pianos, strings)],                  // offbeat pianos
  [8,  stack(melody.s("gm_music_box").room(0.8).size(0.9).gain(0.6), strings)],  // breakdown
  [4,  stack(kickRoll, strings.gain(0.3))],                                      // kick roll
  [16, stack(kick, hats, claps, bass, bells, pianos, strings)],                  // drop
)`,
  },
  {
    name: "72 · Visuals: New Monkey VI full flow + Hydra",
    about: "Flow VI, \"Happy Monkey\": a rainbow kaleidoscope that bounces on the offbeats with the bass.",
    code: `await initHydra()

// One value per section, in the same order and bar counts as arrange() below:
// intro 8, happy bounce 8, skippy pianos 8, lead & vocal 16, breakdown 8, build 4, drop 16
const sides    = H("<2@8 3@8 4@8 6@16 3@8 8@4 6@16>")
const rainbow  = H("<0@8 0.05@8 0.1@8 0.2@16 0.05@8 0.4@4 0.3@16>")  // how fast the colours cycle
const bounceIn = H("<0@8 1@8 1@8 1@16 0@8 1@4 1@16>")  // 1 where the bass bounces
const kickIn   = H("<1@8 1@8 1@8 1@16 0@8 0@4 1@16>")

// the kick pulse, only in sections that have a kick. H() gives a function,
// so two can be combined in a function of your own like this
const pulse = H("[1.2 1 1 1]*4")
const kickPulse = () => 1 + kickIn() * (pulse() - 1)

// the picture hops up on every offbeat, like the bass
const offbeat = H("[0 0.04]*4")
const hop = () => bounceIn() * offbeat()

osc(10, 0.1, 1.5)
  .kaleid(sides)
  .colorama(rainbow)
  .scrollY(hop)
  .scale(kickPulse)
  .out()

setcps(170/60/4) // 170 BPM

const kick = s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9)
const hats = s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35)
const claps = s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65)

const bass = note("<e2 b1 c#2 a1>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("supersaw").decay(0.1).sustain(0).lpf(1600).lpq(4).gain(0.55)

// skippy happy-hardcore piano chords
const pianos = chord("<E B C#m A>").voicing().struct("x ~ x x ~ x ~ x")
  .s("piano").room(0.3).gain(0.6)

// one bar per chord: E, B, C#m, A
const melody = n(\`<
  [4 ~ 4 ~ 2 4 ~ 7 ~ 7 ~ 4 2 ~ 0 ~]
  [4 ~ 4 ~ 1 4 ~ 6 ~ 6 ~ 4 1 ~ -1 ~]
  [5 ~ 5 ~ 2 5 ~ 7 ~ 7 ~ 5 2 ~ 0 ~]
  [5 ~ 5 ~ 3 5 ~ 7 ~ 7 ~ 9 8 ~ 7 ~]
>\`).scale("E4:major")

// squelchy: a resonant filter wobbling twice a bar
const lead = melody.s("square").decay(0.15).sustain(0.3)
  .lpf(sine.range(800, 3500).fast(2)).lpq(10)
  .delay(0.25).delaytime(0.26).gain(0.3)

// the hook on a voice lead, high like a sped-up vocal
const vocal = n("<[7 ~ 7 ~ 8 ~ 7 ~] [6 ~ 6 ~ 4 ~ 6 ~] [7 ~ 7 ~ 9 ~ 7 ~] [7 ~ 5 ~ 4 ~ 3 ~]>")
  .scale("E5:major").s("gm_lead_6_voice").room(0.4).gain(0.5)

const roll = arrange([2, s("sd*4")], [1, s("sd*8")], [1, s("[sd*8 sd*16]")])
  .bank("RolandTR909").speed(saw.range(1, 2).slow(4)).gain(saw.range(0.5, 1).slow(4))

arrange(
  [8,  stack(kick, hats)],                                                                              // intro
  [8,  stack(kick, hats, claps, bass)],                                                                 // happy bounce
  [8,  stack(kick, hats, claps, bass, pianos)],                                                         // skippy pianos
  [16, stack(kick, hats, claps, bass, pianos, lead, vocal)],                                            // lead & vocal
  [8,  stack(pianos.room(0.8).size(0.9), vocal.room(0.8))],                                             // breakdown
  [4,  stack(roll, pianos.lpf(saw.range(300, 5000).slow(4)), bass.lpf(saw.range(200, 1600).slow(4)))],  // build
  [16, stack(kick, hats, claps, bass, pianos, lead, vocal)],                                            // drop
)`,
  },
  {
    name: "73 · Visuals: New Monkey VII full flow + Hydra",
    about: "Flow VII, \"Last Tune\": an acid swirl that follows the bass filter's sweep, going blocky in the breakdown.",
    code: `await initHydra()

// One value per section, in the same order and bar counts as arrange() below:
// intro 8, acid bounce 8, 3-3-2 lead 16, breakdown 8, double roll 4, drop 16, outro 8
const acidIn = H("<0@8 1@8 1@16 0.3@8 1@4 1@16 0.5@8>")  // how much the swirl follows the bass
const blocks = H("<40@8 60@8 200@16 20@8 10@4 300@16 40@8>")  // pixels across: low = blocky
const sides  = H("<1@8 2@8 4@16 3@8 6@4 8@16 2@8>")
const kickIn = H("<1@8 1@8 1@16 0@8 1@4 1@16 1@8>")

// the kick pulse, only in sections that have a kick. H() gives a function,
// so two can be combined in a function of your own like this
const pulse = H("[1.2 1 1 1]*4")
const kickPulse = () => 1 + kickIn() * (pulse() - 1)

// the same 8-bar sine as the bass filter, so the swirl opens with it
const sweep = H(sine.range(0, 0.6).slow(8))
const acid = () => acidIn() * sweep()

osc(40, 0.1, 1.2)
  .modulate(osc(6, 0.2).rotate(1.2), acid)
  .pixelate(blocks, blocks)
  .kaleid(sides)
  .scale(kickPulse)
  .out()

setcps(176/60/4) // 176 BPM

// double kick on the last beat of every 8th bar
const kick = s("bd*4").bank("RolandTR909").shape(0.6).gain(0.9)
  .lastOf(8, x => x.inside(4, y => y.ply("<1 1 1 2>")))

const hats = s("[~ oh]*4, hh*16").bank("RolandTR909").gain(0.35)
const claps = s("~ cp ~ cp").bank("RolandTR909").room(0.2).gain(0.65)

// acid: a resonant sawtooth whose filter sweeps over 8 bars
const bass = note("<bb1 gb1 db2 ab1>").struct("[~ x]*4").add(note("[0 12]*2"))
  .s("sawtooth").decay(0.12).sustain(0)
  .lpf(sine.range(400, 2400).slow(8)).lpq(14).gain(0.5)

// 3-3-2 twice a bar, one bar per chord: Bbm, Gb, Db, Ab
const melody = n(\`<
  [7 ~ ~ 7 ~ ~ 4 ~ 9 ~ ~ 9 ~ ~ 7 ~]
  [7 ~ ~ 7 ~ ~ 5 ~ 9 ~ ~ 9 ~ ~ 7 ~]
  [6 ~ ~ 6 ~ ~ 4 ~ 9 ~ ~ 9 ~ ~ 6 ~]
  [6 ~ ~ 6 ~ ~ 3 ~ 8 ~ ~ 8 ~ ~ 10 ~]
>\`).scale("Bb4:minor")

const lead = stack(
  melody.s("supersaw").detune(0.5).release(0.15).lpf(4500).room(0.3).gain(0.35),
  melody.add(note(12)).s("square").decay(0.1).sustain(0).lpf(3000).gain(0.1)
)

// up an octave every 4th bar, stuttering every 8th
const peakLead = lead.lastOf(4, x => x.add(note(12))).lastOf(8, x => x.ply(2))

const strings = chord("<Bbm Gb Db Ab>").voicing().s("gm_tremolo_strings").room(0.7).gain(0.45)

// snares and kicks rolling together
const roll = arrange([2, s("sd*4, bd*4")], [1, s("sd*8, bd*8")], [1, s("[sd*8 sd*16], [bd*8 bd*16]")])
  .bank("RolandTR909").speed(saw.range(1, 1.8).slow(4))
  .lpf(saw.range(500, 10000).slow(4)).gain(saw.range(0.5, 0.95).slow(4))

arrange(
  [8,  stack(kick, hats)],                                                 // intro
  [8,  stack(kick, hats, claps, bass)],                                    // acid bounce
  [16, stack(kick, hats, claps, bass, lead)],                              // 3-3-2 lead
  [8,  stack(melody.s("piano").room(0.8).size(0.9).gain(0.75), strings)],  // breakdown
  [4,  stack(roll, bass, strings.gain(0.3))],                              // double roll
  [16, stack(kick, hats, claps, bass, peakLead, strings)],                 // drop
  [8,  stack(kick, hats, claps, bass, lead)],                              // outro
)`,
  },
];
