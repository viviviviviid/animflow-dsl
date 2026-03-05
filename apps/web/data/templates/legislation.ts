import type { Template } from "./index";

export const legislationTemplate: Template = {
  name: "법안이 법이 되기까지",
  description: "국민의 청원부터 대통령 공포까지, 한국 법안 통과 과정",
  dsl: `flowchart TD
  citizen[국민 / 시민단체<br/>입법 청원]
  lawmaker[국회의원<br/>법안 발의]
  bill[법안 접수<br/>10인 이상 연서 필요]
  committee[소관 상임위원회<br/>전문 심사]
  subcommittee[법안심사소위원회<br/>조항별 심의]
  public[공청회<br/>전문가 · 이해관계자]
  legalreview[법제사법위원회<br/>체계 · 자구 심사]
  plenary[본회의<br/>전체 의원 토론]
  vote[표결<br/>재적 과반 찬성]
  rejected[폐기<br/>부결 / 임기만료]
  president[대통령<br/>서명 또는 거부권]
  vetoed[재의 요구<br/>국회 재심의]
  promulgate[관보 공포<br/>법률 효력 발생]
  enforce[시행<br/>공포 후 20일 이상 경과]

  citizen -->|청원 / 입법 요구| lawmaker
  lawmaker -->|법안 제출| bill
  bill -->|배당| committee
  committee --> subcommittee
  subcommittee --> public
  public -->|의견 수렴 후| subcommittee
  subcommittee -->|통과| legalreview
  subcommittee -.->|폐기 결정| rejected
  legalreview -->|체계 통과| plenary
  plenary --> vote
  vote -.->|부결| rejected
  vote -->|가결| president
  president -->|서명| promulgate
  president -.->|거부권 행사| vetoed
  vetoed -->|재적 2/3 찬성 시| promulgate
  vetoed -.->|미달 시| rejected
  promulgate --> enforce

@animation
  step 1: show citizen
    name: "국민 표시"
    description: "국민/시민단체 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 1s

  step 2: highlight citizen
    name: "국민 강조"
    description: "국민을 강조합니다."
    color: #2196F3
    glow: true
    duration: 1s

  step 3: show lawmaker
    name: "국회의원 표시"
    description: "국회의원 노드를 화면에 표시합니다."
    effect: slideInTop
    duration: 0.8s

  step 4: connect citizen->lawmaker
    name: "입법 청원"
    description: "국민이 국회의원에게 입법을 청원합니다."
    flow: particles
    speed: 1.5s

  step 5: highlight lawmaker
    name: "국회의원 강조"
    description: "국회의원을 강조합니다."
    color: #3F51B5
    pulse: true
    duration: 1s

  step 6: show bill
    name: "법안 접수 표시"
    description: "법안 접수 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 0.8s

  step 7: connect lawmaker->bill
    name: "법안 발의"
    description: "국회의원이 법안을 발의합니다."
    flow: particles
    speed: 1.5s

  step 8: highlight bill
    name: "법안 강조"
    description: "법안을 강조합니다."
    color: #3F51B5
    pulse: true
    duration: 1s

  step 9: show committee
    name: "상임위원회 표시"
    description: "소관 상임위원회 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 0.8s

  step 10: connect bill->committee
    name: "상임위 배당"
    description: "법안이 소관 상임위원회에 배당됩니다."
    flow: arrow
    speed: 1.5s

  step 11: highlight committee
    name: "상임위 강조"
    description: "상임위원회를 강조합니다."
    color: #9C27B0
    glow: true
    duration: 1s

  step 12: show subcommittee
    name: "소위원회 표시"
    description: "법안심사소위원회 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 0.8s

  step 13: connect committee->subcommittee
    name: "소위 심사"
    description: "상임위에서 소위원회로 심사를 위임합니다."
    flow: arrow
    speed: 1s

  step 14: show public
    name: "공청회 표시"
    description: "공청회 노드를 화면에 표시합니다."
    effect: bounceIn
    duration: 0.8s

  step 15: connect subcommittee->public
    name: "공청회 개최"
    description: "소위원회에서 공청회를 개최합니다."
    flow: particles
    speed: 1.5s

  step 16: highlight public
    name: "공청회 강조"
    description: "공청회를 강조합니다."
    color: #4CAF50
    pulse: true
    duration: 1.5s

  step 17: connect public->subcommittee
    name: "의견 수렴 완료"
    description: "공청회 의견이 소위원회로 반영됩니다."
    flow: particles
    speed: 1s

  step 18: show rejected
    name: "폐기 표시"
    description: "폐기 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 0.8s

  step 19: connect subcommittee->rejected
    name: "소위 폐기 경로"
    description: "소위원회에서 폐기 결정이 날 수 있습니다."
    flow: dash
    speed: 1.5s

  step 20: show legalreview
    name: "법사위 표시"
    description: "법제사법위원회 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 0.8s

  step 21: connect subcommittee->legalreview
    name: "법사위 회부"
    description: "소위 통과 후 법사위에 회부됩니다."
    flow: arrow
    speed: 1.5s

  step 22: highlight legalreview
    name: "법사위 강조"
    description: "법제사법위원회를 강조합니다."
    color: #795548
    glow: true
    duration: 1.5s

  step 23: show plenary
    name: "본회의 표시"
    description: "본회의 노드를 화면에 표시합니다."
    effect: flipIn
    duration: 1s

  step 24: connect legalreview->plenary
    name: "본회의 상정"
    description: "법사위 통과 후 본회의에 상정됩니다."
    flow: particles
    speed: 1.5s

  step 25: highlight plenary
    name: "본회의 강조"
    description: "본회의를 강조합니다."
    color: #FF9800
    glow: true
    duration: 1.5s

  step 26: show vote
    name: "표결 표시"
    description: "표결 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 0.8s

  step 27: connect plenary->vote
    name: "표결 실시"
    description: "본회의에서 표결이 실시됩니다."
    flow: particles
    speed: 1.5s

  step 28: highlight vote
    name: "표결 강조"
    description: "표결을 강조합니다."
    color: #FF9800
    pulse: true
    duration: 2s

  step 29: connect vote->rejected
    name: "부결 경로"
    description: "표결에서 부결될 수 있습니다."
    flow: dash
    speed: 1.5s

  step 30: show president
    name: "대통령 표시"
    description: "대통령 노드를 화면에 표시합니다."
    effect: bounceIn
    duration: 1s

  step 31: connect vote->president
    name: "가결 후 이송"
    description: "가결된 법안이 대통령에게 이송됩니다."
    flow: particles
    speed: 1.5s

  step 32: highlight president
    name: "대통령 강조"
    description: "대통령을 강조합니다."
    color: #F44336
    glow: true
    duration: 1.5s

  step 33: show vetoed
    name: "재의 요구 표시"
    description: "재의 요구 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 0.8s

  step 34: connect president->vetoed
    name: "거부권 행사"
    description: "대통령이 거부권을 행사할 수 있습니다."
    flow: dash
    speed: 1.5s

  step 35: connect vetoed->rejected
    name: "재의결 실패"
    description: "재의결에서 2/3 미달 시 폐기됩니다."
    flow: dash
    speed: 1.5s

  step 36: show promulgate
    name: "공포 표시"
    description: "관보 공포 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 1s

  step 37: connect president->promulgate
    name: "대통령 서명"
    description: "대통령이 서명하면 법률이 공포됩니다."
    flow: particles
    speed: 1.5s

  step 38: connect vetoed->promulgate
    name: "재의결 통과"
    description: "국회 재의결 2/3 찬성 시 공포됩니다."
    flow: particles
    speed: 1.5s

  step 39: highlight promulgate
    name: "공포 강조"
    description: "법률 공포를 강조합니다."
    color: #4CAF50
    glow: true
    duration: 1.5s

  step 40: show enforce
    name: "시행 표시"
    description: "시행 노드를 화면에 표시합니다."
    effect: flipIn
    duration: 1s

  step 41: connect promulgate->enforce
    name: "법률 시행"
    description: "공포 후 일정 기간 경과 후 시행됩니다."
    flow: particles
    speed: 1.5s

  step 42: highlight enforce
    name: "시행 강조"
    description: "법률 시행을 강조합니다."
    color: #4CAF50
    pulse: true
    duration: 2s

  step 43: camera fitAll
    name: "카메라 전체 맞춤"
    description: "전체 입법 과정이 보이도록 카메라를 조정합니다."
    padding: 40px
    duration: 2s
@end

@style
  citizen:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 3px

  lawmaker:
    fill: #e8eaf6
    stroke: #3F51B5
    stroke-width: 3px

  bill:
    fill: #e8eaf6
    stroke: #3F51B5
    stroke-width: 2px

  committee:
    fill: #f3e5f5
    stroke: #9C27B0
    stroke-width: 2px

  subcommittee:
    fill: #f3e5f5
    stroke: #AB47BC
    stroke-width: 2px

  public:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 2px

  legalreview:
    fill: #efebe9
    stroke: #795548
    stroke-width: 3px

  plenary:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 3px

  vote:
    fill: #fff3e0
    stroke: #F57C00
    stroke-width: 3px

  rejected:
    fill: #ffebee
    stroke: #F44336
    stroke-width: 2px

  president:
    fill: #ffebee
    stroke: #C62828
    stroke-width: 3px

  vetoed:
    fill: #fce4ec
    stroke: #E91E63
    stroke-width: 2px

  promulgate:
    fill: #e8f5e9
    stroke: #2E7D32
    stroke-width: 3px

  enforce:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px
@end

@narration
  step 1:
    title: "법은 어떻게 만들어질까?"
    text: "우리 일상을 규율하는 법률은 하루아침에 만들어지지 않습니다. 국민의 요구에서 시작해 여러 심사 단계를 거쳐야 합니다. 한국 헌법은 삼권분립을 원칙으로 하는데, 입법권은 국회에 있습니다. 현재 국회에서 처리되는 법안은 연간 2만 건이 넘지만 실제 본회의를 통과하는 비율은 약 30% 내외입니다."

  step 5:
    title: "법안 발의 - 국회의원의 역할"
    text: "법안을 발의할 수 있는 사람은 국회의원과 정부입니다. 의원이 발의할 때는 10명 이상의 국회의원이 연서(함께 서명)해야 합니다. 국민도 10만 명 이상의 서명을 모으면 국민동의청원을 통해 법안을 제출할 수 있습니다. 2020년에 통과된 국민동의청원 제도로 일반 시민이 직접 입법 과정에 참여할 수 있게 됐습니다."

  step 11:
    title: "상임위원회 - 전문가 집단의 심사"
    text: "국회에는 법제사법위원회, 기획재정위원회, 보건복지위원회 등 17개의 상임위원회가 있습니다. 각 위원회는 담당 분야의 전문성을 가진 의원들로 구성됩니다. 법안은 내용에 따라 소관 상임위원회에 배당됩니다. 의료 관련 법이면 보건복지위원회, 세금 관련이면 기획재정위원회가 심사합니다."

  step 16:
    title: "공청회 - 민주주의의 현장"
    text: "중요한 법안은 공청회를 열어 전문가, 이해관계자, 일반 시민의 의견을 듣습니다. 예를 들어 의료법 개정안이면 의사, 환자단체, 법학자, 시민단체 등이 찬반 의견을 제시합니다. 공청회는 법안의 문제점을 발견하고 다양한 시각을 반영하는 민주주의적 절차입니다. 하지만 현실에서는 공청회가 생략되거나 형식적으로 진행되는 경우도 있습니다."

  step 22:
    title: "법제사법위원회 - 모든 법안의 관문"
    text: "법사위는 모든 법안이 본회의 상정 전 거쳐야 하는 마지막 관문입니다. 법안의 내용이 아닌 '다른 법률과 충돌하지 않는지', '헌법에 위반되지 않는지', '용어와 표현이 적절한지'를 검토합니다. 이 때문에 법사위가 법안을 오래 붙잡아두면 입법이 지연된다는 비판도 있습니다."

  step 25:
    title: "본회의 - 전국민이 지켜보는 최종 심사"
    text: "상임위를 통과한 법안은 본회의에 상정됩니다. 300명 전원 의원이 참여해 토론하고 표결합니다. 국회 본회의는 생중계되며, 의원들의 발언이 기록됩니다. 의원들은 찬성 연설과 반대 연설을 통해 자신의 입장을 밝힙니다."

  step 28:
    title: "표결 - 민주주의의 핵심"
    text: "재적 의원 과반수 출석에 출석 의원 과반수 찬성으로 가결됩니다. 300명 중 150명이 출석했다면 76명 이상이 찬성하면 통과입니다. 전자 투표 시스템으로 실시간 집계됩니다. 특별히 헌법 개정, 국무총리 해임 건의 등은 더 높은 기준인 재적 과반수 또는 2/3이 필요합니다."

  step 32:
    title: "대통령의 역할 - 서명 또는 거부권"
    text: "국회를 통과한 법안은 15일 이내에 대통령이 공포하거나 거부권(재의 요구)을 행사할 수 있습니다. 거부권이 행사되면 국회로 돌아와 재적 의원 과반수 출석에 출석 의원 2/3 이상 찬성으로만 통과됩니다. 역사적으로 대통령 거부권은 드물게 행사되었지만, 여소야대 상황에서는 중요한 견제 수단이 됩니다."

  step 42:
    title: "공포와 시행 - 법의 탄생"
    text: "대통령이 서명한 법률은 관보에 게재되어 공포됩니다. 공포일로부터 보통 20일 이후에 시행됩니다. 하지만 큰 변화가 필요한 법은 1년 이상의 유예기간을 두기도 합니다. 법 시행 후에도 헌법재판소의 위헌 결정이 나오면 효력을 잃습니다. 법의 탄생부터 폐기까지, 민주주의는 끊임없이 움직이는 과정입니다."
@end

@config
  autoplay: true
  loop: false
  speed: 1.0
  tts: true
  tts-voice: Kyunghoon, InJoon, ko-KR
@end`,
};
