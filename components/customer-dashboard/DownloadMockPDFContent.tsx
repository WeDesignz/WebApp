"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Download,
  Search,
  CheckCircle2,
  Loader2,
  Gift,
  FileText,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { catalogAPI, apiClient } from "@/lib/api";
import { transformProducts, type TransformedProduct } from "@/lib/utils/transformers";
import { useToast } from "@/hooks/use-toast";
import ProductModal from "@/components/customer-dashboard/ProductModal";
import { initializeRazorpayCheckout } from "@/lib/payment";

type Product = TransformedProduct;
type SelectionMode = "firstN" | "selected";

export default function DownloadMockPDFContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const observerRef = useRef<HTMLDivElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Selection mode: "firstN" or "selected"
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("firstN");
  
  // Selected designs (only for "selected" mode)
  const [selectedDesignIds, setSelectedDesignIds] = useState<Set<number>>(new Set());
  
  // Track if free PDF alert has been dismissed
  const [isFreePDFAlertDismissed, setIsFreePDFAlertDismissed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('freePDFAlertDismissed') === 'true';
    }
    return false;
  });
  
  // PDF config and eligibility
  const [pdfConfig, setPdfConfig] = useState<{
    free_pdf_designs_count: number;
    paid_pdf_designs_options: number[];
    pricing: {
      first_n_per_design: number;
      selected_per_design: number;
    };
  } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Customer information for mock PDF
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");

  const isAuthenticated = !!user;
  // Use first value of paid_pdf_designs_options as free designs count
  const freeDesignsCount = pdfConfig?.paid_pdf_designs_options?.[0] || pdfConfig?.free_pdf_designs_count || 50;
  
  // Design count selection (for paid downloads or when user wants to select count)
  const [selectedDesignCount, setSelectedDesignCount] = useState<number>(50);
  
  // Subscription mock PDF state
  const [useSubscriptionMockPDF, setUseSubscriptionMockPDF] = useState(false);

  // Fetch PDF configuration
  const { data: configData } = useQuery({
    queryKey: ['pdfConfig'],
    queryFn: async () => {
      const response = await apiClient.getPDFConfig();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (configData) {
      setPdfConfig(configData);
      // Set default design count to first option in paid PDF options (or free count if eligible)
      if (configData.paid_pdf_designs_options && configData.paid_pdf_designs_options.length > 0) {
        setSelectedDesignCount(configData.paid_pdf_designs_options[0]);
      }
    }
  }, [configData]);

  // Ensure selection mode is "firstN" when subscription mock PDF is enabled
  useEffect(() => {
    if (useSubscriptionMockPDF && selectionMode !== "firstN") {
      setSelectionMode("firstN");
      setSelectedDesignIds(new Set());
    }
  }, [useSubscriptionMockPDF, selectionMode]);

  // Refresh data when component mounts (navigating to page)
  useEffect(() => {
    // Reset selection state first
    setSelectedDesignIds(new Set());
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectionMode("firstN");
    
    // Reset design count to default when page loads
    if (pdfConfig?.paid_pdf_designs_options && pdfConfig.paid_pdf_designs_options.length > 0) {
      setSelectedDesignCount(pdfConfig.paid_pdf_designs_options[0]);
    }
    
    // Invalidate and refetch all relevant queries to refresh the page
    // This will automatically trigger refetch for all queries
    queryClient.invalidateQueries({ queryKey: ['freePDFDesigns'] });
    queryClient.invalidateQueries({ queryKey: ['pdfConfig'] });
    queryClient.invalidateQueries({ queryKey: ['pdfEligibility'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  }, []); // Run only on mount

  // Check eligibility
  const { data: eligibilityData } = useQuery({
    queryKey: ['pdfEligibility'],
    queryFn: async () => {
      const response = await apiClient.checkPDFEligibility();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const isEligible = eligibilityData?.is_eligible ?? false;
  
  // Fetch subscription info for mock PDF downloads
  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription', 'freeDownloads'],
    queryFn: async () => {
      const response = await apiClient.checkFreeDownloadsAvailability();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const hasSubscriptionMockPDF = (subscriptionData?.remaining_mock_pdf_downloads || 0) > 0;
  const subscriptionMockPDFCount = subscriptionData?.remaining_mock_pdf_downloads || 0;
  
  // Determine the actual design count to use
  // If using subscription mock PDF, use freeDesignsCount (first value of PAID_PDF_DESIGNS_OPTIONS)
  const actualDesignCount = useSubscriptionMockPDF 
    ? freeDesignsCount 
    : (isEligible ? freeDesignsCount : selectedDesignCount);

  // Fetch categories
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await catalogAPI.getCategories();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data?.categories || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Use categories directly like DownloadsContent does
  const categories = categoriesData || [];
  

  // Fetch designs
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['freePDFDesigns', searchQuery, selectedCategory, actualDesignCount],
    queryFn: async ({ pageParam = 1 }) => {
      if (searchQuery || (selectedCategory && selectedCategory !== 'all')) {
        const categoryId = selectedCategory && selectedCategory !== 'all' 
          ? parseInt(selectedCategory) 
          : undefined;
        
        const response = await catalogAPI.searchProducts({
          q: searchQuery || undefined,
          category: categoryId,
          page: pageParam,
        });

        if (response.error) {
          throw new Error(response.error);
        }

        const rawProducts = response.data?.results || [];
        // Filter products to only include those with mockup images
        const productsWithMockups = rawProducts.filter((product: any) => {
          if (!product.media || !Array.isArray(product.media) || product.media.length === 0) {
            return false;
          }
          // Check if any media item is marked as mockup
          return product.media.some((mediaItem: any) => {
            if (typeof mediaItem === 'string') {
              return false; // String URLs don't have mockup info
            }
            // Check is_mockup flag
            if (mediaItem.is_mockup === true) {
              return true;
            }
            // Check filename for "mockup"
            const fileName = mediaItem.file_name || '';
            if (fileName) {
              const fileNameLower = fileName.toLowerCase();
              const baseName = fileNameLower.split('.')[0];
              if (baseName === 'mockup' || fileNameLower.includes('mockup')) {
                return true;
              }
            }
            return false;
          });
        });

        return {
          products: transformProducts(productsWithMockups),
          page: response.data?.current_page || pageParam,
          hasNext: (response.data?.current_page || 0) < (response.data?.total_pages || 0),
        };
      } else {
        const response = await catalogAPI.getHomeFeed(pageParam);

        if (response.error) {
          throw new Error(response.error);
        }

        const rawProducts = response.data?.products || [];
        // Filter products to only include those with mockup images
        const productsWithMockups = rawProducts.filter((product: any) => {
          if (!product.media || !Array.isArray(product.media) || product.media.length === 0) {
            return false;
          }
          // Check if any media item is marked as mockup
          return product.media.some((mediaItem: any) => {
            if (typeof mediaItem === 'string') {
              return false; // String URLs don't have mockup info
            }
            // Check is_mockup flag
            if (mediaItem.is_mockup === true) {
              return true;
            }
            // Check filename for "mockup"
            const fileName = mediaItem.file_name || '';
            if (fileName) {
              const fileNameLower = fileName.toLowerCase();
              const baseName = fileNameLower.split('.')[0];
              if (baseName === 'mockup' || fileNameLower.includes('mockup')) {
                return true;
              }
            }
            return false;
          });
        });

        return {
          products: transformProducts(productsWithMockups),
          page: response.data?.page || pageParam,
          hasNext: response.data?.has_next || false,
        };
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasNext ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  // Products are already filtered in the queryFn to only include those with mockups
  const allProducts = data?.pages.flatMap(page => page.products) || [];
  
  // For "firstN" mode: limit products to the selected design count
  // For "selected" mode: show all products (no limit) so user can choose
  const products = selectionMode === "firstN" 
    ? allProducts.slice(0, actualDesignCount)
    : allProducts;
  
  // Get first N designs for "firstN" mode - this should match exactly what's displayed
  // IMPORTANT: The order of firstNDesigns must match the display order in the grid
  const firstNDesigns = selectionMode === "firstN" 
    ? products.slice(0, actualDesignCount)  // Already limited by products, but ensure exact count
    : [];
  
  // Get selected designs for "selected" mode
  const selectedDesigns = selectionMode === "selected"
    ? products.filter(p => selectedDesignIds.has(p.id))
    : [];

  // Infinite scroll observer - fetch more products based on selection mode
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          // For "firstN" mode: fetch more if we don't have enough products
          // For "selected" mode: always allow fetching more (no limit)
          if (selectionMode === "firstN") {
            if (products.length < actualDesignCount) {
          fetchNextPage();
            }
          } else {
            // "selected" mode: always fetch more when scrolling
          fetchNextPage();
          }
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, products.length, actualDesignCount, selectionMode]);

  const handleDesignToggle = (productId: number) => {
    if (selectionMode !== "selected") return;
    
    setSelectedDesignIds(prev => {
      const newSet = new Set(prev);
      const maxCount = isEligible ? freeDesignsCount : selectedDesignCount;
      
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        // For "selected" mode, user must select exactly the selected design count
        if (newSet.size < maxCount) {
          newSet.add(productId);
        } else {
          toast({
            title: "Selection limit reached",
            description: `You must select exactly ${maxCount} designs.`,
            variant: "destructive",
          });
        }
      }
      return newSet;
    });
  };

  const handleDownload = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to download PDFs",
        variant: "destructive",
      });
      return;
    }

    // Determine download type early for validation
    const downloadType = isFreeDownload ? "free" : "paid";
    
    // Validate customer information for paid downloads
    if (downloadType === "paid" && price > 0) {
      if (!customerName.trim()) {
        toast({
          title: "Customer name required",
          description: "Please enter customer name before proceeding",
          variant: "destructive",
        });
        return;
      }
      if (!customerMobile.trim()) {
        toast({
          title: "Customer mobile required",
          description: "Please enter customer mobile number before proceeding",
          variant: "destructive",
        });
        return;
      }
      
      // Validate mobile number: must be exactly 10 digits
      const mobileNumber = customerMobile.trim().replace(/\D/g, ''); // Remove non-digits
      if (mobileNumber.length !== 10) {
        toast({
          title: "Invalid mobile number",
          description: "Please enter a valid 10-digit mobile number",
          variant: "destructive",
        });
        return;
      }
    }

    // Check if enough designs are available/selected
    const requiredCount = isFreeDownload ? freeDesignsCount : selectedDesignCount;
    const selectedCount = selectionMode === "firstN" 
      ? firstNDesigns.length 
      : selectedDesignIds.size;
    
    // For "firstN" mode, require exactly the selected design count
    // For "selected" mode, require exactly the selected design count
    if (selectionMode === "selected") {
      if (selectedCount !== requiredCount) {
      toast({
          title: "Selection required",
          description: `Please select exactly ${requiredCount} designs to proceed.`,
        variant: "destructive",
      });
      return;
      }
    } else if (selectionMode === "firstN") {
      if (selectedCount === 0) {
        toast({
          title: "No products available",
          description: "No products found matching your filters. Please adjust your search or category.",
          variant: "destructive",
        });
        return;
      }
      // For paid downloads in "firstN" mode, we need exactly selectedDesignCount products
      if (!isFreeDownload && selectedCount !== requiredCount) {
      toast({
          title: "Insufficient products",
          description: `Please ensure at least ${requiredCount} products are loaded. Try adjusting your filters or scrolling to load more products.`,
        variant: "destructive",
      });
      return;
      }
    }

    setIsDownloading(true);

    try {
      let downloadId: number | null | undefined = null;

      if (selectionMode === "firstN") {
        // Use first N designs from current filtered results
        // IMPORTANT: Get product IDs in the exact same order as they appear on screen
        // firstNDesigns is already in display order (from the grid rendering)
        const firstNProductIds = firstNDesigns.map(p => p.id);
        
        // Use the required count (freeDesignsCount for free, selectedDesignCount for paid)
        const productCount = isFreeDownload ? freeDesignsCount : selectedDesignCount;
        // Ensure we're using exactly the first N products in display order
        const productIdsToUse = firstNProductIds.slice(0, productCount);
        
        // Ensure we have enough products
        if (productIdsToUse.length !== productCount) {
          throw new Error(`Not enough products available. Required: ${productCount}, Available: ${productIdsToUse.length}`);
        }


        // Create PDF request - for "firstN" mode, use "specific" selection type to preserve exact order
        const createResponse = await apiClient.createPDFRequest({
          download_type: downloadType,
          total_pages: productCount,
          selection_type: "specific", // Use "specific" to preserve the exact sequence as shown on screen
          selected_products: productIdsToUse, // This array preserves the exact order as shown on screen
          search_filters: {
          q: searchQuery || undefined,
            category: selectedCategory !== 'all' ? selectedCategory : undefined,
          },
          use_subscription_mock_pdf: useSubscriptionMockPDF,
          customer_name: customerName.trim(),
          customer_mobile: customerMobile.trim().replace(/\D/g, ''), // Ensure only digits
        });

        if (createResponse.error || !createResponse.data) {
          throw new Error(createResponse.error || 'Failed to create PDF request');
        }

        downloadId = createResponse.data.download_id || createResponse.data.id || createResponse.data.pdf_download?.id || null;
      } else {
        // Use selected designs - "Select N Design" mode
        const designIds = Array.from(selectedDesignIds);
        const productCount = isFreeDownload ? freeDesignsCount : selectedDesignCount;
        
        // Ensure we have exactly the required count
        if (designIds.length !== productCount) {
          throw new Error(`You must select exactly ${productCount} designs. Currently selected: ${designIds.length}`);
        }

        // Create PDF request with specific products - use "specific" selection type
        const createResponse = await apiClient.createPDFRequest({
          download_type: downloadType,
          total_pages: productCount,
          selection_type: "specific", // Specific product selection
          selected_products: designIds,
          use_subscription_mock_pdf: useSubscriptionMockPDF,
          customer_name: customerName.trim(),
          customer_mobile: customerMobile.trim().replace(/\D/g, ''), // Ensure only digits
        });

        if (createResponse.error || !createResponse.data) {
          throw new Error(createResponse.error || 'Failed to create PDF request');
        }

        downloadId = createResponse.data.download_id || createResponse.data.id || createResponse.data.pdf_download?.id;
      }

      if (!downloadId) {
        throw new Error('Failed to get download ID from response');
      }

      // Handle payment for paid downloads
      if (downloadType === "paid" && price > 0) {
        // Create PDF payment order
        const paymentOrderResponse = await apiClient.createPDFPaymentOrder({
          download_id: downloadId,
          amount: price,
        });

        if (paymentOrderResponse.error || !paymentOrderResponse.data) {
          throw new Error(paymentOrderResponse.error || 'Failed to create payment order');
        }

        const { razorpay_order_id, payment_id } = paymentOrderResponse.data;

        // Validate payment order response
        if (!razorpay_order_id || !payment_id) {
          console.error('Payment order response missing required fields:', {
            razorpay_order_id,
            payment_id,
            fullResponse: paymentOrderResponse.data
          });
          throw new Error('Invalid payment order response. Missing razorpay_order_id or payment_id.');
        }

        // Initialize Razorpay checkout
        const paymentResult = await initializeRazorpayCheckout({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
          amount: price * 100, // Convert rupees to paise
          currency: 'INR',
          name: 'WeDesign',
          description: `PDF Download - ${selectionMode === "firstN" ? selectedDesignCount : selectedDesignIds.size} design${(selectionMode === "firstN" ? selectedDesignCount : selectedDesignIds.size) !== 1 ? 's' : ''}`,
          order_id: razorpay_order_id,
          theme: {
            color: '#8B5CF6',
          },
        });

        if (!paymentResult.success || !paymentResult.razorpay_payment_id) {
          throw new Error(paymentResult.error || 'Payment failed or cancelled');
        }

        // Validate capture payment data
        if (!payment_id || !paymentResult.razorpay_payment_id || !price || price <= 0) {
          console.error('Invalid capture payment data:', {
            payment_id,
            razorpay_payment_id: paymentResult.razorpay_payment_id,
            amount: price
          });
          throw new Error('Invalid payment data. Missing payment_id, razorpay_payment_id, or amount.');
        }

        // Capture payment
        const captureResponse = await apiClient.capturePDFPayment({
          payment_id: payment_id,
          razorpay_payment_id: paymentResult.razorpay_payment_id,
          amount: price,
        });

        if (captureResponse.error) {
          // Log detailed error for debugging
          console.error('PDF Payment Capture Error:', {
            error: captureResponse.error,
            errorDetails: captureResponse.errorDetails,
            received_data: captureResponse.errorDetails?.originalError?.received_data
          });
          
          // Extract detailed error message
          const errorMessage = captureResponse.errorDetails?.originalError?.error 
            || captureResponse.errorDetails?.originalError?.received_data 
            || captureResponse.error 
            || 'Failed to capture payment';
          
          throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
        }

        toast({
          title: "Payment successful!",
          description: "Your PDF is being generated. This may take a few moments.",
        });

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['pdfEligibility'] });
        queryClient.invalidateQueries({ queryKey: ['pdfDownloads'] });
        queryClient.invalidateQueries({ queryKey: ['downloads'] });

        // Redirect to downloads page immediately
        router.push('/customer-dashboard?view=downloads');
      } else {
        // Free download
        toast({
          title: "PDF request created",
          description: "Your free PDF is being generated. This may take a few moments.",
        });

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['pdfEligibility'] });
        queryClient.invalidateQueries({ queryKey: ['pdfDownloads'] });

        // Redirect to downloads page immediately
        router.push('/customer-dashboard?view=downloads');
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process PDF request",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleProductClick = (product: Product) => {
    if (selectionMode === "selected") {
      handleDesignToggle(product.id);
    } else {
      setSelectedProduct(product);
      setIsModalOpen(true);
    }
  };

  // Determine if this is a free or paid download
  // Free: user is eligible OR using subscription mock PDF AND has exactly freeDesignsCount designs in "firstN" mode
  // Paid: user is NOT eligible AND NOT using subscription AND has exactly the selected design count
  const isFreeDownload = (isEligible || useSubscriptionMockPDF) && selectionMode === "firstN" && firstNDesigns.length === freeDesignsCount;
  const isPaidDownload = !isEligible && !useSubscriptionMockPDF && (
    (selectionMode === "firstN" && firstNDesigns.length === selectedDesignCount) ||
    (selectionMode === "selected" && selectedDesignIds.size === selectedDesignCount)
  );

  // Check if download button should be enabled
  // Free: must have exactly freeDesignsCount designs in "firstN" mode (for both regular free and subscription)
  // Paid: must have exactly the selected design count (for both "firstN" and "selected" modes)
  const canDownload = pdfConfig && (
    ((isEligible || useSubscriptionMockPDF) && selectionMode === "firstN" && firstNDesigns.length === freeDesignsCount) ||
    (!isEligible && !useSubscriptionMockPDF && (
      (selectionMode === "firstN" && firstNDesigns.length === selectedDesignCount) ||
      (selectionMode === "selected" && selectedDesignIds.size === selectedDesignCount)
    ))
  );
  
  // Calculate price for paid downloads
  const calculatePrice = () => {
    if (!pdfConfig || isEligible) return 0; // Free downloads are ₹0
    
    if (selectionMode === "selected") {
      // Use PAID_PDF_PRICE_PER_DESIGN_SELECTED for "Select N Design" mode
      // Price is based on the selected design count (user must select exactly this many)
      return selectedDesignCount * pdfConfig.pricing.selected_per_design;
    } else {
      // Use PAID_PDF_PRICE_PER_DESIGN_FIRSTN for "First N" mode
      return selectedDesignCount * pdfConfig.pricing.first_n_per_design;
    }
  };
  
  const price = calculatePrice();

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              {isEligible || useSubscriptionMockPDF ? (
                <>
              <Gift className="w-6 h-6 text-green-500" />
              Get Your Free Mock PDF
                </>
              ) : (
                <>
                  <Download className="w-6 h-6 text-primary" />
                  Download Mock PDF
                </>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isEligible || useSubscriptionMockPDF
                ? `Select ${freeDesignsCount} designs for your free PDF download`
                : `Select exactly ${freeDesignsCount} designs to download (payment required)`}
            </p>
          </div>
        </div>

        {/* Free Download Available Banner */}
        {isEligible && (
          <Card className="p-4 bg-green-500/10 border-green-500/20">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-semibold text-green-600 dark:text-green-400">Free Download Available</p>
                <p className="text-sm text-muted-foreground">
                  You have <span className="font-semibold text-green-600 dark:text-green-400">1 free PDF download</span> available. Select {freeDesignsCount} designs to get started!
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Subscription Mock PDF Option */}
        {hasSubscriptionMockPDF && (
          <Card className="p-4 bg-primary/10 border-primary/20">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold text-primary">Use Subscription Mock PDF</p>
                  <p className="text-sm text-muted-foreground">
                    {isEligible ? (
                      <>
                        You have <span className="font-semibold text-primary">{subscriptionMockPDFCount} mock PDF download{subscriptionMockPDFCount !== 1 ? 's' : ''}</span> available from your subscription. 
                        You can use these after your one-time free download, or use them now by enabling this option.
                      </>
                    ) : (
                      <>
                        You have <span className="font-semibold text-primary">{subscriptionMockPDFCount} mock PDF download{subscriptionMockPDFCount !== 1 ? 's' : ''}</span> available from your subscription. 
                        Select {freeDesignsCount} designs to use one.
                      </>
                    )}
                  </p>
                </div>
              </div>
              <Switch
                checked={useSubscriptionMockPDF}
                onCheckedChange={(checked) => {
                  setUseSubscriptionMockPDF(checked);
                  // Reset selection when toggling
                  setSelectedDesignIds(new Set());
                  // Switch to "firstN" mode when enabling subscription mock PDF
                  if (checked) {
                    setSelectionMode("firstN");
                  }
                }}
              />
            </div>
          </Card>
        )}

        {/* Eligibility Banner - Dismissable */}
        {!isEligible && !useSubscriptionMockPDF && !isFreePDFAlertDismissed && (
          <Card className="p-4 bg-destructive/10 border-destructive/20 relative">
            <button
              onClick={() => {
                setIsFreePDFAlertDismissed(true);
                localStorage.setItem('freePDFAlertDismissed', 'true');
              }}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 pr-6">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">Free PDF Already Used</p>
                <p className="text-sm text-muted-foreground">
                  You have already used your free PDF download. {hasSubscriptionMockPDF && 'You can use your subscription mock PDF downloads or '}Please use paid downloads for additional PDFs.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Design Count Selection (for paid downloads) */}
        {pdfConfig?.paid_pdf_designs_options && pdfConfig.paid_pdf_designs_options.length > 0 && (
          <Card className="p-4">
            <label className="text-base font-semibold mb-3 block">
              Number of Designs {(isEligible || useSubscriptionMockPDF) && "(for paid downloads)"}
            </label>
            <div className="flex gap-2 flex-wrap">
              {pdfConfig.paid_pdf_designs_options.map((opt, index) => {
                const isFirstOption = index === 0;
                const isEnabled = (!isEligible && !useSubscriptionMockPDF) || isFirstOption;
                
                return (
                  <button
                    key={opt}
                    onClick={() => {
                      if (isEnabled) {
                        setSelectedDesignCount(opt);
                        setSelectedDesignIds(new Set()); // Reset selection when count changes
                        // Refetch products to get the new count
                        queryClient.invalidateQueries({ queryKey: ['freePDFDesigns'] });
                      }
                    }}
                    disabled={!isEnabled}
                    className={`p-3 rounded-lg border-2 transition-all flex-1 min-w-[80px] ${
                      selectedDesignCount === opt && isEnabled
                        ? "border-primary bg-primary/10 text-primary"
                        : !isEnabled
                        ? "border-border opacity-50 cursor-not-allowed"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="text-lg font-bold">{opt}</div>
                    <div className="text-xs text-muted-foreground">Designs</div>
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {/* Selection Mode Toggle */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <label className="text-base font-semibold">Selection Method</label>
            {useSubscriptionMockPDF && (
              <p className="text-xs text-muted-foreground">
                Subscription mock PDF only works with "First N Designs" mode
              </p>
            )}
            <div className="flex gap-2">
              <Button
                variant={selectionMode === "firstN" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectionMode("firstN");
                  setSelectedDesignIds(new Set());
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                First {actualDesignCount} from Search
              </Button>
              <Button
                variant={selectionMode === "selected" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectionMode("selected")}
                disabled={useSubscriptionMockPDF}
                title={useSubscriptionMockPDF ? "Subscription mock PDF only works with 'First N from Search' mode" : undefined}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Select {actualDesignCount} Specific
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {selectionMode === "firstN" 
              ? `The first ${actualDesignCount} designs from your filtered results will be included in your PDF.`
              : `Manually select exactly ${actualDesignCount} designs by clicking on them.`}
          </p>
        </Card>

        {/* Search and Filters */}
        <Card className="p-4 overflow-visible">
          <div className="space-y-4">
            <div className="flex gap-4 relative z-10">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search designs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={isLoadingCategories ? "Loading..." : "All Categories"} />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories && categories.length > 0 ? (
                    categories.map((cat: any) => {
                      // Categories have 'title' not 'name' (they're transformed)
                      const categoryId = cat?.id;
                      const categoryName = cat?.title || cat?.name;
                      
                      if (!categoryId || !categoryName) {
                        return null;
                      }
                      
                      return (
                        <SelectItem key={categoryId} value={categoryId.toString()}>
                          {categoryName}
                        </SelectItem>
                      );
                    }).filter(Boolean)
                  ) : (
                    !isLoadingCategories && (
                      <SelectItem value="no-categories" disabled>
                        No categories available
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Selection Counter (for selected mode) */}
        {selectionMode === "selected" && (
          <Card className={`p-4 border-2 ${
            selectedDesignIds.size === actualDesignCount 
              ? "bg-primary/10 border-primary" 
              : "bg-muted/50 border-border"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Selected Designs</p>
                <p className="text-sm text-muted-foreground">
                  {selectedDesignIds.size} of {actualDesignCount} designs selected
                  {selectedDesignIds.size === actualDesignCount && !isEligible && (
                    <span className="ml-2 font-semibold text-primary">₹{price.toFixed(2)}</span>
                  )}
                </p>
              </div>
              <Badge variant={selectedDesignIds.size === actualDesignCount ? "default" : "secondary"}>
                {selectedDesignIds.size} / {actualDesignCount}
              </Badge>
            </div>
            {selectedDesignIds.size !== actualDesignCount && (
              <p className="text-xs text-muted-foreground mt-2">
                Select exactly {actualDesignCount} designs to proceed
              </p>
            )}
            {selectedDesignIds.size === actualDesignCount && !isEligible && pdfConfig && (
              <p className="text-xs text-muted-foreground mt-2">
                Price: ₹{pdfConfig.pricing.selected_per_design} per design × {actualDesignCount} = ₹{price.toFixed(2)}
              </p>
            )}
          </Card>
        )}

        {/* Products Count Display - Only for "firstN" mode */}
        {selectionMode === "firstN" && (
          <div className="text-sm text-muted-foreground mb-4">
            Showing {products.length} of {actualDesignCount} required designs
            {products.length < actualDesignCount && (
              <span className="text-amber-600 dark:text-amber-400 ml-2">
                (Need {actualDesignCount - products.length} more)
              </span>
            )}
          </div>
        )}
        {selectionMode === "selected" && (
          <div className="text-sm text-muted-foreground mb-4">
            Showing {products.length} designs - Select exactly {actualDesignCount} designs to include in your PDF
          </div>
        )}

        {/* Designs Grid */}
        <div>
          {isLoading ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {[...Array(12)].map((_, idx) => (
                <div
                  key={idx}
                  className="aspect-[3/4] rounded-xl bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <Card className="p-12 text-center">
              <p className="text-destructive mb-2">Error loading designs</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
            </Card>
          ) : products.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-2">No designs found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery 
                  ? `No designs match "${searchQuery}". Try a different search term.`
                  : "No designs available at the moment."}
              </p>
            </Card>
          ) : (
            <>
              {selectionMode === "firstN" && (
                <div className="mb-4 text-sm text-muted-foreground">
                  Showing first {Math.min(firstNDesigns.length, freeDesignsCount)} of {products.length} designs
                </div>
              )}
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {(selectionMode === "firstN" ? firstNDesigns : products).map((product, idx) => {
                  const isSelected = selectedDesignIds.has(product.id);
                  const maxCount = isEligible ? freeDesignsCount : selectedDesignCount;
                  const canSelect = selectionMode === "selected" && 
                    (isSelected || selectedDesignIds.size < maxCount);

                  return (
                    <motion.div
                      key={`${product.id}-${idx}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                      onClick={() => handleProductClick(product)}
                      className={`group relative aspect-[3/4] rounded-xl overflow-hidden bg-muted cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 ${
                        isSelected 
                          ? "border-primary ring-2 ring-primary/50" 
                          : canSelect
                          ? "border-border hover:border-primary/50"
                          : selectionMode === "selected"
                          ? "border-border/50 opacity-50 cursor-not-allowed"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {product.media && product.media.length > 0 && product.media[0] ? (
                        <img
                          src={(() => {
                            const mediaItem = product.media[0];
                            if (!mediaItem) return '';
                            if (typeof mediaItem === 'string') return mediaItem;
                            return mediaItem.url || mediaItem.file || '';
                          })()}
                          alt={product.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <FileText className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                      )}
                      
                      {/* Selection Checkbox Overlay */}
                      {selectionMode === "selected" && (
                        <div className="absolute top-2 right-2 z-10">
                          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all backdrop-blur-sm ${
                            isSelected
                              ? "bg-primary border-primary shadow-lg"
                              : canSelect
                              ? "bg-background/90 border-primary/50 hover:bg-primary/20 shadow-md"
                              : "bg-background/50 border-muted-foreground/30"
                          }`}>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                            )}
                          </div>
                        </div>
                      )}

                      {/* Product Info Overlay - Improved */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-3 pt-6">
                        <p className="text-white text-xs font-semibold line-clamp-2 leading-tight mb-1">
                          {product.title}
                        </p>
                        {product.category && (
                          <p className="text-white/60 text-[10px] truncate uppercase tracking-wide">
                            {product.category}
                          </p>
                        )}
                      </div>
                      
                      {/* Hover overlay for better interaction feedback */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
                    </motion.div>
                  );
                })}
              </div>

              {/* Infinite Scroll Trigger */}
              {hasNextPage && (
                <div ref={observerRef} className="h-10" />
              )}
            </>
          )}
        </div>

        {/* Customer Information Inputs - Show only for paid downloads */}
        {!isFreeDownload && price > 0 && (
          <Card className="p-6 mb-6 border-2 border-primary/20">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Metadata Information for PDF
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              enter the details that will appear on each page of the mock pdf
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={customerMobile}
                  onChange={(e) => {
                    // Only allow digits and limit to 10 digits
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setCustomerMobile(value);
                  }}
                  placeholder="Enter 10-digit contact number"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  required
                  maxLength={10}
                  pattern="[0-9]{10}"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Download Button - Sticky at bottom */}
        <div className="sticky bottom-0 bg-background border-t border-border p-4 -mx-4 md:-mx-6 mt-6 z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <p className="font-semibold">
                {isFreeDownload ? "Free PDF Download" : "Paid PDF Download"}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectionMode === "firstN"
                  ? `First ${actualDesignCount} design${actualDesignCount !== 1 ? 's' : ''} from your search`
                  : `${selectedDesignIds.size} design${selectedDesignIds.size !== 1 ? 's' : ''} selected`}
                {isPaidDownload && price > 0 && (
                  <span className="ml-2 font-semibold text-primary">
                    ₹{price.toFixed(2)}
                    {selectionMode === "selected" && pdfConfig && (
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        (₹{pdfConfig.pricing.selected_per_design} × {selectedDesignIds.size})
                      </span>
                    )}
                    {selectionMode === "firstN" && pdfConfig && (
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        (₹{pdfConfig.pricing.first_n_per_design} × {selectedDesignCount})
                      </span>
                    )}
                  </span>
                )}
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleDownload}
              disabled={!canDownload || isDownloading}
              className={
                isFreeDownload
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  : "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              }
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isPaidDownload ? "Processing Payment..." : "Generating PDF..."}
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  {isFreeDownload 
                    ? "Download Free PDF" 
                    : `Pay ₹${price.toFixed(2)} & Download`}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          hasActivePlan={false}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}

