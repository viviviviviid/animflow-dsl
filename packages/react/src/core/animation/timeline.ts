import gsap from "gsap";
import type { DiagramData, AnimationStep } from "../types";
import {
  applyEntranceEffect,
  applyExitEffect,
  applyGlowEffect,
  removeGlowEffect,
  applyEmphasisEffect,
} from "./effects";
import { animateEdgeFlow } from "./flow-effects";
import { animateCamera } from "./camera";

interface AnimationTimelineOptions {
  onStepChange?: (step: number) => void;
  /** Fires once all tweens in a step have finished (just before the next step starts). */
  onStepComplete?: (step: number) => void;
}

/**
 * Animation Timeline Manager
 */
export class AnimationTimeline {
  private timeline: gsap.core.Timeline;
  private svgElement: SVGSVGElement | null = null;
  private data: DiagramData;
  private onStepChange?: (step: number) => void;
  private onStepComplete?: (step: number) => void;
  private stepBoundaries: { step: number; start: number; end: number }[] = [];
  /** Original fill colors per node, saved before highlight overwrites them */
  private originalFills = new Map<string, string>();

  constructor(data: DiagramData, options?: AnimationTimelineOptions) {
    this.data = data;
    this.onStepChange = options?.onStepChange;
    this.onStepComplete = options?.onStepComplete;
    this.timeline = gsap.timeline({
      paused: true,
      onUpdate: () => this.onTimelineUpdate(),
    });
  }

  /**
   * Build timeline from animation steps
   */
  buildTimeline(svgElement: SVGSVGElement): void {
    this.svgElement = svgElement;
    this.timeline.clear();
    this.stepBoundaries = [];
    this.originalFills.clear();
    this.svgElement.querySelectorAll("[data-animflow-annotation]").forEach((element) => element.remove());

    // Hide nodes that have explicit show actions; others remain visible
    this.initNodeVisibility();

    // Group steps by step number
    const stepGroups = this.groupStepsByNumber(this.data.animations);

    // Add each step group to timeline sequentially and collect boundaries.
    for (const [stepNum, steps] of stepGroups) {
      const stepStart = this.timeline.duration();
      // Notify active step when playback reaches this step boundary.
      this.timeline.call(() => {
        this.onStepChange?.(stepNum);
      });
      for (const step of steps) {
        this.addStepToTimeline(step);
      }
      const stepEnd = this.timeline.duration();
      this.stepBoundaries.push({ step: stepNum, start: stepStart, end: stepEnd });
      // Fire after all animations in this step finish (position = stepEnd, zero-duration)
      const capturedStep = stepNum;
      this.timeline.call(() => { this.onStepComplete?.(capturedStep); }, undefined, stepEnd);
    }

    this.timeline.repeat(this.data.config.loop ? -1 : 0);
  }

  /**
   * Nodes targeted by a `show` action start hidden; all others start visible.
   */
  private initNodeVisibility(): void {
    if (!this.svgElement) return;

    const showTargets = new Set<string>();
    const connectTargets = new Set<string>();
    for (const step of this.data.animations) {
      if (step.action === "show") {
        for (const t of step.targets) showTargets.add(t);
      } else if (step.action === "connect") {
        for (const t of step.targets) connectTargets.add(t.replace(/\s+/g, ""));
      }
    }

    const allNodes = this.svgElement.querySelectorAll('[data-node-id]');
    allNodes.forEach((node) => {
      const id = node.getAttribute('data-node-id') ?? '';
      const startsHidden = showTargets.has("all") || showTargets.has("nodes") || showTargets.has(id);
      gsap.set(node, { opacity: startsHidden ? 0 : 1 });
    });

    const allEdges = this.svgElement.querySelectorAll('[data-edge-id]');
    allEdges.forEach((edge) => {
      const id = edge.getAttribute("data-edge-id") ?? "";
      const from = edge.getAttribute("data-from") ?? "";
      const to = edge.getAttribute("data-to") ?? "";
      const startsHidden =
        showTargets.has("all") ||
        showTargets.has("edges") ||
        showTargets.has(id) ||
        connectTargets.has(`${from}->${to}`);
      gsap.set(edge, { opacity: startsHidden ? 0 : 1 });
      const roughContainer = edge.querySelector('.rough-path-container');
      const roughArrow = edge.querySelector('.rough-arrow-overlay');
      if (roughContainer) (roughContainer as SVGElement).style.visibility = startsHidden ? 'hidden' : 'visible';
      if (roughArrow) (roughArrow as SVGElement).style.visibility = startsHidden ? 'hidden' : 'visible';
    });

    this.svgElement.querySelectorAll("[data-animflow-annotation]").forEach((element) => {
      gsap.set(element, { opacity: 0 });
    });
  }

