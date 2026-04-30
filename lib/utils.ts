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
 * Trigger a file download from a Blob in a way that works on desktop.
 * On mobile, use downloadPDFToDevice() with signed URL so the file saves to device storage.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export type DownloadPDFToDeviceOptions = {
  onProgress?: (percent: number) => void
  onComplete?: () => void
  onError?: (message: string) => void
  /** Called when PDF is being generated on-demand (202). Use to invalidate queries and show "Generating..." toast. */
  onGenerating?: () => void
  getDownloadUrl: (downloadId: number) => Promise<{ data?: { url: string }; error?: string }>
  downloadPDF: (downloadId: number, onProgress?: (percent: number) => void) => Promise<{ data?: Blob; filename?: string | null; error?: string; status?: string }>
}

/**
 * Download PDF so it saves to device storage. On mobile, uses a signed URL so the
 * browser receives Content-Disposition: attachment and saves to Downloads/Files.
 * On desktop, fetches with progress and triggers blob download.
 */
export async function downloadPDFToDevice(
  downloadId: number,
  options: DownloadPDFToDeviceOptions
): Promise<void> {
  const { onProgress, onComplete, onError, onGenerating, getDownloadUrl, downloadPDF } = options
  const isMobile = isMobileDevice()

  if (isMobile) {
    try {
      onProgress?.(10) // Preparing
      const urlRes = await getDownloadUrl(downloadId)
      if (urlRes.error || !urlRes.data?.url) {
        onError?.(urlRes.error || 'Could not get download link')
        return
      }
      onProgress?.(50) // Redirecting – file will save to device (Downloads/Files)
      window.location.href = urlRes.data.url
      onProgress?.(100)
      onComplete?.()
    } catch (e: any) {
      onError?.(e?.message || 'Download failed')
    }
    return
  }

  try {
    // When backend responds 202 (generating), keep polling until ready and then auto-download.
    const MAX_ATTEMPTS = 30 // ~60s total with 2s interval
    const POLL_INTERVAL_MS = 2000
    let generationNotified = false

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const result = await downloadPDF(downloadId, onProgress)

      if ((result as any)?.status === 'generating') {
        if (!generationNotified) {
          generationNotified = true
          onGenerating?.()
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
        continue
      }

      if (result.error) {
        onError?.(result.error)
        return
      }

      if (result.data instanceof Blob) {
        const filename = (result as { filename?: string | null }).filename || `designs_${downloadId}.pdf`
        triggerBlobDownload(result.data, filename)
        onComplete?.()
        return
      }

      onError?.('Download failed')
      return
    }

    onError?.('PDF generation is taking longer than expected. Please try again in a moment.')
  } catch (e: any) {
    onError?.(e?.message || 'Download failed')
  }
}

