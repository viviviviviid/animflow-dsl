# CLI discovery and compatibility

Supported hosts: macOS and Linux with Node.js 18 or newer. Windows is supported through WSL until native atomic-write CI is added.

Find the CLI in this order:

1. `$ANIMFLOW_CLI` when the host explicitly provides an executable path.
2. `animflow` on `PATH` for an installed npm package.
3. The npm Skill's bundled `vendor/animflow-cli.js`.
4. From this repository, `node packages/cli/dist/bin.js` after `pnpm build`.

Run:

```text
<skill-directory>/scripts/run-cli.sh version --json
<skill-directory>/scripts/run-cli.sh capabilities --json
```

This Skill requires CLI `0.1.x`, compiler `0.0.x`, source version `2.1`, and flowchart capability. On mismatch, stop with:

```text
AnimFlow authoring compatibility error: this Skill requires CLI 0.1.x with source 2.1 support. Install the matching repository release or select its bundled Skill version.
```

Install the self-contained Skill from npm:

```text
npx --yes animflow-authoring-skill@latest install --agent codex
npx --yes animflow-authoring-skill@latest install --agent claude
```

Use `--agent both` for both hosts and `--scope project` for repository-local discovery. Codex discovery locations are repository `skills/animflow-authoring` or user `$CODEX_HOME/skills/animflow-authoring`. Claude Code discovery is repository `.claude/skills/animflow-authoring` or user `~/.claude/skills/animflow-authoring`.
