import * as vscode from 'vscode';
import { LazySkillPanel } from './webviewPanel';

export function activate(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand('lazy-skill.openManager', () => {
    LazySkillPanel.createOrShow(context.extensionUri);
  });

  context.subscriptions.push(command);
}

export function deactivate() {
  // nothing to clean up
}
