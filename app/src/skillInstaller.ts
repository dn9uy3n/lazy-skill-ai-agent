import * as fs from 'fs/promises';
import * as path from 'path';
import { SkillInfo } from './types';

function getSkillsDir(projectPath: string): string {
  return path.join(projectPath, '.claude', 'skills');
}

/**
 * Copy the entire skill source directory into the project's .claude/skills/ folder.
 */
export async function installSkill(skill: SkillInfo, projectPath: string): Promise<void> {
  const skillsDir = getSkillsDir(projectPath);
  await fs.mkdir(skillsDir, { recursive: true });

  const sourceDir = path.dirname(skill.sourcePath);
  const targetDir = path.join(skillsDir, skill.name);

  // Remove existing target if present (overwrite behavior)
  await fs.rm(targetDir, { recursive: true, force: true });

  await fs.cp(sourceDir, targetDir, { recursive: true });
}

export async function uninstallSkill(skillName: string, projectPath: string): Promise<void> {
  const targetDir = path.join(getSkillsDir(projectPath), skillName);
  await fs.rm(targetDir, { recursive: true, force: true });
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
