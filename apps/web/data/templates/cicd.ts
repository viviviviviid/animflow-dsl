import type { Template } from "./index";

export const cicdTemplate: Template = {
  name: "CI/CD 파이프라인",
  description: "git push 한 번으로 프로덕션까지 자동 배포되는 전체 흐름",
  dsl: `flowchart LR
  dev[개발자<br/>로컬 작업]
  git[Git 저장소<br/>main 브랜치]
  ci[CI 서버<br/>GitHub Actions]
  build[빌드<br/>npm run build]
  lint[린트 / 타입 검사<br/>ESLint, TypeScript]
  unit[단위 테스트<br/>Jest / Vitest]
  integration[통합 테스트<br/>Supertest]
  docker[Docker 이미지<br/>빌드 & 태깅]
  registry[컨테이너 레지스트리<br/>ECR / Docker Hub]
  staging[스테이징 배포<br/>Kubernetes]
  smoke[스모크 테스트<br/>핵심 API 검증]
  prod[프로덕션 배포<br/>Blue-Green]
  monitor[모니터링<br/>Datadog / Sentry]
  notify[팀 알림<br/>Slack / Email]

  dev -->|git push origin main| git
  git -->|webhook 트리거| ci
  ci --> build
  build --> lint
  lint --> unit
  unit --> integration
  integration --> docker
  docker --> registry
  registry --> staging
  staging --> smoke
  smoke -->|테스트 통과| prod
  smoke -.->|테스트 실패| notify
  prod --> monitor
  monitor --> notify

@animation
  step 1: show dev
    name: "개발자 표시"
    description: "개발자 노드를 화면에 표시합니다."
    effect: slideInLeft
    duration: 1s

  step 2: highlight dev
    name: "개발자 강조"
    description: "개발자를 강조합니다."
    color: #2196F3
    glow: true
    duration: 1s

  step 3: show git
    name: "Git 저장소 표시"
    description: "Git 저장소 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 0.8s

  step 4: connect dev->git
    name: "git push"
    description: "개발자가 코드를 Git에 푸시합니다."
    flow: particles
    speed: 1.5s

  step 5: highlight git
    name: "Git 강조"
    description: "Git 저장소를 강조합니다."
    color: #F44336
    pulse: true
    duration: 1s

  step 6: show ci
    name: "CI 서버 표시"
    description: "CI 서버 노드를 화면에 표시합니다."
    effect: flipIn
    duration: 1s

  step 7: connect git->ci
    name: "webhook 트리거"
    description: "Git이 CI 서버에 webhook을 전송합니다."
    flow: particles
    speed: 1.5s

  step 8: highlight ci
    name: "CI 서버 강조"
    description: "CI 서버를 강조합니다."
    color: #FF9800
    glow: true
    duration: 1s

  step 9: show build
    name: "빌드 표시"
    description: "빌드 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 0.8s

  step 10: connect ci->build
    name: "빌드 시작"
    description: "CI 서버에서 빌드를 시작합니다."
    flow: arrow
    speed: 1s

  step 11: highlight build
    name: "빌드 강조"
    description: "빌드 단계를 강조합니다."
    color: #FF9800
    pulse: true
    duration: 1s

  step 12: show lint
    name: "린트 표시"
    description: "린트 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 0.8s

  step 13: connect build->lint
    name: "린트 검사"
    description: "빌드 후 코드 품질 검사를 수행합니다."
    flow: arrow
    speed: 1s

  step 14: highlight lint
    name: "린트 강조"
    description: "린트 단계를 강조합니다."
    color: #9C27B0
    pulse: true
    duration: 1s

  step 15: show unit
    name: "단위 테스트 표시"
    description: "단위 테스트 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 0.8s

  step 16: connect lint->unit
    name: "단위 테스트"
    description: "린트 후 단위 테스트를 실행합니다."
    flow: arrow
    speed: 1s

  step 17: highlight unit
    name: "단위 테스트 강조"
    description: "단위 테스트 단계를 강조합니다."
    color: #4CAF50
    pulse: true
    duration: 1s

  step 18: show integration
    name: "통합 테스트 표시"
    description: "통합 테스트 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 0.8s

  step 19: connect unit->integration
    name: "통합 테스트"
    description: "단위 테스트 후 통합 테스트를 실행합니다."
    flow: arrow
    speed: 1s

  step 20: highlight integration
    name: "통합 테스트 강조"
    description: "통합 테스트 단계를 강조합니다."
    color: #4CAF50
    glow: true
    duration: 1s

  step 21: show docker
    name: "Docker 빌드 표시"
    description: "Docker 이미지 빌드 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 0.8s

  step 22: connect integration->docker
    name: "Docker 이미지 빌드"
    description: "테스트 통과 후 Docker 이미지를 빌드합니다."
    flow: arrow
    speed: 1s

  step 23: highlight docker
    name: "Docker 강조"
    description: "Docker 빌드 단계를 강조합니다."
    color: #2196F3
    pulse: true
    duration: 1s

  step 24: show registry
    name: "레지스트리 표시"
    description: "컨테이너 레지스트리 노드를 화면에 표시합니다."
    effect: bounceIn
    duration: 0.8s

  step 25: connect docker->registry
    name: "이미지 푸시"
    description: "Docker 이미지를 레지스트리에 푸시합니다."
    flow: particles
    speed: 1.5s

  step 26: highlight registry
    name: "레지스트리 강조"
    description: "레지스트리를 강조합니다."
    color: #2196F3
    glow: true
    duration: 1s

  step 27: show staging
    name: "스테이징 표시"
    description: "스테이징 배포 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 0.8s

  step 28: connect registry->staging
    name: "스테이징 배포"
    description: "레지스트리에서 스테이징 환경에 배포합니다."
    flow: particles
    speed: 1.5s

  step 29: highlight staging
    name: "스테이징 강조"
    description: "스테이징 배포를 강조합니다."
    color: #FF9800
    pulse: true
    duration: 1.5s

  step 30: show smoke
    name: "스모크 테스트 표시"
    description: "스모크 테스트 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 0.8s

  step 31: connect staging->smoke
    name: "스모크 테스트 실행"
    description: "스테이징에서 스모크 테스트를 실행합니다."
    flow: arrow
    speed: 1s

  step 32: highlight smoke
    name: "스모크 테스트 강조"
    description: "스모크 테스트를 강조합니다."
    color: #4CAF50
    glow: true
    duration: 1.5s

  step 33: show prod
    name: "프로덕션 표시"
    description: "프로덕션 배포 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 1s

  step 34: connect smoke->prod
    name: "프로덕션 배포"
    description: "스모크 테스트 통과 후 프로덕션에 배포합니다."
    flow: particles
    speed: 2s

  step 35: highlight prod
    name: "프로덕션 강조"
    description: "프로덕션 배포를 강조합니다."
    color: #4CAF50
    glow: true
    duration: 2s

  step 36: show monitor, notify
    name: "모니터링과 알림 표시"
    description: "모니터링과 알림 노드를 화면에 표시합니다."
    effect: fadeIn
    stagger: 0.3s
    duration: 0.8s

  step 37: connect prod->monitor
    name: "배포 후 모니터링"
    description: "프로덕션 배포 후 모니터링을 시작합니다."
    flow: arrow
    speed: 1s

  step 38: connect monitor->notify
    name: "팀 알림"
    description: "모니터링 결과를 팀에 알립니다."
    flow: arrow
    speed: 1s

  step 39: connect smoke->notify
    name: "실패 알림"
    description: "스모크 테스트 실패 시 팀에 알립니다."
    flow: dash
    speed: 1.5s

  step 40: camera fitAll
    name: "카메라 전체 맞춤"
    description: "전체 파이프라인이 보이도록 카메라를 조정합니다."
    padding: 40px
    duration: 2s
@end

@style
  dev:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 3px

  git:
    fill: #ffebee
    stroke: #F44336
    stroke-width: 3px

  ci:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 3px

  build, lint:
    fill: #f3e5f5
    stroke: #9C27B0
    stroke-width: 2px

  unit, integration:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 2px

  docker, registry:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 2px

  staging:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 2px

  smoke:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 2px

  prod:
    fill: #e8f5e9
    stroke: #2E7D32
    stroke-width: 3px

  monitor:
    fill: #e0f7fa
    stroke: #00BCD4
    stroke-width: 2px

  notify:
    fill: #fce4ec
    stroke: #E91E63
    stroke-width: 2px
@end

@narration
  step 1:
    title: "CI/CD - 코드가 제품이 되는 자동화 도로"
    text: "개발자가 코드를 푸시하면 배포까지 자동으로 진행되는 시스템을 CI/CD라 합니다. CI(Continuous Integration)는 코드를 지속적으로 합치고 검증하는 것이고, CD(Continuous Delivery/Deployment)는 검증된 코드를 지속적으로 배포하는 것입니다. 이 자동화 도로가 없으면 배포할 때마다 수작업으로 수십 단계를 반복해야 합니다."

  step 7:
    title: "Webhook - 이벤트 기반 자동화"
    text: "git push 한 번이 연쇄 반응의 출발점입니다. GitHub는 push 이벤트를 감지하면 미리 등록된 webhook URL(CI 서버)로 HTTP POST를 보냅니다. CI 서버는 이 신호를 받아 파이프라인을 시작합니다. 개발자는 버튼 하나 누를 필요 없이 코드를 올리는 것만으로 전체 과정이 시작됩니다."

  step 13:
    title: "린트와 타입 검사 - 기계가 하는 코드 리뷰"
    text: "ESLint는 코드 스타일과 잠재적 버그를 찾고, TypeScript 컴파일러는 타입 오류를 잡습니다. 이것이 CI의 첫 번째 가치입니다. 사람이 코드 리뷰에서 스타일 지적을 하는 대신, 기계가 0.1초 만에 수백 개의 규칙을 검사합니다. 팀원은 로직과 설계에 집중한 리뷰를 할 수 있습니다."

  step 17:
    title: "단위 테스트 - 빠른 안전망"
    text: "단위 테스트는 함수 하나, 클래스 하나를 독립적으로 검증합니다. 보통 수백 개의 테스트가 수 초 안에 완료됩니다. 새로운 기능을 추가했을 때 기존 기능이 깨졌는지를 즉시 알 수 있습니다. 테스트 커버리지가 80%를 넘으면 배포 실패 확률이 극적으로 낮아집니다."

  step 19:
    title: "통합 테스트 - 부품들이 함께 작동하는지"
    text: "단위 테스트는 개별 부품을 검증하지만, 통합 테스트는 실제 DB, 외부 API와 연동해서 전체 흐름을 검증합니다. 예를 들어 'POST /api/orders API 호출 → DB 저장 → 이메일 발송'이 모두 올바르게 동작하는지 확인합니다. 단위 테스트보다 느리지만 실제 사용 시나리오를 검증합니다."

  step 22:
    title: "Docker 이미지 - 재현 가능한 환경"
    text: "모든 테스트를 통과한 코드만 Docker 이미지로 빌드됩니다. Docker는 '내 컴퓨터에서는 됐는데 서버에서 안 돼요' 문제를 해결합니다. Node 버전, OS, 라이브러리를 모두 포함한 불변 패키지를 만들기 때문입니다. git commit SHA로 태깅하면 어떤 배포가 어느 코드인지 추적도 됩니다."

  step 29:
    title: "스테이징 - 프로덕션의 미러"
    text: "프로덕션과 동일한 환경을 복제한 스테이징에 먼저 배포합니다. 실제 사용자 데이터와 유사한 데이터로 마지막 검증을 합니다. QA팀이 여기서 테스트하고, 기획자가 기능을 확인합니다. 스테이징이 없으면 프로덕션이 곧 테스트 환경이 되어버립니다."

  step 32:
    title: "스모크 테스트 - 연기가 나나 확인"
    text: "스모크 테스트는 배포 후 핵심 기능만 빠르게 검증합니다. '로그인이 되나? 주문이 되나? 결제가 되나?' 같은 최소한의 체크입니다. 기계가 '연기(오류)가 나는지'를 먼저 확인한 뒤 프로덕션으로 넘깁니다. 실패하면 자동으로 이전 버전으로 롤백하고 팀에 알림을 보냅니다."

  step 35:
    title: "Blue-Green 배포 - 무중단 배포"
    text: "Blue-Green 배포는 현재 운영 중인 서버(Blue)와 새 버전 서버(Green)를 동시에 운영하다가, 트래픽 스위치를 순간적으로 Green으로 전환하는 방식입니다. 사용자는 서비스 중단을 경험하지 않습니다. 문제가 생기면 스위치를 다시 Blue로 돌리면 됩니다. 이것이 다운타임 없는 배포의 핵심입니다."
@end

@config
  autoplay: true
  loop: false
  speed: 1.0
  tts: true
  tts-voice: Kyunghoon, InJoon, ko-KR
@end`,
};
