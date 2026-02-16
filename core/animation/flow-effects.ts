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
 * Animate path drawing + arrow reveal
 */
function animateParticles(
  edgeElement: Element,
  pathElement: SVGPathElement,
  duration: number
): gsap.core.Timeline {
  const totalLength = pathElement.getTotalLength();
  
  // For sketchy mode, animate rough overlays
  const roughPathContainer = edgeElement.querySelector('.rough-path-container');
  const roughArrowEl = edgeElement.querySelector('.rough-arrow-overlay');

  const tl = gsap.timeline();

  if (roughPathContainer) {
    // Sketchy mode: fade in from 0 to 1
    tl.fromTo(roughPathContainer, 
      { opacity: 0 },
      {
        opacity: 1,
        duration,
        ease: "power1.inOut",
      }
    );

    if (roughArrowEl) {
      tl.fromTo(roughArrowEl,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
        `-=0.3`
      );
    }
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
      tl.fromTo(arrowEl,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
        `-=0.3`
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
  const roughArrowEl = edgeElement.querySelector('.rough-arrow-overlay');

  const tl = gsap.timeline();

  if (roughPathContainer) {
    // Sketchy mode: fade in
    tl.fromTo(roughPathContainer,
      { opacity: 0 },
      {
        opacity: 1,
        duration,
        ease: "linear",
      }
    );

    if (roughArrowEl) {
      tl.fromTo(roughArrowEl,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
        `-=0.3`
      );
    }
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
      tl.fromTo(arrowEl,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
        `-=0.3`
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
  const roughArrowEl = edgeElement.querySelector('.rough-arrow-overlay');

  const tl = gsap.timeline();

  if (roughPathContainer) {
    // Sketchy mode: fade in
    tl.fromTo(roughPathContainer,
      { opacity: 0 },
      {
        opacity: 1,
        duration,
        ease: "power2.inOut",
      }
    );

    if (roughArrowEl) {
      tl.fromTo(roughArrowEl,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
        `-=0.3`
      );
    }
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
      tl.fromTo(arrowEl,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 },
        `-=0.3`
      );
    }
  }

  return tl;
}
