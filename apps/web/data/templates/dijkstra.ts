import type { Template } from "./index";

export const dijkstraTemplate: Template = {
  name: "다익스트라 알고리즘",
  description: "최단 경로를 찾아가는 다익스트라 알고리즘의 동작 원리",
  dsl: `flowchart LR
  A([A · 출발])
  B[B]
  C[C]
  D[D]
  E[E]
  F[F]
  G([G · 도착])

  A -->|4| B
  A -->|2| C
  A -->|7| D
  B -->|3| D
  B -->|5| E
  C -->|1| D
  C -->|4| F
  D -->|2| E
  D -->|3| F
  E -->|1| G
  F -->|2| G

@animation
  step 1: show A, B, C, D, E, F, G
    name: "그래프 전체 표시"
    description: "다익스트라 알고리즘을 실행할 가중치 그래프를 표시합니다."
    effect: fadeIn
    stagger: 0.15s
    duration: 1s

  step 2: highlight A
    name: "출발 노드 선택"
    description: "출발 노드 A를 선택합니다. A의 거리는 0, 나머지는 모두 ∞로 초기화합니다."
    color: #2196F3
    glow: true
    duration: 1s

  step 3: connect A->B, A->C, A->D
    name: "A의 인접 간선 탐색"
    description: "A에서 나가는 간선을 모두 확인합니다: A→B(4), A→C(2), A→D(7)"
    flow: particles
    speed: 1.2s

  step 4: highlight B, C, D
    name: "거리 업데이트: B=4, C=2, D=7"
    description: "A로부터의 거리를 계산합니다. B=4, C=2, D=7로 업데이트합니다."
    color: #FF9800
    pulse: true
    duration: 1s

  step 5: unhighlight B, D
    name: "B, D 임시 대기"
    description: "아직 최단 거리가 확정되지 않은 노드들입니다."
    duration: 0.5s

  step 6: highlight C
    name: "C 방문 — 거리 2로 최소"
    description: "미방문 노드 중 거리가 가장 작은 C(거리=2)를 다음 방문 노드로 선택합니다."
    color: #4CAF50
    glow: true
    duration: 1s

  step 7: connect C->D, C->F
    name: "C의 인접 간선 탐색"
    description: "C에서 나가는 간선을 확인합니다: C→D(1), C→F(4)"
    flow: particles
    speed: 1.2s

  step 8: highlight D, F
    name: "거리 업데이트: D=3, F=6"
    description: "C를 거치면 D까지 2+1=3 (기존 7보다 작아 갱신!), F까지 2+4=6으로 업데이트합니다."
    color: #FF9800
    pulse: true
    duration: 1s

  step 9: highlight A, C
    name: "A, C 확정"
    description: "A(0)와 C(2)의 최단 거리가 확정되었습니다."
    color: #4CAF50
    glow: true
    duration: 0.8s

  step 10: unhighlight D, F
    name: "D, F 임시 대기"
    description: "D=3, F=6 — 아직 더 짧은 경로가 있을 수 있습니다."
    duration: 0.5s

  step 11: highlight D
    name: "D 방문 — 거리 3으로 최소"
    description: "미방문 노드 중 거리가 가장 작은 D(거리=3)를 선택합니다. B(4)보다 작습니다."
    color: #4CAF50
    glow: true
    duration: 1s

  step 12: connect D->E, D->F
    name: "D의 인접 간선 탐색"
    description: "D에서 나가는 간선을 확인합니다: D→E(2), D→F(3)"
    flow: particles
    speed: 1.2s

  step 13: highlight E, F
    name: "거리 업데이트: E=5, F=6(유지)"
    description: "E까지 3+2=5 (기존 ∞보다 작아 갱신!), F까지 3+3=6 (기존 6과 같아 유지)."
    color: #FF9800
    pulse: true
    duration: 1s

  step 14: highlight A, C, D
    name: "A, C, D 확정"
    description: "D(3)의 최단 거리도 확정되었습니다."
    color: #4CAF50
    glow: true
    duration: 0.8s

  step 15: highlight B
    name: "B 방문 — 거리 4"
    description: "미방문 노드 중 거리가 가장 작은 B(거리=4)를 선택합니다."
    color: #4CAF50
    glow: true
    duration: 1s

  step 16: connect B->D, B->E
    name: "B의 인접 간선 탐색"
    description: "B에서 나가는 간선을 확인합니다: B→D(3), B→E(5)"
    flow: particles
    speed: 1.2s

  step 17: highlight D, E
    name: "D, E 재검토 — 갱신 없음"
    description: "D까지 4+3=7 (기존 3보다 큼, 유지), E까지 4+5=9 (기존 5보다 큼, 유지). 갱신 없음!"
    color: #9E9E9E
    pulse: true
    duration: 1s

  step 18: unhighlight D, E
    name: "갱신 없음 확인"
    description: "B를 통한 경로가 더 길므로 기존 거리를 유지합니다."
    duration: 0.5s

  step 19: highlight A, C, D, B
    name: "A, C, D, B 확정"
    description: "B(4)의 최단 거리도 확정되었습니다."
    color: #4CAF50
    glow: true
    duration: 0.8s

  step 20: highlight E
    name: "E 방문 — 거리 5"
    description: "미방문 노드 중 거리가 가장 작은 E(거리=5)를 선택합니다."
    color: #4CAF50
    glow: true
    duration: 1s

  step 21: connect E->G
    name: "E의 인접 간선 탐색"
    description: "E에서 나가는 간선을 확인합니다: E→G(1)"
    flow: particles
    speed: 1.2s

  step 22: highlight G
    name: "거리 업데이트: G=6"
    description: "G까지 5+1=6으로 업데이트합니다."
    color: #FF9800
    pulse: true
    duration: 1s

  step 23: highlight F
    name: "F 방문 — 거리 6"
    description: "미방문 노드 중 F(거리=6)를 선택합니다. G와 같은 거리이지만 F를 먼저 처리합니다."
    color: #4CAF50
    glow: true
    duration: 1s

  step 24: connect F->G
    name: "F의 인접 간선 탐색"
    description: "F에서 나가는 간선을 확인합니다: F→G(2)"
    flow: particles
    speed: 1.2s

  step 25: highlight G
    name: "G 재검토: 6+2=8 > 6, 유지"
    description: "F를 통하면 6+2=8이지만 기존 6이 더 작습니다. 갱신 없음!"
    color: #9E9E9E
    pulse: true
    duration: 1s

  step 26: highlight A, C, D, B, E, F, G
    name: "모든 노드 확정"
    description: "모든 노드의 최단 거리가 확정되었습니다: A=0, C=2, D=3, B=4, E=5, F=6, G=6"
    color: #4CAF50
    glow: true
    duration: 1s

  step 27: unhighlight A, B, C, D, E, F, G
    name: "강조 초기화"
    description: "최단 경로를 시각적으로 추적합니다."
    duration: 0.5s

  step 28: highlight A, C, F, G
    name: "최단 경로 1: A→C→F→G (거리 8)"
    description: "G에 도달하는 경로 중 하나: A→C(2)→F(6)→G(8). 하지만 최단은 아닙니다."
    color: #9C27B0
    glow: true
    duration: 1s

  step 29: connect A->C, C->F, F->G
    name: "경로 A→C→F→G 표시"
    description: "이 경로의 총 가중치는 2+4+2=8입니다."
    flow: glow
    speed: 1.5s

  step 30: unhighlight A, C, F, G
    name: "강조 초기화"
    description: "더 짧은 경로를 확인합니다."
    duration: 0.5s

  step 31: highlight A, C, D, E, G
    name: "최단 경로 2: A→C→D→E→G (거리 6)"
    description: "A→C(2)→D(3)→E(5)→G(6). 이것이 진짜 최단 경로입니다!"
    color: #F44336
    glow: true
    duration: 1s

  step 32: connect A->C, C->D, D->E, E->G
    name: "최단 경로 A→C→D→E→G 강조"
    description: "총 가중치 2+1+2+1=6, 다익스트라가 찾은 최단 경로입니다!"
    flow: lightning
    speed: 1.5s

  step 33: camera fitAll
    name: "전체 결과 보기"
    description: "다익스트라 알고리즘 완료! 최단 경로: A→C→D→E→G, 거리=6"
    padding: 60px
    duration: 1.2s
@end

@style
  A:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 3px
  B:
    fill: #fafafa
    stroke: #9E9E9E
    stroke-width: 2px
  C:
    fill: #fafafa
    stroke: #9E9E9E
    stroke-width: 2px
  D:
    fill: #fafafa
    stroke: #9E9E9E
    stroke-width: 2px
  E:
    fill: #fafafa
    stroke: #9E9E9E
    stroke-width: 2px
  F:
    fill: #fafafa
    stroke: #9E9E9E
    stroke-width: 2px
  G:
    fill: #fce4ec
    stroke: #E91E63
    stroke-width: 3px
@end

@narration
  step 1:
    title: "다익스트라 알고리즘이란?"
    text: "다익스트라(Dijkstra) 알고리즘은 하나의 출발점에서 다른 모든 노드까지의 최단 경로를 찾는 알고리즘입니다. 음수 가중치가 없는 그래프에서 동작하며, 네비게이션·네트워크 라우팅 등에 널리 쓰입니다."

  step 2:
    title: "초기화"
    text: "출발 노드 A의 거리를 0으로 설정하고, 나머지 모든 노드(B, C, D, E, F, G)는 아직 도달하지 못했으므로 무한대(∞)로 초기화합니다. 방문하지 않은 노드 집합에 모든 노드를 넣습니다."

  step 3:
    title: "A의 이웃 탐색"
    text: "현재 노드 A에서 연결된 모든 간선을 확인합니다. A→B(가중치 4), A→C(가중치 2), A→D(가중치 7). 이 가중치들이 현재 알려진 최단 거리 후보입니다."

  step 4:
    title: "거리 테이블 업데이트"
    text: "계산 결과: B=0+4=4, C=0+2=2, D=0+7=7. 기존에 ∞였던 값들보다 모두 작으므로 전부 갱신합니다. 현재 거리 테이블: A=0, B=4, C=2, D=7, E=∞, F=∞, G=∞"

  step 6:
    title: "다음 방문 노드 선택 — C"
    text: "핵심 규칙: 미방문 노드 중 거리가 가장 작은 노드를 선택합니다. 현재 B=4, C=2, D=7 중 C(거리 2)가 가장 작습니다. C를 방문하고, C의 최단 거리(2)는 이제 확정됩니다."

  step 7:
    title: "C의 이웃 탐색"
    text: "C에서 연결된 간선을 확인합니다. C→D(가중치 1), C→F(가중치 4). C를 거쳐 가면 D까지 2+1=3, F까지 2+4=6입니다."

  step 8:
    title: "더 짧은 경로 발견!"
    text: "D의 기존 거리는 7이었는데, C를 거치면 3으로 훨씬 줄어듭니다! 이것이 다익스트라의 핵심인 '완화(Relaxation)' 작업입니다. D=3으로 갱신, F=6으로 신규 등록. 거리 테이블: A=0, B=4, C=2✓, D=3, E=∞, F=6, G=∞"

  step 11:
    title: "다음 방문 노드 선택 — D"
    text: "미방문 노드: B=4, D=3, E=∞, F=6, G=∞. 가장 작은 D(거리 3)를 선택합니다. D의 최단 거리(3)가 확정됩니다. 경로: A→C→D"

  step 12:
    title: "D의 이웃 탐색"
    text: "D에서 연결된 간선: D→E(가중치 2), D→F(가중치 3). D를 거치면 E까지 3+2=5, F까지 3+3=6입니다."

  step 13:
    title: "E 갱신, F 동일"
    text: "E의 기존 거리 ∞보다 5가 작으므로 E=5로 갱신. F는 기존 6과 동일하므로 유지. 거리 테이블: A=0, B=4, C=2✓, D=3✓, E=5, F=6, G=∞"

  step 15:
    title: "다음 방문 노드 선택 — B"
    text: "미방문 노드: B=4, E=5, F=6, G=∞. 가장 작은 B(거리 4)를 선택합니다. B의 최단 거리(4)가 확정됩니다. 경로: A→B"

  step 17:
    title: "B를 통한 경로는 더 길다"
    text: "B→D: 4+3=7 vs 기존 D=3 → 유지. B→E: 4+5=9 vs 기존 E=5 → 유지. B를 통한 경로는 이미 찾은 경로보다 모두 길어서 갱신이 일어나지 않습니다."

  step 20:
    title: "다음 방문 노드 선택 — E"
    text: "미방문 노드: E=5, F=6, G=∞. 가장 작은 E(거리 5)를 선택합니다. E의 최단 거리(5)가 확정됩니다. 경로: A→C→D→E"

  step 22:
    title: "도착점 G 발견!"
    text: "E→G(가중치 1): 5+1=6으로 G에 처음 도달합니다. 거리 테이블: A=0, B=4✓, C=2✓, D=3✓, E=5✓, F=6, G=6"

  step 23:
    title: "다음 방문 노드 선택 — F"
    text: "미방문 노드: F=6, G=6. F와 G가 동일한 거리이지만 F를 먼저 처리합니다. F의 최단 거리(6)가 확정됩니다. 경로: A→C→F"

  step 25:
    title: "F를 통한 G 경로 검토"
    text: "F→G(가중치 2): 6+2=8 vs 기존 G=6 → 유지. F를 통해 G에 가는 것보다 E를 통하는 것이 더 짧습니다. 갱신 없음."

  step 26:
    title: "알고리즘 완료!"
    text: "모든 노드의 최단 거리가 확정되었습니다. 최종 거리 테이블: A=0, B=4, C=2, D=3, E=5, F=6, G=6. G까지의 최단 거리는 6입니다!"

  step 28:
    title: "경로 역추적 — 후보 경로"
    text: "최단 경로를 찾으려면 도착점 G에서 역방향으로 추적합니다. G(6)에 도달하는 방법: E(5)+1=6 또는 F(6)+2=8. E를 통하는 것이 더 짧습니다."

  step 31:
    title: "최단 경로 발견!"
    text: "역추적 결과: G←E(5)←D(3)←C(2)←A(0). 즉 순방향으로 A→C→D→E→G. 총 가중치: 2+1+2+1=6. 이것이 A에서 G까지의 최단 경로입니다!"

  step 32:
    title: "다익스트라 알고리즘 정리"
    text: "다익스트라는 '탐욕적(Greedy)' 방법으로 항상 현재 가장 가까운 노드를 선택합니다. 시간 복잡도는 O((V+E) log V)이며, 우선순위 큐(Priority Queue)를 사용하면 효율적으로 구현할 수 있습니다."
@end

@config
  autoplay: false
  loop: false
  speed: 1.0
  controls: true
  tts: true
  tts-voice: Kyunghoon, InJoon, ko-KR
@end`,
};
