import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { parsePatternsJs, parseTidalSections, StrudelPattern } from './core';

/** Find the kit: the setting, else a workspace folder (or its child) holding patterns.js or tidal/. */
export function findKitFolder(): string | undefined {
  const configured = vscode.workspace.getConfiguration('algorave').get<string>('kitPath', '');
  if (configured) {
    const p = configured.startsWith('~')
      ? path.join(process.env.HOME || process.env.USERPROFILE || '', configured.slice(1))
      : configured;
    return path.isAbsolute(p) ? p : path.join(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '', p);
  }
  const isKit = (dir: string) =>
    fs.existsSync(path.join(dir, 'patterns.js')) || fs.existsSync(path.join(dir, 'tidal', 'BootTidal.hs'));
  for (const f of vscode.workspace.workspaceFolders ?? []) {
    const root = f.uri.fsPath;
    if (isKit(root)) return root;
    try {
      for (const d of fs.readdirSync(root, { withFileTypes: true })) {
        if (d.isDirectory() && !d.name.startsWith('.') && d.name !== 'node_modules' && isKit(path.join(root, d.name))) {
          return path.join(root, d.name);
        }
      }
    } catch {
      /* unreadable folder */
    }
  }
  return undefined;
}

export type KitNode =
  | { kind: 'group'; label: string; children: KitNode[]; icon: string; description?: string }
  | { kind: 'strudel'; pattern: StrudelPattern; index: number }
  | { kind: 'tidalFile'; file: string; children: KitNode[] }
  | { kind: 'tidalSection'; file: string; title: string; line: number }
  | { kind: 'message'; label: string; tooltip?: string };

export class KitTree implements vscode.TreeDataProvider<KitNode>, vscode.Disposable {
  private readonly emitter = new vscode.EventEmitter<KitNode | undefined>();
  readonly onDidChangeTreeData = this.emitter.event;
  private roots: KitNode[] = [];
  private watchers: vscode.Disposable[] = [];
  strudelPatterns: StrudelPattern[] = [];
  kit: string | undefined;

  constructor() {
    this.reload();
  }

  reload() {
    this.watchers.forEach((w) => w.dispose());
    this.watchers = [];
    this.kit = findKitFolder();
    this.strudelPatterns = [];
    this.roots = [];
    vscode.commands.executeCommand('setContext', 'algorave.hasKit', !!this.kit);
    if (!this.kit) {
      this.emitter.fire(undefined);
      return;
    }

    const patternsFile = path.join(this.kit, 'patterns.js');
    if (fs.existsSync(patternsFile)) {
      if (!vscode.workspace.isTrusted) {
        this.roots.push({
          kind: 'message',
          label: 'Trust this workspace to load patterns.js',
          tooltip: 'Loading the kit runs patterns.js, so it needs a trusted workspace.',
        });
      } else {
        try {
          this.strudelPatterns = parsePatternsJs(fs.readFileSync(patternsFile, 'utf8'));
          this.roots.push({
            kind: 'group',
            label: 'Strudel',
            icon: 'symbol-event',
            description: `${this.strudelPatterns.length} patterns`,
            children: this.strudelPatterns.map((p, i) => ({ kind: 'strudel', pattern: p, index: i })),
          });
        } catch (e) {
          this.roots.push({ kind: 'message', label: `patterns.js didn't load: ${(e as Error).message}` });
        }
      }
      this.watch(patternsFile);
    }

    const tidalDir = path.join(this.kit, 'tidal');
    if (fs.existsSync(tidalDir)) {
      const files = fs
        .readdirSync(tidalDir)
        .filter((f) => f.endsWith('.tidal'))
        .sort()
        .map((f) => path.join(tidalDir, f));
      if (files.length) {
        this.roots.push({
          kind: 'group',
          label: 'Tidal',
          icon: 'symbol-namespace',
          description: `${files.length} sets`,
          children: files.map((file) => ({
            kind: 'tidalFile',
            file,
            children: parseTidalSections(fs.readFileSync(file, 'utf8')).map((s) => ({
              kind: 'tidalSection',
              file,
              title: s.title,
              line: s.line,
            })),
          })),
        });
        files.forEach((f) => this.watch(f));
      }
    }
    this.emitter.fire(undefined);
  }

  private watch(file: string) {
    const w = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(vscode.Uri.file(path.dirname(file)), path.basename(file)),
    );
    let t: NodeJS.Timeout | undefined;
    const kick = () => {
      clearTimeout(t);
      t = setTimeout(() => this.reload(), 300);
    };
    w.onDidChange(kick);
    w.onDidCreate(kick);
    w.onDidDelete(kick);
    this.watchers.push(w);
  }

  getChildren(node?: KitNode): KitNode[] {
    if (!node) return this.roots;
    if (node.kind === 'group' || node.kind === 'tidalFile') return node.children;
    return [];
  }

  getTreeItem(node: KitNode): vscode.TreeItem {
    switch (node.kind) {
      case 'group': {
        const t = new vscode.TreeItem(node.label, vscode.TreeItemCollapsibleState.Expanded);
        t.iconPath = new vscode.ThemeIcon(node.icon);
        t.description = node.description;
        return t;
      }
      case 'message': {
        const t = new vscode.TreeItem(node.label);
        t.iconPath = new vscode.ThemeIcon('info');
        t.tooltip = node.tooltip;
        return t;
      }
      case 'strudel': {
        const t = new vscode.TreeItem(node.pattern.name);
        t.description = node.pattern.about;
        t.tooltip = new vscode.MarkdownString(
          `**${node.pattern.name}**\n\n${node.pattern.about}\n\n\`\`\`js\n${node.pattern.code}\n\`\`\``,
        );
        t.contextValue = 'pattern playable';
        t.iconPath = new vscode.ThemeIcon(/hydra|pianoroll|punchcard|scope|visual/i.test(node.pattern.name + node.pattern.code) ? 'eye' : 'music');
        t.command = { command: 'algorave.patterns.open', title: 'Open', arguments: [node] };
        return t;
      }
      case 'tidalFile': {
        const t = new vscode.TreeItem(path.basename(node.file), vscode.TreeItemCollapsibleState.Collapsed);
        t.resourceUri = vscode.Uri.file(node.file);
        t.iconPath = new vscode.ThemeIcon('file-code');
        t.contextValue = 'tidalFile';
        t.command = { command: 'vscode.open', title: 'Open', arguments: [vscode.Uri.file(node.file)] };
        return t;
      }
      case 'tidalSection': {
        const t = new vscode.TreeItem(node.title);
        t.iconPath = new vscode.ThemeIcon('music');
        t.contextValue = 'pattern playable';
        t.tooltip = `${path.basename(node.file)}, line ${node.line + 1}`;
        t.command = { command: 'algorave.patterns.open', title: 'Open', arguments: [node] };
        return t;
      }
    }
  }

  dispose() {
    this.watchers.forEach((w) => w.dispose());
    this.emitter.dispose();
  }
}
