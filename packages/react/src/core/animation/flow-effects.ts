import gsap from "gsap";
import type { FlowEffect } from "../types";

/**
 * Animate edge connection with flow effect
 */
export function animateEdgeFlow(
  edgeElement: Element,
  effect: FlowEffect,
  duration: number = 2
): gsap.core.Tween | gsap.core.Timeline {
  const pathElement = edgeElement.querySelector(".edge-path") as SVGPathElement;

  if (!pathElement) {
    return gsap.to(edgeElement, { opacity: 1, duration: 0 });
  }

  // Make edge visible
  gsap.set(edgeElement, { opacity: 1 });

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

/**
 * Animate rough arrow overlay at the end of line drawing
 */
function animateRoughArrow(
  edgeElement: Element,
  tl: gsap.core.Timeline,
  duration: number
) {
  const roughArrowEl = edgeElement.querySelector('.rough-arrow-overlay');
  if (roughArrowEl) {
    const arrowStart = Math.max(0, duration * 0.5);
    tl.fromTo(roughArrowEl,
      { opacity: 0 },
      { opacity: 1, duration: duration * 0.15, ease: "power1.in" },
      arrowStart
    );
  }
}

/**
 * Animate path drawing + arrow reveal
 */
function animateParticles(
  edgeElement: Element,
  pathElement: SVGPathElement,
  duration: number
): gsap.core.Timeline {
  const totalLength = pathElement.getTotalLength();
  const roughPathContainer = edgeElement.querySelector('.rough-path-container');

  const tl = gsap.timeline();

  if (roughPathContainer) {
    // Sketchy mode: progressive draw line
    gsap.set(roughPathContainer, { opacity: 1 });
    const roughPaths = roughPathContainer.querySelectorAll('path');
    roughPaths.forEach((rp) => {
      const len = rp.getTotalLength();
      gsap.set(rp, { strokeDasharray: len, strokeDashoffset: len });
      tl.to(rp, { strokeDashoffset: 0, duration, ease: "power1.inOut" }, 0);
    });
    // Arrow appears at 70%
    animateRoughArrow(edgeElement, tl, duration);
  } else {
    // Clean mode: stroke dash animation
    const arrowEl = edgeElement.querySelector('.edge-arrow');

    gsap.set(pathElement, {
      strokeDasharray: totalLength,
      strokeDashoffset: totalLength,
    });

    tl.to(pathElement, {
      strokeDashoffset: 0,
      duration,
      ease: "power1.inOut",
    });

    if (arrowEl) {
      const arrowStart = Math.max(0, duration * 0.85);
      tl.fromTo(arrowEl,
        { opacity: 0 },
        { opacity: 1, duration: duration * 0.15, ease: "power1.in" },
        arrowStart
      );
    }
  }

  return tl;
}

/**
 * Animate dashed line moving
 */
function animateDash(
  edgeElement: Element,
  pathElement: SVGPathElement,
  duration: number
): gsap.core.Timeline {
  const roughPathContainer = edgeElement.querySelector('.rough-path-container');

  const tl = gsap.timeline();

  if (roughPathContainer) {
    // Sketchy mode: progressive draw line
    gsap.set(roughPathContainer, { opacity: 1 });
    const roughPaths = roughPathContainer.querySelectorAll('path');
    roughPaths.forEach((rp) => {
      const len = rp.getTotalLength();
      gsap.set(rp, { strokeDasharray: len, strokeDashoffset: len });
      tl.to(rp, { strokeDashoffset: 0, duration, ease: "linear" }, 0);
    });
    // Arrow appears at 70%
    animateRoughArrow(edgeElement, tl, duration);
  } else {
    // Clean mode: dash animation
    const arrowEl = edgeElement.querySelector('.edge-arrow');

    gsap.set(pathElement, {
      strokeDasharray: "10, 5",
    });

    tl.fromTo(
      pathElement,
      { strokeDashoffset: 0 },
      {
        strokeDashoffset: 15,
        duration: 1,
        repeat: Math.ceil(duration) - 1,
        ease: "linear",
      }
    );

    if (arrowEl) {
      const arrowStart = Math.max(0, duration * 0.85);
      tl.fromTo(arrowEl,
        { opacity: 0 },
        { opacity: 1, duration: duration * 0.15, ease: "power1.in" },
        arrowStart
      );
    }
  }

  return tl;
}

/**
 * Animate arrow moving along path
 */
function animateArrow(
  edgeElement: Element,
  pathElement: SVGPathElement,
  duration: number
): gsap.core.Timeline {
  const totalLength = pathElement.getTotalLength();
  const roughPathContainer = edgeElement.querySelector('.rough-path-container');

  const tl = gsap.timeline();

  if (roughPathContainer) {
    // Sketchy mode: progressive draw line
    gsap.set(roughPathContainer, { opacity: 1 });
    const roughPaths = roughPathContainer.querySelectorAll('path');
    roughPaths.forEach((rp) => {
      const len = rp.getTotalLength();
      gsap.set(rp, { strokeDasharray: len, strokeDashoffset: len });
      tl.to(rp, { strokeDashoffset: 0, duration, ease: "power2.inOut" }, 0);
    });
    // Arrow appears at 70%
    animateRoughArrow(edgeElement, tl, duration);
  } else {
    // Clean mode: stroke dash animation
    const arrowEl = edgeElement.querySelector('.edge-arrow');

    gsap.set(pathElement, {
      strokeDasharray: `${totalLength} ${totalLength}`,
      strokeDashoffset: totalLength,
    });

    tl.to(pathElement, {
      strokeDashoffset: 0,
      duration,
      ease: "power2.inOut",
    });

    if (arrowEl) {
      const arrowStart = Math.max(0, duration * 0.85);
      tl.fromTo(arrowEl,
        { opacity: 0 },
        { opacity: 1, duration: duration * 0.15, ease: "power1.in" },
        arrowStart
      );
    }
  }

  return tl;
}
