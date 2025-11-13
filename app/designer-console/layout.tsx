"use client";

import { DesignerVerificationProvider } from "@/contexts/DesignerVerificationContext";

export default function DesignerConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DesignerVerificationProvider>
      {children}
    </DesignerVerificationProvider>
  );
}

