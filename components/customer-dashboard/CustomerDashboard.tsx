"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import CustomerDashboardSidebar from "./CustomerDashboardSidebar";
import CustomerDashboardTopBar from "./CustomerDashboardTopBar";
import CustomerDashboardContent from "./CustomerDashboardContent";
import CartDrawer from "./CartDrawer";
import DownloadsContent from "./DownloadsContent";
import OrdersContent from "./OrdersContent";
import SupportContent from "./SupportContent";
import NotificationsContent from "./NotificationsContent";
import FAQContent from "./FAQContent";
import ProfileContent from "./ProfileContent";
import WishlistContent from "./WishlistContent";
import CartContent from "./CartContent";
import PlansContent from "./PlansContent";
import LogoutModal from "./LogoutModal";
import DownloadMockPDFContent from "./DownloadMockPDFContent";
import { useAuth } from "@/contexts/AuthContext";

export type DashboardView = "dashboard" | "downloads" | "orders" | "freelancers" | "support" | "notifications" | "faq" | "profile" | "wishlist" | "cart" | "plans" | "downloadMockPDF";

// Public views that don't require authentication
export const PUBLIC_VIEWS: DashboardView[] = ["dashboard", "faq"];

export default function CustomerDashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
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
    if (authLoading) return; // Wait for auth to load
    
    const viewParam = searchParams.get('view');
    const expectedView = (viewParam && ['dashboard', 'downloads', 'orders', 'freelancers', 'support', 'notifications', 'faq', 'profile', 'wishlist', 'cart', 'plans', 'downloadMockPDF'].includes(viewParam)) 
      ? (viewParam as DashboardView) 
      : 'dashboard';
    
    // Check if view requires authentication
    if (!isAuthenticated && !PUBLIC_VIEWS.includes(expectedView)) {
      // Redirect to login with current path as redirect destination
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }
    
    // Only update activeView if it's different from the expected view to prevent infinite loops
    // Use functional update to avoid needing activeView in dependencies
    setActiveView(prevView => {
      if (prevView !== expectedView) {
        return expectedView;
      }
      return prevView;
    });
    
    // Read category from URL params
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory('all');
    }
    
    setIsInitialized(true);
  }, [searchParams, isAuthenticated, authLoading, router]); // Add auth dependencies

  // Update URL when activeView changes (after initial load from URL)
  useEffect(() => {
    if (!isInitialized) return; // Don't update URL during initial mount

    // Read current view from URL without triggering on searchParams changes
    const viewParam = searchParams.get('view');
    const currentView = viewParam || 'dashboard';
    
    // Only update URL if it's different from the current param
    if (currentView !== activeView) {
      const params = new URLSearchParams(window.location.search);
      if (activeView === 'dashboard') {
        // Remove view param for dashboard (default view)
        params.delete('view');
      } else {
        params.set('view', activeView);
      }
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [activeView, pathname, router, isInitialized]); // Removed searchParams from dependencies

  // Sync selectedCategory from URL params (child component updates URL directly)
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory('all');
    }
  }, [searchParams]);

  // Handle view change with filter reset for dashboard and auth check
  const handleViewChange = (view: DashboardView) => {
    // Check if view requires authentication
    if (!isAuthenticated && !PUBLIC_VIEWS.includes(view)) {
      // Redirect to login with current path as redirect destination
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }
    
    setActiveView(view);
    
    // Reset filters when switching to dashboard
    if (view === 'dashboard') {
      setSearchQuery("");
      setSelectedCategory("all");
      // Clear URL parameters (category, search, etc.)
      const params = new URLSearchParams();
      // Only keep view param if it's not dashboard
      if (view !== 'dashboard') {
        params.set('view', view);
      }
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    }
  };

  const renderContent = () => {
    // Show loading while checking auth
    if (authLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }

    // Check if view requires authentication
    if (!isAuthenticated && !PUBLIC_VIEWS.includes(activeView)) {
      // This should not happen as handleViewChange redirects, but as a safety measure
      return (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Redirecting to login...</p>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case "downloads":
        return <DownloadsContent />;
      case "orders":
        return <OrdersContent />;
      case "wishlist":
        return <WishlistContent />;
      case "cart":
        return <CartContent />;
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
      case "downloadMockPDF":
        return <DownloadMockPDFContent />;
      case "dashboard":
      default:
        return (
          <CustomerDashboardContent
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            productIdFromUrl={searchParams.get('product')}
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
        onViewChange={handleViewChange}
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
        onViewCart={() => {
          setCartDrawerOpen(false);
          setActiveView("cart");
        }}
      />

      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
      />
    </div>
  );
}
