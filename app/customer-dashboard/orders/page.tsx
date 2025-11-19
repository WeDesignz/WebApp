"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrdersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to customer dashboard with orders view
    router.replace('/customer-dashboard?view=orders');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to My Orders...</p>
      </div>
    </div>
  );
}

