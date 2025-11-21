"use client";

import { useMemo } from "react";
import { 
  Upload, 
  CheckCircle, 
  Clock, 
  Eye, 
  Download, 
  TrendingUp,
  ChevronRight,
  AlertCircle,
  Shield,
  Loader2,
  RefreshCw,
  Building2,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDesignerVerification } from "@/contexts/DesignerVerificationContext";
import { useStudioAccess } from "@/contexts/StudioAccessContext";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonKPICard, SkeletonLoader } from "@/components/common/SkeletonLoader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { toast } from "@/lib/utils/toast";
import DesignProcessingProgress from "./DesignProcessingProgress";

// Helper function to format numbers
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

// Helper function to format currency
const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

// Helper function to get time ago
const getTimeAgo = (date: string): string => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  return `${Math.floor(diffInSeconds / 2592000)} months ago`;
};

export default function DashboardContent() {
  const { isVerified, verificationStatus } = useDesignerVerification();
  const { hasFullAccess, isStudioMember, studioMembership, studioId } = useStudioAccess();
  const { user } = useAuth();
  const router = useRouter();
  const today = new Date();
  const currentDay = today.getDate();
  const isSettlementWindow = currentDay >= 5 && currentDay <= 10;
  const nextSettlementDate = currentDay > 10 ? new Date(today.getFullYear(), today.getMonth() + 1, 5) : new Date(today.getFullYear(), today.getMonth(), 5);

  // Fetch onboarding status to get design processing task
  const { data: onboardingStatusData } = useQuery({
    queryKey: ['designerOnboardingStatus'],
    queryFn: async () => {
      const response = await apiClient.getDesignerOnboardingStatus();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    staleTime: 30 * 1000,
  });

  const designProcessingStatus = onboardingStatusData?.onboarding_status?.design_processing_status;
  const taskId = designProcessingStatus?.task_id || null;
  const isProcessing = designProcessingStatus && 
    (designProcessingStatus.status === 'pending' || designProcessingStatus.status === 'processing');
  
  // Get studio information for studio members
  const accessingStudio = onboardingStatusData?.profile_info?.accessing_studio;
  const studioInfo = accessingStudio || studioMembership?.studio;

  // Fetch dashboard data
  const { 
    data: dashboardData, 
    isLoading: isLoadingDashboard, 
    error: dashboardError,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ['designerDashboard'],
    queryFn: async () => {
      const response = await apiClient.getDesignerDashboard();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch recent designs
  const { 
    data: designsData, 
    isLoading: isLoadingDesigns,
    error: designsError,
    refetch: refetchDesigns,
  } = useQuery({
    queryKey: ['myDesigns', 1],
    queryFn: async () => {
      const response = await apiClient.getMyDesigns({ page: 1, limit: 6 });
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    staleTime: 30 * 1000,
  });

  // Fetch recent transactions
  const { 
    data: transactionsData, 
    isLoading: isLoadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ['recentTransactions'],
    queryFn: async () => {
      const response = await apiClient.getRecentTransactions(5);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    staleTime: 30 * 1000,
  });

  const kpis = dashboardData?.kpis || {};
  const walletBalance = dashboardData?.wallet_balance || 0;
  const recentDesigns = designsData?.designs || [];
  const recentTransactions = transactionsData?.recent_transactions || [];

  // Calculate pending reviews (total_uploaded - total_approved)
  const pendingReviews = (kpis.total_uploaded || 0) - (kpis.total_approved || 0);
  
  // Calculate performance score percentage (assuming score is out of 10)
  const performanceScore = kpis.performance_score || 0;
  const performancePercentage = (performanceScore / 10) * 100;

  const kpiCards = useMemo(() => {
    const baseCards = [
      { 
        icon: Upload, 
        label: "Total Uploads", 
        value: formatNumber(kpis.total_uploaded || 0), 
        href: "/designer-console/designs", 
        color: "text-blue-500" 
      },
      { 
        icon: CheckCircle, 
        label: "Approved Designs", 
        value: formatNumber(kpis.total_approved || 0), 
        href: "/designer-console/designs?status=approved", 
        color: "text-green-500" 
      },
      { 
        icon: Clock, 
        label: "Pending Reviews", 
        value: formatNumber(pendingReviews), 
        href: "/designer-console/designs?status=pending", 
        color: "text-yellow-500" 
      },
      { 
        icon: XCircle, 
        label: "Rejected Designs", 
        value: formatNumber(kpis.total_rejected || 0), 
        href: "/designer-console/designs?status=rejected", 
        color: "text-red-500" 
      },
    ];

    // Studio members don't see analytics-related KPIs
    if (hasFullAccess) {
      baseCards.push(
        { 
          icon: Eye, 
          label: "Views", 
          value: formatNumber(kpis.total_views || 0), 
          href: "/designer-console/analytics", 
          color: "text-purple-500" 
        },
        { 
          icon: Download, 
          label: "Downloads", 
          value: formatNumber(kpis.total_downloads || 0), 
          href: "/designer-console/analytics", 
          color: "text-primary" 
        },
        { 
          icon: TrendingUp, 
          label: "Performance Score", 
          value: `${performanceScore.toFixed(1)}/10`, 
          href: "/designer-console/analytics", 
          color: "text-orange-500", 
          hasProgress: true, 
          progress: performancePercentage,
          tooltip: "Performance Score is calculated based on: 20% Design Quality + 60% Customer Satisfaction + 20% Engagement Metrics"
        }
      );
    }

    return baseCards;
  }, [kpis, pendingReviews, performanceScore, performancePercentage, hasFullAccess]);

  // Don't show verification message for studio members - they don't need verification
  if (!isVerified && !isStudioMember) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Show design processing progress if processing */}
            {isProcessing && taskId && (
              <DesignProcessingProgress taskId={taskId} />
            )}
            
            <Card className="border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-amber-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-3">Account Pending Verification</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Your designer account is currently under review. Once approved by our team, you'll gain full access to all designer console features.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Verification typically takes 24-48 hours</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-primary/30">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-3">Linked Account Status</h3>
                <div className="flex items-center justify-center py-4">
                  <Badge className="text-sm px-4 py-2 bg-green-500/10 text-green-500 border-green-500/30">
                    ✓ Verified
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground text-center mb-4">
                  Your bank account is linked and verified
                </p>
                <Button variant="outline" className="w-full text-sm">View Details</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Show design processing progress if processing */}
          {isProcessing && taskId && (
            <DesignProcessingProgress taskId={taskId} />
          )}
          
          {/* Show locked features banner if pending (but not for studio members) */}
          {verificationStatus === 'pending' && !isStudioMember && (
            <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      Account Pending Admin Approval
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Your account is pending admin approval. Some features are locked until your account is verified.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card className="bg-gradient-to-br from-primary/10 via-background to-purple-500/10 border-primary/20">
            <CardContent className="p-6">
              {isLoadingDashboard ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-64" />
                  {hasFullAccess && (
                    <>
                      <Skeleton className="h-12 w-48" />
                      <div className="flex flex-wrap gap-4">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-5 w-48" />
                      </div>
                    </>
                  )}
                </div>
              ) : dashboardError ? (
                <div className="text-center py-4">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
                  <p className="text-sm text-muted-foreground mb-4">
                    {dashboardError instanceof Error ? dashboardError.message : 'Failed to load dashboard data'}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => refetchDashboard()}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-2">
                    Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.firstName || 'Designer'}
                  </h2>
                  {hasFullAccess ? (
                    <>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-4xl font-bold">{formatCurrency(walletBalance)}</span>
                        <span className="text-muted-foreground text-sm">Wallet Balance</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Net earnings this month:</span>
                          <span className="font-semibold">{formatCurrency(kpis.monthly_earnings || 0)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Pending withdrawals:</span>
                          <span className="font-semibold">{formatCurrency(kpis.pending_withdrawals || 0)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Total downloads:</span>
                          <span className="font-semibold">{formatNumber(kpis.total_downloads || 0)}</span>
                        </div>
                      </div>
                    </>
                  ) : isStudioMember ? (
                    <div className="space-y-2">
                      <p className="text-muted-foreground">
                        Welcome to <span className="font-semibold text-foreground">{studioInfo?.name || 'your studio'}</span>. Upload designs and track their approval status.
                      </p>
                      <div className="flex gap-2 pt-2">
                        <Link href="/designer-console/upload">
                          <Button size="sm" className="gap-2">
                            <Upload className="w-4 h-4" />
                            Upload Design
                          </Button>
                        </Link>
                        <Link href="/designer-console/designs">
                          <Button variant="outline" size="sm">
                            View All Designs
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          {isLoadingDashboard ? (
            <div className={`grid ${isStudioMember && !hasFullAccess ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'} gap-4`}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonKPICard key={i} />
              ))}
            </div>
          ) : dashboardError ? null : (
            <div className={`grid ${isStudioMember && !hasFullAccess ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'} gap-4`}>
              <TooltipProvider>
                {kpiCards.map((card) => {
                  const Icon = card.icon;
                  const isStudioMemberCard = isStudioMember && !hasFullAccess;
                  const cardContent = (
                    <Card className={`group relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer h-full border-2 hover:border-primary/50 ${
                      isStudioMemberCard ? 'bg-gradient-to-br from-card via-card to-primary/5' : ''
                    }`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <CardContent className="p-6 relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color.replace('text-', 'bg-')}/10 ${card.color}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                        </div>
                        <div className="text-3xl font-bold mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">{card.value}</div>
                        <div className="text-sm font-medium text-muted-foreground">{card.label}</div>
                        {card.hasProgress && (
                          <div className="mt-4 space-y-1">
                            <Progress value={card.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground">{card.progress.toFixed(0)}%</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );

                  if (card.tooltip) {
                    return (
                      <Tooltip key={card.label}>
                        <TooltipTrigger asChild>
                          <Link href={card.href}>
                            {cardContent}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">{card.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return (
                    <Link key={card.label} href={card.href}>
                      {cardContent}
                    </Link>
                  );
                })}
              </TooltipProvider>
            </div>
          )}

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold">Recent Designs</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">Your latest design uploads</p>
                </div>
                <Link href="/designer-console/designs">
                  <Button variant="ghost" size="sm" className="gap-2">
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              
              {isLoadingDesigns ? (
                <SkeletonLoader variant="list" count={3} />
              ) : designsError ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
                  <p className="text-sm text-muted-foreground mb-4">
                    {designsError instanceof Error ? designsError.message : 'Failed to load designs'}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => refetchDesigns()}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : recentDesigns.length === 0 ? (
                <div className="text-center py-8">
                  <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No designs yet</p>
                  <Link href="/designer-console/designs/upload">
                    <Button variant="outline" size="sm" className="mt-3">
                      Upload Your First Design
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-border text-left">
                        <th className="pb-3 pr-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Design</th>
                        <th className="pb-3 pr-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="pb-3 pr-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Uploaded</th>
                        {hasFullAccess && (
                          <>
                            <th className="pb-3 pr-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Views</th>
                            <th className="pb-3 pr-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Downloads</th>
                            <th className="pb-3 pr-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Purchases</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {recentDesigns.map((design: any) => (
                        <tr 
                          key={design.id} 
                          className="border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors duration-150 group cursor-pointer"
                          onClick={() => router.push(`/designer-console/designs?search=${encodeURIComponent(design.title || '')}`)}
                        >
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-3 group/link">
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                                {design.thumbnail ? (
                                  <img src={design.thumbnail} alt={design.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                ) : (
                                  <Upload className="w-6 h-6 text-muted-foreground" />
                                )}
                              </div>
                              <span className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">{design.title}</span>
                            </div>
                          </td>
                          <td className="py-4 pr-4" onClick={(e) => e.stopPropagation()}>
                            <Badge 
                              variant={
                                design.status === "active" || design.status === "approved" ? "default" : 
                                design.status === "pending" ? "secondary" : 
                                design.status === "rejected" ? "destructive" : 
                                design.status === "draft" ? "outline" : 
                                "secondary"
                              }
                              className="text-xs font-medium capitalize shadow-sm"
                            >
                              {design.status === "active" ? "Active" :
                               design.status === "approved" ? "Approved" :
                               design.status === "pending" ? "Pending" :
                               design.status === "rejected" ? "Rejected" :
                               design.status === "draft" ? "Draft" :
                               design.status?.charAt(0).toUpperCase() + design.status?.slice(1) || 'Unknown'}
                            </Badge>
                          </td>
                          <td className="py-4 pr-4">
                            <span className="text-sm text-muted-foreground font-medium">
                              {design.created_at ? getTimeAgo(design.created_at) : 'N/A'}
                            </span>
                          </td>
                          {hasFullAccess && (
                            <>
                              <td className="py-4 pr-4">
                                <div className="flex items-center gap-1.5">
                                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span className="text-sm font-medium">{formatNumber(design.views || 0)}</span>
                                </div>
                              </td>
                              <td className="py-4 pr-4">
                                <div className="flex items-center gap-1.5">
                                  <Download className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span className="text-sm font-medium">{formatNumber(design.downloads || 0)}</span>
                                </div>
                              </td>
                              <td className="py-4 pr-4">
                                <div className="flex items-center gap-1.5">
                                  <ShoppingCart className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span className="text-sm font-semibold">{formatNumber(design.purchases || 0)}</span>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {hasFullAccess && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Recent Transactions</h3>
                  <Link href="/designer-console/wallet">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </div>
                {isLoadingTransactions ? (
                  <SkeletonLoader variant="list" count={5} />
                ) : transactionsError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
                    <p className="text-sm text-muted-foreground mb-4">
                      {transactionsError instanceof Error ? transactionsError.message : 'Failed to load transactions'}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => refetchTransactions()}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                ) : recentTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No recent transactions</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentTransactions.map((transaction: any, index: number) => (
                      <div key={transaction.id || index} className="flex gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          transaction.wallet_transaction_type === "credit" ? "bg-green-500" :
                          transaction.wallet_transaction_type === "debit" ? "bg-red-500" :
                          "bg-muted-foreground"
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm">{transaction.description || transaction.transaction_type || 'Transaction'}</p>
                            <span className={`text-sm font-semibold ${
                              transaction.wallet_transaction_type === "credit" ? "text-green-600" : "text-red-600"
                            }`}>
                              {transaction.wallet_transaction_type === "credit" ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount || 0))}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {transaction.created_at ? getTimeAgo(transaction.created_at) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Studio Information Card for Studio Members */}
          {isStudioMember && (studioInfo || studioMembership) && (
            <Card className="bg-gradient-to-br from-primary/10 via-background to-purple-500/10 border-primary/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg flex-shrink-0 ring-4 ring-primary/20">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base mb-1 truncate">
                      {studioInfo?.name || studioMembership?.studio?.name || 'Studio'}
                    </h3>
                    {(studioInfo?.wedesignz_auto_name || studioMembership?.studio?.wedesignz_auto_name) && (
                      <Badge variant="outline" className="text-xs font-mono mt-1">
                        {studioInfo?.wedesignz_auto_name || studioMembership?.studio?.wedesignz_auto_name}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t border-border/50">
                  {studioMembership?.role && (
                    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground font-medium">Your Role</span>
                      <Badge variant="secondary" className="capitalize font-semibold">
                        {studioMembership.role.replace('_', ' ')}
                      </Badge>
                    </div>
                  )}
                  {studioMembership?.status && (
                    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground font-medium">Status</span>
                      <Badge 
                        variant={studioMembership.status === 'active' ? 'default' : 'secondary'}
                        className="capitalize font-semibold"
                      >
                        {studioMembership.status}
                      </Badge>
                    </div>
                  )}
                  {(studioInfo?.owner_name || studioMembership?.studio?.created_by) && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground font-medium">Studio Owner</span>
                      <span className="text-sm font-semibold truncate ml-2 text-right max-w-[60%]">
                        {studioInfo?.owner_name || 
                         (studioMembership?.studio?.created_by?.first_name || studioMembership?.studio?.created_by?.username || '') +
                         (studioMembership?.studio?.created_by?.last_name ? ` ${studioMembership.studio.created_by.last_name}` : '')}
                      </span>
                    </div>
                  )}
                  {studioInfo?.studio_industry_type && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground font-medium">Industry</span>
                      <span className="text-sm font-semibold truncate ml-2 text-right max-w-[60%]">
                        {studioInfo?.industry_display || studioInfo.studio_industry_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  )}
                  {studioInfo?.total_active_members !== undefined && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground font-medium">Active Members</span>
                      <span className="text-sm font-semibold">
                        {studioInfo.total_active_members}
                      </span>
                    </div>
                  )}
                  {studioInfo?.design_lead?.full_name && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground font-medium">Design Lead</span>
                      <span className="text-sm font-semibold truncate ml-2 text-right max-w-[60%]">
                        {studioInfo.design_lead.full_name}
                      </span>
                    </div>
                  )}
                  {studioInfo?.remarks && (
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-sm text-muted-foreground font-medium block mb-1.5">Remarks</span>
                      <p className="text-sm text-foreground leading-relaxed">
                        {studioInfo.remarks}
                      </p>
                    </div>
                  )}
                  {studioInfo?.address && (
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-sm text-muted-foreground font-medium block mb-1.5">Office Address</span>
                      <p className="text-sm text-foreground leading-relaxed whitespace-normal break-words">
                        {studioInfo.address}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {hasFullAccess && (
            <>
              <Card className="border-primary/30">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-sm mb-3">Linked Account Status</h3>
                  <div className="flex items-center justify-center py-4">
                    <Badge className="text-sm px-4 py-2 bg-green-500/10 text-green-500 border-green-500/30">
                      ✓ Verified
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mb-4">
                    Your bank account is linked and verified
                  </p>
                  <Button variant="outline" className="w-full text-sm">View Details</Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-sm mb-3">Settlement Window</h3>
                  {isSettlementWindow ? (
                    <>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Pending Amount</span>
                          <span className="font-bold">₹8,200</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Processing Fee</span>
                          <span>₹164</span>
                        </div>
                        <div className="border-t border-border pt-2 mt-2">
                          <div className="flex justify-between text-sm font-semibold">
                            <span>You'll Receive</span>
                            <span className="text-primary">₹8,036</span>
                          </div>
                        </div>
                      </div>
                      <Button className="w-full mb-3">Accept Settlement</Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Deadline: {today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ({10 - currentDay} days left)
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        The settlement window is currently closed.
                      </p>
                      <div className="p-3 rounded-lg bg-muted/50 mb-3">
                        <p className="text-xs text-muted-foreground mb-1">Next Settlement Date</p>
                        <p className="text-sm font-semibold">
                          {nextSettlementDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Settlement windows are open from the 5th to 10th of each month. You can accept your pending settlement during this period.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
