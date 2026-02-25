import type { Template } from "./index";

export const orderProcessTemplate: Template = {
  name: "주문 처리 프로세스",
  description: "주문부터 배송까지의 전체 프로세스",
  dsl: `flowchart TD
  start([주문 접수])
  validate{재고 확인}
  payment{결제 처리}
  pack[포장 준비]
  ship[배송 시작]
  notify[고객 알림]
  complete([주문 완료])

  cancel[주문 취소]
  refund[환불 처리]

  start --> validate
  validate -->|재고 있음| payment
  validate -->|재고 없음| cancel
  payment -->|성공| pack
  payment -->|실패| refund
  pack --> ship
  ship --> notify
  notify --> complete
  cancel --> notify
  refund --> notify

@animation
  step 1: show start
    name: "주문 접수 표시"
    description: "start 노드를 화면에 표시합니다."
    effect: bounceIn
    duration: 1s

  step 2: highlight start
    name: "주문 접수 강조"
    description: "start 단계를 강조합니다."
    color: #4CAF50
    pulse: true
    duration: 1s

  step 3: connect start->validate
    name: "재고 확인 연결"
    description: "start에서 validate로 흐름을 연결합니다."
    flow: arrow
    speed: 1s

  step 4: show validate
    name: "재고 확인 표시"
    description: "validate 노드를 화면에 표시합니다."
    effect: flipIn
    duration: 1s

  step 5: highlight validate
    name: "재고 확인 강조"
    description: "validate 단계를 강조합니다."
    color: #FF9800
    pulse: true
    duration: 1s

  step 6: connect validate->payment
    name: "결제 단계 연결"
    description: "validate에서 payment로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 7: show payment
    name: "결제 처리 표시"
    description: "payment 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 1s

  step 8: highlight payment
    name: "결제 처리 강조"
    description: "payment 단계를 강조합니다."
    color: #2196F3
    pulse: true
    duration: 1s

  step 9: connect payment->pack
    name: "포장 준비 연결"
    description: "payment에서 pack으로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 10: show pack
    name: "포장 준비 표시"
    description: "pack 노드를 화면에 표시합니다."
    effect: slideInDown
    duration: 1s

  step 11: highlight pack
    name: "포장 준비 강조"
    description: "pack 단계를 강조합니다."
    color: #9C27B0
    glow: true
    duration: 1s

  step 12: connect pack->ship
    name: "배송 시작 연결"
    description: "pack에서 ship으로 흐름을 연결합니다."
    flow: arrow
    speed: 1s

  step 13: show ship
    name: "배송 시작 표시"
    description: "ship 노드를 화면에 표시합니다."
    effect: slideInDown
    duration: 1s

  step 14: highlight ship
    name: "배송 시작 강조"
    description: "ship 단계를 강조합니다."
    color: #FF5722
    pulse: true
    duration: 1s

  step 15: connect ship->notify
    name: "고객 알림 연결"
    description: "ship에서 notify로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 16: show notify
    name: "고객 알림 표시"
    description: "notify 노드를 화면에 표시합니다."
    effect: bounceIn
    duration: 1s

  step 17: highlight notify
    name: "고객 알림 강조"
    description: "notify 단계를 강조합니다."
    color: #00BCD4
    glow: true
    duration: 1s

  step 18: connect notify->complete
    name: "완료 단계 연결"
    description: "notify에서 complete로 흐름을 연결합니다."
    flow: arrow
    speed: 1s

  step 19: show complete
    name: "주문 완료 표시"
    description: "complete 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 1s

  step 20: highlight complete
    name: "주문 완료 강조"
    description: "complete 단계를 강조합니다."
    color: #4CAF50
    glow: true
    duration: 2s

  step 21: show cancel, refund
    name: "예외 노드 표시"
    description: "cancel과 refund 노드를 화면에 표시합니다."
    effect: fadeIn
    stagger: 0.3s

  step 22: camera fitAll
    name: "카메라 전체 맞춤"
    description: "전체 주문 처리 흐름이 보이도록 카메라를 조정합니다."
    padding: 40px
    duration: 2s
@end

@style
  start, complete:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px

  validate, payment:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 2px

  pack, ship, notify:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 2px

  cancel, refund:
    fill: #ffebee
    stroke: #F44336
    stroke-width: 2px
@end

@narration
  step 1:
    title: "주문 접수"
    text: "고객이 쇼핑몰에서 상품을 선택하고 '주문하기' 버튼을 누릅니다. 주문 정보가 시스템에 등록되고 전체 프로세스가 시작됩니다."

  step 5:
    title: "재고 확인"
    text: "첫 번째로 확인해야 할 것은 재고입니다. '정말 이 상품이 창고에 있나요?'라는 질문을 하는 단계입니다. 재고가 없으면 주문을 취소하고 환불해야 합니다."

  step 8:
    title: "결제 처리"
    text: "재고가 확인되면 고객의 신용카드나 계좌에서 돈을 받습니다. 결제 게이트웨이와 통신하여 결제가 승인되는지 확인합니다."

  step 11:
    title: "포장 준비"
    text: "결제가 완료되면 창고 직원들이 상품을 찾아 포장합니다. 상품이 손상되지 않도록 신중히 준비합니다. 송장도 이 단계에서 붙습니다."

  step 14:
    title: "배송 시작"
    text: "포장된 상품이 배송업체에 넘어갑니다. 택배 트럭에 실려 고객의 주소로 향합니다. 이 단계에서 실시간 추적 번호가 생성됩니다."

  step 17:
    title: "고객 알림"
    text: "배송이 시작되었으니 고객에게 알려줍니다. 문자 메시지, 이메일, 또는 앱 푸시 알림으로 배송 상태와 추적 번호를 알립니다."

  step 20:
    title: "주문 완료"
    text: "고객이 상품을 받으면 주문이 완료됩니다. 대부분의 쇼핑몰은 고객이 '배송받음' 버튼을 눌렀을 때 주문을 완료 처리합니다."

  step 21:
    title: "예외 처리"
    text: "모든 주문이 성공적으로 완료되는 것만은 아닙니다. 재고가 없거나 결제가 실패하면 주문을 취소하고 이미 결제된 돈은 환불해야 합니다."
@end

@config
  autoplay: true
  loop: false
  controls: true
  speed: 1.0
  tts: true
  tts-voice: Kyunghoon, InJoon, ko-KR
@end`,
};
