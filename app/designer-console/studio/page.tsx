"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import DesignerTopBar from "@/components/designer-console/DesignerTopBar";
import DesignerSidebar from "@/components/designer-console/DesignerSidebar";
import StudioContent from "@/components/designer-console/StudioContent";
import { useStudioAccess } from "@/contexts/StudioAccessContext";

export default function StudioPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isStudioOwner, isLoading: isStudioAccessLoading } = useStudioAccess();
  const router = useRouter();

  if (isStudioAccessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isStudioOwner) {
    router.push('/designer-console');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DesignerTopBar 
        title="Studio"
        subtitle="Manage your studio, members, and business details"
        breadcrumb="Studio"
      />
      
      <div className="flex">
        <DesignerSidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        
        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <StudioContent />
        </main>
      </div>
    </div>
  );
}

