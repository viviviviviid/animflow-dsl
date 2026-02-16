import gsap from "gsap";
import type { CameraAction } from "../types";

/**
 * Animate SVG viewBox for camera effects
 */
export function animateCamera(
  svgElement: SVGSVGElement,
  action: CameraAction,
  options: {
    target?: string;
    targets?: string[];
    zoom?: number;
    padding?: number;
    duration?: number;
  } = {}
): gsap.core.Tween {
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

  return gsap.to(svgElement, { duration: 0 });
}

/**
 * Fit all nodes in view
 */
function fitAllNodes(
  svgElement: SVGSVGElement,
  padding: number,
  duration: number
): gsap.core.Tween {
  const nodesLayer = svgElement.querySelector(".nodes-layer");
  if (!nodesLayer) return gsap.to(svgElement, { duration: 0 });

  const bbox = (nodesLayer as SVGGElement).getBBox();
  
  const viewBox = {
    x: bbox.x - padding,
    y: bbox.y - padding,
    width: bbox.width + padding * 2,
    height: bbox.height + padding * 2,
  };

  return gsap.to(svgElement, {
    attr: {
      viewBox: `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`,
    },
    duration,
    ease: "power2.inOut",
  });
}

/**
 * Focus on specific node
 */
function focusNode(
  svgElement: SVGSVGElement,
  nodeId: string,
  zoom: number,
  duration: number
): gsap.core.Tween {
  const nodeGroup = svgElement.querySelector(`[data-node-id="${nodeId}"]`);
  if (!nodeGroup) return gsap.to(svgElement, { duration: 0 });

  const bbox = (nodeGroup as SVGGElement).getBBox();
  
  const viewBox = {
    x: bbox.x - bbox.width / zoom,
    y: bbox.y - bbox.height / zoom,
    width: bbox.width * (1 + 1 / zoom),
    height: bbox.height * (1 + 1 / zoom),
  };

  return gsap.to(svgElement, {
    attr: {
      viewBox: `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`,
    },
    duration,
    ease: "power2.inOut",
  });
}

/**
 * Fit specific nodes in view
 */
function fitNodes(
  svgElement: SVGSVGElement,
  nodeIds: string[],
  padding: number,
  duration: number
): gsap.core.Tween {
  const nodes = nodeIds.map((id) =>
    svgElement.querySelector(`[data-node-id="${id}"]`)
  ).filter(Boolean);

  if (nodes.length === 0) return gsap.to(svgElement, { duration: 0 });

  // Calculate combined bounding box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const bbox = (node as SVGGElement).getBBox();
    minX = Math.min(minX, bbox.x);
    minY = Math.min(minY, bbox.y);
    maxX = Math.max(maxX, bbox.x + bbox.width);
    maxY = Math.max(maxY, bbox.y + bbox.height);
  }

  const viewBox = {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };

  return gsap.to(svgElement, {
    attr: {
      viewBox: `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`,
    },
    duration,
    ease: "power2.inOut",
  });
}
