"use client";

import { useState, useEffect } from 'react';
import { ChevronDown, Menu, X, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const resourcesItems = [
    { label: 'About Us', href: '#about' },
    { label: 'Contact Us', href: '#contact' },
    { label: 'Blog', href: '#blog' },
    { label: 'Vision / Mission', href: '#vision' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <nav
        className={`mx-auto max-w-7xl transition-all duration-300 ${
          scrolled ? '' : ''
        }`}
      >
        <div className={`flex h-16 md:h-20 items-center justify-between rounded-full border border-border ${scrolled ? 'bg-background/90 shadow-xl backdrop-blur-xl' : 'bg-background/60 shadow-lg backdrop-blur-lg'} px-4 md:px-6`}>
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 flex-shrink-0" data-testid="link-home">
            <img 
              src="/Logos/ONLY LOGO.svg" 
              alt="WeDesign" 
              className="h-8 md:h-10 w-auto brightness-0 invert"
            />
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6 ml-8">
            <div className="relative">
              <button
                onClick={() => setResourcesOpen(!resourcesOpen)}
                onBlur={() => setTimeout(() => setResourcesOpen(false), 200)}
                className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors"
              >
                Resources
                <ChevronDown className={`w-4 h-4 transition-transform ${resourcesOpen ? 'rotate-180' : ''}`} />
              </button>
              {resourcesOpen && (
                <div className="absolute top-full mt-2 left-0 w-56 rounded-xl bg-popover/95 backdrop-blur-lg shadow-2xl border border-popover-border p-2 z-50">
                  {[
                    { label: 'About Us', href: '#about' },
                    { label: 'Contact Us', href: '#contact' },
                    { label: 'Blog', href: '#blog' },
                    { label: 'Vision / Mission', href: '#vision' },
                  ].map((item) => (
                    <a key={item.label} href={item.href} className="block px-4 py-2 text-sm rounded-lg hover-elevate transition-colors">
                      {item.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
            <a href="/auth/login" className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors">
              <LogIn className="w-4 h-4" />
              Sign In
            </a>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right Side */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Customer Dashboard Button */}
            <Button
              variant="outline"
              className="hidden lg:inline-flex px-5 py-2 rounded-full text-sm font-medium border-2"
              data-testid="button-customer-dashboard"
              asChild
            >
              <a href="/customer-dashboard">Customer Dashboard</a>
            </Button>

            {/* Designer Onboarding Button */}
            <Button
              variant="outline"
              className="hidden lg:inline-flex px-5 py-2 rounded-full text-sm font-semibold border-2 border-primary/50 hover:bg-primary/10"
              data-testid="button-designer-onboarding"
              asChild
            >
              <a href="/designer-onboarding">Designer Onboarding</a>
            </Button>

            {/* Designer Console Button */}
            <Button
              className="hidden lg:inline-flex px-5 py-2 rounded-full text-sm font-semibold shadow-lg"
              data-testid="button-designer-console"
              asChild
            >
              <a href="/designer-console">Designer Console</a>
            </Button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2"
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-xl p-6 space-y-4">
            <a href="#about" className="block py-2 text-sm hover:text-primary transition-colors">About</a>
            <a href="#gallery" className="block py-2 text-sm hover:text-primary transition-colors">Gallery</a>
            <a href="#faqs" className="block py-2 text-sm hover:text-primary transition-colors">FAQs</a>
            <a href="#pricing" className="block py-2 text-sm hover:text-primary transition-colors">Pricing</a>
            <a href="/auth/login" className="flex items-center gap-2 py-2 text-sm hover:text-primary transition-colors font-medium">
              <LogIn className="w-4 h-4" />
              Sign In
            </a>
            <div className="space-y-3 pt-2">
              <Button
                variant="outline"
                className="w-full rounded-full font-medium border-2"
                data-testid="button-customer-dashboard-mobile"
                asChild
              >
                <a href="/customer-dashboard">Customer Dashboard</a>
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-full font-semibold border-2 border-primary/50"
                data-testid="button-designer-onboarding-mobile"
                asChild
              >
                <a href="/designer-onboarding">Designer Onboarding</a>
              </Button>
              <Button
                className="w-full rounded-full font-semibold"
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


