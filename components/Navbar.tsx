"use client";

import { useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const moreMenuItems = [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Blog', href: '/blog' },
    { label: 'FAQ', href: '#faqs' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <nav className="mx-auto max-w-7xl">
        <div className="relative flex h-16 md:h-20 items-center justify-between rounded-2xl bg-black/20 backdrop-blur-md px-6 md:px-8 overflow-visible">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 flex-shrink-0" data-testid="link-home">
            <img 
              src="/Logos/ONLY LOGO.png" 
              alt="WeDesign Logo" 
              className="h-8 md:h-10 w-auto object-contain brightness-0 invert"
            />
            <img 
              src="/Logos/ONLY TEXT.png" 
              alt="WeDesign" 
              className="h-6 md:h-7 w-auto object-contain brightness-0 invert"
            />
          </a>

          {/* Desktop Navigation - Center */}
          <div className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {/* Empty - removed Resources and Blog */}
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
              <a href="/customer-dashboard">Home</a>
            </Button>

            {/* Designer Console Button */}
            <Button
              variant="outline"
              className="px-5 py-2 rounded-full text-sm font-medium border border-white/20 bg-transparent text-white/80 hover:bg-white/10 hover:text-white hover:border-white/30 transition-all"
              data-testid="button-designer-console"
              asChild
            >
              <a href="/designer-console">Join as Freelancer</a>
            </Button>

            {/* More Button with Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                onBlur={() => setTimeout(() => setMoreMenuOpen(false), 200)}
                className="px-5 py-2 rounded-full text-sm font-medium border border-white/20 bg-transparent text-white/80 hover:bg-white/10 hover:text-white hover:border-white/30 transition-all flex items-center gap-1.5"
                data-testid="button-more"
              >
                More
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${moreMenuOpen ? 'rotate-180' : ''}`} />
              </Button>
              {moreMenuOpen && (
                <div className="absolute top-full mt-2 right-0 w-48 rounded-xl bg-black/80 backdrop-blur-xl shadow-2xl border border-white/10 p-2 z-50">
                  {moreMenuItems.map((item) => (
                    <a 
                      key={item.label} 
                      href={item.href} 
                      className="block px-4 py-2.5 text-sm text-white/80 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                      onClick={() => setMoreMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white/80 hover:text-white transition-colors"
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Tube Light Effect - Bottom Glow (Only downward) */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2/3 h-0 overflow-visible pointer-events-none">
            {/* Core bright line at the edge */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            {/* Soft glow layer 1 */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-white/40 to-transparent blur-[3px]" />
            {/* Medium spread glow */}
            <div className="absolute top-0 -left-4 -right-4 h-4 bg-gradient-to-r from-transparent via-white/25 to-transparent blur-md" />
            {/* Wide ambient glow */}
            <div className="absolute top-0 -left-8 -right-8 h-8 bg-gradient-to-r from-transparent via-white/15 to-transparent blur-xl" />
            {/* Soft downward light cast */}
            <div className="absolute top-1 left-1/4 right-1/4 h-12 bg-gradient-to-b from-white/20 via-white/5 to-transparent blur-xl" />
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 rounded-2xl bg-black/80 backdrop-blur-xl shadow-xl p-6 space-y-4">
            {/* More Menu Section */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">More</p>
              {moreMenuItems.map((item) => (
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
            
            <div className="space-y-3 pt-2">
              <Button
                variant="outline"
                className="w-full rounded-full font-medium border border-white/20 bg-transparent text-white/80 hover:bg-white/10 hover:text-white"
                data-testid="button-customer-dashboard-mobile"
                asChild
              >
                <a href="/customer-dashboard">Home</a>
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-full font-medium border border-white/20 bg-transparent text-white/80 hover:bg-white/10 hover:text-white"
                data-testid="button-designer-console-mobile"
                asChild
              >
                <a href="/designer-console">Join as Freelancer</a>
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
