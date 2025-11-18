"use client";

import { useState, useEffect } from "react";
import DesignerTopBar from "@/components/designer-console/DesignerTopBar";
import DesignerSidebar from "@/components/designer-console/DesignerSidebar";
import EditDesignContent from "@/components/designer-console/EditDesignContent";

export default function EditDesignPage({ params }: { params: Promise<{ id: string }> }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [designId, setDesignId] = useState<number | null>(null);

  useEffect(() => {
    // Next.js 15: params is always a Promise
    params.then((resolvedParams) => {
      setDesignId(parseInt(resolvedParams.id));
    }).catch((error) => {
      console.error('Error resolving params:', error);
    });
  }, [params]);

  if (!designId) {
    return (
      <div className="min-h-screen bg-background">
        <DesignerTopBar 
          title="Edit Design"
          subtitle="Loading..."
          breadcrumb="My Designs / Edit"
        />
        <div className="flex">
          <DesignerSidebar 
            collapsed={sidebarCollapsed} 
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
          />
          <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
            <div className="p-6">Loading...</div>
          </main>
        </div>
      </div>
    );
  }

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

