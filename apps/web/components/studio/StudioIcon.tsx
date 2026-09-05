import type { SVGProps } from "react";

const paths = {
  canvas: "M4 4h16v16H4z M8 9h3v6H8z M14 7h3v4h-3z M14 15h3v2h-3z M11 12h3",
  projects: "M3 7V5h7l2 2h9v13H3z",
  source: "m8 7-5 5 5 5 M16 7l5 5-5 5 M14 4l-4 16",
  inspect: "M4 7h9 M17 7h3 M4 17h3 M11 17h9 M13 4v6 M7 14v6",
  cues: "M4 5h16v5H4z M4 14h7v5H4z M15 14h5v5h-5z",
  help: "M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4 M12 17h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  reveal: "M3 12s3-6 9-6 9 6 9 6-3 6-9 6-9-6-9-6 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  focus: "M8 3H3v5 M16 3h5v5 M21 16v5h-5 M3 16v5h5 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  trace: "M3 17h4V7h13 M16 3l4 4-4 4",
  hide: "m3 3 18 18 M10 6c7-2 11 6 11 6a19 19 0 0 1-4 4 M6 6a19 19 0 0 0-3 6s3 6 9 6c1 0 2 0 3-1",
  camera: "M3 7h5l2-3h4l2 3h5v13H3z M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  undo: "M8 4 3 9l5 5 M3 9h10a6 6 0 0 1 0 12",
  redo: "m16 4 5 5-5 5 M21 9H11a6 6 0 0 0 0 12",
  play: "m8 4 13 8-13 8z",
  fit: "M8 3H3v5 M16 3h5v5 M21 16v5h-5 M3 16v5h5",
  arrange: "M3 3h6v6H3z M15 3h6v6h-6z M9 15h6v6H9z M6 9v3h12V9 M12 12v3",
  plus: "M12 5v14 M5 12h14",
  minus: "M5 12h14",
} as const;

export type StudioIconName = keyof typeof paths;

export function StudioIcon({ name, ...props }: SVGProps<SVGSVGElement> & { readonly name: StudioIconName }) {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}><path d={paths[name]} /></svg>;
}
