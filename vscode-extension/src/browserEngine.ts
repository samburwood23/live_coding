import * as vscode from 'vscode';
import * as http from 'http';
import * as crypto from 'crypto';
import { strudelHtml } from './webviewHtml';
import { LocalServer } from './server';
import type { FromWebview, ToWebview } from './strudelPanel';

/**
 * Runs the Strudel engine in your normal web browser instead of a VS Code panel.
 * Some VS Code builds (the Snap and Flatpak ones especially) give webviews no
 * WebGL or no working audio; a real browser has both, and real fullscreen for
 * the projector.
 *
 * The extension serves the page on 127.0.0.1 behind a random token, sends it
 * messages over Server-Sent Events, and the page POSTs its messages back.
 */
export class BrowserEngine implements vscode.Disposable {
  private client: http.ServerResponse | undefined;
  private ready = false;
  private queue: ToWebview[] = [];
  private lastOpen = 0;
  private projector = false;
  private readonly emitter = new vscode.EventEmitter<FromWebview>();
  readonly onMessage = this.emitter.event;

  constructor(
    private readonly ctx: vscode.ExtensionContext,
    private readonly server: LocalServer,
    private readonly token: string,
    private readonly proxyBase: () => string | undefined,
  ) {
    server.route(`/${token}/`, (req, res, rest) => this.handle(req, res, rest));
  }

  get isOpen() {
    return !!this.client;
  }
  get isProjector() {
    return this.projector;
  }

  private start(): Promise<void> {
    return this.server.start();
  }

  url() {
    return `${this.server.base}/${this.token}/`;
  }

  private handle(req: http.IncomingMessage, res: http.ServerResponse, rest: string) {
    const route = rest.split('?')[0];
    if (route.startsWith('cache/')) { res.writeHead(404).end(); return; } // the cache has its own route

    if (req.method === 'GET' && route === '') {
      const replUrl = vscode.workspace
        .getConfiguration('algorave')
        .get<string>('strudel.replUrl', 'https://unpkg.com/@strudel/repl@1.3.0');
      const nonce = crypto.randomBytes(16).toString('hex');
      const shim = `<script nonce="${nonce}">
        window.__algoraveBrowser = true;
        window.acquireVsCodeApi = () => ({
          postMessage: (m) => fetch('msg', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(m), keepalive: true }).catch(() => {}),
        });
        const es = new EventSource('events');
        es.onmessage = (e) => window.postMessage(JSON.parse(e.data), '*');
      </script>`;
      const html = strudelHtml({ replUrl, nonce, cspSource: "'self'", vscodeShim: shim, browser: true, proxyBase: this.proxyBase() });
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      res.end(html);
      return;
    }

    if (req.method === 'GET' && route === 'events') {
      // One engine at a time: a newly opened tab takes over from the old one.
      if (this.client) {
        this.sendTo(this.client, { type: 'superseded' });
        this.client.end();
      }
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
      res.write(': hi\n\n');
      this.client = res;
      this.ready = false;
      const keepAlive = setInterval(() => res.write(': ping\n\n'), 15000);
      req.on('close', () => {
        clearInterval(keepAlive);
        if (this.client === res) {
          this.client = undefined;
          this.ready = false;
          this.projector = false;
          this.emitter.fire({ type: 'state', started: false, pending: false });
        }
      });
      return;
    }

    if (req.method === 'POST' && route === 'msg') {
      let body = '';
      req.on('data', (c) => {
        body += c;
        if (body.length > 1_000_000) req.destroy();
      });
      req.on('end', () => {
        res.writeHead(204).end();
        try {
          const m = JSON.parse(body) as FromWebview;
          if (m.type === 'ready') {
            this.ready = true;
            const q = this.queue;
            this.queue = [];
            q.forEach((x) => this.post(x));
          }
          this.emitter.fire(m);
        } catch {
          /* ignore junk */
        }
      });
      return;
    }
    res.writeHead(404).end();
  }

  private sendTo(res: http.ServerResponse, msg: ToWebview) {
    res.write(`data: ${JSON.stringify(msg)}\n\n`);
  }

  /** Start the server and open the page in the browser if no tab is connected. */
  async ensure(_reveal = false): Promise<void> {
    await this.start();
    if (this.client) return;
    // Don't open a second tab while the first is still loading.
    if (Date.now() - this.lastOpen < 20000) return;
    this.lastOpen = Date.now();
    await vscode.env.openExternal(vscode.Uri.parse(this.url()));
  }

  post(msg: ToWebview) {
    if (this.client && this.ready) this.sendTo(this.client, msg);
    else if (msg.type !== 'stop') this.queue.push(msg);
  }

  eval(id: number, code: string) {
    // Only the latest eval matters if the page isn't up yet.
    this.queue = this.queue.filter((m) => m.type !== 'eval');
    void this.ensure();
    this.post({ type: 'eval', id, code });
  }

  stop() {
    this.post({ type: 'stop' });
  }

  setProjector(on: boolean, fontSize: number) {
    this.projector = on;
    void this.ensure();
    this.post({ type: 'projector', on, fontSize });
  }

  dispose() {
    this.client?.end();
    this.emitter.dispose();
  }
}
