좋아요! 머메이드 기반 확장 시스템을 체계적으로 기획해보겠습니다.

## 확장 DSL 전체 구조

```
# 1. 다이어그램 정의 (Mermaid 호환)
[diagram definition]

# 2. 애니메이션 정의 (우리 확장)
@animation
  [timeline steps]
@end

# 3. 스타일 정의 (Mermaid 확장)
@style
  [visual styles]
@end

# 4. 설정
@config
  [global settings]
@end

# 5. 내레이션/설명
@narration
  [explanatory text]
@end
```

---

## 1. 다이어그램 정의 (Mermaid 호환)

### Flowchart
```
flowchart [direction]
  nodeId[label]
  nodeId2{decision}
  nodeId3([stadium])
  nodeId4[(database)]
  
  nodeId --> nodeId2
  nodeId2 -->|Yes| nodeId3
  nodeId2 -->|No| nodeId4

# direction: LR, RL, TD, BT
# shapes: [], {}, ([]), [(]]), [()], (()), >], [/\], [\\/]
```

### Mindmap
```
mindmap
  root((중심 주제))
    topic1[주제 1]
      subtopic1[하위 1-1]
      subtopic2[하위 1-2]
    topic2[주제 2]
      subtopic3[하위 2-1]
```

### Sequence Diagram (나중 확장)
```
sequenceDiagram
  participant A
  participant B
  A->>B: 메시지
  B-->>A: 응답
```

---

## 2. 애니메이션 정의 (핵심 확장)

### 기본 구조
```
@animation
  step [number]: [action] [target] [options]
    [properties]
  
  step [number]: [action] [target] [options]
    [properties]
@end
```

### Action 타입

#### A. show / hide
```
@animation
  # 노드 표시
  step 1: show nodeId
    duration: 1.5s
    effect: fadeIn
    delay: 0s
  
  # 여러 노드 동시에
  step 2: show nodeId1, nodeId2, nodeId3
    effect: slideInLeft
    stagger: 0.3s
  
  # 숨기기
  step 3: hide nodeId
    effect: fadeOut
@end
```

#### B. highlight / unhighlight
```
@animation
  # 강조
  step 1: highlight nodeId
    color: #FF5722
    glow: true
    pulse: true
    duration: 2s
  
  # 강조 해제
  step 2: unhighlight nodeId
@end
```

#### C. connect
```
@animation
  # 연결선 애니메이션
  step 1: connect nodeId1->nodeId2
    flow: particles        # particles, dash, glow, wave
    speed: 2s
    color: #4CAF50
    width: 3px
  
  # 여러 연결
  step 2: connect nodeId2->nodeId3, nodeId3->nodeId4
    flow: dash
    speed: 1.5s
@end
```

#### D. move
```
@animation
  # 노드 이동
  step 1: move nodeId
    to: [x, y]           # 절대 좌표
    duration: 1s
    easing: ease-in-out
  
  # 상대 이동
  step 2: move nodeId
    by: [50, 100]        # 상대 이동
    duration: 0.5s
@end
```

#### E. transform
```
@animation
  # 크기 변화
  step 1: transform nodeId
    scale: 1.5
    duration: 0.8s
  
  # 회전
  step 2: transform nodeId
    rotate: 360deg
    duration: 1s
@end
```

#### F. camera (전체 뷰)
```
@animation
  # 특정 노드로 줌인
  step 1: camera focus nodeId
    zoom: 2x
    duration: 1s
  
  # 전체 보기
  step 2: camera fitAll
    duration: 1s
  
  # 특정 영역 보기
  step 3: camera fitNodes nodeId1, nodeId2, nodeId3
    padding: 50px
@end
```

#### G. annotate (주석/설명)
```
@animation
  # 말풍선 표시
  step 1: annotate nodeId
    text: "이것이 Genesis Block입니다"
    position: top        # top, bottom, left, right
    duration: 3s
  
  # 화살표 포인터
  step 2: point nodeId
    from: [x, y]
    text: "주목!"
@end
```

---

## 3. 효과 (Effects) 라이브러리

