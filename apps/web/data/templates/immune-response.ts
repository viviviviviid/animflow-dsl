import type { Template } from "./index";

export const immuneResponseTemplate: Template = {
  name: "인체 면역 반응",
  description: "바이러스 침입부터 항체 생성, 기억세포 형성까지 선천·적응 면역의 흐름",
  dsl: `flowchart TD
  pathogen[병원체<br/>바이러스 / 세균]
  barrier[1차 방어선<br/>피부 · 점막 · 섬모]
  macrophage[대식세포<br/>Macrophage]
  cytokine[사이토카인<br/>염증 신호물질]
  neutrophil[호중구<br/>Neutrophil]
  dendritic[수지상세포<br/>Dendritic Cell]
  lymph[림프절<br/>면역 사령부]
  tcell[T세포<br/>세포성 면역]
  bcell[B세포<br/>체액성 면역]
  killer[킬러 T세포<br/>CD8+ T Cell]
  antibody[항체<br/>IgG / IgM]
  complement[보체 시스템<br/>병원체 파괴]
  memory_t[기억 T세포<br/>장기 면역 유지]
  memory_b[기억 B세포<br/>장기 면역 유지]

  pathogen -->|침입 시도| barrier
  barrier -.->|일부 통과| macrophage
  macrophage -->|탐식 후 항원 제시| cytokine
  cytokine --> neutrophil
  cytokine --> dendritic
  neutrophil -->|신속 제거| pathogen
  dendritic -->|항원 정보 전달| lymph
  lymph --> tcell
  lymph --> bcell
  tcell --> killer
  killer -->|감염 세포 직접 제거| pathogen
  bcell --> antibody
  antibody --> complement
  complement -->|병원체 용해 파괴| pathogen
  tcell --> memory_t
  bcell --> memory_b

@animation
  step 1: show pathogen
    name: "병원체 표시"
    description: "바이러스/세균 병원체 노드를 화면에 표시합니다."
    effect: bounceIn
    duration: 1s

  step 2: highlight pathogen
    name: "병원체 강조"
    description: "병원체를 강조합니다."
    color: #F44336
    glow: true
    duration: 1.5s

  step 3: show barrier
    name: "1차 방어선 표시"
    description: "피부와 점막 방어선 노드를 화면에 표시합니다."
    effect: slideInTop
    duration: 1s

  step 4: connect pathogen->barrier
    name: "침입 시도"
    description: "병원체가 1차 방어선에 부딪힙니다."
    flow: particles
    speed: 1.5s

  step 5: highlight barrier
    name: "1차 방어선 강조"
    description: "1차 방어선을 강조합니다."
    color: #FF9800
    pulse: true
    duration: 1.5s

  step 6: show macrophage
    name: "대식세포 표시"
    description: "대식세포 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 1s

  step 7: connect barrier->macrophage
    name: "방어선 돌파"
    description: "일부 병원체가 방어선을 통과해 대식세포와 마주칩니다."
    flow: dash
    speed: 1.5s

  step 8: highlight macrophage
    name: "대식세포 강조"
    description: "대식세포를 강조합니다."
    color: #FF5722
    glow: true
    duration: 1.5s

  step 9: show cytokine
    name: "사이토카인 표시"
    description: "사이토카인 신호물질 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 0.8s

  step 10: connect macrophage->cytokine
    name: "염증 신호 방출"
    description: "대식세포가 사이토카인 신호를 방출합니다."
    flow: particles
    speed: 1.5s

  step 11: highlight cytokine
    name: "사이토카인 강조"
    description: "사이토카인을 강조합니다."
    color: #FF9800
    pulse: true
    duration: 1s

  step 12: show neutrophil, dendritic
    name: "호중구와 수지상세포 표시"
    description: "호중구와 수지상세포 노드를 화면에 표시합니다."
    effect: slideInBottom
    stagger: 0.3s
    duration: 0.8s

  step 13: connect cytokine->neutrophil
    name: "호중구 소집"
    description: "사이토카인 신호로 호중구가 소집됩니다."
    flow: particles
    speed: 1.5s

  step 14: connect cytokine->dendritic
    name: "수지상세포 활성화"
    description: "사이토카인 신호로 수지상세포가 활성화됩니다."
    flow: particles
    speed: 1.5s

  step 15: highlight neutrophil
    name: "호중구 강조"
    description: "호중구를 강조합니다."
    color: #FF5722
    pulse: true
    duration: 1s

  step 16: connect neutrophil->pathogen
    name: "호중구 신속 제거"
    description: "호중구가 병원체를 신속하게 제거합니다."
    flow: particles
    speed: 1.5s

  step 17: show lymph
    name: "림프절 표시"
    description: "림프절 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 1s

  step 18: connect dendritic->lymph
    name: "항원 정보 전달"
    description: "수지상세포가 림프절로 항원 정보를 전달합니다."
    flow: particles
    speed: 1.5s

  step 19: highlight lymph
    name: "림프절 강조"
    description: "림프절을 강조합니다."
    color: #9C27B0
    glow: true
    duration: 1.5s

  step 20: show tcell, bcell
    name: "T세포와 B세포 표시"
    description: "T세포와 B세포 노드를 화면에 표시합니다."
    effect: flipIn
    stagger: 0.3s
    duration: 0.8s

  step 21: connect lymph->tcell
    name: "T세포 활성화"
    description: "림프절에서 T세포가 활성화됩니다."
    flow: particles
    speed: 1.5s

  step 22: connect lymph->bcell
    name: "B세포 활성화"
    description: "림프절에서 B세포가 활성화됩니다."
    flow: particles
    speed: 1.5s

  step 23: show killer
    name: "킬러 T세포 표시"
    description: "킬러 T세포 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 0.8s

  step 24: connect tcell->killer
    name: "킬러 T세포 분화"
    description: "T세포가 킬러 T세포로 분화합니다."
    flow: arrow
    speed: 1s

  step 25: connect killer->pathogen
    name: "감염 세포 제거"
    description: "킬러 T세포가 감염된 세포를 직접 제거합니다."
    flow: particles
    speed: 1.5s

  step 26: highlight killer
    name: "킬러 T세포 강조"
    description: "킬러 T세포를 강조합니다."
    color: #E91E63
    glow: true
    duration: 1.5s

  step 27: show antibody
    name: "항체 표시"
    description: "항체 노드를 화면에 표시합니다."
    effect: bounceIn
    duration: 0.8s

  step 28: connect bcell->antibody
    name: "항체 생성"
    description: "B세포에서 항체가 생성됩니다."
    flow: particles
    speed: 1.5s

  step 29: show complement
    name: "보체 시스템 표시"
    description: "보체 시스템 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 0.8s

  step 30: connect antibody->complement
    name: "보체 활성화"
    description: "항체가 보체 시스템을 활성화합니다."
    flow: arrow
    speed: 1s

  step 31: connect complement->pathogen
    name: "병원체 파괴"
    description: "보체 시스템이 병원체를 파괴합니다."
    flow: particles
    speed: 1.5s

  step 32: highlight antibody, complement
    name: "항체-보체 강조"
    description: "항체와 보체 시스템을 강조합니다."
    color: #2196F3
    glow: true
    duration: 1.5s

  step 33: show memory_t, memory_b
    name: "기억세포 표시"
    description: "기억 T세포와 기억 B세포 노드를 화면에 표시합니다."
    effect: slideInBottom
    stagger: 0.3s
    duration: 1s

  step 34: connect tcell->memory_t
    name: "기억 T세포 형성"
    description: "T세포 일부가 기억 T세포로 분화합니다."
    flow: arrow
    speed: 1s

  step 35: connect bcell->memory_b
    name: "기억 B세포 형성"
    description: "B세포 일부가 기억 B세포로 분화합니다."
    flow: arrow
    speed: 1s

  step 36: highlight memory_t, memory_b
    name: "기억세포 강조"
    description: "기억세포를 강조합니다."
    color: #4CAF50
    glow: true
    duration: 2s

  step 37: camera fitAll
    name: "카메라 전체 맞춤"
    description: "전체 면역 반응 흐름이 보이도록 카메라를 조정합니다."
    padding: 40px
    duration: 2s
@end

@style
  pathogen:
    fill: #ffebee
    stroke: #F44336
    stroke-width: 3px

  barrier:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 3px

  macrophage:
    fill: #fbe9e7
    stroke: #FF5722
    stroke-width: 3px

  cytokine:
    fill: #fff8e1
    stroke: #FFC107
    stroke-width: 2px

  neutrophil:
    fill: #fce4ec
    stroke: #E91E63
    stroke-width: 2px

  dendritic:
    fill: #f3e5f5
    stroke: #9C27B0
    stroke-width: 2px

  lymph:
    fill: #ede7f6
    stroke: #7E57C2
    stroke-width: 3px

  tcell, bcell:
    fill: #e3f2fd
    stroke: #1E88E5
    stroke-width: 2px

  killer:
    fill: #fce4ec
    stroke: #E91E63
    stroke-width: 3px

  antibody, complement:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 2px

  memory_t, memory_b:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px
@end

@narration
  step 1:
    title: "우리 몸의 군대 - 면역계"
    text: "우리 몸은 매 순간 수천만 개의 병원체와 싸우고 있습니다. 면역계는 크게 두 층으로 이루어집니다. 첫 번째는 빠르지만 정밀하지 않은 선천 면역(Innate Immunity)이고, 두 번째는 느리지만 정확하게 표적을 공격하는 적응 면역(Adaptive Immunity)입니다. 지금부터 바이러스가 침입했을 때 일어나는 일을 살펴봅시다."

  step 3:
    title: "1차 방어선 - 물리적 장벽"
    text: "가장 먼저 병원체를 막는 것은 피부입니다. 피부는 단순한 표면이 아니라 살아있는 장벽으로, 끊임없이 세포를 교체하며 침입자를 막습니다. 기도에는 점액과 섬모가 있어서 바이러스를 붙잡아 바깥으로 내보냅니다. 입과 위의 산성 환경도 대부분의 세균을 죽입니다. 이 선에서 대부분의 침입이 차단됩니다."

  step 8:
    title: "대식세포 - 최초 대응팀"
    text: "방어선을 뚫은 병원체를 가장 먼저 만나는 것이 대식세포(Macrophage)입니다. 대식세포는 '큰 먹는 세포'라는 뜻으로, 병원체를 탐식(Phagocytosis)해서 분해합니다. 더 중요한 역할은 병원체를 분해하면서 항원(Antigen)이라는 정보 조각을 표면에 제시하는 것입니다. 이것이 적응 면역 활성화의 신호가 됩니다."

  step 11:
    title: "사이토카인 - 면역 경보 시스템"
    text: "대식세포가 감염을 감지하면 사이토카인이라는 신호 단백질을 분비합니다. 인터루킨, TNF-알파 같은 사이토카인은 혈관을 확장시키고(발열과 발적), 더 많은 면역세포를 현장으로 불러모읍니다. 발열은 불편하지만, 높은 온도가 바이러스 복제를 억제하고 면역 반응을 강화하는 이유입니다."

  step 16:
    title: "호중구 - 최전선 전사"
    text: "호중구(Neutrophil)는 혈액 속 백혈구의 60~70%를 차지하는 가장 많은 면역세포입니다. 사이토카인 신호를 받으면 수분 안에 감염 부위로 달려옵니다. 병원체를 탐식하고, 활성산소와 항균 단백질을 분비해 파괴합니다. 수명은 고작 1~5일이지만, 감염 초기 신속한 제거에 없어서는 안 됩니다."

  step 19:
    title: "림프절 - 면역 사령부"
    text: "수지상세포는 감염 현장의 정찰대입니다. 병원체를 처리하고 항원 정보를 가지고 림프절로 이동합니다. 림프절은 T세포와 B세포가 대기 중인 면역 사령부입니다. 수지상세포가 '이 항원을 가진 적이 나타났다'고 보고하면, 그 항원에 맞는 T세포와 B세포가 활성화되어 폭발적으로 증식합니다."

  step 26:
    title: "킬러 T세포 - 정밀 타격"
    text: "킬러 T세포(CD8+ T Cell)는 바이러스에 감염된 세포를 직접 찾아 죽입니다. 바이러스는 세포 안에 숨어서 항체가 닿지 않는 곳에서 복제합니다. 하지만 감염된 세포는 자신이 감염됐다는 신호를 표면에 표시합니다. 킬러 T세포는 이 신호를 인식하고 세포 자살(Apoptosis)을 유도합니다. 바이러스의 복제 공장을 통째로 제거하는 것입니다."

  step 32:
    title: "항체 - 표적 미사일"
    text: "B세포가 생산하는 항체는 특정 항원에만 결합하는 단백질입니다. 항체가 병원체에 결합하면 보체 시스템이 활성화됩니다. 보체는 약 30가지 단백질이 연쇄 반응하며 병원체의 세포막에 구멍을 뚫어 파괴합니다. 또한 항체가 붙은 병원체는 대식세포가 더 쉽게 탐식할 수 있도록 표시됩니다."

  step 36:
    title: "기억세포 - 평생 면역의 비밀"
    text: "감염이 해결되면 대부분의 면역세포는 사멸합니다. 하지만 일부 T세포와 B세포는 기억세포로 분화해 수십 년 동안 체내에 남습니다. 같은 병원체가 다시 침입하면 기억세포가 즉각 반응해 며칠이 걸리던 면역 반응을 몇 시간 안에 완료합니다. 백신이 바로 이 원리를 이용합니다. 약화된 병원체로 기억세포만 만들어두는 것입니다."
@end

@config
  autoplay: true
  loop: false
  speed: 1.0
  tts: true
  tts-voice: Kyunghoon, InJoon, ko-KR
@end`,
};
