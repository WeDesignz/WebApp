"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  Wallet, 
  Download, 
  CheckCircle2, 
  Clock, 
  XCircle,
  AlertCircle,
  X,
  Info,
  Loader2
} from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Transaction {
  id: number;
  wallet_transaction_type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference_id?: string;
  created_at: string;
}

interface WithdrawalRequest {
  id: number;
  amount: number | string;
  status: 'pending' | 'approved' | 'rejected' | string;
  reason?: string;
  admin_remarks?: string;
  created_at: string;
  processed_at?: string;
}

// Helper functions
const formatCurrency = (num: number | string): string => {
  // Convert string to number if needed
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(numValue)) return '₹0.00';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "approved":
    case "settled":
      return "bg-success/10 text-success border-success/20";
    case "pending":
    case "scheduled":
      return "bg-info/10 text-info border-info/20";
    case "rejected":
    case "cancelled":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "approved":
    case "settled":
      return <CheckCircle2 className="w-4 h-4" />;
    case "pending":
    case "scheduled":
      return <Clock className="w-4 h-4" />;
    case "rejected":
    case "cancelled":
      return <XCircle className="w-4 h-4" />;
    default:
      return null;
  }
}

export default function EarningsWalletContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("transactions");
  const [transactionType, setTransactionType] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [withdrawalToCancel, setWithdrawalToCancel] = useState<number | null>(null);

  // Fetch wallet balance
  const { data: balanceData, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['walletBalance'],
    queryFn: async () => {
      const response = await apiClient.getWalletBalance();
      if (response.error) throw new Error(response.error);
      console.log('Wallet balance response:', response);
      console.log('Balance data:', response.data);
      console.log('Balance value:', response.data?.balance);
      console.log('Wallet balance:', response.data?.wallet?.balance);
      return response.data;
    },
    staleTime: 30 * 1000,
  });

  // Fetch earnings summary
  const { data: earningsData, isLoading: isLoadingEarnings } = useQuery({
    queryKey: ['earningsSummary'],
    queryFn: async () => {
      const response = await apiClient.getEarningsSummary();
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    staleTime: 30 * 1000,
  });

  // Fetch transactions
  const { data: transactionsData, isLoading: isLoadingTransactions, error: transactionsError } = useQuery({
    queryKey: ['walletTransactions'],
    queryFn: async () => {
      const response = await apiClient.getWalletTransactions();
      if (response.error) {
        console.error('Error fetching wallet transactions:', response.error);
        throw new Error(response.error);
      }
      // Log the response structure for debugging
      console.log('Wallet transactions response:', response);
      console.log('Wallet transactions data:', response.data);
      console.log('Transactions array:', response.data?.transactions);
      console.log('Transaction count:', response.data?.transactions?.length || 0);
      return response.data;
    },
    staleTime: 30 * 1000,
  });

  // Fetch withdrawal requests
  const { data: withdrawalRequestsData, isLoading: isLoadingWithdrawals } = useQuery({
    queryKey: ['withdrawalRequests'],
    queryFn: async () => {
      const response = await apiClient.getWithdrawalRequests();
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    staleTime: 30 * 1000,
  });

  // Parse balance correctly - handle both string and number, ensure proper decimal conversion
  // Check both balanceData.balance and balanceData.wallet.balance
  const balance = useMemo(() => {
    if (!balanceData) {
      console.log('No balanceData available');
      return 0;
    }
    
    // Try balance field first, then wallet.balance
    let balanceValue = balanceData.balance;
    if (balanceValue === undefined && balanceData.wallet?.balance !== undefined) {
      balanceValue = balanceData.wallet.balance;
    }
    
    console.log('Raw balance value:', balanceValue, 'Type:', typeof balanceValue);
    
    if (balanceValue === undefined || balanceValue === null) {
      console.warn('Balance value is undefined or null');
      return 0;
    }
    
    if (typeof balanceValue === 'string') {
      const parsed = parseFloat(balanceValue);
      console.log('Parsed balance from string:', parsed);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    const numValue = typeof balanceValue === 'number' ? balanceValue : 0;
    console.log('Final balance value:', numValue);
    return numValue;
  }, [balanceData]);
  // Handle different possible response structures
  const transactions: Transaction[] = useMemo(() => {
    if (!transactionsData) {
      console.log('No transactionsData available');
      return [];
    }
    
    console.log('Processing transactionsData:', transactionsData);
    
    // Check if transactions are directly in the data
    if (Array.isArray(transactionsData)) {
      console.log('Transactions found as array, count:', transactionsData.length);
      return transactionsData;
    }
    
    // Check if transactions are in a transactions field
    if (transactionsData.transactions && Array.isArray(transactionsData.transactions)) {
      console.log('Transactions found in .transactions field, count:', transactionsData.transactions.length);
      return transactionsData.transactions;
    }
    
    // Check if transactions are in a data field
    if (transactionsData.data && Array.isArray(transactionsData.data)) {
      console.log('Transactions found in .data field, count:', transactionsData.data.length);
      return transactionsData.data;
    }
    
    // Check for results field (common in paginated responses)
    if (transactionsData.results && Array.isArray(transactionsData.results)) {
      console.log('Transactions found in .results field, count:', transactionsData.results.length);
      return transactionsData.results;
    }
    
    console.warn('Unexpected transactions data structure:', transactionsData);
    console.warn('Available keys:', Object.keys(transactionsData || {}));
    return [];
  }, [transactionsData]);
  const withdrawalRequests: WithdrawalRequest[] = (withdrawalRequestsData?.withdrawal_requests || []).map((req: any) => ({
    ...req,
    amount: typeof req.amount === 'string' ? parseFloat(req.amount) : req.amount,
  }));
  const pendingWithdrawals = withdrawalRequests.filter(w => w.status === 'pending');

  // Cancel withdrawal mutation
  const cancelWithdrawalMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiClient.cancelWithdrawal(requestId);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal cancelled",
        description: "Your withdrawal request has been cancelled successfully.",
      });
      setCancelDialogOpen(false);
      setWithdrawalToCancel(null);
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequests'] });
      queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
      queryClient.invalidateQueries({ queryKey: ['earningsSummary'] });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation failed",
        description: error.message || "Failed to cancel withdrawal request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCancelWithdrawal = (requestId: number) => {
    setWithdrawalToCancel(requestId);
    setCancelDialogOpen(true);
  };

  const confirmCancelWithdrawal = () => {
    if (withdrawalToCancel) {
      cancelWithdrawalMutation.mutate(withdrawalToCancel);
    }
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filter by type
    if (transactionType !== "all") {
      filtered = filtered.filter(txn => 
        txn.wallet_transaction_type === transactionType.toLowerCase()
      );
    }

    // Filter by date range
    if (dateRange !== "all") {
      const now = new Date();
      const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(txn => {
        const txnDate = new Date(txn.created_at);
        return txnDate >= cutoffDate;
      });
    }

    return filtered;
  }, [transactions, transactionType, dateRange]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach(txn => {
      const date = new Date(txn.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(txn);
    });
    return groups;
  }, [filteredTransactions]);

  const isLoading = isLoadingBalance || isLoadingEarnings || isLoadingTransactions || isLoadingWithdrawals;

  return (
    <div className="p-6 space-y-6">
      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Wallet Summary */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                  <h2 className="text-4xl font-bold">{formatCurrency(balance)}</h2>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
              </div>
              
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Pending Withdrawals</p>
              <h3 className="text-3xl font-bold mb-2">
                {formatCurrency(earningsData?.pending_withdrawals || 0)}
              </h3>
              <p className="text-xs text-muted-foreground">
                {pendingWithdrawals.length} pending request{pendingWithdrawals.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Earnings KPIs */}
      {!isLoading && earningsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Monthly Earnings</p>
              <h3 className="text-2xl font-bold">{formatCurrency(earningsData.monthly_earnings || 0)}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Lifetime Earnings</p>
              <h3 className="text-2xl font-bold">{formatCurrency(earningsData.lifetime_earnings || 0)}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
              <h3 className="text-2xl font-bold">{formatCurrency(earningsData.current_wallet_balance || 0)}</h3>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Pending Withdrawals</p>
              <h3 className="text-2xl font-bold">{formatCurrency(earningsData.pending_withdrawals || 0)}</h3>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs for Transactions and Withdrawals */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>View all your earnings and withdrawals</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={transactionType} onValueChange={setTransactionType}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="credit">Credits Only</SelectItem>
                      <SelectItem value="debit">Debits Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingTransactions ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">Loading transactions...</p>
                </div>
              ) : transactionsError ? (
                <div className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
                  <p className="text-destructive font-medium mb-2">Failed to load transactions</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {transactionsError instanceof Error ? transactionsError.message : 'An error occurred'}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['walletTransactions'] })}
                  >
                    Retry
                  </Button>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="p-12 text-center">
                  <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground font-medium mb-1">No transactions found</p>
                  <p className="text-sm text-muted-foreground">
                    {transactions.length === 0 
                      ? "You haven't made any transactions yet. Transactions will appear here once you start earning or making withdrawals."
                      : "No transactions match your current filters. Try adjusting the filters above."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {Object.entries(groupedTransactions).map(([date, txns]) => (
                    <div key={date} className="border-b border-border last:border-b-0">
                      <div className="bg-muted/30 px-4 py-2 text-sm font-medium text-muted-foreground">
                        {date}
                      </div>
                      <table className="w-full">
                        <thead className="bg-muted/50 border-b border-border">
                          <tr className="text-left text-sm">
                            <th className="p-4 font-medium">Type</th>
                            <th className="p-4 font-medium">Description</th>
                            <th className="p-4 font-medium">Reference</th>
                            <th className="p-4 font-medium text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {txns.map((txn) => (
                            <tr
                              key={txn.id}
                              className="border-b border-border hover:bg-muted/30 transition-colors"
                            >
                              <td className="p-4">
                                <Badge 
                                  variant="outline" 
                                  className={txn.wallet_transaction_type === "credit" ? "border-success text-success" : "border-destructive text-destructive"}
                                >
                                  {txn.wallet_transaction_type.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="p-4 text-sm">{txn.description || '-'}</td>
                              <td className="p-4 text-sm font-mono text-muted-foreground">
                                {txn.reference_id || '-'}
                              </td>
                              <td className={`p-4 text-sm text-right font-medium ${txn.wallet_transaction_type === "credit" ? "text-success" : "text-destructive"}`}>
                                {txn.wallet_transaction_type === "credit" ? "+" : "-"}
                                {formatCurrency(txn.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Requests</CardTitle>
              <CardDescription>Track your withdrawal requests and their status</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingWithdrawals ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">Loading withdrawal requests...</p>
                </div>
              ) : withdrawalRequests.length === 0 ? (
                <div className="p-12 text-center">
                  <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No withdrawal requests yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr className="text-left text-sm">
                        <th className="p-4 font-medium">Date</th>
                        <th className="p-4 font-medium">Amount</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Reason</th>
                        <th className="p-4 font-medium">Admin Remarks</th>
                        <th className="p-4 font-medium text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawalRequests.map((request) => (
                        <tr
                          key={request.id}
                          className="border-b border-border hover:bg-muted/30 transition-colors"
                        >
                          <td className="p-4 text-sm">
                            {formatDate(request.created_at)}
                          </td>
                          <td className="p-4 text-sm font-medium">
                            {formatCurrency(typeof request.amount === 'string' ? parseFloat(request.amount) : request.amount)}
                          </td>
                          <td className="p-4">
                            <Badge 
                              variant="outline" 
                              className={getStatusColor(request.status)}
                            >
                              <span className="flex items-center gap-1">
                                {getStatusIcon(request.status)}
                                {request.status.toUpperCase()}
                              </span>
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {request.reason || '-'}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {request.admin_remarks || '-'}
                          </td>
                          <td className="p-4 text-center">
                            {request.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelWithdrawal(request.id)}
                                disabled={cancelWithdrawalMutation.isPending}
                              >
                                {cancelWithdrawalMutation.isPending && withdrawalToCancel === request.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  "Cancel"
                                )}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cancel Withdrawal Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Withdrawal Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this withdrawal request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelWithdrawalMutation.isPending}>
              No, Keep It
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelWithdrawal}
              disabled={cancelWithdrawalMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {cancelWithdrawalMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel Request"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
