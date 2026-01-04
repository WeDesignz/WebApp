"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

/**
 * Component that forces dark theme on public pages.
 * Should be used at the top level of public pages to ensure
 * they always display in dark theme regardless of theme settings
 * from authenticated sections (customer dashboard, designer console).
 */
export default function PublicPageTheme() {
  const { setTheme } = useTheme();

  useEffect(() => {
    // Force dark theme when component mounts
    setTheme("dark");
  }, [setTheme]);

  // This component doesn't render anything
  return null;
}

