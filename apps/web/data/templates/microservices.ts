import type { Template } from "./index";

export const microservicesTemplate: Template = {
  name: "마이크로서비스 아키텍처",
  description: "API Gateway, 서비스, DB, 메시지 큐를 포함한 MSA 구조",
  dsl: `flowchart TD
  user([사용자])
  gateway[API Gateway]
  auth[인증 서비스]
  user_svc[유저 서비스]
  order_svc[주문 서비스]
  pay_svc[결제 서비스]
  notify_svc[알림 서비스]
  mq([메시지 큐])
  user_db[(유저 DB)]
  order_db[(주문 DB)]
  pay_db[(결제 DB)]
  cache[Redis 캐시]
  log[로그 수집기]

  user --> gateway
  gateway --> auth
  gateway --> user_svc
  gateway --> order_svc
  auth --- cache
  user_svc --- user_db
  order_svc --- order_db
  order_svc --> pay_svc
  pay_svc --- pay_db
  pay_svc --> mq
  mq --> notify_svc
  order_svc --> mq
  gateway --- log
  auth --- log

@animation
  step 1: show user
    name: "사용자 표시"
    description: "user 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 1s

  step 2: show gateway
    name: "API Gateway 표시"
    description: "gateway 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 1s

  step 3: connect user->gateway
    name: "사용자 요청"
    description: "사용자에서 gateway로 흐름을 연결합니다."
    flow: particles
    speed: 1.5s

  step 4: highlight gateway
    name: "Gateway 강조"
    description: "gateway를 강조합니다."
    color: #FF9800
    glow: true
    duration: 1s

  step 5: show auth
    name: "인증 서비스 표시"
    description: "auth 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 0.8s

  step 6: connect gateway->auth
    name: "인증 연결"
    description: "gateway에서 auth로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 7: highlight auth
    name: "인증 강조"
    description: "auth 서비스를 강조합니다."
    color: #4CAF50
    pulse: true
    duration: 1s

  step 8: show cache
    name: "캐시 표시"
    description: "cache 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 0.8s

  step 9: connect auth->cache
    name: "캐시 연결"
    description: "auth에서 cache로 연결합니다."
    flow: particles
    speed: 1s

  step 10: show user_svc, order_svc
    name: "핵심 서비스 표시"
    description: "user_svc, order_svc 노드를 화면에 표시합니다."
    effect: slideInBottom
    stagger: 0.3s
    duration: 0.8s

  step 11: connect gateway->user_svc, gateway->order_svc
    name: "서비스 라우팅"
    description: "gateway에서 서비스들로 흐름을 연결합니다."
    flow: arrow
    speed: 1s

  step 12: highlight user_svc
    name: "유저 서비스 강조"
    description: "user_svc를 강조합니다."
    color: #4CAF50
    pulse: true
    duration: 1s

  step 13: highlight order_svc
    name: "주문 서비스 강조"
    description: "order_svc를 강조합니다."
    color: #4CAF50
    pulse: true
    duration: 1s

  step 14: show user_db, order_db
    name: "DB 표시"
    description: "user_db, order_db 노드를 화면에 표시합니다."
    effect: bounceIn
    stagger: 0.3s
    duration: 0.8s

  step 15: connect user_svc->user_db, order_svc->order_db
    name: "DB 연결"
    description: "서비스에서 DB로 연결합니다."
    flow: particles
    speed: 1s

  step 16: show pay_svc
    name: "결제 서비스 표시"
    description: "pay_svc 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 0.8s

  step 17: connect order_svc->pay_svc
    name: "결제 요청"
    description: "order_svc에서 pay_svc로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 18: highlight pay_svc
    name: "결제 강조"
    description: "pay_svc를 강조합니다."
    color: #4CAF50
    pulse: true
    duration: 1s

  step 19: show pay_db
    name: "결제 DB 표시"
    description: "pay_db 노드를 화면에 표시합니다."
    effect: bounceIn
    duration: 0.8s

  step 20: connect pay_svc->pay_db
    name: "결제 DB 연결"
    description: "pay_svc에서 pay_db로 연결합니다."
    flow: particles
    speed: 1s

  step 21: show mq
    name: "메시지 큐 표시"
    description: "mq 노드를 화면에 표시합니다."
    effect: flipIn
    duration: 1s

  step 22: connect pay_svc->mq, order_svc->mq
    name: "이벤트 발행"
    description: "서비스에서 메시지 큐로 흐름을 연결합니다."
    flow: particles
    speed: 1.5s

  step 23: highlight mq
    name: "메시지 큐 강조"
    description: "mq를 강조합니다."
    color: #9C27B0
    glow: true
    duration: 1s

  step 24: show notify_svc
    name: "알림 서비스 표시"
    description: "notify_svc 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 0.8s

  step 25: connect mq->notify_svc
    name: "알림 전달"
    description: "mq에서 notify_svc로 흐름을 연결합니다."
    flow: arrow
    speed: 1s

  step 26: highlight notify_svc
    name: "알림 강조"
    description: "notify_svc를 강조합니다."
    color: #4CAF50
    pulse: true
    duration: 1s

  step 27: show log
    name: "로그 수집기 표시"
    description: "log 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 0.8s

  step 28: connect gateway->log, auth->log
    name: "로그 수집"
    description: "gateway, auth에서 log로 연결합니다."
    flow: dash
    speed: 1.5s

  step 29: camera fitAll
    name: "카메라 전체 맞춤"
    description: "전체 아키텍처가 보이도록 카메라를 조정합니다."
    padding: 40px
    duration: 1.5s
@end

@style
  user:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 3px

  gateway:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 3px

  auth, user_svc, order_svc, pay_svc, notify_svc:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 2px

  mq:
    fill: #f3e5f5
    stroke: #9C27B0
    stroke-width: 3px

  user_db, order_db, pay_db:
    fill: #fff8e1
    stroke: #FFC107
    stroke-width: 2px

  cache:
    fill: #fce4ec
    stroke: #E91E63
    stroke-width: 2px

  log:
    fill: #efebe9
    stroke: #795548
    stroke-width: 2px
@end

@narration
  step 1:
    title: "사용자와 서비스"
    text: "마이크로서비스 아키텍처(MSA)는 거대한 애플리케이션을 '독립적인 작은 서비스'들로 나누는 방식입니다. 이 방식의 핵심 개념을 함께 살펴봅시다."

  step 4:
    title: "API Gateway - 현관문"
    text: "API Gateway는 모든 요청의 첫 번째 입구입니다. 마치 호텔의 프론트 데스크와 같아서, 요청을 받으면 어느 서비스에 전달할지 판단합니다."

  step 7:
    title: "인증 서비스 - 보안"
    text: "사용자가 정말 누구인지 확인하는 서비스입니다. 로그인, JWT 토큰 검증, 권한 확인 등의 보안 관련 작업을 담당합니다."

  step 9:
    title: "캐시 - 빠른 응답"
    text: "자주 조회하는 정보(예: 사용자 프로필)는 데이터베이스가 아닌 Redis 캐시에 저장해서 빠르게 응답합니다. 마치 자주 쓰는 책을 책상 위에 두는 것과 같습니다."

  step 12:
    title: "유저 서비스 - 사용자 관리"
    text: "회원가입, 프로필 관리, 비밀번호 변경 등 사용자 정보 관련 기능을 담당합니다. 이 서비스만의 데이터베이스를 가지고 있습니다."

  step 13:
    title: "주문 서비스 - 핵심 비즈니스"
    text: "주문 생성, 상태 추적 등 쇼핑몰의 핵심 비즈니스 로직을 담당합니다. 필요할 때 결제 서비스를 호출합니다."

  step 18:
    title: "결제 서비스 - 금융"
    text: "신용카드 결제, 환불 등 금융 관련 작업을 담당합니다. 매우 민감한 정보를 다루므로 별도의 서비스로 분리합니다."

  step 23:
    title: "메시지 큐 - 비동기 통신"
    text: "서비스들이 직접 통신하면 한 서비스가 느려지면 다른 서비스도 영향을 받습니다. 메시지 큐는 이를 해결합니다. 마치 편지함과 같아서, 메시지를 남겨두면 나중에 처리할 수 있습니다."

  step 26:
    title: "알림 서비스 - 비동기 처리"
    text: "결제가 완료되면 메시지 큐에 '결제 완료' 메시지를 넣습니다. 알림 서비스가 나중에 이 메시지를 꺼내서 이메일/SMS를 보냅니다. 사용자는 '결제 완료' 응답을 빨리 받을 수 있습니다."

  step 29:
    title: "MSA의 장점과 도전"
    text: "MSA는 각 팀이 독립적으로 서비스를 개발/배포할 수 있다는 장점이 있습니다. 하지만 서비스 간 네트워크 통신이 많고, 분산 트랜잭션 관리가 복잡해진다는 단점도 있습니다."
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
