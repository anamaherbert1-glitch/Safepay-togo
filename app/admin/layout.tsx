import type { ReactNode } from "react";
import "./admin-polish.css";
import AdminVisualLayer from "./AdminVisualLayer";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>
    {children}
    <AdminVisualLayer />
  </>;
}
