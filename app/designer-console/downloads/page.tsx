"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DesignerTopBar from "@/components/designer-console/DesignerTopBar";
import DesignerSidebar from "@/components/designer-console/DesignerSidebar";
import DesignerDownloadsContent from "@/components/designer-console/DesignerDownloadsContent";
import { useStudioAccess } from "@/contexts/StudioAccessContext";

export default function DesignerDownloadsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { hasFullAccess, isLoading } = useStudioAccess();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !hasFullAccess) {
      router.push('/designer-console');
    }
  }, [hasFullAccess, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasFullAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DesignerTopBar 
        title="Downloads (PDFs)"
        subtitle="Access all your purchased mockup PDFs"
        breadcrumb="Downloads (PDFs)"
      />
      
      <div className="flex">
        <DesignerSidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        
        <main className={`flex-1 transition-all duration-300 pt-16 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <DesignerDownloadsContent />
        </main>
      </div>
    </div>
  );
}

