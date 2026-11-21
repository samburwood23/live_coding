// No VS Code imports here, so the page can be smoke-tested in a plain browser.

export function strudelHtml(opts: {
  replUrl: string;
  nonce: string;
  cspSource: string;
  vscodeShim?: string;
  browser?: boolean;
  /** offline cache, e.g. http://127.0.0.1:47130/<token>/cache/ */
  proxyBase?: string;
}): string {
  const { replUrl, nonce, cspSource, proxyBase } = opts;
  const local = proxyBase ? new URL(proxyBase).origin : '';
  // Strudel compiles your code with new Function(), loads its chunks, samples,
  // soundfonts and Hydra from CDNs, and runs audio worklets from blob: URLs, so
  // the policy has to be fairly open for remote content. Inline script is still nonce-only.
  const csp = [
    `default-src 'none'`,
    `script-src 'nonce-${nonce}' 'unsafe-eval' 'wasm-unsafe-eval' https: blob: data: ${local}`,
    `style-src ${cspSource} 'unsafe-inline' https:`,
    `font-src https: data:`,
    `img-src https: data: blob: ${local}`,
    `media-src https: data: blob: ${local}`,
    `connect-src 'self' https: http://localhost:* http://127.0.0.1:* ws: wss: blob: data:`,
    `worker-src blob: data: https: ${local}`,
  ].join('; ');
  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Strudel</title>
<style>
  :root { color-scheme: dark; }
  html, body { margin: 0; height: 100%; background: #000; color: #eee; overflow: hidden;
    font-family: var(--vscode-font-family, system-ui, sans-serif); }
  /* Canvases Strudel creates (pianoroll etc. = #test-canvas, Hydra = #hydra-canvas) sit at the back */
  #hydra-canvas, #test-canvas { z-index: 0 !important; pointer-events: none; }
  #editor-host { position: fixed; inset: 0; z-index: 2; overflow: auto; padding: 2rem 2.5rem;
    box-sizing: border-box; visibility: hidden; pointer-events: none; }
  body.projector #editor-host { visibility: visible; }
  #editor-host div:has(> .cm-editor), #editor-host .cm-editor, #editor-host .cm-gutters { background: transparent !important; }
  #editor-host .cm-content, #editor-host .cm-line { text-shadow: 0 0 6px #000, 0 0 2px #000; }
  #editor-host .cm-line > * { background: rgba(0,0,0,.55); }
  #editor-host .cm-gutters { display: none !important; }
  #hud { position: fixed; left: 10px; bottom: 8px; z-index: 3; font: 12px/1.4 var(--vscode-editor-font-family, monospace);
    color: #aaa; background: rgba(0,0,0,.6); padding: 3px 8px; border-radius: 4px; pointer-events: none; }
  body.projector #hud { display: none; }
  #hud.err { color: #ff8080; }
  #idle { position: fixed; inset: 0; display: grid; place-items: center; z-index: 1; color: #555;
    font: 14px/1.6 var(--vscode-font-family, system-ui); text-align: center; pointer-events: none; }
  body.playing #idle, body.projector #idle { display: none; }
  #unlock { position: fixed; inset: 0; z-index: 10; display: none; place-items: center; cursor: pointer;
    background: rgba(0,0,0,.75); color: #fff; font: 600 18px/1.5 var(--vscode-font-family, system-ui); text-align: center; }
  #unlock.show { display: grid; }
  #unlock span { border: 2px solid #ffcc00; border-radius: 10px; padding: 18px 26px; }
  #fs { position: fixed; top: 10px; right: 10px; z-index: 4; display: none; background: rgba(0,0,0,.6); color: #ddd;
    border: 1px solid #555; border-radius: 6px; padding: 6px 12px; font: 13px system-ui, sans-serif; cursor: pointer; }
  body.browser #fs { display: block; }
  body.browser:fullscreen #fs, body.browser.isfull #fs { opacity: 0; }
  body.browser.isfull #fs:hover { opacity: 1; }
  #gone { position: fixed; inset: 0; z-index: 20; display: none; place-items: center; background: #000; color: #888;
    font: 16px system-ui, sans-serif; text-align: center; }
  body.superseded #gone { display: grid; }
