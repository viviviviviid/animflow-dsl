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

  step 8: connect block2->block3
    name: "Block2에서 Block3 연결"
    description: "block2에서 block3으로 흐름을 연결합니다."
    flow: particles
    speed: 2s

  step 9: show block3
    name: "Block3 표시"
    description: "block3 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 1s

  step 10: camera fitAll
    name: "카메라 전체 맞춤"
    description: "전체 다이어그램이 보이도록 카메라를 조정합니다."
    padding: 50px
    duration: 1.5s

  step 11: highlight genesis, block1, block2, block3
    name: "전체 블록 강조"
    description: "genesis와 모든 블록을 한 번에 강조합니다."
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
    name: "로그인 시작 노드 표시"
    description: "client와 login 노드를 화면에 표시합니다."
    effect: fadeIn
    stagger: 0.3s
    duration: 1s

  step 2: connect client->login, login->api, api->validate
    name: "인증 요청 경로 연결"
    description: "client에서 validate까지 인증 요청 경로를 연결합니다."
    flow: particles
    speed: 1s

  step 3: show api, validate
    name: "인증 서버 노드 표시"
    description: "api와 validate 노드를 화면에 표시합니다."
    effect: scaleIn
    stagger: 0.2s
    duration: 0.9s

  step 4: highlight validate
    name: "비밀번호 검증 강조"
    description: "validate 단계의 검증 동작을 강조합니다."
    color: #FF9800
    pulse: true
    duration: 1s

  step 5: connect validate->issue, issue->store
    name: "토큰 발급 흐름 연결"
    description: "validate에서 issue, store로 이어지는 성공 경로를 연결합니다."
    flow: arrow
    speed: 1s

  step 6: show issue, store
    name: "발급 및 저장 노드 표시"
    description: "issue와 store 노드를 화면에 표시합니다."
    effect: bounceIn
    stagger: 0.2s
    duration: 0.9s

  step 7: connect store->request, request->verify
    name: "보호 API 요청 경로 연결"
    description: "store에서 verify까지 보호 API 요청 경로를 연결합니다."
    flow: particles
    speed: 1s

  step 8: show request, verify
    name: "요청/검증 노드 표시"
    description: "request와 verify 노드를 화면에 표시합니다."
    effect: fadeIn
    stagger: 0.2s
    duration: 0.9s

  step 9: highlight verify
    name: "토큰 검증 강조"
    description: "verify 단계의 토큰 검증을 강조합니다."
    color: #2196F3
    pulse: true
    duration: 1s

  step 10: connect verify->success
    name: "검증 성공 연결"
    description: "verify에서 success로 이어지는 성공 경로를 연결합니다."
    flow: arrow
    speed: 1s

  step 11: show success
    name: "성공 응답 표시"
    description: "success 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 0.8s

  step 12: connect validate->fail, verify->fail
    name: "실패 경로 연결"
    description: "validate와 verify에서 fail로 이어지는 실패 경로를 연결합니다."
    flow: dash
    speed: 1s

  step 13: show fail
    name: "실패 응답 표시"
    description: "fail 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 0.8s

  step 14: highlight success, fail
    name: "결과 노드 강조"
    description: "success와 fail 결과 노드를 함께 강조합니다."
    color: #4CAF50
    stagger: 0.3s
    duration: 1s

  step 15: camera fitAll
    name: "카메라 전체 맞춤"
    description: "전체 인증 흐름이 보이도록 카메라를 조정합니다."
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
    name: "클라이언트 표시"
    description: "client 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 1s
  
  step 2: show dns
    name: "DNS 표시"
    description: "dns 노드를 화면에 표시합니다."
    effect: slideInTop
    duration: 1s
  
  step 3: connect client->dns
    name: "DNS 조회 연결"
    description: "client에서 dns로 조회 요청 흐름을 연결합니다."
    flow: particles
    speed: 1.5s
  
  step 4: highlight dns
    name: "DNS 강조"
    description: "dns 조회 단계를 강조합니다."
    color: #2196F3
    pulse: true
    duration: 1s
  
  step 5: connect dns->client
    name: "DNS 응답 연결"
    description: "dns에서 client로 응답 흐름을 연결합니다."
    flow: particles
    speed: 1s
  
  step 6: show server
    name: "서버 표시"
    description: "server 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 1s
  
  step 7: connect client->server
    name: "HTTP 요청 연결"
    description: "client에서 server로 HTTP 요청 흐름을 연결합니다."
    flow: particles
    speed: 2s
  
  step 8: highlight server
    name: "서버 강조"
    description: "server 처리 단계를 강조합니다."
    color: #4CAF50
    glow: true
    duration: 1s
  
  step 9: show app
    name: "애플리케이션 표시"
    description: "app 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 1s
  
  step 10: connect server->app
    name: "서버-앱 연결"
    description: "server에서 app으로 요청 전달 흐름을 연결합니다."
    flow: arrow
    speed: 1s
  
  step 11: show db
    name: "데이터베이스 표시"
    description: "db 노드를 화면에 표시합니다."
    effect: bounceIn
    duration: 1s
  
  step 12: connect app->db
    name: "DB 조회 연결"
    description: "app에서 db로 조회 요청 흐름을 연결합니다."
    flow: particles
    speed: 1s
  
  step 13: highlight db
    name: "DB 강조"
    description: "db 조회 단계를 강조합니다."
    color: #9C27B0
    glow: true
    duration: 1s
  
  step 14: connect db->app
    name: "DB 응답 연결"
    description: "db에서 app으로 응답 흐름을 연결합니다."
    flow: particles
    speed: 1s
  
  step 15: connect app->server
    name: "앱-서버 응답 연결"
    description: "app에서 server로 응답 생성 흐름을 연결합니다."
    flow: arrow
    speed: 1s
  
  step 16: connect server->client
    name: "최종 응답 연결"
    description: "server에서 client로 최종 응답 흐름을 연결합니다."
    flow: particles
    speed: 2s
  
  step 17: highlight client
    name: "클라이언트 완료 강조"
    description: "client에서 응답 완료 상태를 강조합니다."
    color: #4CAF50
    glow: true
    duration: 1.5s
  
  step 18: camera fitAll
    name: "카메라 전체 맞춤"
    description: "전체 요청-응답 흐름이 보이도록 카메라를 조정합니다."
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
    name: "저장소 초기화 표시"
    description: "init 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 1s
  
  step 2: connect init->c1
    name: "초기 커밋 연결"
    description: "init에서 c1으로 흐름을 연결합니다."
    flow: arrow
    speed: 1s
  
  step 3: show c1
    name: "Commit 1 표시"
    description: "c1 노드를 화면에 표시합니다."
    effect: bounceIn
    duration: 1s
  
  step 4: highlight c1
    name: "Commit 1 강조"
    description: "c1 커밋을 강조합니다."
    color: #2196F3
    pulse: true
    duration: 1s
  
  step 5: connect c1->c2
    name: "Commit 1에서 2 연결"
    description: "c1에서 c2로 흐름을 연결합니다."
    flow: particles
    speed: 1s
  
  step 6: show c2
    name: "Commit 2 표시"
    description: "c2 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 1s
  
  step 7: connect c2->c3
    name: "Commit 2에서 3 연결"
    description: "c2에서 c3로 흐름을 연결합니다."
    flow: particles
    speed: 1s
  
  step 8: show c3
    name: "Commit 3 표시"
    description: "c3 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 1s
  
  step 9: connect c2->branch
    name: "브랜치 분기 연결"
    description: "c2에서 branch로 분기 흐름을 연결합니다."
    flow: arrow
    speed: 1s
  
  step 10: show branch
    name: "Feature 브랜치 표시"
    description: "branch 노드를 화면에 표시합니다."
    effect: slideInTop
    duration: 1s
  
  step 11: highlight branch
    name: "Feature 브랜치 강조"
    description: "branch 노드를 강조합니다."
    color: #FF9800
    glow: true
    duration: 1s
  
  step 12: connect branch->f1
    name: "Feature Commit1 연결"
    description: "branch에서 f1으로 흐름을 연결합니다."
    flow: particles
    speed: 1s
  
  step 13: show f1
    name: "Feature Commit1 표시"
    description: "f1 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 1s
  
  step 14: connect f1->f2
    name: "Feature Commit2 연결"
    description: "f1에서 f2로 흐름을 연결합니다."
    flow: particles
    speed: 1s
  
  step 15: show f2
    name: "Feature Commit2 표시"
    description: "f2 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 1s
  
  step 16: show merge
    name: "머지 노드 표시"
    description: "merge 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 1s
  
  step 17: connect c3->merge, f2->merge
    name: "머지 경로 연결"
    description: "main과 feature 경로를 merge로 연결합니다."
    flow: particles
    speed: 1.5s
  
  step 18: highlight merge
    name: "머지 강조"
    description: "merge 단계를 강조합니다."
    color: #4CAF50
    flash: true
    duration: 1.5s
  
  step 19: connect merge->c4
    name: "머지 후 커밋 연결"
    description: "merge에서 c4로 흐름을 연결합니다."
    flow: particles
    speed: 1s
  
  step 20: show c4
    name: "Commit 4 표시"
    description: "c4 노드를 화면에 표시합니다."
    effect: bounceIn
    duration: 1s
  
  step 21: connect c4->c5
    name: "릴리스 전 연결"
    description: "c4에서 c5로 흐름을 연결합니다."
    flow: particles
    speed: 1s
  
  step 22: show c5
    name: "릴리스 노드 표시"
    description: "c5 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 1s
  
  step 23: highlight c5
    name: "릴리스 강조"
    description: "c5 노드를 강조합니다."
    color: #4CAF50
    glow: true
    duration: 1.5s
  
  step 24: camera fitAll
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
    name: "주문 접수 표시"
    description: "start 노드를 화면에 표시합니다."
    effect: bounceIn
    duration: 1s
  
  step 2: highlight start
    name: "주문 접수 강조"
    description: "start 단계를 강조합니다."
    color: #4CAF50
    pulse: true
    duration: 1s
  
  step 3: connect start->validate
    name: "재고 확인 연결"
    description: "start에서 validate로 흐름을 연결합니다."
    flow: arrow
    speed: 1s
  
  step 4: show validate
    name: "재고 확인 표시"
    description: "validate 노드를 화면에 표시합니다."
    effect: flipIn
    duration: 1s
  
  step 5: highlight validate
    name: "재고 확인 강조"
    description: "validate 단계를 강조합니다."
    color: #FF9800
    pulse: true
    duration: 1s
  
  step 6: connect validate->payment
    name: "결제 단계 연결"
    description: "validate에서 payment로 흐름을 연결합니다."
    flow: particles
    speed: 1s
  
  step 7: show payment
    name: "결제 처리 표시"
    description: "payment 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 1s
  
  step 8: highlight payment
    name: "결제 처리 강조"
    description: "payment 단계를 강조합니다."
    color: #2196F3
    pulse: true
    duration: 1s
  
  step 9: connect payment->pack
    name: "포장 준비 연결"
    description: "payment에서 pack으로 흐름을 연결합니다."
    flow: particles
    speed: 1s
  
  step 10: show pack
    name: "포장 준비 표시"
    description: "pack 노드를 화면에 표시합니다."
    effect: slideInDown
    duration: 1s
  
  step 11: highlight pack
    name: "포장 준비 강조"
    description: "pack 단계를 강조합니다."
    color: #9C27B0
    glow: true
    duration: 1s
  
  step 12: connect pack->ship
    name: "배송 시작 연결"
    description: "pack에서 ship으로 흐름을 연결합니다."
    flow: arrow
    speed: 1s
  
  step 13: show ship
    name: "배송 시작 표시"
    description: "ship 노드를 화면에 표시합니다."
    effect: slideInDown
    duration: 1s
  
  step 14: highlight ship
    name: "배송 시작 강조"
    description: "ship 단계를 강조합니다."
    color: #FF5722
    pulse: true
    duration: 1s
  
  step 15: connect ship->notify
    name: "고객 알림 연결"
    description: "ship에서 notify로 흐름을 연결합니다."
    flow: particles
    speed: 1s
  
  step 16: show notify
    name: "고객 알림 표시"
    description: "notify 노드를 화면에 표시합니다."
    effect: bounceIn
    duration: 1s
  
  step 17: highlight notify
    name: "고객 알림 강조"
    description: "notify 단계를 강조합니다."
    color: #00BCD4
    glow: true
    duration: 1s
  
  step 18: connect notify->complete
    name: "완료 단계 연결"
    description: "notify에서 complete로 흐름을 연결합니다."
    flow: arrow
    speed: 1s
  
  step 19: show complete
    name: "주문 완료 표시"
    description: "complete 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 1s
  
  step 20: highlight complete
    name: "주문 완료 강조"
    description: "complete 단계를 강조합니다."
    color: #4CAF50
    glow: true
    duration: 2s
  
  step 21: show cancel, refund
    name: "예외 노드 표시"
    description: "cancel과 refund 노드를 화면에 표시합니다."
    effect: fadeIn
    stagger: 0.3s
  
  step 22: camera fitAll
    name: "카메라 전체 맞춤"
    description: "전체 주문 처리 흐름이 보이도록 카메라를 조정합니다."
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

  step 2: show client1, client2
    name: "클라이언트 표시"
    description: "client1, client2 노드를 화면에 표시합니다."
    effect: slideInLeft
    stagger: 0.3s
    duration: 1s

  step 3: connect client1->lb, client2->lb
    name: "클라이언트-LB 연결"
    description: "클라이언트들을 로드밸런서에 연결합니다."
    flow: particles
    speed: 1.5s

  step 4: highlight lb
    name: "로드밸런서 강조"
    description: "lb 노드를 강조합니다."
    color: #FF9800
    pulse: true
    duration: 1s

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

  step 7: show db, cache
    name: "DB/캐시 표시"
    description: "db, cache 노드를 화면에 표시합니다."
    effect: bounceIn
    stagger: 0.3s
    duration: 1s

  step 8: connect server->db, server->cache
    name: "서버-스토리지 연결"
    description: "서버에서 DB와 캐시로 연결합니다."
    flow: particles
    speed: 1.5s

  step 9: highlight server, db, cache
    name: "백엔드 강조"
    description: "서버 인프라를 강조합니다."
    color: #4CAF50
    glow: true
    stagger: 0.2s
    duration: 1.5s

  step 10: camera fitAll
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
    title: "네트워크 입구"
    text: "로드밸런서가 트래픽을 분산합니다."

  step 3:
    title: "클라이언트 연결"
    text: "클라이언트들이 로드밸런서에 양방향으로 연결됩니다."

  step 6:
    title: "서버 연결"
    text: "로드밸런서가 메인 서버와 연결됩니다."

  step 9:
    title: "백엔드 인프라"
    text: "서버는 DB와 캐시에 양방향으로 통신합니다."
