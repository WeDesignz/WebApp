"use client";

import { useState } from "react";
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
import CategoriesContent from "./CategoriesContent";
import ProfileContent from "./ProfileContent";
import AccountsContent from "./AccountsContent";
import LogoutModal from "./LogoutModal";

export type DashboardView = "dashboard" | "downloads" | "orders" | "categories" | "freelancers" | "plans" | "support" | "notifications" | "faq" | "profile" | "accounts";

export default function CustomerDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [activeView, setActiveView] = useState<DashboardView>("dashboard");
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const renderContent = () => {
    switch (activeView) {
      case "downloads":
        return <DownloadsContent />;
      case "orders":
        return <OrdersContent />;
      case "plans":
        return <PlansContent />;
      case "support":
        return <SupportContent />;
      case "notifications":
        return <NotificationsContent />;
      case "faq":
        return <FAQContent />;
      case "categories":
        return <CategoriesContent />;
      case "profile":
        return <ProfileContent />;
      case "accounts":
        return <AccountsContent />;
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
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
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
