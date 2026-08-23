import type { ReactNode } from "react";
import AdminFooterActionGuard from "./AdminFooterActionGuard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminFooterActionGuard />
      {children}
    </>
  );
}