### 등장 효과 (Entrance)
```
effect: fadeIn           # 서서히 나타남
effect: slideInLeft      # 왼쪽에서 슬라이드
effect: slideInRight     # 오른쪽에서 슬라이드
effect: slideInTop       # 위에서 슬라이드
effect: slideInBottom    # 아래에서 슬라이드
effect: scaleIn          # 작게->크게
effect: bounceIn         # 튕기며 등장
effect: flipIn           # 뒤집히며 등장
effect: rotateIn         # 회전하며 등장
```

### 강조 효과 (Emphasis)
```
effect: pulse            # 맥박 효과
effect: shake            # 흔들림
effect: bounce           # 튕김
effect: flash            # 깜빡임
effect: glow             # 빛남
effect: wave             # 물결
```

### 연결선 효과 (Flow)
```
flow: particles          # 입자가 흐름
flow: dash              # 점선 이동
flow: glow              # 빛나는 선
flow: wave              # 물결 효과
flow: arrow             # 화살표 이동
flow: lightning         # 번개 효과
```

### 퇴장 효과 (Exit)
```
effect: fadeOut          # 서서히 사라짐
effect: slideOutLeft     # 왼쪽으로 슬라이드
effect: scaleOut         # 크게->작게
effect: bounceOut        # 튕기며 사라짐
```

---

## 4. 타이밍 제어

### 순차 실행 (Sequential)
```
@animation
  step 1: show nodeA
    duration: 1s
  
  step 2: show nodeB      # step 1 끝나고 실행
    duration: 1s
@end
```

### 병렬 실행 (Parallel)
```
@animation
  step 1: show nodeA
    duration: 1s
  
  step 1: show nodeB      # 같은 step number = 동시 실행
    duration: 1s
@end
```

### 지연 (Delay)
```
@animation
  step 1: show nodeA
    delay: 0.5s          # 0.5초 대기 후 실행
    duration: 1s
@end
```

### 시차 (Stagger)
```
@animation
  step 1: show nodeA, nodeB, nodeC, nodeD
    stagger: 0.3s        # 0.3초 간격으로 순차 실행
@end
```

### 절대 시간 (Absolute Timing)
```
@animation
  step 1: show nodeA
    at: 0s               # 0초에 실행
    duration: 1s
  
  step 2: show nodeB
    at: 0.5s             # 0.5초에 실행 (병렬)
    duration: 1s
  
  step 3: show nodeC
    at: 2s               # 2초에 실행
@end
```

---

## 5. 스타일 정의

### 노드 스타일
```
@style
  nodeId:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px
    color: #000000
    font-size: 16px
    font-weight: bold
    border-radius: 10px
    shadow: 0 4px 6px rgba(0,0,0,0.1)
  
  # 클래스 스타일
  .important:
    fill: #ffebee
    stroke: #f44336
    stroke-width: 4px
  
  # 타입별 스타일
  decision:
    fill: #fff3e0
    stroke: #ff9800
@end
```

### 연결선 스타일
```
@style
  connection:
    stroke: #2196F3
    stroke-width: 2px
    stroke-dasharray: 5,5
    arrow-color: #2196F3
@end
```

### 애니메이션 스타일
```
@style
  animation:
    easing: ease-in-out
    duration: 1s
  
  glow:
    color: #FFD700
    blur: 10px
    intensity: 0.8
@end
```

---

## 6. 설정 (Config)

```
@config
  # 재생 설정
  autoplay: true
  loop: false
  speed: 1.0              # 1.0 = 정상, 0.5 = 느림, 2.0 = 빠름
  
  # UI 설정
  controls: true          # 재생 컨트롤 표시
  timeline: true          # 타임라인 바 표시
  narration: true         # 내레이션 패널 표시
  
  # 렌더링 설정
  width: 1920
  height: 1080
  background: #ffffff
  padding: 50px
  
  # 품질 설정
  quality: high           # low, medium, high, ultra
  fps: 60
  
  # 내보내기 설정
  export:
    format: mp4           # mp4, gif, webm
    resolution: 1080p     # 720p, 1080p, 4k
@end
```

---

## 7. 내레이션 정의

```
@narration
  step 1:
    title: "Genesis Block"
    text: "블록체인의 첫 번째 블록이 생성됩니다."
    voice: none           # none, male, female (TTS)
  
  step 2:
    title: "블록 연결"
    text: "Genesis Block의 해시값을 포함하여 다음 블록이 생성됩니다."
  
  step 3:
    title: "체인 형성"
    text: "이렇게 블록들이 체인으로 연결되어 블록체인이 됩니다."
@end
```

