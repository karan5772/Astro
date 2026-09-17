'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Sidebar collapse state, kept in localStorage and mirrored across every
 * component that cares (the sidebar itself plus each page's content offset).
 *
 * This reads through `useSyncExternalStore` rather than syncing localStorage
 * into state inside an effect: localStorage is an external store, and treating
 * it as one avoids both the extra render pass and the flash of the wrong layout.
 */

const STORAGE_KEY = 'sidebar-collapsed';
export const SIDEBAR_COLLAPSE_EVENT = 'sidebar-collapse-change';

function subscribe(onChange: () => void) {
  window.addEventListener(SIDEBAR_COLLAPSE_EVENT, onChange);
  // Keeps other tabs in step.
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(SIDEBAR_COLLAPSE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    // Private mode / blocked storage: fall back to expanded.
    return false;
  }
}

// Rendered on the server before any preference is known.
function getServerSnapshot(): boolean {
  return false;
}

export function useSidebarCollapsed(): [boolean, (next: boolean) => void] {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setCollapsed = useCallback((next: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      /* preference simply won't persist */
    }
    window.dispatchEvent(new Event(SIDEBAR_COLLAPSE_EVENT));
  }, []);

  return [collapsed, setCollapsed];
}
