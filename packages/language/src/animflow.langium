grammar AnimFlow

entry AnimFlowDocument:
    'animflow' version=AnimFlowSourceVersion
    canvas=Canvas
    graphs+=Graph+
    overlays+=Overlay*
    story=Story;

AnimFlowSourceVersion returns string:
    NUMBER;

Canvas:
    'canvas' '{'
        properties+=CanvasProperty*
    '}';

CanvasProperty:
    CanvasSizeProperty | CanvasThemeProperty | CanvasBackgroundProperty;

CanvasSizeProperty:
    'size' width=NUMBER 'by' height=NUMBER;

CanvasThemeProperty:
    'theme' value=ID;

CanvasBackgroundProperty:
    'background' value=ID;

Graph:
    'graph' name=ID '{'
        layout=FlowLayout
        members+=GraphMember*
    '}';

GraphMember:
    Node | Edge;

FlowLayout:
    'layout' 'flow' direction=FlowDirection '{'
        settings+=LayoutSetting*
    '}';

LayoutSetting:
    NodeGapSetting | RankGapSetting | RoutingSetting;

NodeGapSetting:
    'nodeGap' value=NUMBER;

RankGapSetting:
    'rankGap' value=NUMBER;

RoutingSetting:
    'routing' value=EdgeRouting;

Node:
    'node' name=ID label=STRING '{'
        properties+=NodeProperty*
    '}';

NodeProperty:
    NodeShapeProperty | NodeToneProperty | NodePositionProperty | NodePinProperty;

NodeShapeProperty:
    'shape' value=NodeShape;

NodeToneProperty:
    'tone' value=ID;

NodePositionProperty:
    'position' 'x' x=NUMBER 'y' y=NUMBER;

NodePinProperty:
    {infer NodePinProperty} 'pin';

Edge:
    'edge' name=ID ':'
    from=[Node] '.' fromPort=Port
    '->'
    to=[Node] '.' toPort=Port
    '{'
        properties+=EdgeProperty*
    '}';

EdgeProperty:
    EdgeLabelProperty
    | EdgeLineProperty
    | EdgeArrowProperty
    | EdgeToneProperty
    | EdgeRoutingProperty
    | EdgeFlowProperty;

EdgeLabelProperty:
    'label' value=STRING;

EdgeLineProperty:
    'line' pattern=LinePattern width=NUMBER;

EdgeArrowProperty:
    'arrow' value=ArrowPlacement;

EdgeToneProperty:
    'tone' value=ID;

EdgeRoutingProperty:
    'routing' value=EdgeRouting;

EdgeFlowProperty:
    'flow' value=FlowEffect;

Overlay:
    'overlay' name=ID ':' overlayKind=OverlayKind '{'
        properties+=OverlayProperty*
    '}';

OverlayProperty:
    OverlayAnchorProperty
    | OverlayTextProperty
    | OverlayWidthProperty
    | OverlayToneProperty;

OverlayAnchorProperty:
    'anchor' node=[Node] '.' port=Port;

OverlayTextProperty:
    'text' value=STRING;

OverlayWidthProperty:
    'width' value=NUMBER;

OverlayToneProperty:
    'tone' value=ID;

Story:
    'story' name=ID '{'
        initial=InitialBlock
        scenes+=Scene+
    '}';

InitialBlock:
    'initial' '{'
        statements+=InitialStatement*
    '}';

InitialStatement:
    InitialVisibilityStatement | CameraStatement;

InitialVisibilityStatement:
    action=('show' | 'hide') targets=TargetSet;

Scene:
    'scene' name=ID title=STRING 'duration' duration=Duration '{'
        statements+=SceneStatement*
    '}';

SceneStatement:
    ActionStatement
    | SayStatement
    | SceneAction;

ActionStatement:
    'action' name=ID ':' body=SceneAction;

SceneAction:
    SceneVisibilityStatement
    | DrawStatement
    | HighlightStatement
    | ClearHighlightStatement
    | CameraStatement
    | SequenceStatement
    | StaggerStatement;

SceneVisibilityStatement:
    action=('show' | 'hide') targets=TargetSet 'via' transition=VisibilityTransition;

DrawStatement:
    'draw' edge=[Edge] 'via' transition=TraceTransition ('flow' flow=FlowEffect)?;

HighlightStatement:
    'highlight' target=[Element] 'tone' tone=ID ('effect' effect=HighlightEffect)?;

ClearHighlightStatement:
    'clearHighlight' target=[Element];

CameraStatement:
    'camera' action=CameraAction '(' targets=TargetSet ')' ('padding' padding=NUMBER)?;

SayStatement:
    'say' text=STRING;

SequenceStatement:
    'sequence' '{'
        statements+=SceneStatement*
    '}';

StaggerStatement:
    'stagger' interval=Duration '{'
        statements+=SceneStatement*
    '}';

TargetSet:
    ElementListTarget | NamedTarget;

ElementListTarget:
    '[' elements+=[Element] (',' elements+=[Element])* ']';

NamedTarget:
    target=[Selectable] ('.' wildcard?='*')?;

VisibilityTransition:
    FadeTransition | PopTransition | SlideTransition | FlipTransition;

FadeTransition:
    {infer FadeTransition} 'fade';

PopTransition:
    {infer PopTransition} 'pop';

FlipTransition:
    {infer FlipTransition} 'flip';

SlideTransition:
    'slide' '(' 'from' ':' from=SlideDirection
    (',' 'distance' ':' distance=NUMBER)? ')';

TraceTransition:
    {infer TraceTransition} 'trace';

Duration:
    value=NUMBER unit=TimeUnit;

type Element = Node | Edge | Overlay;
type Selectable = Graph | Node | Edge | Overlay;

FlowDirection returns string:
    'right' | 'left' | 'down' | 'up';

EdgeRouting returns string:
    'straight' | 'orthogonal' | 'curve';

FlowEffect returns string:
    'none' | 'particles' | 'dash' | 'glow' | 'wave' | 'arrow' | 'lightning';

HighlightEffect returns string:
    'glow' | 'pulse';

Port returns string:
    'auto' | 'n' | 'e' | 's' | 'w';

NodeShape returns string:
    'rectangle'
    | 'rounded'
    | 'pill'
    | 'diamond'
    | 'circle'
    | 'database'
    | 'document'
    | 'parallelogram';

LinePattern returns string:
    'solid' | 'dashed' | 'dotted';

ArrowPlacement returns string:
    'none' | 'start' | 'end' | 'both';

OverlayKind returns string:
    'callout' | 'card' | 'badge' | 'text';

CameraAction returns string:
    'fit' | 'focus';

SlideDirection returns string:
    'left' | 'right' | 'up' | 'down';

TimeUnit returns string:
    'ms' | 's';

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal NUMBER returns number: /[0-9]+(\.[0-9]+)?/;
terminal STRING: /"(\\.|[^"\\])*"/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
