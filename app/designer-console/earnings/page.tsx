"use client";

import { useState } from "react";
import DesignerTopBar from "@/components/designer-console/DesignerTopBar";
import DesignerSidebar from "@/components/designer-console/DesignerSidebar";
import EarningsWalletContent from "@/components/designer-console/EarningsWalletContent";

export default function EarningsWalletPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
        
        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <EarningsWalletContent />
        </main>
      </div>
    </div>
  );
}
