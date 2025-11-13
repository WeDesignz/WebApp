"use client";

import CustomerDashboard from "@/components/customer-dashboard/CustomerDashboard";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function CustomerDashboardPage() {
  return (
    <ProtectedRoute>
      <CustomerDashboard />
    </ProtectedRoute>
  );
}
