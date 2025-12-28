"use client";

import { useState } from "react";
import DesignerTopBar from "@/components/designer-console/DesignerTopBar";
import DesignerSidebar from "@/components/designer-console/DesignerSidebar";
import MessagesSupportContent from "@/components/designer-console/MessagesSupportContent";

export default function MessagesPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <DesignerTopBar 
        title="Messages & Support"
        subtitle="Communicate with admin, support team, and stay updated"
        breadcrumb="Messages"
      />
      
      <div className="flex">
        <DesignerSidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        
        <main className={`flex-1 transition-all duration-300 pt-16 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <MessagesSupportContent />
        </main>
      </div>
    </div>
  );
}

