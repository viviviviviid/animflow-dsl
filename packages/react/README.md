# @animflow-dsl/react

React 컴포넌트 라이브러리로, DSL 기반의 애니메이션 다이어그램을 시각화합니다.

## 설치

```bash
npm install @animflow-dsl/react
# 또는
pnpm add @animflow-dsl/react
# 또는
yarn add @animflow-dsl/react
```

## 기본 사용법

```tsx
import { AnimflowPlayer } from '@animflow-dsl/react';

function MyDiagram() {
  const dsl = `
    @diagram
    A[시작]
    B[처리]
    C[종료]
    
    A -> B -> C
    
    @animation
    show(A)
    show(B)
    show(C)
    flow(A -> B)
    flow(B -> C)
  `;

  return <AnimflowPlayer dsl={dsl} />;
}
```

## Props

### AnimflowPlayer

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `dsl` | `string` | **required** | 다이어그램을 정의하는 DSL 문자열 |
| `className` | `string` | `undefined` | 컨테이너에 추가할 CSS 클래스 |

### AnimflowPlayerHandle (Imperative API)

`useImperativeHandle`을 통해 노출되는 명령형 API:

```tsx
import { useRef } from 'react';
import { AnimflowPlayer, AnimflowPlayerHandle } from '@animflow-dsl/react';

function MyComponent() {
  const playerRef = useRef<AnimflowPlayerHandle>(null);

  const handlePlay = () => {
    playerRef.current?.play();
  };

  return (
    <div>
      <button onClick={handlePlay}>재생</button>
      <AnimflowPlayer ref={playerRef} dsl={myDsl} />
    </div>
  );
}
```

#### 메서드

- `play()`: 애니메이션 재생
- `pause()`: 애니메이션 일시정지
- `seek(time: number)`: 특정 시간으로 이동
- `setSpeed(speed: number)`: 재생 속도 설정

## 저수준 API

### 개별 렌더러 사용

더 세밀한 제어가 필요한 경우 개별 컴포넌트와 함수를 사용할 수 있습니다:

```tsx
import {
  DiagramRenderer,
  parseDsl,
  calculateFlowchartLayout
} from '@animflow-dsl/react';

function CustomDiagram() {
  const dsl = `...`;
  const parsedData = parseDsl(dsl);
  const layoutData = calculateFlowchartLayout(parsedData);

  return (
    <DiagramRenderer
      data={layoutData}
      isSketchy={false}
      pan={{ x: 0, y: 0 }}
      zoom={1}
      animationRefs={[]}
    />
  );
}
```

### 내보내기 타입

```typescript
import type {
  DiagramData,
  Node,
  Edge,
  AnimationStep,
  NarrationStep
} from '@animflow-dsl/react';
```

## DSL 문법

자세한 DSL 문법은 [메인 레포지토리](https://github.com/your-org/animflow-dsl)를 참조하세요.

### 간단한 예시

```
@diagram
Start[프로세스 시작]
Process[데이터 처리]
End[완료]

Start -> Process: "입력"
Process -> End: "출력"

@style
mode: sketchy
font: "Comic Neue"

@animation
show(Start)
show(Process, duration: 1s)
flow(Start -> Process, duration: 2s)
highlight(Process, duration: 0.5s)
show(End)
flow(Process -> End)

@narration
title: "시작"
text: "프로세스가 시작됩니다."
---
title: "처리"
text: "데이터를 처리하고 있습니다."
---
title: "완료"
text: "모든 작업이 완료되었습니다."
```

## Peer Dependencies

이 패키지는 다음 패키지를 peer dependency로 요구합니다:

- `react ^18.0.0`
- `react-dom ^18.0.0`

## 라이선스

MIT

## 기여

기여는 언제나 환영합니다! 이슈를 열거나 PR을 보내주세요.
