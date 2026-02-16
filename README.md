# AnimFlow DSL

**AnimFlow DSL**은 다이어그램 정의와 애니메이션을 위한 DSL(Domain-Specific Language)과 React 기반의 렌더링 SDK를 제공하는 프로젝트입니다.

## 📦 프로젝트 구조

이 프로젝트는 모노레포로 구성되어 있습니다:

```
animflow-dsl/
├── packages/
│   └── react/           # @animflow-dsl/react SDK 패키지
│       ├── src/
│       │   ├── components/  # AnimflowPlayer, 렌더러, 컨트롤
│       │   ├── core/       # DSL 파서, 레이아웃, 애니메이션 엔진
│       │   ├── store/      # Zustand 상태 관리
│       │   └── index.ts    # Public API
│       └── package.json
└── apps/
    └── web/             # 데모 웹 애플리케이션
        ├── app/
        ├── components/
        ├── data/
        └── package.json
```

## 🚀 시작하기

### 설치

```bash
# pnpm 설치 (없는 경우)
npm install -g pnpm

# 의존성 설치
pnpm install
```

### 개발

```bash
# SDK 빌드
pnpm --filter @animflow-dsl/react build

# 웹 앱 실행
pnpm --filter web dev

# 또는 루트에서 모든 패키지 빌드
pnpm build
```

### SDK 사용하기

```tsx
import { AnimflowPlayer } from '@animflow-dsl/react';

function App() {
  const dsl = `
    @diagram
    A[시작]
    B[처리]
    C[종료]
    
    A -> B -> C
    
    @animation
    show(A)
    show(B, duration: 1s)
    show(C)
    flow(A -> B)
    flow(B -> C)
    
    @narration
    title: "프로세스 시작"
    text: "시작 노드부터 처리 단계로 이동합니다."
    ---
    title: "처리 완료"
    text: "최종 단계로 진행합니다."
  `;
  
  return <AnimflowPlayer dsl={dsl} />;
}
```

## 📚 DSL 문법

자세한 DSL 문법은 `DSL 전체 구조.md` 문서를 참조하세요.

### 주요 기능

- **다이어그램 정의**: 노드와 엣지를 간단한 문법으로 정의
- **애니메이션**: 노드 표시/숨김, 흐름 애니메이션, 하이라이트 등
- **나레이션**: 각 애니메이션 단계에 대한 설명 추가
- **스타일링**: Clean/Sketchy 모드 지원
- **Pan & Zoom**: 인터랙티브한 다이어그램 뷰어
- **플레이백 컨트롤**: 재생/일시정지, 속도 조절, 진행 바 탐색

## 🛠️ 기술 스택

- **React 18** - UI 프레임워크
- **TypeScript** - 타입 안전성
- **GSAP** - 애니메이션 엔진
- **Dagre** - 그래프 레이아웃
- **Rough.js** - 손그림 스타일 렌더링
- **Zustand** - 상태 관리
- **Next.js 14** - 웹 앱 프레임워크 (demo)
- **Tailwind CSS** - 스타일링 (demo)
- **Turborepo** - 모노레포 관리
- **tsup** - SDK 번들링

## 📄 라이선스

MIT

## 🔗 관련 링크

- GitHub: https://github.com/your-org/animflow-dsl
- NPM: https://www.npmjs.com/package/@animflow-dsl/react

---

Made with ❤️ for animated diagrams
