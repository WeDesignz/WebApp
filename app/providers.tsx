"use client";

import { ReactNode, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { CartWishlistProvider } from "@/contexts/CartWishlistContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors
              if (error?.response?.status >= 400 && error?.response?.status < 500) {
                return false;
              }
              return failureCount < 3;
            },
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={client}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <CartWishlistProvider>
              <TooltipProvider>
                {children}
                <Toaster />
                <SonnerToaster position="top-center" richColors />
              </TooltipProvider>
            </CartWishlistProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}


