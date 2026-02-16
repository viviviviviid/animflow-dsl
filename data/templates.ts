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
