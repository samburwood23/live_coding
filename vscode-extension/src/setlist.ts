import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/** One entry in the running order: a kit pattern (by name) or a file, with a private note. */
export interface SetItem {
  pattern?: string;
  file?: string;
  note?: string;
}

interface SetFile {
  items: SetItem[];
}

export const itemLabel = (it: SetItem) => it.pattern ?? (it.file ? path.basename(it.file) : '?');

/**
 * The set list lives in setlist.json in your kit folder (or the workspace), so it's
 * versioned with the patterns. The view shows it in order with your notes; the
 * current item is marked, and Next / Previous step through it.
 */
export class SetList implements vscode.TreeDataProvider<number>, vscode.Disposable {
  private readonly emitter = new vscode.EventEmitter<number | undefined>();
  readonly onDidChangeTreeData = this.emitter.event;
  items: SetItem[] = [];
  current = -1;
  private watcher: vscode.FileSystemWatcher | undefined;
  private writing = false;

  constructor(private readonly folder: () => string | undefined) {
    this.load();
  }

  file(): string | undefined {
    const dir = this.folder() ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    return dir ? path.join(dir, 'setlist.json') : undefined;
  }

  load() {
    this.watcher?.dispose();
    const f = this.file();
    this.items = [];
    if (f && fs.existsSync(f)) {
      try {
        const data = JSON.parse(fs.readFileSync(f, 'utf8')) as SetFile;
        this.items = Array.isArray(data.items) ? data.items.filter((x) => x && (x.pattern || x.file)) : [];
      } catch (e) {
        vscode.window.showWarningMessage(`setlist.json didn't load: ${(e as Error).message}`);
      }
    }
    if (this.current >= this.items.length) this.current = this.items.length - 1;
    if (f) {
      this.watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(vscode.Uri.file(path.dirname(f)), path.basename(f)),
      );
      const reload = () => {
        if (!this.writing) this.load();
      };
      this.watcher.onDidChange(reload);
      this.watcher.onDidCreate(reload);
      this.watcher.onDidDelete(reload);
    }
    vscode.commands.executeCommand('setContext', 'algorave.hasSetList', this.items.length > 0);
    this.emitter.fire(undefined);
  }

  private save() {
    const f = this.file();
    if (!f) {
      vscode.window.showWarningMessage('Open a folder first: the set list is saved as setlist.json in it.');
      return;
    }
    this.writing = true;
    fs.writeFileSync(f, JSON.stringify({ items: this.items }, null, 2) + '\n');
    setTimeout(() => (this.writing = false), 500);
    vscode.commands.executeCommand('setContext', 'algorave.hasSetList', this.items.length > 0);
    this.emitter.fire(undefined);
  }

  add(item: SetItem) {
    this.items.push(item);
    this.save();
  }
  remove(i: number) {
    this.items.splice(i, 1);
    if (this.current >= i) this.current--;
    this.save();
  }
  move(i: number, by: number) {
    const j = i + by;
    if (j < 0 || j >= this.items.length) return;
    [this.items[i], this.items[j]] = [this.items[j], this.items[i]];
    if (this.current === i) this.current = j;
    else if (this.current === j) this.current = i;
    this.save();
  }
  setNote(i: number, note: string) {
    this.items[i].note = note || undefined;
    this.save();
  }
  setCurrent(i: number) {
    this.current = i;
    this.emitter.fire(undefined);
  }

  getChildren(el?: number): number[] {
    return el === undefined ? this.items.map((_, i) => i) : [];
  }

  getTreeItem(i: number): vscode.TreeItem {
    const it = this.items[i];
    const t = new vscode.TreeItem(`${i + 1}. ${itemLabel(it)}`);
    t.description = it.note;
    t.tooltip = new vscode.MarkdownString(`**${itemLabel(it)}**${it.note ? `\n\n${it.note}` : ''}`);
    t.iconPath = new vscode.ThemeIcon(i === this.current ? 'play-circle' : it.file ? 'file-code' : 'music');
    t.contextValue = 'setItem';
    t.command = { command: 'algorave.setlist.go', title: 'Open', arguments: [i] };
    return t;
  }

  dispose() {
    this.watcher?.dispose();
    this.emitter.dispose();
  }
}
