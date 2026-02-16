import gsap from "gsap";
import type { EntranceEffect, ExitEffect, EmphasisEffect } from "../types";

/**
 * Apply entrance effect to element
 */
export function applyEntranceEffect(
  element: Element,
  effect: EntranceEffect,
  duration: number = 1
): gsap.core.Tween {
  // Start with element visible
  gsap.set(element, { opacity: 1 });

  switch (effect) {
    case "fadeIn":
      return gsap.from(element, {
        opacity: 0,
        duration,
        ease: "power2.out",
      });

    case "slideInRight":
      return gsap.from(element, {
        x: 100,
        opacity: 0,
        duration,
        ease: "power2.out",
      });

    case "slideInLeft":
      return gsap.from(element, {
        x: -100,
        opacity: 0,
        duration,
        ease: "power2.out",
      });

    case "slideInTop":
      return gsap.from(element, {
        y: -100,
        opacity: 0,
        duration,
        ease: "power2.out",
      });

    case "slideInBottom":
      return gsap.from(element, {
        y: 100,
        opacity: 0,
        duration,
        ease: "power2.out",
      });

    case "scaleIn":
      return gsap.from(element, {
        scale: 0,
        opacity: 0,
        duration,
        ease: "back.out(1.7)",
      });

    case "bounceIn":
      return gsap.from(element, {
        scale: 0,
        opacity: 0,
        duration,
        ease: "bounce.out",
      });

    case "flipIn":
      return gsap.from(element, {
        rotationY: -90,
        opacity: 0,
        duration,
        ease: "power2.out",
      });

    case "rotateIn":
      return gsap.from(element, {
        rotation: -180,
        opacity: 0,
        duration,
        ease: "power2.out",
      });

    default:
      return gsap.from(element, {
        opacity: 0,
        duration,
      });
  }
}

/**
 * Apply exit effect to element
 */
export function applyExitEffect(
  element: Element,
  effect: ExitEffect,
  duration: number = 1
): gsap.core.Tween {
  switch (effect) {
    case "fadeOut":
      return gsap.to(element, {
        opacity: 0,
        duration,
        ease: "power2.in",
      });

    case "slideOutLeft":
      return gsap.to(element, {
        x: -100,
        opacity: 0,
        duration,
        ease: "power2.in",
      });

    case "slideOutRight":
      return gsap.to(element, {
        x: 100,
        opacity: 0,
        duration,
        ease: "power2.in",
      });

    case "scaleOut":
      return gsap.to(element, {
        scale: 0,
        opacity: 0,
        duration,
        ease: "back.in(1.7)",
      });

    case "bounceOut":
      return gsap.to(element, {
        scale: 0,
        opacity: 0,
        duration,
        ease: "bounce.in",
      });

    default:
      return gsap.to(element, {
        opacity: 0,
        duration,
      });
  }
}

/**
 * Apply emphasis effect to element
 */
export function applyEmphasisEffect(
  element: Element,
  effect: EmphasisEffect,
  duration: number = 1
): gsap.core.Tween {
  switch (effect) {
    case "pulse":
      return gsap.to(element, {
        scale: 1.1,
        duration: duration / 2,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
      });

    case "shake":
      return gsap.to(element, {
        x: -10,
        duration: 0.1,
        yoyo: true,
        repeat: 5,
        ease: "power1.inOut",
      });

    case "bounce":
      return gsap.to(element, {
        y: -20,
        duration: duration / 2,
        yoyo: true,
        repeat: 1,
        ease: "bounce.out",
      });

    case "flash":
      return gsap.to(element, {
        opacity: 0.3,
        duration: duration / 4,
        yoyo: true,
        repeat: 3,
        ease: "power1.inOut",
      });

    default:
      return gsap.to(element, {
        scale: 1,
        duration,
      });
  }
}

/**
 * Apply glow effect using SVG filter
 */
export function applyGlowEffect(
  element: Element,
  color: string,
  duration: number = 1
): gsap.core.Tween {
  return gsap.to(element, {
    filter: `drop-shadow(0 0 10px ${color})`,
    duration,
    ease: "power2.out",
  });
}

/**
 * Remove glow effect
 */
export function removeGlowEffect(
  element: Element,
  duration: number = 0.5
): gsap.core.Tween {
  return gsap.to(element, {
    filter: "none",
    duration,
    ease: "power2.in",
  });
}
