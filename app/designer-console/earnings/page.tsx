"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DesignerTopBar from "@/components/designer-console/DesignerTopBar";
import DesignerSidebar from "@/components/designer-console/DesignerSidebar";
import EarningsWalletContent from "@/components/designer-console/EarningsWalletContent";
import { useStudioAccess } from "@/contexts/StudioAccessContext";
import { useDesignerVerification } from "@/contexts/DesignerVerificationContext";

export default function EarningsWalletPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { hasFullAccess, isLoading: isLoadingAccess } = useStudioAccess();
  const { isVerified, isLoading: isLoadingVerification } = useDesignerVerification();
  const router = useRouter();

  const isLoading = isLoadingAccess || isLoadingVerification;

  useEffect(() => {
    // Allow verified users to access earnings page even without full access
    if (!isLoading && !isVerified && !hasFullAccess) {
      router.push('/designer-console');
    }
  }, [hasFullAccess, isVerified, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow verified users or users with full access
  if (!isVerified && !hasFullAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DesignerTopBar 
        title="Earnings & Wallet"
        subtitle="Manage your earnings, payouts, and transactions"
        breadcrumb="Earnings & Wallet"
      />
      
      <div className="flex">
        <DesignerSidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        
        <main className={`flex-1 transition-all duration-300 pt-16 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <EarningsWalletContent />
        </main>
      </div>
    </div>
  );
}
