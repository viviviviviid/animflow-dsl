import type { Template } from "./index";

export const httpCycleTemplate: Template = {
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

  step 2: highlight client
    name: "클라이언트 강조"
    description: "client를 강조합니다."
    color: #2196F3
    glow: true
    duration: 1s

  step 3: show dns
    name: "DNS 표시"
    description: "dns 노드를 화면에 표시합니다."
    effect: slideInTop
    duration: 1s

  step 4: connect client->dns
    name: "DNS 조회 연결"
    description: "client에서 dns로 조회 요청 흐름을 연결합니다."
    flow: particles
    speed: 1.5s

  step 5: highlight dns
    name: "DNS 강조"
    description: "dns 조회 단계를 강조합니다."
    color: #9C27B0
    pulse: true
    duration: 1s

  step 6: connect dns->client
    name: "DNS 응답 연결"
    description: "dns에서 client로 응답 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 7: show server
    name: "서버 표시"
    description: "server 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 1s

  step 8: connect client->server
    name: "HTTP 요청 연결"
    description: "client에서 server로 HTTP 요청 흐름을 연결합니다."
    flow: particles
    speed: 2s

  step 9: highlight server
    name: "서버 강조"
    description: "server 처리 단계를 강조합니다."
    color: #4CAF50
    glow: true
    duration: 1s

  step 10: show app
    name: "애플리케이션 표시"
    description: "app 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 1s

  step 11: connect server->app
    name: "서버-앱 연결"
    description: "server에서 app으로 요청 전달 흐름을 연결합니다."
    flow: arrow
    speed: 1s

  step 12: highlight app
    name: "앱 강조"
    description: "app 노드를 강조합니다."
    color: #4CAF50
    pulse: true
    duration: 1s

  step 13: show db
    name: "데이터베이스 표시"
    description: "db 노드를 화면에 표시합니다."
    effect: bounceIn
    duration: 1s

  step 14: connect app->db
    name: "DB 조회 연결"
    description: "app에서 db로 조회 요청 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 15: highlight db
    name: "DB 강조"
    description: "db 조회 단계를 강조합니다."
    color: #FF9800
    glow: true
    duration: 1s

  step 16: connect db->app
    name: "DB 응답 연결"
    description: "db에서 app으로 응답 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 17: connect app->server
    name: "앱-서버 응답 연결"
    description: "app에서 server로 응답 생성 흐름을 연결합니다."
    flow: arrow
    speed: 1s

  step 18: connect server->client
    name: "최종 응답 연결"
    description: "server에서 client로 최종 응답 흐름을 연결합니다."
    flow: particles
    speed: 2s

  step 19: highlight client
    name: "클라이언트 완료 강조"
    description: "client에서 응답 완료 상태를 강조합니다."
    color: #4CAF50
    glow: true
    duration: 1.5s

  step 20: camera fitAll
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
    title: "웹 브라우저에서 시작"
    text: "여러분이 브라우저 주소창에 URL(예: www.google.com)을 입력하면, 보이지 않는 곳에서 복잡한 과정이 시작됩니다. 이 과정을 하나씩 따라가 봅시다."

  step 2:
    title: "클라이언트란?"
    text: "여러분의 웹 브라우저가 바로 '클라이언트'입니다. 서버에게 정보를 요청하는 쪽이죠. 마치 식당에서 메뉴를 주문하는 손님과 같습니다."

  step 4:
    title: "DNS 조회 - 주소 찾기"
    text: "브라우저는 먼저 'www.google.com'이 어디 있는지 찾아야 합니다. DNS 서버는 인터넷의 전화번호부로, 도메인 이름을 실제 서버 IP 주소(예: 142.250.196.110)로 변환해 줍니다."

  step 5:
    title: "DNS가 IP를 찾다"
    text: "DNS 서버가 'www.google.com = 142.250.196.110'이라는 답을 돌려줍니다. 이제 브라우저는 이 IP 주소로 직접 연결할 수 있습니다."

  step 8:
    title: "HTTP 요청 전송"
    text: "브라우저가 웹 서버에 'GET / HTTP/1.1'이라는 요청을 보냅니다. '이 페이지의 내용을 주세요'라는 의미입니다. HTTP는 웹에서 데이터를 주고받는 약속(프로토콜)입니다."

  step 9:
    title: "웹 서버가 요청을 받다"
    text: "웹 서버(Nginx, Apache 등)가 요청을 수신합니다. 정적 파일(이미지, CSS)이면 바로 응답하고, 동적 콘텐츠면 애플리케이션으로 전달합니다."

  step 12:
    title: "애플리케이션이 처리"
    text: "애플리케이션(Node.js, Django 등)이 비즈니스 로직을 실행합니다. '이 사용자의 주문 목록을 보여줘야 하니까 데이터베이스에서 조회하자' 같은 판단을 합니다."

  step 14:
    title: "데이터베이스 조회"
    text: "애플리케이션이 데이터베이스(MySQL, PostgreSQL 등)에 SQL 쿼리를 보내 필요한 데이터를 가져옵니다. 마치 도서관에서 필요한 책을 찾는 것과 같습니다."

  step 15:
    title: "데이터 반환"
    text: "데이터베이스가 요청한 데이터를 반환합니다. 애플리케이션은 이 데이터를 HTML 페이지로 변환합니다."

  step 18:
    title: "HTTP 응답 전송"
    text: "완성된 HTML이 웹 서버를 거쳐 브라우저로 돌아옵니다. 응답에는 상태 코드(200 OK, 404 Not Found 등)와 함께 HTML, CSS, JavaScript 파일이 포함됩니다."

  step 19:
    title: "페이지 렌더링 완료"
    text: "브라우저가 받은 HTML을 해석하고 화면에 그려줍니다. 이 모든 과정이 보통 수백 밀리초(0.1~0.5초) 안에 일어납니다! 이것이 여러분이 URL을 입력할 때마다 일어나는 일입니다."
@end

@config
  autoplay: true
  loop: false
  speed: 1.0
@end`,
};
