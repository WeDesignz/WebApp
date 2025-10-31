"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Wallet, 
  ArrowUpRight, 
  Download, 
  CheckCircle2, 
  Clock, 
  XCircle,
  AlertCircle,
  X,
  Info
} from "lucide-react";

// Mock data
const walletData = {
  balance: 45780,
  pendingPayouts: 12340,
  accountVerified: true // Change to false to test disabled state
};

const transactions = [
  { id: "TXN001", date: "2024-03-15", type: "CREDIT", amount: 999, description: "Purchase: Modern Logo Design", reference: "ORD-12345" },
  { id: "TXN002", date: "2024-03-14", type: "DEBIT", amount: -5000, description: "Payout to bank account", reference: "PAY-67890" },
  { id: "TXN003", date: "2024-03-12", type: "CREDIT", amount: 1499, description: "Purchase: Social Media Pack", reference: "ORD-12346" },
  { id: "TXN004", date: "2024-03-10", type: "CREDIT", amount: 499, description: "Purchase: Business Card Template", reference: "ORD-12347" },
  { id: "TXN005", date: "2024-03-08", type: "DEBIT", amount: -150, description: "Platform fee deduction", reference: "FEE-00123" },
  { id: "TXN006", date: "2024-03-05", type: "CREDIT", amount: 2999, description: "Purchase: UI Kit Pro", reference: "ORD-12348" },
  { id: "TXN007", date: "2024-03-03", type: "CREDIT", amount: 999, description: "Purchase: Icon Set Bundle", reference: "ORD-12349" },
  { id: "TXN008", date: "2024-02-28", type: "DEBIT", amount: -8000, description: "Payout to bank account", reference: "PAY-67891" }
];

const payouts = [
  { id: "PAY001", date: "2024-03-11", amount: 8000, status: "SETTLED", scheduledDate: "2024-03-11", settledDate: "2024-03-11" },
  { id: "PAY002", date: "2024-02-11", amount: 6500, status: "SETTLED", scheduledDate: "2024-02-11", settledDate: "2024-02-11" },
  { id: "PAY003", date: "2024-04-11", amount: 12340, status: "SCHEDULED", scheduledDate: "2024-04-11" },
  { id: "PAY004", date: "2024-01-11", amount: 5200, status: "SETTLED", scheduledDate: "2024-01-11", settledDate: "2024-01-11" },
  { id: "PAY005", date: "2023-12-11", amount: 4800, status: "SETTLED", scheduledDate: "2023-12-11", settledDate: "2023-12-11" }
];

const settlementData = {
  grossEarnings: 13500,
  platformFee: 1160,
  netPayable: 12340,
  periodStart: "2024-03-01",
  periodEnd: "2024-03-31",
  expectedPayoutDate: "2024-04-11"
};

// Check if current date is between 5th and 10th of the month (Asia/Kolkata timezone)
function isSettlementWindow() {
  // Asia/Kolkata is UTC+5:30
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kolkataTime = new Date(utcTime + (5.5 * 3600000)); // Add 5.5 hours for IST
  const day = kolkataTime.getDate();
  return day >= 5 && day <= 10;
}

function getStatusColor(status: string) {
  switch (status) {
    case "SETTLED":
      return "bg-success/10 text-success border-success/20";
    case "SCHEDULED":
      return "bg-info/10 text-info border-info/20";
    case "EXPIRED":
      return "bg-warning/10 text-warning border-warning/20";
    case "CANCELLED":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "SETTLED":
      return <CheckCircle2 className="w-4 h-4" />;
    case "SCHEDULED":
      return <Clock className="w-4 h-4" />;
    case "EXPIRED":
    case "CANCELLED":
      return <XCircle className="w-4 h-4" />;
    default:
      return null;
  }
}

