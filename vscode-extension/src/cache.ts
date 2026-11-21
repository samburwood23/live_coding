import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * A cache-first proxy for everything Strudel downloads: the engine from unpkg,
 * sample maps and samples from GitHub, soundfonts, Hydra. The first time a file
 * is fetched it's saved to disk; after that it's served from disk, so a set
 * works with no internet once everything it uses has been played (or prefetched).
 *
 * URLs map to paths so relative imports keep working:
 *   https://unpkg.com/@strudel/repl@1.3.0/dist/index.js
 *   -> <prefix>https/unpkg.com/@strudel/repl@1.3.0/dist/index.js
 */
export interface CacheEntry {
  url: string;
  status: number;
  type?: string;
  /** set for redirects: the URL the request ended up at */
  location?: string;
}

export function toCachePath(url: string): string {
  return url.replace(/^(https?):\/\//, '$1/');
}
export function fromCachePath(p: string): string | undefined {
  const m = p.match(/^(https?)\/(.+)$/);
  return m ? `${m[1]}://${m[2]}` : undefined;
}

export class CacheProxy {
  hits = 0;
  misses = 0;
  failures = 0;
  private inflight = new Map<string, Promise<{ entry: CacheEntry; file?: string }>>();

  constructor(
    private readonly dir: string,
    private readonly enabled: () => boolean,
    private readonly log: (s: string) => void = () => {},
    private readonly fetcher: (url: string) => Promise<{ status: number; type?: string; location?: string; body?: Buffer }> = fetchOnce,
  ) {
    fs.mkdirSync(dir, { recursive: true });
  }

  private key(url: string) {
    return crypto.createHash('sha1').update(url).digest('hex');
  }

  private read(url: string): { entry: CacheEntry; file?: string } | undefined {
    const k = this.key(url);
    const meta = path.join(this.dir, k + '.json');
    if (!fs.existsSync(meta)) return undefined;
    try {
      const entry = JSON.parse(fs.readFileSync(meta, 'utf8')) as CacheEntry;
      const file = path.join(this.dir, k + '.bin');
      if (!entry.location && !fs.existsSync(file)) return undefined;
      return { entry, file: entry.location ? undefined : file };
    } catch {
      return undefined;
    }
  }

  private write(entry: CacheEntry, body?: Buffer) {
    const k = this.key(entry.url);
    if (body) fs.writeFileSync(path.join(this.dir, k + '.bin'), body);
    fs.writeFileSync(path.join(this.dir, k + '.json'), JSON.stringify(entry));
  }

  /** Get a URL: from disk if we have it, else from the network (and save it). */
  async get(url: string): Promise<{ entry: CacheEntry; file?: string }> {
    const cached = this.enabled() ? this.read(url) : undefined;
    if (cached) {
      this.hits++;
      return cached;
    }
    let p = this.inflight.get(url);
    if (!p) {
      p = (async () => {
        this.misses++;
        const r = await this.fetcher(url);
        if (r.location) {
          const entry: CacheEntry = { url, status: r.status, location: new URL(r.location, url).href };
          if (this.enabled()) this.write(entry);
          return { entry };
        }
        const entry: CacheEntry = { url, status: r.status, type: r.type };
        if (r.status >= 200 && r.status < 300 && r.body) {
          if (this.enabled()) {
            this.write(entry, r.body);
            return { entry, file: path.join(this.dir, this.key(url) + '.bin') };
          }
          const tmp = path.join(this.dir, 'uncached-' + this.key(url));
          fs.writeFileSync(tmp, r.body);
          return { entry, file: tmp };
        }
        return { entry };
      })().finally(() => this.inflight.delete(url));
      this.inflight.set(url, p);
    }
    return p;
  }

  /** HTTP handler for <prefix><scheme>/<host>/<path> */
  async handle(req: http.IncomingMessage, res: http.ServerResponse, rest: string, prefix: string) {
    const url = fromCachePath(decodeURI(rest));
    if (!url) {
      res.writeHead(400).end('bad cache path');
      return;
    }
    let got;
    try {
      got = await this.get(url);
    } catch (e) {
      this.failures++;
      this.log(`✗ offline and not cached: ${url}`);
      res.writeHead(504, { 'content-type': 'text/plain' }).end(`not cached and the network failed: ${(e as Error).message}`);
      return;
    }
    const { entry, file } = got;
    if (entry.location) {
      // Redirect to the cached path of the target, so relative imports resolve there
      res.writeHead(302, { location: prefix + encodeURI(toCachePath(entry.location)) }).end();
      return;
    }
    if (!file) {
      res.writeHead(entry.status || 502).end();
      return;
    }
    res.writeHead(200, {
      'content-type': entry.type || guessType(url),
      'cache-control': 'no-cache',
    });
    fs.createReadStream(file).pipe(res);
  }

  stats() {
    let files = 0;
    let bytes = 0;
    for (const f of fs.readdirSync(this.dir)) {
      if (!f.endsWith('.bin')) continue;
      files++;
      bytes += fs.statSync(path.join(this.dir, f)).size;
    }
    return { files, bytes };
  }

  clear() {
    for (const f of fs.readdirSync(this.dir)) fs.rmSync(path.join(this.dir, f), { force: true });
  }
}

function guessType(url: string) {
  const ext = path.extname(new URL(url).pathname).toLowerCase();
  return (
    {
      '.js': 'application/javascript',
      '.mjs': 'application/javascript',
      '.json': 'application/json',
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.ogg': 'audio/ogg',
      '.flac': 'audio/flac',
      '.css': 'text/css',
      '.wasm': 'application/wasm',
    }[ext] ?? 'application/octet-stream'
  );
}

/** One GET, no redirect following (the proxy handles those so paths stay right). */
export function fetchOnce(url: string, timeoutMs = 20000): Promise<{ status: number; type?: string; location?: string; body?: Buffer }> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https:') ? https : http;
    const req = lib.get(url, { headers: { 'user-agent': 'algorave-kit-vscode' }, timeout: timeoutMs }, (res) => {
      const status = res.statusCode ?? 0;
      if (status >= 300 && status < 400 && res.headers.location) {
        res.resume();
        resolve({ status, location: res.headers.location });
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status, type: res.headers['content-type'], body: Buffer.concat(chunks) }));
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('timed out')));
    req.on('error', reject);
  });
}
