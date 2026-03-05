import type { Template } from "./index";

export const tcpTlsTemplate: Template = {
  name: "TCP + TLS 연결 수립",
  description: "3-way Handshake부터 TLS 1.3 암호화 연결 수립까지",
  dsl: `flowchart LR
  client[클라이언트<br/>브라우저]
  server[서버<br/>HTTPS :443]
  ca[CA<br/>인증기관]

  syn["① SYN<br/>seq=1000"]
  syn_ack["② SYN-ACK<br/>seq=2000, ack=1001"]
  ack["③ ACK<br/>ack=2001"]

  ch["④ ClientHello<br/>TLS 1.3 + 암호 목록"]
  sh["⑤ ServerHello<br/>선택 암호 + 인증서"]
  verify["⑥ 인증서 검증<br/>CA 서명 확인"]
  key_ex["⑦ 키 교환<br/>ECDH 공개키"]
  session["⑧ 세션 키 생성<br/>대칭키 완성"]
  data["⑨ 암호화 HTTP<br/>GET /api/data"]

  client -->|연결 시도| syn
  syn --> server
  server -->|연결 수락| syn_ack
  syn_ack --> client
  client -->|확인| ack
  ack --> server

  client -->|TLS 시작| ch
  ch --> server
  server -->|서버 정보| sh
  sh --> client
  sh --> ca
  ca -->|서명 검증| verify
  verify --> client
  client -->|키 교환| key_ex
  key_ex --> server
  key_ex --> session
  server --> session
  session -->|암호화 통신| data
  data --> server

@animation
  step 1: show client, server
    name: "클라이언트와 서버 표시"
    description: "클라이언트와 서버 노드를 화면에 표시합니다."
    effect: fadeIn
    stagger: 0.5s
    duration: 1s

  step 2: highlight client
    name: "클라이언트 강조"
    description: "클라이언트를 강조합니다."
    color: #2196F3
    glow: true
    duration: 1s

  step 3: show syn
    name: "SYN 패킷 표시"
    description: "SYN 패킷 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 0.8s

  step 4: connect client->syn
    name: "SYN 전송"
    description: "클라이언트에서 SYN 패킷을 전송합니다."
    flow: particles
    speed: 1.5s

  step 5: connect syn->server
    name: "SYN 서버 도달"
    description: "SYN 패킷이 서버에 도달합니다."
    flow: particles
    speed: 1s

  step 6: highlight server
    name: "서버 SYN 수신"
    description: "서버가 SYN을 수신합니다."
    color: #4CAF50
    pulse: true
    duration: 1s

  step 7: show syn_ack
    name: "SYN-ACK 표시"
    description: "SYN-ACK 패킷 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 0.8s

  step 8: connect server->syn_ack
    name: "SYN-ACK 전송"
    description: "서버에서 SYN-ACK를 전송합니다."
    flow: particles
    speed: 1.5s

  step 9: connect syn_ack->client
    name: "SYN-ACK 수신"
    description: "SYN-ACK가 클라이언트에 도달합니다."
    flow: particles
    speed: 1s

  step 10: show ack
    name: "ACK 표시"
    description: "ACK 패킷 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 0.8s

  step 11: connect client->ack
    name: "ACK 전송"
    description: "클라이언트에서 ACK를 전송합니다."
    flow: particles
    speed: 1.5s

  step 12: connect ack->server
    name: "TCP 연결 완료"
    description: "ACK가 서버에 도달해 TCP 연결이 수립됩니다."
    flow: particles
    speed: 1s

  step 13: highlight client, server
    name: "TCP 3-way 완료"
    description: "TCP 3-way Handshake가 완료됩니다."
    color: #4CAF50
    glow: true
    duration: 1.5s

  step 14: show ch
    name: "ClientHello 표시"
    description: "TLS ClientHello 노드를 화면에 표시합니다."
    effect: flipIn
    duration: 0.8s

  step 15: connect client->ch
    name: "ClientHello 전송"
    description: "클라이언트에서 ClientHello를 전송합니다."
    flow: particles
    speed: 1.5s

  step 16: connect ch->server
    name: "ClientHello 수신"
    description: "서버가 ClientHello를 수신합니다."
    flow: particles
    speed: 1s

  step 17: show sh
    name: "ServerHello 표시"
    description: "TLS ServerHello 노드를 화면에 표시합니다."
    effect: flipIn
    duration: 0.8s

  step 18: connect server->sh
    name: "ServerHello 전송"
    description: "서버에서 ServerHello를 전송합니다."
    flow: particles
    speed: 1.5s

  step 19: connect sh->client
    name: "ServerHello 수신"
    description: "클라이언트가 ServerHello를 수신합니다."
    flow: particles
    speed: 1s

  step 20: show ca
    name: "CA 표시"
    description: "CA 인증기관 노드를 화면에 표시합니다."
    effect: bounceIn
    duration: 1s

  step 21: connect sh->ca
    name: "인증서 검증 요청"
    description: "인증서를 CA에 검증 요청합니다."
    flow: dash
    speed: 1.5s

  step 22: show verify
    name: "인증서 검증 표시"
    description: "인증서 검증 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 0.8s

  step 23: connect ca->verify
    name: "CA 서명 검증"
    description: "CA가 인증서 서명을 검증합니다."
    flow: particles
    speed: 1s

  step 24: connect verify->client
    name: "검증 완료"
    description: "클라이언트가 인증서 검증을 완료합니다."
    flow: particles
    speed: 1s

  step 25: show key_ex
    name: "키 교환 표시"
    description: "키 교환 노드를 화면에 표시합니다."
    effect: scaleIn
    duration: 0.8s

  step 26: connect client->key_ex
    name: "ECDH 공개키 전송"
    description: "클라이언트에서 ECDH 공개키를 전송합니다."
    flow: particles
    speed: 1.5s

  step 27: connect key_ex->server
    name: "키 교환 완료"
    description: "서버가 키 교환 데이터를 수신합니다."
    flow: particles
    speed: 1s

  step 28: show session
    name: "세션 키 표시"
    description: "세션 키 노드를 화면에 표시합니다."
    effect: flipIn
    duration: 1s

  step 29: connect key_ex->session
    name: "세션 키 생성"
    description: "키 교환으로 세션 키가 생성됩니다."
    flow: particles
    speed: 1s

  step 30: connect server->session
    name: "서버도 세션 키 생성"
    description: "서버도 동일한 세션 키를 독립적으로 생성합니다."
    flow: particles
    speed: 1s

  step 31: highlight session
    name: "세션 키 강조"
    description: "세션 키를 강조합니다."
    color: #FF9800
    glow: true
    duration: 1.5s

  step 32: show data
    name: "암호화 데이터 표시"
    description: "암호화된 HTTP 데이터 노드를 화면에 표시합니다."
    effect: fadeIn
    duration: 0.8s

  step 33: connect session->data
    name: "암호화 통신 시작"
    description: "세션 키로 암호화된 HTTP 통신이 시작됩니다."
    flow: particles
    speed: 1.5s

  step 34: connect data->server
    name: "암호화 요청 전달"
    description: "암호화된 요청이 서버에 전달됩니다."
    flow: particles
    speed: 1.5s

  step 35: highlight client, server, session
    name: "HTTPS 통신 완료"
    description: "TCP+TLS 연결이 완성됩니다."
    color: #4CAF50
    glow: true
    duration: 2s

  step 36: camera fitAll
    name: "카메라 전체 맞춤"
    description: "전체 흐름이 보이도록 카메라를 조정합니다."
    padding: 40px
    duration: 2s
@end

@style
  client:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 3px

  server:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px

  ca:
    fill: #f3e5f5
    stroke: #9C27B0
    stroke-width: 2px

  syn, syn_ack, ack:
    fill: #e8f5e9
    stroke: #66BB6A
    stroke-width: 2px

  ch, sh:
    fill: #e3f2fd
    stroke: #42A5F5
    stroke-width: 2px

  verify:
    fill: #f3e5f5
    stroke: #AB47BC
    stroke-width: 2px

  key_ex:
    fill: #fff3e0
    stroke: #FFA726
    stroke-width: 2px

  session:
    fill: #fff9c4
    stroke: #FF9800
    stroke-width: 3px

  data:
    fill: #e0f7fa
    stroke: #26C6DA
    stroke-width: 2px
@end

@narration
  step 1:
    title: "HTTPS 뒤에서 무슨 일이 일어날까?"
    text: "브라우저 주소창의 자물쇠 아이콘 뒤에는 두 단계가 숨어있습니다. 먼저 신뢰할 수 있는 연결 채널을 여는 TCP 3-way Handshake, 그 다음 그 채널을 암호화하는 TLS 핸드셰이크입니다. 지금부터 https://example.com에 접속하는 단순한 행동 뒤에서 일어나는 일을 살펴봅시다."

  step 3:
    title: "① SYN - 연결 시작 노크"
    text: "클라이언트가 SYN(Synchronize) 패킷을 보냅니다. seq=1000은 앞으로 주고받을 데이터의 시작 번호입니다. 마치 편지에 '나는 1번부터 시작할게'라고 알리는 것입니다. 이 번호 체계가 있어야 패킷이 뒤섞이거나 유실되어도 올바른 순서로 재조립할 수 있습니다."

  step 7:
    title: "② SYN-ACK - 서버의 응답"
    text: "서버가 SYN-ACK로 응답합니다. ack=1001은 '1000번 받았어, 다음엔 1001번 줘'라는 확인이고, seq=2000은 '나는 2000번부터 시작할게'라는 서버의 번호입니다. 연결 수립 전에 양쪽이 시퀀스 번호를 서로 확인하는 이 과정이 신뢰성 있는 데이터 전송의 기반입니다."

  step 13:
    title: "TCP 3-way Handshake 완료"
    text: "클라이언트가 ACK=2001을 보내며 확인합니다. 이 세 번의 패킷 교환으로 신뢰할 수 있는 연결 채널이 열렸습니다. 하지만 이 채널은 아직 암호화되지 않았습니다. 지금 이 단계에서 누군가 중간에 패킷을 가로채면 내용을 그대로 볼 수 있습니다. 여기서 TLS가 시작됩니다."

  step 14:
    title: "④ ClientHello - TLS 협상 시작"
    text: "클라이언트가 지원하는 TLS 버전과 암호화 알고리즘 목록을 서버에 보냅니다. '나는 AES-256이나 ChaCha20을 쓸 수 있어, 너는 어때?'라고 제안하는 것입니다. 또한 랜덤한 숫자(Client Random)도 함께 보내는데, 나중에 세션 키를 만들 때 사용합니다."

  step 17:
    title: "⑤ ServerHello + 인증서"
    text: "서버가 암호화 알고리즘을 선택하고(예: TLS_AES_256_GCM_SHA384), 자신의 인증서를 전송합니다. 이 인증서에는 서버의 도메인, 공개키, 그리고 CA의 디지털 서명이 담겨있습니다. '내 신분증이야, 이 신분증은 공인 인증기관이 서명했어'라고 하는 것과 같습니다."

  step 23:
    title: "⑥ 인증서 검증 - 신뢰의 사슬"
    text: "클라이언트는 인증서의 CA 서명을 검증합니다. 운영체제와 브라우저에는 신뢰할 수 있는 Root CA 목록이 미리 내장되어 있습니다. 인증서의 서명이 이 목록의 CA와 일치하면 검증 성공입니다. 인증서 체인이 Root CA까지 연결되는 이 구조를 '신뢰의 사슬(Chain of Trust)'이라 합니다."

  step 28:
    title: "⑦⑧ ECDH 키 교환 - 수학 마법"
    text: "TLS 1.3에서는 ECDH(타원 곡선 디피-헬만)로 키를 교환합니다. 클라이언트와 서버가 각자 임시 키 쌍을 생성하고 공개키만 교환합니다. 그런데 놀랍게도 이 공개키만으로 양쪽이 동일한 세션 키를 독립적으로 계산할 수 있습니다. 비밀키는 네트워크를 통해 전송되지 않습니다."

  step 35:
    title: "HTTPS 통신 시작"
    text: "양쪽이 동일한 세션 키를 보유했습니다. 이 대칭키로 HTTP 요청과 응답을 암호화합니다. TLS 1.3은 1.2보다 왕복 횟수가 한 번 적어서 더 빠릅니다. 이 모든 과정이 보통 50~100ms 안에 완료됩니다. 자물쇠 아이콘 하나 뒤에 이 모든 과정이 숨어있었습니다."
@end

@config
  autoplay: true
  loop: false
  speed: 1.0
  tts: true
  tts-voice: Kyunghoon, InJoon, ko-KR
@end`,
};
