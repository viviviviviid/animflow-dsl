import type { StudioExample } from "./studio-examples";

export const COMPLEX_STUDIO_EXAMPLES: readonly StudioExample[] = [
  {
    id: "rag-grounded-answer",
    title: "RAG grounded answer pipeline",
    category: "AI systems",
    description: "Trace hybrid retrieval branches, reranking, generation, and a guarded cited answer.",
    source: `animflow 2.1

canvas {
  size 1600 by 900
  theme signalDesk
  background surface
}

graph ragPipeline {
  layout flow right {
    nodeGap 46
    rankGap 92
    routing curve
  }

  node question "User question" {
    shape rounded
    tone hex_2F6FED
  }

  node rewriter "Query rewriter" {
    shape parallelogram
    tone hex_7457D9
  }

  node vectorStore "Vector store" {
    shape database
    tone hex_138A72
  }

  node keywordIndex "Keyword index" {
    shape database
    tone hex_2F6FED
  }

  node reranker "Reranker" {
    shape diamond
    tone hex_D97732
  }

  node model "Language model" {
    shape rounded
    tone hex_7457D9
  }

  node guardrail "Grounding check" {
    shape diamond
    tone hex_D97732
  }

  node answer "Cited answer" {
    shape document
    tone hex_138A72
  }

  edge rewriteQuery: question.e -> rewriter.w {
    label "Rewrite intent"
    line solid 2
    arrow end
    tone hex_2F6FED
    routing curve
    flow particles
  }

  edge retrieveDocs: rewriter.e -> vectorStore.w {
    label "Semantic search"
    line dashed 2
    arrow end
    tone hex_138A72
    routing curve
    flow dash
  }

  edge retrieveTerms: rewriter.e -> keywordIndex.w {
    label "Keyword search"
    line dashed 2
    arrow end
    tone hex_2F6FED
    routing curve
    flow dash
  }

  edge rankCandidates: vectorStore.e -> reranker.w {
    label "Top candidates"
    line solid 2
    arrow end
    tone hex_D97732
    routing curve
    flow wave
  }

  edge rankKeywords: keywordIndex.e -> reranker.w {
    label "Exact matches"
    line solid 2
    arrow end
    tone hex_2F6FED
    routing curve
    flow wave
  }

  edge groundPrompt: reranker.e -> model.w {
    label "Context + citations"
    line solid 2
    arrow end
    tone hex_7457D9
    routing curve
    flow particles
  }

  edge inspectDraft: model.e -> guardrail.w {
    label "Draft answer"
    line dashed 2
    arrow end
    tone hex_D97732
    routing curve
    flow dash
  }

  edge releaseAnswer: guardrail.e -> answer.w {
    label "Verified claims"
    line solid 2
    arrow end
    tone hex_138A72
    routing curve
    flow glow
  }
}

overlay groundingRule: callout {
  anchor guardrail.s
  text "Every important claim must point back to retrieved evidence."
  width 360
  tone hex_D97732
}

story ragStory {
  initial {
    hide ragPipeline.*
    hide groundingRule
    camera fit(ragPipeline) padding 72
  }

  scene ragActors "Reveal the retrieval system" duration 2600ms {
    action revealRagActors: stagger 240ms {
      action showQuestion: show question via slide(from: left, distance: 64)
      action showRewriter: show rewriter via pop
      action showVectorStore: show vectorStore via pop
      action showKeywordIndex: show keywordIndex via pop
      action showReranker: show reranker via pop
      action showModel: show model via pop
      action showGuardrail: show guardrail via pop
      action showAnswer: show answer via slide(from: right, distance: 64)
    }
    say "A grounded answer is a branching retrieval graph, not a single model call."
  }

  scene ragRewrite "Rewrite the question" duration 1900ms {
    action revealRewrite: show rewriteQuery via fade
    action drawRewrite: draw rewriteQuery via trace flow particles
    action focusRewriter: highlight rewriter tone hex_7457D9 effect pulse
    say "The rewriter converts conversational intent into a searchable query."
  }

  scene ragRetrieve "Retrieve evidence" duration 2200ms {
    action clearRewriter: clearHighlight rewriter
    action revealRetrieve: show retrieveDocs via fade
    action drawRetrieve: draw retrieveDocs via trace flow dash
    action revealTerms: show retrieveTerms via fade
    action drawTerms: draw retrieveTerms via trace flow dash
    action focusStore: highlight vectorStore tone hex_138A72 effect glow
    action focusKeywordIndex: highlight keywordIndex tone hex_2F6FED effect pulse
    say "Semantic and keyword retrieval run in parallel so meaning and exact terms both survive."
  }

  scene ragRank "Rerank the context" duration 2100ms {
    action clearStore: clearHighlight vectorStore
    action clearKeywordIndex: clearHighlight keywordIndex
    action revealRank: show rankCandidates via fade
    action drawRank: draw rankCandidates via trace flow wave
    action revealKeywordRank: show rankKeywords via fade
    action drawKeywordRank: draw rankKeywords via trace flow wave
    action focusReranker: highlight reranker tone hex_D97732 effect pulse
    say "Both retrieval branches converge at the reranker, which keeps the most useful context."
  }

  scene ragGenerate "Generate with citations" duration 2200ms {
    action clearReranker: clearHighlight reranker
    action revealGroundPrompt: show groundPrompt via fade
    action drawGroundPrompt: draw groundPrompt via trace flow particles
    action focusModel: highlight model tone hex_7457D9 effect glow
    say "The model receives both the selected passages and their citation identities."
  }

  scene ragCheck "Check every claim" duration 2400ms {
    action moveToGuardrail: sequence {
      action clearModel: clearHighlight model
      action revealInspect: show inspectDraft via fade
      action drawInspect: draw inspectDraft via trace flow dash
      action focusGuardrail: highlight guardrail tone hex_D97732 effect pulse
      action showGroundingRule: show groundingRule via pop
    }
    say "A grounding check rejects unsupported claims before the answer leaves the system."
  }

  scene ragAnswer "Release the grounded answer" duration 2000ms {
    action hideGroundingRule: hide groundingRule via fade
    action revealRelease: show releaseAnswer via fade
    action drawRelease: draw releaseAnswer via trace flow glow
    action focusAnswer: highlight answer tone hex_138A72 effect glow
    action frameResult: camera focus(answer) padding 120
    say "Only verified claims and their citations become the final answer."
  }
}
`,
  },
  {
    id: "multi-agent-research",
    title: "Multi-agent research room",
    category: "AI systems",
    description: "Coordinate planning, parallel research, critical review, and a final teaching brief.",
    source: `animflow 2.1

canvas {
  size 1600 by 900
  theme signalDesk
  background surface
}

graph researchRoom {
  layout flow right {
    nodeGap 44
    rankGap 88
    routing orthogonal
  }

  node brief "Research brief" {
    shape document
    tone hex_2F6FED
  }

  node planner "Planner agent" {
    shape diamond
    tone hex_7457D9
  }

  node webResearcher "Web researcher" {
    shape rounded
    tone hex_138A72
  }

  node dataAnalyst "Data analyst" {
    shape rounded
    tone hex_2F6FED
  }

  node sourceLibrary "Source library" {
    shape database
    tone hex_138A72
  }

  node critic "Critic agent" {
    shape diamond
    tone hex_D97732
  }

  node writer "Writer agent" {
    shape parallelogram
    tone hex_7457D9
  }

  node report "Teaching brief" {
    shape document
    tone hex_138A72
  }

  edge decompose: brief.e -> planner.w {
    label "Decompose"
    line solid 2
    arrow end
    tone hex_7457D9
    routing orthogonal
  }

  edge assignWeb: planner.e -> webResearcher.w {
    label "Sources task"
    line solid 2
    arrow end
    tone hex_138A72
    routing curve
    flow particles
  }

  edge assignData: planner.e -> dataAnalyst.w {
    label "Evidence task"
    line solid 2
    arrow end
    tone hex_2F6FED
    routing curve
    flow particles
  }

  edge collectWeb: webResearcher.e -> sourceLibrary.w {
    label "Primary sources"
    line dashed 2
    arrow end
    tone hex_138A72
    routing orthogonal
    flow dash
  }

  edge collectData: dataAnalyst.e -> sourceLibrary.w {
    label "Computed findings"
    line dashed 2
    arrow end
    tone hex_2F6FED
    routing orthogonal
    flow dash
  }

  edge challenge: sourceLibrary.e -> critic.w {
    label "Challenge evidence"
    line solid 2
    arrow end
    tone hex_D97732
    routing orthogonal
    flow wave
  }

  edge revise: critic.e -> writer.w {
    label "Verified outline"
    line solid 2
    arrow end
    tone hex_7457D9
    routing orthogonal
  }

  edge deliver: writer.e -> report.w {
    label "Synthesize"
    line solid 2
    arrow end
    tone hex_138A72
    routing orthogonal
    flow glow
  }
}

overlay parallelNote: badge {
  anchor planner.s
  text "Parallel research, shared evidence, one accountable writer"
  width 400
  tone hex_7457D9
}

story researchStory {
  initial {
    hide researchRoom.*
    hide parallelNote
    camera fit(researchRoom) padding 64
  }

  scene researchTeam "Assemble the research room" duration 2800ms {
    action revealResearchTeam: stagger 210ms {
      action showBrief: show brief via slide(from: left, distance: 54)
      action showPlanner: show planner via pop
      action showWebResearcher: show webResearcher via pop
      action showDataAnalyst: show dataAnalyst via pop
      action showLibrary: show sourceLibrary via pop
      action showCritic: show critic via pop
      action showWriter: show writer via pop
      action showReport: show report via slide(from: right, distance: 54)
    }
    say "A multi-agent workflow separates responsibilities without losing a shared objective."
  }

  scene researchPlan "Decompose the brief" duration 1900ms {
    action revealDecompose: show decompose via fade
    action drawDecompose: draw decompose via trace flow particles
    action focusPlanner: highlight planner tone hex_7457D9 effect pulse
    action revealParallelRule: show parallelNote via pop
    say "The planner turns one vague request into independent, verifiable work packages."
  }

  scene researchParallel "Research in parallel" duration 2600ms {
    action dispatchResearch: stagger 260ms {
      action clearPlanner: clearHighlight planner
      action showAssignWeb: show assignWeb via fade
      action traceAssignWeb: draw assignWeb via trace flow particles
      action showAssignData: show assignData via fade
      action traceAssignData: draw assignData via trace flow particles
    }
    say "Researchers work concurrently, but each task has a distinct evidence contract."
  }

  scene researchEvidence "Merge evidence" duration 2300ms {
    action gatherEvidence: sequence {
      action showCollectWeb: show collectWeb via fade
      action traceCollectWeb: draw collectWeb via trace flow dash
      action showCollectData: show collectData via fade
      action traceCollectData: draw collectData via trace flow dash
      action focusLibrary: highlight sourceLibrary tone hex_138A72 effect glow
    }
    say "Primary sources and computed findings meet in one traceable evidence set."
  }

  scene researchCritique "Run an adversarial review" duration 2100ms {
    action clearLibrary: clearHighlight sourceLibrary
    action revealChallenge: show challenge via fade
    action drawChallenge: draw challenge via trace flow wave
    action focusCritic: highlight critic tone hex_D97732 effect pulse
    say "The critic looks for missing evidence, contradictions, and claims that exceed the sources."
  }

  scene researchWrite "Synthesize the lesson" duration 2300ms {
    action passReview: sequence {
      action clearCritic: clearHighlight critic
      action revealRevise: show revise via fade
      action drawRevise: draw revise via trace
      action focusWriter: highlight writer tone hex_7457D9 effect glow
    }
    say "The writer receives a verified outline instead of an unfiltered pile of notes."
  }

  scene researchDeliver "Deliver with provenance" duration 2100ms {
    action hideParallelNote: hide parallelNote via fade
    action revealDeliver: show deliver via fade
    action drawDeliver: draw deliver via trace flow glow
    action focusReport: highlight report tone hex_138A72 effect glow
    action frameReport: camera focus(report) padding 116
    say "The final brief preserves the reasoning path and the evidence behind every conclusion."
  }
}
`,
  },
  {
    id: "kubernetes-rolling-release",
    title: "Kubernetes rolling release",
    category: "Infrastructure",
    description: "Explain image delivery, replica replacement, health gates, and zero-downtime traffic.",
    source: `animflow 2.1

canvas {
  size 1600 by 900
  theme signalDesk
  background surface
}

graph rollingRelease {
  layout flow right {
    nodeGap 42
    rankGap 86
    routing orthogonal
  }

  node developer "Developer" {
    shape rounded
    tone hex_2F6FED
  }

  node registry "Image registry" {
    shape database
    tone hex_7457D9
  }

  node controller "Deployment controller" {
    shape diamond
    tone hex_D97732
  }

  node oldPods "Old replica set" {
    shape rounded
    tone hex_687589
  }

  node newPods "New replica set" {
    shape rounded
    tone hex_138A72
  }

  node healthGate "Readiness probe" {
    shape diamond
    tone hex_D97732
  }

  node service "Stable service" {
    shape pill
    tone hex_2F6FED
  }

  node traffic "User traffic" {
    shape parallelogram
    tone hex_138A72
  }

  edge pushImage: developer.e -> registry.w {
    label "Push v2 image"
    line solid 2
    arrow end
    tone hex_7457D9
    routing orthogonal
    flow particles
  }

  edge updateSpec: registry.e -> controller.w {
    label "Update desired state"
    line solid 2
    arrow end
    tone hex_D97732
    routing orthogonal
  }

  edge createReplica: controller.e -> newPods.w {
    label "Create gradually"
    line solid 2
    arrow end
    tone hex_138A72
    routing curve
    flow wave
  }

  edge probeReplica: newPods.e -> healthGate.w {
    label "Probe readiness"
    line dashed 2
    arrow end
    tone hex_D97732
    routing orthogonal
    flow dash
  }

  edge admitReplica: healthGate.e -> service.w {
    label "Add endpoints"
    line solid 2
    arrow end
    tone hex_138A72
    routing orthogonal
    flow glow
  }

  edge serveOld: oldPods.e -> service.w {
    label "Keep serving"
    line dashed 2
    arrow end
    tone hex_687589
    routing curve
  }

  edge routeTraffic: service.e -> traffic.w {
    label "Stable address"
    line solid 2
    arrow end
    tone hex_2F6FED
    routing orthogonal
    flow particles
  }
}

overlay availabilityRule: callout {
  anchor service.s
  text "Traffic moves only after readiness succeeds; old replicas remain available until then."
  width 420
  tone hex_138A72
}

story releaseStory {
  initial {
    hide rollingRelease.*
    hide availabilityRule
    camera fit(rollingRelease) padding 60
  }

  scene releaseBaseline "Start from a healthy deployment" duration 2400ms {
    action revealBaseline: stagger 230ms {
      action showDeveloper: show developer via slide(from: left, distance: 52)
      action showRegistry: show registry via pop
      action showController: show controller via pop
      action showOldPods: show oldPods via pop
      action showService: show service via pop
      action showTraffic: show traffic via slide(from: right, distance: 52)
    }
    action showServeOld: show serveOld via fade
    action showRouteTraffic: show routeTraffic via fade
    say "The existing replica set keeps serving through a stable Service before rollout begins."
  }

  scene releaseImage "Publish the new image" duration 1900ms {
    action showPushImage: show pushImage via fade
    action drawPushImage: draw pushImage via trace flow particles
    action focusRegistry: highlight registry tone hex_7457D9 effect glow
    say "The release starts with an immutable image that every new pod can reproduce."
  }

  scene releaseDesired "Change desired state" duration 2000ms {
    action clearRegistry: clearHighlight registry
    action showUpdateSpec: show updateSpec via fade
    action drawUpdateSpec: draw updateSpec via trace
    action focusController: highlight controller tone hex_D97732 effect pulse
    say "The controller compares the new desired state with the replicas currently running."
  }

  scene releaseCreate "Create replacement replicas" duration 2200ms {
    action revealNewReplica: sequence {
      action showNewPods: show newPods via pop
      action showCreateReplica: show createReplica via fade
      action drawCreateReplica: draw createReplica via trace flow wave
      action focusNewPods: highlight newPods tone hex_138A72 effect glow
    }
    say "New replicas arrive gradually instead of replacing every healthy pod at once."
  }

  scene releaseProbe "Gate traffic on readiness" duration 2300ms {
    action clearNewPods: clearHighlight newPods
    action showHealthGate: show healthGate via pop
    action showProbeReplica: show probeReplica via fade
    action drawProbeReplica: draw probeReplica via trace flow dash
    action focusHealthGate: highlight healthGate tone hex_D97732 effect pulse
    action showAvailabilityRule: show availabilityRule via pop
    say "A running process receives no traffic until its readiness contract succeeds."
  }

  scene releaseAdmit "Shift traffic safely" duration 2200ms {
    action clearHealthGate: clearHighlight healthGate
    action showAdmitReplica: show admitReplica via fade
    action drawAdmitReplica: draw admitReplica via trace flow glow
    action focusService: highlight service tone hex_2F6FED effect glow
    say "The Service adds each ready replica while the old version continues serving."
  }

  scene releaseComplete "Complete without downtime" duration 2000ms {
    action retireOld: hide oldPods via fade
    action hideOldPath: hide serveOld via fade
    action clearService: clearHighlight service
    action focusTraffic: highlight traffic tone hex_138A72 effect glow
    action frameTraffic: camera fit([service, traffic]) padding 110
    say "Only after capacity is restored does the controller retire the final old replica."
  }
}
`,
  },
  {
    id: "saga-compensation",
    title: "Saga transaction and compensation",
    category: "Distributed systems",
    description: "Compare the successful order path with compensating actions after a downstream failure.",
    source: `animflow 2.1

canvas {
  size 1600 by 900
  theme signalDesk
  background surface
}

graph sagaFlow {
  layout flow right {
    nodeGap 46
    rankGap 90
    routing curve
  }

  node order "Create order" {
    shape rounded
    tone hex_2F6FED
  }

  node inventory "Reserve inventory" {
    shape database
    tone hex_138A72
  }

  node payment "Charge payment" {
    shape rounded
    tone hex_7457D9
  }

  node shipping "Book shipment" {
    shape parallelogram
    tone hex_138A72
  }

  node completed "Order completed" {
    shape pill
    tone hex_138A72
  }

  node refund "Refund payment" {
    shape rounded
    tone hex_D97732
  }

  node releaseStock "Release inventory" {
    shape database
    tone hex_D97732
  }

  node failed "Order cancelled" {
    shape pill
    tone hex_D34B5B
  }

  edge reserve: order.e -> inventory.w {
    label "Reserve"
    line solid 2
    arrow end
    tone hex_138A72
    routing curve
  }

  edge charge: inventory.e -> payment.w {
    label "Charge"
    line solid 2
    arrow end
    tone hex_7457D9
    routing curve
  }

  edge ship: payment.e -> shipping.w {
    label "Book carrier"
    line solid 2
    arrow end
    tone hex_138A72
    routing curve
  }

  edge finish: shipping.e -> completed.w {
    label "Confirm"
    line solid 2
    arrow end
    tone hex_138A72
    routing curve
    flow glow
  }

  edge compensatePayment: shipping.s -> refund.n {
    label "Shipment failed"
    line dashed 2
    arrow end
    tone hex_D97732
    routing orthogonal
    flow dash
  }

  edge compensateInventory: refund.e -> releaseStock.w {
    label "Undo reservation"
    line dashed 2
    arrow end
    tone hex_D97732
    routing curve
    flow dash
  }

  edge cancelOrder: releaseStock.e -> failed.w {
    label "Mark cancelled"
    line solid 2
    arrow end
    tone hex_D34B5B
    routing curve
  }
}

overlay sagaRule: callout {
  anchor refund.s
  text "A Saga does not roll back time; it issues new operations that compensate earlier effects."
  width 420
  tone hex_D97732
}

story sagaStory {
  initial {
    hide sagaFlow.*
    hide sagaRule
    camera fit(sagaFlow) padding 62
  }

  scene sagaServices "Reveal the local transactions" duration 2700ms {
    action revealSagaNodes: stagger 190ms {
      action showOrder: show order via slide(from: left, distance: 52)
      action showInventory: show inventory via pop
      action showPayment: show payment via pop
      action showShipping: show shipping via pop
      action showCompleted: show completed via pop
      action showRefund: show refund via pop
      action showReleaseStock: show releaseStock via pop
      action showFailed: show failed via slide(from: right, distance: 52)
    }
    say "Each service owns a local transaction, so the workflow needs an explicit recovery path."
  }

  scene sagaReserve "Reserve inventory" duration 1900ms {
    action showReserve: show reserve via fade
    action drawReserve: draw reserve via trace flow particles
    action focusInventory: highlight inventory tone hex_138A72 effect glow
    say "The first durable effect reserves stock for this order."
  }

  scene sagaCharge "Charge the customer" duration 2000ms {
    action clearInventory: clearHighlight inventory
    action showCharge: show charge via fade
    action drawCharge: draw charge via trace flow particles
    action focusPayment: highlight payment tone hex_7457D9 effect pulse
    say "Payment commits independently; a later failure cannot erase this transaction."
  }

  scene sagaSuccess "Follow the success path" duration 2500ms {
    action showSuccessfulDelivery: sequence {
      action clearPayment: clearHighlight payment
      action showShip: show ship via fade
      action drawShip: draw ship via trace flow particles
      action showFinish: show finish via fade
      action drawFinish: draw finish via trace flow glow
      action focusCompleted: highlight completed tone hex_138A72 effect glow
    }
    say "When shipment succeeds, the Saga reaches a completed business state."
  }

  scene sagaFailure "Branch on shipment failure" duration 2300ms {
    action resetSuccess: sequence {
      action clearCompleted: clearHighlight completed
      action hideFinish: hide finish via fade
      action showCompensatePayment: show compensatePayment via fade
      action drawCompensatePayment: draw compensatePayment via trace flow dash
      action focusRefund: highlight refund tone hex_D97732 effect pulse
      action showSagaRule: show sagaRule via pop
    }
    say "A failed shipment starts compensation rather than a distributed database rollback."
  }

  scene sagaUndo "Compensate committed effects" duration 2600ms {
    action runCompensation: sequence {
      action clearRefund: clearHighlight refund
      action showCompensateInventory: show compensateInventory via fade
      action drawCompensateInventory: draw compensateInventory via trace flow dash
      action showCancelOrder: show cancelOrder via fade
      action drawCancelOrder: draw cancelOrder via trace
      action focusFailed: highlight failed tone hex_D34B5B effect glow
    }
    say "The Saga refunds payment, releases stock, and records a visible cancelled outcome."
  }

  scene sagaCompare "Compare both terminal states" duration 1900ms {
    action hideSagaRule: hide sagaRule via fade
    action frameSaga: camera fit(sagaFlow) padding 72
    say "Success and compensation are both first-class paths that operators must be able to observe."
  }
}
`,
  },
  {
    id: "oauth-pkce",
    title: "OAuth 2.1 with PKCE",
    category: "Security",
    description: "Follow browser authorization, consent, code exchange, and an audience-bound API call.",
    source: `animflow 2.1

canvas {
  size 1600 by 900
  theme signalDesk
  background surface
}

graph oauthFlow {
  layout flow right {
    nodeGap 42
    rankGap 86
    routing curve
  }

  node user "Resource owner" {
    shape rounded
    tone hex_2F6FED
  }

  node browser "Browser client" {
    shape parallelogram
    tone hex_7457D9
  }

  node authServer "Authorization server" {
    shape rounded
    tone hex_D97732
  }

  node consent "Consent screen" {
    shape document
    tone hex_D97732
  }

  node callback "App callback" {
    shape rounded
    tone hex_7457D9
  }

  node tokenSet "Access token" {
    shape pill
    tone hex_138A72
  }

  node resourceApi "Protected API" {
    shape database
    tone hex_2F6FED
  }

  node result "Authorized data" {
    shape document
    tone hex_138A72
  }

  edge beginLogin: user.e -> browser.w {
    label "Connect account"
    line solid 2
    arrow end
    tone hex_2F6FED
    routing curve
  }

  edge authorize: browser.e -> authServer.w {
    label "Challenge + resource"
    line solid 2
    arrow end
    tone hex_7457D9
    routing curve
    flow particles
  }

  edge requestConsent: authServer.e -> consent.w {
    label "Authenticate + approve"
    line solid 2
    arrow end
    tone hex_D97732
    routing curve
  }

  edge returnCode: consent.e -> callback.w {
    label "One-time code"
    line dashed 2
    arrow end
    tone hex_7457D9
    routing curve
    flow dash
  }

  edge exchangeCode: callback.e -> tokenSet.w {
    label "Code + verifier"
    line solid 2
    arrow end
    tone hex_138A72
    routing curve
    flow glow
  }

  edge callResource: tokenSet.e -> resourceApi.w {
    label "Bearer token"
    line solid 2
    arrow end
    tone hex_2F6FED
    routing curve
    flow particles
  }

  edge returnData: resourceApi.e -> result.w {
    label "Scoped response"
    line solid 2
    arrow end
    tone hex_138A72
    routing curve
  }
}

overlay pkceRule: callout {
  anchor callback.s
  text "The verifier never leaves the client until the code exchange, so a stolen code is useless alone."
  width 430
  tone hex_7457D9
}

story oauthStory {
  initial {
    hide oauthFlow.*
    hide pkceRule
    camera fit(oauthFlow) padding 62
  }

  scene oauthActors "Reveal the trust boundaries" duration 2700ms {
    action revealOauthActors: stagger 190ms {
      action showOauthUser: show user via slide(from: left, distance: 52)
      action showBrowser: show browser via pop
      action showAuthServer: show authServer via pop
      action showConsent: show consent via pop
      action showCallback: show callback via pop
      action showTokenSet: show tokenSet via pop
      action showResourceApi: show resourceApi via pop
      action showResult: show result via slide(from: right, distance: 52)
    }
    say "OAuth separates the user, the client, the authorization server, and the protected resource."
  }

  scene oauthStart "Start with user intent" duration 1800ms {
    action showBeginLogin: show beginLogin via fade
    action drawBeginLogin: draw beginLogin via trace
    action focusBrowser: highlight browser tone hex_7457D9 effect pulse
    say "The flow begins only when the user chooses to connect the application."
  }

  scene oauthAuthorize "Bind the authorization request" duration 2100ms {
    action clearBrowser: clearHighlight browser
    action showAuthorize: show authorize via fade
    action drawAuthorize: draw authorize via trace flow particles
    action focusAuthServer: highlight authServer tone hex_D97732 effect glow
    say "The client sends a PKCE challenge and identifies the resource it intends to call."
  }

  scene oauthConsent "Authenticate and grant consent" duration 2100ms {
    action clearAuthServer: clearHighlight authServer
    action showRequestConsent: show requestConsent via fade
    action drawRequestConsent: draw requestConsent via trace
    action focusConsent: highlight consent tone hex_D97732 effect pulse
    say "Authentication proves identity; consent decides what this client may do."
  }

  scene oauthCode "Return a short-lived code" duration 2200ms {
    action showReturnCode: show returnCode via fade
    action drawReturnCode: draw returnCode via trace flow dash
    action focusCallback: highlight callback tone hex_7457D9 effect glow
    action showPkceRule: show pkceRule via pop
    say "The callback receives a short-lived code that is bound to the original PKCE verifier."
  }

  scene oauthToken "Exchange securely" duration 2200ms {
    action clearCallback: clearHighlight callback
    action showExchangeCode: show exchangeCode via fade
    action drawExchangeCode: draw exchangeCode via trace flow glow
    action focusToken: highlight tokenSet tone hex_138A72 effect glow
    say "Only the legitimate client can combine the code and verifier to obtain an access token."
  }

  scene oauthResource "Call the intended resource" duration 2800ms {
    action useAccessToken: sequence {
      action hidePkceRule: hide pkceRule via fade
      action clearToken: clearHighlight tokenSet
      action showCallResource: show callResource via fade
      action drawCallResource: draw callResource via trace flow particles
      action showReturnData: show returnData via fade
      action drawReturnData: draw returnData via trace
      action focusOauthResult: highlight result tone hex_138A72 effect glow
    }
    say "The API validates the token audience and returns only data covered by the granted permission."
  }
}
`,
  },
  {
    id: "event-driven-checkout",
    title: "Event-driven checkout fan-out",
    category: "Backend",
    description: "Show one accepted checkout fanning out to payment, inventory, fulfillment, and analytics.",
    source: `animflow 2.1

canvas {
  size 1600 by 900
  theme signalDesk
  background surface
}

graph checkoutEvents {
  layout flow right {
    nodeGap 44
    rankGap 88
    routing orthogonal
  }

  node shopper "Shopper" {
    shape rounded
    tone hex_2F6FED
  }

  node checkoutApi "Checkout API" {
    shape rounded
    tone hex_7457D9
  }

  node eventBus "Event bus" {
    shape database
    tone hex_D97732
  }

  node paymentWorker "Payment worker" {
    shape rounded
    tone hex_7457D9
  }

  node inventoryWorker "Inventory worker" {
    shape rounded
    tone hex_138A72
  }

  node analyticsWorker "Analytics consumer" {
    shape parallelogram
    tone hex_2F6FED
  }

  node fulfillment "Fulfillment" {
    shape diamond
    tone hex_D97732
  }

  node notification "Customer update" {
    shape document
    tone hex_138A72
  }

  edge submitOrder: shopper.e -> checkoutApi.w {
    label "POST /checkout"
    line solid 2
    arrow end
    tone hex_2F6FED
    routing orthogonal
    flow particles
  }

  edge publishOrder: checkoutApi.e -> eventBus.w {
    label "Order accepted"
    line solid 2
    arrow end
    tone hex_D97732
    routing orthogonal
    flow glow
  }

  edge dispatchPayment: eventBus.e -> paymentWorker.w {
    label "Payment requested"
    line dashed 2
    arrow end
    tone hex_7457D9
    routing curve
    flow dash
  }

  edge dispatchInventory: eventBus.e -> inventoryWorker.w {
    label "Inventory requested"
    line dashed 2
    arrow end
    tone hex_138A72
    routing curve
    flow dash
  }

  edge dispatchAnalytics: eventBus.e -> analyticsWorker.w {
    label "Order observed"
    line dashed 2
    arrow end
    tone hex_2F6FED
    routing curve
    flow dash
  }

  edge paymentReady: paymentWorker.e -> fulfillment.w {
    label "Payment confirmed"
    line solid 2
    arrow end
    tone hex_7457D9
    routing curve
  }

  edge inventoryReady: inventoryWorker.e -> fulfillment.w {
    label "Stock reserved"
    line solid 2
    arrow end
    tone hex_138A72
    routing curve
  }

  edge notifyShopper: fulfillment.e -> notification.w {
    label "Ready to ship"
    line solid 2
    arrow end
    tone hex_138A72
    routing orthogonal
    flow particles
  }
}

overlay fanoutRule: badge {
  anchor eventBus.s
  text "One immutable event, three independent consumers"
  width 360
  tone hex_D97732
}

story checkoutStory {
  initial {
    hide checkoutEvents.*
    hide fanoutRule
    camera fit(checkoutEvents) padding 62
  }

  scene checkoutActors "Reveal the event topology" duration 2800ms {
    action revealCheckoutActors: stagger 180ms {
      action showShopper: show shopper via slide(from: left, distance: 52)
      action showCheckoutApi: show checkoutApi via pop
      action showEventBus: show eventBus via pop
      action showPaymentWorker: show paymentWorker via pop
      action showInventoryWorker: show inventoryWorker via pop
      action showAnalyticsWorker: show analyticsWorker via pop
      action showFulfillment: show fulfillment via pop
      action showNotification: show notification via slide(from: right, distance: 52)
    }
    say "The checkout path separates accepting a command from completing every downstream task."
  }

  scene checkoutAccept "Accept the checkout" duration 2200ms {
    action acceptCheckout: sequence {
      action showSubmitOrder: show submitOrder via fade
      action drawSubmitOrder: draw submitOrder via trace flow particles
      action focusCheckoutApi: highlight checkoutApi tone hex_7457D9 effect pulse
      action showPublishOrder: show publishOrder via fade
      action drawPublishOrder: draw publishOrder via trace flow glow
    }
    say "The API validates once, persists the decision, and publishes an immutable event."
  }

  scene checkoutFanout "Fan out independent work" duration 2700ms {
    action dispatchConsumers: stagger 240ms {
      action clearCheckoutApi: clearHighlight checkoutApi
      action showDispatchPayment: show dispatchPayment via fade
      action drawDispatchPayment: draw dispatchPayment via trace flow dash
      action showDispatchInventory: show dispatchInventory via fade
      action drawDispatchInventory: draw dispatchInventory via trace flow dash
      action showDispatchAnalytics: show dispatchAnalytics via fade
      action drawDispatchAnalytics: draw dispatchAnalytics via trace flow dash
    }
    action showFanoutRule: show fanoutRule via pop
    say "Payment, inventory, and analytics consume the same fact without blocking one another."
  }

  scene checkoutJoin "Join business prerequisites" duration 2600ms {
    action joinPrerequisites: stagger 260ms {
      action showPaymentReady: show paymentReady via fade
      action drawPaymentReady: draw paymentReady via trace flow particles
      action showInventoryReady: show inventoryReady via fade
      action drawInventoryReady: draw inventoryReady via trace flow particles
      action focusFulfillment: highlight fulfillment tone hex_D97732 effect pulse
    }
    say "Fulfillment waits for the business prerequisites, not for unrelated analytics work."
  }

  scene checkoutNotify "Notify after convergence" duration 2200ms {
    action hideFanoutRule: hide fanoutRule via fade
    action clearFulfillment: clearHighlight fulfillment
    action showNotifyShopper: show notifyShopper via fade
    action drawNotifyShopper: draw notifyShopper via trace flow particles
    action focusNotification: highlight notification tone hex_138A72 effect glow
    action frameCheckoutResult: camera fit([fulfillment, notification]) padding 112
    say "The customer update is emitted only when payment and stock have converged."
  }
}
`,
  },
  {
    id: "database-query-planner",
    title: "Database query planner",
    category: "Databases",
    description: "Turn SQL into candidate scans, compare estimated costs, execute a join, and return rows.",
    source: `animflow 2.1

canvas {
  size 1600 by 900
  theme signalDesk
  background surface
}

graph queryPlanner {
  layout flow right {
    nodeGap 44
    rankGap 90
    routing curve
  }

  node sql "SQL query" {
    shape document
    tone hex_2F6FED
  }

  node parser "Parser" {
    shape parallelogram
    tone hex_7457D9
  }

  node planner "Cost planner" {
    shape diamond
    tone hex_D97732
  }

  node catalog "Statistics catalog" {
    shape database
    tone hex_687589
  }

  node indexScan "Index scan" {
    shape rounded
    tone hex_138A72
  }

  node tableScan "Table scan" {
    shape rounded
    tone hex_D97732
  }

  node joinNode "Join operator" {
    shape diamond
    tone hex_7457D9
  }

  node rows "Result rows" {
    shape document
    tone hex_138A72
  }

  edge parseSql: sql.e -> parser.w {
    label "Parse + bind"
    line solid 2
    arrow end
    tone hex_7457D9
    routing curve
  }

  edge proposePlan: parser.e -> planner.w {
    label "Logical plan"
    line solid 2
    arrow end
    tone hex_D97732
    routing curve
  }

  edge readStats: catalog.e -> planner.s {
    label "Cardinality stats"
    line dashed 2
    arrow end
    tone hex_687589
    routing orthogonal
    flow dash
  }

  edge chooseIndex: planner.e -> indexScan.w {
    label "Low selectivity cost"
    line solid 2
    arrow end
    tone hex_138A72
    routing curve
    flow particles
  }

  edge chooseTable: planner.e -> tableScan.w {
    label "Full scan cost"
    line dashed 2
    arrow end
    tone hex_D97732
    routing curve
    flow dash
  }

  edge joinIndex: indexScan.e -> joinNode.w {
    label "Matched pages"
    line solid 2
    arrow end
    tone hex_138A72
    routing curve
  }

  edge joinTable: tableScan.e -> joinNode.w {
    label "Scanned pages"
    line dashed 2
    arrow end
    tone hex_D97732
    routing curve
  }

  edge emitRows: joinNode.e -> rows.w {
    label "Project columns"
    line solid 2
    arrow end
    tone hex_138A72
    routing curve
    flow glow
  }
}

overlay estimateRule: callout {
  anchor planner.s
  text "The planner chooses from estimated cost; stale statistics can make the cheaper-looking path slower."
  width 430
  tone hex_D97732
}

story plannerStory {
  initial {
    hide queryPlanner.*
    hide estimateRule
    camera fit(queryPlanner) padding 62
  }

  scene plannerActors "Reveal compilation and execution" duration 2700ms {
    action revealPlannerActors: stagger 190ms {
      action showSql: show sql via slide(from: left, distance: 52)
      action showParser: show parser via pop
      action showPlanner: show planner via pop
      action showCatalog: show catalog via pop
      action showIndexScan: show indexScan via pop
      action showTableScan: show tableScan via pop
      action showJoinNode: show joinNode via pop
      action showRows: show rows via slide(from: right, distance: 52)
    }
    say "A database compiles SQL into a physical plan before it reads the first data page."
  }

  scene plannerParse "Parse and bind names" duration 2000ms {
    action showParseSql: show parseSql via fade
    action drawParseSql: draw parseSql via trace flow particles
    action showProposePlan: show proposePlan via fade
    action drawProposePlan: draw proposePlan via trace
    action focusPlanner: highlight planner tone hex_D97732 effect pulse
    say "Parsing proves the query is valid and produces a logical description of the requested work."
  }

  scene plannerStats "Estimate from statistics" duration 2100ms {
    action showReadStats: show readStats via fade
    action drawReadStats: draw readStats via trace flow dash
    action focusCatalog: highlight catalog tone hex_687589 effect glow
    action showEstimateRule: show estimateRule via pop
    say "The cost model estimates row counts from statistics rather than executing every alternative."
  }

  scene plannerCompare "Compare candidate scans" duration 2600ms {
    action compareScans: stagger 260ms {
      action clearCatalog: clearHighlight catalog
      action clearPlanner: clearHighlight planner
      action showChooseIndex: show chooseIndex via fade
      action drawChooseIndex: draw chooseIndex via trace flow particles
      action showChooseTable: show chooseTable via fade
      action drawChooseTable: draw chooseTable via trace flow dash
    }
    say "An index scan wins for selective predicates, while a table scan can win when most rows are needed."
  }

  scene plannerExecute "Execute the chosen operators" duration 2500ms {
    action executePlan: sequence {
      action showJoinIndex: show joinIndex via fade
      action drawJoinIndex: draw joinIndex via trace flow particles
      action showJoinTable: show joinTable via fade
      action drawJoinTable: draw joinTable via trace flow dash
      action focusJoin: highlight joinNode tone hex_7457D9 effect pulse
    }
    say "Physical operators pull pages, produce tuples, and feed the selected join strategy."
  }

  scene plannerResult "Return projected rows" duration 2100ms {
    action hideEstimateRule: hide estimateRule via fade
    action clearJoin: clearHighlight joinNode
    action showEmitRows: show emitRows via fade
    action drawEmitRows: draw emitRows via trace flow glow
    action focusRows: highlight rows tone hex_138A72 effect glow
    action frameRows: camera fit([joinNode, rows]) padding 112
    say "The final operator projects the requested columns and streams result rows to the client."
  }
}
`,
  },
  {
    id: "production-incident-triage",
    title: "Production incident triage",
    category: "Operations",
    description: "Correlate logs, metrics, and traces to isolate a fault, mitigate impact, and verify recovery.",
    source: `animflow 2.1

canvas {
  size 1600 by 900
  theme signalDesk
  background surface
}

graph incidentFlow {
  layout flow right {
    nodeGap 42
    rankGap 86
    routing orthogonal
  }

  node users "User requests" {
    shape rounded
    tone hex_2F6FED
  }

  node gateway "API gateway" {
    shape rounded
    tone hex_7457D9
  }

  node checkout "Checkout service" {
    shape rounded
    tone hex_D34B5B
  }

  node telemetry "Telemetry collector" {
    shape diamond
    tone hex_D97732
  }

  node logs "Structured logs" {
    shape document
    tone hex_687589
  }

  node metrics "Service metrics" {
    shape parallelogram
    tone hex_2F6FED
  }

  node traces "Distributed traces" {
    shape document
    tone hex_7457D9
  }

  node oncall "On-call engineer" {
    shape rounded
    tone hex_D97732
  }

  node recovery "Verified recovery" {
    shape pill
    tone hex_138A72
  }

  edge incomingTraffic: users.e -> gateway.w {
    label "Checkout traffic"
    line solid 2
    arrow end
    tone hex_2F6FED
    routing orthogonal
    flow particles
  }

  edge failingRequest: gateway.e -> checkout.w {
    label "Timeout spike"
    line solid 2
    arrow end
    tone hex_D34B5B
    routing orthogonal
    flow lightning
  }

  edge emitTelemetry: checkout.e -> telemetry.w {
    label "Correlated signals"
    line dashed 2
    arrow end
    tone hex_D97732
    routing orthogonal
    flow dash
  }

  edge routeLogs: telemetry.e -> logs.w {
    label "Error context"
    line dashed 2
    arrow end
    tone hex_687589
    routing curve
  }

  edge routeMetrics: telemetry.e -> metrics.w {
    label "Rate + latency"
    line dashed 2
    arrow end
    tone hex_2F6FED
    routing curve
  }

  edge routeTraces: telemetry.e -> traces.w {
    label "Critical path"
    line dashed 2
    arrow end
    tone hex_7457D9
    routing curve
  }

  edge investigateLogs: logs.e -> oncall.w {
    label "Exception cause"
    line solid 2
    arrow end
    tone hex_687589
    routing curve
  }

  edge investigateMetrics: metrics.e -> oncall.w {
    label "Blast radius"
    line solid 2
    arrow end
    tone hex_2F6FED
    routing curve
  }

  edge investigateTraces: traces.e -> oncall.w {
    label "Slow dependency"
    line solid 2
    arrow end
    tone hex_7457D9
    routing curve
  }

  edge verifyRecovery: oncall.e -> recovery.w {
    label "Mitigate + observe"
    line solid 2
    arrow end
    tone hex_138A72
    routing orthogonal
    flow glow
  }
}

overlay triageRule: callout {
  anchor oncall.s
  text "Logs explain individual events, metrics size the impact, and traces reveal the causal path."
  width 430
  tone hex_D97732
}

story incidentStory {
  initial {
    hide incidentFlow.*
    hide triageRule
    camera fit(incidentFlow) padding 58
  }

  scene incidentBaseline "Reveal the production path" duration 2800ms {
    action revealIncidentActors: stagger 170ms {
      action showUsers: show users via slide(from: left, distance: 52)
      action showGateway: show gateway via pop
      action showCheckout: show checkout via pop
      action showTelemetry: show telemetry via pop
      action showLogs: show logs via pop
      action showMetrics: show metrics via pop
      action showTraces: show traces via pop
      action showOncall: show oncall via pop
      action showRecovery: show recovery via slide(from: right, distance: 52)
    }
    say "An incident response starts with the request path and the telemetry emitted at each boundary."
  }

  scene incidentDetect "Detect abnormal behavior" duration 2200ms {
    action showIncomingTraffic: show incomingTraffic via fade
    action drawIncomingTraffic: draw incomingTraffic via trace flow particles
    action showFailingRequest: show failingRequest via fade
    action drawFailingRequest: draw failingRequest via trace flow lightning
    action focusCheckout: highlight checkout tone hex_D34B5B effect pulse
    say "A latency and timeout spike identifies the affected service before anyone guesses at a cause."
  }

  scene incidentCollect "Collect correlated evidence" duration 2200ms {
    action clearCheckout: clearHighlight checkout
    action showEmitTelemetry: show emitTelemetry via fade
    action drawEmitTelemetry: draw emitTelemetry via trace flow dash
    action focusTelemetry: highlight telemetry tone hex_D97732 effect glow
    say "A shared request identifier lets every signal describe the same failing transaction."
  }

  scene incidentSignals "Separate signal responsibilities" duration 2800ms {
    action fanoutTelemetry: stagger 220ms {
      action clearTelemetry: clearHighlight telemetry
      action showRouteLogs: show routeLogs via fade
      action drawRouteLogs: draw routeLogs via trace
      action showRouteMetrics: show routeMetrics via fade
      action drawRouteMetrics: draw routeMetrics via trace flow particles
      action showRouteTraces: show routeTraces via fade
      action drawRouteTraces: draw routeTraces via trace flow dash
    }
    action showTriageRule: show triageRule via pop
    say "Logs provide context, metrics quantify the blast radius, and traces expose the slow dependency."
  }

  scene incidentCorrelate "Correlate before mitigating" duration 2900ms {
    action correlateEvidence: stagger 220ms {
      action showInvestigateLogs: show investigateLogs via fade
      action drawInvestigateLogs: draw investigateLogs via trace
      action showInvestigateMetrics: show investigateMetrics via fade
      action drawInvestigateMetrics: draw investigateMetrics via trace flow particles
      action showInvestigateTraces: show investigateTraces via fade
      action drawInvestigateTraces: draw investigateTraces via trace flow dash
      action focusOncall: highlight oncall tone hex_D97732 effect pulse
    }
    say "The on-call engineer combines all three signals before choosing the lowest-risk mitigation."
  }

  scene incidentRecover "Mitigate and verify recovery" duration 2300ms {
    action hideTriageRule: hide triageRule via fade
    action clearOncall: clearHighlight oncall
    action showVerifyRecovery: show verifyRecovery via fade
    action drawVerifyRecovery: draw verifyRecovery via trace flow glow
    action focusRecovery: highlight recovery tone hex_138A72 effect glow
    action frameRecovery: camera fit([oncall, recovery]) padding 112
    say "Recovery is complete only after fresh telemetry proves that user impact has returned to normal."
  }
}
`,
  },
];
