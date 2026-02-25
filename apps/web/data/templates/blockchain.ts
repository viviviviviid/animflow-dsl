import type { Template } from "./index";

export const blockchainTemplate: Template = {
  name: "블록체인 기본 구조",
  description: "블록체인의 기본 구조와 체인 연결 원리",
  dsl: `flowchart LR
  genesis([Genesis Block])
  block1[Block #1]
  block2[Block #2]
  block3[Block #3]

  genesis --> block1
  block1 --> block2
  block2 --> block3

@animation
  step 1: show genesis
    name: "Genesis 표시"
    description: "genesis 노드를 화면에 표시합니다."
    duration: 1.5s
    effect: fadeIn

  step 2: highlight genesis
    name: "Genesis 강조"
    description: "genesis 노드를 강조 표시합니다."
    color: #4CAF50
    glow: true
    duration: 1s

  step 3: connect genesis->block1
    name: "Genesis에서 Block1 연결"
    description: "genesis에서 block1으로 흐름을 연결합니다."
    flow: particles
    speed: 2s

  step 4: show block1
    name: "Block1 표시"
    description: "block1 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 1s

  step 5: highlight block1
    name: "Block1 강조"
    description: "block1 노드를 강조 표시합니다."
    color: #FF9800
    pulse: true
    duration: 1s

  step 6: connect block1->block2
    name: "Block1에서 Block2 연결"
    description: "block1에서 block2로 흐름을 연결합니다."
    flow: particles
    speed: 2s

  step 7: show block2
    name: "Block2 표시"
    description: "block2 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 1s

  step 8: highlight block2
    name: "Block2 강조"
    description: "block2 노드를 강조 표시합니다."
    color: #FF9800
    pulse: true
    duration: 1s

  step 9: connect block2->block3
    name: "Block2에서 Block3 연결"
    description: "block2에서 block3으로 흐름을 연결합니다."
    flow: particles
    speed: 2s

  step 10: show block3
    name: "Block3 표시"
    description: "block3 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 1s

  step 11: highlight block3
    name: "Block3 강조"
    description: "block3 노드를 강조 표시합니다."
    color: #FF9800
    pulse: true
    duration: 1s

  step 12: camera fitAll
    name: "카메라 전체 맞춤"
    description: "전체 다이어그램이 보이도록 카메라를 조정합니다."
    padding: 50px
    duration: 1.5s
@end

@style
  genesis:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px

  block1, block2, block3:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 2px
@end

@narration
  step 1:
    title: "Genesis Block - 최초의 블록"
    text: "블록체인은 항상 'Genesis Block(제네시스 블록)'이라는 첫 번째 블록에서 시작합니다. 이 블록은 마치 족보의 시조와 같은 역할을 합니다. 이전 블록이 없기 때문에 특별한 블록이죠."

  step 2:
    title: "Genesis Block의 특별함"
    text: "Genesis Block은 블록체인 네트워크가 처음 만들어질 때 단 한 번만 생성됩니다. 비트코인의 경우 2009년 1월 3일에 사토시 나카모토가 만들었죠."

  step 3:
    title: "해시로 연결되는 체인"
    text: "블록과 블록 사이의 화살표는 '해시 연결'을 의미합니다. 마치 퍼즐 조각처럼, 각 블록은 이전 블록의 '지문(해시값)'을 가지고 있어요. 누군가 중간 블록을 몰래 바꾸면 지문이 달라져서 바로 들통납니다."

  step 5:
    title: "Block #1 - 첫 번째 거래 기록"
    text: "Block #1에는 Genesis Block 이후 첫 번째 거래들이 기록됩니다. 이 블록 안에는 Genesis Block의 해시값이 저장되어 있어서, 두 블록이 단단히 연결됩니다."

  step 7:
    title: "Block #2 - 체인이 길어진다"
    text: "새로운 블록이 추가될수록 체인은 점점 길어집니다. 블록이 많이 쌓일수록 과거 기록을 위조하기 어려워지는데, 하나를 바꾸면 그 뒤의 모든 블록을 다시 계산해야 하기 때문입니다."

  step 9:
    title: "Block #3 - 계속 성장하는 체인"
    text: "블록체인은 이렇게 계속 새 블록을 연결하며 성장합니다. 비트코인은 약 10분마다, 이더리움은 약 12초마다 새 블록이 만들어집니다."

  step 11:
    title: "블록체인 완성"
    text: "이것이 블록체인의 핵심 원리입니다! 블록들이 해시값으로 체인처럼 연결되어 있어서, 한 번 기록된 정보는 사실상 변경이 불가능합니다. 이 '불변성'이 블록체인을 신뢰할 수 있게 만드는 비결이죠."
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
