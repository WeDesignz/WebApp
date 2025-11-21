"use client";

import { DesignerVerificationProvider } from "@/contexts/DesignerVerificationContext";
import { StudioAccessProvider } from "@/contexts/StudioAccessContext";
import DesignerConsoleGuard from "@/components/auth/DesignerConsoleGuard";

export default function DesignerConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DesignerConsoleGuard>
      <DesignerVerificationProvider>
        <StudioAccessProvider>
          {children}
        </StudioAccessProvider>
      </DesignerVerificationProvider>
    </DesignerConsoleGuard>
  );
}

