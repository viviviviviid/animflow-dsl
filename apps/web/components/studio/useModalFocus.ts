import { useEffect, useRef } from "react";

/** One keyboard contract for every Studio modal, including asynchronous content. */
export function useModalFocus(onClose: () => void, dismissible = true) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const dismissibleRef = useRef(dismissible);
  dismissibleRef.current = dismissible;
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]')).filter((element) => element.getClientRects().length > 0);
    dialog.tabIndex = -1;
    (focusable()[0] ?? dialog).focus();
    const keydown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault(); event.stopPropagation();
        if (dismissibleRef.current) closeRef.current();
      } else if (event.key === "Tab") {
        const items = focusable();
        const first = items[0] ?? dialog;
        const last = items[items.length - 1] ?? dialog;
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) { event.preventDefault(); first.focus(); }
      }
    };
    const focusin = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog.contains(event.target)) (focusable()[0] ?? dialog).focus();
    };
    document.addEventListener("keydown", keydown, true);
    document.addEventListener("focusin", focusin);
    return () => {
      document.removeEventListener("keydown", keydown, true);
      document.removeEventListener("focusin", focusin);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return ref;
}
