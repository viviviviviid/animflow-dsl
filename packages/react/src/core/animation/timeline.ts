import gsap from "gsap";
import type { DiagramData, AnimationStep } from "../types";
import {
  applyEntranceEffect,
  applyExitEffect,
  applyGlowEffect,
  removeGlowEffect,
} from "./effects";
import { animateEdgeFlow } from "./flow-effects";
import { animateCamera } from "./camera";

interface AnimationTimelineOptions {
  onStepChange?: (step: number) => void;
}

/**
 * Animation Timeline Manager
 */
export class AnimationTimeline {
  private timeline: gsap.core.Timeline;
  private svgElement: SVGSVGElement | null = null;
  private data: DiagramData;
  private onStepChange?: (step: number) => void;
  private stepBoundaries: { step: number; start: number; end: number }[] = [];
  /** Original fill colors per node, saved before highlight overwrites them */
  private originalFills = new Map<string, string>();

  constructor(data: DiagramData, options?: AnimationTimelineOptions) {
    this.data = data;
    this.onStepChange = options?.onStepChange;
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
    }
  }

  /**
   * Nodes targeted by a `show` action start hidden; all others start visible.
   */
  private initNodeVisibility(): void {
    if (!this.svgElement) return;

    const showTargets = new Set<string>();
    for (const step of this.data.animations) {
      if (step.action === "show") {
        for (const t of step.targets) showTargets.add(t);
      }
    }

    const allNodes = this.svgElement.querySelectorAll('[data-node-id]');
    allNodes.forEach((node) => {
      const id = node.getAttribute('data-node-id') ?? '';
      gsap.set(node, { opacity: showTargets.has(id) ? 0 : 1 });
    });

    // All edges start hidden; they are revealed only by connect actions
    const allEdges = this.svgElement.querySelectorAll('[data-edge-id]');
    allEdges.forEach((edge) => {
      gsap.set(edge, { opacity: 0 });
      // Also hide rough-path-container and rough-arrow-overlay via visibility
      // so their individual paths don't flash before strokeDashoffset is set
      const roughContainer = edge.querySelector('.rough-path-container');
      const roughArrow = edge.querySelector('.rough-arrow-overlay');
      if (roughContainer) (roughContainer as SVGElement).style.visibility = 'hidden';
      if (roughArrow) (roughArrow as SVGElement).style.visibility = 'hidden';
    });
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

    targets.forEach((targetId, index) => {
      const element = this.svgElement!.querySelector(`[data-node-id="${targetId}"]`);
      if (!element) return;

      const offset = delay + index * stagger;
      const tween = applyEntranceEffect(element, effect, duration);
      this.timeline.add(tween, offset > 0 ? `+=${offset}` : "+=0");
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

    const elements: Element[] = [];

    for (const targetId of targets) {
      if (targetId === "all") {
        this.svgElement.querySelectorAll("[data-node-id], [data-edge-id]").forEach((el) => elements.push(el));
      } else if (targetId === "edges") {
        this.svgElement.querySelectorAll("[data-edge-id]").forEach((el) => elements.push(el));
      } else if (targetId === "nodes") {
        this.svgElement.querySelectorAll("[data-node-id]").forEach((el) => elements.push(el));
      } else {
        const node = this.svgElement.querySelector(`[data-node-id="${targetId}"]`);
        const edge = this.svgElement.querySelector(`[data-edge-id="${targetId}"]`);
        if (node) elements.push(node);
        if (edge) elements.push(edge);
      }
    }

    elements.forEach((element) => {
      const tween = applyExitEffect(element, effect, duration);
      this.timeline.add(tween, delay > 0 ? `+=${delay}` : "+=0");
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
    const stagger = this.parseDuration(properties.stagger || "0s");

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

      // Change fill color
      if (rect) {
        this.timeline.to(
          rect,
          {
            fill: color,
            duration: duration / 2,
            ease: "power2.out",
          },
          stagger > 0 ? `+=${index * stagger}` : "+=0"
        );
      }

      // Add glow effect
      if (glow) {
        const glowTween = applyGlowEffect(element, color, duration / 2);
        this.timeline.add(glowTween, stagger > 0 ? `+=${index * stagger}` : "+=0");
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
          stagger > 0 ? `+=${index * stagger}` : "+=0"
        );
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
          delay
        );
      }

      // Remove glow
      const removeGlow = removeGlowEffect(element, duration / 2);
      this.timeline.add(removeGlow, delay);

      // Reset scale
      this.timeline.to(element, { scale: 1, duration: duration / 2 }, delay);
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
    const startPosition = "+=0";
    targets.forEach((connection, index) => {
      const [from, to] = connection.split("->").map((s) => s.trim());
      const edgeElement = this.svgElement!.querySelector(
        `[data-from="${from}"][data-to="${to}"]`
      );

      if (!edgeElement) return;

      const tween = animateEdgeFlow(edgeElement, flow, speed);
      // First connection advances timeline; rest start at same position (simultaneous)
      this.timeline.add(tween, index === 0 ? startPosition : "<");
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
      zoom: properties.zoom,
      padding: this.parsePadding(properties.padding),
      duration,
    });

    // Add to end of timeline for sequential execution
    this.timeline.add(tween, "+=0");
  }

  /**
   * Add annotate animation (placeholder)
   */
  private addAnnotateAnimation(
    targets: string[],
    properties: any,
    duration: number,
    delay: number
  ): void {
    // TODO: Implement annotation overlay
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

      this.timeline.to(element, tweenProps, delay > 0 ? `+=${delay}` : "+=0");
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

    targets.forEach((targetId) => {
      const element = this.svgElement!.querySelector(`[data-node-id="${targetId}"]`);
      if (!element) return;

      const tweenProps: gsap.TweenVars = { duration, ease: "power2.inOut" };

      if (properties.scale !== undefined) tweenProps.scale = properties.scale;
      if (properties.rotate !== undefined) {
        const deg = parseFloat(String(properties.rotate));
        if (!isNaN(deg)) tweenProps.rotation = deg;
      }

      this.timeline.to(element, tweenProps, delay > 0 ? `+=${delay}` : "+=0");
    });
  }

  /**
   * Parse duration string (e.g., "1.5s" -> 1.5)
   */
  private parseDuration(durationStr: string): number {
    const match = durationStr.match(/([0-9.]+)s?/);
    return match ? parseFloat(match[1]) : 1;
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
}
