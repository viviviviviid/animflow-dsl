import type { Template } from "./index";

export const simpleTemplate: Template = {
  name: "간단한 예제",
  description: "시작하기 좋은 간단한 예제",
  dsl: `flowchart LR
  A[시작]
  B[처리]
  C[종료]

  A --> B
  B --> C

@animation
  step 1: show A
    name: "시작 노드 표시"
    description: "A 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 1s

  step 2: highlight A
    name: "시작 강조"
    description: "A 노드를 강조합니다."
    color: #2196F3
    glow: true
    duration: 1s

  step 3: connect A->B
    name: "시작에서 처리 연결"
    description: "A에서 B로 흐름을 연결합니다."
    flow: particles
    speed: 1.5s

  step 4: show B
    name: "처리 노드 표시"
    description: "B 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 1s

  step 5: highlight B
    name: "처리 강조"
    description: "B 노드를 강조합니다."
    color: #FF9800
    pulse: true
    duration: 1s

  step 6: connect B->C
    name: "처리에서 종료 연결"
    description: "B에서 C로 흐름을 연결합니다."
    flow: particles
    speed: 1.5s

  step 7: show C
    name: "종료 노드 표시"
    description: "C 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 1s

  step 8: highlight C
    name: "종료 강조"
    description: "C 노드를 강조합니다."
    color: #4CAF50
    glow: true
    duration: 1s
@end

@style
  A:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 3px
  B:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 3px
  C:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px
@end

@narration
  step 1:
    title: "프로세스의 시작"
    text: "모든 프로세스에는 시작점이 있습니다. 이곳에서 작업이 출발합니다."

  step 2:
    title: "시작 단계"
    text: "시작 노드가 활성화되었습니다. 여기서부터 데이터나 요청이 다음 단계로 흘러갑니다."

  step 3:
    title: "흐름의 이동"
    text: "화살표는 데이터나 작업이 한 단계에서 다음 단계로 이동하는 것을 보여줍니다. 프로세스는 항상 정해진 순서대로 진행됩니다."

  step 5:
    title: "처리 단계"
    text: "중간의 '처리' 단계에서 실제 작업이 이루어집니다. 예를 들어 데이터를 계산하거나, 요청을 처리하거나, 판단을 내리는 단계입니다."

  step 7:
    title: "종료 단계"
    text: "모든 처리가 완료되면 종료 단계에 도달합니다. 결과물이 만들어지고 프로세스가 마무리됩니다."

  step 8:
    title: "프로세스 완료"
    text: "이것이 가장 기본적인 프로세스 흐름입니다. 시작 → 처리 → 종료, 모든 복잡한 시스템도 이 기본 패턴의 조합으로 이루어져 있습니다."
@end

@config
  autoplay: true
  loop: false
  speed: 1.0
@end`,
};
