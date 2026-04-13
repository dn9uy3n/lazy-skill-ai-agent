import * as vscode from 'vscode';
import * as path from 'path';
import { SkillInfo } from './types';

function getSkillsDir(projectPath: string): string {
  return path.join(projectPath, '.claude', 'skills');
}

async function ensureDir(dirPath: string): Promise<void> {
  try {
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));
  } catch {
    // already exists
  }
}

/**
 * Copy the entire skill source directory into the project's .claude/skills/ folder.
 */
export async function installSkill(skill: SkillInfo, projectPath: string): Promise<void> {
  const skillsDir = getSkillsDir(projectPath);
  await ensureDir(skillsDir);

  const sourceDir = path.dirname(skill.sourcePath);
  const targetDir = path.join(skillsDir, skill.name);

  // Remove existing target if present (overwrite behavior)
  try {
    await vscode.workspace.fs.delete(vscode.Uri.file(targetDir), {
      recursive: true,
      useTrash: false,
    });
  } catch {
    // not present
  }

  await vscode.workspace.fs.copy(
    vscode.Uri.file(sourceDir),
    vscode.Uri.file(targetDir),
    { overwrite: true },
  );
}

export async function uninstallSkill(skillName: string, projectPath: string): Promise<void> {
  const targetDir = path.join(getSkillsDir(projectPath), skillName);
  try {
    await vscode.workspace.fs.delete(vscode.Uri.file(targetDir), {
      recursive: true,
      useTrash: false,
    });
  } catch {
    // doesn't exist, ignore
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
