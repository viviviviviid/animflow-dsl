import type { Template } from "./index";

export const awsTransitGatewayTemplate: Template = {
  name: "AWS Transit Gateway & VPC",
  description: "VPC, Subnet, IGW, NAT, Security Group, Route Table, TGW 전체 네트워크 흐름",
  dsl: `flowchart TD
  internet([인터넷])
  igw["Internet Gateway<br/>VPC 인터넷 관문"]
  pub_sub["Public Subnet<br/>10.1.1.0/24"]
  rt_pub["라우트 테이블 Public<br/>0.0.0.0/0 → IGW"]
  ec2_web["EC2 웹서버<br/>공인 IP 보유"]
  sg["Security Group<br/>HTTP 80 · HTTPS 443 허용"]
  nat(["NAT Gateway<br/>아웃바운드 전용"])
  priv_sub_a["Private Subnet A<br/>VPC A 프로덕션 · 10.1.2.0/24"]
  rt_priv_a["라우트 테이블 Private A<br/>0.0.0.0/0 → NAT · 10.0.0.0/8 → TGW"]
  ec2_app["EC2 앱서버<br/>외부 직접 접근 불가"]
  tgw{Transit Gateway}
  priv_sub_b["Private Subnet B<br/>VPC B 개발환경 · 10.2.1.0/24"]
  ec2_dev["EC2 개발서버<br/>VPC B"]
  priv_sub_c["Private Subnet C<br/>VPC C 데이터 · 10.3.1.0/24"]
  rds[(RDS 데이터베이스)]
  vpn(["VPN Connection<br/>온프레미스 연결"])
  dc_server["사내 데이터센터 서버"]

  internet --> igw
  igw --> pub_sub
  pub_sub --- rt_pub
  pub_sub --> ec2_web
  pub_sub --> nat
  ec2_web --- sg
  nat --> priv_sub_a
  priv_sub_a --- rt_priv_a
  priv_sub_a --> ec2_app
  ec2_web -.->|내부 요청| priv_sub_a
  priv_sub_a --> tgw
  priv_sub_b --> tgw
  priv_sub_c --> tgw
  tgw --> vpn
  vpn --> dc_server
  ec2_app -->|DB 접근 요청| tgw
  tgw -->|라우팅 테이블 기반 전달| priv_sub_c
  priv_sub_c --> rds
  priv_sub_b --> ec2_dev

@animation
  step 1: show internet, igw
    name: "인터넷과 Internet Gateway"
    description: "외부 인터넷과 VPC 관문인 IGW를 표시합니다."
    effect: fadeIn
    stagger: 0.4s
    duration: 1s

  step 2: connect internet->igw
    name: "인터넷 트래픽 진입"
    description: "외부 트래픽이 IGW로 들어옵니다."
    flow: particles
    speed: 1.5s

  step 3: show pub_sub, rt_pub
    name: "Public Subnet + 라우트 테이블"
    description: "인터넷과 직접 통신하는 Public Subnet과 라우트 테이블을 표시합니다."
    effect: slideInBottom
    stagger: 0.3s
    duration: 1s

  step 4: connect igw->pub_sub
    name: "IGW → Public Subnet"
    description: "IGW를 통해 Public Subnet으로 트래픽이 전달됩니다."
    flow: particles
    speed: 1.5s

  step 5: highlight rt_pub
    name: "라우트 테이블 강조"
    description: "0.0.0.0/0 → IGW 규칙이 이 서브넷을 Public으로 만듭니다."
    color: #2196F3
    pulse: true
    duration: 1.5s

  step 6: show ec2_web, sg
    name: "웹서버 + Security Group"
    description: "Public Subnet의 웹서버와 Security Group을 표시합니다."
    effect: bounceIn
    stagger: 0.3s
    duration: 1s

  step 7: highlight sg
    name: "Security Group 강조"
    description: "HTTP/HTTPS 포트만 인바운드 허용하는 상태 기반 방화벽입니다."
    color: #FF5722
    glow: true
    duration: 1.5s

  step 8: show nat
    name: "NAT Gateway 등장"
    description: "Private Subnet의 아웃바운드 인터넷 연결을 담당하는 NAT Gateway를 표시합니다."
    effect: scaleIn
    duration: 1s

  step 9: show priv_sub_a, rt_priv_a, ec2_app
    name: "Private Subnet A + 앱서버"
    description: "외부에서 직접 접근 불가한 Private Subnet과 앱서버를 표시합니다."
    effect: slideInBottom
    stagger: 0.3s
    duration: 1s

  step 10: connect nat->priv_sub_a
    name: "NAT → Private Subnet"
    description: "NAT Gateway가 Private Subnet의 아웃바운드 트래픽을 처리합니다."
    flow: arrow
    speed: 1.2s

  step 11: highlight rt_priv_a
    name: "Private 라우트 테이블 강조"
    description: "두 규칙이 핵심입니다. 인터넷은 NAT로, VPC 내부 트래픽은 TGW로 분기됩니다."
    color: #9C27B0
    pulse: true
    duration: 2s

  step 12: show tgw
    name: "Transit Gateway 등장"
    description: "여러 VPC와 온프레미스를 연결하는 중앙 허브 TGW를 표시합니다."
    effect: flipIn
    duration: 1.5s

  step 13: highlight tgw
    name: "Transit Gateway 강조"
    description: "VPC Peering 없이 모든 VPC를 하나의 허브로 연결하는 중앙 라우터입니다."
    color: #FF9800
    glow: true
    duration: 2s

  step 14: show priv_sub_b, ec2_dev
    name: "VPC B 개발환경 등장"
    description: "개발용 VPC B의 Private Subnet과 개발 서버를 표시합니다."
    effect: slideInRight
    stagger: 0.3s
    duration: 1s

  step 15: connect priv_sub_b->tgw
    name: "VPC B → TGW Attachment"
    description: "VPC B가 Transit Gateway에 Attachment됩니다."
    flow: particles
    speed: 1.5s

  step 16: show priv_sub_c, rds
    name: "VPC C 데이터환경 등장"
    description: "데이터용 VPC C의 Private Subnet과 RDS를 표시합니다."
    effect: slideInLeft
    stagger: 0.3s
    duration: 1s

  step 17: connect priv_sub_c->tgw
    name: "VPC C → TGW Attachment"
    description: "VPC C가 Transit Gateway에 Attachment됩니다."
    flow: particles
    speed: 1.5s

  step 18: connect priv_sub_a->tgw
    name: "VPC A → TGW Attachment"
    description: "프로덕션 VPC A도 Transit Gateway에 Attachment됩니다."
    flow: particles
    speed: 1.5s

  step 19: show vpn, dc_server
    name: "온프레미스 연결"
    description: "VPN Connection으로 사내 데이터센터를 연결합니다."
    effect: fadeIn
    stagger: 0.3s
    duration: 1s

  step 20: connect tgw->vpn
    name: "TGW → VPN → 온프레미스"
    description: "Transit Gateway가 VPN을 통해 온프레미스와 연결됩니다."
    flow: dash
    speed: 1.5s

  step 21: connect ec2_app->tgw
    name: "앱서버 → TGW (DB 요청)"
    description: "앱서버가 TGW를 통해 다른 VPC의 RDS에 접근합니다."
    flow: particles
    speed: 1.2s

  step 22: connect tgw->priv_sub_c
    name: "TGW → VPC C 라우팅"
    description: "TGW 라우팅 테이블이 10.3.x.x 대역을 VPC C로 전달합니다."
    flow: particles
    speed: 1.2s

  step 23: highlight rds
    name: "RDS 도달"
    description: "VPC A 앱서버가 VPC C의 RDS에 접근 완료. 인터넷을 거치지 않은 내부망 경로입니다."
    color: #4CAF50
    pulse: true
    duration: 2s

  step 24: camera fitAll
    name: "전체 AWS 네트워크 조망"
    description: "인터넷부터 온프레미스까지 전체 구조를 한눈에 봅니다."
    padding: 50px
    duration: 2s
@end

@style
  internet:
    fill: #e3f2fd
    stroke: #2196F3
    stroke-width: 3px

  igw:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 3px

  pub_sub:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 2px

  rt_pub, rt_priv_a:
    fill: #e8eaf6
    stroke: #3F51B5
    stroke-width: 2px

  ec2_web, ec2_app, ec2_dev:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 2px

  sg:
    fill: #fbe9e7
    stroke: #FF5722
    stroke-width: 2px

  nat:
    fill: #fff8e1
    stroke: #FFC107
    stroke-width: 2px

  priv_sub_a, priv_sub_b, priv_sub_c:
    fill: #f3e5f5
    stroke: #9C27B0
    stroke-width: 2px

  tgw:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 4px

  rds:
    fill: #fff8e1
    stroke: #FFC107
    stroke-width: 3px

  vpn:
    fill: #fce4ec
    stroke: #E91E63
    stroke-width: 2px

  dc_server:
    fill: #efebe9
    stroke: #795548
    stroke-width: 2px
@end

@narration
  step 1:
    title: "Internet Gateway - VPC의 현관문"
    text: "Internet Gateway(IGW)는 VPC와 인터넷을 연결하는 유일한 관문입니다. IGW는 AWS가 관리하는 수평 확장 가능한 이중화 컴포넌트라 별도의 가용성 관리가 필요 없습니다. VPC당 하나만 연결할 수 있습니다."

  step 3:
    title: "Public vs Private Subnet"
    text: "서브넷의 Public, Private 구분은 라우트 테이블에 달려 있습니다. '0.0.0.0/0 → IGW' 규칙이 있으면 Public Subnet, 없으면 Private Subnet입니다. 웹서버처럼 인터넷에서 직접 접근해야 하는 리소스만 Public에 배치합니다."

  step 5:
    title: "라우트 테이블 - 패킷의 지도"
    text: "라우트 테이블은 트래픽의 목적지를 결정하는 규칙 목록입니다. 같은 VPC 안이라도 어떤 라우트 테이블이 연결되느냐에 따라 완전히 다른 네트워크 동작을 합니다. 이것이 AWS 네트워킹의 핵심입니다."

  step 7:
    title: "Security Group - 상태 기반 방화벽"
    text: "Security Group은 인스턴스 레벨 방화벽입니다. 상태 기반(Stateful)이라, 인바운드 HTTP를 허용하면 그 연결의 응답 트래픽은 별도 규칙 없이 자동 허용됩니다. 반면 서브넷 레벨의 NACL은 상태 비기반(Stateless)으로 인바운드와 아웃바운드를 각각 설정해야 합니다."

  step 8:
    title: "NAT Gateway - Private의 인터넷 통로"
    text: "Private Subnet의 EC2가 소프트웨어 업데이트 등을 위해 인터넷에 나가야 할 때 NAT Gateway를 사용합니다. 핵심은 아웃바운드 전용이라는 점입니다. 인터넷에서 Private 리소스로는 직접 접근이 불가능합니다. NAT Gateway 자체는 Public Subnet에 위치합니다."

  step 11:
    title: "Private 라우트 테이블의 두 규칙"
    text: "Private 서브넷 라우트 테이블에는 두 개의 핵심 규칙이 있습니다. 첫째, 0.0.0.0/0 → NAT Gateway. 일반 인터넷 트래픽을 NAT로 보냅니다. 둘째, 10.0.0.0/8 → Transit Gateway. 다른 VPC나 온프레미스로 향하는 내부 트래픽을 TGW로 보냅니다. 이 두 번째 규칙이 TGW 통신을 가능하게 합니다."

  step 13:
    title: "Transit Gateway - 클라우드 라우터"
    text: "VPC가 3개면 Peering 연결이 3개, 10개면 45개가 필요합니다. Transit Gateway는 이 문제를 해결합니다. 모든 VPC가 TGW 하나에 연결하면 TGW 라우팅 테이블 하나로 모든 통신이 가능합니다. 온프레미스의 VPN, Direct Connect도 TGW에 연결합니다."

  step 15:
    title: "TGW Attachment - VPC 붙이기"
    text: "VPC를 Transit Gateway에 연결하는 것을 Attachment라고 합니다. Attachment가 생성되면 TGW 라우팅 테이블에 해당 VPC의 CIDR이 등록됩니다. 중요한 설계 원칙: 각 VPC의 CIDR은 절대 겹치면 안 됩니다. 겹치면 TGW가 어느 VPC로 보낼지 알 수 없습니다."

  step 20:
    title: "하이브리드 클라우드 - 온프레미스 연결"
    text: "기존 사내 데이터센터와 AWS를 연결하는 방법은 VPN Connection과 Direct Connect 두 가지입니다. VPN은 인터넷을 경유해 저렴하지만 대역폭 제한이 있고, Direct Connect는 AWS 전용선으로 안정적입니다. TGW에 연결하면 온프레미스에서 모든 VPC에 접근할 수 있습니다."

  step 23:
    title: "크로스 VPC 통신 - 인터넷 없는 내부망"
    text: "앱서버(VPC A)가 RDS(VPC C)에 접근하는 경로는 앱서버 → Private Subnet A 라우트 테이블 → TGW → TGW 라우팅 테이블 → Private Subnet C → RDS입니다. 이 전체 경로는 AWS 내부 백본 네트워크로만 이동합니다. 인터넷을 거치지 않아 보안적으로 안전하고 레이턴시도 낮습니다."
@end

@config
  autoplay: true
  loop: false
  controls: true
  speed: 1.0
  tts: true
  tts-voice: Kyunghoon, InJoon, ko-KR
@end`,
};