@end

@config
  autoplay: true
  loop: false
  controls: true
  speed: 1.0
@end`,
  },

  {
    name: "마이크로서비스 아키텍처",
    description: "API Gateway, 서비스, DB, 메시지 큐를 포함한 MSA 구조",
    dsl: `flowchart TD
  user([사용자])
  gateway[API Gateway]
  auth[인증 서비스]
  user_svc[유저 서비스]
  order_svc[주문 서비스]
  pay_svc[결제 서비스]
  notify_svc[알림 서비스]
  mq([메시지 큐])
  user_db[(유저 DB)]
  order_db[(주문 DB)]
  pay_db[(결제 DB)]
  cache[Redis 캐시]
  log[로그 수집기]

  user --> gateway
  gateway --> auth
  gateway --> user_svc
  gateway --> order_svc
  auth --- cache
  user_svc --- user_db
  order_svc --- order_db
  order_svc --> pay_svc
  pay_svc --- pay_db
  pay_svc --> mq
  mq --> notify_svc
  order_svc --> mq
  gateway --- log
  auth --- log

@animation
  step 1: show user
    name: "사용자 표시"
    description: "user 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 1s

  step 2: show gateway
    name: "API Gateway 표시"
    description: "gateway 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 1s

  step 3: connect user->gateway
    name: "사용자 요청"
    description: "사용자에서 gateway로 흐름을 연결합니다."
    flow: particles
    speed: 1.5s

  step 4: highlight gateway
    name: "Gateway 강조"
    description: "gateway를 강조합니다."
    color: #FF9800
    glow: true
    duration: 1s

  step 5: show auth
    name: "인증 서비스 표시"
    description: "auth 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 0.8s

  step 6: connect gateway->auth
    name: "인증 연결"
    description: "gateway에서 auth로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 7: show cache
    name: "캐시 표시"
    description: "cache 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 0.8s

  step 8: connect auth->cache
    name: "캐시 연결"
    description: "auth에서 cache로 연결합니다."
    flow: particles
    speed: 1s

  step 9: show user_svc, order_svc
    name: "핵심 서비스 표시"
    description: "user_svc, order_svc 노드를 화면에 표시합니다."
    effect: slideInBottom
    stagger: 0.3s
    duration: 0.8s

  step 10: connect gateway->user_svc, gateway->order_svc
    name: "서비스 라우팅"
    description: "gateway에서 서비스들로 흐름을 연결합니다."
    flow: arrow
    speed: 1s

  step 11: show user_db, order_db
    name: "DB 표시"
    description: "user_db, order_db 노드를 화면에 표시합니다."
    effect: bounceIn
    stagger: 0.3s
    duration: 0.8s

  step 12: connect user_svc->user_db, order_svc->order_db
    name: "DB 연결"
    description: "서비스에서 DB로 연결합니다."
    flow: particles
    speed: 1s

  step 13: show pay_svc
    name: "결제 서비스 표시"
    description: "pay_svc 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 0.8s

  step 14: connect order_svc->pay_svc
    name: "결제 요청"
    description: "order_svc에서 pay_svc로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 15: show pay_db
    name: "결제 DB 표시"
    description: "pay_db 노드를 화면에 표시합니다."
    effect: bounceIn
    duration: 0.8s

  step 16: connect pay_svc->pay_db
    name: "결제 DB 연결"
    description: "pay_svc에서 pay_db로 연결합니다."
    flow: particles
    speed: 1s

  step 17: highlight pay_svc
    name: "결제 강조"
    description: "pay_svc를 강조합니다."
    color: #4CAF50
    pulse: true
    duration: 1s

  step 18: show mq
    name: "메시지 큐 표시"
    description: "mq 노드를 화면에 표시합니다."
    effect: flipIn
    duration: 1s

  step 19: connect pay_svc->mq, order_svc->mq
    name: "이벤트 발행"
    description: "서비스에서 메시지 큐로 흐름을 연결합니다."
    flow: particles
    speed: 1.5s

  step 20: highlight mq
    name: "메시지 큐 강조"
    description: "mq를 강조합니다."
    color: #9C27B0
    glow: true
    duration: 1s

  step 21: show notify_svc
    name: "알림 서비스 표시"
    description: "notify_svc 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 0.8s

  step 22: connect mq->notify_svc
    name: "알림 전달"
    description: "mq에서 notify_svc로 흐름을 연결합니다."
    flow: arrow
    speed: 1s

  step 23: show log
    name: "로그 수집기 표시"
    description: "log 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 0.8s

  step 24: connect gateway->log, auth->log
    name: "로그 수집"
    description: "gateway, auth에서 log로 연결합니다."
    flow: dash
    speed: 1.5s

  step 25: camera fitAll
    name: "카메라 전체 맞춤"
    description: "전체 아키텍처가 보이도록 카메라를 조정합니다."
    padding: 40px
    duration: 1.5s

  step 26: highlight gateway, auth, user_svc, order_svc, pay_svc, notify_svc
    name: "전체 서비스 강조"
    description: "모든 서비스를 강조합니다."
    color: #2196F3
    glow: true
    stagger: 0.2s
    duration: 2s
