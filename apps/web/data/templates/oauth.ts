import type { Template } from "./index";

export const oauthTemplate: Template = {
  name: "OAuth 2.0 소셜 로그인",
  description: "'구글로 로그인' 뒤에서 일어나는 Authorization Code Flow",
  dsl: `flowchart LR
  user[사용자]
  browser[브라우저]
  app[서비스 앱<br/>example.com]
  google_auth[Google 인증 서버<br/>accounts.google.com]
  google_api[Google API<br/>www.googleapis.com]
  app_db[(앱 DB<br/>세션 저장)]

  user -->|구글 로그인 클릭| browser
  browser -->|GET /auth/google| app
  app -->|302 리다이렉트<br/>client_id, scope, redirect_uri| browser
  browser -->|Authorization Request| google_auth
  user -->|구글 계정 로그인 + 동의| google_auth
  google_auth -->|Authorization Code<br/>단기 일회용 코드| browser
  browser -->|Code 전달| app
  app -->|Code + Client Secret<br/>서버-투-서버| google_auth
  google_auth -->|Access Token<br/>Refresh Token| app
  app -->|Bearer Access Token| google_api
  google_api -->|사용자 프로필<br/>이메일, 이름, 사진| app
  app -->|세션 생성 & 저장| app_db
  app -->|세션 쿠키 발급| browser
  browser -->|서비스 이용| user

@animation
  step 1: show user, browser
    name: "사용자와 브라우저 표시"
    description: "사용자와 브라우저 노드를 화면에 표시합니다."
    effect: slideInLeft
    stagger: 0.3s
    duration: 1s

  step 2: highlight user
    name: "사용자 강조"
    description: "사용자를 강조합니다."
    color: #2196F3
    glow: true
    duration: 1s

  step 3: show app
    name: "앱 서버 표시"
    description: "앱 서버 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 0.8s

  step 4: connect user->browser
    name: "로그인 클릭"
    description: "사용자가 구글 로그인 버튼을 클릭합니다."
    flow: particles
    speed: 1s

  step 5: connect browser->app
    name: "앱 서버 요청"
    description: "브라우저에서 앱 서버로 인증 요청합니다."
    flow: particles
    speed: 1.5s

  step 6: highlight app
    name: "앱 서버 강조"
    description: "앱 서버를 강조합니다."
    color: #FF9800
    pulse: true
    duration: 1s

  step 7: show google_auth
    name: "Google 인증 서버 표시"
    description: "Google 인증 서버 노드를 화면에 표시합니다."
    effect: slideInRight
    duration: 1s

  step 8: connect app->browser
    name: "302 리다이렉트"
    description: "앱 서버에서 브라우저로 Google 리다이렉트를 전송합니다."
    flow: arrow
    speed: 1s

  step 9: connect browser->google_auth
    name: "Google 인증 요청"
    description: "브라우저에서 Google 인증 서버로 요청합니다."
    flow: particles
    speed: 1.5s

  step 10: highlight google_auth
    name: "Google 인증 서버 강조"
    description: "Google 인증 서버를 강조합니다."
    color: #4285F4
    glow: true
    duration: 1.5s

  step 11: connect user->google_auth
    name: "구글 로그인 + 동의"
    description: "사용자가 구글 계정으로 로그인하고 권한에 동의합니다."
    flow: particles
    speed: 1.5s

  step 12: connect google_auth->browser
    name: "Authorization Code 발급"
    description: "Google이 Authorization Code를 브라우저에 전달합니다."
    flow: particles
    speed: 1.5s

  step 13: highlight browser
    name: "Code 수신"
    description: "브라우저가 Authorization Code를 수신합니다."
    color: #4CAF50
    pulse: true
    duration: 1s

  step 14: connect browser->app
    name: "Code를 앱 서버에 전달"
    description: "브라우저에서 앱 서버로 Code를 전달합니다."
    flow: particles
    speed: 1.5s

  step 15: connect app->google_auth
    name: "Code + Secret 교환"
    description: "앱 서버에서 Google로 Code와 Client Secret을 교환합니다."
    flow: particles
    speed: 1.5s

  step 16: highlight app
    name: "앱 서버 교환 강조"
    description: "앱 서버가 서버-투-서버로 토큰을 요청합니다."
    color: #FF9800
    glow: true
    duration: 1s

  step 17: connect google_auth->app
    name: "Access Token 발급"
    description: "Google이 앱 서버에 Access Token과 Refresh Token을 발급합니다."
    flow: particles
    speed: 1.5s

  step 18: show google_api
    name: "Google API 서버 표시"
    description: "Google API 서버 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 0.8s

  step 19: connect app->google_api
    name: "사용자 정보 요청"
    description: "앱 서버에서 Access Token으로 사용자 정보를 요청합니다."
    flow: particles
    speed: 1.5s

  step 20: connect google_api->app
    name: "사용자 프로필 반환"
    description: "Google API가 이메일, 이름, 사진 정보를 반환합니다."
    flow: particles
    speed: 1.5s

  step 21: show app_db
    name: "앱 DB 표시"
    description: "앱 DB 노드를 화면에 표시합니다."
    effect: bounceIn
    duration: 1s

  step 22: connect app->app_db
    name: "세션 저장"
    description: "앱 서버가 세션을 DB에 저장합니다."
    flow: particles
    speed: 1s

  step 23: highlight app_db
    name: "DB 강조"
    description: "앱 DB를 강조합니다."
    color: #FF9800
    pulse: true
    duration: 1s

  step 24: connect app->browser
    name: "세션 쿠키 발급"
    description: "앱 서버에서 브라우저로 세션 쿠키를 발급합니다."
    flow: particles
    speed: 1.5s

  step 25: connect browser->user
    name: "서비스 이용"
    description: "사용자가 서비스를 이용합니다."
    flow: particles
    speed: 1s

  step 26: highlight user, app
    name: "로그인 완료"
    description: "OAuth 2.0 로그인이 완료됩니다."
    color: #4CAF50
    glow: true
    duration: 2s

  step 27: camera fitAll
    name: "카메라 전체 맞춤"
    description: "전체 흐름이 보이도록 카메라를 조정합니다."
    padding: 40px
    duration: 2s
@end

@style
  user:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 3px

  browser:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 2px

  app:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 3px

  google_auth:
    fill: #e8eaf6
    stroke: #4285F4
    stroke-width: 3px

  google_api:
    fill: #e8eaf6
    stroke: #34A853
    stroke-width: 2px

  app_db:
    fill: #fff8e1
    stroke: #FFC107
    stroke-width: 2px
@end

@narration
  step 1:
    title: "'구글로 로그인' 버튼 뒤에 숨은 것"
    text: "웹사이트에서 '구글로 로그인' 버튼을 클릭하면 무슨 일이 일어날까요? 내 구글 비밀번호가 그 사이트에 전달되는 걸까요? 그렇지 않습니다. OAuth 2.0은 비밀번호 없이 신뢰를 위임하는 프로토콜입니다. 어떻게 가능한지 살펴봅시다."

  step 6:
    title: "앱 서버의 역할 - 리다이렉트 준비"
    text: "로그인 요청을 받은 앱 서버는 구글 인증 페이지 URL을 만들어 브라우저에게 '여기로 가'라고 알려줍니다. URL에는 client_id(이 앱의 신원), scope(요청할 권한: 이메일, 프로필), redirect_uri(인증 후 돌아올 주소)가 포함됩니다. 이 파라미터들이 이후 흐름의 보안을 만듭니다."

  step 10:
    title: "구글 인증 서버 - 비밀번호는 여기서만"
    text: "사용자는 지금 구글의 공식 페이지에 있습니다. 구글 계정 비밀번호는 오직 여기서만 입력됩니다. example.com은 비밀번호를 볼 수 없습니다. 이것이 OAuth의 핵심입니다. 동의 화면에서는 '이 앱이 당신의 이메일과 프로필을 읽겠습니다'라는 권한 목록이 표시됩니다."

  step 12:
    title: "Authorization Code - 일회용 쿠폰"
    text: "구글이 Authorization Code를 발급합니다. 이 코드는 매우 짧은 수명(보통 10분)의 일회용 코드입니다. 브라우저 URL에 code=4/0AY0e-g7...처럼 보입니다. 이 코드 자체로는 아무것도 할 수 없고, Client Secret과 함께 교환해야 실제 토큰을 받을 수 있습니다."

  step 15:
    title: "Code + Secret 교환 - 백채널의 중요성"
    text: "앱 서버가 Authorization Code와 Client Secret을 가지고 구글에 직접 요청합니다. 이 과정은 브라우저를 거치지 않는 서버-투-서버 통신입니다. Client Secret이 브라우저 네트워크를 통해 전송되지 않기 때문에 탈취 위험이 없습니다. 이것이 Authorization Code Flow가 안전한 이유입니다."

  step 17:
    title: "Access Token - 실제 열쇠"
    text: "구글이 Access Token과 Refresh Token을 발급합니다. Access Token은 Google API에 요청할 때 사용하는 단기 열쇠(보통 1시간)이고, Refresh Token은 Access Token이 만료됐을 때 새로 발급받는 장기 열쇠입니다. 이 토큰들은 앱 서버만 가지고 있습니다. 브라우저에 노출되지 않습니다."

  step 19:
    title: "사용자 정보 획득"
    text: "Access Token을 Authorization 헤더에 담아 구글 API에 요청합니다. 예시: 'GET https://www.googleapis.com/oauth2/v2/userinfo'. Bearer 토큰 방식으로, 'Bearer ya29.a0ARrdaM...' 형식으로 전송합니다. 구글 API가 토큰을 확인하고 이메일, 이름, 프로필 사진을 반환합니다."

  step 26:
    title: "OAuth 2.0의 핵심 가치"
    text: "이 모든 과정을 통해 example.com은 사용자의 구글 비밀번호를 모르고도 '이 사람이 구글 계정 user@gmail.com임'을 확인했습니다. 사용자는 다른 비밀번호를 만들 필요가 없고, 언제든 구글 설정에서 앱의 접근 권한을 취소할 수 있습니다. 이것이 비밀번호 없는 위임 인증의 힘입니다."
@end

@config
  autoplay: true
  loop: false
  speed: 1.0
  tts: true
  tts-voice: Kyunghoon, InJoon, ko-KR
@end`,
};
