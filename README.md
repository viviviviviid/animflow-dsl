# AnimDiagram - 애니메이션 다이어그램 렌더링 엔진

Mermaid 기반 DSL을 확장하여 애니메이션이 적용된 다이어그램을 생성하는 렌더링 엔진입니다.

## 🚀 기능

### ✅ 구현 완료된 기능 (Phase 1)

- **DSL 파서**: Mermaid 호환 flowchart 문법 + 커스텀 애니메이션 섹션
- **자동 레이아웃**: dagre 기반 방향 그래프 자동 배치
- **SVG 렌더링**: 6가지 노드 셰이프 (terminator, rectangle, diamond, parallelogram, database, document)
- **애니메이션 엔진**: GSAP 기반 타임라인 시스템
  - Show/Hide 효과 (fadeIn, slideIn, scaleIn, bounceIn 등)
  - Highlight 효과 (색상 변경, glow, pulse)
  - Connect 효과 (particles, dash, arrow)
  - Camera 효과 (fitAll, focus)
- **재생 컨트롤**: 재생/일시정지/정지, 속도 조절 (0.5x ~ 2x)
- **내레이션 시스템**: 스텝별 설명 텍스트 오버레이
- **템플릿 라이브러리**: 6개의 예제 템플릿

## 🛠 기술 스택

- **Framework**: Next.js 14 + TypeScript
- **스타일링**: Tailwind CSS
- **애니메이션**: GSAP (GreenSock Animation Platform)
- **레이아웃**: dagre (자동 그래프 레이아웃)
- **에디터**: Monaco Editor
- **상태 관리**: Zustand

## 📦 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 브라우저에서 열기
# http://localhost:3000
```

## 📝 DSL 문법

### 기본 구조

```
# 다이어그램 정의
flowchart LR
  nodeA[Label A]
  nodeB[Label B]
  nodeA --> nodeB

# 애니메이션 정의
@animation
  step 1: show nodeA
    duration: 1s
    effect: fadeIn
  
  step 2: connect nodeA->nodeB
    flow: particles
    speed: 2s
@end

# 스타일 정의
@style
  nodeA:
    fill: #e3f2fd
    stroke: #2196F3
@end

# 내레이션
@narration
  step 1:
    title: "제목"
    text: "설명"
@end

# 설정
@config
  autoplay: true
  speed: 1.0
@end
```

## 🎨 지원하는 노드 셰이프

- `([text])` - Terminator (타원)
- `[text]` - Rectangle (사각형)
- `{text}` - Diamond (다이아몬드)
- `[/text/]` - Parallelogram (평행사변형)
- `[(text)]` - Database (원통)
- `[[text]]` - Document (문서)

## ✨ 애니메이션 액션

- `show` - 노드 표시 (fadeIn, slideIn, scaleIn, bounceIn)
- `hide` - 노드 숨김 (fadeOut, slideOut, scaleOut)
- `highlight` - 강조 (색상, glow, pulse)
- `unhighlight` - 강조 해제
- `connect` - 연결선 애니메이션 (particles, dash, arrow)
- `camera` - 카메라 제어 (fitAll, focus)

## 📚 템플릿

프로젝트에 포함된 템플릿:

1. **블록체인 기본 구조** - 블록체인의 체인 연결 원리
2. **버블 정렬 알고리즘** - 정렬 알고리즘 시각화
3. **HTTP 요청-응답 사이클** - 웹 통신 흐름
4. **Git 브랜치 전략** - Git 브랜치와 병합
5. **주문 처리 프로세스** - 비즈니스 워크플로우
6. **간단한 예제** - 시작하기 좋은 기본 예제

## 🗂 프로젝트 구조

```
scratch-blockchain/
├── app/                     # Next.js 페이지
├── core/                    # DSL 엔진 코어
│   ├── parser/              # DSL 파서
│   ├── layout/              # 레이아웃 엔진
│   ├── animation/           # 애니메이션 엔진
│   └── types.ts             # 타입 정의
├── components/              # React 컴포넌트
│   ├── renderer/            # 다이어그램 렌더러
│   ├── controls/            # 재생 컨트롤
│   └── editor/              # 에디터 컴포넌트
├── store/                   # Zustand 상태 관리
└── data/                    # 템플릿 데이터
```

## 🎯 향후 계획 (Phase 2)

- Mindmap 타입 다이어그램
- 추가 애니메이션 효과 (flipIn, rotateIn, wave, lightning)
- move, transform 액션
- Sequence Diagram 지원
- 비주얼 에디터 (드래그앤드롭)
- 내보내기 기능 (MP4, GIF)

## 📄 라이선스

MIT

## 🤝 기여

이슈와 PR을 환영합니다!
