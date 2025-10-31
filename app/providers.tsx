"use client";

import { ReactNode, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { CartWishlistProvider } from "@/contexts/CartWishlistContext";

export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <CartWishlistProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </CartWishlistProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}


