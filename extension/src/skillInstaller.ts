import * as vscode from 'vscode';
import * as path from 'path';
import { SkillInfo } from './types';

function getCommandsDir(projectPath: string): string {
  return path.join(projectPath, '.claude', 'commands');
}

async function ensureDir(dirPath: string): Promise<void> {
  try {
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));
  } catch {
    // already exists
  }
}

export async function installSkill(skill: SkillInfo, projectPath: string): Promise<void> {
  const commandsDir = getCommandsDir(projectPath);
  await ensureDir(commandsDir);

  const sourceUri = vscode.Uri.file(skill.sourcePath);
  const targetUri = vscode.Uri.file(path.join(commandsDir, `${skill.name}.md`));

  await vscode.workspace.fs.copy(sourceUri, targetUri, { overwrite: true });
}

export async function uninstallSkill(skillName: string, projectPath: string): Promise<void> {
  const targetUri = vscode.Uri.file(path.join(getCommandsDir(projectPath), `${skillName}.md`));
  try {
    await vscode.workspace.fs.delete(targetUri);
  } catch {
    // file doesn't exist, ignore
  }
}

export interface ApplyResult {
  installed: number;
  removed: number;
  errors: string[];
}

export async function applyChanges(
  allSkills: SkillInfo[],
  selectedIds: Set<string>,
  projectPath: string,
): Promise<ApplyResult> {
  const result: ApplyResult = { installed: 0, removed: 0, errors: [] };

  for (const skill of allSkills) {
    const shouldBeInstalled = selectedIds.has(skill.id);

    if (shouldBeInstalled && !skill.isInstalled) {
      try {
        await installSkill(skill, projectPath);
        result.installed++;
      } catch (e) {
        result.errors.push(`Failed to install ${skill.name}: ${e}`);
      }
    } else if (!shouldBeInstalled && skill.isInstalled) {
      try {
        await uninstallSkill(skill.name, projectPath);
        result.removed++;
      } catch (e) {
        result.errors.push(`Failed to remove ${skill.name}: ${e}`);
      }
    }
  }

  return result;
}
