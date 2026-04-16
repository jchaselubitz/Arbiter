import { useEffect } from "react";

type ShortcutHandler = (e: KeyboardEvent) => void;

interface ShortcutDef {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  handler: ShortcutHandler;
}

function matchesShortcut(e: KeyboardEvent, def: ShortcutDef): boolean {
  const isMac = navigator.platform.startsWith("Mac");
  const metaMatch = def.meta ? (isMac ? e.metaKey : e.ctrlKey) : true;
  const ctrlMatch = def.ctrl ? e.ctrlKey : true;
  const shiftMatch = def.shift ? e.shiftKey : true;
  return e.key === def.key && metaMatch && ctrlMatch && shiftMatch;
}

export function useShortcuts(shortcuts: ShortcutDef[], deps: unknown[] = []) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      for (const shortcut of shortcuts) {
        if (matchesShortcut(e, shortcut)) {
          e.preventDefault();
          shortcut.handler(e);
          return;
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