@end

@style
  user:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 3px

  gateway:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 3px

  auth, user_svc, order_svc, pay_svc, notify_svc:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 2px

  mq:
    fill: #f3e5f5
    stroke: #9C27B0
    stroke-width: 3px

  user_db, order_db, pay_db:
    fill: #fff8e1
    stroke: #FFC107
    stroke-width: 2px

  cache:
    fill: #fce4ec
    stroke: #E91E63
    stroke-width: 2px

  log:
    fill: #efebe9
    stroke: #795548
    stroke-width: 2px
@end

@narration
  step 1:
    title: "클라이언트 요청"
    text: "사용자가 API Gateway로 요청을 보냅니다."

  step 4:
    title: "API Gateway"
    text: "모든 요청을 받아 적절한 서비스로 라우팅합니다."

  step 6:
    title: "인증 처리"
    text: "JWT 토큰 검증과 세션 캐시를 관리합니다."

  step 10:
    title: "서비스 라우팅"
    text: "인증 후 유저/주문 서비스로 요청을 전달합니다."

  step 17:
    title: "결제 처리"
    text: "주문 서비스가 결제 서비스를 호출합니다."

  step 20:
    title: "비동기 이벤트"
    text: "메시지 큐를 통해 서비스 간 비동기 통신합니다."

  step 26:
    title: "MSA 완성"
    text: "각 서비스가 독립적으로 배포/확장 가능한 구조입니다."
