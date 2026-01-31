import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for Tailwind class conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Detect if the user is on a mobile device (touch-first, or mobile UA). */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false
  const ua = navigator.userAgent
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0
  const narrow = typeof window.innerWidth !== "undefined" && window.innerWidth < 768
  return mobileUA || (hasTouch && narrow)
}

const BLOB_REVOKE_DELAY_MS = 60000

/**
 * Trigger a file download from a Blob in a way that works on mobile and desktop.
 * On mobile, programmatic a.click() often fails; we open the blob in a new tab
 * so the user can use the browser's share/save menu. On desktop we use an anchor click.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const isMobile = isMobileDevice()

  if (isMobile) {
    const w = window.open(url, "_blank", "noopener,noreferrer")
    if (!w) {
      window.URL.revokeObjectURL(url)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
    setTimeout(() => window.URL.revokeObjectURL(url), BLOB_REVOKE_DELAY_MS)
    return
  }

  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

