import type { Template } from "./index";

export const x402AutonomousRetailTemplate: Template = {
  name: "X402 Autonomous Retail",
  description: "X402와 AI 에이전트로 만드는 자동화된 편의점 운영: Manual Chaos에서 Smart Era로의 변환",
  dsl: `flowchart TD
  start([🚀 X402 Autonomous Retail])

  telegram["📱 텔레그램 봇<br/>각자 /start 입력"]
  faucet["💰 자동 코인 지급<br/>Phase 2 사용 예정"]
  role{🎯 역할 배정<br/>점주 1명 / 나머지 손님}

  phase1_banner["⚡ PHASE 1: Manual Chaos<br/>자동화 없는 현실"]

  customer_p1["📋 손님<br/>메뉴 추천 받기<br/>음식 선택"]
  buy_item["🛒 물품 구매<br/>재고 한도 내 클릭"]
  out_of_stock["❌ 품절<br/>재고 없음<br/>발주 대기"]
  request_item["✍️ 신청<br/>없는 물품<br/>직접 입력"]

  owner_p1["🏪 점주<br/>재고 관리 사이트<br/>진입"]
  monitor_stock["👀 실시간 재고<br/>모니터링<br/>줄어드는 물품"]
  manual_order["📦 수동 발주<br/>다음 라운드 준비<br/>예측으로 구매"]
  process_request["💬 신청 대응<br/>새 물품<br/>추가할까?"]

  settlement1{⚠️ 라운드 정산<br/>악성재고 vs 수익<br/>운영 피로 노출}

  phase2_banner["🚀 PHASE 2: X402 Smart Era<br/>완벽한 자동화"]

  customer_p2["🤖 손님 AI 에이전트<br/>메뉴 클릭"]
  ai_ask["💭 AI 제안<br/>이 요리 사올까요?"]
  auto_pay["💳 X402 자동 결제<br/>즉시 처리"]
  auto_request_p2["🔄 자동 신청<br/>재고 없으면<br/>알아서 요청"]

  owner_p2["📊 점주 대시보드<br/>AI 재고 현황"]
  auto_trigger["⚡ 자동 발주<br/>임계치 도달 시<br/>AI가 트리거"]
  demand_agg["📈 수요 집계<br/>AI가 분석<br/>데이터 기반"]
  one_click["☑️ 한 번에 발주<br/>버튼 한 번<br/>모든 처리"]

  settlement2["✨ X402 온체인 정산<br/>실시간 · 자동 · 투명<br/>무결점 운영"]

  end(["🎉 완벽한 자동화 미래"])

  start --> telegram
  telegram --> faucet
  faucet --> role
  role --> phase1_banner

  phase1_banner --> customer_p1
  phase1_banner --> owner_p1

  customer_p1 --> buy_item
  buy_item --> out_of_stock
  buy_item --> request_item
  out_of_stock --> settlement1
  request_item --> process_request

  owner_p1 --> monitor_stock
  monitor_stock --> manual_order
  monitor_stock --> process_request
  manual_order --> settlement1
  process_request --> settlement1

  settlement1 --> phase2_banner

  phase2_banner --> customer_p2
  phase2_banner --> owner_p2

  customer_p2 --> ai_ask
  ai_ask --> auto_pay
  ai_ask --> auto_request_p2
  auto_pay --> settlement2
  auto_request_p2 --> settlement2

  owner_p2 --> auto_trigger
  auto_trigger --> demand_agg
  demand_agg --> one_click
  one_click --> settlement2

  settlement2 --> end

@animation
  step 1: show start
    name: "시작"
    description: "X402 Autonomous Retail 데모 시작"
    effect: slideInLeft
    duration: 0.8s

  step 2: show telegram, faucet, role
    name: "텔레그램 온보딩"
    description: "참가자들이 봇에 진입하고 역할을 배정받습니다."
    effect: fadeIn
    stagger: 0.2s
    duration: 1.2s

  step 3: highlight role
    name: "역할 배정"
    description: "점주 1명, 나머지는 손님으로 결정됩니다."
    color: #FF6B35
    pulse: true
    duration: 1.5s

  step 4: show phase1_banner
    name: "Phase 1 시작: Manual Chaos"
    description: "자동화 없이 수동으로 운영하는 현실입니다."
    effect: scaleIn
    duration: 1s

  step 5: show customer_p1, owner_p1
    name: "역할별 진입"
    description: "손님과 점주가 각각 자신의 사이트로 진입합니다."
    effect: slideInLeft, slideInRight
    stagger: 0.3s
    duration: 1s

  step 6: show buy_item, monitor_stock
    name: "손님·점주 활동"
    description: "손님은 물품을 구매하고, 점주는 실시간 재고를 모니터링합니다."
    effect: fadeIn
    stagger: 0.2s
    duration: 1.2s

  step 7: show out_of_stock, request_item
    name: "문제 발생"
    description: "품절과 신청이라는 두 가지 문제가 발생합니다."
    effect: slideInLeft, slideInRight
    stagger: 0.3s
    duration: 1s

  step 8: show manual_order, process_request
    name: "수동 대응"
    description: "점주가 예측으로 발주하고, 신청을 처리합니다."
    effect: fadeIn
    stagger: 0.2s
    duration: 1s

  step 9: highlight settlement1
    name: "정산: 악성재고와 피로"
    description: "예측 실패, 미처리 신청, 운영 피로가 드러납니다."
    color: #C62828
    glow: true
    pulse: true
    duration: 2s

  step 10: camera start, phase1_banner, customer_p1, owner_p1, settlement1
    name: "Phase 1 전체 흐름"
    description: "Manual Chaos의 혼돈을 한눈에 봅니다."
    cameraAction: fitNodes
    padding: 40px
    duration: 1.5s

  step 11: show phase2_banner
    name: "Phase 2: X402 Smart Era"
    description: "이제 X402와 AI가 모든 것을 자동화합니다."
    effect: scaleIn
    duration: 1.2s

  step 12: show customer_p2, owner_p2
    name: "새로운 환경"
    description: "손님은 AI와 대화하고, 점주는 대시보드를 봅니다."
    effect: slideInLeft, slideInRight
    stagger: 0.3s
    duration: 1s

  step 13: show ai_ask, auto_trigger
    name: "자동화 시작"
    description: "AI가 제안하고, 자동 발주가 트리거됩니다."
    effect: fadeIn
    stagger: 0.2s
    duration: 1s

  step 14: show auto_pay, demand_agg
    name: "스마트 처리"
    description: "X402 자동 결제와 수요 집계가 동시에 진행됩니다."
    effect: slideInLeft, slideInRight
    stagger: 0.3s
    duration: 1.2s

  step 15: highlight settlement2
    name: "X402 온체인 정산"
    description: "모든 거래가 블록체인 위에서 투명하게, 즉시 정산됩니다."
    color: #FFD700
    glow: true
    pulse: true
    duration: 2.5s

  step 16: show end
    name: "완벽한 자동화 미래"
    description: "이것이 X402가 만드는 리테일의 미래입니다."
    effect: slideInRight
    duration: 1s

  step 17: camera start, phase1_banner, phase2_banner, settlement2, end
    name: "전체 흐름"
    description: "Manual Chaos에서 Smart Era로의 변환을 봅니다."
    cameraAction: fitNodes
    padding: 40px
    duration: 2s
@end

@style
  start:
    fill: #f5f5f5
    stroke: #333
    stroke-width: 2px

  telegram, faucet:
    fill: #e3f2fd
    stroke: #1565C0
    stroke-width: 2px

  role:
    fill: #fff3e0
    stroke: #FF6B35
    stroke-width: 3px

  phase1_banner:
    fill: #FF6B35
    stroke: #D84315
    stroke-width: 3px
    color: white

  customer_p1:
    fill: #FFE0CC
    stroke: #FF6B35
    stroke-width: 2px

  owner_p1:
    fill: #FFCDD2
    stroke: #C62828
    stroke-width: 2px

  buy_item, monitor_stock:
    fill: #FFF9C4
    stroke: #FBC02D
    stroke-width: 2px

  out_of_stock, request_item:
    fill: #FFCDD2
    stroke: #E53935
    stroke-width: 2px

  manual_order, process_request:
    fill: #F8BBD0
    stroke: #C2185B
    stroke-width: 2px

  settlement1:
    fill: #C62828
    stroke: #8B0000
    stroke-width: 3px
    color: white

  phase2_banner:
    fill: #1565C0
    stroke: #0D47A1
    stroke-width: 3px
    color: white

  customer_p2:
    fill: #E3F2FD
    stroke: #1565C0
    stroke-width: 2px

  owner_p2:
    fill: #E3F2FD
    stroke: #1565C0
    stroke-width: 2px

  ai_ask, auto_pay, auto_request_p2:
    fill: #B3E5FC
    stroke: #0277BD
    stroke-width: 2px

  auto_trigger, demand_agg, one_click:
    fill: #B3E5FC
    stroke: #0277BD
    stroke-width: 2px

  settlement2:
    fill: #FFD700
    stroke: #FF8C00
    stroke-width: 4px

  end:
    fill: #2E7D32
    stroke: #1B5E20
    stroke-width: 3px
    color: white
@end

@narration
  step 1:
    title: "X402 Autonomous Retail 솔루션 소개"
    text: "편의점을 운영하면서 자동화 없이 수동으로 모든 것을 관리하려면 어떨까요? 점주는 실시간 재고를 추적해야 하고, 손님들의 불규칙한 요청을 처리해야 합니다. 이것이 바로 전통적인 리테일 운영입니다."

  step 4:
    title: "Phase 1: Manual Chaos"
    text: "자동화 없는 세계입니다. 손님들은 편의점에서 물품을 구매하려 하지만, 없는 것도 많습니다. 점주는 예측으로 발주해야 하는데, 정확하게 맞추기는 어렵습니다. 신청이 들어와도 처리할 시간이 부족합니다."

  step 11:
    title: "문제: 악성재고와 운영 피로"
    text: "라운드가 끝났습니다. 점주는 팔리지 않은 재고를 안고 있습니다. 손님들이 신청했던 물품을 챙기지 못한 경우도 있습니다. 이런 예측 실패와 처리 오류가 계속 반복됩니다. 이것이 수동 운영의 본질입니다."

  step 13:
    title: "Phase 2: X402 Smart Era"
    text: "이제 X402와 AI 에이전트가 등장합니다. 손님 쪽 AI는 '이 요리 사올까요?'라고 먼저 제안하고, 있으면 즉시 X402로 결제를 처리합니다. 없으면 자동으로 점주에게 신청 요청을 보냅니다."

  step 19:
    title: "X402의 핵심: M2M 온체인 정산"
    text: "모든 거래가 블록체인 위에서 투명하게, 즉시 정산됩니다. 점주의 발주도 자동으로 트리거되고, 수요를 분석한 AI가 최적의 발주량을 제안합니다. 인적 오류 없음. 재고 낭비 없음. 이것이 자동화의 미래입니다."

  step 22:
    title: "Manual Chaos에서 Smart Era로"
    text: "X402가 리테일을 어떻게 변화시키는가. M2M 결제로 모든 거래가 즉시 정산되고, AI 에이전트가 수요를 예측하며, 점주의 부담은 모니터링만 남습니다. 이것이 우리가 만들 Avalanche 위의 자동화된 미래입니다."
@end

@config
  autoplay: true
  loop: false
  speed: 1.0
  tts: true
  tts-voice: Kyunghoon, Nari, ko-KR
@end`,
};
