import type { Template } from "./index";

export const redisStreamTemplate: Template = {
  name: "Redis Stream 이벤트 흐름",
  description: "Fan-out, Consumer Group, XCLAIM 복구까지 Redis Stream 핵심 흐름",
  dsl: `flowchart LR
  producer[Producer<br/>주문 서비스]
  stream[("Redis Stream<br/>order-events<br/>─────────────<br/>1699001-0: order_created<br/>1699002-0: order_paid<br/>1699003-0: order_shipped")]

  cg1[Consumer Group<br/>order-processors<br/>last-id: 1699002-0]
  cg2[Consumer Group<br/>analytics<br/>last-id: 1699001-0]

  c1[Consumer 1<br/>재고 서비스]
  c2[Consumer 2<br/>알림 서비스]
  c3[Consumer 3<br/>분석 서비스]

  pel[PEL<br/>미확인 메시지<br/>1699002-0 → c2<br/>경과: 32s]
  xclaim[XCLAIM<br/>c1이 메시지 인수]
  dead[Dead Letter<br/>my-stream-dead<br/>재시도 3회 초과]

  producer -->|XADD *| stream
  stream -->|XREADGROUP >| cg1
  stream -->|XREADGROUP >| cg2
  cg1 -->|메시지 전달| c1
  cg1 -->|메시지 전달| c2
  cg2 -->|메시지 전달| c3
  c1 -->|XACK| cg1
  c3 -->|XACK| cg2
  c2 -.->|타임아웃 / 처리 실패| pel
  pel -->|XCLAIM --min-idle-time 30000| xclaim
  xclaim -->|재처리| c1
  c1 -->|재처리 성공 시 XACK| cg1
  pel -->|재시도 횟수 초과| dead

@animation
  step 1: show producer
    name: "Producer 표시"
    description: "주문 서비스 Producer를 화면에 표시합니다."
    effect: slideInLeft
    duration: 1s

  step 2: highlight producer
    name: "Producer 강조"
    description: "producer를 강조합니다."
    color: #2196F3
    glow: true
    duration: 1s

  step 3: show stream
    name: "Redis Stream 표시"
    description: "Redis Stream 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 1s

  step 4: connect producer->stream
    name: "XADD 이벤트 발행"
    description: "producer에서 stream으로 메시지를 추가합니다."
    flow: particles
    speed: 1.5s

  step 5: highlight stream
    name: "Stream 강조"
    description: "stream을 강조합니다."
    color: #E91E63
    pulse: true
    duration: 1.5s

  step 6: show cg1
    name: "Consumer Group 1 표시"
    description: "order-processors Consumer Group을 화면에 표시합니다."
    effect: slideInRight
    duration: 1s

  step 7: show cg2
    name: "Consumer Group 2 표시"
    description: "analytics Consumer Group을 화면에 표시합니다."
    effect: slideInRight
    duration: 0.8s

  step 8: connect stream->cg1
    name: "CG1 XREADGROUP"
    description: "stream에서 cg1으로 메시지를 읽습니다."
    flow: particles
    speed: 1.5s

  step 9: connect stream->cg2
    name: "CG2 XREADGROUP"
    description: "stream에서 cg2로 독립적으로 메시지를 읽습니다."
    flow: particles
    speed: 1.5s

  step 10: highlight cg1, cg2
    name: "두 그룹 동시 강조"
    description: "cg1과 cg2를 동시에 강조합니다."
    color: #9C27B0
    glow: true
    duration: 2s

  step 11: show c1, c2
    name: "CG1 Consumer 표시"
    description: "consumer1, consumer2 노드를 화면에 표시합니다."
    effect: fadeIn
    stagger: 0.3s
    duration: 0.8s

  step 12: show c3
    name: "CG2 Consumer 표시"
    description: "consumer3 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 0.8s

  step 13: connect cg1->c1, cg1->c2
    name: "CG1 메시지 할당"
    description: "cg1에서 c1, c2로 메시지를 할당합니다."
    flow: arrow
    speed: 1s

  step 14: connect cg2->c3
    name: "CG2 메시지 할당"
    description: "cg2에서 c3으로 메시지를 할당합니다."
    flow: arrow
    speed: 1s

  step 15: highlight c1
    name: "Consumer 1 처리 중"
    description: "c1이 메시지를 처리합니다."
    color: #4CAF50
    pulse: true
    duration: 1s

  step 16: highlight c3
    name: "Consumer 3 처리 중"
    description: "c3이 메시지를 처리합니다."
    color: #4CAF50
    pulse: true
    duration: 1s

  step 17: connect c1->cg1
    name: "Consumer 1 XACK"
    description: "c1이 처리 완료 후 ACK를 보냅니다."
    flow: particles
    speed: 1s

  step 18: connect c3->cg2
    name: "Consumer 3 XACK"
    description: "c3이 처리 완료 후 ACK를 보냅니다."
    flow: particles
    speed: 1s

  step 19: show pel
    name: "PEL 표시"
    description: "PEL 노드를 화면에 표시합니다."
    effect: bounceIn
    duration: 1s

  step 20: connect c2->pel
    name: "Consumer 2 타임아웃"
    description: "c2에서 pel로 타임아웃 메시지가 이동합니다."
    flow: dash
    speed: 1.5s

  step 21: highlight pel
    name: "PEL 강조"
    description: "pel을 강조합니다."
    color: #FF9800
    glow: true
    duration: 1.5s

  step 22: show xclaim
    name: "XCLAIM 표시"
    description: "xclaim 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 1s

  step 23: connect pel->xclaim
    name: "XCLAIM 인수"
    description: "pel에서 xclaim으로 메시지를 인수합니다."
    flow: particles
    speed: 1.5s

  step 24: highlight xclaim
    name: "XCLAIM 강조"
    description: "xclaim을 강조합니다."
    color: #FF5722
    pulse: true
    duration: 1s

  step 25: connect xclaim->c1
    name: "c1에 재처리 위임"
    description: "xclaim에서 c1으로 재처리를 위임합니다."
    flow: particles
    speed: 1.5s

  step 26: connect c1->cg1
    name: "재처리 성공 XACK"
    description: "c1이 재처리 성공 후 ACK를 보냅니다."
    flow: particles
    speed: 1s

  step 27: show dead
    name: "Dead Letter 표시"
    description: "dead 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 1s

  step 28: connect pel->dead
    name: "재시도 초과"
    description: "pel에서 dead로 재시도 초과 메시지가 이동합니다."
    flow: dash
    speed: 1.5s

  step 29: highlight dead
    name: "Dead Letter 강조"
    description: "dead를 강조합니다."
    color: #F44336
    pulse: true
    duration: 1s

  step 30: camera fitAll
    name: "카메라 전체 맞춤"
    description: "전체 Redis Stream 흐름이 보이도록 카메라를 조정합니다."
    padding: 40px
    duration: 2s
@end

@style
  producer:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 3px

  stream:
    fill: #fce4ec
    stroke: #E91E63
    stroke-width: 3px

  cg1, cg2:
    fill: #f3e5f5
    stroke: #9C27B0
    stroke-width: 3px

  c1, c3:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 2px

  c2:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 2px

  pel:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 2px

  xclaim:
    fill: #fbe9e7
    stroke: #FF5722
    stroke-width: 2px

  dead:
    fill: #ffebee
    stroke: #F44336
    stroke-width: 3px
@end

@narration
  step 1:
    title: "Redis Stream이란?"
    text: "Redis Stream은 Redis 5.0에서 도입된 append-only 로그 자료구조입니다. 각 메시지는 '타임스탬프-시퀀스' 형식의 고유 ID(예: 1699001-0)를 자동으로 부여받습니다. 이 ID 덕분에 메시지는 항상 시간 순서로 정렬되고, 특정 시점부터 다시 읽는 것도 가능합니다."

  step 4:
    title: "XADD - 이벤트를 스트림에 기록"
    text: "Producer는 XADD 명령으로 메시지를 추가합니다. 예시: 'XADD order-events * event order_created order_id 123 user_id 456'. 여기서 별표(*)는 ID를 자동 생성하라는 의미입니다. 메시지는 삭제되지 않고 쌓이기 때문에, 나중에 언제든 다시 조회할 수 있습니다."

  step 5:
    title: "스트림 - 불변의 로그"
    text: "스트림 노드 안을 보면 메시지 ID와 데이터가 쌓여 있습니다. append-only이기 때문에 한 번 기록된 메시지는 수정되지 않습니다. MAXLEN 옵션으로 크기를 제한하거나 XDEL로 명시적으로 삭제할 수는 있지만, 일반적으로는 그대로 보존합니다."

  step 10:
    title: "Fan-out - Redis Stream의 핵심 차이"
    text: "두 개의 Consumer Group이 같은 스트림을 읽고 있습니다. order-processors는 1699002-0까지 처리했고, analytics는 아직 1699001-0까지입니다. 각 그룹이 last-delivered-id라는 자신만의 오프셋 커서를 독립적으로 관리합니다. 즉, 같은 메시지가 두 그룹 모두에 전달됩니다. 이것이 Redis Pub/Sub과의 결정적 차이입니다. Pub/Sub은 구독 시점에 없으면 메시지를 놓치지만, Stream은 언제든 특정 ID부터 다시 읽을 수 있습니다."

  step 13:
    title: "Consumer Group 내 메시지 분배"
    text: "같은 Group 안에서는 메시지가 분산됩니다. c1이 1699001-0을 처리하는 동안 c2가 1699002-0을 처리하는 식입니다. XREADGROUP GROUP order-processors consumer1 COUNT 1 STREAMS order-events > 여기서 '>'는 이 그룹에서 아직 전달하지 않은 새 메시지를 가져오라는 특수 ID입니다. Group 내에서는 중복 전달이 없습니다."

  step 17:
    title: "XACK - 처리 완료 확인"
    text: "메시지를 성공적으로 처리한 후 반드시 XACK를 보내야 합니다. 예시: 'XACK order-events order-processors 1699001-0'. ACK를 받으면 그 메시지는 PEL에서 제거됩니다. ACK를 보내지 않으면 Redis는 그 메시지가 아직 처리 중이라고 간주합니다. 이 ACK 메커니즘이 at-least-once 처리를 보장하는 핵심입니다."

  step 21:
    title: "PEL - 미확인 메시지 추적소"
    text: "PEL(Pending Entries List)은 전달됐지만 ACK를 받지 못한 메시지 목록입니다. c2가 메시지를 받아갔지만 32초가 지나도록 ACK를 보내지 않았습니다. 이는 c2가 죽었거나 처리 중 예외가 발생했음을 의미합니다. XPENDING 명령으로 PEL을 조회할 수 있습니다: 'XPENDING order-events order-processors - + 10'."

  step 23:
    title: "XCLAIM - 죽은 Consumer의 메시지 인수"
    text: "XCLAIM은 PEL에서 특정 시간 이상 방치된 메시지를 다른 Consumer가 가져오는 명령입니다. 예시: 'XCLAIM order-events order-processors consumer1 30000 1699002-0'. 30000ms(30초) 이상 처리되지 않은 메시지를 consumer1에게 넘깁니다. Redis 6.2부터는 XAUTOCLAIM으로 자동화도 가능합니다."

  step 26:
    title: "재처리 성공 - 복구 완료"
    text: "c1이 XCLAIM으로 받은 메시지를 성공적으로 처리하고 XACK를 보냈습니다. 이로써 1699002-0 메시지는 PEL에서 완전히 제거됩니다. 이 흐름이 Redis Stream의 장애 복구 메커니즘입니다. 컨슈머가 갑자기 죽어도 메시지가 유실되지 않는 이유입니다."

  step 29:
    title: "Dead Letter - 최후의 안전망"
    text: "같은 메시지를 여러 번 재시도해도 계속 실패한다면 무한 루프를 방지하기 위해 별도의 스트림으로 분리합니다. Redis 자체 기능은 아니고 애플리케이션 레벨에서 구현합니다. PEL을 XPENDING으로 조회해서 delivery-count가 일정 횟수를 넘으면 XADD my-stream-dead로 이동시키는 로직을 별도로 작성해야 합니다."

  step 30:
    title: "전체 흐름 정리 - Redis Stream vs Kafka"
    text: "정리하면: Producer는 XADD로 기록하고, 각 Consumer Group은 독립된 오프셋으로 Fan-out 읽기를 합니다. Group 내에서는 메시지가 분산되고, XACK로 처리를 확인하며, 실패 시 XCLAIM으로 복구합니다. Kafka와 비교하면 Redis Stream은 설정이 간단하고 레이턴시가 낮습니다. 다만 Kafka는 파티션 기반 병렬 처리와 대용량에 더 강합니다. 이미 Redis를 쓰고 있다면 추가 인프라 없이 스트림 처리를 구현할 수 있다는 것이 가장 큰 장점입니다."
@end

@config
  autoplay: true
  loop: false
  speed: 1.0
  tts: true
  tts-voice: Kyunghoon, InJoon, ko-KR
@end`,
};
