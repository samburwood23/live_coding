import * as vscode from 'vscode';
import * as path from 'path';
import { findBlock, firstCodeBlock, mapRanges, TextChange } from './core';
import { KitNode, KitTree } from './kit';
import { FromWebview, StrudelPanel } from './strudelPanel';
import { BrowserEngine } from './browserEngine';
import { TidalEngine } from './tidal';
import { applyMutes, arrangeSections, listLayers, mutate, sectionAt, Section, tidalChannels } from './layers';
import { itemLabel, SetList } from './setlist';

const STARTER = `// Ctrl+Enter = play / update, Ctrl+. = stop
setcps(0.55)

s("bd*4, ~ cp ~ cp, hh*8").bank("RolandTR909")
`;

/** Everything needed to turn Strudel's highlight offsets back into positions in the file. */
interface EvalSnapshot {
  id: number;
  uri: string;
  normLineStarts: number[]; // line starts in the \n-only text Strudel saw
  docLineStarts: number[]; // line starts in the document at eval time
  changes: TextChange[]; // edits since the eval
}

export function activate(ctx: vscode.ExtensionContext) {
  const cfg = () => vscode.workspace.getConfiguration('algorave');
  const panelEngine = new StrudelPanel(ctx);
  const browserEngine = new BrowserEngine(ctx);
  // Read on every use, so switching the setting takes effect on the next eval.
  const engine = () => (cfg().get<string>('strudel.engine', 'panel') === 'browser' ? browserEngine : panelEngine);
  const tree = new KitTree();
  const tidal = new TidalEngine(ctx, () => tree.kit);
  const strudelLog = vscode.window.createOutputChannel('Strudel');
  ctx.subscriptions.push(panelEngine, browserEngine, tree, tidal, strudelLog);
  ctx.subscriptions.push(vscode.window.registerTreeDataProvider('algorave.patterns', tree));

  // -------------------------------------------------------------------------
  // Decorations: active steps + eval flash
  // -------------------------------------------------------------------------
  const activeStep = vscode.window.createTextEditorDecorationType({
    border: '1.5px solid',
    borderColor: new vscode.ThemeColor('algorave.activeStep'),
    borderRadius: '3px',
  });
  const flashDeco = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('algorave.flashBackground'),
    isWholeLine: true,
  });
  const errorDeco = vscode.window.createTextEditorDecorationType({
    after: { color: new vscode.ThemeColor('errorForeground'), margin: '0 0 0 2em' },
    isWholeLine: true,
  });
  ctx.subscriptions.push(activeStep, flashDeco, errorDeco);

  function flash(editor: vscode.TextEditor, range: vscode.Range) {
    if (!cfg().get('flash', true)) return;
    editor.setDecorations(flashDeco, [range]);
    setTimeout(() => editor.setDecorations(flashDeco, []), 220);
  }

  function showInlineError(uri: string, message: string | undefined) {
    for (const ed of vscode.window.visibleTextEditors) {
      if (ed.document.uri.toString() !== uri) continue;
      if (!message) {
        ed.setDecorations(errorDeco, []);
        continue;
      }
      const line = ed.selection.active.line;
      ed.setDecorations(errorDeco, [
        { range: new vscode.Range(line, 0, line, 0), renderOptions: { after: { contentText: '⚠ ' + message.split('\n')[0] } } },
      ]);
    }
  }

  // -------------------------------------------------------------------------
  // Status bar
  // -------------------------------------------------------------------------
  const strudelItem = vscode.window.createStatusBarItem('algorave.strudel', vscode.StatusBarAlignment.Left, 100);
  strudelItem.name = 'Strudel';
  const tidalItem = vscode.window.createStatusBarItem('algorave.tidal', vscode.StatusBarAlignment.Left, 99);
  tidalItem.name = 'Tidal';
  const perfItem = vscode.window.createStatusBarItem('algorave.perf', vscode.StatusBarAlignment.Left, 98);
  perfItem.name = 'Performance mode';
  perfItem.text = '$(flame) PERF';
  perfItem.tooltip = 'Performance mode is on: click to leave';
  perfItem.command = 'algorave.togglePerformanceMode';
  perfItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
  ctx.subscriptions.push(strudelItem, tidalItem, perfItem);

  let strudelState = { started: false, cps: undefined as number | undefined, error: undefined as string | undefined, audioBlocked: false };
  function renderStrudelItem() {
    const s = strudelState;
    if (!engine().isOpen && !s.started) {
      strudelItem.text = '$(pulse) Strudel';
      strudelItem.tooltip = 'Strudel engine not started. Ctrl+Enter in a .strudel file starts it.';
      strudelItem.command = 'algorave.showVisuals';
      strudelItem.backgroundColor = undefined;
    } else if (s.error) {
      strudelItem.text = '$(error) Strudel';
      strudelItem.tooltip = s.error;
      strudelItem.command = 'algorave.showVisuals';
      strudelItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    } else if (s.audioBlocked) {
      strudelItem.text = '$(mute) Strudel: click the panel for sound';
      strudelItem.tooltip = 'The browser engine needs one click inside the Strudel panel before it can play audio.';
      strudelItem.command = 'algorave.showVisuals';
      strudelItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else {
      const bpm = s.cps ? ` · ${(s.cps * 60 * 4).toFixed(0)} bpm` : '';
      strudelItem.text = s.started ? `$(play) Strudel${bpm}` : '$(debug-stop) Strudel';
      strudelItem.tooltip = s.started ? `Playing at ${s.cps?.toFixed(3)} cps (bpm assumes 4 beats per cycle). Click to hush.` : 'Stopped';
      strudelItem.command = s.started ? 'algorave.hush' : 'algorave.showVisuals';
      strudelItem.backgroundColor = undefined;
    }
    strudelItem.show();
  }
  function renderTidalItem() {
    const s = tidal.state;
    tidalItem.text = s === 'running' ? '$(terminal) Tidal $(circle-filled)' : s === 'booting' ? '$(sync~spin) Tidal' : '$(terminal) Tidal';
    tidalItem.tooltip = s === 'running' ? 'Tidal is running: click to quit' : s === 'booting' ? 'Booting GHCi…' : 'Click to boot Tidal';
    tidalItem.command = s === 'running' ? 'algorave.tidal.quit' : 'algorave.tidal.boot';
    const lang = vscode.window.activeTextEditor?.document.languageId;
    if (s !== 'stopped' || lang === 'tidal') tidalItem.show();
    else tidalItem.hide();
  }
  renderStrudelItem();
  renderTidalItem();
  ctx.subscriptions.push(tidal.onStatus(renderTidalItem), vscode.window.onDidChangeActiveTextEditor(renderTidalItem));

  // -------------------------------------------------------------------------
  // Bar counter: bar.beat, the arrange() section, and anything queued
  // -------------------------------------------------------------------------
  const barItem = vscode.window.createStatusBarItem('algorave.bar', vscode.StatusBarAlignment.Left, 97);
  barItem.name = 'Bar counter';
  ctx.subscriptions.push(barItem);
  let queuedAt: number | undefined;
  let dropAt: { start: number; land: number } | undefined;
  let lastBarText = '';
  function renderBarItem(cycle: number) {
    const bar = Math.floor(cycle) + 1;
    const beat = Math.floor((cycle % 1) * 4) + 1;
    let text = `$(watch) ${bar}.${beat}`;
    let tip = `Bar ${bar}, beat ${beat}`;
    const where = sectionAt(playingSections, cycle);
    if (where) {
      const left = Math.ceil(where.barsLeft);
      text += ` · ${where.section.name} ${where.index + 1}/${playingSections.length} · ▸ ${where.next.name} in ${left}`;
      tip += `\nSection ${where.index + 1} of ${playingSections.length}: ${where.section.name}\nNext: ${where.next.name} in ${left} bar${left === 1 ? '' : 's'}`;
    }
    if (queuedAt !== undefined && queuedAt > cycle) {
      const left = Math.ceil(queuedAt - cycle);
      text += ` · $(clock) swap in ${left}`;
      tip += `\nQueued code starts in ${left} bar${left === 1 ? '' : 's'} (bar ${queuedAt + 1})`;
    }
    if (dropAt && dropAt.land > cycle) {
      const left = Math.ceil(dropAt.land - cycle);
      text += cycle >= dropAt.start ? ` · $(arrow-down) DROP in ${left}` : ` · $(arrow-down) build in ${Math.ceil(dropAt.start - cycle)}`;
    } else if (dropAt) {
      dropAt = undefined;
    }
    if (text !== lastBarText) {
      lastBarText = text;
      barItem.text = text;
      barItem.tooltip = tip;
    }
    barItem.show();
  }

  // -------------------------------------------------------------------------
  // Strudel evaluation + live highlighting
  // -------------------------------------------------------------------------
  let evalCounter = 0;
  let snapshot: EvalSnapshot | undefined;

  function lineStarts(text: string, eol: string): number[] {
    const starts = [0];
    let i = text.indexOf(eol);
    while (i !== -1) {
      starts.push(i + eol.length);
      i = text.indexOf(eol, i + eol.length);
    }
    return starts;
  }

  let playingSections: Section[] = [];
  let pendingSections: Section[] | undefined;
  function evalStrudel(editor: vscode.TextEditor, queued = false) {
    const doc = editor.document;
    const raw = doc.getText();
    const eol = doc.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
    const code = raw.replace(/\r\n/g, '\n');
    const id = ++evalCounter;
    snapshot = {
      id,
      uri: doc.uri.toString(),
      normLineStarts: lineStarts(code, '\n'),
      docLineStarts: lineStarts(raw, eol),
      changes: [],
    };
    if (queued && strudelState.started) {
      pendingSections = arrangeSections(code);
      engine().ensure();
      engine().post({ type: 'evalAt', id, code, every: Number(cfg().get('launch.quantize', '4')) });
    } else {
      playingSections = arrangeSections(code);
      pendingSections = undefined;
      engine().eval(id, code);
    }
    flash(editor, new vscode.Range(0, 0, Math.max(0, doc.lineCount - 1), 0));
    renderStrudelItem();
  }

  function clearHighlights() {
    for (const ed of vscode.window.visibleTextEditors) ed.setDecorations(activeStep, []);
  }

  function applyHaps(id: number, ranges: [number, number][]) {
    const snap = snapshot;
    if (!snap || snap.id !== id) return;
    const editors = vscode.window.visibleTextEditors.filter((e) => e.document.uri.toString() === snap.uri);
    if (!editors.length) return;
    if (!ranges.length || snap.changes.length > 5000) return editors.forEach((e) => e.setDecorations(activeStep, []));
    // normalised offset -> (line, col) -> eval-time document offset
    const toDocOffset = (o: number) => {
      const starts = snap.normLineStarts;
      let lo = 0;
      let hi = starts.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (starts[mid] <= o) lo = mid;
        else hi = mid - 1;
      }
      return snap.docLineStarts[lo] + (o - starts[lo]);
    };
    const docRanges = ranges.map(([s, e]) => [toDocOffset(s), toDocOffset(e)] as [number, number]);
    const mapped = mapRanges(docRanges, snap.changes);
    const doc = editors[0].document;
    const decos = mapped.map(([s, e]) => new vscode.Range(doc.positionAt(s), doc.positionAt(e)));
    editors.forEach((ed) => ed.setDecorations(activeStep, decos));
  }

  ctx.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (!snapshot || e.document.uri.toString() !== snapshot.uri) return;
      for (const c of e.contentChanges) {
        snapshot.changes.push({ rangeOffset: c.rangeOffset, rangeLength: c.rangeLength, textLength: c.text.length });
      }
    }),
  );

  let lastErrorShown: string | undefined;
  let lastNotice: string | undefined;
  let pendingDiagnosis: ((d: Extract<FromWebview, { type: 'diagnosis' }>) => void) | undefined;
  ctx.subscriptions.push(
    ...[panelEngine, browserEngine].map((src) => src.onMessage((m) => {
      if (src !== engine()) return;
      switch (m.type) {
        case 'ready':
          engine().post({ type: 'highlight', on: cfg().get('strudel.highlight', true) });
          break;
        case 'haps':
          applyHaps(m.id, m.ranges);
          break;
        case 'state':
          strudelState = { ...strudelState, started: m.started, cps: m.cps ?? strudelState.cps, error: m.error };
          if (!m.started) {
            clearHighlights();
            barItem.hide();
            queuedAt = undefined;
            dropAt = undefined;
          }
          renderStrudelItem();
          break;
        case 'evaluated':
          if (m.error && /getDrawContext|WebGL|webgl/.test(m.error) && engine() === panelEngine) {
            m.error += ' (this VS Code panel has no WebGL, so Hydra can\'t run here: set algorave.strudel.engine to "browser")';
          }
          strudelState = { ...strudelState, error: m.error, cps: m.cps ?? strudelState.cps, started: m.ok || strudelState.started };
          if (snapshot) showInlineError(snapshot.uri, m.error);
          if (m.error) {
            strudelLog.appendLine(`⚠ ${m.error}`);
            if (m.error !== lastErrorShown && !performanceOn) vscode.window.setStatusBarMessage(`Strudel: ${m.error}`, 5000);
          }
          lastErrorShown = m.error;
          renderStrudelItem();
          break;
        case 'log':
          strudelLog.appendLine(m.message);
          break;
        case 'audioBlocked':
          strudelState.audioBlocked = m.blocked;
          renderStrudelItem();
          if (m.blocked) engine().ensure(true);
          break;
        case 'notice':
          strudelLog.appendLine(m.message);
          if (m.message !== lastNotice) {
            lastNotice = m.message;
            vscode.window.setStatusBarMessage('$(info) ' + m.message, 8000);
          }
          break;
        case 'diagnosis':
          pendingDiagnosis?.(m);
          pendingDiagnosis = undefined;
          break;
        case 'clock':
          renderBarItem(m.cycle);
          break;
        case 'queued':
          queuedAt = m.at ?? undefined;
          if (m.landed !== undefined && pendingSections) {
            playingSections = pendingSections;
            pendingSections = undefined;
          }
          if (m.at === null && m.landed === undefined) pendingSections = undefined;
          break;
        case 'drop':
          dropAt = { start: m.start, land: m.land };
          break;
      }
    })),
  );

  // -------------------------------------------------------------------------
  // Tidal evaluation
  // -------------------------------------------------------------------------
  async function evalTidal(editor: vscode.TextEditor, lineOnly: boolean) {
    const doc = editor.document;
    let range: vscode.Range;
    if (!editor.selection.isEmpty) {
      range = new vscode.Range(editor.selection.start.line, 0, editor.selection.end.line, doc.lineAt(editor.selection.end.line).text.length);
      range = editor.selection.isSingleLine ? editor.selection : range;
    } else if (lineOnly) {
      range = doc.lineAt(editor.selection.active.line).range;
    } else {
      const lines = doc.getText().split(/\r?\n/);
      const b = findBlock(lines, editor.selection.active.line);
      if (!b) return;
      range = new vscode.Range(b.start, 0, b.end, lines[b.end].length);
    }
    const code = doc.getText(range);
    if (!code.trim()) return;
    flash(editor, range);
    await tidal.send(code);
  }

  // -------------------------------------------------------------------------
  // Performance mode
  // -------------------------------------------------------------------------
  let performanceOn = false;
  let toggledZen = false;
  const PERF_RESTORE = 'algorave.perfRestore';
  type Restore = { strudel?: number; tidal?: number };

  async function setLangFontSize(lang: string, size: number | undefined) {
    await vscode.workspace
      .getConfiguration('editor', { languageId: lang })
      .update('fontSize', size, vscode.ConfigurationTarget.Global, true);
  }

  async function restoreFonts() {
    const r = ctx.globalState.get<Restore>(PERF_RESTORE);
    if (!r) return;
    await setLangFontSize('strudel', r.strudel);
    await setLangFontSize('tidal', r.tidal);
    await ctx.globalState.update(PERF_RESTORE, undefined);
  }

  async function setPerformance(on: boolean) {
    if (on === performanceOn) return;
    performanceOn = on;
    vscode.commands.executeCommand('setContext', 'algorave.performance', on);
    const size = cfg().get<number>('performance.fontSize', 22);
    if (on) {
      const ins = (lang: string) =>
        vscode.workspace.getConfiguration('editor', { languageId: lang }).inspect<number>('fontSize')?.globalLanguageValue;
      await ctx.globalState.update(PERF_RESTORE, { strudel: ins('strudel'), tidal: ins('tidal') } as Restore);
      await setLangFontSize('strudel', size);
      await setLangFontSize('tidal', size);
      if (cfg().get('performance.zenMode', true)) {
        await vscode.commands.executeCommand('workbench.action.toggleZenMode');
        toggledZen = true;
      }
      const lang = vscode.window.activeTextEditor?.document.languageId;
      if (cfg().get('performance.showVisuals', true) && lang !== 'tidal') {
        engine().ensure(true);
        if (cfg().get('performance.projector', false)) engine().setProjector(true, size * 1.6);
      }
      perfItem.show();
    } else {
      await restoreFonts();
      if (toggledZen) {
        await vscode.commands.executeCommand('workbench.action.toggleZenMode');
        toggledZen = false;
      }
      perfItem.hide();
    }
  }
  // VS Code was closed in performance mode last time: put the fonts back.
  restoreFonts();

  // -------------------------------------------------------------------------
  // Kit patterns
  // -------------------------------------------------------------------------
  async function openStrudelCode(code: string, header?: string): Promise<vscode.TextEditor> {
    const content = (header ? header + '\n' : '') + code + (code.endsWith('\n') ? '' : '\n');
    const active = vscode.window.activeTextEditor;
    if (cfg().get<string>('strudel.openPatternIn', 'newTab') === 'activeEditor' && active?.document.languageId === 'strudel') {
      const doc = active.document;
      await active.edit((e) => e.replace(new vscode.Range(0, 0, doc.lineCount, 0), content));
      return active;
    }
    const doc = await vscode.workspace.openTextDocument({ language: 'strudel', content });
    return vscode.window.showTextDocument(doc, { viewColumn: engine().isOpen ? vscode.ViewColumn.One : undefined });
  }

  async function openNode(node: KitNode): Promise<vscode.TextEditor | undefined> {
    if (node.kind === 'strudel') {
      return openStrudelCode(node.pattern.code, `// ${node.pattern.name}: ${node.pattern.about}`);
    }
    if (node.kind === 'tidalSection') {
      const doc = await vscode.workspace.openTextDocument(node.file);
      const ed = await vscode.window.showTextDocument(doc, { preview: false });
      const lines = doc.getText().split(/\r?\n/);
      const block = firstCodeBlock(lines, node.line + 2);
      const target = block ? block.start : node.line;
      ed.selection = new vscode.Selection(target, 0, target, 0);
      ed.revealRange(new vscode.Range(node.line, 0, target, 0), vscode.TextEditorRevealType.AtTop);
      return ed;
    }
    return undefined;
  }

  // -------------------------------------------------------------------------
  // Commands
  // -------------------------------------------------------------------------
  const isTidal = (ed: vscode.TextEditor) => ed.document.languageId === 'tidal' || ed.document.fileName.endsWith('.tidal');

  const reg = (id: string, fn: (...args: any[]) => unknown) => ctx.subscriptions.push(vscode.commands.registerCommand(id, fn));

  reg('algorave.eval', () => {
    const ed = vscode.window.activeTextEditor;
    if (!ed) return;
    if (isTidal(ed)) return evalTidal(ed, false);
    evalStrudel(ed);
  });
  reg('algorave.evalLine', () => {
    const ed = vscode.window.activeTextEditor;
    if (!ed) return;
    if (isTidal(ed)) return evalTidal(ed, true);
    evalStrudel(ed); // Strudel always runs the whole file
  });
  reg('algorave.hush', async () => {
    engine().stop();
    clearHighlights();
    await tidal.hush();
  });
  reg('algorave.showVisuals', () => engine().ensure(true));
  reg('algorave.diagnose', async () => {
    // Always tests the in-VS Code panel, whatever engine is set.
    panelEngine.ensure(true);
    const result = await new Promise<Extract<FromWebview, { type: 'diagnosis' }> | undefined>((resolve) => {
      pendingDiagnosis = resolve;
      panelEngine.post({ type: 'diagnose' });
      setTimeout(() => resolve(undefined), 40000);
    });
    const isSnap = !!process.env.SNAP || /\/snap\//.test(vscode.env.appRoot);
    const isFlatpak = !!process.env.FLATPAK_ID || /\/app\//.test(vscode.env.appRoot);
    strudelLog.appendLine('--- Algorave sound & graphics test ---');
    strudelLog.appendLine(`VS Code ${vscode.version} at ${vscode.env.appRoot}${isSnap ? ' (Snap)' : isFlatpak ? ' (Flatpak)' : ''}`);
    strudelLog.appendLine(JSON.stringify(result ?? { error: 'the panel did not answer' }, null, 2));
    strudelLog.show(true);
    if (!result) {
      vscode.window.showWarningMessage('The Strudel panel did not answer the test. Is it still loading? Try again in a few seconds.');
      return;
    }
    const packaging = isSnap ? 'the Snap build of VS Code' : isFlatpak ? 'the Flatpak build of VS Code' : undefined;
    const install = 'Install VS Code from code.visualstudio.com';
    const browser = 'Use the browser engine';
    const fixFor = async (problem: string) => {
      const why = packaging
        ? `${problem} This often happens with ${packaging}: its sandbox can cut webviews off from the sound card and the GPU. The .deb from code.visualstudio.com usually doesn't have this problem, and it uses the same settings and extensions folders.`
        : `${problem} Check the Strudel output for details, or run Strudel in the browser instead.`;
      const pick = await vscode.window.showWarningMessage(why, ...(packaging ? [install, browser] : [browser]));
      if (pick === install) vscode.env.openExternal(vscode.Uri.parse('https://code.visualstudio.com/docs/setup/linux'));
      if (pick === browser) cfg().update('strudel.engine', 'browser', vscode.ConfigurationTarget.Global);
    };
    if (result.audioError || result.audioState !== 'running') {
      return fixFor(`Sound couldn't start in the VS Code panel (${result.audioError ?? result.audioState}).`);
    }
    const heard = await vscode.window.showInformationMessage(
      'Did you just hear a one-second beep?' + (result.webgl ? '' : ' (Graphics: no WebGL here, so Hydra patterns will play without their visuals.)'),
      'Yes',
      'No',
    );
    if (heard === 'No') {
      return fixFor('The panel played a beep, but nothing came out of your speakers.');
    }
    if (heard === 'Yes') {
      if (!result.webgl) return fixFor('Sound works, but this VS Code window has no WebGL, so Hydra visuals are skipped.');
      vscode.window.showInformationMessage('Sound and graphics both work in VS Code. 🎉');
    }
  });
  reg('algorave.toggleProjector', () =>
    engine().setProjector(!engine().isProjector, Math.round(cfg().get<number>('performance.fontSize', 22) * 1.6)),
  );
  reg('algorave.visualsToNewWindow', async () => {
    if (engine() === browserEngine) {
      await browserEngine.ensure();
      vscode.window.showInformationMessage(
        'The visuals are in your browser: drag that tab onto the projector screen and press F (or the ⛶ button) for fullscreen.',
      );
      return;
    }
    const panel = panelEngine.ensure();
    panel.reveal(undefined, false); // focus it so the move command acts on it
    await new Promise((r) => setTimeout(r, 150));
    try {
      await vscode.commands.executeCommand('workbench.action.moveEditorToNewWindow');
    } catch {
      vscode.window.showInformationMessage('Drag the Strudel tab out of the window to put it on the projector screen.');
    }
  });
  reg('algorave.togglePerformanceMode', () => setPerformance(!performanceOn));
  reg('algorave.tidal.boot', () => tidal.boot().catch(() => undefined));
  reg('algorave.tidal.quit', () => tidal.quit());
  reg('algorave.tidal.startSuperDirt', () => tidal.startSuperDirt());
  reg('algorave.patterns.refresh', () => tree.reload());
  reg('algorave.patterns.open', (node: KitNode) => openNode(node));
  reg('algorave.patterns.play', async (node: KitNode) => {
    const ed = await openNode(node);
    if (ed) vscode.commands.executeCommand('algorave.eval');
  });
  reg('algorave.patterns.pick', async () => {
    type Item = vscode.QuickPickItem & { node: KitNode };
    const items: Item[] = [];
    tree.getChildren().forEach((root) => {
      const walk = (n: KitNode, group: string) => {
        if (n.kind === 'strudel') items.push({ label: n.pattern.name, description: 'Strudel', detail: n.pattern.about, node: n });
        else if (n.kind === 'tidalSection') items.push({ label: n.title, description: `Tidal · ${path.basename(n.file)}`, node: n });
        tree.getChildren(n).forEach((c) => walk(c, group));
      };
      walk(root, '');
    });
    if (!items.length) {
      vscode.window.showInformationMessage('No kit patterns found. Open your live_coding repo or set algorave.kitPath.');
      return;
    }
    const pick = await vscode.window.showQuickPick(items, { matchOnDescription: true, matchOnDetail: true, placeHolder: 'Pick a pattern' });
    if (pick) openNode(pick.node);
  });
  reg('algorave.newStrudelFile', () => openStrudelCode(STARTER));

  // -------------------------------------------------------------------------
  // Playing live: queued swaps, drop, mute / solo, mutator
  // -------------------------------------------------------------------------
  reg('algorave.evalQueued', () => {
    const ed = vscode.window.activeTextEditor;
    if (!ed) return;
    if (isTidal(ed)) return evalTidal(ed, false); // Tidal already changes on the next cycle
    evalStrudel(ed, true);
  });
  reg('algorave.cancelQueued', () => {
    engine().post({ type: 'cancelQueued' });
    queuedAt = undefined;
    pendingSections = undefined;
  });
  reg('algorave.patterns.queue', async (node: KitNode) => {
    const ed = await openNode(node);
    if (!ed) return;
    if (isTidal(ed)) return evalTidal(ed, false);
    evalStrudel(ed, true);
  });
  reg('algorave.drop', () => {
    if (!strudelState.started) {
      vscode.window.setStatusBarMessage('Algorave: start a Strudel pattern first, then drop it', 3000);
      return;
    }
    engine().post({
      type: 'drop',
      buildBars: Number(cfg().get('drop.buildBars', '4')),
      landEvery: Number(cfg().get('drop.landEvery', '8')),
    });
  });

  /** Replace the whole document with new code, then play it. */
  async function rewrite(ed: vscode.TextEditor, code: string) {
    const doc = ed.document;
    const full = new vscode.Range(0, 0, doc.lineCount, 0);
    await ed.edit((e) => e.replace(full, code));
    if (strudelState.started) evalStrudel(ed);
  }
  const strudelEditor = () => {
    const ed = vscode.window.activeTextEditor;
    if (!ed) return undefined;
    if (isTidal(ed)) return ed;
    return ed;
  };
  const layersOf = (ed: vscode.TextEditor) => {
    try {
      return listLayers(ed.document.getText().replace(/\r\n/g, '\n'));
    } catch (e) {
      vscode.window.showWarningMessage(`Can't read the layers: ${(e as Error).message}`);
      return undefined;
    }
  };

  // Tidal: its own mute / solo by channel
  const tidalMuted = new Set<number>();
  async function tidalMute(ed: vscode.TextEditor, solo: boolean) {
    const chans = tidalChannels(ed.document.getText());
    if (!chans.length) return vscode.window.showInformationMessage('No d1, d2… channels in this file.');
    if (solo) {
      const pick = await vscode.window.showQuickPick(chans.map((c) => ({ label: `d${c}`, c })), { placeHolder: 'Solo which channel?' });
      if (pick) await tidal.send(`solo ${pick.c}`);
      return;
    }
    const picks = await vscode.window.showQuickPick(
      chans.map((c) => ({ label: `d${c}`, c, picked: tidalMuted.has(c) })),
      { canPickMany: true, placeHolder: 'Tick the channels to mute' },
    );
    if (!picks) return;
    const want = new Set(picks.map((p) => p.c));
    for (const c of chans) {
      if (want.has(c) && !tidalMuted.has(c)) await tidal.send(`mute ${c}`);
      if (!want.has(c) && tidalMuted.has(c)) await tidal.send(`unmute ${c}`);
    }
    tidalMuted.clear();
    want.forEach((c) => tidalMuted.add(c));
  }

  reg('algorave.mute', async () => {
    const ed = strudelEditor();
    if (!ed) return;
    if (isTidal(ed)) return tidalMute(ed, false);
    const layers = layersOf(ed);
    if (!layers) return;
    if (layers.length < 2) return vscode.window.showInformationMessage('This pattern is a single layer: nothing to mute separately.');
    const picks = await vscode.window.showQuickPick(
      layers.map((l, i) => ({ label: `${i + 1}. ${l.label}`, description: l.drums ? 'drums' : undefined, picked: l.muted, key: l.key })),
      { canPickMany: true, placeHolder: 'Tick the layers to mute (Ctrl+Alt+1-9 toggles one directly)' },
    );
    if (!picks) return;
    await rewrite(ed, applyMutes(ed.document.getText(), new Set(picks.map((p) => p.key))));
  });
  reg('algorave.solo', async () => {
    const ed = strudelEditor();
    if (!ed) return;
    if (isTidal(ed)) return tidalMute(ed, true);
    const layers = layersOf(ed);
    if (!layers || layers.length < 2) return;
    const pick = await vscode.window.showQuickPick(
      layers.map((l, i) => ({ label: `${i + 1}. ${l.label}`, key: l.key })),
      { placeHolder: 'Solo which layer? (the rest get muted)' },
    );
    if (!pick) return;
    await rewrite(ed, applyMutes(ed.document.getText(), new Set(layers.filter((l) => l.key !== pick.key).map((l) => l.key))));
  });
  reg('algorave.unmuteAll', async () => {
    const ed = strudelEditor();
    if (!ed) return;
    if (isTidal(ed)) {
      for (const c of tidalMuted) await tidal.send(`unmute ${c}`);
      tidalMuted.clear();
      await tidal.send('unsoloAll');
      return;
    }
    await rewrite(ed, applyMutes(ed.document.getText(), new Set()));
  });
  for (let n = 1; n <= 9; n++) {
    reg(`algorave.toggleLayer${n}`, async () => {
      const ed = strudelEditor();
      if (!ed) return;
      if (isTidal(ed)) {
        if (tidalMuted.has(n)) {
          tidalMuted.delete(n);
          await tidal.send(`unmute ${n}`);
        } else {
          tidalMuted.add(n);
          await tidal.send(`mute ${n}`);
        }
        return;
      }
      const layers = layersOf(ed);
      const l = layers?.[n - 1];
      if (!layers || !l) return;
      const muted = new Set(layers.filter((x) => x.muted).map((x) => x.key));
      if (l.muted) muted.delete(l.key);
      else muted.add(l.key);
      vscode.window.setStatusBarMessage(`${l.muted ? '$(unmute) unmuted' : '$(mute) muted'} ${l.label}`, 2500);
      await rewrite(ed, applyMutes(ed.document.getText(), muted));
    });
  }

  let lastMutation: string | undefined;
  reg('algorave.mutate', async () => {
    const ed = vscode.window.activeTextEditor;
    if (!ed || isTidal(ed)) return;
    const doc = ed.document;
    const code = doc.getText();
    try {
      const m = mutate(code, doc.offsetAt(ed.selection.active), Math.random, lastMutation);
      lastMutation = m.transform;
      const pos = doc.positionAt(m.at);
      await ed.edit((e) => e.insert(pos, m.transform));
      const end = doc.positionAt(m.at + m.transform.length);
      ed.setDecorations(flashDeco, [new vscode.Range(pos, end)]);
      setTimeout(() => ed.setDecorations(flashDeco, []), 600);
      vscode.window.setStatusBarMessage(`$(sparkle) ${m.layer}: ${m.transform}   (Ctrl+Z, Ctrl+Enter to undo)`, 4000);
      evalStrudel(ed);
    } catch (e) {
      vscode.window.showWarningMessage(`Can't mutate: ${(e as Error).message}`);
    }
  });

  // -------------------------------------------------------------------------
  // Set list
  // -------------------------------------------------------------------------
  const setList = new SetList(() => tree.kit);
  ctx.subscriptions.push(setList, vscode.window.registerTreeDataProvider('algorave.setlist', setList));
  const setItem = vscode.window.createStatusBarItem('algorave.setlistItem', vscode.StatusBarAlignment.Left, 96);
  setItem.name = 'Set list';
  setItem.command = 'algorave.setlist.next';
  ctx.subscriptions.push(setItem);
  function renderSetItem() {
    const i = setList.current;
    const it = setList.items[i];
    if (!it) return setItem.hide();
    const next = setList.items[i + 1];
    setItem.text = `$(list-ordered) ${i + 1}/${setList.items.length}${it.note ? ' · ' + it.note : ''}`;
    setItem.tooltip = `Now: ${itemLabel(it)}${it.note ? ' — ' + it.note : ''}\nNext: ${next ? itemLabel(next) + (next.note ? ' — ' + next.note : '') : '(end of set)'}\nClick or Ctrl+Alt+N to queue the next one`;
    setItem.show();
  }

  async function openSetItem(i: number): Promise<vscode.TextEditor | undefined> {
    const it = setList.items[i];
    if (!it) return undefined;
    if (it.pattern) {
      const idx = tree.strudelPatterns.findIndex((p) => p.name === it.pattern);
      if (idx < 0) {
        vscode.window.showWarningMessage(`"${it.pattern}" isn't in patterns.js any more.`);
        return undefined;
      }
      return openNode({ kind: 'strudel', pattern: tree.strudelPatterns[idx], index: idx });
    }
    const base = path.dirname(setList.file() ?? '');
    const f = path.isAbsolute(it.file!) ? it.file! : path.join(base, it.file!);
    const doc = await vscode.workspace.openTextDocument(f);
    return vscode.window.showTextDocument(doc, { preview: false });
  }
  async function stepSet(by: number) {
    if (!setList.items.length) return vscode.window.showInformationMessage('The set list is empty: add patterns from the Patterns view (right-click → Add to Set List).');
    const i = Math.min(setList.items.length - 1, Math.max(0, setList.current + by));
    if (i === setList.current && setList.current >= 0) return vscode.window.setStatusBarMessage('Algorave: end of the set', 3000);
    setList.setCurrent(i);
    renderSetItem();
    const ed = await openSetItem(i);
    if (!ed) return;
    if (isTidal(ed)) return;
    evalStrudel(ed, true); // lands on the next phrase if something's playing, else now
  }
  reg('algorave.setlist.next', () => stepSet(1));
  reg('algorave.setlist.previous', () => stepSet(-1));
  reg('algorave.setlist.go', async (i: number) => {
    setList.setCurrent(i);
    renderSetItem();
    await openSetItem(i);
  });
  reg('algorave.setlist.play', async (i: number) => {
    setList.setCurrent(i);
    renderSetItem();
    const ed = await openSetItem(i);
    if (ed && !isTidal(ed)) evalStrudel(ed, true);
  });
  reg('algorave.setlist.add', async (node?: KitNode | vscode.Uri) => {
    let item: { pattern?: string; file?: string } | undefined;
    if (node && 'kind' in node && node.kind === 'strudel') item = { pattern: node.pattern.name };
    else {
      const uri = node instanceof vscode.Uri ? node : vscode.window.activeTextEditor?.document.uri;
      if (!uri || uri.scheme !== 'file') {
        return vscode.window.showInformationMessage('Save the file first, or add a pattern from the Patterns view.');
      }
      const base = path.dirname(setList.file() ?? uri.fsPath);
      item = { file: path.relative(base, uri.fsPath) };
    }
    const note = await vscode.window.showInputBox({ prompt: `Note for ${item.pattern ?? item.file} (only you see it)`, placeHolder: 'e.g. bring the hoover in after 8 bars' });
    if (note === undefined) return;
    setList.add({ ...item, note: note || undefined });
    renderSetItem();
  });
  reg('algorave.setlist.remove', (i: number) => {
    setList.remove(i);
    renderSetItem();
  });
  reg('algorave.setlist.moveUp', (i: number) => setList.move(i, -1));
  reg('algorave.setlist.moveDown', (i: number) => setList.move(i, 1));
  reg('algorave.setlist.editNote', async (i: number) => {
    const it = setList.items[i];
    if (!it) return;
    const note = await vscode.window.showInputBox({ prompt: `Note for ${itemLabel(it)}`, value: it.note ?? '' });
    if (note === undefined) return;
    setList.setNote(i, note);
    renderSetItem();
  });
  reg('algorave.setlist.openFile', async () => {
    const f = setList.file();
    if (!f) return;
    if (!require('fs').existsSync(f)) require('fs').writeFileSync(f, JSON.stringify({ items: [] }, null, 2) + '\n');
    vscode.window.showTextDocument(vscode.Uri.file(f));
  });

  ctx.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('algorave.kitPath')) {
        tree.reload();
        setList.load();
      }
      if (e.affectsConfiguration('algorave.strudel.engine')) {
        // Don't leave the old engine playing underneath the new one.
        panelEngine.stop();
        browserEngine.stop();
        clearHighlights();
        strudelState = { started: false, cps: undefined, error: undefined, audioBlocked: false };
        renderStrudelItem();
      }
      if (e.affectsConfiguration('algorave.strudel.highlight')) {
        const on = cfg().get('strudel.highlight', true);
        engine().post({ type: 'highlight', on });
        if (!on) clearHighlights();
      }
    }),
    vscode.workspace.onDidGrantWorkspaceTrust(() => tree.reload()),
    vscode.workspace.onDidChangeWorkspaceFolders(() => tree.reload()),
    { dispose: () => void setPerformance(false) },
  );
}

export function deactivate() {
  /* disposables handle it */
}
