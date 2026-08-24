import type { CSSProperties, ReactNode } from "react";

export interface AnimFlowDiagnostic {
  readonly code: string;
  readonly severity: "error" | "warning";
  readonly message: string;
  readonly range: {
    readonly start: { readonly offset: number; readonly line: number; readonly character: number };
    readonly end: { readonly offset: number; readonly line: number; readonly character: number };
  };
  readonly related?: readonly {
    readonly message: string;
    readonly range: AnimFlowDiagnostic["range"];
  }[];
  readonly fixes?: readonly {
    readonly title: string;
    readonly edits: readonly {
      readonly range: AnimFlowDiagnostic["range"];
      readonly newText: string;
    }[];
  }[];
}

export interface AnimFlowPlayerProps {
  /** Native AnimFlow 2.2 source. AnimFlow 2 and 2.1 remain compatibility inputs. */
  readonly source: string;
  /** Optional assertion for the source's single story ID. */
  readonly story?: string;
  /** Shows deterministic transport controls. Defaults to true. */
  readonly controls?: boolean;
  readonly ariaLabel?: string;
  readonly className?: string;
  readonly style?: CSSProperties;
  /** Self-hosted override for the worker asset. Defaults to the worker shipped beside the SDK module. */
  readonly workerUrl?: string | URL;
  readonly ssrPlaceholder?: ReactNode;
  readonly onDiagnostic?: (diagnostic: AnimFlowDiagnostic) => void;
  readonly onReady?: (metadata: { readonly storyId: string; readonly durationMs: number; readonly sourceHash: string }) => void;
}
