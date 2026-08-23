import type { ReactNode } from "react";
import AdminFooterActionGuard from "./AdminFooterActionGuard";
import AdminControlCenter from "./AdminControlCenter";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminFooterActionGuard />
      {children}
      <AdminControlCenter />
    </>
  );
}
