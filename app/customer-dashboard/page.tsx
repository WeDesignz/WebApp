"use client";

import { Suspense } from "react";
import CustomerDashboard from "@/components/customer-dashboard/CustomerDashboard";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function CustomerDashboardPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
        <CustomerDashboard />
      </Suspense>
    </ProtectedRoute>
  );
}
