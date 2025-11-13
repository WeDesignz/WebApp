"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonLoaderProps {
  variant?: "card" | "list" | "table" | "form" | "text" | "image" | "custom";
  count?: number;
  className?: string;
}

/**
 * Pre-configured skeleton loaders for common content types
 */
export function SkeletonLoader({
  variant = "card",
  count = 1,
  className,
}: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case "card":
        return (
          <div className="space-y-3">
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        );

      case "list":
        return (
          <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        );

      case "table":
        return (
          <div className="space-y-3">
            <div className="flex gap-4">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
            </div>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 w-24" />
              </div>
            ))}
          </div>
        );

      case "form":
        return (
          <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        );

      case "text":
        return (
          <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
              <Skeleton
                key={i}
                className={cn(
                  "h-4",
                  i === count - 1 ? "w-3/4" : "w-full"
                )}
              />
            ))}
          </div>
        );

      case "image":
        return <Skeleton className="h-64 w-full rounded-lg" />;

      case "custom":
        return <Skeleton className={cn("h-4 w-full", className)} />;

      default:
        return <Skeleton className="h-4 w-full" />;
    }
  };

  return <div className={className}>{renderSkeleton()}</div>;
}

/**
 * Skeleton for KPI cards
 */
export function SkeletonKPICard() {
  return (
    <div className="p-6 rounded-lg border bg-card">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

/**
 * Skeleton for design cards
 */
export function SkeletonDesignCard() {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for transaction rows
 */
export function SkeletonTransactionRow() {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4 flex-1">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-6 w-24" />
    </div>
  );
}

