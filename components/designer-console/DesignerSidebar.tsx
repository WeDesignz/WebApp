"use client";

import { useState, useEffect } from "react";
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
  Lock,
  HelpCircle
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useDesignerVerification } from "@/contexts/DesignerVerificationContext";
import { useStudioAccess } from "@/contexts/StudioAccessContext";

interface DesignerSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function DesignerSidebar({ collapsed, onToggle }: DesignerSidebarProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { isVerified } = useDesignerVerification();
  const { hasFullAccess, isStudioMember, isStudioOwner } = useStudioAccess();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const lockedPaths = [
    "/designer-console/designs",
    "/designer-console/upload",
    "/designer-console/analytics",
    "/designer-console/earnings",
    "/designer-console/downloads"
  ];

  // Base menu items - all items that could be shown
  // Studio members don't need verification, so unlock items for them
  const shouldLockForVerification = !isVerified && !isStudioMember;
  const allMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/designer-console", locked: false, requiresFullAccess: false },
    { icon: Image, label: "My Designs", href: "/designer-console/designs", locked: shouldLockForVerification, requiresFullAccess: false },
    { icon: Upload, label: "Upload Design", href: "/designer-console/upload", locked: shouldLockForVerification, requiresFullAccess: false },
    { icon: Building2, label: "Studio", href: "/designer-console/studio", locked: false, requiresFullAccess: true, requiresStudioOwner: true },
    { icon: BarChart3, label: "Analytics", href: "/designer-console/analytics", locked: !isVerified, requiresFullAccess: true },
    { icon: Wallet, label: "Earnings & Wallet", href: "/designer-console/earnings", locked: !isVerified, requiresFullAccess: true },
    { icon: Download, label: "Downloads (PDFs)", href: "/designer-console/downloads", locked: !isVerified, requiresFullAccess: true },
    { icon: Bell, label: "Notifications", href: "/designer-console/notifications", locked: false, requiresFullAccess: false },
    { icon: MessageSquare, label: "Messages/Support", href: "/designer-console/messages", locked: false, requiresFullAccess: false },
    { icon: HelpCircle, label: "FAQ", href: "/designer-console/faq", locked: false, requiresFullAccess: false },
    { icon: Settings, label: "Settings", href: "/designer-console/settings", locked: false, requiresFullAccess: false },
  ];

  // Filter menu items based on access level
  // Studio members (without DesignerProfile) only see: Dashboard, My Designs, Upload Design
  // Studio owners and individual designers see all items based on their access level
  type MenuItemWithLockReason = typeof allMenuItems[0] & { lockReason?: 'fullAccess' | 'verification' };
  
  const menuItems: MenuItemWithLockReason[] = allMenuItems
    .map(item => {
      // If user is a studio member (without full access), only show Dashboard, My Designs, Upload Design
      if (isStudioMember && !hasFullAccess) {
        const allowedForMembers = [
          "/designer-console",
          "/designer-console/designs",
          "/designer-console/upload"
        ];
        if (!allowedForMembers.includes(item.href)) {
          return null; // Filter out
        }
      }
      
      // For studio owners and individual designers:
      // If requires studio owner and user is not owner, hide
      if (item.requiresStudioOwner && !isStudioOwner) {
        return null; // Filter out
      }
      
    // If requires full access and user doesn't have it:
    // - For Earnings & Wallet: allow verified users to access (show unlocked)
    // - For other items: show as locked if verified, otherwise hide
    if (item.requiresFullAccess && !hasFullAccess) {
      // Earnings & Wallet is accessible to verified users
      if (item.href === "/designer-console/earnings" && isVerified) {
        return { ...item, locked: false };
      }
      // Other items: show as locked if user is verified, otherwise hide
      if (isVerified) {
        return { ...item, locked: true, lockReason: 'fullAccess' as const };
      }
      return null; // Filter out if not verified
    }
      
      return item;
    })
    .filter((item): item is MenuItemWithLockReason => item !== null);

  return (
    <aside
      className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-border transition-all duration-300 z-40 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center p-4 border-b border-border">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <img 
                src="/Logos/ONLY LOGO.svg" 
                alt="WeDesign Logo" 
                className={`h-8 w-8 ${mounted && theme === 'dark' ? 'brightness-0 invert' : ''}`}
              />
              <img 
                src="/Logos/ONLY TEXT.svg" 
                alt="WeDesign" 
                className={`h-5 w-auto ${mounted && theme === 'dark' ? 'brightness-0 invert' : ''}`}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center mx-auto">
              <img 
                src="/Logos/ONLY LOGO.svg" 
                alt="WeDesign Logo" 
                className={`h-8 w-8 ${mounted && theme === 'dark' ? 'brightness-0 invert' : ''}`}
              />
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isLocked = item.locked;
              const lockReason = item.lockReason;
              
              if (isLocked) {
                const lockMessage = lockReason === 'fullAccess' 
                  ? `${item.label} (Locked - Full Access Required)`
                  : `${item.label} (Locked - Pending Verification)`;
                
                return (
                  <li key={item.href}>
                    <div
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-not-allowed opacity-50 ${
                        collapsed ? 'justify-center' : ''
                      }`}
                      title={collapsed ? lockMessage : undefined}
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
