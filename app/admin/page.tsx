"use client";

import AdminDashboardLegacy from "./AdminDashboardLegacy";
import FinanceNavigation from "./FinanceNavigation";
import OverviewAnalyticsOverlay from "./OverviewAnalyticsOverlay";

export default function AdminPage() {
  return (
    <>
      <AdminDashboardLegacy />
      <FinanceNavigation />
      <OverviewAnalyticsOverlay />
    </>
  );
}
