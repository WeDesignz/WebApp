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

  // Apply filters to combined downloads
  let filteredDownloads = [...transformedProducts, ...transformedPDFDownloads];

  // Filter by download type (products vs mock PDF)
  if (downloadTypeFilter === 'products') {
    filteredDownloads = filteredDownloads.filter(d => !d.isMockPDF);
  } else if (downloadTypeFilter === 'mock_pdf') {
    filteredDownloads = filteredDownloads.filter(d => d.isMockPDF);
  }

  // Filter by free/paid
  if (typeFilter === 'free') {
    filteredDownloads = filteredDownloads.filter(d => d.type === 'free');
  } else if (typeFilter === 'paid') {
    filteredDownloads = filteredDownloads.filter(d => d.type === 'paid');
  }

  // Filter by category (for products only)
  if (categoryFilter !== 'all') {
    filteredDownloads = filteredDownloads.filter(d => {
      if (d.isMockPDF) return true; // Keep all PDFs
      const categoryId = typeof d.category === 'object' ? d.category?.id : d.category;
      return categoryId?.toString() === categoryFilter;
    });
  }

  // Filter by status (for PDFs only)
  if (statusFilter !== 'all') {
    filteredDownloads = filteredDownloads.filter(d => {
      if (!d.isMockPDF) return true; // Keep all products
      return d.status === statusFilter;
    });
  }

  // Sort by date
  const allDownloads = filteredDownloads.sort((a, b) => {
    const dateA = new Date(a.downloadDate || a.created_at || 0).getTime();
    const dateB = new Date(b.downloadDate || b.created_at || 0).getTime();
    return dateB - dateA;
  });

  const totalDownloads = downloadsData?.total_downloads || 0;
  const paidDownloads = downloadsData?.paid_downloads || 0;
  const freeDownloads = transformedPDFDownloads.filter((d) => d.type === "free").length;
  const mockPDFDownloads = transformedPDFDownloads.length;

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
            // Create download link
            const url = window.URL.createObjectURL(response.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `designs_${pdfId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

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
          
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${download.title?.replace(/[^a-z0-9]/gi, '_') || 'design'}_${download.productId}.zip`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

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
                      <div className="aspect-video bg-muted relative group">
                        {download.thumbnail ? (
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
                          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <Button
                              size="sm"
                              variant="default"
                              className="shadow-lg"
                              onClick={() => setSelectedProductId(download.productId!)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
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
                        <div className="w-20 h-20 bg-muted rounded flex items-center justify-center flex-shrink-0 overflow-hidden relative group">
                          {download.thumbnail ? (
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
                            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                              <Button
                                size="sm"
                                variant="default"
                                className="shadow-lg h-8"
                                onClick={() => setSelectedProductId(download.productId!)}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
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
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Plan</span>
                    <Badge>Pro Monthly</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Downloads</span>
                    <span className="font-semibold">32 / 50</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[64%]" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    18 downloads remaining this month
                  </p>
                </div>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {isLoadingProductDetail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : productDetail ? (
            <>
              <DialogHeader>
                <DialogTitle>{productDetail.title || 'Product Details'}</DialogTitle>
                <DialogDescription>
                  View all details about this product
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                {/* Product Image */}
                {productDetail.media && productDetail.media.length > 0 && (
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={productDetail.media[0]?.file_url || productDetail.media[0]?.url || productDetail.media[0]?.file}
                      alt={productDetail.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Product Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Product ID</h3>
                    <p className="text-sm">{productDetail.id}</p>
                  </div>
                  {productDetail.product_number && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-1">Design Number</h3>
                      <p className="text-sm">{productDetail.product_number}</p>
                    </div>
                  )}
                  {productDetail.category && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-1">Category</h3>
                      <p className="text-sm">{productDetail.category?.name || productDetail.category}</p>
                    </div>
                  )}
                  {productDetail.product_plan_type && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-1">Plan Type</h3>
                      <Badge variant="secondary">{productDetail.product_plan_type}</Badge>
                    </div>
                  )}
                  {productDetail.price && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-1">Price</h3>
                      <p className="text-sm font-semibold">₹{productDetail.price}</p>
                    </div>
                  )}
                  {productDetail.status && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-1">Status</h3>
                      <Badge variant={productDetail.status === 'active' ? 'default' : 'secondary'}>
                        {productDetail.status}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Description */}
                {productDetail.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {productDetail.description}
                    </p>
                  </div>
                )}

                {/* Media Files */}
                {productDetail.media && productDetail.media.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                      Media Files ({productDetail.media.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {productDetail.media.map((media: any, idx: number) => {
                          const fileUrl = media.file_url || media.url || media.file;
                          const fileName = fileUrl?.split('/').pop() || `file_${idx + 1}`;
                          const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
                          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
                          const isCdrOrEps = ['cdr', 'eps'].includes(fileExtension);
                          
                          // Skip CDR and EPS files from image display, but show them in the list
                          if (isCdrOrEps) {
                            return (
                              <div key={idx} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-20 h-20 bg-muted rounded flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-8 h-8 text-muted-foreground/50" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{fileName}</p>
                                    <p className="text-xs text-muted-foreground uppercase">{fileExtension || 'file'}</p>
                                    {media.meta?.type && (
                                      <Badge variant="outline" className="text-xs mt-1">
                                        {media.meta.type}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => {
                                    // Create download link
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
                            );
                          }
                          
                          return (
                            <div key={idx} className="border rounded-lg p-4 space-y-3">
                              <div className="flex items-center gap-3">
                                {isImage ? (
                                  <div className="w-20 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
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
                                  <div className="w-20 h-20 bg-muted rounded flex items-center justify-center flex-shrink-0">
                                    <FileImage className="w-8 h-8 text-muted-foreground/50" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{fileName}</p>
                                  <p className="text-xs text-muted-foreground uppercase">{fileExtension || 'file'}</p>
                                  {media.meta?.type && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {media.meta.type}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  // Create download link
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
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {productDetail.tags && productDetail.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {productDetail.tags.map((tag: any, idx: number) => (
                        <Badge key={idx} variant="outline">
                          {tag.name || tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
              <h3 className="text-xl font-semibold mb-2">Product not found</h3>
              <p className="text-muted-foreground">
                Unable to load product details
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
