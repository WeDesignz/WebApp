"use client";

import { useState } from "react";
import DesignerTopBar from "@/components/designer-console/DesignerTopBar";
import DesignerSidebar from "@/components/designer-console/DesignerSidebar";
import MyDesignsContent from "@/components/designer-console/MyDesignsContent";

export default function MyDesignsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <DesignerTopBar 
        title="My Designs"
        subtitle="Manage your uploads, check review status, and view analytics"
        breadcrumb="My Designs"
      />
      
      <div className="flex">
        <DesignerSidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        
        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <MyDesignsContent />
        </main>
      </div>
    </div>
  );
}
