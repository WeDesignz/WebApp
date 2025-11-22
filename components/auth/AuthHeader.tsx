"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, LogIn, UserPlus, KeyRound, Home, Lock } from 'lucide-react';

export default function AuthHeader() {
  const pathname = usePathname();

  const authPages = [
    { href: '/auth/login', label: 'Sign In', icon: LogIn },
    { href: '/auth/register', label: 'Create Account', icon: UserPlus },
    { href: '/auth/reset-password', label: 'Reset Password', icon: KeyRound },
    { href: '/auth/set-password', label: 'Set Password', icon: Lock },
  ];

  const currentPage = authPages.find(page => 
    page.href === '/auth/set-password' 
      ? pathname?.startsWith('/auth/set-password')
      : pathname === page.href
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img 
            src="/Logos/WD LOGO.svg" 
            alt="WeDesign" 
            className="h-8 w-auto"
          />
        </Link>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {currentPage ? (
                  <>
                    <currentPage.icon className="h-4 w-4" />
                    {currentPage.label}
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Authentication
                  </>
                )}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm font-semibold">Authentication</div>
              <DropdownMenuSeparator />
              {authPages.map(page => (
                <DropdownMenuItem key={page.href} asChild>
                  <Link
                    href={page.href}
                    className={`flex items-center gap-2 cursor-pointer ${
                      pathname === page.href ? 'bg-accent' : ''
                    }`}
                  >
                    <page.icon className="h-4 w-4" />
                    {page.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
