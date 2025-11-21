"use client";

import { 
  LayoutDashboard, 
  Image, 
  Upload, 
  BarChart3, 
  Wallet, 
  Download, 
  Bell, 
  MessageSquare, 
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
  Lock
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDesignerVerification } from "@/contexts/DesignerVerificationContext";
import { useStudioAccess } from "@/contexts/StudioAccessContext";

interface DesignerSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function DesignerSidebar({ collapsed, onToggle }: DesignerSidebarProps) {
  const pathname = usePathname();
  const { isVerified } = useDesignerVerification();
  const { hasFullAccess, isStudioMember, isStudioOwner } = useStudioAccess();

  const lockedPaths = [
    "/designer-console/designs",
    "/designer-console/upload",
    "/designer-console/analytics",
    "/designer-console/earnings",
    "/designer-console/downloads"
  ];

  // Base menu items - all items that could be shown
  const allMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/designer-console", locked: false, requiresFullAccess: false },
    { icon: Image, label: "My Designs", href: "/designer-console/designs", locked: !isVerified, requiresFullAccess: false },
    { icon: Upload, label: "Upload Design", href: "/designer-console/upload", locked: !isVerified, requiresFullAccess: false },
    { icon: Building2, label: "Studio", href: "/designer-console/studio", locked: false, requiresFullAccess: true, requiresStudioOwner: true },
    { icon: BarChart3, label: "Analytics", href: "/designer-console/analytics", locked: !isVerified, requiresFullAccess: true },
    { icon: Wallet, label: "Earnings & Wallet", href: "/designer-console/earnings", locked: !isVerified, requiresFullAccess: true },
    { icon: Download, label: "Downloads (PDFs)", href: "/designer-console/downloads", locked: !isVerified, requiresFullAccess: true },
    { icon: Bell, label: "Notifications", href: "/designer-console/notifications", locked: false, requiresFullAccess: false },
    { icon: MessageSquare, label: "Messages/Support", href: "/designer-console/messages", locked: false, requiresFullAccess: false },
    { icon: Settings, label: "Settings", href: "/designer-console/settings", locked: false, requiresFullAccess: false },
  ];

  // Filter menu items based on access level
  // Studio members only see items that don't require full access
  // Studio menu is only visible to studio owners
  const menuItems = allMenuItems.filter(item => {
    // If requires full access and user doesn't have it, hide
    if (item.requiresFullAccess && !hasFullAccess) return false;
    // If requires studio owner and user is not owner, hide
    if (item.requiresStudioOwner && !isStudioOwner) return false;
    return true;
  });

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-border transition-all duration-300 z-40 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">W</span>
              </div>
              <span className="font-bold">WeDesign</span>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 hover:bg-accent rounded-lg transition-colors ml-auto"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isLocked = item.locked;
              
              if (isLocked) {
                return (
                  <li key={item.href}>
                    <div
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-not-allowed opacity-50 ${
                        collapsed ? 'justify-center' : ''
                      }`}
                      title={collapsed ? `${item.label} (Locked - Pending Verification)` : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="text-sm font-medium flex-1">{item.label}</span>
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        </>
                      )}
                    </div>
                  </li>
                );
              }
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent text-foreground'
                    } ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
