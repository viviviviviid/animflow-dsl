import type { Template } from "./index";

export const redisStreamTemplate: Template = {
  name: "Redis Stream Event Flow",
  description: "Complete Redis Stream flow from Fan-out, Consumer Group, to XCLAIM recovery",
  dsl: `flowchart LR
  producer[Producer<br/>Order Service]
  stream[("Redis Stream<br/>order-events<br/>─────────────<br/>1699001-0: order_created<br/>1699002-0: order_paid<br/>1699003-0: order_shipped")]

  cg1[Consumer Group<br/>order-processors<br/>last-id: 1699002-0]
  cg2[Consumer Group<br/>analytics<br/>last-id: 1699001-0]

  c1[Consumer 1<br/>Inventory Service]
  c2[Consumer 2<br/>Notification Service]
  c3[Consumer 3<br/>Analytics Service]

  pel[PEL<br/>Unconfirmed Messages<br/>1699002-0 → c2<br/>Elapsed: 32s]
  xclaim[XCLAIM<br/>c1 takes message]
  dead[Dead Letter<br/>my-stream-dead<br/>Retries exceeded 3 times]

  producer -->|XADD *| stream
  stream -->|XREADGROUP >| cg1
  stream -->|XREADGROUP >| cg2
  cg1 -->|Message Delivery| c1
  cg1 -->|Message Delivery| c2
  cg2 -->|Message Delivery| c3
  c1 -->|XACK| cg1
  c3 -->|XACK| cg2
  c2 -.->|Timeout / Processing Failure| pel
  pel -->|XCLAIM --min-idle-time 30000| xclaim
  xclaim -->|Reprocessing| c1
  c1 -->|XACK on Success| cg1
  pel -->|Retry Count Exceeded| dead

@animation
  step 1: show producer
    name: "Show Producer"
    description: "Display the Producer node on screen."
    effect: slideInLeft
    duration: 1s

  step 2: highlight producer
    name: "Highlight Producer"
    description: "Highlight the producer."
    color: #2196F3
    glow: true
    duration: 1s

  step 3: show stream
    name: "Show Redis Stream"
    description: "Display the Redis Stream node on screen."
    effect: scaleIn
    duration: 1s

  step 4: connect producer->stream
    name: "Publish XADD Event"
    description: "Add message from producer to stream."
    flow: particles
    speed: 1.5s

  step 5: highlight stream
    name: "Highlight Stream"
    description: "Highlight the stream."
    color: #E91E63
    pulse: true
    duration: 1.5s

  step 6: show cg1
    name: "Show Consumer Group 1"
    description: "Display the order-processors Consumer Group on screen."
    effect: slideInRight
    duration: 1s

  step 7: show cg2
    name: "Show Consumer Group 2"
    description: "Display the analytics Consumer Group on screen."
    effect: slideInRight
    duration: 0.8s

  step 8: connect stream->cg1
    name: "CG1 XREADGROUP"
    description: "Read messages from stream to cg1."
    flow: particles
    speed: 1.5s

  step 9: connect stream->cg2
    name: "CG2 XREADGROUP"
    description: "Read messages from stream to cg2 independently."
    flow: particles
    speed: 1.5s

  step 10: highlight cg1, cg2
    name: "Highlight Both Groups"
    description: "Highlight cg1 and cg2 simultaneously."
    color: #9C27B0
    glow: true
    duration: 2s

  step 11: show c1, c2
    name: "Show CG1 Consumers"
    description: "Display consumer1 and consumer2 nodes on screen."
    effect: fadeIn
    stagger: 0.3s
    duration: 0.8s

  step 12: show c3
    name: "Show CG2 Consumer"
    description: "Display consumer3 node on screen."
    effect: fadeIn
    duration: 0.8s

  step 13: connect cg1->c1, cg1->c2
    name: "CG1 Message Distribution"
    description: "Distribute messages from cg1 to c1 and c2."
    flow: arrow
    speed: 1s

  step 14: connect cg2->c3
    name: "CG2 Message Distribution"
    description: "Distribute messages from cg2 to c3."
    flow: arrow
    speed: 1s

  step 15: highlight c1
    name: "Processing - Consumer 1"
    description: "Consumer 1 processes the message."
    color: #4CAF50
    pulse: true
    duration: 1s

  step 16: highlight c3
    name: "Processing - Consumer 3"
    description: "Consumer 3 processes the message."
    color: #4CAF50
    pulse: true
    duration: 1s

  step 17: connect c1->cg1
    name: "Consumer 1 XACK"
    description: "Consumer 1 sends ACK after processing."
    flow: particles
    speed: 1s

  step 18: connect c3->cg2
    name: "Consumer 3 XACK"
    description: "Consumer 3 sends ACK after processing."
    flow: particles
    speed: 1s

  step 19: show pel
    name: "Show PEL"
    description: "Display the PEL node on screen."
    effect: bounceIn
    duration: 1s

  step 20: connect c2->pel
    name: "Consumer 2 Timeout"
    description: "Timeout message moves from c2 to pel."
    flow: dash
    speed: 1.5s

  step 21: highlight pel
    name: "Highlight PEL"
    description: "Highlight the pel."
    color: #FF9800
    glow: true
    duration: 1.5s

  step 22: show xclaim
    name: "Show XCLAIM"
    description: "Display the xclaim node on screen."
    effect: scaleIn
    duration: 1s

  step 23: connect pel->xclaim
    name: "XCLAIM Takeover"
    description: "Message taken over from pel to xclaim."
    flow: particles
    speed: 1.5s

  step 24: highlight xclaim
    name: "Highlight XCLAIM"
    description: "Highlight the xclaim."
    color: #FF5722
    pulse: true
    duration: 1s

  step 25: connect xclaim->c1
    name: "Reprocessing Delegation"
    description: "Delegate reprocessing from xclaim to c1."
    flow: particles
    speed: 1.5s

  step 26: connect c1->cg1
    name: "Successful Reprocessing XACK"
    description: "Consumer 1 sends ACK after successful reprocessing."
    flow: particles
    speed: 1s

  step 27: show dead
    name: "Show Dead Letter"
    description: "Display the dead letter node on screen."
    effect: fadeIn
    duration: 1s

  step 28: connect pel->dead
    name: "Retry Exceeded"
    description: "Message exceeding retry limit moves from pel to dead."
    flow: dash
    speed: 1.5s

  step 29: highlight dead
    name: "Highlight Dead Letter"
    description: "Highlight the dead letter."
    color: #F44336
    pulse: true
    duration: 1s

  step 30: camera fitAll
    name: "Camera Fit All"
    description: "Adjust camera to show entire Redis Stream flow."
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
    title: "What is Redis Stream?"
    text: "Redis Stream is an append-only log data structure introduced in Redis 5.0. Each message is automatically assigned a unique ID in 'timestamp-sequence' format (e.g., 1699001-0). Thanks to this ID, messages are always sorted in time order, and you can read from a specific point again."

  step 4:
    title: "XADD - Recording Events to Stream"
    text: "Producer adds messages with the XADD command. Example: 'XADD order-events * event order_created order_id 123 user_id 456'. The asterisk (*) means auto-generate the ID. Messages are not deleted but accumulated, so you can query them again later."

  step 5:
    title: "Stream - Immutable Log"
    text: "Inside the stream node, message IDs and data are accumulated. Because it's append-only, once recorded, messages are never modified. You can limit size with MAXLEN or explicitly delete with XDEL, but generally messages are preserved."

  step 10:
    title: "Fan-out - The Core Difference of Redis Stream"
    text: "Two Consumer Groups are reading the same stream. order-processors has processed up to 1699002-0, while analytics is still at 1699001-0. Each group independently manages its own last-delivered-id cursor. That is, the same message is delivered to both groups. This is the crucial difference from Redis Pub/Sub. Pub/Sub loses messages if they were published before subscription, but Stream allows reading from any ID anytime."

  step 13:
    title: "Message Distribution in Consumer Group"
    text: "Messages are distributed within the same Group. While c1 processes 1699001-0, c2 processes 1699002-0. XREADGROUP GROUP order-processors consumer1 COUNT 1 STREAMS order-events > Here, '>' is a special ID meaning 'get new undelivered messages for this group'. No duplicate delivery within a group."

  step 17:
    title: "XACK - Acknowledge Processing Complete"
    text: "After successfully processing a message, you must send XACK. Example: 'XACK order-events order-processors 1699001-0'. When ACK is received, the message is removed from PEL. If you don't send ACK, Redis considers the message still processing. This ACK mechanism is key to guaranteeing at-least-once processing."

  step 21:
    title: "PEL - Pending Message Tracking"
    text: "PEL (Pending Entries List) is the list of delivered but unacknowledged messages. Consumer 2 received the message but hasn't sent ACK even after 32 seconds. This means c2 died or an exception occurred. You can query PEL with XPENDING command: 'XPENDING order-events order-processors - + 10'."

  step 23:
    title: "XCLAIM - Taking Over Dead Consumer's Messages"
    text: "XCLAIM is a command for another Consumer to take over messages left unprocessed for a certain time in PEL. Example: 'XCLAIM order-events order-processors consumer1 30000 1699002-0'. Take over messages unprocessed for 30000ms (30s) and assign to consumer1. Since Redis 6.2, you can automate this with XAUTOCLAIM."

  step 26:
    title: "Successful Reprocessing - Recovery Complete"
    text: "Consumer 1 successfully processed the message received via XCLAIM and sent XACK. With this, message 1699002-0 is completely removed from PEL. This is Redis Stream's failure recovery mechanism. It's why messages aren't lost even when a consumer suddenly dies."

  step 29:
    title: "Dead Letter - Final Safety Net"
    text: "If the same message keeps failing after multiple retries, separate it to a different stream to prevent infinite loops. This isn't a Redis built-in feature; it's implemented at application level. You must write logic to query PEL with XPENDING, check delivery-count exceeds threshold, then XADD my-stream-dead to move it."

  step 30:
    title: "Complete Flow Summary - Redis Stream vs Kafka"
    text: "To summarize: Producer records with XADD, each Consumer Group does Fan-out reading with independent offset. Within a group, messages are distributed, processing confirmed with XACK, and failure recovery with XCLAIM. Compared to Kafka, Redis Stream is simpler to configure and has lower latency. However, Kafka is stronger in partition-based parallel processing and large volumes. The biggest advantage if you're already using Redis is implementing stream processing without additional infrastructure."
@end

@config
  autoplay: true
  loop: false
  speed: 1.0
  tts: true
  tts-voice: Kyunghoon, InJoon, ko-KR
@end`,
};
