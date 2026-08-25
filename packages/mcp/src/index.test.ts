import assert from "node:assert/strict";
import test from "node:test";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import type { AnimFlowProject, AnimFlowProjectRepository } from "./index.js";
import { createAnimFlowMcpServer } from "./index.js";

test("lists and calls the narrow authenticated project tools", async () => {
  let project: AnimFlowProject = {
    currentRevision: 3,
    documentId: "request-path",
    source: "animflow 2.2",
    title: "Request path",
    updatedAt: "2026-08-25T00:00:00.000Z",
    version: 7,
  };
  const repository: AnimFlowProjectRepository = {
    async get(documentId) { return documentId === project.documentId ? project : null; },
    async list() { const { source: _source, ...summary } = project; return [summary]; },
    async save(input) {
      if (input.expectedVersion !== project.version) throw new Error("Version conflict");
      project = { ...project, source: input.source, title: input.title, version: project.version + 1 };
      return project;
    },
  };
  const server = createAnimFlowMcpServer({ repository });
  const client = new Client({ name: "animflow-test", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    const tools = await client.listTools();
    assert.deepEqual(tools.tools.map((tool) => tool.name), [
      "animflow_capabilities",
      "animflow_list_projects",
      "animflow_get_project",
      "animflow_put_project",
    ]);
    const listed = await client.callTool({ name: "animflow_list_projects", arguments: {} });
    assert.equal(listed.isError, undefined);
    assert.match(JSON.stringify(listed.structuredContent), /request-path/);

    const conflict = await client.callTool({
      name: "animflow_put_project",
      arguments: { documentId: project.documentId, expectedVersion: 6, source: project.source, title: project.title },
    });
    assert.equal(conflict.isError, true);
    assert.match(JSON.stringify(conflict.content), /Version conflict/);
  } finally {
    await client.close();
    await server.close();
  }
});

test("inspects candidate source before a write", async () => {
  const repository: AnimFlowProjectRepository = {
    async get() { return null; },
    async list() { return []; },
    async save() { throw new Error("not used"); },
  };
  const server = createAnimFlowMcpServer({
    repository,
    async inspectSource(source) {
      return {
        durationMs: 3_000,
        elementCount: 2,
        findings: [],
        narrationCues: [{ durationMs: 3_000, estimatedSpeechMs: 2_000, sceneId: "intro", startMs: 0, text: "Start here." }],
        ok: source.startsWith("animflow 2.2"),
        sceneCount: 1,
      };
    },
  });
  const client = new Client({ name: "animflow-inspection-test", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    const tools = await client.listTools();
    assert.ok(tools.tools.some((tool) => tool.name === "animflow_inspect_source"));
    const result = await client.callTool({ name: "animflow_inspect_source", arguments: { source: "animflow 2.2" } });
    assert.equal(result.isError, undefined);
    assert.match(JSON.stringify(result.structuredContent), /estimatedSpeechMs/);
  } finally {
    await client.close();
    await server.close();
  }
});
