# @animflow/sdk-react

The public React façade for AnimFlow 2/2.1 lecture diagrams. It ships a compatible parser, compiler, deterministic runtime, SVG renderer, and browser worker as one versioned package. It performs no remote requests and does not execute raw HTML, CSS, or JavaScript from source.

```tsx
import { AnimFlowPlayer } from "@animflow/sdk-react";

export function Lesson({ source }: { source: string }) {
  return (
    <AnimFlowPlayer
      source={source}
      story="main"
      controls
      onDiagnostic={(diagnostic) => console.warn(diagnostic.code, diagnostic.message)}
      style={{ aspectRatio: "16 / 9" }}
    />
  );
}
```

## Contract

- `source` accepts native AnimFlow 2 or 2.1 source and is compiled off the main thread.
- Version 0.1 accepts exactly one story. `story` is an assertion, not a selector; a mismatch renders an error and calls `onDiagnostic`.
- The default render is deterministic and contains no network access beyond loading `worker.js` from beside the installed SDK module.
- `controls={false}` hides transport UI without changing playback semantics.
- SSR emits a stable placeholder. Compilation begins after hydration; use `ssrPlaceholder` to replace its content.
- `workerUrl` lets a host copy the shipped worker to a CSP-approved self-hosted URL. The worker must remain from the exact same SDK version or the protocol handshake stops playback.
- `onReady` returns only stable story/duration/source-hash metadata. Internal AST and compiled artifact types are intentionally private.

For strict CSP, permit scripts and workers from the SDK's self-hosted origin. AnimFlow needs no `unsafe-eval`, remote `connect-src`, raw HTML, or data URL.