@end

@config
  autoplay: true
  loop: false
  controls: true
  speed: 1.0
@end`,
  },

  {
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

  step 5: show r1cs
    name: "R1CS 변환"
    description: "r1cs 노드를 화면에 표시합니다."
    effect: slideInBottom
    duration: 1s

  step 6: connect circuit->r1cs
    name: "R1CS 변환 연결"
    description: "circuit에서 r1cs로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 7: show qap
    name: "QAP 변환"
    description: "qap 노드를 화면에 표시합니다."
    effect: slideInBottom
    duration: 1s

  step 8: connect r1cs->qap
    name: "QAP 변환 연결"
    description: "r1cs에서 qap으로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 9: highlight circuit, r1cs, qap
    name: "변환 파이프라인 강조"
    description: "변환 단계를 강조합니다."
    color: #FF9800
    glow: true
    stagger: 0.2s
    duration: 1s

  step 10: show setup
    name: "Trusted Setup"
    description: "setup 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 1s

  step 11: connect qap->setup
    name: "셋업 연결"
    description: "qap에서 setup으로 흐름을 연결합니다."
    flow: arrow
    speed: 1.5s

  step 12: highlight setup
    name: "Trusted Setup 강조"
    description: "setup을 강조합니다."
    color: #F44336
    pulse: true
    duration: 1.5s

  step 13: show toxic
    name: "Toxic Waste 표시"
    description: "toxic 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 0.8s

  step 14: connect setup->toxic
    name: "Toxic Waste 연결"
    description: "setup에서 toxic으로 흐름을 연결합니다."
    flow: dash
    speed: 1s

  step 15: highlight toxic
    name: "Toxic Waste 강조"
    description: "toxic을 강조합니다."
    color: #F44336
    flash: true
    duration: 1s

  step 16: show pk, vk
    name: "키 생성"
    description: "pk, vk 노드를 화면에 표시합니다."
    effect: bounceIn
    stagger: 0.3s
    duration: 1s

  step 17: connect setup->pk, setup->vk
    name: "키 분배 연결"
    description: "setup에서 pk, vk로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 18: show witness, public
    name: "입력값 표시"
    description: "witness, public 노드를 화면에 표시합니다."
    effect: slideInLeft
    stagger: 0.3s
    duration: 1s

  step 19: highlight witness
    name: "비밀 입력 강조"
    description: "witness를 강조합니다."
    color: #9C27B0
    glow: true
    duration: 1s

  step 20: show prover
    name: "Prover 표시"
    description: "prover 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 1s

  step 21: connect witness->prover, public->prover, pk->prover
    name: "Prover 입력 연결"
    description: "witness, public, pk에서 prover로 흐름을 연결합니다."
    flow: particles
    speed: 1.5s

  step 22: highlight prover
    name: "Prover 강조"
    description: "prover를 강조합니다."
    color: #4CAF50
    pulse: true
    duration: 1.5s

  step 23: show proof
    name: "증명 생성"
    description: "proof 노드를 화면에 표시합니다."
    effect: flipIn
    duration: 1s

  step 24: connect prover->proof
    name: "증명 출력 연결"
    description: "prover에서 proof로 흐름을 연결합니다."
    flow: arrow
    speed: 1s

  step 25: highlight proof
    name: "증명 강조"
    description: "proof를 강조합니다."
    color: #4CAF50
    glow: true
    duration: 1s

  step 26: show verifier
    name: "Verifier 표시"
    description: "verifier 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 1s

  step 27: connect proof->verifier, vk->verifier, public->verifier
    name: "검증 입력 연결"
    description: "proof, vk, public에서 verifier로 흐름을 연결합니다."
    flow: particles
    speed: 1.5s

  step 28: highlight verifier
    name: "Verifier 강조"
    description: "verifier를 강조합니다."
    color: #2196F3
    pulse: true
    duration: 1.5s

  step 29: show accept, reject
    name: "결과 표시"
    description: "accept, reject 노드를 화면에 표시합니다."
    effect: bounceIn
    stagger: 0.3s
    duration: 1s

  step 30: connect verifier->accept, verifier->reject
    name: "검증 결과 연결"
    description: "verifier에서 결과로 흐름을 연결합니다."
    flow: arrow
    speed: 1s

  step 31: camera fitAll
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
    title: "계산 문제 정의"
    text: "증명하고 싶은 계산을 정의합니다. 예: 비밀값 x를 알고 있으며 f(x) = y임을 증명."

  step 3:
    title: "산술 회로 변환"
    text: "계산을 덧셈/곱셈 게이트로 구성된 산술 회로로 변환합니다."

  step 5:
    title: "R1CS 변환"
    text: "각 게이트를 (A·w)×(B·w)=(C·w) 형태의 제약 조건으로 변환합니다."

  step 7:
    title: "QAP 변환"
    text: "라그랑주 보간으로 제약 조건을 다항식으로 변환합니다. P(x)가 t(x)로 나누어지면 모든 제약 충족."

  step 12:
    title: "Trusted Setup"
    text: "MPC 세레모니로 Proving Key와 Verification Key를 생성합니다. 참가자 중 1명만 정직하면 안전."

  step 15:
    title: "Toxic Waste"
    text: "셋업에 사용된 비밀값은 반드시 폐기해야 합니다. 유출 시 가짜 증명 생성 가능."

  step 19:
    title: "비밀 입력 (Witness)"
    text: "Prover만 아는 비밀 입력값입니다. 이 값은 절대 공개되지 않습니다."

  step 22:
    title: "증명 생성"
    text: "Prover가 Witness + Public Input + Proving Key로 간결한 증명을 생성합니다."

  step 28:
    title: "증명 검증"
    text: "Verifier가 Proof + Public Input + Verification Key만으로 검증합니다. 원래 계산을 다시 실행할 필요 없음."

  step 31:
    title: "zk-SNARK 완성"
    text: "Zero-Knowledge: 비밀 노출 없음. Succinct: 증명이 간결. Non-Interactive: 한 번의 통신으로 완료."
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
    name: "시작 노드 표시"
    description: "A 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 1s
  
  step 2: connect A->B
    name: "시작에서 처리 연결"
    description: "A에서 B로 흐름을 연결합니다."
    flow: particles
    speed: 1.5s
  
  step 3: show B
    name: "처리 노드 표시"
    description: "B 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 1s
  
  step 4: connect B->C
    name: "처리에서 종료 연결"
    description: "B에서 C로 흐름을 연결합니다."
    flow: particles
    speed: 1.5s
  
  step 5: show C
    name: "종료 노드 표시"
    description: "C 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 1s
  
  step 6: highlight A, B, C
    name: "전체 단계 강조"
    description: "A, B, C 전체 노드를 강조합니다."
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
