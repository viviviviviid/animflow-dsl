import type { Template } from "./index";

export const networkTopologyTemplate: Template = {
  name: "네트워크 토폴로지",
  description: "화살표 없는 선으로 표현하는 네트워크 구조",
  dsl: `flowchart LR
  server[메인 서버]
  db[(데이터베이스)]
  cache[캐시 서버]
  client1[클라이언트 A]
  client2[클라이언트 B]
  lb([로드밸런서])

  client1 --- lb
  client2 --- lb
  lb --- server
  server --- db
  server --- cache

@animation
  step 1: show lb
    name: "로드밸런서 표시"
    description: "lb 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 1s

  step 2: highlight lb
    name: "로드밸런서 강조"
    description: "lb를 강조합니다."
    color: #FF9800
    glow: true
    duration: 1s

  step 3: show client1, client2
    name: "클라이언트 표시"
    description: "client1, client2 노드를 화면에 표시합니다."
    effect: slideInLeft
    stagger: 0.3s
    duration: 1s

  step 4: connect client1->lb, client2->lb
    name: "클라이언트-LB 연결"
    description: "클라이언트들을 로드밸런서에 연결합니다."
    flow: particles
    speed: 1.5s

  step 5: show server
    name: "서버 표시"
    description: "server 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 1s

  step 6: connect lb->server
    name: "LB-서버 연결"
    description: "로드밸런서에서 서버로 연결합니다."
    flow: particles
    speed: 1.5s

  step 7: highlight server
    name: "서버 강조"
    description: "server를 강조합니다."
    color: #4CAF50
    pulse: true
    duration: 1s

  step 8: show db, cache
    name: "DB/캐시 표시"
    description: "db, cache 노드를 화면에 표시합니다."
    effect: bounceIn
    stagger: 0.3s
    duration: 1s

  step 9: connect server->db, server->cache
    name: "서버-스토리지 연결"
    description: "서버에서 DB와 캐시로 연결합니다."
    flow: particles
    speed: 1.5s

  step 10: highlight db, cache
    name: "스토리지 강조"
    description: "DB와 캐시를 강조합니다."
    color: #9C27B0
    glow: true
    stagger: 0.2s
    duration: 1.5s

  step 11: camera fitAll
    name: "카메라 전체 맞춤"
    description: "전체 네트워크가 보이도록 카메라를 조정합니다."
    padding: 50px
    duration: 1.5s
@end

@style
  client1, client2:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 2px

  lb:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 3px

  server:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px

  db:
    fill: #f3e5f5
    stroke: #9C27B0
    stroke-width: 2px

  cache:
    fill: #fce4ec
    stroke: #E91E63
    stroke-width: 2px
@end

@narration
  step 1:
    title: "로드밸런서 - 교통 경찰"
    text: "로드밸런서는 마치 교통 경찰과 같습니다. 여러 클라이언트의 요청이 들어오면 서버가 과부하되지 않도록 균등하게 분산시킵니다."

  step 3:
    title: "다중 클라이언트"
    text: "현대의 서비스는 수천, 수백만의 사용자가 동시에 접속합니다. 각 사용자의 장치가 클라이언트이고, 모두가 같은 서버에 접근하려고 합니다."

  step 4:
    title: "양방향 연결"
    text: "점선(---)은 양방향 통신을 의미합니다. 클라이언트와 로드밸런서가 요청과 응답을 주고받습니다."

  step 6:
    title: "로드 분산"
    text: "로드밸런서는 들어온 요청을 여러 서버에 나눠서 보냅니다. 예를 들어 A는 서버1, B는 서버2, C는 서버3으로 보내는 식이죠. (여기서는 간단하게 한 개 서버지만)"

  step 7:
    title: "백엔드 서버"
    text: "실제 일을 처리하는 서버입니다. 로드밸런서로부터 받은 요청을 처리하고 데이터베이스에서 정보를 가져와 응답합니다."

  step 10:
    title: "스토리지 계층"
    text: "데이터베이스는 영구적인 데이터를 저장하고, 캐시는 자주 사용하는 데이터를 빠르게 반환합니다. 가능한 많은 요청을 캐시에서 처리해서 데이터베이스의 부담을 줄입니다."
@end

@config
  autoplay: true
  loop: false
  controls: true
  speed: 1.0
@end`,
};
