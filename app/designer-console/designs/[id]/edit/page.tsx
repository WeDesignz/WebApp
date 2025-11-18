"use client";

import { useState, use } from "react";
import DesignerTopBar from "@/components/designer-console/DesignerTopBar";
import DesignerSidebar from "@/components/designer-console/DesignerSidebar";
import EditDesignContent from "@/components/designer-console/EditDesignContent";

export default function EditDesignPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Use React's use() hook to unwrap the Promise (Next.js 15 pattern)
  const { id } = use(params);
  const designId = parseInt(id);


  return (
    <div className="min-h-screen bg-background">
      <DesignerTopBar 
        title="Edit Design"
        subtitle="Update your design information and files"
        breadcrumb="My Designs / Edit"
      />
      
      <div className="flex">
        <DesignerSidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        
        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <EditDesignContent designId={designId} />
        </main>
      </div>
    </div>
  );
}

