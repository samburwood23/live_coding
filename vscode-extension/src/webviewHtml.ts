// No VS Code imports here, so the page can be smoke-tested in a plain browser.

export function strudelHtml(opts: { replUrl: string; nonce: string; cspSource: string; vscodeShim?: string; browser?: boolean }): string {
  const { replUrl, nonce, cspSource } = opts;
  // Strudel compiles your code with new Function(), loads its chunks, samples,
  // soundfonts and Hydra from CDNs, and runs audio worklets from blob: URLs, so
  // the policy has to be fairly open for remote content. Inline script is still nonce-only.
  const csp = [
    `default-src 'none'`,
    `script-src 'nonce-${nonce}' 'unsafe-eval' 'wasm-unsafe-eval' https: blob: data:`,
    `style-src ${cspSource} 'unsafe-inline' https:`,
    `font-src https: data:`,
    `img-src https: data: blob:`,
    `media-src https: data: blob:`,
    `connect-src 'self' https: http://localhost:* http://127.0.0.1:* ws: wss: blob: data:`,
    `worker-src blob: data: https:`,
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
  <script nonce="${nonce}" src="${replUrl}"></script>
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
        evalId = m.id;
        lastSent = '';
        // Hydra keeps drawing until it's cleared, so clear it when the new code doesn't use it
        if (!/initHydra/.test(m.code)) { try { globalThis.clearHydra?.(); } catch {} }
        ed.setCode(m.code);
        lastState = { ...lastState, error: undefined };
        try {
          await ed.evaluate();
        } catch (err) {
          lastState.error = err;
        }
        const err = lastState.error ? String(lastState.error.message || lastState.error) : undefined;
        post({ type: 'evaluated', id: m.id, ok: !err, error: err, cps: cps() });
        if (!err) setHud('▶ playing · ' + (cps()?.toFixed?.(3) ?? '?') + ' cps');
        setTimeout(checkAudio, 300);
      } else if (m.type === 'stop') {
        await ed.stop();
        try { globalThis.clearHydra?.(); } catch {}
        lastSent = '';
        post({ type: 'haps', id: evalId, ranges: [] });
      } else if (m.type === 'projector') {
        document.body.classList.toggle('projector', !!m.on);
        if (m.fontSize) ed.setFontSize(m.fontSize);
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
