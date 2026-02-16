/**
 * Template Library
 * Based on templates defined in 온보딩용템플릿.md
 */

interface Template {
  name: string;
  description: string;
  dsl: string;
}

export const TEMPLATES: Template[] = [
  {
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
    duration: 1.5s
    effect: fadeIn

  step 2: highlight genesis
    color: #4CAF50
    glow: true
    duration: 1s

  step 3: connect genesis->block1
    flow: particles
    speed: 2s

  step 4: show block1
    effect: slideInRight
    duration: 1s

  step 5: highlight block1
    color: #FF9800
    pulse: true
    duration: 1s

  step 6: connect block1->block2
    flow: particles
    speed: 2s

  step 7: show block2
    effect: slideInRight
    duration: 1s

  step 8: connect block2->block3
    flow: particles
    speed: 2s

  step 9: show block3
    effect: slideInRight
    duration: 1s

  step 10: camera fitAll
    padding: 50px
    duration: 1.5s

  step 11: highlight genesis, block1, block2, block3
    color: #4CAF50
    glow: true
    stagger: 0.3s
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
    title: "Genesis Block"
    text: "모든 블록체인은 Genesis Block에서 시작합니다."
  
  step 3:
    title: "해시 연결"
    text: "각 블록은 이전 블록의 해시값을 포함합니다."
  
  step 11:
    title: "블록체인 완성"
    text: "블록들이 체인으로 연결되어 블록체인이 완성됩니다."
@end

@config
  autoplay: true
  loop: false
  controls: true
  speed: 1.0
@end`,
  },

  {
    name: "JWT 로그인 인증 흐름",
    description: "로그인 요청부터 토큰 발급/검증까지의 전체 흐름",
    dsl: `flowchart TD
  client([클라이언트])
  login[로그인 요청]
  api[Auth API]
  validate{비밀번호 검증}
  issue[JWT 발급]
  store[토큰 저장]
  request[보호 API 요청]
  verify{토큰 검증}
  success[데이터 응답]
  fail[401 Unauthorized]

  client --> login
  login --> api
  api --> validate
  validate -->|성공| issue
  validate -->|실패| fail
  issue --> store
  store --> request
  request --> verify
  verify -->|유효| success
  verify -->|만료/위조| fail
  success --> client
  fail --> client

@animation
  step 1: show client, login
    effect: fadeIn
    stagger: 0.3s
    duration: 1s

  step 2: connect client->login, login->api, api->validate
    flow: particles
    speed: 1s

  step 3: show api, validate
    effect: scaleIn
    stagger: 0.2s
    duration: 0.9s

  step 4: highlight validate
    color: #FF9800
    pulse: true
    duration: 1s

  step 5: connect validate->issue, issue->store
    flow: arrow
    speed: 1s

  step 6: show issue, store
    effect: bounceIn
    stagger: 0.2s
    duration: 0.9s

  step 7: connect store->request, request->verify
    flow: particles
    speed: 1s

  step 8: show request, verify
    effect: fadeIn
    stagger: 0.2s
    duration: 0.9s

  step 9: highlight verify
    color: #2196F3
    pulse: true
    duration: 1s

  step 10: connect verify->success
    flow: arrow
    speed: 1s

  step 11: show success
    effect: scaleIn
    duration: 0.8s

  step 12: connect validate->fail, verify->fail
    flow: dash
    speed: 1s

  step 13: show fail
    effect: fadeIn
    duration: 0.8s

  step 14: highlight success, fail
    color: #4CAF50
    stagger: 0.3s
    duration: 1s

  step 15: camera fitAll
    padding: 50px
    duration: 1.5s
@end

@style
  client:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 3px

  api, login, request, store:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 2px

  validate, verify:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 2px

  issue, success:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px

  fail:
    fill: #ffebee
    stroke: #F44336
    stroke-width: 3px
@end

@narration
  step 1:
    title: "로그인 시작"
    text: "클라이언트가 아이디/비밀번호로 로그인 요청을 보냅니다."

  step 4:
    title: "자격 증명 검증"
    text: "서버가 비밀번호를 해시와 비교해 검증합니다."

  step 6:
    title: "JWT 발급"
    text: "검증 성공 시 Access Token을 발급하고 저장합니다."

  step 9:
    title: "토큰 검증"
    text: "보호 API 호출 시 토큰 서명과 만료 시간을 확인합니다."

  step 11:
    title: "인증 성공"
    text: "토큰이 유효하면 요청한 데이터를 반환합니다."

  step 13:
    title: "인증 실패"
    text: "검증 실패나 만료된 토큰은 401을 반환합니다."
@end

@config
  autoplay: true
  loop: false
  controls: true
  speed: 1.0
@end`,
  },

  {
    name: "HTTP 요청-응답 사이클",
    description: "HTTP 통신의 전체 흐름",
    dsl: `flowchart LR
  client[클라이언트<br/>웹 브라우저]
  dns[DNS 서버]
  server[웹 서버]
  app[애플리케이션]
  db[(데이터베이스)]
  
  client -->|DNS 조회| dns
  dns -->|IP 반환| client
  client -->|HTTP GET| server
  server -->|요청 전달| app
  app -->|데이터 조회| db
  db -->|데이터 반환| app
  app -->|HTML 생성| server
  server -->|HTTP 응답| client

@animation
  step 1: show client
    effect: fadeIn
    duration: 1s
  
  step 2: show dns
    effect: slideInTop
    duration: 1s
  
  step 3: connect client->dns
    flow: particles
    speed: 1.5s
  
  step 4: highlight dns
    color: #2196F3
    pulse: true
    duration: 1s
  
  step 5: connect dns->client
    flow: particles
    speed: 1s
  
  step 6: show server
    effect: slideInRight
    duration: 1s
  
  step 7: connect client->server
    flow: particles
    speed: 2s
  
  step 8: highlight server
    color: #4CAF50
    glow: true
    duration: 1s
  
  step 9: show app
    effect: scaleIn
    duration: 1s
  
  step 10: connect server->app
    flow: arrow
    speed: 1s
  
  step 11: show db
    effect: bounceIn
    duration: 1s
  
  step 12: connect app->db
    flow: particles
    speed: 1s
  
  step 13: highlight db
    color: #9C27B0
    glow: true
    duration: 1s
  
  step 14: connect db->app
    flow: particles
    speed: 1s
  
  step 15: connect app->server
    flow: arrow
    speed: 1s
  
  step 16: connect server->client
    flow: particles
    speed: 2s
  
  step 17: highlight client
    color: #4CAF50
    glow: true
    duration: 1.5s
  
  step 18: camera fitAll
    padding: 40px
    duration: 2s
@end

@style
  client:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 3px
  
  dns:
    fill: #f3e5f5
    stroke: #9C27B0
    stroke-width: 2px
  
  server, app:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 2px
  
  db:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 2px
@end

@narration
  step 1:
    title: "HTTP 요청 시작"
    text: "사용자가 브라우저에 URL을 입력합니다."
  
  step 4:
    title: "DNS 조회"
    text: "DNS 서버에서 도메인을 IP 주소로 변환합니다."
  
  step 8:
    title: "HTTP 요청 전송"
    text: "웹 서버로 GET 요청을 전송합니다."
  
  step 13:
    title: "데이터 조회"
    text: "데이터베이스에서 필요한 정보를 가져옵니다."
  
  step 17:
    title: "응답 완료"
    text: "HTML 페이지가 클라이언트에 전달됩니다."
@end

@config
  autoplay: true
  loop: false
  speed: 1.0
@end`,
  },

  {
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
    effect: fadeIn
    duration: 1s
  
  step 2: connect init->c1
    flow: arrow
    speed: 1s
  
  step 3: show c1
    effect: bounceIn
    duration: 1s
  
  step 4: highlight c1
    color: #2196F3
    pulse: true
    duration: 1s
  
  step 5: connect c1->c2
    flow: particles
    speed: 1s
  
  step 6: show c2
    effect: slideInRight
    duration: 1s
  
  step 7: connect c2->c3
    flow: particles
    speed: 1s
  
  step 8: show c3
    effect: slideInRight
    duration: 1s
  
  step 9: connect c2->branch
    flow: arrow
    speed: 1s
  
  step 10: show branch
    effect: slideInTop
    duration: 1s
  
  step 11: highlight branch
    color: #FF9800
    glow: true
    duration: 1s
  
  step 12: connect branch->f1
    flow: particles
    speed: 1s
  
  step 13: show f1
    effect: slideInRight
    duration: 1s
  
  step 14: connect f1->f2
    flow: particles
    speed: 1s
  
  step 15: show f2
    effect: slideInRight
    duration: 1s
  
  step 16: show merge
    effect: scaleIn
    duration: 1s
  
  step 17: connect c3->merge, f2->merge
    flow: particles
    speed: 1.5s
  
  step 18: highlight merge
    color: #4CAF50
    flash: true
    duration: 1.5s
  
  step 19: connect merge->c4
    flow: particles
    speed: 1s
  
  step 20: show c4
    effect: bounceIn
    duration: 1s
  
  step 21: connect c4->c5
    flow: particles
    speed: 1s
  
  step 22: show c5
    effect: slideInRight
    duration: 1s
  
  step 23: highlight c5
    color: #4CAF50
    glow: true
    duration: 1.5s
  
  step 24: camera fitAll
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
    title: "Git 시작"
    text: "Git 저장소를 초기화하고 첫 번째 커밋을 생성합니다."
  
  step 10:
    title: "브랜치 생성"
    text: "새로운 기능 개발을 위해 Feature 브랜치를 생성합니다."
  
  step 15:
    title: "Feature 개발"
    text: "Feature 브랜치에서 독립적으로 작업합니다."
  
  step 18:
    title: "Merge"
    text: "Feature 브랜치의 변경사항을 Main 브랜치에 병합합니다."
  
  step 23:
    title: "릴리스"
    text: "병합이 완료되어 새로운 버전을 릴리스할 수 있습니다."
@end

@config
  autoplay: true
  loop: false
  speed: 1.0
@end`,
  },

  {
    name: "주문 처리 프로세스",
    description: "주문부터 배송까지의 전체 프로세스",
    dsl: `flowchart TD
  start([주문 접수])
  validate{재고 확인}
  payment{결제 처리}
  pack[포장 준비]
  ship[배송 시작]
  notify[고객 알림]
  complete([주문 완료])
  
  cancel[주문 취소]
  refund[환불 처리]
  
  start --> validate
  validate -->|재고 있음| payment
  validate -->|재고 없음| cancel
  payment -->|성공| pack
  payment -->|실패| refund
  pack --> ship
  ship --> notify
  notify --> complete
  cancel --> notify
  refund --> notify

@animation
  step 1: show start
    effect: bounceIn
    duration: 1s
  
  step 2: highlight start
    color: #4CAF50
    pulse: true
    duration: 1s
  
  step 3: connect start->validate
    flow: arrow
    speed: 1s
  
  step 4: show validate
    effect: flipIn
    duration: 1s
  
  step 5: highlight validate
    color: #FF9800
    pulse: true
    duration: 1s
  
  step 6: connect validate->payment
    flow: particles
    speed: 1s
  
  step 7: show payment
    effect: scaleIn
    duration: 1s
  
  step 8: highlight payment
    color: #2196F3
    pulse: true
    duration: 1s
  
  step 9: connect payment->pack
    flow: particles
    speed: 1s
  
  step 10: show pack
    effect: slideInDown
    duration: 1s
  
  step 11: highlight pack
    color: #9C27B0
    glow: true
    duration: 1s
  
  step 12: connect pack->ship
    flow: arrow
    speed: 1s
  
  step 13: show ship
    effect: slideInDown
    duration: 1s
  
  step 14: highlight ship
    color: #FF5722
    pulse: true
    duration: 1s
  
  step 15: connect ship->notify
    flow: particles
    speed: 1s
  
  step 16: show notify
    effect: bounceIn
    duration: 1s
  
  step 17: highlight notify
    color: #00BCD4
    glow: true
    duration: 1s
  
  step 18: connect notify->complete
    flow: arrow
    speed: 1s
  
  step 19: show complete
    effect: fadeIn
    duration: 1s
  
  step 20: highlight complete
    color: #4CAF50
    glow: true
    duration: 2s
  
  step 21: show cancel, refund
    effect: fadeIn
    stagger: 0.3s
  
  step 22: camera fitAll
    padding: 40px
    duration: 2s
@end

@style
  start, complete:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px
  
  validate, payment:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 2px
  
  pack, ship, notify:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 2px
  
  cancel, refund:
    fill: #ffebee
    stroke: #F44336
    stroke-width: 2px
@end

@narration
  step 1:
    title: "주문 접수"
    text: "고객으로부터 새로운 주문이 접수되었습니다."
  
  step 5:
    title: "재고 확인"
    text: "주문한 상품의 재고를 확인합니다."
  
  step 8:
    title: "결제 처리"
    text: "고객의 결제 정보를 확인하고 결제를 진행합니다."
  
  step 14:
    title: "배송 시작"
    text: "포장이 완료되어 배송이 시작됩니다."
  
  step 20:
    title: "주문 완료"
    text: "모든 프로세스가 완료되었습니다."
@end

@config
  autoplay: true
  loop: false
  controls: true
  speed: 1.0
@end`,
  },

  {
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
    effect: fadeIn
    duration: 1s
  
  step 2: connect A->B
    flow: particles
    speed: 1.5s
  
  step 3: show B
    effect: slideInRight
    duration: 1s
  
  step 4: connect B->C
    flow: particles
    speed: 1.5s
  
  step 5: show C
    effect: slideInRight
    duration: 1s
  
  step 6: highlight A, B, C
    color: #4CAF50
    glow: true
    stagger: 0.3s
@end

@style
  A, B, C:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 3px
@end

@narration
  step 1:
    title: "시작"
    text: "간단한 프로세스의 시작입니다."
  
  step 6:
    title: "완료"
    text: "프로세스가 완료되었습니다."
@end

@config
  autoplay: true
  loop: false
  speed: 1.0
@end`,
  },
];
