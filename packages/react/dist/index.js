'use strict';

var React4 = require('react');
var dagre = require('dagre');
var gsap = require('gsap');
var jsxRuntime = require('react/jsx-runtime');
var rough = require('roughjs');
var rough2 = require('roughjs/bin/rough');
var zustand = require('zustand');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var React4__default = /*#__PURE__*/_interopDefault(React4);
var dagre__default = /*#__PURE__*/_interopDefault(dagre);
var gsap__default = /*#__PURE__*/_interopDefault(gsap);
var rough__default = /*#__PURE__*/_interopDefault(rough);
var rough2__default = /*#__PURE__*/_interopDefault(rough2);

// src/components/AnimflowPlayer.tsx

// src/core/parser/lexer.ts
function splitDslSections(dsl) {
  const sections = {
    diagram: ""
  };
  const animMatch = dsl.match(/@animation\s+([\s\S]*?)\s*@end/);
  if (animMatch) {
    sections.animation = animMatch[1].trim();
  }
  const styleMatch = dsl.match(/@style\s+([\s\S]*?)\s*@end/);
  if (styleMatch) {
    sections.style = styleMatch[1].trim();
  }
  const narrationMatch = dsl.match(/@narration\s+([\s\S]*?)\s*@end/);
  if (narrationMatch) {
    sections.narration = narrationMatch[1].trim();
  }
  const configMatch = dsl.match(/@config\s+([\s\S]*?)\s*@end/);
  if (configMatch) {
    sections.config = configMatch[1].trim();
  }
  let diagramText = dsl;
  diagramText = diagramText.replace(/@animation\s+[\s\S]*?@end/g, "");
  diagramText = diagramText.replace(/@style\s+[\s\S]*?@end/g, "");
  diagramText = diagramText.replace(/@narration\s+[\s\S]*?@end/g, "");
  diagramText = diagramText.replace(/@config\s+[\s\S]*?@end/g, "");
  sections.diagram = diagramText.trim();
  return sections;
}
function parseIndentedProperties(text) {
  const props = {};
  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.includes(":")) continue;
    const colonIndex = trimmed.indexOf(":");
    const key = trimmed.substring(0, colonIndex).trim();
    const value = trimmed.substring(colonIndex + 1).trim();
    if (value === "true") {
      props[key] = true;
    } else if (value === "false") {
      props[key] = false;
    } else if (!isNaN(Number(value))) {
      props[key] = Number(value);
    } else {
      props[key] = value.replace(/^["']|["']$/g, "");
    }
  }
  return props;
}

// src/core/parser/diagram-parser.ts
function parseFlowchart(diagramText) {
  const lines = diagramText.split("\n").map((l) => l.trim()).filter(Boolean);
  let direction = "LR";
  const nodes = [];
  const edges = [];
  const nodeMap = /* @__PURE__ */ new Map();
  for (const line of lines) {
    if (line.startsWith("flowchart")) {
      const match = line.match(/flowchart\s+(LR|RL|TD|BT)/);
      if (match) {
        direction = match[1];
      }
      continue;
    }
    if (line.includes("-->") || line.includes("-.->") || line.includes("==>")) {
      const edge = parseEdgeLine(line);
      if (edge) {
        edges.push(edge);
      }
      continue;
    }
    const node = parseNodeLine(line);
    if (node && !nodeMap.has(node.id)) {
      nodes.push(node);
      nodeMap.set(node.id, node);
    }
  }
  return { direction, nodes, edges };
}
function parseNodeLine(line) {
  const patterns = [
    { regex: /(\w+)\(\[([^\]]+)\]\)/, shape: "terminator" },
    { regex: /(\w+)\[([^\]]+)\]/, shape: "rectangle" },
    { regex: /(\w+)\{([^}]+)\}/, shape: "diamond" },
    { regex: /(\w+)\[\/([^\/]+)\/\]/, shape: "parallelogram" },
    { regex: /(\w+)\[\(([^\)]+)\)\]/, shape: "database" },
    { regex: /(\w+)\[\[([^\]]+)\]\]/, shape: "document" }
  ];
  for (const { regex, shape } of patterns) {
    const match = line.match(regex);
    if (match) {
      const id = match[1];
      const labelText = match[2];
      const parts = labelText.split("<br/>").map((p) => p.trim());
      const label = parts[0];
      const subtitle = parts.slice(1).join("\n");
      return {
        id,
        shape,
        label,
        subtitle: subtitle || void 0
      };
    }
  }
  return null;
}
function parseEdgeLine(line) {
  let edgeStyle = "solid";
  let arrowSymbol = "-->";
  if (line.includes("-.->")) {
    edgeStyle = "dashed";
    arrowSymbol = ".->";
  } else if (line.includes("==>")) {
    edgeStyle = "thick";
    arrowSymbol = "==>";
  }
  const labelMatch = line.match(/\|([^|]+)\|/);
  const label = labelMatch ? labelMatch[1].trim() : void 0;
  const cleanLine = line.replace(/\|[^|]+\|/g, "");
  const parts = cleanLine.split(arrowSymbol).map((p) => p.trim());
  if (parts.length !== 2) return null;
  const from = parts[0];
  const to = parts[1];
  return {
    id: `${from}_to_${to}`,
    from,
    to,
    label,
    style: edgeStyle
  };
}

// src/core/parser/animation-parser.ts
function parseAnimation(animationText) {
  const steps = [];
  const lines = animationText.split("\n");
  let currentStep = null;
  let propertyLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith("step ")) {
      if (currentStep) {
        const props = parseIndentedProperties(propertyLines.join("\n"));
        currentStep.properties = props;
        steps.push(currentStep);
      }
      const match = trimmed.match(/step\s+(\d+):\s+(\w+)\s+(.+)/);
      if (match) {
        const stepNum = parseInt(match[1], 10);
        const action = match[2];
        const targetsStr = match[3].trim();
        let targets = [];
        if (action === "connect") {
          const connections = targetsStr.split(",").map((s) => s.trim());
          targets = connections;
        } else {
          targets = targetsStr.split(",").map((s) => s.trim());
        }
        currentStep = {
          step: stepNum,
          action,
          targets,
          properties: {}
        };
        propertyLines = [];
      }
    } else if (line.startsWith("  ") && currentStep) {
      propertyLines.push(line);
    }
  }
  if (currentStep) {
    const props = parseIndentedProperties(propertyLines.join("\n"));
    currentStep.properties = props;
    steps.push(currentStep);
  }
  return steps;
}

// src/core/parser/style-parser.ts
function parseStyle(styleText) {
  const styles = {};
  const lines = styleText.split("\n");
  let currentNodeId = null;
  let currentStyle = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.endsWith(":") && !line.startsWith("  ")) {
      if (currentNodeId) {
        styles[currentNodeId] = currentStyle;
      }
      currentNodeId = trimmed.slice(0, -1);
      currentStyle = {};
    } else if (line.startsWith("  ") && currentNodeId) {
      const colonIndex = trimmed.indexOf(":");
      if (colonIndex === -1) continue;
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();
      const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      if (camelKey === "strokeWidth" || camelKey === "fontSize") {
        currentStyle[camelKey] = parseInt(value, 10);
      } else {
        currentStyle[camelKey] = value;
      }
    }
  }
  if (currentNodeId) {
    styles[currentNodeId] = currentStyle;
  }
  return styles;
}

// src/core/parser/narration-parser.ts
function parseNarration(narrationText) {
  const narrations = [];
  const lines = narrationText.split("\n");
  let currentNarration = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("step ") && trimmed.endsWith(":")) {
      if (currentNarration && currentNarration.step !== void 0) {
        narrations.push(currentNarration);
      }
      const match = trimmed.match(/step\s+(\d+):/);
      if (match) {
        currentNarration = {
          step: parseInt(match[1], 10),
          title: "",
          text: ""
        };
      }
    } else if (line.startsWith("  ") && currentNarration) {
      const colonIndex = trimmed.indexOf(":");
      if (colonIndex === -1) continue;
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();
      if (key === "title" || key === "text") {
        currentNarration[key] = value.replace(/^["']|["']$/g, "");
      }
    }
  }
  if (currentNarration && currentNarration.step !== void 0) {
    narrations.push(currentNarration);
  }
  return narrations;
}

// src/core/parser/config-parser.ts
function parseConfig(configText) {
  const props = parseIndentedProperties(configText);
  const config = {};
  if (props.autoplay !== void 0) config.autoplay = props.autoplay;
  if (props.loop !== void 0) config.loop = props.loop;
  if (props.controls !== void 0) config.controls = props.controls;
  if (props.timeline !== void 0) config.timeline = props.timeline;
  if (props.narration !== void 0) config.narration = props.narration;
  if (props.speed !== void 0) config.speed = props.speed;
  if (props.width !== void 0) config.width = props.width;
  if (props.height !== void 0) config.height = props.height;
  if (props.fps !== void 0) config.fps = props.fps;
  if (props.background) config.background = props.background;
  if (props.padding) config.padding = props.padding;
  if (props.quality) config.quality = props.quality;
  return config;
}

