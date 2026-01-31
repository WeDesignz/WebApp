"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Download,
  FileText,
  Grid3x3,
  List,
  Calendar,
  Receipt,
  FileImage,
  Search,
  Loader2,
  AlertCircle,
  Eye,
  Filter,
  X,
  File,
  DollarSign,
  Info,
  Package,
  Tag,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ReceiptModal from "@/components/customer-dashboard/ReceiptModal";
import { useQuery } from "@tanstack/react-query";
import { apiClient, catalogAPI } from "@/lib/api";
import { triggerBlobDownload } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface Download {
  id: number | string;
  name?: string;
  title?: string;
  thumbnail?: string;
  format?: string;
  downloadDate?: string;
  created_at?: string;
  purchase_date?: string;
  type?: "free" | "paid" | "subscription";
  transactionId?: string;
  price?: number;
  total_amount?: number | string;
  cart_items?: any[];
  productId?: number;
  pdfDownloadId?: number;
  media?: any[];
  category?: any;
  status?: string;
  isMockPDF?: boolean;
}

// Professional PDF Icon Component
const PDFIcon = ({ className = "w-16 h-16" }: { className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      {/* PDF Document Shape */}
      <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-red-600 rounded-tl-sm rounded-tr-sm rounded-bl-sm shadow-lg">
        {/* Folded corner effect */}
        <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-red-700/50" />
        
        {/* White content area */}
        <div className="absolute inset-2 bg-white rounded-sm">
          {/* PDF text lines */}
          <div className="absolute top-2 left-2 right-2 space-y-1">
            <div className="h-1 bg-red-500/20 rounded w-full" />
            <div className="h-1 bg-red-500/20 rounded w-3/4" />
            <div className="h-1 bg-red-500/20 rounded w-5/6" />
          </div>
          
          {/* PDF label at bottom */}
          <div className="absolute bottom-2 left-2 right-2 text-center">
            <span className="text-[8px] font-bold text-red-600 uppercase tracking-wider">PDF</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DownloadsContent() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'paid'>('all');
  const [downloadingProductId, setDownloadingProductId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [hoveredProductId, setHoveredProductId] = useState<number | string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Add new filter states
  const [typeFilter, setTypeFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [downloadTypeFilter, setDownloadTypeFilter] = useState<'all' | 'products' | 'mock_pdf'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing' | 'pending' | 'failed'>('all');

  // Fetch downloadable products from API
  const { data: downloadsData, isLoading, error } = useQuery({
    queryKey: ['downloads', filter],
    queryFn: async () => {
      const response = await apiClient.getDownloads(filter);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || { products: [], total_downloads: 0, paid_downloads: 0 };
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch categories for filter
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await catalogAPI.getCategories();
      if (response.error) {
        return [];
      }
      return response.data?.categories || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const categories = categoriesData || [];

  // Fetch PDF downloads - fetch ALL to check for processing status
  // We'll filter by status client-side
  const { data: pdfDownloadsData, refetch: refetchPDFDownloads } = useQuery({
    queryKey: ['pdfDownloads', typeFilter], // Don't include statusFilter in key - we filter client-side
    queryFn: async () => {
      const params: any = {};
      if (typeFilter !== 'all') {
        params.download_type = typeFilter;
      }
      // Don't filter by status - fetch all to check for processing ones
      const response = await apiClient.getPDFDownloads(params);
      if (response.error) {
        return [];
      }
      return response.data?.downloads || [];
    },
    staleTime: 0, // Always consider data stale to allow refetching
    refetchInterval: (query) => {
      // Check if there are any processing/pending downloads
      const data = query.state.data as any[] | undefined;
      if (data && Array.isArray(data)) {
        const hasProcessing = data.some((pdf: any) => 
          pdf.status === 'processing' || pdf.status === 'pending'
        );
        // Poll every 3 seconds if there are processing downloads
        if (hasProcessing) {
          return 3000;
        }
      }
      // Stop polling when all are completed or failed
      return false;
    },
  });

  // Transform products to download format
  const products = downloadsData?.products || [];
  const transformedProducts: Download[] = products.map((product: any) => ({
    id: product.id,
    name: product.title,
    title: product.title,
    thumbnail: product.media?.[0]?.file_url || product.media?.[0]?.url,
    format: 'ZIP',
    downloadDate: product.created_at,
    created_at: product.created_at,
    purchase_date: product.purchase_date, // Preserve purchase_date from backend for sorting
    type: 'paid' as const,
    price: product.price,
    productId: product.id,
    media: product.media || [],
    category: product.category,
    isMockPDF: false,
  }));

  const pdfDownloads = pdfDownloadsData || [];

  // Transform PDF downloads to match download format - show ALL statuses
  // Filter by statusFilter client-side (we fetch all to check for processing status)
  const transformedPDFDownloads: Download[] = pdfDownloads
    .filter((pdf: any) => {
      // Apply status filter client-side
      if (statusFilter === 'all') return true;
      return pdf.status === statusFilter;
    })
    .map((pdf: any) => ({
      id: `pdf-${pdf.download_id || pdf.id}`,
      name: `PDF Download - ${pdf.total_pages} designs`,
      title: `PDF Download - ${pdf.total_pages} designs`,
      format: "PDF",
      downloadDate: pdf.completed_at || pdf.created_at,
      created_at: pdf.completed_at || pdf.created_at,
      type: pdf.download_type === 'free' ? 'free' : 'paid',
      price: pdf.total_amount,
      pdfDownloadId: pdf.download_id || pdf.id,
      status: pdf.status,
      isMockPDF: true,
    }));

  // Apply filters to products first (preserve backend order)
  let filteredProducts = [...transformedProducts];
  
  // Filter products by download type
  if (downloadTypeFilter === 'mock_pdf') {
    filteredProducts = [];
  }
  
  // Filter products by free/paid
  if (typeFilter === 'free') {
    filteredProducts = filteredProducts.filter(d => d.type === 'free');
  } else if (typeFilter === 'paid') {
    filteredProducts = filteredProducts.filter(d => d.type === 'paid');
  }
  
  // Filter products by category
  if (categoryFilter !== 'all') {
    filteredProducts = filteredProducts.filter(d => {
      const categoryId = typeof d.category === 'object' ? d.category?.id : d.category;
      return categoryId?.toString() === categoryFilter;
    });
  }

  // Apply filters to PDF downloads
  let filteredPDFs = transformedPDFDownloads;
  
  // Filter PDFs by download type
  if (downloadTypeFilter === 'products') {
    filteredPDFs = [];
  }
  
  // Filter PDFs by free/paid
  if (typeFilter === 'free') {
    filteredPDFs = filteredPDFs.filter(d => d.type === 'free');
  } else if (typeFilter === 'paid') {
    filteredPDFs = filteredPDFs.filter(d => d.type === 'paid');
  }
  
  // Filter PDFs by status
  if (statusFilter !== 'all') {
    filteredPDFs = filteredPDFs.filter(d => d.status === statusFilter);
  }
  
  // Sort PDFs by date (they don't have purchase_date)
  filteredPDFs.sort((a, b) => {
    const dateA = new Date(a.downloadDate || a.created_at || 0).getTime();
    const dateB = new Date(b.downloadDate || b.created_at || 0).getTime();
    return dateB - dateA;
  });

  // Sort products by date as well (for consistent sorting)
  filteredProducts.sort((a, b) => {
    const dateA = new Date(a.purchase_date || a.downloadDate || a.created_at || 0).getTime();
    const dateB = new Date(b.purchase_date || b.downloadDate || b.created_at || 0).getTime();
    return dateB - dateA;
  });

  // Combine and sort all downloads together by date (most recent first)
  // This ensures the most recent download (whether product or PDF) appears at the top
  const allDownloads = [...filteredProducts, ...filteredPDFs].sort((a, b) => {
    const dateA = new Date(a.purchase_date || a.downloadDate || a.created_at || 0).getTime();
    const dateB = new Date(b.purchase_date || b.downloadDate || b.created_at || 0).getTime();
    return dateB - dateA; // Most recent first
  });

  const totalDownloads = downloadsData?.total_downloads || 0;
  const paidDownloads = downloadsData?.paid_downloads || 0;
  const freeDownloads = transformedPDFDownloads.filter((d) => d.type === "free").length;
  const mockPDFDownloads = transformedPDFDownloads.length;

  // Helper function to format plan name (consistent with PlansContent)
  // Prioritizes plan_name_display if available
  const getPlanDisplayName = (plan: { plan_name_display?: string; plan_name: string } | string) => {
    // If plan object is passed, use plan_name_display if available
    if (typeof plan !== 'string') {
      if (plan.plan_name_display) {
        return plan.plan_name_display;
      }
      plan = plan.plan_name;
    }
    
    // Fallback to formatted name
    const nameMap: Record<string, string> = {
      basic: "Starter",
      prime: "Pro",
      premium: "Enterprise",
    };
    return nameMap[plan] || plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  // Fetch subscription data for Subscription Benefits box
  const { data: subscriptionData } = useQuery({
    queryKey: ['mySubscription'],
    queryFn: async () => {
      const response = await apiClient.getMySubscription();
      if (response.error) {
        return null;
      }
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch product details when a product is selected
  const { data: productDetail, isLoading: isLoadingProductDetail } = useQuery({
    queryKey: ['productDetail', selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return null;
      const response = await catalogAPI.getProductDetail(selectedProductId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data?.product || null;
    },
    enabled: !!selectedProductId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });


  const handleDownload = async (download: Download) => {
    try {
      // Check if it's a PDF download
      if (download.pdfDownloadId) {
        const pdfId = download.pdfDownloadId;
        setDownloadingProductId(pdfId); // Use pdfDownloadId for PDF downloads
        try {
          const response = await apiClient.downloadPDF(pdfId);
          
          if (response.error) {
            throw new Error(response.error);
          }

          if (response.data instanceof Blob) {
            const downloadFilename = (response as any).filename || `designs_${pdfId}.pdf`;
            triggerBlobDownload(response.data, downloadFilename);
            toast({
              title: "Download started",
              description: "Your PDF is being downloaded.",
            });
          }
        } finally {
          setDownloadingProductId(null);
        }
      } else if (download.productId) {
        // Handle product zip download
        setDownloadingProductId(download.productId);
        try {
          const blob = await apiClient.downloadProductZip(download.productId);
          const zipFilename = `${download.title?.replace(/[^a-z0-9]/gi, '_') || 'design'}_${download.productId}.zip`;
          triggerBlobDownload(blob, zipFilename);
          toast({
            title: "Download started",
            description: "Your design files are being downloaded as a ZIP file.",
          });
        } finally {
          setDownloadingProductId(null);
        }
      } else {
        toast({
          title: "Download",
          description: "Download not available for this item.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message || "Failed to download file",
        variant: "destructive",
      });
      setDownloadingProductId(null);
    }
  };

  const openReceipt = (download: any) => {
    setSelectedReceipt({
      orderId: download.transactionId,
      date: download.downloadDate,
      items: [
        {
          name: download.name,
          quantity: 1,
          price: download.price,
        },
      ],
      subtotal: download.price,
      tax: download.price * 0.18,
      total: download.price * 1.18,
      razorpayReference: `pay_${download.transactionId}`,
      paymentMethod: "Razorpay",
    });
  };

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              My Downloads
            </h1>
            <p className="text-muted-foreground mt-1">
              Access all your purchased and downloaded files
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={filter === "paid" ? "default" : "outline"}
              onClick={() => setFilter(filter === "paid" ? "all" : "paid")}
            >
              <Receipt className="w-4 h-4 mr-2" />
              {filter === "paid" ? "All Downloads" : "Paid Downloads"}
            </Button>
            <Button
              size="sm"
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === "grid" ? "default" : "outline"}
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Download className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Downloads</p>
                <p className="text-3xl font-bold">{totalDownloads}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Free Downloads</p>
                <p className="text-3xl font-bold">{freeDownloads}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Receipt className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid Downloads</p>
                <p className="text-3xl font-bold">{paidDownloads}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mock PDF Downloads</p>
                <p className="text-3xl font-bold">{mockPDFDownloads}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters Section */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            {/* Download Type Filter (Products vs Mock PDF) */}
            <Select value={downloadTypeFilter} onValueChange={(value) => setDownloadTypeFilter(value as 'all' | 'products' | 'mock_pdf')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Downloads</SelectItem>
                <SelectItem value="products">Product Downloads</SelectItem>
                <SelectItem value="mock_pdf">Mock PDF Downloads</SelectItem>
              </SelectContent>
            </Select>

            {/* Free/Paid Filter */}
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as 'all' | 'free' | 'paid')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter (only show for products) */}
            {downloadTypeFilter !== 'mock_pdf' && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Status Filter (only show for mock PDFs) */}
            {downloadTypeFilter === 'mock_pdf' && (
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'completed' | 'processing' | 'pending' | 'failed')}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Clear Filters Button */}
            {(downloadTypeFilter !== 'all' || typeFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDownloadTypeFilter('all');
                  setTypeFilter('all');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </Card>

        <div className="flex items-center justify-between lg:hidden">
          <h2 className="text-xl font-semibold">Download History</h2>
        </div>

        <div className="lg:grid lg:grid-cols-[1fr,300px] gap-6">
          <div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <Card className="p-12 text-center">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
                <h3 className="text-xl font-semibold mb-2">Error loading downloads</h3>
                <p className="text-muted-foreground">
                  {error instanceof Error ? error.message : 'Failed to load downloads'}
                </p>
              </Card>
            ) : allDownloads.length === 0 ? (
              <Card className="p-12 text-center">
                <FileImage className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No downloads yet</h3>
                <p className="text-muted-foreground">
                  Your downloaded files will appear here
                </p>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {allDownloads.map((download, index) => (
                  <motion.div
                    key={download.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onMouseEnter={() => setHoveredProductId(download.id)}
                    onMouseLeave={() => setHoveredProductId(null)}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className={`aspect-video relative group ${
                        download.isMockPDF 
                          ? 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6' 
                          : 'bg-muted'
                      }`}>
                        {download.isMockPDF ? (
                          <PDFIcon className="w-20 h-20" />
                        ) : download.thumbnail ? (
                          <img 
                            src={download.thumbnail} 
                            alt={download.title || 'Design'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <FileImage className="w-16 h-16 absolute inset-0 m-auto text-muted-foreground/30" />
                        )}
                        <Badge className="absolute top-2 right-2 z-10">
                          {download.type || 'paid'}
                        </Badge>
                        {download.isMockPDF && download.status && (
                          <Badge 
                            variant={
                              download.status === 'completed' ? 'default' :
                              download.status === 'processing' ? 'secondary' :
                              download.status === 'failed' ? 'destructive' : 'outline'
                            }
                            className="absolute top-2 left-2 z-10"
                          >
                            {download.status === 'processing' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                            {download.status}
                          </Badge>
                        )}
                        {download.productId && hoveredProductId === download.id && (
                          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 rounded-t-xl">
                            <button
                              onClick={() => setSelectedProductId(download.productId!)}
                              className="p-3 bg-black hover:bg-black/90 rounded-full shadow-lg transition-all transform hover:scale-110"
                              aria-label="View product details"
                            >
                              <Eye className="w-5 h-5 text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-3">
                        <h3 className="font-semibold line-clamp-1">
                          {download.name || download.title || `Download #${download.id}`}
                        </h3>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{download.format || 'ZIP'}</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(download.downloadDate || download.created_at || Date.now()).toLocaleDateString()}
                          </div>
                        </div>
                        {download.type === "paid" && download.price && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold">₹{download.price}</span>
                            {download.media && download.media.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {download.media.length} file{download.media.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        )}
                        {download.isMockPDF && download.status !== 'completed' ? (
                          <div className="p-3 text-center bg-muted rounded-md">
                            <p className="text-sm text-muted-foreground">
                              {download.status === 'processing' && 'PDF is being generated...'}
                              {download.status === 'pending' && 'PDF request is pending'}
                              {download.status === 'failed' && 'PDF generation failed. Please contact support.'}
                            </p>
                            {download.status === 'processing' && (
                              <Loader2 className="w-4 h-4 mx-auto mt-2 animate-spin text-primary" />
                            )}
                          </div>
                        ) : download.isMockPDF && download.status === 'completed' ? (
                          <Button 
                            className="w-full" 
                            size="sm"
                            onClick={() => handleDownload(download)}
                            disabled={downloadingProductId === download.pdfDownloadId}
                          >
                            {downloadingProductId === download.pdfDownloadId ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Preparing...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button 
                            className="w-full" 
                            size="sm"
                            onClick={() => handleDownload(download)}
                            disabled={downloadingProductId === download.productId}
                          >
                            {downloadingProductId === download.productId ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Preparing...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {allDownloads.map((download, index) => (
                  <motion.div
                    key={download.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onMouseEnter={() => setHoveredProductId(download.id)}
                    onMouseLeave={() => setHoveredProductId(null)}
                  >
                    <Card className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-20 h-20 rounded flex items-center justify-center flex-shrink-0 overflow-hidden relative group ${
                          download.isMockPDF 
                            ? 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-3' 
                            : 'bg-muted'
                        }`}>
                          {download.isMockPDF ? (
                            <PDFIcon className="w-full h-full" />
                          ) : download.thumbnail ? (
                            <img 
                              src={download.thumbnail} 
                              alt={download.title || 'Design'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <FileImage className="w-8 h-8 text-muted-foreground/30" />
                          )}
                          {download.productId && hoveredProductId === download.id && (
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 rounded">
                              <button
                                onClick={() => setSelectedProductId(download.productId!)}
                                className="p-2.5 bg-black hover:bg-black/90 rounded-full shadow-lg transition-all transform hover:scale-110"
                                aria-label="View product details"
                              >
                                <Eye className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {download.name || download.title || `Download #${download.id}`}
                          </h3>
                          <p className="text-sm text-muted-foreground">{download.format || 'ZIP'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {download.type || 'paid'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(download.downloadDate || download.created_at || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                          {download.type === "paid" && download.price && (
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs font-semibold">₹{download.price}</p>
                              {download.media && download.media.length > 0 && (
                                <>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <p className="text-xs text-muted-foreground">
                                    {download.media.length} file{download.media.length !== 1 ? 's' : ''}
                                  </p>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {download.isMockPDF && download.status !== 'completed' ? (
                            <div className="flex-1 p-2 text-center bg-muted rounded-md">
                              <p className="text-xs text-muted-foreground">
                                {download.status === 'processing' && 'Generating...'}
                                {download.status === 'pending' && 'Pending'}
                                {download.status === 'failed' && 'Failed'}
                              </p>
                              {download.status === 'processing' && (
                                <Loader2 className="w-3 h-3 mx-auto mt-1 animate-spin text-primary" />
                              )}
                            </div>
                          ) : (
                            <Button 
                              size="sm"
                              onClick={() => handleDownload(download)}
                              disabled={downloadingProductId === download.productId}
                            >
                              {downloadingProductId === download.productId ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Preparing...
                                </>
                              ) : (
                                <>
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-6 space-y-4">
              <Card className="p-4 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
                <h3 className="font-semibold mb-3">Subscription Benefits</h3>
                {subscriptionData?.has_active_subscription && subscriptionData?.subscription ? (
                  <div className="space-y-4">
                    {/* Active Plan */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active Plan</span>
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        {subscriptionData.plan?.plan_name 
                          ? `${getPlanDisplayName(subscriptionData.plan)} ${subscriptionData.plan.plan_duration === 'monthly' ? 'Monthly' : 'Annually'}`
                          : 'Active'}
                      </Badge>
                    </div>

                    {/* Free Downloads Progress */}
                    {subscriptionData.plan?.no_of_free_downloads !== undefined && subscriptionData.plan.no_of_free_downloads > 0 && (() => {
                      const remaining = subscriptionData.subscription?.remaining_free_downloads ?? subscriptionData.plan.no_of_free_downloads;
                      const used = subscriptionData.subscription?.free_downloads_used ?? 0;
                      const isExhausted = remaining === 0;
                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Free Downloads</span>
                            <span className={`font-semibold text-sm ${isExhausted ? 'text-destructive' : ''}`}>
                              {remaining} / {subscriptionData.plan.no_of_free_downloads}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${isExhausted ? 'bg-destructive' : 'bg-primary'}`}
                              style={{ 
                                width: `${Math.min(100, (remaining / subscriptionData.plan.no_of_free_downloads) * 100)}%` 
                              }} 
                            />
                          </div>
                          <p className={`text-xs ${isExhausted ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                            {isExhausted ? 'All downloads have been used' : `${used} used so far`}
                          </p>
                        </div>
                      );
                    })()}

                    {/* Mock PDF Downloads Progress */}
                    {subscriptionData.plan?.mock_pdf_count !== undefined && subscriptionData.plan.mock_pdf_count > 0 && (() => {
                      const remaining = subscriptionData.subscription?.remaining_mock_pdf_downloads ?? subscriptionData.plan.mock_pdf_count;
                      const used = subscriptionData.subscription?.mock_pdf_downloads_used ?? 0;
                      const isExhausted = remaining === 0;
                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Mock PDF Downloads</span>
                            <span className={`font-semibold text-sm ${isExhausted ? 'text-destructive' : ''}`}>
                              {remaining} / {subscriptionData.plan.mock_pdf_count}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${isExhausted ? 'bg-destructive' : 'bg-purple-500'}`}
                              style={{ 
                                width: `${Math.min(100, (remaining / subscriptionData.plan.mock_pdf_count) * 100)}%` 
                              }} 
                            />
                          </div>
                          <p className={`text-xs ${isExhausted ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                            {isExhausted ? 'All downloads have been used' : `${used} used so far`}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Plan</span>
                      <Badge variant="outline">No Active Plan</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Subscribe to a plan to unlock free downloads and mock PDF benefits.
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      size="sm"
                      onClick={() => router.push('/customer-dashboard?view=plans')}
                    >
                      View Plans
                    </Button>
                  </div>
                )}
              </Card>

              <Card className="p-4">
                <h3 className="font-semibold mb-2">Need Help?</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Having trouble with downloads? Contact support.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="sm"
                  onClick={() => router.push('/customer-dashboard?view=support')}
                >
                  Contact Support
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <ReceiptModal
        open={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProductId} onOpenChange={(open) => !open && setSelectedProductId(null)}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0 gap-0 [&>button]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {isLoadingProductDetail 
                ? 'Loading Product Details' 
                : productDetail?.title || 'Product Details'}
            </DialogTitle>
            <DialogDescription>
              {isLoadingProductDetail 
                ? 'Please wait while we load the product information' 
                : productDetail ? `View all details about ${productDetail.title}` : 'Product details'}
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingProductDetail ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Loading product details...</p>
              </div>
            </div>
          ) : productDetail ? (
            <div className="flex flex-col h-full max-h-[95vh]">
              {/* Header */}
              <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-primary/5 to-purple-500/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold mb-1 line-clamp-2">
                      {productDetail.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Product ID: {productDetail.id}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedProductId(null)}
                    className="flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Image Gallery (Smaller) */}
                  <div className="lg:col-span-1 space-y-3">
                    {productDetail.media && productDetail.media.length > 0 && (
                      <>
                        <div className="aspect-square max-h-[300px] bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden border border-border shadow-sm">
                          <img
                            src={productDetail.media[0]?.file_url || productDetail.media[0]?.url || productDetail.media[0]?.file}
                            alt={productDetail.title}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                        {productDetail.media.length > 1 && (
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {productDetail.media.slice(0, 4).map((media: any, idx: number) => {
                              const fileUrl = media.file_url || media.url || media.file;
                              const fileExtension = fileUrl?.split('.').pop()?.toLowerCase() || '';
                              const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
                              
                              return isImage ? (
                                <div
                                  key={idx}
                                  className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border border-border hover:border-primary transition-colors cursor-pointer"
                                >
                                  <img
                                    src={fileUrl}
                                    alt={`Preview ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : null;
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Right Column - Product Details */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Badges Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {productDetail.category && (
                        <Badge variant="secondary" className="px-2.5 py-1 text-xs">
                          <Package className="w-3 h-3 mr-1" />
                          {productDetail.category?.name || productDetail.category}
                        </Badge>
                      )}
                      {productDetail.product_plan_type && (
                        <Badge className="px-2.5 py-1 text-xs bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30">
                          {productDetail.product_plan_type}
                        </Badge>
                      )}
                      {productDetail.status && (
                        <Badge 
                          variant={productDetail.status === 'active' ? 'default' : 'secondary'}
                          className="px-2.5 py-1 text-xs"
                        >
                          {productDetail.status}
                        </Badge>
                      )}
                      {productDetail.price && (
                        <Badge variant="outline" className="px-2.5 py-1 text-xs font-semibold">
                          ₹{productDetail.price}
                        </Badge>
                      )}
                    </div>

                    {/* Product Information Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {productDetail.product_number && (
                        <div className="p-3 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors">
                          <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                            <Hash className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium uppercase tracking-wide">Design Number</span>
                          </div>
                          <p className="text-sm font-semibold font-mono">{productDetail.product_number}</p>
                        </div>
                      )}
                      {productDetail.id && (
                        <div className="p-3 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors">
                          <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                            <Hash className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium uppercase tracking-wide">Product ID</span>
                          </div>
                          <p className="text-sm font-semibold font-mono">{productDetail.id}</p>
                        </div>
                      )}
                      {productDetail.price && (
                        <div className="p-3 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors">
                          <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium uppercase tracking-wide">Price</span>
                          </div>
                          <p className="text-base font-bold text-primary">₹{productDetail.price}</p>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {productDetail.description && (
                      <div className="p-3 bg-muted/30 rounded-lg border border-border">
                        <h3 className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-primary" />
                          Description
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-4">
                          {productDetail.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Media Files Section - Full Width */}
                {productDetail.media && productDetail.media.length > 0 && (
                  <div className="space-y-4 mt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileImage className="w-5 h-5 text-primary" />
                        Media Files
                        <Badge variant="secondary" className="ml-2">
                          {productDetail.media.length}
                        </Badge>
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {productDetail.media.map((media: any, idx: number) => {
                        const fileUrl = media.file_url || media.url || media.file;
                        const fileName = fileUrl?.split('/').pop() || `file_${idx + 1}`;
                        const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
                        const isCdrOrEps = ['cdr', 'eps'].includes(fileExtension);
                        
                        return (
                          <Card key={idx} className="overflow-hidden hover:shadow-lg transition-all border-border hover:border-primary/50">
                            <div className="p-4 space-y-3">
                              <div className="flex items-start gap-3">
                                {isImage ? (
                                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0 border border-border">
                                    <img
                                      src={fileUrl}
                                      alt={fileName}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center flex-shrink-0 border border-border">
                                    {isCdrOrEps ? (
                                      <FileText className="w-7 h-7 text-primary/60" />
                                    ) : (
                                      <FileImage className="w-7 h-7 text-muted-foreground/50" />
                                    )}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{fileName}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {fileExtension.toUpperCase() || 'FILE'}
                                    </Badge>
                                    {media.meta?.type && (
                                      <Badge variant="secondary" className="text-xs">
                                        {media.meta.type}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="default"
                                className="w-full"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = fileUrl;
                                  link.download = fileName;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  
                                  toast({
                                    title: "Download started",
                                    description: `Downloading ${fileName}`,
                                  });
                                }}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tags - Full Width */}
                {productDetail.tags && productDetail.tags.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Tag className="w-5 h-5 text-primary" />
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {productDetail.tags.map((tag: any, idx: number) => (
                        <Badge key={idx} variant="outline" className="px-3 py-1.5">
                          {tag.name || tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 px-6">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
              <h3 className="text-xl font-semibold mb-2">Product not found</h3>
              <p className="text-muted-foreground mb-4">
                Unable to load product details
              </p>
              <Button onClick={() => setSelectedProductId(null)}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
