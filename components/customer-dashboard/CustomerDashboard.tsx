"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import CustomerDashboardSidebar from "./CustomerDashboardSidebar";
import CustomerDashboardTopBar from "./CustomerDashboardTopBar";
import CustomerDashboardContent from "./CustomerDashboardContent";
import CartDrawer from "./CartDrawer";
import DownloadsContent from "./DownloadsContent";
import OrdersContent from "./OrdersContent";
import PlansContent from "./PlansContent";
import SupportContent from "./SupportContent";
import NotificationsContent from "./NotificationsContent";
import FAQContent from "./FAQContent";
import ProfileContent from "./ProfileContent";
import WishlistContent from "./WishlistContent";
import LogoutModal from "./LogoutModal";

export type DashboardView = "dashboard" | "downloads" | "orders" | "freelancers" | "plans" | "support" | "notifications" | "faq" | "profile" | "wishlist";

export default function CustomerDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [activeView, setActiveView] = useState<DashboardView>("dashboard");
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check for view and category query parameters on mount
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam && ['dashboard', 'downloads', 'orders', 'freelancers', 'plans', 'support', 'notifications', 'faq', 'profile', 'wishlist'].includes(viewParam)) {
      setActiveView(viewParam as DashboardView);
    }
    
    // Read category from URL params
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory('all');
    }
    
    setIsInitialized(true);
  }, [searchParams]);

  // Update URL when activeView changes (after initial load from URL)
  useEffect(() => {
    if (!isInitialized) return; // Don't update URL during initial mount

    const viewParam = searchParams.get('view');
    const currentView = viewParam || 'dashboard';
    
    // Only update URL if it's different from the current param
    if (currentView !== activeView) {
      const params = new URLSearchParams(searchParams.toString());
      if (activeView === 'dashboard') {
        // Remove view param for dashboard (default view)
        params.delete('view');
      } else {
        params.set('view', activeView);
      }
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [activeView, pathname, router, searchParams, isInitialized]);

  // Sync selectedCategory from URL params (child component updates URL directly)
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory('all');
    }
  }, [searchParams]);

  const renderContent = () => {
    switch (activeView) {
      case "downloads":
        return <DownloadsContent />;
      case "orders":
        return <OrdersContent />;
      case "wishlist":
        return <WishlistContent />;
      case "plans":
        return <PlansContent />;
      case "support":
        return <SupportContent />;
      case "notifications":
        return <NotificationsContent />;
      case "faq":
        return <FAQContent />;
      case "profile":
        return <ProfileContent />;
      case "dashboard":
      default:
        return (
          <CustomerDashboardContent
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <CustomerDashboardSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
        activeView={activeView}
        onViewChange={setActiveView}
      />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <CustomerDashboardTopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setMobileMenuOpen(!mobileMenuOpen)}
          onOpenCart={() => setCartDrawerOpen(true)}
          onViewChange={setActiveView}
          onOpenLogout={() => setLogoutModalOpen(true)}
        />
        
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      <CartDrawer 
        isOpen={cartDrawerOpen} 
        onClose={() => setCartDrawerOpen(false)} 
      />

      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
      />
    </div>
  );
}