  private resolveTargets(targets: string[]): Element[] {
    if (!this.svgElement) return [];
    const elements = new Set<Element>();

    for (const targetId of targets) {
      if (targetId === "all") {
        this.svgElement.querySelectorAll("[data-node-id], [data-edge-id]").forEach((element) => elements.add(element));
      } else if (targetId === "nodes") {
        this.svgElement.querySelectorAll("[data-node-id]").forEach((element) => elements.add(element));
      } else if (targetId === "edges") {
        this.svgElement.querySelectorAll("[data-edge-id]").forEach((element) => elements.add(element));
      } else {
        const node = this.svgElement.querySelector(`[data-node-id="${targetId}"]`);
        const edge = this.svgElement.querySelector(`[data-edge-id="${targetId}"]`);
        if (node) elements.add(node);
        if (edge) elements.add(edge);
      }
    }

    return [...elements];
  }

  /**
   * Group animation steps by step number
   */
  private groupStepsByNumber(
    steps: AnimationStep[]
  ): Map<number, AnimationStep[]> {
    const groups = new Map<number, AnimationStep[]>();

    for (const step of steps) {
      if (!groups.has(step.step)) {
        groups.set(step.step, []);
      }
      groups.get(step.step)!.push(step);
    }

    return groups;
  }

  /**
   * Add animation step to timeline
   */
  private addStepToTimeline(step: AnimationStep): void {
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
        this.addCameraAnimation(targets, properties, duration, delay);
        break;

      case "annotate":
        this.addAnnotateAnimation(targets, properties, duration, delay);
        break;

      case "move":
        this.addMoveAnimation(targets, properties, duration, delay);
        break;

      case "transform":
        this.addTransformAnimation(targets, properties, duration, delay);
        break;
    }
  }

  /**
   * Add show animation with entrance effect
   */
  private addShowAnimation(
    targets: string[],
    properties: any,
    duration: number,
    delay: number
  ): void {
    if (!this.svgElement) return;

    const effect = properties.effect || "fadeIn";
    const stagger = this.parseDuration(properties.stagger || "0s");

    const elements = this.resolveTargets(targets);
    const basePosition = this.timeline.duration();
    elements.forEach((element, index) => {
      const offset = delay + index * stagger;
      if (element.hasAttribute("data-edge-id")) {
        this.timeline.call(() => {
          const roughContainer = element.querySelector(".rough-path-container");
          const roughArrow = element.querySelector(".rough-arrow-overlay");
          if (roughContainer) (roughContainer as SVGElement).style.visibility = "visible";
          if (roughArrow) (roughArrow as SVGElement).style.visibility = "visible";
        }, undefined, basePosition + offset);
      }
      const tween = applyEntranceEffect(element, effect, duration);
      this.timeline.add(tween, basePosition + offset);
    });
  }

  /**
   * Add hide animation
   */
  private addHideAnimation(
    targets: string[],
    properties: any,
    duration: number,
    delay: number
  ): void {
    if (!this.svgElement) return;

    const effect = properties.effect || "fadeOut";

    const elements = this.resolveTargets(targets);
    const basePosition = this.timeline.duration();

    elements.forEach((element) => {
      const tween = applyExitEffect(element, effect, duration);
      this.timeline.add(tween, basePosition + delay);
    });
  }

  /**
   * Add highlight animation
   */
  private addHighlightAnimation(
    targets: string[],
    properties: any,
    duration: number,
    delay: number
  ): void {
    if (!this.svgElement) return;

    const color = properties.color || "#FFD700";
    const glow = properties.glow || false;
    const pulse = properties.pulse || false;
    const flash = properties.flash || false;
    const stagger = this.parseDuration(properties.stagger || "0s");
    const basePosition = this.timeline.duration();

    targets.forEach((targetId, index) => {
      const element = this.svgElement!.querySelector(`[data-node-id="${targetId}"]`);
      if (!element) return;

      // Save original fill before overwriting
      const rect = element.querySelector("rect, ellipse, polygon, path");
      if (rect && !this.originalFills.has(targetId)) {
        const currentFill = rect.getAttribute("fill") ||
          (gsap.getProperty(rect, "fill") as string) || "";
        this.originalFills.set(targetId, currentFill);
      }

      const targetPosition = basePosition + delay + index * stagger;

      // Change fill color
      if (rect) {
        this.timeline.to(
          rect,
          {
            fill: color,
            duration: duration / 2,
            ease: "power2.out",
          },
          targetPosition
        );
      }

      // Add glow effect
      if (glow) {
        const glowTween = applyGlowEffect(element, color, duration / 2);
        this.timeline.add(glowTween, targetPosition);
      }

      // Add pulse effect
      if (pulse) {
        this.timeline.to(
          element,
          {
            scale: 1.1,
            duration: duration / 4,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut",
          },
          targetPosition
        );
      }

      if (flash) {
        this.timeline.add(applyEmphasisEffect(element, "flash", duration), targetPosition);
      }
    });
  }

  /**
   * Add unhighlight animation — restores original fill, removes glow, resets scale
   */
  private addUnhighlightAnimation(
    targets: string[],
    duration: number,
    delay: number
  ): void {
    if (!this.svgElement) return;

    const basePosition = this.timeline.duration();
    targets.forEach((targetId) => {
      const element = this.svgElement!.querySelector(`[data-node-id="${targetId}"]`);
      if (!element) return;

      // Restore original fill color if we saved one
      const rect = element.querySelector("rect, ellipse, polygon, path");
      const originalFill = this.originalFills.get(targetId);
      if (rect && originalFill !== undefined) {
        this.timeline.to(
          rect,
          { fill: originalFill, duration: duration / 2, ease: "power2.out" },
          basePosition + delay
        );
      }

      // Remove glow
      const removeGlow = removeGlowEffect(element, duration / 2);
      this.timeline.add(removeGlow, basePosition + delay);

      // Reset scale
      this.timeline.to(element, { scale: 1, duration: duration / 2 }, basePosition + delay);
    });
  }

  /**
   * Add connect animation
   */
  private addConnectAnimation(
    targets: string[],
    properties: any,
    duration: number,
    delay: number
  ): void {
    if (!this.svgElement) return;

    const flow = properties.flow || "particles";
    const speed = this.parseDuration(properties.speed || "2s");

    // targets format: ["nodeA->nodeB", "nodeC->nodeD"]
    const startPosition = this.timeline.duration() + delay;
    targets.forEach((connection) => {
      const [from, to] = connection.split("->").map((s) => s.trim());
      const edgeElements = this.svgElement!.querySelectorAll(
        `[data-from="${from}"][data-to="${to}"]`
      );

      edgeElements.forEach((edgeElement) => {
        const tween = animateEdgeFlow(edgeElement, flow, speed);
        this.timeline.add(tween, startPosition);
      });
    });
  }

  /**
   * Add camera animation
   */
  private addCameraAnimation(
    targets: string[],
    properties: any,
    duration: number,
    delay: number
  ): void {
    if (!this.svgElement) return;

    const action = properties.cameraAction || "fitAll";
    const tween = animateCamera(this.svgElement, action, {
      target: targets[0],
      targets,
      zoom: this.parseZoom(properties.zoom),
      padding: this.parsePadding(properties.padding),
      duration,
    });

    // Add to end of timeline for sequential execution
    this.timeline.add(tween, this.timeline.duration() + delay);
  }

  /**
   * Add a temporary SVG callout anchored to each target node.
   */
  private addAnnotateAnimation(
    targets: string[],
    properties: any,
    duration: number,
    delay: number
  ): void {
    if (!this.svgElement || !properties.text) return;

    const namespace = "http://www.w3.org/2000/svg";
    const basePosition = this.timeline.duration() + delay;
    const placement = properties.position || "top";

    targets.forEach((targetId) => {
      const target = this.svgElement!.querySelector(`[data-node-id="${targetId}"]`) as SVGGElement | null;
      if (!target) return;

      const bbox = target.getBBox();
      const words = String(properties.text).split(/\s+/);
      const lines: string[] = [];
      let currentLine = "";
      for (const word of words) {
        const candidate = currentLine ? `${currentLine} ${word}` : word;
        if (candidate.length > 38 && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = candidate;
        }
      }
      if (currentLine) lines.push(currentLine);

      const width = Math.min(320, Math.max(120, ...lines.map((line) => line.length * 7 + 24)));
      const height = Math.max(36, lines.length * 18 + 18);
      const gap = 14;
      let x = bbox.x + bbox.width / 2 - width / 2;
      let y = bbox.y - height - gap;
      if (placement === "bottom") y = bbox.y + bbox.height + gap;
      if (placement === "left") {
        x = bbox.x - width - gap;
        y = bbox.y + bbox.height / 2 - height / 2;
      }
      if (placement === "right") {
        x = bbox.x + bbox.width + gap;
        y = bbox.y + bbox.height / 2 - height / 2;
      }

      const group = document.createElementNS(namespace, "g");
      group.setAttribute("data-animflow-annotation", targetId);
      group.setAttribute("pointer-events", "none");

      const background = document.createElementNS(namespace, "rect");
      background.setAttribute("x", String(x));
      background.setAttribute("y", String(y));
      background.setAttribute("width", String(width));
      background.setAttribute("height", String(height));
      background.setAttribute("rx", "8");
      background.setAttribute("fill", "#111827");
      background.setAttribute("fill-opacity", "0.92");
      background.setAttribute("stroke", "#ffffff");
      background.setAttribute("stroke-width", "1");
      group.appendChild(background);

      const text = document.createElementNS(namespace, "text");
      text.setAttribute("x", String(x + width / 2));
      text.setAttribute("y", String(y + 20));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("fill", "#ffffff");
      text.setAttribute("font-size", "14");
      text.setAttribute("font-family", "sans-serif");
      lines.forEach((line, index) => {
        const span = document.createElementNS(namespace, "tspan");
        span.setAttribute("x", String(x + width / 2));
        span.setAttribute("dy", index === 0 ? "0" : "18");
        span.textContent = line;
        text.appendChild(span);
      });
      group.appendChild(text);
      this.svgElement!.appendChild(group);

      gsap.set(group, { opacity: 0, scale: 0.96, transformOrigin: "center center" });
      const annotationTimeline = gsap.timeline();
      const fadeDuration = Math.min(0.2, duration / 3);
      annotationTimeline.to(group, { opacity: 1, scale: 1, duration: fadeDuration });
      annotationTimeline.to(group, { opacity: 1, duration: Math.max(0, duration - fadeDuration * 2) });
      annotationTimeline.to(group, { opacity: 0, scale: 0.98, duration: fadeDuration });
      this.timeline.add(annotationTimeline, basePosition);
    });
  }

  /**
   * Move nodes by a relative or absolute offset
   * DSL: step N: move nodeA
   *        by: [50, 0]   or   to: [200, 100]
   */
  private addMoveAnimation(
    targets: string[],
    properties: any,
    duration: number,
    delay: number
  ): void {
    if (!this.svgElement) return;

    const basePosition = this.timeline.duration();
    targets.forEach((targetId) => {
      const element = this.svgElement!.querySelector(`[data-node-id="${targetId}"]`);
      if (!element) return;

      const tweenProps: gsap.TweenVars = { duration, ease: "power2.inOut" };

      if (Array.isArray(properties.by) && properties.by.length === 2) {
        tweenProps.x = `+=${properties.by[0]}`;
        tweenProps.y = `+=${properties.by[1]}`;
      } else if (Array.isArray(properties.to) && properties.to.length === 2) {
        tweenProps.x = properties.to[0];
        tweenProps.y = properties.to[1];
      }

      this.timeline.to(element, tweenProps, basePosition + delay);
    });
  }

  /**
   * Scale / rotate transform on nodes
   * DSL: step N: transform nodeA
   *        scale: 1.5
   *        rotate: 45deg
   */
  private addTransformAnimation(
    targets: string[],
    properties: any,
    duration: number,
    delay: number
  ): void {
    if (!this.svgElement) return;

    const basePosition = this.timeline.duration();
    targets.forEach((targetId) => {
      const element = this.svgElement!.querySelector(`[data-node-id="${targetId}"]`);
      if (!element) return;

      const tweenProps: gsap.TweenVars = { duration, ease: "power2.inOut" };

      if (properties.scale !== undefined) tweenProps.scale = properties.scale;
      if (properties.rotate !== undefined) {
        const deg = parseFloat(String(properties.rotate));
        if (!isNaN(deg)) tweenProps.rotation = deg;
      }

      this.timeline.to(element, tweenProps, basePosition + delay);
    });
  }

  /**
   * Parse duration string (e.g., "1.5s" -> 1.5)
   */
  private parseDuration(durationValue: unknown): number {
    if (typeof durationValue === "number" && Number.isFinite(durationValue)) return durationValue;
    const match = String(durationValue).match(/([0-9.]+)s?/);
    return match ? parseFloat(match[1]) : 1;
  }

  private parseZoom(zoomValue: unknown): number | undefined {
    if (zoomValue === undefined) return undefined;
    const zoom = typeof zoomValue === "number" ? zoomValue : parseFloat(String(zoomValue));
    return Number.isFinite(zoom) && zoom > 0 ? zoom : undefined;
  }

  /**
   * Parse padding string (e.g., "50px" -> 50)
   */
  private parsePadding(paddingStr?: string): number {
    if (!paddingStr) return 50;
    const match = paddingStr.match(/([0-9]+)/);
    return match ? parseInt(match[1], 10) : 50;
  }

  /**
   * Timeline update callback
   */
  private onTimelineUpdate(): void {
    // Can be used for progress tracking
  }

  /**
   * Playback controls
   */
  play(): void {
    this.timeline.play();
  }

  pause(): void {
    this.timeline.pause();
  }

  restart(): void {
    this.initNodeVisibility();
    this.timeline.restart();
  }

  stop(): void {
    this.timeline.pause();
    this.initNodeVisibility();
    this.timeline.seek(0);
  }

  seek(time: number): void {
    this.timeline.seek(time);
  }

  setSpeed(speed: number): void {
    this.timeline.timeScale(speed);
  }

  getCurrentTime(): number {
    return this.timeline.time();
  }

  getDuration(): number {
    return this.timeline.duration();
  }

  getStepBoundaries(): { step: number; start: number; end: number }[] {
    return [...this.stepBoundaries];
  }

  isPlaying(): boolean {
    return this.timeline.isActive();
  }

  destroy(): void {
    this.timeline.kill();
    this.svgElement?.querySelectorAll("[data-animflow-annotation]").forEach((element) => element.remove());
    this.svgElement = null;
  }
}
