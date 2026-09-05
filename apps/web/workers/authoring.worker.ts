/// <reference lib="webworker" />

import { AuthoringSession } from "@animflow-dsl/authoring";
import { completeAnimFlow, defineAnimFlow, formatAnimFlow, hoverAnimFlow } from "@animflow-dsl/language";
import { importMermaidFlowchart } from "@animflow-dsl/migrate";

import type {
  StudioAuthoringRequest,
  StudioAuthoringResponse,
  StudioAuthoringState,
} from "../lib/authoring-protocol";

const scope = self as unknown as DedicatedWorkerGlobalScope;
let session: AuthoringSession | undefined;
let requestQueue = Promise.resolve();

scope.onmessage = (event: MessageEvent<StudioAuthoringRequest>) => {
  requestQueue = requestQueue.then(
    () => handle(event.data),
    () => handle(event.data),
  );
};

async function handle(request: StudioAuthoringRequest): Promise<void> {
  try {
    if (request.type === "init") {
      session = await AuthoringSession.create(request.source);
      respond({ type: "result", requestId: request.requestId, state: snapshot(session) });
      return;
    }
    if (!session) throw new Error("Authoring session is not initialized.");

    if (request.type === "format") {
      const formatted = await formatAnimFlow(request.source);
      if (!formatted.ok) {
        respond({ type: "error", requestId: request.requestId, message: formatted.diagnostics[0].message, diagnostics: formatted.diagnostics });
      } else {
        respond({ type: "result", requestId: request.requestId, state: snapshot(session), formattedSource: formatted.value.source });
      }
      return;
    }

    if (request.type === "complete") {
      const completions = await completeAnimFlow(request.source, request.position);
      respond({ type: "result", requestId: request.requestId, state: snapshot(session), completions });
      return;
    }
    if (request.type === "define") {
      const definitions = await defineAnimFlow(request.source, request.position);
      respond({ type: "result", requestId: request.requestId, state: snapshot(session), definitions });
      return;
    }
    if (request.type === "hover") {
      const hover = await hoverAnimFlow(request.source, request.position);
      respond({
        type: "result",
        requestId: request.requestId,
        state: snapshot(session),
        ...(hover ? { hover } : {}),
      });
      return;
    }

    if (request.type === "select") {
      await session.select(request.id);
      respond({ type: "result", requestId: request.requestId, state: snapshot(session) });
      return;
    }
    if (request.type === "import-mermaid") {
      const imported = await importMermaidFlowchart(request.source);
      if (!imported.ok) {
        respond({
          type: "error",
          requestId: request.requestId,
          message: imported.diagnostics[0].message,
          diagnostics: imported.diagnostics,
        });
        return;
      }
      const result = await session.execute({
        type: "source.replace",
        baseRevision: session.state.documentRevision,
        source: imported.value.source,
      });
      respond({ type: "result", requestId: request.requestId, state: snapshot(session), result });
      return;
    }

    const result = request.type === "execute"
      ? await session.execute(request.command)
      : request.type === "undo"
        ? await session.undo(request.request)
        : await session.redo(request.request);
    respond({ type: "result", requestId: request.requestId, state: snapshot(session), result });
  } catch (error) {
    respond({
      type: "error",
      requestId: request.requestId,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function snapshot(current: AuthoringSession): StudioAuthoringState {
  const state = current.state;
  return {
    source: state.source,
    documentRevision: state.documentRevision,
    planRevision: state.planRevision,
    lastValidPlanRevision: state.lastValidPlanRevision,
    diagnostics: state.diagnostics,
    selection: state.selection,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
  };
}

function respond(message: StudioAuthoringResponse): void {
  scope.postMessage(message);
}
