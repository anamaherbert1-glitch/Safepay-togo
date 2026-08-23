"use client";

import { useEffect } from "react";

/**
 * Safety guard for the existing V5 admin footer action.
 * The footer arrow used to call the page's logout() handler directly.
 * Until the existing admin page is refactored, intercept that specific
 * action so an accidental tap cannot destroy the admin session.
 * A real logout action should be exposed separately in the admin UI.
 */
export default function AdminFooterActionGuard() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const logoutButton = target?.closest('button[aria-label="Déconnexion"]');
      if (!logoutButton) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}
