import type { Template } from "./index";

export const zkSnarkTemplate: Template = {
  name: "zk-SNARK 증명 파이프라인",
  description: "계산에서 검증까지 zk-SNARK의 전체 과정",
  dsl: `flowchart TD
  computation[계산 문제<br/>f(x) = y]
  circuit[산술 회로<br/>Arithmetic Circuit]
  r1cs[R1CS<br/>Rank-1 Constraint System]
  qap[QAP<br/>Quadratic Arithmetic Program]
  setup([Trusted Setup<br/>MPC 세레모니])
  toxic{Toxic Waste<br/>반드시 폐기}
  pk[Proving Key]
  vk[Verification Key]
  witness[Witness<br/>비밀 입력값]
  public[Public Input<br/>공개 입력값]
  prover[Prover<br/>증명 생성]
  proof[zk-Proof<br/>간결한 증명]
  verifier{Verifier<br/>증명 검증}
  accept([Accept<br/>참])
  reject([Reject<br/>거짓])

  computation --> circuit
  circuit --> r1cs
  r1cs --> qap
  qap --> setup
  setup --> toxic
  setup --> pk
  setup --> vk
  witness --> prover
  public --> prover
  pk --> prover
  prover --> proof
  proof --> verifier
  vk --> verifier
  public --> verifier
  verifier -->|Valid| accept
  verifier -->|Invalid| reject

@animation
  step 1: show computation
    name: "계산 문제 정의"
    description: "computation 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 1s

  step 2: highlight computation
    name: "계산 문제 강조"
    description: "computation을 강조합니다."
    color: #2196F3
    glow: true
    duration: 1s

  step 3: show circuit
    name: "산술 회로 변환"
    description: "circuit 노드를 화면에 표시합니다."
    effect: slideInBottom
    duration: 1s

  step 4: connect computation->circuit
    name: "회로 변환 연결"
    description: "computation에서 circuit으로 흐름을 연결합니다."
    flow: particles
    speed: 1.5s

  step 5: highlight circuit
    name: "산술 회로 강조"
    description: "circuit을 강조합니다."
    color: #FF9800
    pulse: true
    duration: 1s

  step 6: show r1cs
    name: "R1CS 변환"
    description: "r1cs 노드를 화면에 표시합니다."
    effect: slideInBottom
    duration: 1s

  step 7: connect circuit->r1cs
    name: "R1CS 변환 연결"
    description: "circuit에서 r1cs로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 8: highlight r1cs
    name: "R1CS 강조"
    description: "r1cs를 강조합니다."
    color: #FF9800
    pulse: true
    duration: 1s

  step 9: show qap
    name: "QAP 변환"
    description: "qap 노드를 화면에 표시합니다."
    effect: slideInBottom
    duration: 1s

  step 10: connect r1cs->qap
    name: "QAP 변환 연결"
    description: "r1cs에서 qap으로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 11: highlight qap
    name: "QAP 강조"
    description: "qap을 강조합니다."
    color: #FF9800
    glow: true
    duration: 1s

  step 12: show setup
    name: "Trusted Setup"
    description: "setup 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 1s

  step 13: connect qap->setup
    name: "셋업 연결"
    description: "qap에서 setup으로 흐름을 연결합니다."
    flow: arrow
    speed: 1.5s

  step 14: highlight setup
    name: "Trusted Setup 강조"
    description: "setup을 강조합니다."
    color: #F44336
    pulse: true
    duration: 1.5s

  step 15: show toxic
    name: "Toxic Waste 표시"
    description: "toxic 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 0.8s

  step 16: connect setup->toxic
    name: "Toxic Waste 연결"
    description: "setup에서 toxic으로 흐름을 연결합니다."
    flow: dash
    speed: 1s

  step 17: highlight toxic
    name: "Toxic Waste 강조"
    description: "toxic을 강조합니다."
    color: #F44336
    flash: true
    duration: 1s

  step 18: show pk, vk
    name: "키 생성"
    description: "pk, vk 노드를 화면에 표시합니다."
    effect: bounceIn
    stagger: 0.3s
    duration: 1s

  step 19: connect setup->pk, setup->vk
    name: "키 분배 연결"
    description: "setup에서 pk, vk로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 20: highlight pk
    name: "Proving Key 강조"
    description: "pk를 강조합니다."
    color: #4CAF50
    glow: true
    duration: 1s

  step 21: highlight vk
    name: "Verification Key 강조"
    description: "vk를 강조합니다."
    color: #4CAF50
    glow: true
    duration: 1s

  step 22: show witness, public
    name: "입력값 표시"
    description: "witness, public 노드를 화면에 표시합니다."
    effect: slideInLeft
    stagger: 0.3s
    duration: 1s

  step 23: highlight witness
    name: "비밀 입력 강조"
    description: "witness를 강조합니다."
    color: #9C27B0
    glow: true
    duration: 1s

  step 24: show prover
    name: "Prover 표시"
    description: "prover 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 1s

  step 25: connect witness->prover, public->prover, pk->prover
    name: "Prover 입력 연결"
    description: "witness, public, pk에서 prover로 흐름을 연결합니다."
    flow: particles
    speed: 1.5s

  step 26: highlight prover
    name: "Prover 강조"
    description: "prover를 강조합니다."
    color: #4CAF50
    pulse: true
    duration: 1.5s

  step 27: show proof
    name: "증명 생성"
    description: "proof 노드를 화면에 표시합니다."
    effect: flipIn
    duration: 1s

  step 28: connect prover->proof
    name: "증명 출력 연결"
    description: "prover에서 proof로 흐름을 연결합니다."
    flow: arrow
    speed: 1s

  step 29: highlight proof
    name: "증명 강조"
    description: "proof를 강조합니다."
    color: #4CAF50
    glow: true
    duration: 1s

  step 30: show verifier
    name: "Verifier 표시"
    description: "verifier 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 1s

  step 31: connect proof->verifier, vk->verifier, public->verifier
    name: "검증 입력 연결"
    description: "proof, vk, public에서 verifier로 흐름을 연결합니다."
    flow: particles
    speed: 1.5s

  step 32: highlight verifier
    name: "Verifier 강조"
    description: "verifier를 강조합니다."
    color: #2196F3
    pulse: true
    duration: 1.5s

  step 33: show accept, reject
    name: "결과 표시"
    description: "accept, reject 노드를 화면에 표시합니다."
    effect: bounceIn
    stagger: 0.3s
    duration: 1s

  step 34: connect verifier->accept, verifier->reject
    name: "검증 결과 연결"
    description: "verifier에서 결과로 흐름을 연결합니다."
    flow: arrow
    speed: 1s

  step 35: camera fitAll
    name: "카메라 전체 맞춤"
    description: "전체 파이프라인이 보이도록 카메라를 조정합니다."
    padding: 40px
    duration: 2s
@end

@style
  computation:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 3px

  circuit, r1cs, qap:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 2px

  setup:
    fill: #ffebee
    stroke: #F44336
    stroke-width: 3px

  toxic:
    fill: #ffcdd2
    stroke: #F44336
    stroke-width: 2px

  pk, vk:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px

  witness:
    fill: #f3e5f5
    stroke: #9C27B0
    stroke-width: 3px

  public:
    fill: #e0f2f1
    stroke: #009688
    stroke-width: 2px

  prover:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px

  proof:
    fill: #c8e6c9
    stroke: #388E3C
    stroke-width: 3px

  verifier:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 3px

  accept:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px

  reject:
    fill: #ffebee
    stroke: #F44336
    stroke-width: 3px
@end

@narration
  step 1:
    title: "증명하고 싶은 계산"
    text: "zk-SNARK는 복잡한 계산 문제를 '증명'하는 기술입니다. 예를 들어 '나는 비밀값 x를 알고 있고, 이 x에 대해 f(x) = y가 참임을 증명하고 싶지만, x는 공개하고 싶지 않다'는 상황을 생각해 봅시다."

  step 2:
    title: "zk-SNARK란?"
    text: "zk-SNARK는 Zero-Knowledge Succinct Non-Interactive ARgument of Knowledge의 약자입니다. 간단히 말해 '비밀을 공개하지 않으면서도 그것이 참임을 증명할 수 있다'는 뜻입니다."

  step 5:
    title: "산술 회로로 변환"
    text: "복잡한 계산을 덧셈과 곱셈만으로 구성된 '산술 회로'로 변환합니다. 마치 복잡한 알고리즘을 간단한 수학 연산으로 표현하는 것과 같습니다."

  step 8:
    title: "R1CS 제약 조건"
    text: "산술 회로의 각 게이트를 수학적 제약 조건(constraint)으로 변환합니다. (A·w) × (B·w) = (C·w) 형태입니다. 이것이 모든 조건을 만족하면 원래 계산이 맞다는 의미입니다."

  step 11:
    title: "QAP - 다항식 변환"
    text: "제약 조건들을 다항식(polynomial)으로 변환합니다. 라그랑주 보간(Lagrange interpolation)이라는 수학 기법을 사용합니다. 이 단계가 zk-SNARK의 핵심 아이디어입니다."

  step 14:
    title: "신뢰할 수 있는 설정 (Trusted Setup)"
    text: "MPC(Multi-Party Computation) 세레모니라는 행사를 열어 여러 사람이 함께 특수한 수들을 생성합니다. 참가자 중 단 한 명이라도 정직하면 전체 프로세스가 안전합니다."

  step 17:
    title: "Toxic Waste 폐기"
    text: "Trusted Setup에 사용된 비밀값('Toxic Waste')을 반드시 삭제해야 합니다. 만약 누군가 이 값을 가지고 있으면, 거짓 증명을 만들 수 있습니다!"

  step 20:
    title: "증명 키 (Proving Key)"
    text: "Prover(증명자)가 유효한 증명을 생성할 때 필요한 키입니다. 이 키와 비밀값(witness)이 있어야 증명을 만들 수 있습니다."

  step 21:
    title: "검증 키 (Verification Key)"
    text: "Verifier(검증자)가 증명의 유효성을 확인할 때 필요한 키입니다. 이 키는 공개되어 누구나 검증할 수 있습니다."

  step 23:
    title: "비밀 입력값 (Witness)"
    text: "증명자만 아는 '비밀'입니다. 이 값이 바로 우리가 공개하고 싶지 않은 정보입니다. 증명 과정에서 witness는 사용되지만 증명 자체에는 포함되지 않습니다."

  step 26:
    title: "증명 생성"
    text: "Prover가 비밀(witness), 공개 정보(public input), Proving Key를 사용해서 간결한 증명을 생성합니다. 이 증명의 크기는 원래 계산의 크기와 무관하게 항상 작습니다!"

  step 32:
    title: "증명 검증"
    text: "Verifier가 증명, Verification Key, 공개 정보를 사용해서 검증합니다. 놀랍게도 원래 계산을 다시 실행할 필요가 없습니다. 단 몇 개의 수학 연산만으로 검증 완료!"

  step 35:
    title: "zk-SNARK의 실제 활용"
    text: "zk-SNARK는 블록체인(영지식 거래), 프라이버시 보호, 암호화폐(Zcash) 등에 사용됩니다. 계산 증명을 공개하지만 개인 정보는 숨길 수 있다는 혁신입니다!"
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
