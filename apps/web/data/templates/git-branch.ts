import type { Template } from "./index";

export const gitBranchTemplate: Template = {
  name: "Git 브랜치 전략",
  description: "Git 브랜치 생성과 병합 과정",
  dsl: `flowchart LR
  init([Git Init])
  c1[Commit 1]
  c2[Commit 2]
  c3[Commit 3]

  branch[Feature Branch]
  f1[Feature Commit 1]
  f2[Feature Commit 2]

  merge[Merge]
  c4[Commit 4]
  c5[Release]

  init --> c1
  c1 --> c2
  c2 --> c3
  c2 --> branch
  branch --> f1
  f1 --> f2
  c3 --> merge
  f2 --> merge
  merge --> c4
  c4 --> c5

@animation
  step 1: show init
    name: "저장소 초기화 표시"
    description: "init 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 1s

  step 2: highlight init
    name: "초기화 강조"
    description: "init 노드를 강조합니다."
    color: #4CAF50
    glow: true
    duration: 1s

  step 3: connect init->c1
    name: "초기 커밋 연결"
    description: "init에서 c1으로 흐름을 연결합니다."
    flow: arrow
    speed: 1s

  step 4: show c1
    name: "Commit 1 표시"
    description: "c1 노드를 화면에 표시합니다."
    effect: bounceIn
    duration: 1s

  step 5: highlight c1
    name: "Commit 1 강조"
    description: "c1 커밋을 강조합니다."
    color: #2196F3
    pulse: true
    duration: 1s

  step 6: connect c1->c2
    name: "Commit 1에서 2 연결"
    description: "c1에서 c2로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 7: show c2
    name: "Commit 2 표시"
    description: "c2 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 1s

  step 8: highlight c2
    name: "Commit 2 강조"
    description: "c2 커밋을 강조합니다."
    color: #2196F3
    pulse: true
    duration: 1s

  step 9: connect c2->c3
    name: "Commit 2에서 3 연결"
    description: "c2에서 c3로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 10: show c3
    name: "Commit 3 표시"
    description: "c3 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 1s

  step 11: connect c2->branch
    name: "브랜치 분기 연결"
    description: "c2에서 branch로 분기 흐름을 연결합니다."
    flow: arrow
    speed: 1s

  step 12: show branch
    name: "Feature 브랜치 표시"
    description: "branch 노드를 화면에 표시합니다."
    effect: slideInTop
    duration: 1s

  step 13: highlight branch
    name: "Feature 브랜치 강조"
    description: "branch 노드를 강조합니다."
    color: #FF9800
    glow: true
    duration: 1s

  step 14: connect branch->f1
    name: "Feature Commit1 연결"
    description: "branch에서 f1으로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 15: show f1
    name: "Feature Commit1 표시"
    description: "f1 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 1s

  step 16: highlight f1
    name: "Feature Commit1 강조"
    description: "f1 노드를 강조합니다."
    color: #FF9800
    pulse: true
    duration: 1s

  step 17: connect f1->f2
    name: "Feature Commit2 연결"
    description: "f1에서 f2로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 18: show f2
    name: "Feature Commit2 표시"
    description: "f2 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 1s

  step 19: show merge
    name: "머지 노드 표시"
    description: "merge 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 1s

  step 20: connect c3->merge, f2->merge
    name: "머지 경로 연결"
    description: "main과 feature 경로를 merge로 연결합니다."
    flow: particles
    speed: 1.5s

  step 21: highlight merge
    name: "머지 강조"
    description: "merge 단계를 강조합니다."
    color: #4CAF50
    flash: true
    duration: 1.5s

  step 22: connect merge->c4
    name: "머지 후 커밋 연결"
    description: "merge에서 c4로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 23: show c4
    name: "Commit 4 표시"
    description: "c4 노드를 화면에 표시합니다."
    effect: bounceIn
    duration: 1s

  step 24: connect c4->c5
    name: "릴리스 전 연결"
    description: "c4에서 c5로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 25: show c5
    name: "릴리스 노드 표시"
    description: "c5 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 1s

  step 26: highlight c5
    name: "릴리스 강조"
    description: "c5 노드를 강조합니다."
    color: #4CAF50
    glow: true
    duration: 1.5s

  step 27: camera fitAll
    name: "카메라 전체 맞춤"
    description: "전체 브랜치 흐름이 보이도록 카메라를 조정합니다."
    padding: 50px
    duration: 2s
@end

@style
  init:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px

  c1, c2, c3, c4, c5:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 2px

  branch, f1, f2:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 2px

  merge:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px
@end

@narration
  step 1:
    title: "Git 저장소 생성"
    text: "'git init' 명령어로 새 저장소를 만듭니다. 이 순간부터 Git이 파일의 모든 변경 사항을 추적하기 시작합니다. 마치 일기장을 새로 펴는 것과 같죠."

  step 2:
    title: "버전 관리의 시작"
    text: "Git은 파일의 '스냅샷'을 찍어 저장하는 도구입니다. 언제든 과거의 모습으로 돌아갈 수 있어요."

  step 5:
    title: "첫 번째 커밋"
    text: "커밋(Commit)은 변경 사항을 저장하는 행위입니다. '이 시점의 코드를 기억해 둬'라고 Git에게 말하는 것과 같습니다. 각 커밋에는 고유한 ID(해시)가 부여됩니다."

  step 8:
    title: "Main 브랜치 진행"
    text: "Main(또는 Master) 브랜치는 프로젝트의 '공식 버전'입니다. 여기에 직접 작업하지 않고, 별도의 브랜치에서 작업한 뒤 합칩니다."

  step 12:
    title: "Feature 브랜치 생성"
    text: "'git branch feature'로 새 브랜치를 만듭니다. 브랜치는 '평행 우주'와 같아서, Main의 코드를 복사해서 독립적으로 작업할 수 있습니다. 실패해도 Main에는 영향이 없죠."

  step 13:
    title: "브랜치의 장점"
    text: "여러 개발자가 동시에 다른 기능을 개발할 수 있습니다. A는 로그인 기능, B는 결제 기능을 각자의 브랜치에서 독립적으로 작업합니다."

  step 16:
    title: "Feature에서 작업하기"
    text: "Feature 브랜치에서 자유롭게 코드를 수정하고 커밋합니다. 실험적인 코드도 부담 없이 시도할 수 있습니다."

  step 20:
    title: "브랜치 병합 (Merge)"
    text: "Feature 개발이 완료되면 Main 브랜치에 합칩니다(Merge). Git이 양쪽의 변경 사항을 자동으로 합쳐주지만, 같은 줄을 수정했다면 '충돌(Conflict)'이 발생할 수 있습니다."

  step 21:
    title: "Merge 완료"
    text: "성공적으로 병합되면 Merge 커밋이 생성됩니다. 이 커밋은 두 브랜치의 역사를 모두 포함합니다."

  step 26:
    title: "릴리스"
    text: "병합이 완료되고 테스트를 통과하면 릴리스합니다. 이것이 Git Flow의 기본 패턴입니다. 실제로는 develop, release, hotfix 등 더 많은 브랜치 전략을 사용하기도 합니다."
@end

@config
  autoplay: true
  loop: false
  speed: 1.0
@end`,
};
