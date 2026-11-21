import * as http from 'http';
import { AddressInfo } from 'net';

export type Handler = (req: http.IncomingMessage, res: http.ServerResponse, rest: string) => void | Promise<void>;

/**
 * One small HTTP server on 127.0.0.1, shared by the browser engine, the offline
 * cache and the MCP endpoint. It tries a fixed port first so the MCP URL you give
 * MCP clients stays the same between sessions.
 */
export class LocalServer {
  private server: http.Server | undefined;
  private routes: { prefix: string; handler: Handler }[] = [];
  port = 0;
  private starting: Promise<void> | undefined;

  constructor(private readonly preferredPort: () => number) {}

  route(prefix: string, handler: Handler) {
    this.routes.push({ prefix, handler });
    // longest prefix first
    this.routes.sort((a, b) => b.prefix.length - a.prefix.length);
  }

  get base() {
    return `http://127.0.0.1:${this.port}`;
  }

  start(): Promise<void> {
    if (this.starting) return this.starting;
    this.starting = (async () => {
      const server = http.createServer((req, res) => this.dispatch(req, res));
      const listen = (port: number) =>
        new Promise<void>((resolve, reject) => {
          const onErr = (e: Error) => {
            server.off('listening', onOk);
            reject(e);
          };
          const onOk = () => {
            server.off('error', onErr);
            resolve();
          };
          server.once('error', onErr);
          server.once('listening', onOk);
          server.listen(port, '127.0.0.1');
        });
      try {
        await listen(this.preferredPort());
      } catch {
        await listen(0); // port taken: any free one
      }
      this.server = server;
      this.port = (server.address() as AddressInfo).port;
    })();
    return this.starting;
  }

  private dispatch(req: http.IncomingMessage, res: http.ServerResponse) {
    // Webviews and browser tabs call us cross-origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    if (req.method === 'OPTIONS') {
      res.writeHead(204).end();
      return;
    }
    const url = req.url ?? '/';
    for (const r of this.routes) {
      if (url.startsWith(r.prefix)) {
        Promise.resolve(r.handler(req, res, url.slice(r.prefix.length))).catch((e) => {
          if (!res.headersSent) res.writeHead(500, { 'content-type': 'text/plain' });
          res.end(String(e?.message ?? e));
        });
        return;
      }
    }
    res.writeHead(404).end();
  }

  dispose() {
    this.server?.close();
  }
}

export function readBody(req: http.IncomingMessage, limit = 2_000_000): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (c) => {
      body += c;
      if (body.length > limit) {
        reject(new Error('body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}
