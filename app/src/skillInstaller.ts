import * as fs from 'fs/promises';
import * as path from 'path';
import { SkillInfo } from './types';

function getCommandsDir(projectPath: string): string {
  return path.join(projectPath, '.claude', 'commands');
}

export async function installSkill(skill: SkillInfo, projectPath: string): Promise<void> {
  const commandsDir = getCommandsDir(projectPath);
  await fs.mkdir(commandsDir, { recursive: true });
  const target = path.join(commandsDir, `${skill.name}.md`);
  await fs.copyFile(skill.sourcePath, target);
}

export async function uninstallSkill(skillName: string, projectPath: string): Promise<void> {
  const target = path.join(getCommandsDir(projectPath), `${skillName}.md`);
  try {
    await fs.unlink(target);
  } catch {
    // not found, ignore
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
    const shouldInstall = selectedIds.has(skill.id);

    if (shouldInstall && !skill.isInstalled) {
      try {
        await installSkill(skill, projectPath);
        result.installed++;
      } catch (e) {
        result.errors.push(`Failed to install ${skill.name}: ${e}`);
      }
    } else if (!shouldInstall && skill.isInstalled) {
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
