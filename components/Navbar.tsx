"use client";

import { useState, useEffect } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const resourcesItems = [
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
    { label: 'FAQ', href: '#faqs' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <nav className="mx-auto max-w-7xl">
        <div className="relative flex h-16 md:h-20 items-center justify-between rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md px-6 md:px-8">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 flex-shrink-0" data-testid="link-home">
            <img 
              src="/Logos/ONLY LOGO.svg" 
              alt="WeDesign" 
              className="h-8 md:h-10 w-auto brightness-0 invert"
            />
          </a>

          {/* Desktop Navigation - Center */}
          <div className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {/* Resources Dropdown */}
            <div className="relative">
              <button
                onClick={() => setResourcesOpen(!resourcesOpen)}
                onBlur={() => setTimeout(() => setResourcesOpen(false), 200)}
                className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Resources
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${resourcesOpen ? 'rotate-180' : ''}`} />
              </button>
              {resourcesOpen && (
                <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-48 rounded-xl bg-black/80 backdrop-blur-xl shadow-2xl border border-white/10 p-2 z-50">
                  {resourcesItems.map((item) => (
                    <a 
                      key={item.label} 
                      href={item.href} 
                      className="block px-4 py-2.5 text-sm text-white/80 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Blog */}
            <a href="#blog" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
              Blog
            </a>
          </div>

          {/* Right Side - Dashboard Buttons */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            {/* Customer Dashboard Button */}
            <Button
              variant="outline"
              className="px-5 py-2 rounded-full text-sm font-medium border border-white/20 bg-transparent text-white/80 hover:bg-white/10 hover:text-white hover:border-white/30 transition-all"
              data-testid="button-customer-dashboard"
              asChild
            >
              <a href="/customer-dashboard">Customer Dashboard</a>
            </Button>

            {/* Designer Console Button */}
            <Button
              className="px-5 py-2 rounded-full text-sm font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all"
              data-testid="button-designer-console"
              asChild
            >
              <a href="/designer-console">Designer Console</a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white/80 hover:text-white transition-colors"
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Tube Light Effect - Bottom Glow */}
          <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-2/3 h-[2px] overflow-visible">
            {/* Core bright line */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent" />
            {/* Inner glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent blur-[2px]" />
            {/* Medium spread glow */}
            <div className="absolute -bottom-2 -left-4 -right-4 h-6 bg-gradient-to-r from-transparent via-white/30 to-transparent blur-md" />
            {/* Wide ambient glow */}
            <div className="absolute -bottom-4 -left-8 -right-8 h-10 bg-gradient-to-r from-transparent via-white/20 to-transparent blur-xl" />
            {/* Soft downward light cast */}
            <div className="absolute -bottom-6 left-1/4 right-1/4 h-12 bg-gradient-to-b from-white/15 via-white/5 to-transparent blur-2xl" />
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-xl p-6 space-y-4">
            {/* Resources Section */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Resources</p>
              {resourcesItems.map((item) => (
                <a 
                  key={item.label} 
                  href={item.href} 
                  className="block py-2 text-sm text-white/80 hover:text-white transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
            
            <div className="h-px bg-white/10" />
            
            <a href="#blog" className="block py-2 text-sm text-white/80 hover:text-white transition-colors">
              Blog
            </a>
            
            <div className="h-px bg-white/10" />
            
            <div className="space-y-3 pt-2">
              <Button
                variant="outline"
                className="w-full rounded-full font-medium border border-white/20 bg-transparent text-white/80 hover:bg-white/10 hover:text-white"
                data-testid="button-customer-dashboard-mobile"
                asChild
              >
                <a href="/customer-dashboard">Customer Dashboard</a>
              </Button>
              <Button
                className="w-full rounded-full font-semibold shadow-lg shadow-primary/25"
                data-testid="button-designer-console-mobile"
                asChild
              >
                <a href="/designer-console">Designer Console</a>
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
