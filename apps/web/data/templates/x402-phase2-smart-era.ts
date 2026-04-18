import type { Template } from "./index";

export const x402Phase2SmartEraTemplate: Template = {
  name: "X402 Phase 2: Smart Era",
  description: "X402와 AI 에이전트로 만드는 완벽한 자동화",
  dsl: `flowchart TD
  start([🚀 Smart Era 시작])
  customer["🤖 손님 AI 에이전트<br/>대화형 쇼핑"]
  owner["📊 점주 대시보드<br/>AI 자동 관리"]
  auto["⚡ 자동화<br/>AI 제안 · 자동 발주"]
  x402["💳 X402 결제<br/>M2M 온체인"]
  settlement{✨ 정산<br/>무결점 · 투명}
  end(["🎉 완벽한 미래"])

  start --> customer
  start --> owner
  customer --> auto
  owner --> auto
  auto --> x402
  x402 --> settlement
  settlement --> end

@animation
  step 1: show start
    name: "Phase 2 시작"
    description: "X402 Smart Era가 시작됩니다."
    effect: fadeIn
    duration: 1s

  step 2: show customer, owner
    name: "새로운 환경"
    description: "AI 에이전트와 대시보드로 무장한 새 환경입니다."
    effect: slideInLeft, slideInRight
    stagger: 0.3s
    duration: 1.5s

  step 3: highlight customer
    name: "손님 경험"
    description: "손님은 AI와 대화합니다."
    color: #1565C0
    glow: true
    duration: 1s

  step 4: highlight owner
    name: "점주 경험"
    description: "점주는 대시보드만 모니터링합니다."
    color: #1565C0
    pulse: true
    duration: 1s

  step 5: show auto
    name: "자동화"
    description: "AI가 제안하고 자동 발주를 트리거합니다."
    effect: scaleIn
    duration: 1s

  step 6: connect customer->auto
    name: "AI 제안"
    description: "AI가 손님에게 '이 요리 사올까요?'라고 제안합니다."
    flow: particles
    speed: 1.5s

  step 7: connect owner->auto
    name: "자동 발주"
    description: "AI가 임계치를 감지하면 자동으로 발주합니다."
    flow: particles
    speed: 1.5s

  step 8: show x402
    name: "X402 결제"
    description: "X402가 즉시 모든 거래를 처리합니다."
    effect: scaleIn
    duration: 1s

  step 9: highlight x402
    name: "M2M 온체인 결제"
    description: "기계에서 기계로, 블록체인 위에서 투명하게."
    color: #FFD700
    glow: true
    pulse: true
    duration: 2s

  step 10: connect auto->x402
    name: "X402 실행"
    description: "자동화된 모든 거래가 X402로 정산됩니다."
    flow: arrow
    speed: 1.5s

  step 11: show settlement
    name: "완벽한 정산"
    description: "모든 거래가 실시간으로 정산됩니다."
    effect: scaleIn
    duration: 1s

  step 12: highlight settlement
    name: "솔루션의 핵심"
    description: "무결점, 투명, 즉시. 이것이 X402의 가치입니다."
    color: #FFD700
    glow: true
    pulse: true
    duration: 2s

  step 13: show end
    name: "완벽한 미래"
    description: "X402가 만드는 자동화된 리테일의 미래입니다."
    effect: slideInDown
    duration: 1s

  step 14: camera start, customer, owner, auto, x402, settlement, end
    name: "전체 흐름"
    description: "Smart Era의 완벽한 자동화 흐름을 봅니다."
    cameraAction: fitNodes
    padding: 40px
    duration: 1.5s
@end

@style
  start:
    fill: #E3F2FD
    stroke: #1565C0
    stroke-width: 3px

  customer:
    fill: #E3F2FD
    stroke: #1565C0
    stroke-width: 2px

  owner:
    fill: #E3F2FD
    stroke: #1565C0
    stroke-width: 2px

  auto:
    fill: #B3E5FC
    stroke: #0277BD
    stroke-width: 2px

  x402:
    fill: #FFD700
    stroke: #FF8C00
    stroke-width: 4px

  settlement:
    fill: #FFD700
    stroke: #FF8C00
    stroke-width: 3px
    color: white

  end:
    fill: #2E7D32
    stroke: #1B5E20
    stroke-width: 3px
    color: white
@end

@narration
  step 1:
    title: "Phase 2: X402 Smart Era"
    text: "이제 같은 편의점 운영을 X402와 AI 에이전트로 합니다. 결과가 얼마나 다를까요?"

  step 2:
    title: "새로운 환경"
    text: "손님은 AI 에이전트와 텔레그램에서 대화합니다. '오늘 뭐해먹지?'라는 메뉴를 클릭하면 AI가 '이 요리 사올까요?'라고 먼저 제안합니다."

  step 3:
    title: "손님의 경험"
    text: "AI가 현재 편의점 재고를 확인합니다. 있으면 즉시 X402로 결제하고, 없으면 알아서 점주에게 신청을 보냅니다. 손님은 컨펌만 합니다."

  step 4:
    title: "점주의 경험"
    text: "점주는 복잡한 발주와 신청 처리에서 해방됩니다. 대신 대시보드에서 AI의 자동 발주를 모니터링합니다. 수요 집계도 AI가 합니다."

  step 9:
    title: "X402: M2M 블록체인 결제"
    text: "모든 거래가 X402를 통해 블록체인 위에서 투명하게 즉시 정산됩니다. 기계에서 기계로의 신뢰할 수 있는 거래입니다."

  step 12:
    title: "무결점 운영"
    text: "예측 오류 없음. 미처리 신청 없음. 운영 피로 없음. 이것이 자동화의 진정한 가치입니다. X402가 가능하게 하는 미래입니다."

  step 13:
    title: "X402 Autonomous Retail의 미래"
    text: "Manual Chaos에서 Smart Era로. AI 에이전트와 X402의 결합이 리테일의 미래를 바꿉니다. 이것이 Avalanche 위의 가능성입니다."
@end

@config
  autoplay: true
  loop: false
  speed: 1.0
  tts: true
  tts-voice: Kyunghoon, Nari, ko-KR
@end`,
};
