"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, Loader2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { catalogAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface LensSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSearchComplete: (products: any[]) => void;
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

  // Cleanup camera stream when modal closes
  useEffect(() => {
    if (!open) {
      stopCamera();
      setSelectedImage(null);
      setPreviewUrl(null);
      setShowCamera(false);
      setCameraError(null);
    }
  }, [open]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG, or WebP)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      stopCamera();
      setShowCamera(false);
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
      console.error('Camera error:', error);
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
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(blob));
            stopCamera();
            setShowCamera(false);
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleSearch = async () => {
    if (!selectedImage) return;

    setIsSearching(true);
    try {
      const response = await catalogAPI.lensSearch(selectedImage, 20);

      if (response.error) {
        toast({
          title: "Search failed",
          description: response.error || "Could not search for similar products",
          variant: "destructive",
        });
        return;
      }

      if (response.data) {
        onSearchComplete(response.data.products || []);
        toast({
          title: "Search complete",
          description: `Found ${response.data.count || 0} similar products`,
        });
        onClose();
      }
    } catch (error: any) {
      console.error('Lens search error:', error);
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
                    onClick={() => {
                      setSelectedImage(null);
                      setPreviewUrl(null);
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                      }
                    }}
                    className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Upload File Option */}
                  <button
                    onClick={handleUploadClick}
                    className="flex-1 p-8 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="w-12 h-12 text-muted-foreground" />
                      <div className="text-center">
                        <p className="font-medium">Upload Image</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          JPG, PNG, or WebP (max 10MB)
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Camera Option */}
                  <button
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
                  Searching...
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