// src/core/parser/dsl-parser.ts
function parseDsl(dslText) {
  try {
    const sections = splitDslSections(dslText);
    const { direction, nodes, edges } = parseFlowchart(sections.diagram);
    const animations = sections.animation ? parseAnimation(sections.animation) : [];
    const styles = sections.style ? parseStyle(sections.style) : {};
    const narrations = sections.narration ? parseNarration(sections.narration) : [];
    const config = sections.config ? parseConfig(sections.config) : { autoplay: true, loop: false, controls: true };
    const data = {
      metadata: {
        id: `diagram_${Date.now()}`,
        type: "flowchart",
        direction,
        created: (/* @__PURE__ */ new Date()).toISOString()
      },
      nodes,
      edges,
      animations,
      styles,
      narrations,
      config
    };
    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          line: 0,
          column: 0,
          message: error instanceof Error ? error.message : "Unknown error",
          type: "syntax"
        }
      ]
    };
  }
}
function calculateFlowchartLayout(nodes, edges, direction = "LR") {
  const g = new dagre__default.default.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    nodesep: 80,
    edgesep: 40,
    ranksep: 120
  });
  g.setDefaultEdgeLabel(() => ({}));
  for (const node of nodes) {
    const { width, height } = estimateNodeSize(node);
    g.setNode(node.id, {
      label: node.label,
      width,
      height
    });
  }
  for (const edge of edges) {
    g.setEdge(edge.from, edge.to);
  }
  dagre__default.default.layout(g);
  const positionedNodes = nodes.map((node) => {
    const dagreNode = g.node(node.id);
    return {
      ...node,
      position: {
        x: dagreNode.x,
        y: dagreNode.y
      },
      width: dagreNode.width,
      height: dagreNode.height
    };
  });
  const positionedEdges = edges.map((edge) => {
    const dagreEdge = g.edge(edge.from, edge.to);
    let points = dagreEdge?.points || [];
    points = points.filter(
      (p) => p && typeof p.x === "number" && typeof p.y === "number" && !isNaN(p.x) && !isNaN(p.y) && isFinite(p.x) && isFinite(p.y)
    );
    if (points.length < 2) {
      const fromNode = g.node(edge.from);
      const toNode = g.node(edge.to);
      if (fromNode && toNode) {
        points = [
          { x: fromNode.x, y: fromNode.y },
          { x: toNode.x, y: toNode.y }
        ];
      }
    }
    return {
      ...edge,
      points
    };
  });
  return {
    nodes: positionedNodes,
    edges: positionedEdges
  };
}
function estimateNodeSize(node) {
  const lines = [node.label];
  if (node.subtitle) {
    lines.push(...node.subtitle.split("\n"));
  }
  const maxLineLength = Math.max(...lines.map((l) => l.length));
  const lineCount = lines.length;
  const width = Math.max(120, maxLineLength * 8 + 40);
  const height = Math.max(60, lineCount * 24 + 30);
  return { width, height };
}
function calculateEdgePath(points) {
  if (points.length < 2) return "";
  const validPoints = points.filter(
    (p) => p && typeof p.x === "number" && typeof p.y === "number" && !isNaN(p.x) && !isNaN(p.y)
  );
  if (validPoints.length < 2) return "";
  if (validPoints.length === 2) {
    return `M ${validPoints[0].x} ${validPoints[0].y} L ${validPoints[1].x} ${validPoints[1].y}`;
  }
  const isHorizontal = validPoints.every((p) => Math.abs(p.y - validPoints[0].y) < 1);
  const isVertical = validPoints.every((p) => Math.abs(p.x - validPoints[0].x) < 1);
  if (isHorizontal || isVertical) {
    return `M ${validPoints[0].x} ${validPoints[0].y} L ${validPoints[validPoints.length - 1].x} ${validPoints[validPoints.length - 1].y}`;
  }
  let path = `M ${validPoints[0].x} ${validPoints[0].y}`;
  if (validPoints.length > 2) {
    const midIndex = Math.floor(validPoints.length / 2);
    path += ` L ${validPoints[midIndex].x} ${validPoints[midIndex].y}`;
  }
  path += ` L ${validPoints[validPoints.length - 1].x} ${validPoints[validPoints.length - 1].y}`;
  return path;
}
function applyExitEffect(element, effect, duration = 1) {
  switch (effect) {
    case "fadeOut":
      return gsap__default.default.to(element, {
        opacity: 0,
        duration,
        ease: "power2.in"
      });
    case "slideOutLeft":
      return gsap__default.default.to(element, {
        x: -100,
        opacity: 0,
        duration,
        ease: "power2.in"
      });
    case "slideOutRight":
      return gsap__default.default.to(element, {
        x: 100,
        opacity: 0,
        duration,
        ease: "power2.in"
      });
    case "scaleOut":
      return gsap__default.default.to(element, {
        scale: 0,
        opacity: 0,
        duration,
        ease: "back.in(1.7)"
      });
    case "bounceOut":
      return gsap__default.default.to(element, {
        scale: 0,
        opacity: 0,
        duration,
        ease: "bounce.in"
      });
    default:
      return gsap__default.default.to(element, {
        opacity: 0,
        duration
      });
  }
}
function applyGlowEffect(element, color, duration = 1) {
  return gsap__default.default.to(element, {
    filter: `drop-shadow(0 0 10px ${color})`,
    duration,
    ease: "power2.out"
  });
}
function removeGlowEffect(element, duration = 0.5) {
  return gsap__default.default.to(element, {
    filter: "none",
    duration,
    ease: "power2.in"
  });
}
function animateEdgeFlow(edgeElement, effect, duration = 2) {
  const pathElement = edgeElement.querySelector(".edge-path");
  if (!pathElement) {
    return gsap__default.default.to(edgeElement, { opacity: 1, duration: 0 });
  }
  gsap__default.default.set(edgeElement, { opacity: 1 });
  switch (effect) {
    case "particles":
      return animateParticles(edgeElement, pathElement, duration);
    case "dash":
      return animateDash(edgeElement, pathElement, duration);
    case "arrow":
      return animateArrow(edgeElement, pathElement, duration);
    default:
      return animateParticles(edgeElement, pathElement, duration);
  }
}
function animateParticles(edgeElement, pathElement, duration) {
  const totalLength = pathElement.getTotalLength();
  const roughPathContainer = edgeElement.querySelector(".rough-path-container");
  const roughArrowEl = edgeElement.querySelector(".rough-arrow-overlay");
  const tl = gsap__default.default.timeline();
  if (roughPathContainer) {
    tl.fromTo(
      roughPathContainer,
      { opacity: 0 },
      {
        opacity: 1,
        duration,
        ease: "power1.inOut"
      }
    );
    if (roughArrowEl) {
      tl.fromTo(
        roughArrowEl,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
        `-=0.3`
      );
    }
  } else {
    const arrowEl = edgeElement.querySelector(".edge-arrow");
    gsap__default.default.set(pathElement, {
      strokeDasharray: totalLength,
      strokeDashoffset: totalLength
    });
    tl.to(pathElement, {
      strokeDashoffset: 0,
      duration,
      ease: "power1.inOut"
    });
    if (arrowEl) {
      tl.fromTo(
        arrowEl,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
        `-=0.3`
      );
    }
  }
  return tl;
}
function animateDash(edgeElement, pathElement, duration) {
  const roughPathContainer = edgeElement.querySelector(".rough-path-container");
  const roughArrowEl = edgeElement.querySelector(".rough-arrow-overlay");
  const tl = gsap__default.default.timeline();
  if (roughPathContainer) {
    tl.fromTo(
      roughPathContainer,
      { opacity: 0 },
      {
        opacity: 1,
        duration,
        ease: "linear"
      }
    );
    if (roughArrowEl) {
      tl.fromTo(
        roughArrowEl,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
        `-=0.3`
      );
    }
  } else {
    const arrowEl = edgeElement.querySelector(".edge-arrow");
    gsap__default.default.set(pathElement, {
      strokeDasharray: "10, 5"
    });
    tl.fromTo(
      pathElement,
      { strokeDashoffset: 0 },
      {
        strokeDashoffset: 15,
        duration: 1,
        repeat: Math.ceil(duration) - 1,
        ease: "linear"
      }
    );
    if (arrowEl) {
      tl.fromTo(
        arrowEl,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
        `-=0.3`
      );
    }
  }
  return tl;
}
function animateArrow(edgeElement, pathElement, duration) {
  const totalLength = pathElement.getTotalLength();
  const roughPathContainer = edgeElement.querySelector(".rough-path-container");
  const roughArrowEl = edgeElement.querySelector(".rough-arrow-overlay");
  const tl = gsap__default.default.timeline();
  if (roughPathContainer) {
    tl.fromTo(
      roughPathContainer,
      { opacity: 0 },
      {
        opacity: 1,
        duration,
        ease: "power2.inOut"
      }
    );
    if (roughArrowEl) {
      tl.fromTo(
        roughArrowEl,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
        `-=0.3`
      );
    }
  } else {
    const arrowEl = edgeElement.querySelector(".edge-arrow");
    gsap__default.default.set(pathElement, {
      strokeDasharray: `${totalLength} ${totalLength}`,
      strokeDashoffset: totalLength
    });
    tl.to(pathElement, {
      strokeDashoffset: 0,
      duration,
      ease: "power2.inOut"
    });
    if (arrowEl) {
      tl.fromTo(
        arrowEl,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
        `-=0.3`
      );
    }
  }
  return tl;
}
function animateCamera(svgElement, action, options = {}) {
  const duration = options.duration || 1;
  switch (action) {
    case "fitAll":
      return fitAllNodes(svgElement, options.padding || 50, duration);
    case "focus":
      if (options.target) {
        return focusNode(svgElement, options.target, options.zoom || 2, duration);
      }
      break;
    case "fitNodes":
      if (options.targets && options.targets.length > 0) {
        return fitNodes(svgElement, options.targets, options.padding || 50, duration);
      }
      break;
  }
  return gsap__default.default.to(svgElement, { duration: 0 });
}
function fitAllNodes(svgElement, padding, duration) {
  const nodesLayer = svgElement.querySelector(".nodes-layer");
  if (!nodesLayer) return gsap__default.default.to(svgElement, { duration: 0 });
  const bbox = nodesLayer.getBBox();
  const viewBox = {
    x: bbox.x - padding,
    y: bbox.y - padding,
    width: bbox.width + padding * 2,
    height: bbox.height + padding * 2
  };
  return gsap__default.default.to(svgElement, {
    attr: {
      viewBox: `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
    },
    duration,
    ease: "power2.inOut"
  });
}
function focusNode(svgElement, nodeId, zoom, duration) {
  const nodeGroup = svgElement.querySelector(`[data-node-id="${nodeId}"]`);
  if (!nodeGroup) return gsap__default.default.to(svgElement, { duration: 0 });
  const bbox = nodeGroup.getBBox();
  const viewBox = {
    x: bbox.x - bbox.width / zoom,
    y: bbox.y - bbox.height / zoom,
    width: bbox.width * (1 + 1 / zoom),
    height: bbox.height * (1 + 1 / zoom)
  };
  return gsap__default.default.to(svgElement, {
    attr: {
      viewBox: `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
    },
    duration,
    ease: "power2.inOut"
  });
}
function fitNodes(svgElement, nodeIds, padding, duration) {
  const nodes = nodeIds.map(
    (id) => svgElement.querySelector(`[data-node-id="${id}"]`)
  ).filter(Boolean);
  if (nodes.length === 0) return gsap__default.default.to(svgElement, { duration: 0 });
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    const bbox = node.getBBox();
    minX = Math.min(minX, bbox.x);
    minY = Math.min(minY, bbox.y);
    maxX = Math.max(maxX, bbox.x + bbox.width);
    maxY = Math.max(maxY, bbox.y + bbox.height);
  }
  const viewBox = {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2
  };
  return gsap__default.default.to(svgElement, {
    attr: {
      viewBox: `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
    },
    duration,
    ease: "power2.inOut"
  });
}

// src/core/animation/timeline.ts
var AnimationTimeline = class {
  constructor(data, options) {
    this.svgElement = null;
    this.stepBoundaries = [];
    this.data = data;
    this.onStepChange = options?.onStepChange;
    this.timeline = gsap__default.default.timeline({
      paused: true,
      onUpdate: () => this.onTimelineUpdate()
    });
  }
  /**
   * Build timeline from animation steps
   */
  buildTimeline(svgElement) {
    this.svgElement = svgElement;
    this.timeline.clear();
    this.stepBoundaries = [];
    this.showAllNodesImmediately();
    const stepGroups = this.groupStepsByNumber(this.data.animations);
    for (const [stepNum, steps] of stepGroups) {
      const stepStart = this.timeline.duration();
      this.timeline.call(() => {
        this.onStepChange?.(stepNum);
      });
      for (const step of steps) {
        this.addStepToTimeline(step);
      }
      const stepEnd = this.timeline.duration();
      this.stepBoundaries.push({ step: stepNum, start: stepStart, end: stepEnd });
    }
  }
  /**
   * Show all nodes immediately without animation
   */
  showAllNodesImmediately() {
    if (!this.svgElement) return;
    const allNodes = this.svgElement.querySelectorAll("[data-node-id]");
    allNodes.forEach((node) => {
      gsap__default.default.set(node, { opacity: 1 });
    });
  }
  /**
   * Group animation steps by step number
   */
  groupStepsByNumber(steps) {
    const groups = /* @__PURE__ */ new Map();
    for (const step of steps) {
      if (!groups.has(step.step)) {
        groups.set(step.step, []);
      }
      groups.get(step.step).push(step);
    }
    return groups;
  }
  /**
   * Add animation step to timeline
   */
  addStepToTimeline(step) {
    if (!this.svgElement) return;
    const { action, targets, properties } = step;
    const duration = this.parseDuration(properties.duration || "1s");
    const delay = this.parseDuration(properties.delay || "0s");
    switch (action) {
      case "show":
        this.addShowAnimation(targets, properties, duration, delay);
        break;
      case "hide":
        this.addHideAnimation(targets, properties, duration, delay);
        break;
      case "highlight":
        this.addHighlightAnimation(targets, properties, duration, delay);
        break;
      case "unhighlight":
        this.addUnhighlightAnimation(targets, duration, delay);
        break;
      case "connect":
        this.addConnectAnimation(targets, properties, duration, delay);
        break;
      case "camera":
        this.addCameraAnimation(properties, duration, delay);
        break;
      case "annotate":
        this.addAnnotateAnimation(targets, properties, duration, delay);
        break;
    }
  }
  /**
   * Add show animation
   * Now nodes are already visible, so show action is skipped for nodes
   */
  addShowAnimation(targets, properties, duration, delay) {
  }
  /**
   * Add hide animation
   */
  addHideAnimation(targets, properties, duration, delay) {
    if (!this.svgElement) return;
    const effect = properties.effect || "fadeOut";
    targets.forEach((targetId) => {
      const element = this.svgElement.querySelector(`[data-node-id="${targetId}"]`);
      if (!element) return;
      const tween = applyExitEffect(element, effect, duration);
      this.timeline.add(tween, delay);
    });
  }
  /**
   * Add highlight animation
   */
  addHighlightAnimation(targets, properties, duration, delay) {
    if (!this.svgElement) return;
    const color = properties.color || "#FFD700";
    const glow = properties.glow || false;
    const pulse = properties.pulse || false;
    const stagger = this.parseDuration(properties.stagger || "0s");
    targets.forEach((targetId, index) => {
      const element = this.svgElement.querySelector(`[data-node-id="${targetId}"]`);
      if (!element) return;
      const rect = element.querySelector("rect, ellipse, polygon, path");
      if (rect) {
        this.timeline.to(
          rect,
          {
            fill: color,
            duration: duration / 2,
            ease: "power2.out"
          },
          stagger > 0 ? `+=${index * stagger}` : "+=0"
        );
      }
      if (glow) {
        const glowTween = applyGlowEffect(element, color, duration / 2);
        this.timeline.add(glowTween, stagger > 0 ? `+=${index * stagger}` : "+=0");
      }
      if (pulse) {
        this.timeline.to(
          element,
          {
            scale: 1.1,
            duration: duration / 4,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut"
          },
          stagger > 0 ? `+=${index * stagger}` : "+=0"
        );
      }
    });
  }
  /**
   * Add unhighlight animation
   */
  addUnhighlightAnimation(targets, duration, delay) {
    if (!this.svgElement) return;
    targets.forEach((targetId) => {
      const element = this.svgElement.querySelector(`[data-node-id="${targetId}"]`);
      if (!element) return;
      const removeGlow = removeGlowEffect(element, duration / 2);
      this.timeline.add(removeGlow, delay);
      this.timeline.to(
        element,
        {
          scale: 1,
          duration: duration / 2
        },
        delay
      );
    });
  }
  /**
   * Add connect animation
   */
  addConnectAnimation(targets, properties, duration, delay) {
    if (!this.svgElement) return;
    const flow = properties.flow || "particles";
    const speed = this.parseDuration(properties.speed || "2s");
    targets.forEach((connection) => {
      const [from, to] = connection.split("->").map((s) => s.trim());
      const edgeElement = this.svgElement.querySelector(
        `[data-from="${from}"][data-to="${to}"]`
      );
      if (!edgeElement) return;
      const tween = animateEdgeFlow(edgeElement, flow, speed);
      this.timeline.add(tween, "+=0");
    });
  }
  /**
   * Add camera animation
   */
  addCameraAnimation(properties, duration, delay) {
    if (!this.svgElement) return;
    const action = properties.cameraAction || "fitAll";
    const tween = animateCamera(this.svgElement, action, {
      target: properties.target,
      targets: properties.targets,
      zoom: properties.zoom,
      padding: this.parsePadding(properties.padding),
      duration
    });
    this.timeline.add(tween, "+=0");
  }
  /**
   * Add annotate animation (placeholder)
   */
  addAnnotateAnimation(targets, properties, duration, delay) {
  }
  /**
   * Parse duration string (e.g., "1.5s" -> 1.5)
   */
  parseDuration(durationStr) {
    const match = durationStr.match(/([0-9.]+)s?/);
    return match ? parseFloat(match[1]) : 1;
  }
  /**
   * Parse padding string (e.g., "50px" -> 50)
   */
  parsePadding(paddingStr) {
    if (!paddingStr) return 50;
    const match = paddingStr.match(/([0-9]+)/);
    return match ? parseInt(match[1], 10) : 50;
  }
  /**
   * Timeline update callback
   */
  onTimelineUpdate() {
  }
  /**
   * Playback controls
   */
  play() {
    this.timeline.play();
  }
  pause() {
    this.timeline.pause();
  }
  restart() {
    this.timeline.restart();
  }
  stop() {
    this.timeline.pause();
    this.timeline.seek(0);
  }
  seek(time) {
    this.timeline.seek(time);
  }
  setSpeed(speed) {
    this.timeline.timeScale(speed);
  }
  getCurrentTime() {
    return this.timeline.time();
  }
  getDuration() {
    return this.timeline.duration();
  }
  getStepBoundaries() {
    return [...this.stepBoundaries];
  }
  isPlaying() {
    return this.timeline.isActive();
  }
};
function NodeRenderer({ node, style }) {
  const { id, shape, label, subtitle, position, width, height } = node;
  if (!position || !width || !height) return null;
  const x = position.x - width / 2;
  const y = position.y - height / 2;
  const fill = node.style?.fill || "#e3f2fd";
  const stroke = node.style?.stroke || "#2196F3";
  const strokeWidth = node.style?.strokeWidth || 2;
  const textColor = node.style?.color || "#000000";
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "g",
    {
      id: `node-${id}`,
      "data-node-id": id,
      style: { opacity: 1, ...style },
      className: "node-group",
      children: [
        renderShape(shape, x, y, width, height, fill, stroke, strokeWidth),
        renderText(label, subtitle, position.x, position.y, textColor)
      ]
    }
  );
}
function renderShape(shape, x, y, width, height, fill, stroke, strokeWidth) {
  const commonProps = {
    fill,
    stroke,
    strokeWidth
  };
  switch (shape) {
    case "rectangle":
      return /* @__PURE__ */ jsxRuntime.jsx(
        "rect",
        {
          x,
          y,
          width,
          height,
          rx: 4,
          ...commonProps
        }
      );
    case "terminator":
      return /* @__PURE__ */ jsxRuntime.jsx(
        "ellipse",
        {
          cx: x + width / 2,
          cy: y + height / 2,
          rx: width / 2,
          ry: height / 2,
          ...commonProps
        }
      );
    case "diamond":
      const cx = x + width / 2;
      const cy = y + height / 2;
      const points = `
        ${cx},${y}
        ${x + width},${cy}
        ${cx},${y + height}
        ${x},${cy}
      `;
      return /* @__PURE__ */ jsxRuntime.jsx("polygon", { points, ...commonProps });
    case "parallelogram":
      const offset = width * 0.15;
      const paraPoints = `
        ${x + offset},${y}
        ${x + width},${y}
        ${x + width - offset},${y + height}
        ${x},${y + height}
      `;
      return /* @__PURE__ */ jsxRuntime.jsx("polygon", { points: paraPoints, ...commonProps });
    case "database":
      const dbHeight = height * 0.15;
      return /* @__PURE__ */ jsxRuntime.jsxs("g", { children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "ellipse",
          {
            cx: x + width / 2,
            cy: y + dbHeight,
            rx: width / 2,
            ry: dbHeight,
            ...commonProps
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          "rect",
          {
            x,
            y: y + dbHeight,
            width,
            height: height - dbHeight * 2,
            fill,
            stroke: "none"
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          "line",
          {
            x1: x,
            y1: y + dbHeight,
            x2: x,
            y2: y + height - dbHeight,
            stroke,
            strokeWidth
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          "line",
          {
            x1: x + width,
            y1: y + dbHeight,
            x2: x + width,
            y2: y + height - dbHeight,
            stroke,
            strokeWidth
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          "ellipse",
          {
            cx: x + width / 2,
            cy: y + height - dbHeight,
            rx: width / 2,
            ry: dbHeight,
            ...commonProps
          }
        )
      ] });
    case "document":
      const wavePath = `
        M ${x} ${y}
        L ${x + width} ${y}
        L ${x + width} ${y + height - 10}
        Q ${x + width * 0.75} ${y + height - 15}, ${x + width / 2} ${y + height - 10}
        Q ${x + width * 0.25} ${y + height - 5}, ${x} ${y + height - 10}
        Z
      `;
      return /* @__PURE__ */ jsxRuntime.jsx("path", { d: wavePath, ...commonProps });
    default:
      return /* @__PURE__ */ jsxRuntime.jsx(
        "rect",
        {
          x,
          y,
          width,
          height,
          rx: 4,
          ...commonProps
        }
      );
  }
}
function renderText(label, subtitle, cx, cy, color) {
  const lines = [label];
  if (subtitle) {
    lines.push(...subtitle.split("\n"));
  }
  const lineHeight = 20;
  const startY = cy - (lines.length - 1) * lineHeight / 2;
  return /* @__PURE__ */ jsxRuntime.jsx(
    "text",
    {
      x: cx,
      y: startY,
      textAnchor: "middle",
      dominantBaseline: "middle",
      fill: color,
      fontSize: "14",
      fontFamily: "system-ui, sans-serif",
      children: lines.map((line, i) => /* @__PURE__ */ jsxRuntime.jsx("tspan", { x: cx, dy: i === 0 ? 0 : lineHeight, children: line }, i))
    }
  );
}
function EdgeRenderer({ edge, style }) {
  const { id, from, to, label, points, style: edgeStyle } = edge;
  if (!points || points.length < 2) return null;
  const path = calculateEdgePath(points);
  const stroke = "#757575";
  const strokeWidth = edgeStyle === "thick" ? 3 : 2;
  const strokeDasharray = edgeStyle === "dashed" ? "5,5" : void 0;
  const midPoint = points[Math.floor(points.length / 2)];
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "g",
    {
      id: `edge-${id}`,
      "data-edge-id": id,
      "data-from": from,
      "data-to": to,
      style: { opacity: 0, ...style },
      className: "edge-group",
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "path",
          {
            className: "edge-path",
            d: path,
            fill: "none",
            stroke,
            strokeWidth,
            strokeDasharray
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          "path",
          {
            className: "edge-arrow",
            d: path,
            fill: "none",
            stroke: "none",
            strokeWidth,
            markerEnd: "url(#arrowhead)",
            opacity: "0"
          }
        ),
        label && /* @__PURE__ */ jsxRuntime.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            "rect",
            {
              x: midPoint.x - 30,
              y: midPoint.y - 12,
              width: 60,
              height: 24,
              fill: "white",
              stroke: "#e0e0e0",
              rx: 4
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            "text",
            {
              x: midPoint.x,
              y: midPoint.y,
              textAnchor: "middle",
              dominantBaseline: "middle",
              fill: "#424242",
              fontSize: "12",
              fontFamily: "system-ui, sans-serif",
              children: label
            }
          )
        ] })
      ]
    }
  );
}
function ArrowMarkerDef() {
  return /* @__PURE__ */ jsxRuntime.jsx("defs", { children: /* @__PURE__ */ jsxRuntime.jsx(
    "marker",
    {
      id: "arrowhead",
      markerWidth: "5",
      markerHeight: "5",
      refX: "4",
      refY: "1.5",
      orient: "auto",
      markerUnits: "strokeWidth",
      children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M0,0 L0,3 L4,1.5 z", fill: "#757575" })
    }
  ) });
}
function RoughNodeRenderer({ node, style }) {
  const { id, shape, label, subtitle, position, width, height } = node;
  const groupRef = React4.useRef(null);
  if (!position || !width || !height) return null;
  const x = position.x - width / 2;
  const y = position.y - height / 2;
  const fill = node.style?.fill || "#e3f2fd";
  const stroke = node.style?.stroke || "#2196F3";
  const strokeWidth = node.style?.strokeWidth || 2;
  const textColor = node.style?.color || "#000000";
  React4.useEffect(() => {
    if (!groupRef.current) return;
    const svg = groupRef.current.closest("svg");
    if (!svg) return;
    const rc = rough__default.default.svg(svg);
    const roughOptions = {
      roughness: 0.8,
      bowing: 0.5,
      stroke,
      strokeWidth,
      fill,
      fillStyle: "hachure",
      fillWeight: 0.5,
      hachureAngle: -41,
      hachureGap: 4
    };
    const existingRough = groupRef.current.querySelector(".rough-shape");
    if (existingRough) {
      existingRough.remove();
    }
    let roughElement = null;
    switch (shape) {
      case "rectangle":
        roughElement = rc.rectangle(x, y, width, height, {
          ...roughOptions,
          bowing: 0.3
        });
        break;
      case "terminator":
        roughElement = rc.ellipse(
          x + width / 2,
          y + height / 2,
          width,
          height,
          roughOptions
        );
        break;
      case "diamond": {
        const cx = x + width / 2;
        const cy = y + height / 2;
        const points = [
          [cx, y],
          [x + width, cy],
          [cx, y + height],
          [x, cy]
        ];
        roughElement = rc.polygon(points, roughOptions);
        break;
      }
      case "parallelogram": {
        const offset = width * 0.15;
        const points = [
          [x + offset, y],
          [x + width, y],
          [x + width - offset, y + height],
          [x, y + height]
        ];
        roughElement = rc.polygon(points, roughOptions);
        break;
      }
      case "database": {
        const dbHeight = height * 0.15;
        const dbGroup = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g"
        );
        dbGroup.classList.add("rough-shape");
        const topEllipse = rc.ellipse(
          x + width / 2,
          y + dbHeight,
          width,
          dbHeight * 2,
          roughOptions
        );
        dbGroup.appendChild(topEllipse);
        const leftLine = rc.line(
          x,
          y + dbHeight,
          x,
          y + height - dbHeight,
          roughOptions
        );
        dbGroup.appendChild(leftLine);
        const rightLine = rc.line(
          x + width,
          y + dbHeight,
          x + width,
          y + height - dbHeight,
          roughOptions
        );
        dbGroup.appendChild(rightLine);
        const bottomEllipse = rc.ellipse(
          x + width / 2,
          y + height - dbHeight,
          width,
          dbHeight * 2,
          roughOptions
        );
        dbGroup.appendChild(bottomEllipse);
        roughElement = dbGroup;
        break;
      }
      case "document": {
        const wavePath = `
          M ${x} ${y}
          L ${x + width} ${y}
          L ${x + width} ${y + height - 10}
          Q ${x + width * 0.75} ${y + height - 15}, ${x + width / 2} ${y + height - 10}
          Q ${x + width * 0.25} ${y + height - 5}, ${x} ${y + height - 10}
          Z
        `;
        roughElement = rc.path(wavePath, roughOptions);
        break;
      }
      default:
        roughElement = rc.rectangle(x, y, width, height, roughOptions);
    }
    if (roughElement) {
      roughElement.classList.add("rough-shape");
      groupRef.current.insertBefore(roughElement, groupRef.current.firstChild);
    }
    return () => {
      if (roughElement && roughElement.parentNode) {
        roughElement.remove();
      }
    };
  }, [shape, x, y, width, height, fill, stroke, strokeWidth]);
  return /* @__PURE__ */ jsxRuntime.jsx(
    "g",
    {
      ref: groupRef,
      id: `node-${id}`,
      "data-node-id": id,
      style: { opacity: 1, ...style },
      className: "node-group",
      children: renderText2(label, subtitle, position.x, position.y, textColor)
    }
  );
}
function renderText2(label, subtitle, cx, cy, color) {
  const lines = [label];
  if (subtitle) {
    lines.push(...subtitle.split("\n"));
  }
  const lineHeight = 20;
  const startY = cy - (lines.length - 1) * lineHeight / 2;
  return /* @__PURE__ */ jsxRuntime.jsx(
    "text",
    {
      x: cx,
      y: startY,
      textAnchor: "middle",
      dominantBaseline: "middle",
      fill: color,
      fontSize: "15",
      fontFamily: "Comic Neue, Comic Sans MS, cursive",
      fontWeight: "400",
      children: lines.map((line, i) => /* @__PURE__ */ jsxRuntime.jsx("tspan", { x: cx, dy: i === 0 ? 0 : lineHeight, children: line }, i))
    }
  );
}
function RoughEdgeRenderer({ edge, style }) {
  const { id, from, to, label, points, style: edgeStyle } = edge;
  if (!points || points.length < 2) return null;
  const path = calculateEdgePath(points);
  const stroke = "#757575";
  const strokeWidth = edgeStyle === "thick" ? 3 : 2;
  const midPoint = points[Math.floor(points.length / 2)];
  const arrowData = React4.useMemo(() => {
    if (!points || points.length < 2) {
      return { points: [], valid: false };
    }
    const lastPoint = points[points.length - 1];
    const secondLastPoint = points[points.length - 2];
    if (!lastPoint || !secondLastPoint || typeof lastPoint.x !== "number" || typeof lastPoint.y !== "number" || typeof secondLastPoint.x !== "number" || typeof secondLastPoint.y !== "number" || isNaN(lastPoint.x) || isNaN(lastPoint.y) || isNaN(secondLastPoint.x) || isNaN(secondLastPoint.y)) {
      return { points: [], valid: false };
    }
    const angle = Math.atan2(
      lastPoint.y - secondLastPoint.y,
      lastPoint.x - secondLastPoint.x
    );
    const arrowLength = 10;
    const arrowWidth = 6;
    const arrowPoints = [
      [lastPoint.x, lastPoint.y],
      [
        lastPoint.x - arrowLength * Math.cos(angle) - arrowWidth * Math.sin(angle),
        lastPoint.y - arrowLength * Math.sin(angle) + arrowWidth * Math.cos(angle)
      ],
      [
        lastPoint.x - arrowLength * Math.cos(angle) + arrowWidth * Math.sin(angle),
        lastPoint.y - arrowLength * Math.sin(angle) - arrowWidth * Math.cos(angle)
      ]
    ];
    const allValid = arrowPoints.every(
      (pt) => pt.length === 2 && typeof pt[0] === "number" && typeof pt[1] === "number" && !isNaN(pt[0]) && !isNaN(pt[1])
    );
    return {
      points: allValid ? arrowPoints : [],
      valid: allValid
    };
  }, [points]);
  const roughPaths = React4.useMemo(() => {
    if (!path || path === "" || typeof path !== "string" || path.includes("NaN")) {
      return { pathOps: [], arrowOps: [] };
    }
    if (!arrowData.valid || arrowData.points.length === 0) {
      return { pathOps: [], arrowOps: [] };
    }
    try {
      const generator = rough2__default.default.generator();
      const roughOptions = {
        roughness: 0.6,
        bowing: 0.3,
        stroke,
        strokeWidth,
        disableMultiStroke: edgeStyle === "dashed",
        strokeLineDash: edgeStyle === "dashed" ? [8, 8] : void 0
      };
      const roughPathDrawable = generator.path(path, roughOptions);
      const roughArrowDrawable = generator.polygon(arrowData.points, {
        roughness: 0.6,
        bowing: 0.3,
        stroke,
        strokeWidth: 1,
        fill: stroke,
        fillStyle: "solid"
      });
      return {
        pathOps: roughPathDrawable.sets || [],
        arrowOps: roughArrowDrawable.sets || []
      };
    } catch (error) {
      console.error("Error generating rough paths:", error, { path, arrowData });
      return { pathOps: [], arrowOps: [] };
    }
  }, [path, stroke, strokeWidth, edgeStyle, arrowData]);
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "g",
    {
      id: `edge-${id}`,
      "data-edge-id": id,
      "data-from": from,
      "data-to": to,
      style: { opacity: 0, ...style },
      className: "edge-group",
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "path",
          {
            className: "edge-path",
            d: path,
            fill: "none",
            stroke: "none",
            opacity: 0,
            pointerEvents: "none"
          }
        ),
        roughPaths.pathOps.length > 0 && /* @__PURE__ */ jsxRuntime.jsx("g", { className: "rough-path-container", style: { opacity: 0 }, children: roughPaths.pathOps.map((set, i) => /* @__PURE__ */ jsxRuntime.jsx(
          "path",
          {
            d: opsToPath(set),
            stroke,
            strokeWidth,
            fill: "none",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          },
          `path-${i}`
        )) }),
        roughPaths.arrowOps.length > 0 && /* @__PURE__ */ jsxRuntime.jsx("g", { className: "rough-arrow-overlay", style: { opacity: 0 }, children: roughPaths.arrowOps.map((set, i) => /* @__PURE__ */ jsxRuntime.jsx(
          "path",
          {
            d: opsToPath(set),
            stroke: set.type === "fillPath" ? "none" : stroke,
            fill: set.type === "fillPath" ? stroke : "none",
            strokeWidth: 1,
            strokeLinecap: "round",
            strokeLinejoin: "round"
          },
          `arrow-${i}`
        )) }),
        label && /* @__PURE__ */ jsxRuntime.jsxs("g", { children: [
          /* @__PURE__ */ jsxRuntime.jsx(
            "rect",
            {
              x: midPoint.x - 30,
              y: midPoint.y - 12,
              width: 60,
              height: 24,
              fill: "white",
              stroke: "#e0e0e0",
              strokeWidth: 1,
              rx: 4,
              opacity: 0.9
            }
          ),
          /* @__PURE__ */ jsxRuntime.jsx(
            "text",
            {
              x: midPoint.x,
              y: midPoint.y,
              textAnchor: "middle",
              dominantBaseline: "middle",
              fill: "#424242",
              fontSize: "13",
              fontFamily: "Comic Neue, Comic Sans MS, cursive",
              fontWeight: "400",
              children: label
            }
          )
        ] })
      ]
    }
  );
}
function opsToPath(set) {
  const ops = set.ops;
  let pathData = "";
  for (const op of ops) {
    const data = op.data;
    switch (op.op) {
      case "move":
        pathData += `M ${data[0]} ${data[1]} `;
        break;
      case "bcurveTo":
        pathData += `C ${data[0]} ${data[1]}, ${data[2]} ${data[3]}, ${data[4]} ${data[5]} `;
        break;
      case "lineTo":
        pathData += `L ${data[0]} ${data[1]} `;
        break;
    }
  }
  return pathData;
}
function DiagramRenderer({
  data,
  onReady,
  renderMode = "clean",
  zoom = 1,
  pan = { x: 0, y: 0 }
}) {
  const svgRef = React4.useRef(null);
  React4.useEffect(() => {
    if (svgRef.current && onReady) {
      onReady(svgRef.current);
    }
  }, [data, onReady]);
  const bounds = React4.useMemo(() => calculateDiagramBounds(data), [data]);
  const viewBox = React4.useMemo(
    () => calculateViewBox(bounds, zoom, pan),
    [bounds, zoom, pan]
  );
  const background = renderMode === "sketchy" ? "#faf9f6" : data.config.background || "#ffffff";
  const edgesLayer = React4.useMemo(
    () => data.edges.map(
      (edge) => renderMode === "clean" ? /* @__PURE__ */ jsxRuntime.jsx(EdgeRenderer, { edge }, edge.id) : /* @__PURE__ */ jsxRuntime.jsx(RoughEdgeRenderer, { edge }, edge.id)
    ),
    [data.edges, renderMode]
  );
  const nodesLayer = React4.useMemo(
    () => data.nodes.map(
      (node) => renderMode === "clean" ? /* @__PURE__ */ jsxRuntime.jsx(NodeRenderer, { node }, node.id) : /* @__PURE__ */ jsxRuntime.jsx(RoughNodeRenderer, { node }, node.id)
    ),
    [data.nodes, renderMode]
  );
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "svg",
    {
      ref: svgRef,
      className: "diagram-svg w-full h-full",
      viewBox,
      xmlns: "http://www.w3.org/2000/svg",
      style: { background },
      children: [
        renderMode === "clean" && /* @__PURE__ */ jsxRuntime.jsx(ArrowMarkerDef, {}),
        /* @__PURE__ */ jsxRuntime.jsx("g", { className: "edges-layer", children: edgesLayer }),
        /* @__PURE__ */ jsxRuntime.jsx("g", { className: "nodes-layer", children: nodesLayer })
      ]
    }
  );
}
function calculateDiagramBounds(data) {
  const nodes = data.nodes;
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, width: 800, height: 600 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    if (!node.position || !node.width || !node.height) continue;
    const x1 = node.position.x - node.width / 2;
    const y1 = node.position.y - node.height / 2;
    const x2 = node.position.x + node.width / 2;
    const y2 = node.position.y + node.height / 2;
    minX = Math.min(minX, x1);
    minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2);
    maxY = Math.max(maxY, y2);
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return { minX: 0, minY: 0, width: 800, height: 600 };
  }
  const padding = 50;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;
  const width = maxX - minX;
  const height = maxY - minY;
  return { minX, minY, width, height };
}
function calculateViewBox(bounds, zoom = 1, pan = { x: 0, y: 0 }) {
  const { minX, minY, width, height } = bounds;
  const safeZoom = Math.max(0.5, Math.min(2, zoom));
  const centerX = minX + width / 2;
  const centerY = minY + height / 2;
  const zoomedWidth = width / safeZoom;
  const zoomedHeight = height / safeZoom;
  const zoomedMinX = centerX - zoomedWidth / 2;
  const zoomedMinY = centerY - zoomedHeight / 2;
  const panX = Number.isFinite(pan.x) ? pan.x : 0;
  const panY = Number.isFinite(pan.y) ? pan.y : 0;
  const pannedMinX = zoomedMinX - panX;
  const pannedMinY = zoomedMinY - panY;
  return `${pannedMinX} ${pannedMinY} ${zoomedWidth} ${zoomedHeight}`;
}
function NarrationOverlay({ narration }) {
  if (!narration) return null;
  return /* @__PURE__ */ jsxRuntime.jsx("div", { className: "relative border-t border-gray-200 bg-gray-50/95 px-4 py-3", children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "mx-auto max-w-5xl", children: [
    /* @__PURE__ */ jsxRuntime.jsx("h3", { className: "text-base font-semibold text-gray-900 mb-1", children: narration.title }),
    /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-gray-700 leading-relaxed", children: narration.text })
  ] }) });
}
var useDiagramStore = zustand.create((set) => ({
  // Initial state
  diagramData: null,
  isPlaying: false,
  currentStep: 0,
  currentTime: 0,
  duration: 0,
  speed: 1,
  currentNarration: null,
  renderMode: "sketchy",
  // 손그림 모드가 기본
  // Actions
  setDiagramData: (data) => set({ diagramData: data }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setSpeed: (speed) => set({ speed }),
  setCurrentNarration: (narration) => set({ currentNarration: narration }),
  setRenderMode: (mode) => set({ renderMode: mode })
}));
function PlaybackControls({
  onPlay,
  onPause,
  onSpeedChange,
  onSeekToTime,
  stepBoundaries,
  stepDetails = {}
}) {
  const { isPlaying, currentTime, duration, speed } = useDiagramStore();
  const progressBarRef = React4__default.default.useRef(null);
  const [hoverPercent, setHoverPercent] = React4__default.default.useState(null);
  const [hoverSegmentStep, setHoverSegmentStep] = React4__default.default.useState(null);
  const [hoverTooltipX, setHoverTooltipX] = React4__default.default.useState(null);
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };
  const progress = duration > 0 ? currentTime / duration * 100 : 0;
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const isHoveringBar = hoverPercent !== null;
  const previewStart = Math.min(clampedProgress, hoverPercent ?? clampedProgress);
  const previewEnd = Math.max(clampedProgress, hoverPercent ?? clampedProgress);
  const previewWidth = Math.max(0, previewEnd - previewStart);
  const handleBarMouseMove = (e) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, x / rect.width * 100));
    setHoverPercent(percent);
  };
  const handleBarMouseLeave = () => {
    setHoverPercent(null);
    setHoverSegmentStep(null);
    setHoverTooltipX(null);
  };
  return /* @__PURE__ */ jsxRuntime.jsx("div", { className: "bg-white border-t border-gray-200 p-4", children: /* @__PURE__ */ jsxRuntime.jsx("div", { className: "max-w-5xl mx-auto space-y-3", children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-3", children: [
    !isPlaying ? /* @__PURE__ */ jsxRuntime.jsx(
      "button",
      {
        onClick: onPlay,
        className: "shrink-0 p-2 rounded-full text-gray-900 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors",
        title: "\uC7AC\uC0DD",
        "aria-label": "\uC7AC\uC0DD",
        children: /* @__PURE__ */ jsxRuntime.jsx("svg", { className: "w-6 h-6", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M8 5v14l11-7z" }) })
      }
    ) : /* @__PURE__ */ jsxRuntime.jsx(
      "button",
      {
        onClick: onPause,
        className: "shrink-0 p-2 rounded-full text-gray-900 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors",
        title: "\uC77C\uC2DC\uC815\uC9C0",
        "aria-label": "\uC77C\uC2DC\uC815\uC9C0",
        children: /* @__PURE__ */ jsxRuntime.jsx("svg", { className: "w-6 h-6", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M6 4h4v16H6V4zm8 0h4v16h-4V4z" }) })
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "relative flex-1", children: [
      hoverSegmentStep !== null && hoverTooltipX !== null && (stepDetails[hoverSegmentStep]?.title || stepDetails[hoverSegmentStep]?.text) && /* @__PURE__ */ jsxRuntime.jsxs(
        "div",
        {
          className: "pointer-events-none absolute -top-16 z-40 max-w-xs -translate-x-1/2 rounded-md bg-gray-900 px-3 py-2 text-xs text-white shadow-lg",
          style: { left: `${hoverTooltipX}px` },
          children: [
            stepDetails[hoverSegmentStep]?.title && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "font-semibold", children: stepDetails[hoverSegmentStep]?.title }),
            stepDetails[hoverSegmentStep]?.text && /* @__PURE__ */ jsxRuntime.jsx("div", { className: "mt-1 line-clamp-2 text-gray-200", children: stepDetails[hoverSegmentStep]?.text })
          ]
        }
      ),
      stepBoundaries.length > 0 ? /* @__PURE__ */ jsxRuntime.jsxs(
        "div",
        {
          ref: progressBarRef,
          className: "relative h-3 rounded-full bg-gray-200 p-[1px] transition-all duration-150 hover:h-4",
          onMouseMove: handleBarMouseMove,
          onMouseLeave: handleBarMouseLeave,
          children: [
            isHoveringBar && previewWidth > 0 && /* @__PURE__ */ jsxRuntime.jsx(
              "div",
              {
                className: "pointer-events-none absolute top-[1px] bottom-[1px] rounded bg-gray-400/50 z-20",
                style: {
                  left: `${previewStart}%`,
                  width: `${previewWidth}%`
                }
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsx("div", { className: "h-full w-full flex gap-[2px]", children: stepBoundaries.map((segment, index) => {
              const segmentDuration = Math.max(
                1e-3,
                segment.end - segment.start
              );
              const playedRatio = Math.max(
                0,
                Math.min(
                  1,
                  (currentTime - segment.start) / Math.max(1e-3, segmentDuration)
                )
              );
              return /* @__PURE__ */ jsxRuntime.jsx(
                "button",
                {
                  onClick: () => onSeekToTime(segment.start),
                  onMouseEnter: (e) => {
                    setHoverSegmentStep(segment.step);
                    if (progressBarRef.current) {
                      const barRect = progressBarRef.current.getBoundingClientRect();
                      const targetRect = e.currentTarget.getBoundingClientRect();
                      setHoverTooltipX(targetRect.left - barRect.left + targetRect.width / 2);
                    }
                  },
                  className: `relative h-full min-w-[10px] rounded-[2px] bg-gray-300/90 transition-all duration-150 origin-center overflow-hidden border border-white/90 ${hoverSegmentStep === segment.step ? "scale-y-125" : ""}`,
                  style: { flexGrow: segmentDuration },
                  title: stepDetails[segment.step]?.title ? `${stepDetails[segment.step]?.title}\uB85C \uC774\uB3D9` : `step ${segment.step}\uB85C \uC774\uB3D9`,
                  "aria-label": stepDetails[segment.step]?.title ? `${stepDetails[segment.step]?.title}\uB85C \uC774\uB3D9` : `step ${segment.step}\uB85C \uC774\uB3D9`,
                  children: /* @__PURE__ */ jsxRuntime.jsx(
                    "div",
                    {
                      className: "h-full bg-primary transition-[width] duration-100 ease-linear",
                      style: { width: `${playedRatio * 100}%` }
                    }
                  )
                },
                `${segment.step}-${index}`
              );
            }) }),
            /* @__PURE__ */ jsxRuntime.jsx(
              "div",
              {
                className: "pointer-events-none absolute top-1/2 z-30 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white border-2 border-primary shadow transition-all duration-100 ease-linear",
                style: {
                  left: `calc(${clampedProgress}% - 7px)`
                }
              }
            )
          ]
        }
      ) : /* @__PURE__ */ jsxRuntime.jsxs(
        "div",
        {
          ref: progressBarRef,
          className: "relative h-3 rounded-full bg-gray-200 overflow-hidden transition-all duration-150 hover:h-4",
          onMouseMove: handleBarMouseMove,
          onMouseLeave: handleBarMouseLeave,
          children: [
            /* @__PURE__ */ jsxRuntime.jsx(
              "div",
              {
                className: "h-full bg-primary transition-all duration-200",
                style: { width: `${clampedProgress}%` }
              }
            ),
            isHoveringBar && previewWidth > 0 && /* @__PURE__ */ jsxRuntime.jsx(
              "div",
              {
                className: "pointer-events-none absolute top-0 bottom-0 rounded bg-gray-400/50 z-20",
                style: {
                  left: `${previewStart}%`,
                  width: `${previewWidth}%`
                }
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsx(
              "div",
              {
                className: "pointer-events-none absolute top-1/2 z-30 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white border-2 border-primary shadow transition-all duration-100 ease-linear",
                style: {
                  left: `calc(${clampedProgress}% - 7px)`
                }
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex justify-between text-[11px] text-gray-500 mt-1", children: [
        /* @__PURE__ */ jsxRuntime.jsx("span", { children: formatTime(currentTime) }),
        /* @__PURE__ */ jsxRuntime.jsx("span", { children: formatTime(duration) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-2 ml-1", children: [
      /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-xs text-gray-600", children: "\uC18D\uB3C4" }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "flex gap-1", children: [0.5, 1, 1.5, 2].map((s) => /* @__PURE__ */ jsxRuntime.jsxs(
        "button",
        {
          onClick: () => onSpeedChange(s),
          className: `px-2.5 py-1 rounded-md text-xs transition-colors ${speed === s ? "bg-primary text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`,
          children: [
            s,
            "x"
          ]
        },
        s
      )) })
    ] })
  ] }) }) });
}
var AnimflowPlayer = React4.forwardRef(
  function AnimflowPlayer2({
    dsl,
    mode = "sketchy",
    autoplay = false,
    controls = true,
    narration = true,
    className = "",
    onError,
    onReady
  }, ref) {
    const svgRef = React4.useRef(null);
    const panStartRef = React4.useRef(null);
    const timelineRef = React4.useRef(null);
    const intervalRef = React4.useRef(null);
    const isDraggingRef = React4.useRef(false);
    const panRafRef = React4.useRef(null);
    const pendingPanRef = React4.useRef(null);
    const [error, setError] = React4.useState(null);
    const [localDiagramData, setLocalDiagramData] = React4.useState(null);
    const [zoomLevel, setZoomLevel] = React4.useState(1);
    const [panOffset, setPanOffset] = React4.useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = React4.useState(false);
    const [stepBoundaries, setStepBoundaries] = React4.useState([]);
    const narrationStepDetails = React4.useMemo(() => {
      if (!localDiagramData) return {};
      const details = {};
      for (const narration2 of localDiagramData.narrations) {
        const title = typeof narration2.title === "string" && narration2.title.trim().length > 0 ? narration2.title.trim() : void 0;
        const text = typeof narration2.text === "string" && narration2.text.trim().length > 0 ? narration2.text.trim() : void 0;
        if (title || text) {
          details[narration2.step] = { title, text };
        }
      }
      return details;
    }, [localDiagramData]);
    const narrationBoundaries = React4.useMemo(() => {
      if (!localDiagramData || stepBoundaries.length === 0) return stepBoundaries;
      const sortedNarrationSteps = Array.from(
        new Set(localDiagramData.narrations.map((n) => n.step))
      ).sort((a, b) => a - b).filter((step) => stepBoundaries.some((b) => b.step === step));
      if (sortedNarrationSteps.length === 0) {
        return stepBoundaries;
      }
      const segments = [];
      const lastTimelineEnd = stepBoundaries[stepBoundaries.length - 1]?.end ?? 0;
      for (let i = 0; i < sortedNarrationSteps.length; i += 1) {
        const step = sortedNarrationSteps[i];
        const current = stepBoundaries.find((b) => b.step === step);
        if (!current) continue;
        const nextNarrationStep = sortedNarrationSteps[i + 1];
        const next = nextNarrationStep ? stepBoundaries.find((b) => b.step === nextNarrationStep) : void 0;
        const start = current.start;
        const end = next?.start ?? lastTimelineEnd;
        segments.push({
          step,
          start,
          end: end > start ? end : current.end
        });
      }
      return segments.length > 0 ? segments : stepBoundaries;
    }, [localDiagramData, stepBoundaries]);
    const {
      setDuration,
      setCurrentTime,
      setCurrentStep,
      setIsPlaying,
      currentNarration,
      setCurrentNarration,
      renderMode,
      setRenderMode
    } = useDiagramStore();
    React4.useEffect(() => {
      setRenderMode(mode);
    }, [mode, setRenderMode]);
    React4.useEffect(() => {
      if (!dsl.trim()) {
        setLocalDiagramData(null);
        setError(null);
        return;
      }
      try {
        const parseResult = parseDsl(dsl);
        if (!parseResult.success || !parseResult.data) {
          const errorMsg = "DSL \uD30C\uC2F1 \uC2E4\uD328";
          setError(errorMsg);
          onError?.(errorMsg);
          return;
        }
        let data = parseResult.data;
        const { nodes, edges } = calculateFlowchartLayout(
          data.nodes,
          data.edges,
          data.metadata.direction
        );
        data = {
          ...data,
          nodes,
          edges,
          config: {
            ...data.config,
            autoplay: autoplay ?? data.config.autoplay,
            controls: controls ?? data.config.controls,
            narration: narration ?? data.config.narration
          }
        };
        setLocalDiagramData(data);
        setError(null);
        onReady?.(data);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958";
        setError(errorMsg);
        onError?.(errorMsg);
      }
    }, [dsl, autoplay, controls, narration, onError, onReady]);
    React4.useEffect(() => {
      if (!svgRef.current || !localDiagramData) return;
      if (timelineRef.current) {
        timelineRef.current.pause();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (!svgRef.current) return;
      const timeline = new AnimationTimeline(localDiagramData, {
        onStepChange: (step) => {
          setCurrentStep(step);
          const narrationForStep = localDiagramData.narrations.find((n) => n.step === step) || null;
          if (narrationForStep) {
            setCurrentNarration(narrationForStep);
          }
        }
      });
      timeline.buildTimeline(svgRef.current);
      timelineRef.current = timeline;
      setStepBoundaries(timeline.getStepBoundaries());
      setDuration(timeline.getDuration());
      if (localDiagramData.config.autoplay) {
        timeline.play();
        setIsPlaying(true);
      }
      intervalRef.current = setInterval(() => {
        if (timelineRef.current) {
          if (isDraggingRef.current) return;
          const time = timelineRef.current.getCurrentTime();
          const duration = timelineRef.current.getDuration();
          setCurrentTime(time);
          if (duration > 0 && time >= duration - 0.01 && !timelineRef.current.isPlaying()) {
            setIsPlaying(false);
          }
        }
      }, 33);
      if (localDiagramData.narrations.length > 0) {
        setCurrentNarration(localDiagramData.narrations[0]);
      }
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, [
      localDiagramData,
      renderMode,
      setDuration,
      setCurrentTime,
      setCurrentStep,
      setIsPlaying,
      setCurrentNarration
    ]);
    React4.useEffect(() => {
      return () => {
        if (panRafRef.current !== null) {
          window.cancelAnimationFrame(panRafRef.current);
          panRafRef.current = null;
        }
      };
    }, []);
    const handleSvgReady = React4.useCallback((svg) => {
      svgRef.current = svg;
    }, []);
    const handlePlay = React4.useCallback(() => {
      if (timelineRef.current) {
        const current = timelineRef.current.getCurrentTime();
        const duration = timelineRef.current.getDuration();
        const isAtEnd = duration > 0 && current >= duration - 0.01;
        if (isAtEnd) {
          timelineRef.current.restart();
        }
        timelineRef.current.play();
        setIsPlaying(true);
      }
    }, [setIsPlaying]);
    const handlePause = React4.useCallback(() => {
      if (timelineRef.current) {
        timelineRef.current.pause();
        setIsPlaying(false);
      }
    }, [setIsPlaying]);
    const handleStop = React4.useCallback(() => {
      if (timelineRef.current) {
        timelineRef.current.stop();
        setIsPlaying(false);
        setCurrentTime(0);
      }
    }, [setIsPlaying, setCurrentTime]);
    const handleSpeedChange = React4.useCallback((speed) => {
      if (timelineRef.current) {
        timelineRef.current.setSpeed(speed);
      }
    }, []);
    const handleSeekToTime = React4.useCallback((time) => {
      if (!timelineRef.current || !localDiagramData) return;
      timelineRef.current.seek(time);
      setCurrentTime(time);
      const matched = stepBoundaries.find((b) => time >= b.start && time <= b.end) || stepBoundaries.find((b) => time < b.start) || null;
      if (matched) {
        setCurrentStep(matched.step);
        const narrationForStep = localDiagramData.narrations.find((n) => n.step === matched.step) || null;
        if (narrationForStep) {
          setCurrentNarration(narrationForStep);
        }
      }
    }, [localDiagramData, stepBoundaries, setCurrentTime, setCurrentStep, setCurrentNarration]);
    const handleZoomIn = React4.useCallback(() => {
      setZoomLevel((prev) => Math.min(2, Number((prev + 0.1).toFixed(1))));
    }, []);
    const handleZoomOut = React4.useCallback(() => {
      setZoomLevel((prev) => Math.max(0.5, Number((prev - 0.1).toFixed(1))));
    }, []);
    const handleZoomReset = React4.useCallback(() => {
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
    }, []);
    const handlePointerDown = React4.useCallback((e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      isDraggingRef.current = true;
      setIsDragging(true);
      panStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        panX: panOffset.x,
        panY: panOffset.y
      };
    }, [panOffset]);
    const handlePointerMove = React4.useCallback((e) => {
      if (!isDraggingRef.current || !panStartRef.current) return;
      e.preventDefault();
      const safeZoom = Math.max(0.5, Math.min(2, zoomLevel));
      const dx = e.clientX - panStartRef.current.clientX;
      const dy = e.clientY - panStartRef.current.clientY;
      const nextPan = {
        x: panStartRef.current.panX + dx / safeZoom,
        y: panStartRef.current.panY + dy / safeZoom
      };
      pendingPanRef.current = nextPan;
      if (panRafRef.current === null) {
        panRafRef.current = window.requestAnimationFrame(() => {
          if (pendingPanRef.current) {
            setPanOffset(pendingPanRef.current);
          }
          panRafRef.current = null;
        });
      }
    }, [zoomLevel]);
    const handlePointerUp = React4.useCallback(() => {
      if (pendingPanRef.current) {
        setPanOffset(pendingPanRef.current);
        pendingPanRef.current = null;
      }
      if (panRafRef.current !== null) {
        window.cancelAnimationFrame(panRafRef.current);
        panRafRef.current = null;
      }
      isDraggingRef.current = false;
      if (timelineRef.current) {
        setCurrentTime(timelineRef.current.getCurrentTime());
      }
      setIsDragging(false);
      panStartRef.current = null;
    }, [setCurrentTime]);
    React4.useImperativeHandle(ref, () => ({
      play: handlePlay,
      pause: handlePause,
      stop: handleStop,
      seek: handleSeekToTime,
      setSpeed: handleSpeedChange,
      restart: () => {
        if (timelineRef.current) {
          timelineRef.current.restart();
          setIsPlaying(true);
        }
      },
      getCurrentTime: () => timelineRef.current?.getCurrentTime() ?? 0,
      getDuration: () => timelineRef.current?.getDuration() ?? 0,
      isPlaying: () => timelineRef.current?.isPlaying() ?? false
    }), [handlePlay, handlePause, handleStop, handleSeekToTime, handleSpeedChange, setIsPlaying]);
    if (error) {
      return /* @__PURE__ */ jsxRuntime.jsx("div", { className: `flex items-center justify-center h-full bg-red-50 ${className}`, children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-red-600 font-semibold mb-2", children: "\uC624\uB958 \uBC1C\uC0DD" }),
        /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-gray-600", children: error })
      ] }) });
    }
    if (!localDiagramData) {
      return /* @__PURE__ */ jsxRuntime.jsx("div", { className: `flex items-center justify-center h-full bg-gray-50 ${className}`, children: /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-gray-400", children: "\uB85C\uB529 \uC911..." }) });
    }
    const canvasBackground = renderMode === "sketchy" ? "#faf9f6" : localDiagramData.config.background || "#ffffff";
    return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: `relative h-full flex flex-col ${className}`, children: [
      /* @__PURE__ */ jsxRuntime.jsx("div", { className: "absolute top-4 left-4 z-10 flex flex-col gap-2", children: /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "button",
          {
            onClick: handleZoomOut,
            className: "px-3 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-md text-sm font-medium",
            title: "\uCD95\uC18C",
            children: "-"
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          "button",
          {
            onClick: handleZoomIn,
            className: "px-3 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-md text-sm font-medium",
            title: "\uD655\uB300",
            children: "+"
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsxs(
          "button",
          {
            onClick: handleZoomReset,
            className: "px-3 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-md text-sm font-medium",
            title: "\uC6D0\uB798 \uD06C\uAE30",
            children: [
              Math.round(zoomLevel * 100),
              "%"
            ]
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxRuntime.jsx(
        "div",
        {
          className: `flex-1 overflow-hidden select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`,
          style: { background: canvasBackground },
          onMouseDown: handlePointerDown,
          onMouseMove: handlePointerMove,
          onMouseUp: handlePointerUp,
          onMouseLeave: handlePointerUp,
          onDragStart: (e) => e.preventDefault(),
          children: /* @__PURE__ */ jsxRuntime.jsx(
            DiagramRenderer,
            {
              data: localDiagramData,
              onReady: handleSvgReady,
              renderMode,
              zoom: zoomLevel,
              pan: panOffset
            }
          )
        }
      ),
      localDiagramData.config.narration !== false && narration && /* @__PURE__ */ jsxRuntime.jsx(NarrationOverlay, { narration: currentNarration }),
      localDiagramData.config.controls !== false && controls && /* @__PURE__ */ jsxRuntime.jsx(
        PlaybackControls,
        {
          onPlay: handlePlay,
          onPause: handlePause,
          onSpeedChange: handleSpeedChange,
          onSeekToTime: handleSeekToTime,
          stepBoundaries: narrationBoundaries,
          stepDetails: narrationStepDetails
        }
      )
    ] });
  }
);

exports.AnimflowPlayer = AnimflowPlayer;
exports.DiagramRenderer = DiagramRenderer;
exports.calculateFlowchartLayout = calculateFlowchartLayout;
exports.parseDsl = parseDsl;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map