import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export default function useDialogAccessibility({
  open,
  dialogRef,
  initialFocusRef,
  onClose,
  closeDisabled = false,
}) {
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);

  useEffect(() => {
    onCloseRef.current = onClose;
    closeDisabledRef.current = closeDisabled;
  }, [onClose, closeDisabled]);

  useEffect(() => {
    if (!open) return undefined;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const dialog = dialogRef.current;
    document.body.style.overflow = "hidden";

    const getFocusableElements = () => Array.from(
      dialog?.querySelectorAll(FOCUSABLE_SELECTOR) || [],
    ).filter((element) => element.getClientRects().length > 0);

    (initialFocusRef?.current || getFocusableElements()[0] || dialog)?.focus?.();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        if (!closeDisabledRef.current) onCloseRef.current?.();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = getFocusableElements();
      if (!focusable.length) {
        event.preventDefault();
        dialog?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!dialog?.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected && typeof previousFocus.focus === "function") {
        previousFocus.focus();
      }
    };
  }, [open, dialogRef, initialFocusRef]);
}
