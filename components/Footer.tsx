"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Twitter, 
  Instagram, 
  Linkedin, 
  Github,
  Mail,
  MapPin,
  Phone,
  ArrowRight,
  Heart
} from 'lucide-react';

const footerLinks = {
  product: [
    { name: 'Browse Designs', href: '/customer-dashboard' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Categories', href: '#gallery' },
    { name: 'Featured', href: '#' },
  ],
  creators: [
    { name: 'Become a Designer', href: '/designer-onboarding' },
    { name: 'Designer Console', href: '/designer-console' },
    { name: 'Upload Design', href: '/designer-console/upload' },
    { name: 'Earnings', href: '/designer-console/earnings' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Careers', href: '#' },
    { name: 'Contact', href: '/contact' },
  ],
  legal: [
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Refund Policy', href: '/refund' },
    { name: 'Cookie Policy', href: '#' },
  ],
};

const socialLinks = [
  { name: 'Twitter', icon: Twitter, href: '#' },
  { name: 'Instagram', icon: Instagram, href: '#' },
  { name: 'LinkedIn', icon: Linkedin, href: '#' },
  { name: 'GitHub', icon: Github, href: '#' },
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
                  alt="WeDesignz Logo" 
                  className="h-10 w-auto object-contain brightness-0 invert"
                />
                <img 
                  src="/Logos/ONLY TEXT.png" 
                  alt="WeDesignz" 
                  className="h-7 w-auto object-contain brightness-0 invert"
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
                  <span>wedesignz006@gmail.com</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground/70">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <span>8000452183</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-foreground/70">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <span>Sheetal Fab, B-117, Akar Tower, B-block, Old RTO road, Yogi Tower, Bhilwara - 311001</span>
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
