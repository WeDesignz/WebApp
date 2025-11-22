"use client";

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">W</span>
              </div>
              <span className="font-display font-bold">WeDesign</span>
            </div>
            <p className="text-sm text-foreground/70 mt-3">Empowering creative collaboration and commerce.</p>
          </div>
          <div>
            <div className="text-sm font-semibold mb-3">Product</div>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li><a href="#gallery" className="hover:underline">Gallery</a></li>
              <li><a href="#pricing" className="hover:underline">Pricing</a></li>
              <li><a href="#faqs" className="hover:underline">FAQs</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold mb-3">Creators</div>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li><a href="#creators" className="hover:underline">Join as Freelancer</a></li>
              <li><a href="#creators" className="hover:underline">Upload Design</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold mb-3">Company</div>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li><a href="#about" className="hover:underline">About</a></li>
              <li><Link href="/contact" className="hover:underline">Contact</Link></li>
              <li><a href="#blog" className="hover:underline">Blog</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold mb-3">Legal</div>
            <ul className="space-y-2 text-sm text-foreground/80">
              <li><Link href="/terms" className="hover:underline">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="hover:underline">Privacy Policy</Link></li>
              <li><Link href="/refund" className="hover:underline">Refund Policy</Link></li>
              <li><Link href="/shipping" className="hover:underline">Shipping Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 text-xs text-foreground/60">© {new Date().getFullYear()} WeDesign. All rights reserved.</div>
      </div>
    </footer>
  );
}



