"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const carrot_scan_1 = require("carrot-scan");
function activate(ctx) {
    const diag = vscode.languages.createDiagnosticCollection('carrot-guard');
    ctx.subscriptions.push(diag);
    const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    ctx.subscriptions.push(status);
    status.text = '🥕 ready';
    status.show();
    async function runScan(doc) {
        if (doc.isUntitled || doc.uri.scheme !== 'file')
            return;
        const result = await (0, carrot_scan_1.scan)(doc.fileName, { mode: 'fast' });
        status.text = `🥕 ${result.score}`;
        const diagnostics = [];
        for (const r of result.messages ?? []) {
            const range = new vscode.Range((r.line ?? 1) - 1, (r.column ?? 1) - 1, (r.line ?? 1) - 1, (r.column ?? 1));
            diagnostics.push(new vscode.Diagnostic(range, r.message, mapSeverity(r.severity)));
        }
        diag.set(doc.uri, diagnostics);
    }
    function mapSeverity(s) {
        return s === 'error'
            ? vscode.DiagnosticSeverity.Error
            : s === 'warning'
                ? vscode.DiagnosticSeverity.Warning
                : vscode.DiagnosticSeverity.Information;
    }
    // scans automatici su apertura / salvataggio
    ctx.subscriptions.push(vscode.workspace.onDidOpenTextDocument(runScan), vscode.workspace.onDidSaveTextDocument(runScan));
    // comandi palette
    ctx.subscriptions.push(vscode.commands.registerCommand('carrot-guard.scanFile', () => {
        const doc = vscode.window.activeTextEditor?.document;
        if (doc)
            runScan(doc);
    }), vscode.commands.registerCommand('carrot-guard.scanWorkspace', async () => {
        const ws = vscode.workspace.workspaceFolders?.[0];
        if (!ws)
            return vscode.window.showErrorMessage('Nessuna workspace aperta');
        vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Carrot-Guard scan' }, async () => {
            const res = await (0, carrot_scan_1.scan)(ws.uri.fsPath, { mode: 'complete', stream: false });
            vscode.window.showInformationMessage(`Carrot-Guard score: ${res.score} (${res.rating})`);
        });
    }));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map