# AnimFlow Authoring Skill

Install a self-contained AnimFlow 2.2 authoring skill for Codex or Claude Code. The package includes the matching `animflow` CLI, language references, diagnostics, lecture patterns, and validated examples.

## One-command install

```bash
npx --yes animflow-authoring-skill@latest install --agent codex
```

Claude Code or both agents:

```bash
npx --yes animflow-authoring-skill@latest install --agent claude
npx --yes animflow-authoring-skill@latest install --agent both
```

User installation is the default. For a repository-local skill:

```bash
npx --yes animflow-authoring-skill@latest install --agent both --scope project
```

The installer refuses to overwrite an existing skill. Use `--force` to replace it while preserving the old directory as a timestamped backup. Use `--dry-run` and `--json` for automated agent workflows.

## Global commands

Installing the package globally exposes both the skill installer and the matching CLI:

```bash
npm install --global animflow-authoring-skill
animflow-skill install --agent codex
animflow version --json
```

Restart the agent after installation so it discovers `animflow-authoring`.

## Supported hosts

macOS and Linux require Node.js 18 or newer. Windows is supported through WSL.