</style>
</head>
<body class="${opts.browser ? 'browser' : ''}">
  <div id="gone">This engine was replaced by a newer tab.<br>You can close this one.</div>
  <button id="fs" title="Fullscreen (F)">⛶ Fullscreen</button>
  <div id="idle">Strudel engine ready.<br>Press <b>Ctrl+Enter</b> in a <code>.strudel</code> file to play.</div>
  <div id="editor-host"><strudel-editor id="repl"></strudel-editor></div>
  <div id="hud">loading Strudel…</div>
  <div id="unlock"><span>🔊 Click here once to switch on sound</span></div>
  ${opts.vscodeShim ?? ''}
  <script nonce="${nonce}">
  // ---- Offline cache --------------------------------------------------------
  // Everything Strudel downloads (engine, sample maps, samples, soundfonts, Hydra)
  // goes through the extension's cache, which keeps a copy on disk. If the cache
  // can't be reached, requests go straight to the internet as before.
  (() => {
    const PROXY = ${JSON.stringify(proxyBase ?? '')};
    const REPL = ${JSON.stringify(replUrl)};
    window.__algoraveProxy = PROXY;
    const ABS = new RegExp('^(https?)://');
    const viaCache = (u) => PROXY + u.replace(ABS, '$1/');
    window.__viaCache = PROXY ? viaCache : (u) => u;
    if (PROXY) {
      const realFetch = window.fetch.bind(window);
      window.fetch = (input, init) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input && input.url;
        if (typeof url === 'string' && ABS.test(url) && !url.startsWith(PROXY.split('/cache/')[0])) {
          return realFetch(viaCache(url), init).then(
            (r) => (r.status === 504 ? realFetch(input, init) : r),
            () => realFetch(input, init),
          );
        }
        return realFetch(input, init);
      };
    }
    const load = (src, fallback) => {
      const el = document.createElement('script');
      el.src = src;
      el.nonce = ${JSON.stringify(nonce)};
      if (fallback) el.onerror = () => { el.remove(); load(fallback); };
      document.body.appendChild(el);
    };
    if (PROXY && ABS.test(REPL)) load(viaCache(REPL), REPL);
    else load(REPL);
  })();
  </script>
  <script nonce="${nonce}">
  (() => {
    const vscode = acquireVsCodeApi();
    const post = (m) => vscode.postMessage(m);
    const repl = document.getElementById('repl');
    const hud = document.getElementById('hud');
    const unlock = document.getElementById('unlock');
    let highlightOn = true;
    let evalId = 0;
    let lastState = {};
    let lastSent = '';
    let lastPost = 0;

    const cps = () => { try { return repl.editor?.repl?.scheduler?.cps; } catch { return undefined; } };
    const setHud = (text, err) => { hud.textContent = text; hud.classList.toggle('err', !!err); };

    // Audio needs one click inside the webview if the browser hasn't had a user gesture yet.
    function audioState() {
      try { return globalThis.getAudioContext ? globalThis.getAudioContext().state : undefined; } catch { return undefined; }
    }
    function checkAudio() {
      const s = audioState();
      const blocked = s === 'suspended' && lastState.started;
      unlock.classList.toggle('show', !!blocked);
      post({ type: 'audioBlocked', blocked: !!blocked });
    }
    const fsBtn = document.getElementById('fs');
    const toggleFs = () => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      else document.documentElement.requestFullscreen?.().catch(() => {});
    };
    fsBtn.addEventListener('click', toggleFs);
    document.addEventListener('fullscreenchange', () => document.body.classList.toggle('isfull', !!document.fullscreenElement));
    document.addEventListener('keydown', (e) => { if (window.__algoraveBrowser && (e.key === 'f' || e.key === 'F')) toggleFs(); });
    if (window.__algoraveBrowser) {
      // A browser tab never has a user gesture when VS Code opens it, so ask for one up front.
      unlock.querySelector('span').textContent = '🔊 Click anywhere to start the engine';
      unlock.classList.add('show');
    }
    unlock.addEventListener('click', async () => {
      try { await globalThis.getAudioContext?.().resume(); } catch {}
      unlock.classList.remove('show');
      post({ type: 'audioBlocked', blocked: false });
    });

    function whenEditor(cb) {
      if (repl.editor) return cb(repl.editor);
      const t = setInterval(() => { if (repl.editor) { clearInterval(t); cb(repl.editor); } }, 30);
    }

    // ---- Hydra without WebGL -------------------------------------------------
    // Some VS Code builds (Snap / Flatpak, some GPU drivers) give webviews no WebGL.
    // Hydra can't draw there, and its error would stop the whole pattern, music
    // included. So when WebGL is missing, initHydra() becomes a no-op and the Hydra
    // functions accept any chain of calls, so the music keeps playing.
    const hasWebGL = (() => {
      try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
      catch { return false; }
    })();
    const HYDRA_NAMES = ['osc', 'noise', 'voronoi', 'shape', 'gradient', 'solid', 'src', 'render',
      'o0', 'o1', 'o2', 'o3', 's0', 's1', 's2', 's3'];
    let hydraStubbed = null;
    function hydraChain() {
      const f = new Proxy(function () {}, {
        get: (t, k) => (k === 'then' ? undefined : k === Symbol.toPrimitive ? () => 0 : f),
        apply: () => f,
      });
      return f;
    }
    // Hydra loads hydra-synth with import(); point it at the cache too
    function cacheHydra() {
      const real = globalThis.initHydra;
      if (!window.__algoraveProxy || !real || real.__cached || real.__guard) return;
      const wrapped = (options = {}) => real({ src: window.__viaCache('https://unpkg.com/hydra-synth'), ...options });
      wrapped.__cached = true;
      globalThis.initHydra = wrapped;
    }
    function guardHydra() {
      if (hasWebGL || !globalThis.initHydra || globalThis.initHydra.__guard) return;
      const guard = async () => {
        if (!hydraStubbed) {
          hydraStubbed = {};
          const c = hydraChain();
          for (const n of HYDRA_NAMES) { hydraStubbed[n] = globalThis[n]; globalThis[n] = c; }
        }
        post({ type: 'notice', message: "Hydra visuals need WebGL, which this VS Code window doesn't have, so they're skipped. The music still plays. Run 'Algorave: Test Sound & Graphics' for fixes." });
        return undefined;
      };
      guard.__guard = true;
      globalThis.initHydra = guard;
    }
    function unstubHydra() {
      if (!hydraStubbed) return;
      for (const n of HYDRA_NAMES) globalThis[n] = hydraStubbed[n];
      hydraStubbed = null;
    }

    // ---- Self-test: can this window make sound and draw? ---------------------
    async function diagnose() {
      const out = { type: 'diagnosis', webgl: hasWebGL, userAgent: navigator.userAgent };
      try {
        const ac = globalThis.getAudioContext?.();
        if (!ac) throw new Error('Strudel audio not loaded yet');
        if (ac.state !== 'running') {
          unlock.querySelector('span').textContent = '🔊 Click here to run the sound test';
          unlock.classList.add('show');
          const t0 = Date.now();
          while (ac.state !== 'running' && Date.now() - t0 < 20000) await new Promise((r) => setTimeout(r, 100));
          unlock.classList.remove('show');
        }
        out.audioState = ac.state;
        out.sampleRate = ac.sampleRate;
        out.baseLatency = ac.baseLatency;
        out.outputLatency = ac.outputLatency;
        try {
          const devs = await navigator.mediaDevices?.enumerateDevices?.();
          out.audioOutputs = devs ? devs.filter((d) => d.kind === 'audiooutput').length : undefined;
        } catch {}
        // a one-second beep straight to the speakers, bypassing Strudel
        const t1 = ac.currentTime;
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.frequency.value = 660;
        g.gain.setValueAtTime(0, ac.currentTime);
        g.gain.linearRampToValueAtTime(0.3, ac.currentTime + 0.02);
        g.gain.setValueAtTime(0.3, ac.currentTime + 0.9);
        g.gain.linearRampToValueAtTime(0, ac.currentTime + 1);
        osc.connect(g).connect(ac.destination);
        osc.start();
        osc.stop(ac.currentTime + 1.05);
        await new Promise((r) => setTimeout(r, 1100));
        out.clockAdvanced = ac.currentTime - t1;
      } catch (e) {
        out.audioError = String(e && e.message || e);
      }
      post(out);
    }

    // Painters share one canvas. Undo what the last pattern left behind: a spiral's thick
    // lines would make the next pianoroll's playhead a fat bar, and Hydra's feedStrudel
    // hides the canvas.
    function resetDrawState(code) {
      const c = document.getElementById('test-canvas');
      if (!c) return;
      if (!/feedStrudel/.test(code)) c.style.removeProperty('display');
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.lineWidth = 1;
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
      ctx.lineCap = 'butt';
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, c.width, c.height);
    }

    whenEditor((ed) => {
      // Mirror the playing steps back to VS Code so it can outline them in your file.
      const origHighlight = ed.highlight.bind(ed);
      ed.highlight = (haps, time) => {
        origHighlight(haps, time);
        if (!highlightOn) return;
        const now = performance.now();
        if (now - lastPost < 33) return; // ~30 fps is plenty
        const seen = new Set();
        const ranges = [];
        for (const h of haps) {
          if (!h.whole || !h.context?.locations) continue;
          for (const { start, end } of h.context.locations) {
            const k = start + ':' + end;
            if (!seen.has(k)) { seen.add(k); ranges.push([start, end]); }
          }
        }
        const key = ranges.map((r) => r.join(':')).sort().join(',');
        if (key === lastSent) return;
        lastSent = key;
        lastPost = now;
        post({ type: 'haps', id: evalId, ranges });
      };

      repl.addEventListener('update', (e) => {
        const s = e.detail || {};
        const wasStarted = lastState.started;
        lastState = s;
        document.body.classList.toggle('playing', !!s.started);
        const err = s.error ? String(s.error.message || s.error) : undefined;
        post({ type: 'state', started: !!s.started, pending: !!s.pending, error: err, cps: cps() });
        if (err) setHud('⚠ ' + err, true);
        else setHud(s.started ? '▶ playing · ' + (cps()?.toFixed?.(3) ?? '?') + ' cps' : '■ stopped');
        if (wasStarted && !s.started) { lastSent = ''; post({ type: 'haps', id: evalId, ranges: [] }); }
      });

      document.addEventListener('strudel.log', (e) => {
        const d = e.detail || {};
        post({ type: 'log', message: String(d.message ?? ''), level: d.type });
      });

      setHud('■ stopped');
      post({ type: 'ready' });
    });

    // ---- Evaluating -----------------------------------------------------------
    // run(code) evaluates like Ctrl+Enter in the web REPL. stashCps keeps setcps() from
    // changing the tempo straight away (for queued swaps, which change it on the bar).
    async function run(ed, id, code, stashCps) {
      evalId = id;
      lastSent = '';
      // Hydra keeps drawing until it's cleared, so clear it when the new code doesn't use it
      if (!/initHydra/.test(code)) { try { globalThis.clearHydra?.(); } catch {} unstubHydra(); }
      try { await ed.prebaked; } catch {}
      guardHydra();
      cacheHydra();
      resetDrawState(code);
      let stashed;
      const cpsBefore = sched()?.cps;
      ed.setCode(code);
      lastState = { ...lastState, error: undefined };
      try {
        await ed.evaluate();
      } catch (err) {
        lastState.error = err;
      }
      // A queued swap keeps the old tempo until the line; the caller applies the new one there.
      if (stashCps && sched() && sched().cps !== cpsBefore) {
        stashed = sched().cps;
        sched().setCps(cpsBefore);
      }
      const err = lastState.error ? String(lastState.error.message || lastState.error) : undefined;
      post({ type: 'evaluated', id, ok: !err, error: err, cps: cps() });
      if (!err) setHud('▶ playing · ' + (cps()?.toFixed?.(3) ?? '?') + ' cps');
      setTimeout(checkAudio, 300);
      return { ok: !err, stashed };
    }

    // ---- Timing helpers --------------------------------------------------------
    // One cycle is one bar in all the kit's patterns, so "bars" below means cycles.
    const sched = () => repl.editor?.repl?.scheduler;
    const nowCycle = () => { try { return sched().now(); } catch { return 0; } };
    const onset = (h) => Number((h.whole || h.part).begin);
    const SAFETY = 0.35; // seconds: never schedule a change closer than this
    const LEAD = 0.15;   // seconds before the line that the swap is evaluated
    // the next multiple of "every" bars that is at least "min" bars + SAFETY away
    function nextLine(every, min = 0) {
      const c = cps() || 0.5;
      return Math.ceil((nowCycle() + min + SAFETY * c) / every) * every;
    }
    // resolve when the playhead reaches "cycle", or false if cancelled or stopped
    let waitToken = 0;
    function waitFor(cycle, token) {
      return new Promise((resolve) => {
        const tick = () => {
          if (token !== waitToken || !sched()?.started) return resolve(false);
          if (nowCycle() >= cycle) return resolve(true);
          setTimeout(tick, 15);
        };
        tick();
      });
    }
    // a pattern that plays parts = [[pattern, fromCycle, toCycle], ...] by note onset
    function splice(parts) {
      const layers = parts.map(([pat, from, to]) =>
        pat.filterHaps((h) => { const t = onset(h); return t >= from && t < to; }));
      return globalThis.stack(...layers);
    }
    // swap the scheduler's pattern back to a plain one once a spliced section is over
    async function settle(after, finalPat, spliced, token) {
      if (!(await waitFor(after, token))) return;
      if (sched().pattern === spliced) sched().setPattern(finalPat);
    }

    // ---- Queued swap: the new code starts exactly on the next phrase line --------
    async function queuedRun(ed, id, code, every) {
      const s = sched();
      if (!s?.started) return run(ed, id, code, false); // nothing playing: start now
      const token = ++waitToken;
      const at = nextLine(every);
      post({ type: 'queued', id, at, every });
      const c = cps() || 0.5;
      if (!(await waitFor(at - LEAD * c, token))) { post({ type: 'queued', id, at: null }); return; }
      const oldPat = s.pattern;
      const res = await run(ed, id, code, true);
      if (!res.ok) { post({ type: 'queued', id, at: null }); return; }
      const newPat = s.pattern;
      const spliced = splice([[oldPat, -Infinity, at], [newPat, at, Infinity]]);
      s.setPattern(spliced);
      post({ type: 'queued', id, at: null, landed: at });
      if (res.stashed !== undefined) {
        if (await waitFor(at, token)) s.setCps(res.stashed);
      }
      settle(at + 1, newPat, spliced, token);
    }

    // ---- Drop: filter up, kick + bass out, snare roll, everything back on the line --
    function midiOf(v) {
      const n = v.note ?? v.n;
      if (typeof n === 'number') return v.note !== undefined ? n : undefined;
      if (typeof n === 'string') { try { return globalThis.noteToMidi(n); } catch { return undefined; } }
      return undefined;
    }
    function isKickOrBass(h) {
      const v = h.value || {};
      if (typeof v.s === 'string' && /^(bd|hardkick|kick|bombo)/.test(v.s)) return true;
      const m = midiOf(v);
      return m !== undefined && m < 48;
    }
    async function drop(buildBars, landEvery) {
      const s = sched();
      if (!s?.started) return;
      const token = ++waitToken;
      const land = nextLine(landEvery, buildBars);
      const start = land - buildBars;
      const pat = s.pattern;
      const g = globalThis;
      const m = (x) => g.s(g.mini(x)); // mini-notation from plain JS
      const rollParts = buildBars >= 4
        ? [[buildBars - 2, m('sd*4')], [1, m('sd*8')], [1, m('[sd*8 sd*16]')]]
        : [[1, m('sd*8')], [1, m('[sd*8 sd*16]')]];
      const roll = g.arrange(...rollParts).bank('RolandTR909')
        .speed(g.saw.slow(buildBars).range(1, 1.8)).gain(0.9);
      const build = g.stack(
        pat.filterHaps((h) => !isKickOrBass(h)).hpf(g.saw.slow(buildBars).range(150, 3000)),
        roll,
      );
      const spliced = splice([[pat, -Infinity, start], [build, start, land], [pat, land, Infinity]]);
      s.setPattern(spliced);
      post({ type: 'drop', start, land });
      settle(land + 1, pat, spliced, token);
    }

    // ---- Prefetch: load every sound the given patterns use, without playing them ----
    // Each pattern is evaluated without starting, queried for its first N bars, and
    // every distinct sound is loaded through superdough at zero gain. Loading goes
    // through the cache, so afterwards the patterns play with no internet.
    async function prefetch(ed, patterns, cycles) {
      const s = sched();
      if (s?.started) { post({ type: 'prefetchDone', error: 'Stop the music first.' }); return; }
      try { await ed.prebaked; } catch {}
      const g = globalThis;
      const saved = { initHydra: g.initHydra, samples: g.samples };
      const loads = [];
      g.samples = (...a) => { const p = saved.samples(...a); loads.push(p); return p; };
      // Hydra isn't needed to read the notes: stand it in with a do-nothing chain
      g.initHydra = async () => {};
      const chain = hydraChain();
      const hydraSaved = {};
      for (const n of HYDRA_NAMES) { hydraSaved[n] = g[n]; g[n] = chain; }
      const seen = new Map();
      let failedPatterns = 0;
      const problems = [];
      for (let i = 0; i < patterns.length; i++) {
        const { name, code } = patterns[i];
        post({ type: 'prefetchProgress', phase: 'reading', done: i, total: patterns.length, name });
        try {
          const before = s.pattern;
          await ed.repl.evaluate(code, false);
          await Promise.allSettled(loads.splice(0));
          const pat = s.pattern;
          if (!pat || pat === before) throw new Error('no pattern');
          for (const h of pat.queryArc(0, cycles)) {
            if (!h.hasOnset || !h.hasOnset()) continue;
            const v = h.value;
            if (!v || typeof v !== 'object' || typeof v.s !== 'string') continue;
            const key = [v.bank, v.s, v.n, v.note, v.freq].join('|');
            if (!seen.has(key)) seen.set(key, { ...v });
          }
        } catch (e) {
          failedPatterns++;
          problems.push(name + ': ' + String(e && e.message || e).slice(0, 120));
        }
      }
      g.initHydra = saved.initHydra;
      g.samples = saved.samples;
      for (const n of HYDRA_NAMES) g[n] = hydraSaved[n];
      // Hydra too, for the patterns that use it
      if (window.__algoraveProxy) { try { await fetch('https://unpkg.com/hydra-synth'); } catch {} }
      const sounds = [...seen.values()];
      let done = 0, failed = 0;
      const ac = g.getAudioContext();
      const worker = async () => {
        while (sounds.length) {
          const v = sounds.pop();
          try {
            await g.superdough({ ...v, gain: 0, velocity: 0, postgain: 0, room: 0, delay: 0 }, ac.currentTime + 0.05, 0.01);
          } catch { failed++; }
          done++;
          if (done % 10 === 0) post({ type: 'prefetchProgress', phase: 'loading', done, total: seen.size });
        }
      };
      await Promise.all([1, 2, 3, 4, 5, 6].map(worker));
      post({ type: 'prefetchDone', sounds: seen.size, failed, failedPatterns, problems });
    }

    // ---- Clock for the bar counter --------------------------------------------
    setInterval(() => {
      const s = sched();
      if (s?.started) post({ type: 'clock', cycle: nowCycle(), cps: cps() });
    }, 200);

    window.addEventListener('message', async (event) => {
      const m = event.data;
      if (!m || !m.type) return;
      const ed = repl.editor;
      if (!ed) return;
      if (m.type === 'superseded') {
        try { await ed.stop(); } catch {}
        document.body.classList.add('superseded');
        return;
      }
      if (m.type === 'eval') {
        waitToken++; // a direct eval cancels anything queued
        await run(ed, m.id, m.code, false);
      } else if (m.type === 'evalAt') {
        queuedRun(ed, m.id, m.code, m.every || 4);
      } else if (m.type === 'drop') {
        drop(m.buildBars || 4, m.landEvery || 8);
      } else if (m.type === 'cancelQueued') {
        waitToken++;
        post({ type: 'queued', id: evalId, at: null });
      } else if (m.type === 'stop') {
        waitToken++;
        await ed.stop();
        try { globalThis.clearHydra?.(); } catch {}
        lastSent = '';
        post({ type: 'haps', id: evalId, ranges: [] });
      } else if (m.type === 'projector') {
        document.body.classList.toggle('projector', !!m.on);
        if (m.fontSize) ed.setFontSize(m.fontSize);
      } else if (m.type === 'prefetch') {
        prefetch(ed, m.patterns || [], m.cycles || 128);
      } else if (m.type === 'diagnose') {
        try { await ed.prebaked; } catch {}
        diagnose();
      } else if (m.type === 'highlight') {
        highlightOn = !!m.on;
        if (!highlightOn) post({ type: 'haps', id: evalId, ranges: [] });
      }
    });
  })();
  </script>
</body>
</html>`;
}
