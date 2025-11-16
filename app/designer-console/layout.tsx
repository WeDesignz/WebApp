"use client";

import { DesignerVerificationProvider } from "@/contexts/DesignerVerificationContext";
import DesignerConsoleGuard from "@/components/auth/DesignerConsoleGuard";

export default function DesignerConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DesignerConsoleGuard>
      <DesignerVerificationProvider>
        {children}
      </DesignerVerificationProvider>
    </DesignerConsoleGuard>
  );
}

