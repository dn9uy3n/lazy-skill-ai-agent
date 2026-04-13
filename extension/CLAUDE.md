# Clazy Skill AI Agent

VS Code extension to manage AI skills for Claude Code and Antigravity.

## Project Structure

- `src/extension.ts` - Extension entry point
- `src/types.ts` - Shared TypeScript types
- `src/skillScanner.ts` - Scans directories for skill .md files, parses frontmatter
- `src/skillInstaller.ts` - Copies/removes skill files to/from project `.claude/commands/`
- `src/webviewPanel.ts` - Webview panel controller with HTML generation
- `media/main.js` - Webview frontend logic
- `media/main.css` - Webview styles (VS Code theme-aware)

## Build

```bash
npm run compile   # TypeScript -> out/
npm run watch     # Watch mode
npm run package   # Build .vsix
```

## Conventions

- No external runtime dependencies. Only `@types/vscode` and `typescript` as dev deps.
- Use `vscode.workspace.fs` for all file operations (not Node.js fs).
- Frontmatter parsing is regex-based (no yaml library).
- All styles use `--vscode-*` CSS variables for theme compatibility.
- Target: `{project}/.claude/commands/{skill-name}.md` for both Claude Code and Antigravity.

## Testing

Press F5 in VS Code to launch Extension Development Host. Run command "Clazy: Open Skill Manager".
