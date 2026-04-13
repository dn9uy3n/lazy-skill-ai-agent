import { contextBridge, ipcRenderer } from 'electron';
import { AppConfig, SkillInfo } from './types';

const api = {
  loadConfig: (): Promise<AppConfig> => ipcRenderer.invoke('config:load'),
  saveConfig: (config: AppConfig): Promise<void> => ipcRenderer.invoke('config:save', config),
  selectDirectory: (title: string): Promise<string | null> =>
    ipcRenderer.invoke('dialog:selectDirectory', title),
  scanSkills: (dirs: string[], projectPath: string | undefined): Promise<SkillInfo[]> =>
    ipcRenderer.invoke('skills:scan', dirs, projectPath),
  applyChanges: (
    allSkills: SkillInfo[],
    selectedIds: string[],
    projectPath: string,
  ): Promise<{ installed: number; removed: number; errors: string[] }> =>
    ipcRenderer.invoke('skills:apply', allSkills, selectedIds, projectPath),
};

contextBridge.exposeInMainWorld('clazyApi', api);

export type ClazyApi = typeof api;