export default function EarningsWalletContent() {
  const [activeTab, setActiveTab] = useState("transactions");
  const [transactionType, setTransactionType] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [showSettlement, setShowSettlement] = useState(isSettlementWindow());
  const [settlementAccepted, setSettlementAccepted] = useState(false);
  const [acceptedSettlementRef, setAcceptedSettlementRef] = useState("");

  const handleAcceptSettlement = () => {
    if (!walletData.accountVerified) return;
    
    const refId = `SETTLE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    setAcceptedSettlementRef(refId);
    setSettlementAccepted(true);
    setShowSettlement(false);
  };

  const handleDeclineSettlement = () => {
    setShowSettlement(false);
  };

  const filteredTransactions = transactions.filter(txn => {
    // Filter by transaction type
    if (transactionType !== "all" && txn.type !== transactionType.toUpperCase()) {
      return false;
    }
    
    // Filter by date range
    if (dateRange !== "all") {
      const txnDate = new Date(txn.date);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - txnDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dateRange === "7d" && daysDiff > 7) return false;
      if (dateRange === "30d" && daysDiff > 30) return false;
      if (dateRange === "90d" && daysDiff > 90) return false;
    }
    
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Settlement Success Banner */}
      {settlementAccepted && (
        <Card className="border-success bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                <div>
                  <h4 className="font-semibold text-success mb-1">Settlement Accepted Successfully!</h4>
                  <p className="text-sm text-muted-foreground">
                    Your settlement of <span className="font-medium text-foreground">₹{settlementData.netPayable.toLocaleString()}</span> has been scheduled.
                  </p>
                  <div className="mt-2 text-sm space-y-1">
                    <p><span className="text-muted-foreground">Reference ID:</span> <span className="font-mono font-medium">{acceptedSettlementRef}</span></p>
                    <p><span className="text-muted-foreground">Scheduled Date:</span> <span className="font-medium">{new Date(settlementData.expectedPayoutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSettlementAccepted(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Settlement Window Card */}
      {showSettlement && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  Monthly Settlement Available
                </CardTitle>
                <CardDescription>
                  Review and accept your earnings for the settlement period
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeclineSettlement}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Gross Earnings</p>
                <p className="text-2xl font-bold">₹{settlementData.grossEarnings.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Platform Fee (8.6%)</p>
                <p className="text-2xl font-bold text-destructive">-₹{settlementData.platformFee.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Net Payable</p>
                <p className="text-2xl font-bold text-success">₹{settlementData.netPayable.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Payout Date</p>
                <p className="text-2xl font-bold">{new Date(settlementData.expectedPayoutDate).getDate()}th</p>
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Settlement Period:</span>{" "}
                {new Date(settlementData.periodStart).toLocaleDateString('en-IN')} - {new Date(settlementData.periodEnd).toLocaleDateString('en-IN')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button 
                        size="lg"
                        onClick={handleAcceptSettlement}
                        disabled={!walletData.accountVerified}
                        className="bg-success hover:bg-success/90"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Accept Settlement
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {!walletData.accountVerified && (
                    <TooltipContent>
                      <p>Please verify your linked account to accept settlements</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              <Button 
                size="lg" 
                variant="ghost"
                onClick={handleDeclineSettlement}
              >
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wallet Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                <h2 className="text-4xl font-bold">₹{walletData.balance.toLocaleString()}</h2>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button 
                        size="lg" 
                        disabled={!walletData.accountVerified}
                      >
                        <ArrowUpRight className="w-4 h-4 mr-2" />
                        Withdraw Funds
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {!walletData.accountVerified && (
                    <TooltipContent>
                      <p>Please verify your linked account to withdraw funds</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

              {!walletData.accountVerified && (
                <div className="flex items-center gap-2 text-sm text-warning">
                  <AlertCircle className="w-4 h-4" />
                  <span>Account verification required</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Pending Payouts</p>
            <h3 className="text-3xl font-bold mb-2">₹{walletData.pendingPayouts.toLocaleString()}</h3>
            <p className="text-xs text-muted-foreground">
              Scheduled for next settlement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Transactions and Payouts */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr className="text-left text-sm">
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Type</th>
                      <th className="p-4 font-medium">Description</th>
                      <th className="p-4 font-medium">Reference</th>
                      <th className="p-4 font-medium text-right">Amount</th>
                      <th className="p-4 font-medium text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((txn) => (
                      <tr
                        key={txn.id}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4 text-sm">
                          {new Date(txn.date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="p-4">
                          <Badge 
                            variant="outline" 
                            className={txn.type === "CREDIT" ? "border-success text-success" : "border-destructive text-destructive"}
                          >
                            {txn.type}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm">{txn.description}</td>
                        <td className="p-4 text-sm font-mono text-muted-foreground">{txn.reference}</td>
                        <td className={`p-4 text-sm text-right font-medium ${txn.type === "CREDIT" ? "text-success" : "text-destructive"}`}>
                          {txn.type === "CREDIT" ? "+" : ""}₹{Math.abs(txn.amount).toLocaleString()}
                        </td>
                        <td className="p-4 text-center">
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Showing 1-{filteredTransactions.length} of {filteredTransactions.length} transactions
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                  <Button variant="outline" size="sm" disabled>Next</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>Track your scheduled and completed payouts</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr className="text-left text-sm">
                      <th className="p-4 font-medium">Payout ID</th>
                      <th className="p-4 font-medium">Scheduled Date</th>
                      <th className="p-4 font-medium">Amount</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Settled Date</th>
                      <th className="p-4 font-medium text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((payout) => (
                      <tr
                        key={payout.id}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4 text-sm font-mono">{payout.id}</td>
                        <td className="p-4 text-sm">
                          {new Date(payout.scheduledDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="p-4 text-sm font-medium">
                          ₹{payout.amount.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <Badge 
                            variant="outline" 
                            className={getStatusColor(payout.status)}
                          >
                            <span className="flex items-center gap-1">
                              {getStatusIcon(payout.status)}
                              {payout.status}
                            </span>
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {payout.settledDate ? new Date(payout.settledDate).toLocaleDateString('en-IN') : '-'}
                        </td>
                        <td className="p-4 text-center">
                          {payout.status === "SETTLED" && (
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
