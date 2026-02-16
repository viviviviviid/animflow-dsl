declare module 'react-split' {
  import { CSSProperties, ReactNode } from 'react';

  export interface SplitProps {
    sizes?: number[];
    minSize?: number | number[];
    maxSize?: number | number[];
    expandToMin?: boolean;
    gutterSize?: number;
    gutterAlign?: 'center' | 'start' | 'end';
    snapOffset?: number;
    dragInterval?: number;
    direction?: 'horizontal' | 'vertical';
    cursor?: string;
    gutter?: (index: number, direction: 'horizontal' | 'vertical') => HTMLElement;
    elementStyle?: (
      dimension: 'width' | 'height',
      size: number,
      gutterSize: number,
    ) => CSSProperties;
    gutterStyle?: (
      dimension: 'width' | 'height',
      gutterSize: number,
    ) => CSSProperties;
    onDrag?: (sizes: number[]) => void;
    onDragStart?: (sizes: number[]) => void;
    onDragEnd?: (sizes: number[]) => void;
    children: ReactNode[];
    className?: string;
    style?: CSSProperties;
  }

  export default function Split(props: SplitProps): JSX.Element;
}
