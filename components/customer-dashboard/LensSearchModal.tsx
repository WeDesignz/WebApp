"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Upload, X, Loader2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { catalogAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type LensSearchResponse = Awaited<ReturnType<typeof catalogAPI.lensSearch>>;

interface LensSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSearchComplete: (products: any[]) => void;
}

function isAbortedResponse(r: LensSearchResponse): boolean {
  return r.error === "aborted";
}

export default function LensSearchModal({
  open,
  onClose,
  onSearchComplete,
}: LensSearchModalProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const { toast } = useToast();

  const selectedFileRef = useRef<File | null>(null);
  const searchPromiseRef = useRef<Promise<LensSearchResponse> | null>(null);
  const searchResponseRef = useRef<LensSearchResponse | null>(null);
  const prefetchAbortRef = useRef<AbortController | null>(null);

  const [prefetchLoading, setPrefetchLoading] = useState(false);
  const [prefetchReady, setPrefetchReady] = useState(false);
  const [prefetchError, setPrefetchError] = useState<string | null>(null);
  const [isUploadDragOver, setIsUploadDragOver] = useState(false);
  const uploadDragDepthRef = useRef(0);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const resetPrefetchState = useCallback(() => {
    prefetchAbortRef.current?.abort();
    prefetchAbortRef.current = null;
    searchPromiseRef.current = null;
    searchResponseRef.current = null;
    setPrefetchLoading(false);
    setPrefetchReady(false);
    setPrefetchError(null);
  }, []);

  // Prefetch lens search as soon as an image is selected (same promise reused on Search click)
  useEffect(() => {
    selectedFileRef.current = selectedImage;

    if (!open || !selectedImage) {
      resetPrefetchState();
      return;
    }

    prefetchAbortRef.current?.abort();
    const ac = new AbortController();
    prefetchAbortRef.current = ac;

    const file = selectedImage;
    setPrefetchLoading(true);
    setPrefetchReady(false);
    setPrefetchError(null);
    searchResponseRef.current = null;

    const promise = catalogAPI.lensSearch(file, 20, ac.signal);
    searchPromiseRef.current = promise;

    promise.then((response) => {
      if (selectedFileRef.current !== file) return;
      if (isAbortedResponse(response)) return;

      searchResponseRef.current = response;
      setPrefetchLoading(false);

      if (response.error) {
        setPrefetchReady(false);
        setPrefetchError(response.error === "aborted" ? null : response.error);
        return;
      }

      if (response.data) {
        setPrefetchReady(true);
        setPrefetchError(null);
      }
    });

    return () => {
      ac.abort();
    };
  }, [selectedImage, open, resetPrefetchState]);

  // Cleanup camera stream when modal closes
  useEffect(() => {
    if (!open) {
      stopCamera();
      setSelectedImage(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setShowCamera(false);
      setCameraError(null);
      resetPrefetchState();
      uploadDragDepthRef.current = 0;
      setIsUploadDragOver(false);
    }
  }, [open, resetPrefetchState]);

  const applyImageFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG, or WebP)",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      setSelectedImage(file);
      stopCamera();
      setShowCamera(false);
    },
    [toast]
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) applyImageFile(file);
  };

  const onUploadDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    uploadDragDepthRef.current += 1;
    if (e.dataTransfer.types.includes("Files")) {
      setIsUploadDragOver(true);
    }
  };

  const onUploadDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    uploadDragDepthRef.current -= 1;
    if (uploadDragDepthRef.current <= 0) {
      uploadDragDepthRef.current = 0;
      setIsUploadDragOver(false);
    }
  };

  const onUploadDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const onUploadDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    uploadDragDepthRef.current = 0;
    setIsUploadDragOver(false);

    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      applyImageFile(dropped);
    }
  };

  const handleCameraCapture = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (error: any) {
      setCameraError('Could not access camera. Please check permissions or use file upload.');
      toast({
        title: "Camera access denied",
        description: "Please allow camera access or upload an image file instead",
        variant: "destructive",
      });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            applyImageFile(file);
          }
        }, 'image/jpeg');
      }
    }
  };

  const applySearchSuccess = (products: any[], count: number) => {
    onSearchComplete(products);
    toast({
      title: "Search complete",
      description: `Found ${count} similar products`,
    });
    onClose();
  };

  const handleSearch = async () => {
    if (!selectedImage) return;

    const file = selectedImage;
    setIsSearching(true);
    try {
      let response: LensSearchResponse;
      const prefetched = searchResponseRef.current;
      if (prefetched && selectedFileRef.current === file) {
        response = prefetched;
      } else {
        const pending = searchPromiseRef.current;
        if (pending && selectedFileRef.current === file) {
          response = await pending;
        } else {
          response = await catalogAPI.lensSearch(file, 20);
        }
      }

      if (selectedFileRef.current !== file) return;

      if (isAbortedResponse(response) || response.error) {
        response = await catalogAPI.lensSearch(file, 20);
        if (selectedFileRef.current !== file) return;
      }

      if (response.error) {
        if (response.error === "aborted") {
          return;
        }
        const details = (response as { errorDetails?: { details?: string } }).errorDetails?.details;
        toast({
          title: "Search failed",
          description: details ? `${response.error} (${details})` : (response.error || "Could not search for similar products"),
          variant: "destructive",
        });
        return;
      }

      if (response.data) {
        searchResponseRef.current = response;
        const products = response.data.products || [];
        const count = response.data.count || 0;
        applySearchSuccess(products, count);
      }
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error.message || "An error occurred while searching",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    if (showCamera) {
      capturePhoto();
    } else {
      handleCameraCapture();
    }
  };

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImage(null);
    setPreviewUrl(null);
    uploadDragDepthRef.current = 0;
    setIsUploadDragOver(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Search by Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera View */}
          {showCamera && (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-[400px] object-cover rounded-lg bg-black"
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                <Button
                  onClick={handleCameraClick}
                  size="lg"
                  className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90"
                >
                  <Camera className="w-8 h-8" />
                </Button>
                <Button
                  onClick={() => {
                    stopCamera();
                    setShowCamera(false);
                  }}
                  variant="destructive"
                  size="lg"
                  className="w-16 h-16 rounded-full"
                >
                  <X className="w-8 h-8" />
                </Button>
              </div>
            </div>
          )}

          {/* Image Preview or Upload Options */}
          {!showCamera && (
            <>
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-[400px] object-contain rounded-lg bg-muted border border-border"
                  />
                  <button
                    type="button"
                    onClick={clearPreview}
                    className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Upload / drag-and-drop zone */}
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    onDragEnter={onUploadDragEnter}
                    onDragLeave={onUploadDragLeave}
                    onDragOver={onUploadDragOver}
                    onDrop={onUploadDrop}
                    className={`flex-1 p-8 border-2 border-dashed rounded-lg transition-all cursor-pointer ${
                      isUploadDragOver
                        ? "border-primary bg-primary/10 scale-[1.01]"
                        : "border-border hover:border-primary hover:bg-primary/5"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3 pointer-events-none">
                      <Upload className="w-12 h-12 text-muted-foreground" />
                      <div className="text-center">
                        <p className="font-medium">Drag &amp; drop or upload</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          JPG, PNG, or WebP (max 10MB)
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Camera Option */}
                  <button
                    type="button"
                    onClick={handleCameraClick}
                    className="flex-1 p-8 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Camera className="w-12 h-12 text-muted-foreground" />
                      <div className="text-center">
                        <p className="font-medium">Take Photo</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Use your camera
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Camera Error */}
          {cameraError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {cameraError}
            </div>
          )}

          {selectedImage && !showCamera && (
            <div className="text-sm text-muted-foreground min-h-[1.25rem]">
              {prefetchLoading && (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  Finding similar products…
                </span>
              )}
              {prefetchReady && !prefetchLoading && (
                <span>Ready — tap Search to view results.</span>
              )}
              {prefetchError && !prefetchLoading && (
                <span className="text-destructive">
                  Could not prepare search. Tap Search to retry.
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isSearching}>
              Cancel
            </Button>
            <Button
              onClick={handleSearch}
              disabled={!selectedImage || isSearching}
              className="min-w-[100px]"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching…
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
