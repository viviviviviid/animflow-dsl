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

    case "glow":
      return animateGlow(edgeElement, pathElement, duration);

    case "wave":
      return animateWave(edgeElement, pathElement, duration);

    case "lightning":
      return animateLightning(edgeElement, pathElement, duration);

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
 * Glow: draw line + pulsing glow filter on the path
 */
function animateGlow(
  edgeElement: Element,
  pathElement: SVGPathElement,
  duration: number
): gsap.core.Timeline {
  const tl = gsap.timeline();
  const roughPathContainer = edgeElement.querySelector('.rough-path-container');

  // Draw line first
  if (roughPathContainer) {
    gsap.set(roughPathContainer, { opacity: 1 });
    const roughPaths = roughPathContainer.querySelectorAll('path');
    roughPaths.forEach((rp) => {
      const len = rp.getTotalLength();
      gsap.set(rp, { strokeDasharray: len, strokeDashoffset: len });
      tl.to(rp, { strokeDashoffset: 0, duration: duration * 0.6, ease: "power1.inOut" }, 0);
    });
    animateRoughArrow(edgeElement, tl, duration * 0.6);
  } else {
    const len = pathElement.getTotalLength();
    gsap.set(pathElement, { strokeDasharray: len, strokeDashoffset: len });
    tl.to(pathElement, { strokeDashoffset: 0, duration: duration * 0.6, ease: "power1.inOut" }, 0);
  }

  // Inject SVG filter for glow and pulse it
  const svgEl = edgeElement.closest('svg');
  const filterId = `glow-filter-${Math.random().toString(36).slice(2, 7)}`;
  if (svgEl) {
    const defs = svgEl.querySelector('defs') ?? svgEl.insertBefore(document.createElementNS('http://www.w3.org/2000/svg', 'defs'), svgEl.firstChild);
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', filterId);
    filter.setAttribute('x', '-50%');
    filter.setAttribute('y', '-50%');
    filter.setAttribute('width', '200%');
    filter.setAttribute('height', '200%');
    const feGaussian = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    feGaussian.setAttribute('stdDeviation', '3');
    feGaussian.setAttribute('result', 'blur');
    filter.appendChild(feGaussian);
    const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    ['blur', 'SourceGraphic'].forEach((inp) => {
      const node = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
      if (inp === 'blur') node.setAttribute('in', 'blur');
      feMerge.appendChild(node);
    });
    filter.appendChild(feMerge);
    defs.appendChild(filter);

    const target = roughPathContainer ?? pathElement;
    tl.call(() => { (target as SVGElement).style.filter = `url(#${filterId})`; }, [], duration * 0.6);
    tl.to(target, { opacity: 0.4, duration: duration * 0.2, yoyo: true, repeat: 3, ease: "sine.inOut" }, duration * 0.6);
    tl.call(() => { (target as SVGElement).style.filter = ''; }, []);
  }

  return tl;
}

/**
 * Wave: draw line with a sinusoidal opacity ripple
 */
function animateWave(
  edgeElement: Element,
  pathElement: SVGPathElement,
  duration: number
): gsap.core.Timeline {
  const tl = gsap.timeline();
  const roughPathContainer = edgeElement.querySelector('.rough-path-container');
  const targets = roughPathContainer
    ? Array.from(roughPathContainer.querySelectorAll('path'))
    : [pathElement];

  // Draw line
  targets.forEach((rp) => {
    const len = (rp as SVGPathElement).getTotalLength();
    gsap.set(rp, { strokeDasharray: len, strokeDashoffset: len });
    tl.to(rp, { strokeDashoffset: 0, duration: duration * 0.5, ease: "power1.inOut" }, 0);
  });
  animateRoughArrow(edgeElement, tl, duration * 0.5);

  // Wave ripple: rapid opacity oscillation
  const waveDuration = duration * 0.5;
  const cycles = 4;
  targets.forEach((rp) => {
    tl.to(rp, {
      opacity: 0.2,
      duration: waveDuration / (cycles * 2),
      yoyo: true,
      repeat: cycles * 2 - 1,
      ease: "sine.inOut",
    }, duration * 0.5);
  });
  tl.to(targets, { opacity: 1, duration: 0.15 });

  return tl;
}

/**
 * Lightning: instantaneous flash + brief strobe
 */
function animateLightning(
  edgeElement: Element,
  pathElement: SVGPathElement,
  duration: number
): gsap.core.Timeline {
  const tl = gsap.timeline();
  const roughPathContainer = edgeElement.querySelector('.rough-path-container');
  const targets = roughPathContainer
    ? Array.from(roughPathContainer.querySelectorAll('path'))
    : [pathElement];

  // Instant reveal
  gsap.set(roughPathContainer ?? pathElement, { opacity: 1 });
  targets.forEach((rp) => {
    const len = (rp as SVGPathElement).getTotalLength();
    gsap.set(rp, { strokeDasharray: len, strokeDashoffset: 0 });
  });
  animateRoughArrow(edgeElement, tl, 0);

  // Fast strobe flicker
  const strobeCount = 5;
  const strobeDuration = Math.min(duration, 0.08);
  for (let i = 0; i < strobeCount; i++) {
    tl.to(targets, { opacity: 0, duration: strobeDuration, ease: "power4.in" });
    tl.to(targets, { opacity: 1, duration: strobeDuration, ease: "power4.out" });
  }

  // Settle
  tl.to(targets, { opacity: 1, duration: 0.1 });

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
