import type { Template } from "./index";

export const jwtAuthTemplate: Template = {
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
  step 1: show client
    name: "클라이언트 표시"
    description: "client 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 1s

  step 2: show login
    name: "로그인 요청 표시"
    description: "login 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 1s

  step 3: connect client->login
    name: "로그인 요청 연결"
    description: "client에서 login으로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 4: show api
    name: "Auth API 표시"
    description: "api 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 0.9s

  step 5: connect login->api
    name: "API 전달 연결"
    description: "login에서 api로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 6: show validate
    name: "비밀번호 검증 표시"
    description: "validate 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 0.9s

  step 7: connect api->validate
    name: "검증 요청 연결"
    description: "api에서 validate로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 8: highlight validate
    name: "비밀번호 검증 강조"
    description: "validate 단계의 검증 동작을 강조합니다."
    color: #FF9800
    pulse: true
    duration: 1s

  step 9: show issue
    name: "JWT 발급 표시"
    description: "issue 노드를 화면에 표시합니다."
    effect: bounceIn
    duration: 0.9s

  step 10: connect validate->issue
    name: "발급 흐름 연결"
    description: "validate에서 issue로 성공 경로를 연결합니다."
    flow: arrow
    speed: 1s

  step 11: highlight issue
    name: "JWT 발급 강조"
    description: "issue 단계를 강조합니다."
    color: #4CAF50
    glow: true
    duration: 1s

  step 12: show store
    name: "토큰 저장 표시"
    description: "store 노드를 화면에 표시합니다."
    effect: bounceIn
    duration: 0.9s

  step 13: connect issue->store
    name: "저장 흐름 연결"
    description: "issue에서 store로 흐름을 연결합니다."
    flow: arrow
    speed: 1s

  step 14: show request
    name: "보호 API 요청 표시"
    description: "request 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 0.9s

  step 15: connect store->request
    name: "API 요청 연결"
    description: "store에서 request로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 16: show verify
    name: "토큰 검증 표시"
    description: "verify 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 0.9s

  step 17: connect request->verify
    name: "토큰 검증 연결"
    description: "request에서 verify로 흐름을 연결합니다."
    flow: particles
    speed: 1s

  step 18: highlight verify
    name: "토큰 검증 강조"
    description: "verify 단계의 토큰 검증을 강조합니다."
    color: #2196F3
    pulse: true
    duration: 1s

  step 19: show success
    name: "성공 응답 표시"
    description: "success 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 0.8s

  step 20: connect verify->success
    name: "검증 성공 연결"
    description: "verify에서 success로 성공 경로를 연결합니다."
    flow: arrow
    speed: 1s

  step 21: highlight success
    name: "성공 강조"
    description: "success 노드를 강조합니다."
    color: #4CAF50
    glow: true
    duration: 1s

  step 22: show fail
    name: "실패 응답 표시"
    description: "fail 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 0.8s

  step 23: connect validate->fail, verify->fail
    name: "실패 경로 연결"
    description: "validate와 verify에서 fail로 이어지는 실패 경로를 연결합니다."
    flow: dash
    speed: 1s

  step 24: highlight fail
    name: "실패 강조"
    description: "fail 노드를 강조합니다."
    color: #F44336
    pulse: true
    duration: 1s

  step 25: camera fitAll
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
    text: "사용자가 웹사이트에서 아이디와 비밀번호를 입력하고 '로그인' 버튼을 누릅니다. 이 정보가 서버로 전송되는 것이 첫 번째 단계입니다."

  step 6:
    title: "서버가 요청을 받다"
    text: "Auth API 서버가 로그인 요청을 받으면, 데이터베이스에 저장된 비밀번호 해시와 사용자가 보낸 비밀번호를 비교합니다."

  step 8:
    title: "비밀번호 검증"
    text: "비밀번호는 절대 원본 그대로 저장되지 않습니다. '해시 함수'로 변환된 값만 저장되어 있어서, 입력된 비밀번호도 같은 방식으로 변환한 뒤 비교합니다. 마치 지문 대조와 같죠."

  step 11:
    title: "JWT 토큰 발급"
    text: "비밀번호 검증에 성공하면, 서버는 JWT(JSON Web Token)를 발급합니다. JWT는 '디지털 출입증'과 같아서, 사용자가 누구인지와 어떤 권한이 있는지를 담고 있습니다."

  step 13:
    title: "토큰의 구조"
    text: "JWT는 Header(알고리즘 정보).Payload(사용자 정보, 만료 시간).Signature(위조 방지 서명) 세 부분으로 이루어져 있습니다. 서버의 비밀 키로 서명되어 있어 위조가 불가능합니다."

  step 16:
    title: "토큰으로 API 호출"
    text: "이제 사용자는 매번 로그인할 필요 없이, 저장된 JWT를 HTTP 헤더(Authorization: Bearer ...)에 넣어서 보내면 됩니다. 마치 출입증을 보여주는 것과 같습니다."

  step 18:
    title: "토큰 검증"
    text: "서버는 받은 JWT의 서명이 유효한지, 만료 시간이 지나지 않았는지 확인합니다. 이 과정은 데이터베이스 조회 없이 서버의 비밀 키만으로 가능하기 때문에 매우 빠릅니다."

  step 21:
    title: "인증 성공"
    text: "토큰이 유효하면 요청한 데이터를 반환합니다. 사용자는 로그인 상태를 유지하면서 자유롭게 서비스를 이용할 수 있습니다."

  step 22:
    title: "인증 실패"
    text: "비밀번호가 틀리거나, 토큰이 만료/위조된 경우 '401 Unauthorized' 오류를 반환합니다. 사용자는 다시 로그인해야 합니다."

  step 24:
    title: "보안의 중요성"
    text: "JWT의 장점은 서버가 상태를 저장하지 않아도(Stateless) 되고, 마이크로서비스 환경에서도 쉽게 인증을 공유할 수 있다는 것입니다. 하지만 토큰 탈취에 주의해야 합니다."
@end

@config
  autoplay: true
  loop: false
  controls: true
  speed: 1.0
@end`,
};
