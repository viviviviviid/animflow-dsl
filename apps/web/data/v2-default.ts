export const DEFAULT_V2_SOURCE = `animflow 2.2

canvas {
  size 1600 by 900
  theme signalDesk
  background surface
}

graph paymentFlow {
  layout flow right {
    nodeGap 52
    rankGap 110
    routing orthogonal
  }

  node client "Client" {
    shape rounded
    tone hex_2F6FED
  }

  node gateway "Payment Gateway" {
    shape diamond
    tone hex_7457D9
  }

  node risk "Fraud Engine" {
    shape rounded
    tone hex_D97732
  }

  node bank "Issuing Bank" {
    shape database
    tone hex_138A72
  }

  node decision "Payment Decision" {
    shape document
    tone hex_2F6FED
  }

  edge authorize: client.e -> gateway.w {
    label "Authorize"
    line solid 2
    arrow end
    tone hex_2F6FED
    routing orthogonal
    flow particles
  }

  edge riskCheck: gateway.e -> risk.w {
    label "Score risk"
    line dashed 2
    arrow end
    tone hex_D97732
    routing orthogonal
    flow dash
  }

  edge verify: gateway.e -> bank.w {
    label "Check funds"
    line dashed 2
    arrow end
    tone hex_138A72
    routing orthogonal
    flow dash
  }

  edge riskSignal: risk.e -> decision.w {
    label "Risk signal"
    line solid 2
    arrow end
    tone hex_D97732
    routing orthogonal
    flow particles
  }

  edge bankDecision: bank.e -> decision.w {
    label "Bank response"
    line solid 2
    arrow end
    tone hex_138A72
    routing orthogonal
    flow particles
  }
}

story paymentStory {
  initial {
    hide paymentFlow.*
    camera fit(paymentFlow) padding 72
  }

  scene reveal "Reveal the actors" duration 1900ms {
    action revealActors: stagger 180ms {
      action revealClient: show client via slide(from: left, distance: 56)
      action revealGateway: show gateway via pop
      action revealRisk: show risk via slide(from: up, distance: 48)
      action revealBank: show bank via slide(from: right, distance: 56)
      action revealDecision: show decision via pop
    }
    say "The payment request splits into independent checks before one final decision."
  }

  scene authorizeScene "Authorize payment" duration 1400ms {
    action showAuthorize: show authorize via fade
    action traceAuthorize: draw authorize via trace flow particles
    action focusGateway: highlight gateway tone hex_7457D9 effect pulse
    say "The request is traced without querying the DOM."
  }

  scene verification "Run parallel checks" duration 1800ms {
    action showRiskCheck: show riskCheck via fade
    action traceRiskCheck: draw riskCheck via trace flow dash
    action showVerify: show verify via fade
    action traceVerify: draw verify via trace flow dash
    action clearGateway: clearHighlight gateway
    action focusRisk: highlight risk tone hex_D97732 effect pulse
    action focusBank: highlight bank tone hex_138A72 effect glow
    say "Fraud scoring and issuer verification run as two visible branches."
  }

  scene result "Merge the decision" duration 1700ms {
    action showRiskSignal: show riskSignal via fade
    action traceRiskSignal: draw riskSignal via trace flow particles
    action showBankDecision: show bankDecision via fade
    action traceBankDecision: draw bankDecision via trace flow particles
    action clearRisk: clearHighlight risk
    action clearBank: clearHighlight bank
    action focusDecision: highlight decision tone hex_2F6FED effect glow
    say "Both branches converge into a decision the audience can inspect and explain."
  }
}
`;
