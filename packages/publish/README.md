# @animflow-dsl/publish

Private server package for immutable AnimFlow public revisions.

It formats and compiles untrusted source in a fresh `worker_threads` worker, enforces a 2-second wall timeout with a process-wide concurrency/queue gate, signs the canonical artifact with SHA-256, and stores it through a create-only `PublishStore`.

The included `FilePublishStore` is for a Node deployment with a persistent volume. It never overwrites a revision, keeps deletion tokens as hashes, persists anonymous rate-limit buckets with file locks, and removes expired revisions opportunistically. Do not point it at an ephemeral or publicly served directory.

The web application is the supported integration boundary. This package is private because the published artifact is a versioned viewer contract, not the public SDK.