---

## 완전한 예시 1: 블록체인

```
# 블록체인 구조 다이어그램
flowchart LR
  genesis[Genesis Block<br/>Hash: 0000]
  block1[Block #1<br/>Hash: a1b2<br/>Prev: 0000]
  block2[Block #2<br/>Hash: c3d4<br/>Prev: a1b2]
  block3[Block #3<br/>Hash: e5f6<br/>Prev: c3d4]
  
  genesis --> block1
  block1 --> block2
  block2 --> block3

@animation
  # Step 1: Genesis Block 생성
  step 1: show genesis
    duration: 1.5s
    effect: fadeIn, pulse
  
  step 2: highlight genesis
    color: #4CAF50
    glow: true
    duration: 1s
  
  # Step 2: Block #1 연결
  step 3: connect genesis->block1
    flow: particles
    speed: 2s
    color: #2196F3
  
  step 4: show block1
    effect: slideInRight
    duration: 1s
  
  step 5: highlight block1
    color: #FF9800
    pulse: true
    duration: 1s
  
  # Step 3: Block #2 연결
  step 6: connect block1->block2
    flow: particles
    speed: 2s
  
  step 7: show block2
    effect: slideInRight
    duration: 1s
  
  # Step 4: Block #3 연결
  step 8: connect block2->block3
    flow: particles
    speed: 2s
  
  step 9: show block3
    effect: slideInRight
    duration: 1s
  
  # Step 5: 전체 보기
  step 10: unhighlight genesis, block1
  
  step 11: camera fitAll
    padding: 50px
    duration: 1.5s
  
  step 12: highlight genesis, block1, block2, block3
    color: #4CAF50
    pulse: true
    stagger: 0.2s
@end

@style
  genesis:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px
    shadow: 0 4px 6px rgba(0,0,0,0.1)
  
  block1, block2, block3:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 2px
  
  connection:
    stroke: #2196F3
    stroke-width: 3px
@end

@narration
  step 1:
    title: "Genesis Block 생성"
    text: "블록체인의 시작점인 Genesis Block이 생성됩니다. 이전 해시값이 없는 유일한 블록입니다."
  
  step 3:
    title: "첫 번째 블록 연결"
    text: "Genesis Block의 해시값(0000)을 참조하여 Block #1이 생성되고 연결됩니다."
  
  step 6:
    title: "체인 확장"
    text: "각 블록은 이전 블록의 해시를 포함하며, 이로써 변조가 불가능한 체인이 형성됩니다."
  
  step 11:
    title: "블록체인 완성"
    text: "이렇게 블록들이 체인으로 연결되어 하나의 블록체인이 완성됩니다."
@end

@config
  autoplay: true
  loop: false
  controls: true
  timeline: true
  speed: 1.0
  background: #f5f5f5
  
  export:
    format: mp4
    resolution: 1080p
    fps: 60
@end
```

---

## 완전한 예시 2: 버블 정렬 알고리즘

