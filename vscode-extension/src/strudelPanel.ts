import * as vscode from 'vscode';
import { strudelHtml } from './webviewHtml';

/** Messages the webview sends back to the extension. */
export type FromWebview =
  | { type: 'ready' }
  | { type: 'state'; started: boolean; pending: boolean; error?: string; cps?: number }
  | { type: 'evaluated'; id: number; ok: boolean; error?: string; cps?: number }
  | { type: 'haps'; id: number; ranges: [number, number][] }
  | { type: 'log'; message: string; level?: string }
  | { type: 'audioBlocked'; blocked: boolean };

/** Messages the extension sends to the webview. */
export type ToWebview =
  | { type: 'eval'; id: number; code: string }
  | { type: 'stop' }
  | { type: 'projector'; on: boolean; fontSize: number }
  | { type: 'highlight'; on: boolean };

/**
 * Hosts the Strudel engine. Strudel runs in a browser, so the "visuals panel" is
 * a webview with the same <strudel-editor> component the kit's index.html uses.
 * Audio, pianoroll / scope / spiral canvases and Hydra all live in here.
 */
export class StrudelPanel implements vscode.Disposable {
  private panel: vscode.WebviewPanel | undefined;
  private ready = false;
  private queue: ToWebview[] = [];
  private readonly emitter = new vscode.EventEmitter<FromWebview>();
  readonly onMessage = this.emitter.event;
  private projector = false;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(private readonly ctx: vscode.ExtensionContext) {}

  get isOpen() {
    return !!this.panel;
  }
  get isProjector() {
    return this.projector;
  }
  get webviewPanel() {
    return this.panel;
  }

  /** Make sure the engine exists. Opens beside the code without taking focus. */
  ensure(reveal = false): vscode.WebviewPanel {
    if (this.panel) {
      if (reveal) this.panel.reveal(undefined, true);
      return this.panel;
    }
    const panel = vscode.window.createWebviewPanel(
      'algorave.strudel',
      'Strudel',
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      {
        enableScripts: true,
        // Keep the audio running when the tab is hidden behind another one.
        retainContextWhenHidden: true,
        localResourceRoots: [],
      },
    );
    panel.iconPath = vscode.Uri.joinPath(this.ctx.extensionUri, 'media', 'icon.svg');
    this.ready = false;
    this.panel = panel;
    panel.webview.html = this.html(panel.webview);
    panel.webview.onDidReceiveMessage(
      (m: FromWebview) => {
        if (m.type === 'ready') {
          this.ready = true;
          const q = this.queue;
          this.queue = [];
          q.forEach((x) => panel.webview.postMessage(x));
        }
        this.emitter.fire(m);
      },
      undefined,
      this.disposables,
    );
    panel.onDidDispose(
      () => {
        this.panel = undefined;
        this.ready = false;
        this.queue = [];
        this.projector = false;
        this.emitter.fire({ type: 'state', started: false, pending: false });
      },
      undefined,
      this.disposables,
    );
    this.post({ type: 'highlight', on: vscode.workspace.getConfiguration('algorave').get('strudel.highlight', true) });
    return panel;
  }

  post(msg: ToWebview) {
    if (!this.panel) return;
    if (this.ready) this.panel.webview.postMessage(msg);
    else this.queue.push(msg);
  }

  eval(id: number, code: string) {
    this.ensure();
    this.post({ type: 'eval', id, code });
  }

  stop() {
    this.post({ type: 'stop' });
  }

  setProjector(on: boolean, fontSize: number) {
    this.projector = on;
    this.ensure(true);
    this.post({ type: 'projector', on, fontSize });
  }

  dispose() {
    this.panel?.dispose();
    this.disposables.forEach((d) => d.dispose());
    this.emitter.dispose();
  }

  private html(webview: vscode.Webview): string {
    const replUrl = vscode.workspace
      .getConfiguration('algorave')
      .get<string>('strudel.replUrl', 'https://unpkg.com/@strudel/repl@1.3.0');
    const nonce = [...Array(32)].map(() => Math.random().toString(36)[2]).join('');
    return strudelHtml({ replUrl, nonce, cspSource: webview.cspSource });
  }
}
