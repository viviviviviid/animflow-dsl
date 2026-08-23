export const DEFAULT_V2_SOURCE = `animflow 2.1

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
    shape rounded
    tone hex_7457D9
  }

  node bank "Issuing Bank" {
    shape database
    tone hex_138A72
  }

  edge authorize: client.e -> gateway.w {
    label "Authorize"
    line solid 2
    arrow end
    tone hex_2F6FED
    routing orthogonal
    flow particles
  }

  edge verify: gateway.e -> bank.w {
    label "Verify funds"
    line dashed 2
    arrow end
    tone hex_138A72
    routing curve
    flow dash
  }
}

overlay decision: callout {
  anchor bank.s
  text "The bank returns a deterministic approval decision."
  width 320
  tone hex_138A72
}

story paymentStory {
  initial {
    hide paymentFlow.*
    hide decision
    camera fit(paymentFlow) padding 72
  }

  scene reveal "Reveal the actors" duration 1600ms {
    action revealActors: stagger 220ms {
      action revealClient: show client via slide(from: left, distance: 56)
      action revealGateway: show gateway via pop
      action revealBank: show bank via slide(from: right, distance: 56)
    }
    say "Three actors share one compiled scene clock."
  }

  scene authorizeScene "Authorize payment" duration 1400ms {
    action showAuthorize: show authorize via fade
    action traceAuthorize: draw authorize via trace flow particles
    action focusGateway: highlight gateway tone hex_7457D9 effect pulse
    say "The request is traced without querying the DOM."
  }

  scene verification "Verify funds" duration 1500ms {
    action showVerify: show verify via fade
    action traceVerify: draw verify via trace flow dash
    action clearGateway: clearHighlight gateway
    action focusBank: highlight bank tone hex_138A72 effect glow
    say "Seeking this timestamp produces the same frame as playback."
  }

  scene result "Show the decision" duration 1100ms {
    action showDecision: show decision via pop
    action focusDecision: camera focus(bank) padding 96
    say "Geometry, camera, arrows, and narration now use one state model."
  }
}
`;
