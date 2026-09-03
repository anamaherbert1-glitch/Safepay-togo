"use client";
import AdminDashboardLegacy from "./AdminDashboardLegacy";
import AdminAddOverlay from "./AdminAddOverlay";
import AdminControlEnhancements from "./AdminControlEnhancements";
import AdminSidebarCleanup from "./AdminSidebarCleanup";

export default function AdminPage() {
  return <><AdminDashboardLegacy /><AdminAddOverlay /><AdminControlEnhancements /><AdminSidebarCleanup /></>;
}
