"use client";

import { useState } from "react";
import DesignerTopBar from "@/components/designer-console/DesignerTopBar";
import DesignerSidebar from "@/components/designer-console/DesignerSidebar";
import UploadDesignContent from "@/components/designer-console/UploadDesignContent";

export default function UploadDesignPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <DesignerTopBar 
        title="Upload Design"
        subtitle="Submit your design for review and publishing"
        breadcrumb="Upload Design"
      />
      
      <div className="flex pt-16">
        <DesignerSidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        
        <main className={`flex-1 transition-all duration-300 pt-16 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <UploadDesignContent />
        </main>
      </div>
    </div>
  );
}
