# Diagnostic-driven repair

Treat CLI diagnostics as the source of truth. Use `range.start.line` and `range.start.character`; never parse message wording when a stable code exists.

| Code family | Repair approach |
|---|---|
| `AF1xx` | Fix syntax at the reported range, then validate again before semantic edits. |
| `AF2xx` | Resolve duplicate IDs or unknown references. Preserve the intended target and update all references when renaming. |
| `AF3xx` | Use a supported property, enum, number, duration, or source version. Consult the language reference. |
| `AF4xx` | Add required action identity or separate conflicting writes into ordered scenes/actions. |
| `AF5xx` | Reduce invalid geometry or repair incomplete graph declarations. |
| `AF6xx` | Migration/import failed. Do not silently omit unsupported source behavior. |
| `AF7xx` | Respect resource, formatter, worker, or tool limits; reduce input or repair the environment. |
| `AFCLI001_USAGE` | Correct the command/flag combination. |
| `AFCLI003_VERSION_MISMATCH` | Re-run with the detected source version or migrate explicitly. |
| `AFCLI004_CAPABILITY_MISMATCH` | Stop approximation and explain the unsupported diagram/feature. |
| `AFCLI005_RESOURCE_LIMIT` | Reduce document size/complexity; do not split away required concepts without user agreement. |

Repair loop:

1. Fix syntax errors first.
2. Fix ID/reference errors second.
3. Fix action/timing errors third.
4. Re-run validation after each category.
5. Format only after validation succeeds.
6. Compile and inspect summary last.

If a repair changes the lesson's meaning, stop and present the exact conflict instead of choosing a new meaning.
