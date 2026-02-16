import React from 'react';
import * as react_jsx_runtime from 'react/jsx-runtime';

type DiagramType = "flowchart" | "mindmap";
type FlowchartDirection = "LR" | "RL" | "TD" | "BT";
type NodeShape = "terminator" | "rectangle" | "diamond" | "parallelogram" | "database" | "document";
interface DiagramNode {
    id: string;
    shape: NodeShape;
    label: string;
    subtitle?: string;
    position?: {
        x: number;
        y: number;
    };
    width?: number;
    height?: number;
    style?: NodeStyle;
}
interface NodeStyle {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    color?: string;
    fontSize?: number;
    fontWeight?: string;
    borderRadius?: number;
    shadow?: string;
}
type EdgeStyle = "solid" | "dashed" | "dotted" | "thick";
type ArrowType = "single" | "double" | "none";
interface DiagramEdge {
    id: string;
    from: string;
    to: string;
    label?: string;
    style?: EdgeStyle;
    arrow?: ArrowType;
    points?: {
        x: number;
        y: number;
    }[];
}
type AnimationAction = "show" | "hide" | "highlight" | "unhighlight" | "connect" | "move" | "transform" | "camera" | "annotate";
type EntranceEffect = "fadeIn" | "slideInLeft" | "slideInRight" | "slideInTop" | "slideInBottom" | "scaleIn" | "bounceIn" | "flipIn" | "rotateIn";
type FlowEffect = "particles" | "dash" | "glow" | "wave" | "arrow" | "lightning";
type ExitEffect = "fadeOut" | "slideOutLeft" | "slideOutRight" | "scaleOut" | "bounceOut";
type CameraAction = "focus" | "fitAll" | "fitNodes" | "zoom" | "pan";
interface AnimationStep {
    step: number;
    action: AnimationAction;
    targets: string[];
    properties: AnimationProperties;
}
interface AnimationProperties {
    duration?: string;
    delay?: string;
    easing?: string;
    effect?: EntranceEffect | ExitEffect;
    stagger?: string;
    color?: string;
    glow?: boolean;
    pulse?: boolean;
    flash?: boolean;
    flow?: FlowEffect;
    speed?: string;
    particleCount?: number;
    to?: [number, number];
    by?: [number, number];
    scale?: number;
    rotate?: string;
    cameraAction?: CameraAction;
    zoom?: string;
    padding?: string;
    text?: string;
    position?: "top" | "bottom" | "left" | "right";
}
interface NarrationItem {
    step: number;
    title: string;
    text: string;
    voice?: "none" | "male" | "female";
}
interface DiagramConfig {
    autoplay?: boolean;
    loop?: boolean;
    speed?: number;
    controls?: boolean;
    timeline?: boolean;
    narration?: boolean;
    width?: number;
    height?: number;
    background?: string;
    padding?: string;
    quality?: "low" | "medium" | "high" | "ultra";
    fps?: number;
    export?: {
        format?: "mp4" | "gif" | "webm";
        resolution?: "720p" | "1080p" | "4k";
    };
}
interface DiagramData {
    metadata: {
        id: string;
        title?: string;
        type: DiagramType;
        direction?: FlowchartDirection;
        created?: string;
        modified?: string;
    };
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    animations: AnimationStep[];
    styles?: Record<string, NodeStyle>;
    narrations: NarrationItem[];
    config: DiagramConfig;
}
interface ParseResult {
    success: boolean;
    data?: DiagramData;
    errors?: ParseError[];
}
interface ParseError {
    line: number;
    column: number;
    message: string;
    type: "syntax" | "semantic";
}

interface AnimflowPlayerProps {
    dsl: string;
    mode?: "clean" | "sketchy";
    autoplay?: boolean;
    controls?: boolean;
    narration?: boolean;
    className?: string;
    onError?: (error: string) => void;
    onReady?: (data: DiagramData) => void;
}
interface AnimflowPlayerRef {
    play: () => void;
    pause: () => void;
    stop: () => void;
    seek: (time: number) => void;
    setSpeed: (speed: number) => void;
    restart: () => void;
    getCurrentTime: () => number;
    getDuration: () => number;
    isPlaying: () => boolean;
}
declare const AnimflowPlayer: React.ForwardRefExoticComponent<AnimflowPlayerProps & React.RefAttributes<AnimflowPlayerRef>>;

interface DiagramRendererProps {
    data: DiagramData;
    onReady?: (svgElement: SVGSVGElement) => void;
    renderMode?: "clean" | "sketchy";
    zoom?: number;
    pan?: {
        x: number;
        y: number;
    };
}
declare function DiagramRenderer({ data, onReady, renderMode, zoom, pan, }: DiagramRendererProps): react_jsx_runtime.JSX.Element;

/**
 * Main DSL Parser
 * Parses complete DSL text and returns DiagramData
 */
declare function parseDsl(dslText: string): ParseResult;

/**
 * Calculate node positions using dagre layout algorithm
 */
declare function calculateFlowchartLayout(nodes: DiagramNode[], edges: DiagramEdge[], direction?: FlowchartDirection): {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
};

export { type AnimationAction, type AnimationProperties, type AnimationStep, AnimflowPlayer, type AnimflowPlayerProps, type AnimflowPlayerRef, type DiagramConfig, type DiagramData, type DiagramEdge, type DiagramNode, DiagramRenderer, type EdgeStyle, type FlowchartDirection, type NarrationItem, type NodeShape, type ParseResult, calculateFlowchartLayout, parseDsl };
