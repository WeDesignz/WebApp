"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Facebook, 
  Instagram, 
  Mail,
  ArrowRight,
  Heart
} from 'lucide-react';

// Custom icon components for Pinterest and Threads
const PinterestIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49-.09-.79-.17-2.01.03-2.87l1.26-5.36s-.32-.64-.32-1.59c0-1.49.86-2.6 1.93-2.6.91 0 1.35.68 1.35 1.5 0 .91-.58 2.28-.88 3.54-.25 1.06.54 1.93 1.6 1.93 1.92 0 3.4-2.03 3.4-4.96 0-2.59-1.86-4.4-4.53-4.4-3.08 0-4.89 2.31-4.89 4.7 0 .91.35 1.89.79 2.48.09.1.1.19.07.3l-.28 1.13c-.04.17-.14.21-.33.13-1.24-.58-2.02-2.4-2.02-3.86 0-3.16 2.3-6.06 6.63-6.06 3.48 0 6.18 2.48 6.18 5.79 0 3.46-2.18 6.24-5.21 6.24-1.02 0-1.97-.53-2.3-1.23l-.63 2.4c-.23.89-.85 2.01-1.27 2.69.96.3 1.97.45 3.01.45 5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
  </svg>
);

const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 192 192" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z"/>
  </svg>
);

const footerLinks = {
  product: [
    { name: 'Browse Designs', href: '/customer-dashboard' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Categories', href: '#gallery' },
    { name: 'Featured', href: '#featured' },
  ],
  creators: [
    { name: 'Designer Console', href: '/designer-console' },
    { name: 'Upload Design', href: '/designer-console/upload' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ],
  legal: [
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Refund Policy', href: '/refund' },
  ],
};

const socialLinks = [
  { name: 'Pinterest', icon: PinterestIcon, href: '#' },
  { name: 'Facebook', icon: Facebook, href: '#' },
  { name: 'Instagram', icon: Instagram, href: '#' },
  { name: 'Threads', icon: ThreadsIcon, href: '#' },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden">
      <div className="border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6 md:px-8 pt-16 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-12 lg:gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Link href="/" className="inline-flex items-center gap-2.5 flex-shrink-0">
                <img 
                  src="/Logos/ONLY LOGO.png" 
                  alt="WeDesignz logo" 
                  className="h-10 w-auto brightness-0 invert"
                />
                <img 
                  src="/Logos/ONLY TEXT.png" 
                  alt="WeDesignz" 
                  className="h-7 w-auto brightness-0 invert"
                />
              </Link>
              
              <p className="text-foreground/70 text-sm leading-relaxed max-w-xs">
                The premier marketplace connecting talented designers with customers worldwide. Discover, collect, and sell extraordinary designs.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-foreground/70">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <a href="mailto:support@wedesignz.com" className="hover:text-primary transition-colors">support@wedesignz.com</a>
                    <a href="mailto:info@wedesignz.com" className="hover:text-primary transition-colors">info@wedesignz.com</a>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-full bg-foreground/5 border border-border/50 flex items-center justify-center text-foreground/70 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                    aria-label={social.name}
                  >
                    <social.icon className="w-4 h-4" />
                  </motion.a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground/90 mb-4">
                Product
              </h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-sm text-foreground/60 hover:text-primary transition-colors inline-flex items-center gap-1 group"
                    >
                      {link.name}
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground/90 mb-4">
                For Creators
              </h3>
              <ul className="space-y-3">
                {footerLinks.creators.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-sm text-foreground/60 hover:text-primary transition-colors inline-flex items-center gap-1 group"
                    >
                      {link.name}
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground/90 mb-4">
                Company
              </h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-sm text-foreground/60 hover:text-primary transition-colors inline-flex items-center gap-1 group"
                    >
                      {link.name}
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground/90 mb-4">
                Legal
              </h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-sm text-foreground/60 hover:text-primary transition-colors inline-flex items-center gap-1 group"
                    >
                      {link.name}
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-6 text-xs text-foreground/50">
                <span>© {new Date().getFullYear()} WeDesignz. All rights reserved.</span>
              </div>
              
              <div className="flex items-center gap-1 text-xs text-foreground/50">
                <span>Made with</span>
                <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                <span>for designers worldwide</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
