"use client";
import { useEffect } from "react";

export default function AdminSidebarCleanup() {
  useEffect(() => {
    const clean = () => {
      document.querySelectorAll('.adm-sidebar nav button').forEach((node) => {
        const text = (node.textContent || '').toLowerCase();
        const hide = text.includes('kyc') || text.includes('audit logs') || text.includes('audit log');
        (node as HTMLElement).style.display = hide ? 'none' : '';
      });
    };
    clean();
    const observer = new MutationObserver(clean);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
    const openAudit = () => {
      const button = Array.from(document.querySelectorAll('.adm-sidebar nav button')).find((b) => (b.textContent || '').toLowerCase().includes('audit')) as HTMLButtonElement | undefined;
      if (button) {
        button.style.display = '';
        button.click();
        window.setTimeout(clean, 0);
      }
    };
    window.addEventListener('safepay-admin-open-audit', openAudit);
    return () => { observer.disconnect(); window.removeEventListener('safepay-admin-open-audit', openAudit); };
  }, []);
  return null;
}
