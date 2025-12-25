"use client";

import { useState } from "react";
import DesignerTopBar from "@/components/designer-console/DesignerTopBar";
import DesignerSidebar from "@/components/designer-console/DesignerSidebar";
import DashboardContent from "@/components/designer-console/DashboardContent";
import DesignerConsoleGuard from "@/components/auth/DesignerConsoleGuard";

export default function DesignerConsolePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <DesignerConsoleGuard>
      <div className="min-h-screen bg-background">
        <DesignerTopBar />
        
        <div className="flex">
          <DesignerSidebar 
            collapsed={sidebarCollapsed} 
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
          />
          
          <main className={`flex-1 transition-all duration-300 pt-16 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
            <DashboardContent />
          </main>
        </div>
      </div>
    </DesignerConsoleGuard>
  );
}
