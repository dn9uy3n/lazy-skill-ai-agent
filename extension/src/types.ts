export interface SkillInfo {
  /** Unique identifier: sourceDir basename + skill name */
  id: string;
  /** Skill name from frontmatter */
  name: string;
  /** Description from frontmatter */
  description: string;
  /** Full path to the source .md file */
  sourcePath: string;
  /** Which configured directory this came from */
  sourceDir: string;
  /** Whether it is from commands or skills directory */
  format: 'command' | 'skill';
  /** Whether this skill is currently installed in the project */
  isInstalled: boolean;
  /** Full body content (after frontmatter) for detail view */
  body: string;
}

export type TargetPlatform = 'claude-code' | 'antigravity';

/** Messages sent from webview to extension */
export type WebviewMessage =
  | { command: 'ready' }
  | { command: 'apply'; skillIds: string[] }
  | { command: 'changePlatform'; platform: TargetPlatform }
  | { command: 'addDirectory' }
  | { command: 'removeDirectory'; directory: string };

/** Messages sent from extension to webview */
export type ExtensionMessage =
  | { command: 'update'; skills: SkillInfo[]; directories: string[]; platform: TargetPlatform }
  | { command: 'applyResult'; installed: number; removed: number; errors: string[] };
