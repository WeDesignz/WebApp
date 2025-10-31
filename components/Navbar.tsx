"use client";

import { useState, useEffect } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
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
        <div className="flex h-16 md:h-20 items-center justify-between px-2 md:px-4">
          <div className={`w-full flex items-center justify-between rounded-full border border-border ${scrolled ? 'bg-background/90 shadow-xl backdrop-blur-xl' : 'bg-background/60 shadow-lg backdrop-blur-lg'} px-4 md:px-6 py-2`}
          >
          {/* Logo */}
          <a href="/" className="flex items-center gap-2" data-testid="link-home">
            <div className="h-8 md:h-10 w-8 md:w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg md:text-xl">W</span>
            </div>
            <span className="font-display font-bold text-lg md:text-xl">WeDesign</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
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
                <div className="absolute top-full mt-2 left-0 w-56 rounded-xl bg-popover/95 backdrop-blur-lg shadow-2xl border border-popover-border p-2">
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
          </div>

          {/* Center CTA */}
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2">
            <Button
              className="px-8 py-3 rounded-full shadow-lg font-semibold tracking-wide"
              data-testid="button-join-designer-nav"
            >
              Join as Designer
            </Button>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Sign In */}
            <a
              href="#signin"
              className="hidden md:inline-block text-sm font-medium hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full"
              data-testid="link-signin"
            >
              Sign In
            </a>

            {/* Theme Toggle */}
            <ThemeToggle />

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
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border px-6 py-4 space-y-4">
            <a href="#about" className="block py-2 text-sm hover:text-primary transition-colors">About</a>
            <a href="#gallery" className="block py-2 text-sm hover:text-primary transition-colors">Gallery</a>
            <a href="#faqs" className="block py-2 text-sm hover:text-primary transition-colors">FAQs</a>
            <a href="#pricing" className="block py-2 text-sm hover:text-primary transition-colors">Pricing</a>
            <div className="md:hidden">
              <Button
                className="w-full rounded-full font-semibold tracking-wide"
                data-testid="button-join-designer-mobile"
              >
                Upload Design
              </Button>
            </div>
            <a
              href="#signin"
              className="block py-2 text-sm hover:text-primary transition-colors md:hidden"
              data-testid="link-mobile-signin"
            >
              Sign In
            </a>
            <div className="pt-2">
              <ThemeToggle />
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}