```
flowchart TD
  start([시작])
  input[배열 입력: 5, 2, 8, 1, 9]
  outer{i < n-1?}
  inner{j < n-i-1?}
  compare{arr[j] > arr[j+1]?}
  swap[교환]
  next_j[j++]
  next_i[i++]
  end_prog([종료])
  
  start --> input
  input --> outer
  outer -->|Yes| inner
  outer -->|No| end_prog
  inner -->|Yes| compare
  inner -->|No| next_i
  compare -->|Yes| swap
  compare -->|No| next_j
  swap --> next_j
  next_j --> inner
  next_i --> outer

@animation
  # 시작
  step 1: show start
    effect: fadeIn
    duration: 0.5s
  
  step 2: connect start->input
    flow: arrow
    speed: 0.5s
  
  step 3: show input
    effect: bounceIn
  
  # 외부 루프 시작
  step 4: highlight input
    color: #4CAF50
  
  step 5: connect input->outer
    flow: dash
  
  step 6: show outer
    effect: scaleIn
  
  # 조건 체크
  step 7: highlight outer
    color: #2196F3
    pulse: true
  
  step 8: annotate outer
    text: "i = 0, n = 5"
    position: right
  
  # 내부 루프
  step 9: connect outer->inner
    flow: arrow
    label: "Yes"
  
  step 10: show inner
    effect: slideInRight
  
  # 비교
  step 11: connect inner->compare
    flow: arrow
  
  step 12: show compare
    effect: flipIn
  
  step 13: highlight compare
    color: #FF9800
    pulse: true
  
  step 14: annotate compare
    text: "5 > 2?"
    position: bottom
  
  # 교환
  step 15: connect compare->swap
    flow: lightning
    label: "Yes"
  
  step 16: show swap
    effect: shake
  
  step 17: highlight swap
    color: #F44336
    flash: true
  
  # 반복
  step 18: connect swap->next_j
    flow: arrow
  
  step 19: show next_j
  
  step 20: connect next_j->inner
    flow: dash
  
  # 전체 보기
  step 21: camera fitAll
    duration: 2s
@end

@style
  start, end_prog:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px
    border-radius: 20px
  
  outer, inner, compare:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 2px
  
  swap:
    fill: #ffebee
    stroke: #F44336
    stroke-width: 3px
  
  connection:
    stroke: #757575
    stroke-width: 2px
@end

@config
  autoplay: false
  loop: false
  controls: true
  speed: 0.75
@end
```

---

## 완전한 예시 3: 마인드맵 (React 개념)

```
mindmap
  root((React))
    components[컴포넌트]
      functional[함수형 컴포넌트]
      class[클래스 컴포넌트]
    state[상태 관리]
      useState[useState Hook]
      useReducer[useReducer Hook]
      redux[Redux]
    lifecycle[생명주기]
      mounting[마운트]
      updating[업데이트]
      unmounting[언마운트]
    rendering[렌더링]
      virtual_dom[Virtual DOM]
      reconciliation[재조정]

@animation
  # 중심에서 방사형으로 확장
  step 1: show root
    effect: scaleIn, pulse
    duration: 1s
  
  # 첫 번째 가지
  step 2: connect root->components
    flow: wave
    speed: 1s
  
  step 3: show components
    effect: slideInRight
  
  step 4: connect components->functional, components->class
    flow: particles
    stagger: 0.3s
  
  step 5: show functional, class
    effect: fadeIn
    stagger: 0.2s
  
  # 두 번째 가지
  step 6: connect root->state
    flow: wave
  
  step 7: show state
    effect: slideInRight
  
  step 8: connect state->useState, state->useReducer, state->redux
    flow: particles
    stagger: 0.3s
  
  step 9: show useState, useReducer, redux
    effect: fadeIn
    stagger: 0.2s
  
  # 나머지 가지들
  step 10: connect root->lifecycle
    flow: wave
  
  step 11: show lifecycle
    effect: slideInBottom
  
  step 12: show mounting, updating, unmounting
    effect: bounceIn
    stagger: 0.3s
  
  step 13: connect root->rendering
    flow: wave
  
  step 14: show rendering
    effect: slideInLeft
  
  step 15: show virtual_dom, reconciliation
    effect: fadeIn
    stagger: 0.2s
  
  # 전체 하이라이트
  step 16: highlight root
    color: #61DAFB
    glow: true
    pulse: true
@end

@style
  root:
    fill: #61DAFB
    stroke: #282c34
    stroke-width: 4px
    font-size: 24px
    font-weight: bold
  
  components, state, lifecycle, rendering:
    fill: #282c34
    color: #ffffff
    stroke: #61DAFB
    stroke-width: 2px
  
  functional, class, useState, useReducer, redux, mounting, updating, unmounting, virtual_dom, reconciliation:
    fill: #f7f7f7
    stroke: #61DAFB
@end

@config
  autoplay: true
  loop: false
  speed: 1.0
@end
```

---

## 다음 단계

이제 우리가 기획해야 할 것들:

1. **드래그앤드롭 블록 팔레트 설계** - 어떤 블록들이 필요한지
2. **블록 → DSL 변환 로직** - UI에서 어떻게 코드 생성할지
3. **SDK API 상세 설계** - 개발자가 사용할 메서드들
4. **템플릿 라이브러리** - 미리 만들어진 예시들

어떤 걸 먼저 상세히 기획할까요?