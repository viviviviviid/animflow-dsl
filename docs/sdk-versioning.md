# AnimFlow React SDK versioning

`@animflow/sdk-react` follows semantic versioning from its first public `0.1.0` tarball. During `0.x`, a minor release may intentionally change the public API; patch releases remain backward-compatible bug and security fixes.

## Public contract

The semver surface is limited to exports from the package root:

- `AnimFlowPlayer`
- `AnimFlowPlayerProps`
- `AnimFlowDiagnostic`
- `ANIMFLOW_SDK_VERSION`

The parser AST, `RenderPlan`, worker messages, compiled publish artifact, internal package names, CSS/SVG structure, and storage formats are not public SDK contracts. Consumers must not deep-import `dist/*`; the package export map intentionally exposes only `.`.

## Compatibility policy

- One SDK release bundles one matching language/compiler/runtime/renderer/worker set.
- The worker handshake checks protocol, supported source versions, compiler version, and render-plan version. A mismatch emits `AF703` and stops; it never falls back to main-thread or remote compilation.
- AnimFlow source `2` and `2.1` remain accepted until a documented SDK minor removes one. New source syntax requires an SDK release that advertises it.
- `story` is a single-story assertion in `0.1`; it is not a multi-story selector.
- Published revision artifacts are private to the web viewer and have a separate compatibility gate.

## Release gate

Every SDK change must pass:

1. package tests for SSR placeholder, invalid source diagnostics, worker mismatch, and story assertion;
2. `pnpm pack` inspection for the public manifest, declarations, module, and worker asset;
3. installation into a new non-workspace React project;
4. consumer typecheck, production bundle, SSR test, and real Chromium worker/render smoke test under a self-only CSP;
5. confirmation that the tarball and consumer bundle contain no `@animflow-dsl/*` runtime dependency.

A breaking public type or behavior requires a minor version while `0.x`; a stable `1.x` release will require a major version.
