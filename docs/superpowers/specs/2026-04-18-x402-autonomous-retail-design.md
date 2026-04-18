---
name: X402 Autonomous Retail Template Design
description: AnimFlow template for pitching X402-powered autonomous retail solution to Avalanche builder meetup team
type: design
date: 2026-04-18
---

# X402 Autonomous Retail — AnimFlow Template Design

## Overview

**Template Name:** X402 Autonomous Retail  
**Purpose:** Pitch X402 + AI agent solution to team members for Avalanche builder meetup  
**Target Audience:** Internal team voting on project proposals  
**Format:** TD (Top-Down) flowchart with parallel role lanes and phase transitions

---

## Problem & Solution Narrative

### What We're Showing

The template visualizes a **problem → solution** journey:

1. **Phase 1 (Manual Chaos)**: Participants experience a convenience store operation without automation
   - Customer: Manual shopping (select items, deal with stock-outs, request unavailable items)
   - Shop Owner: Manual inventory management, responding to requests, settlement logistics
   - Result: Visible pain points — bad inventory, operational burden

2. **Phase 2 (X402 Smart Era)**: Same operation with AI agents + X402 automation
   - Customer: AI agent handles shopping decisions, X402 auto-executes transactions
   - Shop Owner: AI dashboard auto-triggers reorders, demand aggregation, on-chain settlement
   - Result: Seamless M2M operations

### Why This Works for a Pitch

- **Contrast is visceral**: Phase 1 pain translates to Phase 2 elegance
- **X402 as the hero**: Gold-highlighted, positioned as the solution enabler
- **Participant experience framing**: Team members see what attendees will actually do/feel

---

## Visual Architecture

### Node Structure (TD Layout)

```
┌─ START
│   ├─ Onboarding (Telegram Bot, Coin Faucet)
│   └─ Role Assignment (Owner: 1, Customers: N)
│
├─ PHASE 1: Manual Chaos [Banner — Orange/Red]
│   ├─ Left Lane: Customer Flow
│   │   ├─ Browse Menu & Recipe
│   │   ├─ Select Ingredients
│   │   ├─ Out of Stock → Wait for Restock
│   │   └─ Item Not Stocked → Manual Text Request
│   │
│   ├─ Right Lane: Owner Flow
│   │   ├─ Monitor Real-time Inventory
│   │   ├─ Manual Ordering for Stock-outs
│   │   └─ Process Manual Requests
│   │
│   └─ Settlement (Bad Inventory + Operational Fatigue) [Red Climax]
│
├─ PHASE 2: X402 Smart Era [Banner — Electric Blue]
│   ├─ Left Lane: Customer AI Agent
│   │   ├─ Click Menu
│   │   └─ AI Agent + X402 Auto-Purchase
│   │
│   ├─ Right Lane: Owner AI Dashboard
│   │   ├─ AI Auto-Reorder Triggers
│   │   ├─ Demand Aggregation
│   │   └─ AI-Driven Decisions
│   │
│   └─ X402 M2M On-chain Settlement [Gold Climax]
│
└─ END
```

### Key Design Decisions

1. **Phase Banner Nodes**: Wide, prominent nodes marking transition between manual and automated
2. **Parallel Lanes**: Owner and Customer flow side-by-side within each phase (dagre auto-layout)
3. **X402 as Final Apex**: Gold-colored, glowing, positioned as the culminating innovation
4. **Settlement Nodes**: Diamond shapes to mark decision/outcome points

---

## Animation & Camera Plan

### 8-Act Dramatic Structure

| Act | Node(s) | Camera | Effect | Purpose |
|-----|---------|--------|--------|---------|
| 1 | START → Onboarding | `slideInLeft` | Establish context | Setup |
| 2 | Role Assignment | `pulse` | Highlight divergence | Role clarity |
| 3 | Phase 1 Banner | `focusOn` + `scaleIn` | Zoom in with drama | Transition |
| 4 | Customer P1 + Owner P1 | `stagger reveal` | Show both lanes | Parallel work |
| 5 | **Settlement (Bad Inventory)** | **`focusOn` + red `glow`** | **Zoom + highlight** | **PAIN CLIMAX** |
| 6 | `fitAll` transition | Camera pulls back | Full picture | Perspective shift |
| 7 | Phase 2 Banner | `scaleIn` + blue tone | Dramatic entrance | Hope/Solution |
| 8 | **X402 Node** | **`focusOn` + gold `glow` + `pulse`** | **Intense focus** | **SOLUTION CLIMAX** |
| 9 | Final `fitAll` | Zoom out | Complete view | Resolution |

