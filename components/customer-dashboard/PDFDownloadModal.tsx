"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Search,
  Loader2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { usePayment } from "@/lib/payment";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface PDFDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  selectedCategory: string;
  totalResults: number;
  onPurchaseComplete: (purchase: PDFPurchase) => void;
}

export interface PDFPurchase {
  id: string;
  type: "free" | "paid";
  quantity: number;
  selectionType: "firstN" | "selected";
  price: number;
  searchQuery: string;
  category: string;
  purchasedAt: string;
  downloaded: boolean;
  selectedDesignIds?: number[];
}

const PDF_OPTIONS = [50, 100, 200, 300, 400, 500];
const PRICE_PER_DESIGN_SELECTED = 4;
const PRICE_PER_DESIGN_FIRSTN = 2;

export default function PDFDownloadModal({
  isOpen,
  onClose,
  searchQuery,
  selectedCategory,
  totalResults,
  onPurchaseComplete,
}: PDFDownloadModalProps) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(50);
  const [selectionType, setSelectionType] = useState<"firstN" | "selected">("firstN");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentDownloadId, setCurrentDownloadId] = useState<number | null>(null);
  const [pricingInfo, setPricingInfo] = useState<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { processPayment } = usePayment();
  const queryClient = useQueryClient();

  const isAuthenticated = !!user;

  // Check eligibility when modal opens
  const { data: eligibilityData } = useQuery({
    queryKey: ['pdfEligibility'],
    queryFn: async () => {
      const response = await apiClient.checkPDFEligibility();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    enabled: isOpen && isAuthenticated,
    staleTime: 60 * 1000, // 1 minute
  });

  // Fetch pricing info
  useEffect(() => {
    if (isOpen) {
      apiClient.getPDFPricingInfo().then((response) => {
        if (response.data) {
          setPricingInfo(response.data);
        }
      });
    }
  }, [isOpen]);

  const freePDFUsed = !eligibilityData?.is_eligible;
  const freeDownloadsUsed = eligibilityData?.free_downloads_used || 0;

  // Poll for PDF status when download is processing
  const { data: pdfStatus } = useQuery({
    queryKey: ['pdfStatus', currentDownloadId],
    queryFn: async () => {
      if (!currentDownloadId) return null;
      const response = await apiClient.getPDFStatus(currentDownloadId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    enabled: !!currentDownloadId && isOpen,
    refetchInterval: (data) => {
      // Poll every 3 seconds if status is pending or processing
      if (data?.status === 'pending' || data?.status === 'processing') {
        return 3000;
      }
      return false; // Stop polling when completed or failed
    },
  });

  useEffect(() => {
    setIsMounted(true);
    
    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentDownloadId(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Handle status changes
  useEffect(() => {
    if (pdfStatus) {
      if (pdfStatus.status === 'completed') {
        // Stop polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        toast({
          title: "PDF ready!",
          description: "Your PDF has been generated and is ready to download.",
        });

        // Refresh PDF downloads list
        queryClient.invalidateQueries({ queryKey: ['pdfDownloads'] });
        queryClient.invalidateQueries({ queryKey: ['downloads'] });
      } else if (pdfStatus.status === 'failed') {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        toast({
          title: "PDF generation failed",
          description: "Failed to generate PDF. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [pdfStatus, toast, queryClient]);

  const calculatePrice = () => {
    if (!freePDFUsed && quantity === 50 && isAuthenticated) {
      return 0; // Free PDF
    }
    
    // Use pricing from API if available
    if (pricingInfo) {
      const pricePerDesign = selectionType === "selected" 
        ? pricingInfo.price_per_design_selected || PRICE_PER_DESIGN_SELECTED
        : pricingInfo.price_per_design_firstn || PRICE_PER_DESIGN_FIRSTN;
      return quantity * pricePerDesign;
    }
    
    // Fallback to default pricing
    if (selectionType === "selected") {
      return quantity * PRICE_PER_DESIGN_SELECTED;
    }
    return quantity * PRICE_PER_DESIGN_FIRSTN;
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to download PDFs",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const downloadType = !freePDFUsed && quantity === 50 ? "free" : "paid";
      const price = calculatePrice();

      // Step 1: Create PDF request
      const createResponse = await apiClient.createPDFRequest({
        download_type: downloadType,
        total_pages: quantity,
        selection_type: selectionType === "firstN" ? "search_results" : "specific",
        search_filters: {
          q: searchQuery,
          category: selectedCategory !== "all" ? selectedCategory : undefined,
        },
      });

      if (createResponse.error || !createResponse.data) {
        throw new Error(createResponse.error || 'Failed to create PDF request');
      }

      const downloadId = createResponse.data.download_id || createResponse.data.id || createResponse.data.pdf_download?.id;
      if (!downloadId) {
        throw new Error('Failed to get download ID from response');
      }
      setCurrentDownloadId(Number(downloadId));

      // Step 2: Handle payment if paid
      if (downloadType === "paid" && price > 0) {
        const paymentResult = await processPayment(
          price,
          downloadId.toString(),
          `PDF Download - ${quantity} designs`,
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
        );

        if (!paymentResult.success) {
          throw new Error(paymentResult.error || 'Payment failed');
        }
      }

      // Step 3: Start polling for status
      toast({
        title: "PDF request created",
        description: downloadType === "free" 
          ? "Your free PDF is being generated. This may take a few moments."
          : "Your PDF is being generated. This may take a few moments.",
      });

      // Refresh eligibility
      queryClient.invalidateQueries({ queryKey: ['pdfEligibility'] });

      // Create purchase object for callback
      const purchase: PDFPurchase = {
        id: downloadId.toString(),
        type: downloadType,
        quantity,
        selectionType,
        price,
        searchQuery,
        category: selectedCategory,
        purchasedAt: new Date().toISOString(),
        downloaded: false,
      };

      onPurchaseComplete(purchase);
      
      // Don't close modal immediately - show status
      // Modal will be closed when user clicks close or when PDF is ready
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create PDF request",
        variant: "destructive",
      });
      setIsProcessing(false);
      setCurrentDownloadId(null);
    }
  };

  if (!isOpen) return null;

  const price = calculatePrice();
  const canUseFree = !freePDFUsed && quantity === 50 && isAuthenticated;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Download Mock PDF</h2>
                <p className="text-sm text-muted-foreground">
                  Get PDF of designs for current search
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Authentication Status */}
            <Card className="p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
              <div className="flex items-start gap-3">
                {isAuthenticated ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">
                    {isAuthenticated ? "Authenticated User" : "Guest User"}
                  </h3>
                  {isAuthenticated ? (
                    <p className="text-sm text-muted-foreground">
                      {!freePDFUsed ? (
                        <span>
                          You're eligible for <strong>1 free PDF</strong> of 50 designs for your current search.
                        </span>
                      ) : (
                        <span>
                          Free PDF has been used ({freeDownloadsUsed} used). Purchase additional PDFs below.
                        </span>
                      )}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Sign in to get 1 free PDF of 50 designs for your current search.
                      </p>
                      <Button size="sm" variant="outline" onClick={onClose}>
                        Sign In
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Current Search Info */}
            <Card className="p-4 border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Search className="w-4 h-4" />
                <span>Current Search</span>
              </div>
              <div className="space-y-1">
                <p className="font-semibold">
                  {searchQuery || "All Designs"}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedCategory}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {totalResults} designs found
                  </span>
                </div>
              </div>
            </Card>

            {/* Quantity Selection */}
            <div>
              <label className="text-base font-semibold mb-3 block">
                Number of Designs
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PDF_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setQuantity(opt)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      quantity === opt
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="text-lg font-bold">{opt}</div>
                    <div className="text-xs text-muted-foreground">Designs</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selection Type */}
            <div>
              <label className="text-base font-semibold mb-3 block">
                Selection Method
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectionType("firstN")}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectionType === "firstN"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-semibold mb-1">First N Designs</div>
                  <div className="text-sm text-muted-foreground mb-2">
                    First {quantity} designs from search results
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ₹{PRICE_PER_DESIGN_FIRSTN} per design
                  </div>
                </button>
                <button
                  onClick={() => setSelectionType("selected")}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectionType === "selected"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-semibold mb-1">Select Designs</div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Choose specific {quantity} designs
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ₹{PRICE_PER_DESIGN_SELECTED} per design
                  </div>
                </button>
              </div>
            </div>

            {/* Price Summary */}
            <Card className="p-4 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-semibold">{quantity} designs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Selection Method</span>
                  <span className="font-semibold">
                    {selectionType === "firstN" ? "First N Designs" : "Select Designs"}
                  </span>
                </div>
                {canUseFree ? (
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Total</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg line-through text-muted-foreground">
                          ₹{quantity * (selectionType === "selected" ? PRICE_PER_DESIGN_SELECTED : PRICE_PER_DESIGN_FIRSTN)}
                        </span>
                        <span className="text-2xl font-bold text-green-500">FREE</span>
                      </div>
                    </div>
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                      Free PDF for Authenticated Users
                    </Badge>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Price per Design</span>
                      <span className="font-semibold">
                        ₹{selectionType === "selected" ? PRICE_PER_DESIGN_SELECTED : PRICE_PER_DESIGN_FIRSTN}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xl font-bold">Total</span>
                      <span className="text-2xl font-bold text-primary">₹{price}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* PDF Status Display */}
            {currentDownloadId && pdfStatus && (
              <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                <div className="flex items-start gap-3">
                  {pdfStatus.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : pdfStatus.status === 'failed' ? (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5 animate-spin" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">
                      {pdfStatus.status === 'completed' && 'PDF Ready!'}
                      {pdfStatus.status === 'processing' && 'Generating PDF...'}
                      {pdfStatus.status === 'pending' && 'PDF Request Pending'}
                      {pdfStatus.status === 'failed' && 'PDF Generation Failed'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {pdfStatus.status === 'completed' && 'Your PDF is ready to download.'}
                      {pdfStatus.status === 'processing' && 'Please wait while we generate your PDF. This may take a few moments.'}
                      {pdfStatus.status === 'pending' && 'Your PDF request is being processed.'}
                      {pdfStatus.status === 'failed' && 'Failed to generate PDF. Please try again.'}
                    </p>
                    {pdfStatus.status === 'completed' && (
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await apiClient.downloadPDF(currentDownloadId);
                            if (response.error) {
                              throw new Error(response.error);
                            }
                            if (response.data instanceof Blob) {
                              const url = window.URL.createObjectURL(response.data);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `designs_${currentDownloadId}.pdf`;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                              toast({
                                title: "Download started",
                                description: "Your PDF is being downloaded.",
                              });
                              onClose();
                            }
                          } catch (error: any) {
                            toast({
                              title: "Download failed",
                              description: error.message || "Failed to download PDF",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isProcessing || (currentDownloadId && pdfStatus?.status !== 'completed')}
              >
                {currentDownloadId && pdfStatus?.status === 'completed' ? 'Close' : 'Cancel'}
              </Button>
              {(!currentDownloadId || pdfStatus?.status === 'failed') && (
                <Button
                  onClick={handlePurchase}
                  className="flex-1"
                  disabled={isProcessing || !isAuthenticated}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      {canUseFree ? "Get Free PDF" : `Pay ₹${price}`}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

