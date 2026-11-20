import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { looksLikeGhciError, stripAnsi, toGhciInput } from './core';

type Status = 'stopped' | 'booting' | 'running';

/** Runs GHCi with the Tidal boot file, and optionally sclang + SuperDirt. */
export class TidalEngine implements vscode.Disposable {
  private ghci: cp.ChildProcessWithoutNullStreams | undefined;
  private sclang: cp.ChildProcessWithoutNullStreams | undefined;
  private readonly out = vscode.window.createOutputChannel('Tidal');
  private readonly scOut = vscode.window.createOutputChannel('SuperCollider');
  private status: Status = 'stopped';
  private readonly emitter = new vscode.EventEmitter<Status>();
  readonly onStatus = this.emitter.event;
  private bootPromise: Promise<void> | undefined;

  constructor(
    private readonly ctx: vscode.ExtensionContext,
    private readonly kitFolder: () => string | undefined,
  ) {}

  get state(): Status {
    return this.status;
  }

  private setStatus(s: Status) {
    this.status = s;
    this.emitter.fire(s);
  }

  private cfg() {
    return vscode.workspace.getConfiguration('algorave.tidal');
  }

  /** Resolve a setting path: absolute, ~, or relative to the first workspace folder. */
  private resolvePath(p: string): string {
    if (p.startsWith('~')) p = path.join(process.env.HOME || process.env.USERPROFILE || '', p.slice(1));
    if (path.isAbsolute(p)) return p;
    const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    return ws ? path.join(ws, p) : p;
  }

  bootFile(): { file: string; source: string } {
    const configured = this.cfg().get<string>('bootFile', '');
    if (configured) return { file: this.resolvePath(configured), source: 'setting' };
    const kit = this.kitFolder();
    if (kit) {
      const f = path.join(kit, 'tidal', 'BootTidal.hs');
      if (fs.existsSync(f)) return { file: f, source: 'your kit' };
    }
    return { file: path.join(this.ctx.extensionPath, 'tidal', 'BootTidal.hs'), source: 'bundled' };
  }

  private superDirtFile(): string | undefined {
    const configured = this.cfg().get<string>('superDirtStartupFile', '');
    if (configured) return this.resolvePath(configured);
    const kit = this.kitFolder();
    const f = kit && path.join(kit, 'tidal', 'superdirt_startup.scd');
    return f && fs.existsSync(f) ? f : undefined;
  }

  async boot(): Promise<void> {
    if (this.ghci) return this.bootPromise;
    if (!vscode.workspace.isTrusted) {
      vscode.window.showWarningMessage('Tidal runs code from your workspace, so it only boots in a trusted workspace.');
      throw new Error('untrusted');
    }
    if (this.cfg().get('startSuperDirt', false)) this.startSuperDirt();

    const { file, source } = this.bootFile();
    const cmd = this.cfg().get<string>('ghciPath', 'ghci');
    const args = [...this.cfg().get<string[]>('ghciArgs', []), '-ghci-script', file];
    this.out.appendLine(`▶ ${cmd} ${args.join(' ')}   (boot file from ${source})`);
    this.setStatus('booting');

    const proc = cp.spawn(cmd, args, {
      cwd: path.dirname(file),
      env: { ...process.env, TERM: 'dumb' },
      shell: process.platform === 'win32',
    });
    this.ghci = proc;

    this.bootPromise = new Promise<void>((resolve, reject) => {
      let settled = false;
      const done = (err?: Error) => {
        if (settled) return;
        settled = true;
        if (err) reject(err);
        else resolve();
      };
      const onData = (buf: Buffer) => {
        const text = stripAnsi(buf.toString());
        this.out.append(text);
        if (this.status === 'booting' && /tidal>\s*$/.test(text)) {
          this.setStatus('running');
          done();
        }
        if (looksLikeGhciError(text) && this.cfg().get('showOutputOnError', true)) this.out.show(true);
      };
      proc.stdout.on('data', onData);
      proc.stderr.on('data', onData);
      proc.on('error', (err) => {
        const msg =
          (err as NodeJS.ErrnoException).code === 'ENOENT'
            ? `Couldn't find "${cmd}". Install GHC + Tidal (see tidal/README.md in your kit) or set algorave.tidal.ghciPath.`
            : `Tidal failed to start: ${err.message}`;
        vscode.window.showErrorMessage(msg, 'Open settings').then((c) => {
          if (c) vscode.commands.executeCommand('workbench.action.openSettings', 'algorave.tidal');
        });
        this.out.appendLine(msg);
        this.ghci = undefined;
        this.setStatus('stopped');
        done(err);
      });
      proc.on('exit', (code) => {
        this.out.appendLine(`\n■ GHCi exited (${code ?? 'signal'})`);
        if (this.ghci === proc) this.ghci = undefined;
        this.setStatus('stopped');
        done(new Error('GHCi exited during boot'));
      });
      // Some boot files set a different prompt; don't hang forever waiting for "tidal>".
      setTimeout(() => {
        if (this.status === 'booting' && this.ghci === proc) {
          this.setStatus('running');
          done();
        }
      }, 20000);
    });
    return this.bootPromise;
  }

  startSuperDirt() {
    if (this.sclang) return;
    if (!vscode.workspace.isTrusted) return;
    const file = this.superDirtFile();
    if (!file) {
      vscode.window.showWarningMessage('No SuperDirt startup file found. Set algorave.tidal.superDirtStartupFile.');
      return;
    }
    const cmd = this.cfg().get<string>('sclangPath', 'sclang');
    this.scOut.appendLine(`▶ ${cmd} ${file}`);
    const proc = cp.spawn(cmd, [file], { cwd: path.dirname(file), shell: process.platform === 'win32' });
    this.sclang = proc;
    const onData = (b: Buffer) => this.scOut.append(stripAnsi(b.toString()));
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    proc.on('error', (err) => {
      vscode.window.showErrorMessage(`Couldn't start sclang: ${err.message}. Set algorave.tidal.sclangPath.`);
      this.sclang = undefined;
    });
    proc.on('exit', (code) => {
      this.scOut.appendLine(`\n■ sclang exited (${code ?? 'signal'})`);
      if (this.sclang === proc) this.sclang = undefined;
    });
  }

  /** Send code to GHCi, booting first if needed. */
  async send(code: string): Promise<boolean> {
    const input = toGhciInput(code);
    if (!input) return false;
    if (!this.ghci) {
      try {
        await this.boot();
      } catch {
        return false;
      }
    } else if (this.bootPromise) {
      await this.bootPromise.catch(() => undefined);
    }
    if (!this.ghci) return false;
    this.out.appendLine(input.replace(/\n$/, '').split('\n').map((l) => '» ' + l).join('\n'));
    this.ghci.stdin.write(input);
    return true;
  }

  async hush() {
    if (this.ghci) await this.send('hush');
  }

  quit() {
    if (this.ghci) {
      this.ghci.stdin.write(':quit\n');
      const p = this.ghci;
      setTimeout(() => p.kill(), 1500);
    }
    if (this.sclang) {
      this.sclang.kill();
      this.sclang = undefined;
    }
  }

  dispose() {
    this.quit();
    this.out.dispose();
    this.scOut.dispose();
    this.emitter.dispose();
  }
}
