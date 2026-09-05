import type { AuthoringCommand, AuthoringResult, HistoryRequest } from "@animflow-dsl/authoring";
import type { AnimFlowCompletion, AnimFlowDefinition, AnimFlowHover } from "@animflow-dsl/language";

import type {
  StudioAuthoringRequest,
  StudioAuthoringResponse,
  StudioAuthoringState,
} from "./authoring-protocol";

interface PendingRequest {
  readonly resolve: (response: Extract<StudioAuthoringResponse, { readonly type: "result" }>) => void;
  readonly reject: (error: Error) => void;
  readonly timer: ReturnType<typeof setTimeout>;
}

type RequestWithoutId<Request> = Request extends unknown ? Omit<Request, "requestId"> : never;

export class StudioAuthoringClient {
  private readonly worker: Worker;
  private readonly pending = new Map<number, PendingRequest>();
  private requestSequence = 0;
  private disposed = false;

  public constructor() {
    this.worker = new Worker(new URL("../workers/authoring.worker.ts", import.meta.url), {
      name: "animflow-authoring",
      type: "module",
    });
    this.worker.onmessage = (event: MessageEvent<StudioAuthoringResponse>) => {
      const pending = this.pending.get(event.data.requestId);
      if (!pending) return;
      this.pending.delete(event.data.requestId);
      clearTimeout(pending.timer);
      if (event.data.type === "error") {
        pending.reject(new Error(event.data.message));
      } else {
        pending.resolve(event.data);
      }
    };
    this.worker.onerror = (event) => this.failAll(event.message || "Authoring worker crashed.");
  }

  public async init(source: string): Promise<StudioAuthoringState> {
    return (await this.send({ type: "init", source })).state;
  }

  public async execute(command: AuthoringCommand): Promise<{ state: StudioAuthoringState; result?: AuthoringResult }> {
    return this.send({ type: "execute", command });
  }

  public async undo(request: HistoryRequest): Promise<{ state: StudioAuthoringState; result?: AuthoringResult }> {
    return this.send({ type: "undo", request });
  }

  public async redo(request: HistoryRequest): Promise<{ state: StudioAuthoringState; result?: AuthoringResult }> {
    return this.send({ type: "redo", request });
  }

  public async select(id?: string): Promise<StudioAuthoringState> {
    return (await this.send({ type: "select", id })).state;
  }

  public async importMermaid(source: string): Promise<{ state: StudioAuthoringState; result?: AuthoringResult }> {
    return this.send({ type: "import-mermaid", source });
  }

  public async format(source: string): Promise<string> {
    const response = await this.send({ type: "format", source });
    if (response.formattedSource === undefined) throw new Error("The formatter returned no source.");
    return response.formattedSource;
  }

  public async complete(
    source: string,
    position: { readonly line: number; readonly character: number },
  ): Promise<readonly AnimFlowCompletion[]> {
    return (await this.send({ type: "complete", source, position })).completions ?? [];
  }

  public async define(
    source: string,
    position: { readonly line: number; readonly character: number },
  ): Promise<readonly AnimFlowDefinition[]> {
    return (await this.send({ type: "define", source, position })).definitions ?? [];
  }

  public async hover(
    source: string,
    position: { readonly line: number; readonly character: number },
  ): Promise<AnimFlowHover | undefined> {
    return (await this.send({ type: "hover", source, position })).hover;
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.worker.terminate();
    this.failAll("Authoring client was disposed.");
  }

  private send(
    request: RequestWithoutId<StudioAuthoringRequest>,
  ): Promise<Extract<StudioAuthoringResponse, { readonly type: "result" }>> {
    if (this.disposed) return Promise.reject(new Error("Authoring client is disposed."));
    const requestId = ++this.requestSequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error("Authoring worker timed out."));
      }, 4_000);
      this.pending.set(requestId, { resolve, reject, timer });
      this.worker.postMessage({ ...request, requestId } as StudioAuthoringRequest);
    });
  }

  private failAll(message: string): void {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error(message));
    }
    this.pending.clear();
  }
}
