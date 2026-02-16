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

    // Show all nodes immediately (no animation)
    this.showAllNodesImmediately();

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
   * Show all nodes immediately without animation
   */
  private showAllNodesImmediately(): void {
    if (!this.svgElement) return;

    const allNodes = this.svgElement.querySelectorAll('[data-node-id]');
    allNodes.forEach((node) => {
      gsap.set(node, { opacity: 1 });
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
  private addShowAnimation(
    targets: string[],
    properties: any,
    duration: number,
    delay: number
  ): void {
    // Nodes are already visible, skip show animation
    // This keeps the step timing intact but doesn't animate nodes
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

    targets.forEach((targetId) => {
      const element = this.svgElement!.querySelector(`[data-node-id="${targetId}"]`);
      if (!element) return;

      const tween = applyExitEffect(element, effect, duration);
      this.timeline.add(tween, delay);
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

      // Change fill color
      const rect = element.querySelector("rect, ellipse, polygon, path");
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
   * Add unhighlight animation
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

      // Remove glow
      const removeGlow = removeGlowEffect(element, duration / 2);
      this.timeline.add(removeGlow, delay);

      // Reset scale
      this.timeline.to(
        element,
        {
          scale: 1,
          duration: duration / 2,
        },
        delay
      );
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
    targets.forEach((connection) => {
      const [from, to] = connection.split("->").map((s) => s.trim());
      const edgeElement = this.svgElement!.querySelector(
        `[data-from="${from}"][data-to="${to}"]`
      );

      if (!edgeElement) return;

      const tween = animateEdgeFlow(edgeElement, flow, speed);
      // Add to end of timeline for sequential execution
      this.timeline.add(tween, "+=0");
    });
  }

  /**
   * Add camera animation
   */
  private addCameraAnimation(
    properties: any,
    duration: number,
    delay: number
  ): void {
    if (!this.svgElement) return;

    const action = properties.cameraAction || "fitAll";
    const tween = animateCamera(this.svgElement, action, {
      target: properties.target,
      targets: properties.targets,
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
    this.timeline.restart();
  }

  stop(): void {
    this.timeline.pause();
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
