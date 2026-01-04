"use client";

import { ReactNode } from "react";
import PublicPageTheme from "./PublicPageTheme";

/**
 * Wrapper component for public pages that forces dark theme.
 * Use this to wrap the content of server component pages that should
 * always display in dark theme.
 */
export default function PublicPageWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicPageTheme />
      {children}
    </>
  );
}

