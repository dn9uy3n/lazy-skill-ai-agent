import * as vscode from 'vscode';
import { ClazySkillPanel } from './webviewPanel';

export function activate(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand('clazy-skill.openManager', () => {
    ClazySkillPanel.createOrShow(context.extensionUri);
  });

  context.subscriptions.push(command);
}

export function deactivate() {
  // nothing to clean up
}
