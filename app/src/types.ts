export interface SkillInfo {
  id: string;
  name: string;
  description: string;
  sourcePath: string;
  sourceDir: string;
  format: 'command' | 'skill';
  isInstalled: boolean;
  body: string;
}

export type TargetPlatform = 'claude-code' | 'antigravity';

export interface AppConfig {
  skillDirectories: string[];
  lastProjectPath?: string;
  platform: TargetPlatform;
}
