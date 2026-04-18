import type { Template } from "./index";

export const x402Phase1ManualChaosTemplate: Template = {
  name: "X402 Phase 1: Manual Chaos",
  description: "자동화 없는 편의점 운영 - 수동의 혼돈을 체험합니다",
  dsl: `flowchart TD
  start([🚀 편의점 운영 시작])
  customer["👥 손님<br/>메뉴 선택 · 물품 구매"]
  owner["🏪 점주<br/>재고 관리 · 발주"]
  problem["⚠️ 문제 발생<br/>품절 · 신청"]
  manual["📋 수동 대응<br/>예측으로 발주"]
  settlement{💔 결산<br/>악성재고 · 피로}
  end(["😫 운영 한계"])

  start --> customer
  start --> owner
  customer --> problem
  owner --> problem
  problem --> manual
  manual --> settlement
  settlement --> end

@animation
  step 1: show start
    name: "시작"
    description: "편의점 운영을 시작합니다."
    effect: fadeIn
    duration: 1s

  step 2: show customer, owner
    name: "역할 진입"
    description: "손님과 점주가 각각 진입합니다."
    effect: slideInLeft, slideInRight
    stagger: 0.3s
    duration: 1.5s

  step 3: connect customer->problem
    name: "손님의 요구"
    description: "손님이 물품을 찾습니다."
    flow: particles
    speed: 1.5s

  step 4: connect owner->problem
    name: "점주의 대응"
    description: "점주가 재고를 확인합니다."
    flow: particles
    speed: 1.5s

  step 5: show problem
    name: "문제 발생"
    description: "품절과 신청이라는 문제가 발생합니다."
    effect: scaleIn
    duration: 1s

  step 6: highlight problem
    name: "문제 강조"
    description: "문제를 강조합니다."
    color: #E53935
    glow: true
    pulse: true
    duration: 1.5s

  step 7: show manual
    name: "수동 대응"
    description: "점주가 예측으로 발주합니다."
    effect: fadeIn
    duration: 1s

  step 8: connect problem->manual
    name: "발주 진행"
    description: "문제에 대응하기 위해 발주합니다."
    flow: arrow
    speed: 1.5s

  step 9: show settlement
    name: "라운드 정산"
    description: "한 라운드가 끝나고 정산합니다."
    effect: scaleIn
    duration: 1s

  step 10: highlight settlement
    name: "정산 결과"
    description: "악성재고와 운영 피로가 드러납니다."
    color: #C62828
    glow: true
    pulse: true
    duration: 2s

  step 11: show end
    name: "운영 한계 도달"
    description: "수동 운영의 한계가 명확합니다."
    effect: slideInDown
    duration: 1s

  step 12: camera start, customer, owner, problem, settlement, end
    name: "전체 흐름"
    description: "Manual Chaos의 전체 과정을 봅니다."
    cameraAction: fitNodes
    padding: 40px
    duration: 1.5s
@end

@style
  start:
    fill: #fff3e0
    stroke: #FF6B35
    stroke-width: 3px

  customer:
    fill: #FFE0CC
    stroke: #FF6B35
    stroke-width: 2px

  owner:
    fill: #FFCDD2
    stroke: #C62828
    stroke-width: 2px

  problem:
    fill: #FFCDD2
    stroke: #E53935
    stroke-width: 2px

  manual:
    fill: #F8BBD0
    stroke: #C2185B
    stroke-width: 2px

  settlement:
    fill: #C62828
    stroke: #8B0000
    stroke-width: 3px
    color: white

  end:
    fill: #B71C1C
    stroke: #5F0000
    stroke-width: 3px
    color: white
@end

@narration
  step 1:
    title: "Phase 1: Manual Chaos"
    text: "텔레그램 봇에서 역할이 배정됩니다. 점주 1명, 나머지는 손님입니다. 이제 5라운드의 편의점 운영을 시작합니다."

  step 2:
    title: "손님과 점주 진입"
    text: "손님은 '오늘 뭐해먹지' 버튼으로 웹앱에 진입합니다. 점주는 재고 관리 사이트로 진입합니다."

  step 6:
    title: "문제: 품절과 신청"
    text: "손님이 물품을 찾지 못하거나(품절), 편의점에 없는 물품을 신청합니다(신청). 점주는 이를 실시간으로 처리해야 합니다."

  step 10:
    title: "정산: 악성재고와 피로"
    text: "라운드가 끝났습니다. 점주는 예측을 틀려 팔리지 않은 재고를 안고 있습니다. 손님 신청을 모두 처리하지 못한 것도 있습니다. 이것이 수동 운영의 현실입니다."

  step 11:
    title: "Manual Chaos의 한계"
    text: "예측 실패, 미처리 신청, 운영 피로. 이것이 자동화 없는 세상입니다. 이제 X402가 어떻게 이를 해결하는지 봅니다."
@end

@config
  autoplay: true
  loop: false
  speed: 1.0
  tts: true
  tts-voice: Kyunghoon, Nari, ko-KR
@end`,
};
