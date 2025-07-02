import * as vscode from 'vscode';
import { scan, type Severity } from 'carrot-scan';

export function activate(ctx: vscode.ExtensionContext) {
  const diag = vscode.languages.createDiagnosticCollection('carrot-guard');
  ctx.subscriptions.push(diag);

  const status = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left, 100);
  ctx.subscriptions.push(status);
  status.text = '🥕 ready';
  status.show();

  async function runScan(doc: vscode.TextDocument) {
    if (doc.isUntitled || doc.uri.scheme !== 'file') return;

    const result = await scan(doc.fileName, { mode: 'fast' });
    status.text = `🥕 ${result.score}`;

    const diagnostics: vscode.Diagnostic[] = [];
    for (const r of result.messages ?? []) {
      const range = new vscode.Range(
        (r.line ?? 1) - 1,
        (r.column ?? 1) - 1,
        (r.line ?? 1) - 1,
        (r.column ?? 1)
      );
      diagnostics.push(
        new vscode.Diagnostic(range, r.message, mapSeverity(r.severity as Severity))
      );
    }
    diag.set(doc.uri, diagnostics);
  }

  function mapSeverity(s: Severity): vscode.DiagnosticSeverity {
    return s === 'error'
      ? vscode.DiagnosticSeverity.Error
      : s === 'warning'
      ? vscode.DiagnosticSeverity.Warning
      : vscode.DiagnosticSeverity.Information;
  }

  // scans automatici su apertura / salvataggio
  ctx.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(runScan),
    vscode.workspace.onDidSaveTextDocument(runScan)
  );

  // comandi palette
  ctx.subscriptions.push(
    vscode.commands.registerCommand('carrot-guard.scanFile', () => {
      const doc = vscode.window.activeTextEditor?.document;
      if (doc) runScan(doc);
    }),
    vscode.commands.registerCommand('carrot-guard.scanWorkspace', async () => {
      const ws = vscode.workspace.workspaceFolders?.[0];
      if (!ws) return vscode.window.showErrorMessage('Nessuna workspace aperta');
      vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'Carrot-Guard scan' },
        async () => {
          const res = await scan(ws.uri.fsPath, { mode: 'complete', stream: false });
          vscode.window.showInformationMessage(`Carrot-Guard score: ${res.score} (${res.rating})`);
        });
    })
  );
}

export function deactivate() {}