### Camera Techniques

- **`focusOn`**: Draws viewer attention to critical nodes (settlements, X402)
- **`glow`**: Color-coded emotional tone (red = pain, gold = solution)
- **`pulse`**: Rhythmic highlight for decision/outcome nodes
- **`stagger`**: Reveals multiple nodes with timing delay for narrative pacing
- **`fitAll`**: Context resets before major transitions

---

## Color Scheme & Styling

### Phase 1 (Manual): Warm Chaos Palette

| Node Type | Color | Hex | Meaning |
|-----------|-------|-----|---------|
| Phase 1 Banner | Orange | `#FF6B35` | Danger/Alert |
| Customer P1 | Light Orange | `#FFE0CC` | Engaged but stressed |
| Owner P1 | Light Red | `#FFCDD2` | Overwhelmed |
| Settlement (Bad Inventory) | Deep Red | `#C62828` | Critical pain point |

### Phase 2 (Automated): Cool Innovation Palette

| Node Type | Color | Hex | Meaning |
|-----------|-------|-----|---------|
| Phase 2 Banner | Electric Blue | `#1565C0` | Technology/Innovation |
| AI Agent | Light Blue | `#E3F2FD` | Smart assistance |
| **X402 Node** | **GOLD** | **`#FFD700`** | **Premium solution** |
| Final Result | Green | `#2E7D32` | Success |

### Visual Hierarchy

- **X402 Node**: Largest, gold background, 3px stroke, special glow effect
- **Phase Banners**: Wide nodes (rectangle with substantial padding)
- **Settlement Nodes**: Diamond shapes, color-coded by phase
- **Regular Nodes**: Standard rectangles, phase-appropriate colors

---

## Narration Strategy (Korean)

### Phase 1 Opening

> "편의점에서 손님들에게 음식을 팔아야 합니다. 점주는 수동으로 재고를 관리해야 하고, 손님들은 일일이 물품을 확인하며 사야 합니다. 이게 바로 자동화 없는 리테일의 현실입니다."

### Phase 1 Settlement (Pain Moment)

> "3라운드가 끝났습니다. 점주는 예측을 틀려 팔리지 않은 재고를 안고 있고, 손님이 신청했던 물품을 챙치지 못했습니다. 이게 비효율입니다."

### Phase 2 Opening

> "이제 X402가 들어옵니다. AI 에이전트가 손님을 도와 구매를 자동화하고, X402가 즉시 결제합니다. 점주의 발주도 자동으로 트리거됩니다."

### X402 Climax

> "모든 거래가 블록체인 위에서 즉시 정산됩니다. 재고 낭비 없음. 운영 오류 없음. M2M 자동화의 미래가 이것입니다."

---

## Implementation Notes

### DSL Structure

- **Root direction**: `flowchart TD` (top-down)
- **Phase banners**: Rectangle nodes with `[높이 강조 텍스트]` syntax
- **Settlement nodes**: Diamond shapes `{}`
- **Parallel lanes**: Achieved via node connections — both owner and customer nodes connect from phase banner
- **X402 styling**: Class-based styling with gold background + special effects

### Animation Sequencing

1. Onboarding section: 0–2s (setup)
2. Phase 1 reveal: 2–5s (customer + owner lanes)
3. Settlement climax: 5–8s (red glow focus)
4. Transition pause: 8–10s (fitAll, let viewer absorb)
5. Phase 2 reveal: 10–13s (blue tone, new hope)
6. X402 climax: 13–17s (gold glow, final message)
7. Outro: 17–20s (fitAll, complete picture)

Total runtime: ~20 seconds for full demo, repeatable on loop

---

## Success Criteria

✅ X402 positioned as hero (gold highlight, camera focus)  
✅ Phase 1 pain clearly visible (red settlement node)  
✅ Phase 2 automation elegance clear (blue/gold contrast)  
✅ Camera drama reinforces narrative (no static view)  
✅ Korean narration connects participant experience to technology  
✅ Suitable for team voting presentation (clear, compelling, concise)

---

## Notes for Implementation

- Ensure Phase 1 and Phase 2 banners are wide enough to stand out
- X402 node should be the largest visual element (font size, stroke width)
- Animation timing should match narration pacing
- Color contrast needs to work on projectors (warm orange vs cool blue is distinct)
- Test on 16:9 widescreen presentation displays
