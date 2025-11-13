"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Mail,
  Phone,
  Zap,
  ExternalLink,
  Send,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SupportThread {
  id: number | string;
  thread_id?: number | string;
  subject: string;
  status: string;
  priority?: string;
  created_at?: string;
  updated_at?: string;
  last_activity?: string;
  messages?: any[];
}

const formatTimestamp = (dateString?: string): string => {
  if (!dateString) return "Just now";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function SupportContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [ticketFormOpen, setTicketFormOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState<SupportThread | null>(null);
  const [threadDetailOpen, setThreadDetailOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketPriority, setTicketPriority] = useState<"low" | "medium" | "high">("medium");
  const [newMessage, setNewMessage] = useState("");

  // Fetch support threads
  const { data: threadsData, isLoading: isLoadingThreads, error: threadsError, refetch } = useQuery({
    queryKey: ['supportThreads'],
    queryFn: async () => {
      const response = await apiClient.getSupportTickets();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  // Fetch thread messages when a thread is selected
  const { data: threadMessagesData, isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: ['supportThreadMessages', selectedThread?.id],
    queryFn: async () => {
      if (!selectedThread?.id) return null;
      const threadId = typeof selectedThread.id === 'number' ? selectedThread.id : parseInt(selectedThread.id.toString());
      const response = await apiClient.getSupportThreadMessages(threadId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    enabled: !!selectedThread?.id && threadDetailOpen,
    staleTime: 10 * 1000,
  });

  // Create support thread mutation
  const createThreadMutation = useMutation({
    mutationFn: async (data: {
      subject: string;
      message: string;
      priority: "high" | "low" | "medium";
      category?: string;
    }) => {
      return apiClient.createSupportThread({
        ...data,
        priority: data.priority as "high" | "low" | "medium",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportThreads'] });
      toast({
        title: "Ticket created successfully!",
        description: "Our support team will get back to you soon.",
      });
      setTicketFormOpen(false);
      setTicketSubject("");
      setTicketMessage("");
      setTicketPriority("medium");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create support ticket",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ threadId, message }: { threadId: number; message: string }) => {
      return apiClient.sendSupportMessage(threadId, message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportThreadMessages'] });
      queryClient.invalidateQueries({ queryKey: ['supportThreads'] });
      setNewMessage("");
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const threads: SupportThread[] = threadsData?.threads || [];

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createThreadMutation.mutate({
      subject: ticketSubject.trim(),
      message: ticketMessage.trim(),
      priority: ticketPriority,
      category: 'general',
    });
  };

  const handleViewThread = async (thread: SupportThread) => {
    setSelectedThread(thread);
    setThreadDetailOpen(true);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread?.id) return;

    const threadId = typeof selectedThread.id === 'number' 
      ? selectedThread.id 
      : parseInt(selectedThread.id.toString());

    if (isNaN(threadId)) {
      toast({
        title: "Error",
        description: "Invalid thread ID",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      threadId,
      message: newMessage.trim(),
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return <Badge variant="default" className="bg-blue-500">Open</Badge>;
      case "resolved":
      case "closed":
        return <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">Resolved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityColor = (priority?: string) => {
    if (!priority) return "text-muted-foreground";
    switch (priority.toLowerCase()) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
      default:
        return "text-muted-foreground";
    }
  };

  if (!user) {
    return (
      <div className="p-4 md:p-6 pb-24 md:pb-6">
        <div className="max-w-7xl mx-auto">
          <Card className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">Authentication required</h3>
            <p className="text-muted-foreground">Please log in to access support</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Support Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Get help, find answers, and contact our support team
          </p>
        </div>

        {/* Quick Contact Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Mail className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Email Support</h3>
                  <p className="text-sm text-muted-foreground">support@wedesignz.com</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" size="sm" asChild>
                <a href="mailto:support@wedesignz.com">Send Email</a>
              </Button>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Phone className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Phone Support</h3>
                  <p className="text-sm text-muted-foreground">Mon-Fri 9AM-6PM</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" size="sm" asChild>
                <a href="tel:+1234567890">Call Us</a>
              </Button>
            </Card>
          </motion.div>
        </div>

        {/* Support Ticket Form */}
        <div className="space-y-6">
          <Card className="p-8 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/20 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Create Support Ticket
                </h2>
                <p className="text-muted-foreground">
                  Need help? Fill out the form below and our team will get back to you soon.
                </p>
              </div>
              <Button
                variant={ticketFormOpen ? "outline" : "default"}
                size="lg"
                onClick={() => setTicketFormOpen(!ticketFormOpen)}
                className="text-base px-6"
              >
                {ticketFormOpen ? "Cancel" : "Create Ticket"}
              </Button>
            </div>

            <AnimatePresence>
              {ticketFormOpen ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-8 bg-background/80 backdrop-blur-sm border-2 border-primary/30 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-primary/20 rounded-lg">
                        <Send className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">Support Ticket Details</h3>
                        <p className="text-sm text-muted-foreground">Please provide as much detail as possible</p>
                      </div>
                    </div>
                    <form onSubmit={handleSubmitTicket} className="space-y-6">
                      <div>
                        <Label className="text-base font-semibold mb-3 block">
                          Subject <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={ticketSubject}
                          onChange={(e) => setTicketSubject(e.target.value)}
                          placeholder="Brief description of your issue"
                          className="h-12 text-base"
                          required
                          disabled={createThreadMutation.isPending}
                        />
                      </div>
                      <div>
                        <Label className="text-base font-semibold mb-3 block">
                          Priority Level
                        </Label>
                        <div className="flex gap-3">
                          {(["low", "medium", "high"] as const).map((priority) => (
                            <Button
                              key={priority}
                              type="button"
                              variant={ticketPriority === priority ? "default" : "outline"}
                              size="lg"
                              onClick={() => setTicketPriority(priority)}
                              disabled={createThreadMutation.isPending}
                              className={`flex-1 ${
                                ticketPriority === priority
                                  ? priority === "high"
                                    ? "bg-red-500 hover:bg-red-600"
                                    : priority === "medium"
                                    ? "bg-yellow-500 hover:bg-yellow-600"
                                    : "bg-green-500 hover:bg-green-600"
                                  : ""
                              }`}
                            >
                              {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-base font-semibold mb-3 block">
                          Message <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          value={ticketMessage}
                          onChange={(e) => setTicketMessage(e.target.value)}
                          placeholder="Describe your issue in detail. Include any error messages, steps to reproduce, or screenshots if applicable..."
                          rows={8}
                          className="text-base resize-none"
                          required
                          disabled={createThreadMutation.isPending}
                        />
                      </div>
                      <div className="flex gap-3 pt-4">
                        <Button 
                          type="submit" 
                          size="lg" 
                          className="flex-1 text-base h-12"
                          disabled={createThreadMutation.isPending}
                        >
                          {createThreadMutation.isPending ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5 mr-2" />
                              Submit Ticket
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={() => setTicketFormOpen(false)}
                          className="text-base h-12"
                          disabled={createThreadMutation.isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-4">
                    <Send className="w-10 h-10 text-primary" />
                  </div>
                  <p className="text-lg text-muted-foreground">
                    Click "Create Ticket" above to get started
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>

        {/* Support Tickets */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Support Tickets</h2>
          {isLoadingThreads ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : threadsError ? (
            <Card className="p-12 text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
              <h3 className="text-xl font-semibold mb-2">Error loading tickets</h3>
              <p className="text-muted-foreground mb-4">
                {threadsError instanceof Error ? threadsError.message : 'Failed to load support tickets'}
              </p>
              <Button onClick={() => refetch()}>Retry</Button>
            </Card>
          ) : threads.length === 0 ? (
            <Card className="p-12 text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">No support tickets yet</h3>
              <p className="text-muted-foreground">
                Create a support ticket to get help from our team
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {threads.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewThread(ticket)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-sm text-muted-foreground">#{ticket.id}</span>
                            {getStatusBadge(ticket.status)}
                            {ticket.priority && (
                              <span className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold">{ticket.subject}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {ticket.last_activity 
                              ? `Last updated ${formatTimestamp(ticket.last_activity)}`
                              : ticket.updated_at 
                              ? `Updated ${formatTimestamp(ticket.updated_at)}`
                              : ticket.created_at
                              ? `Created ${formatTimestamp(ticket.created_at)}`
                              : ''}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleViewThread(ticket); }}>
                        View Details
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Help */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Still need help?</h3>
                <p className="text-sm text-muted-foreground">
                  Join our community or check out our comprehensive documentation
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Documentation
              </Button>
              <Button>
                <MessageCircle className="w-4 h-4 mr-2" />
                Community Forum
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Thread Detail Dialog */}
      {selectedThread && (
        <Dialog open={threadDetailOpen} onOpenChange={setThreadDetailOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedThread.subject}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedThread.status)}
                {selectedThread.priority && (
                  <Badge variant="outline" className={getPriorityColor(selectedThread.priority)}>
                    {selectedThread.priority} Priority
                  </Badge>
                )}
              </div>

              {/* Messages */}
              {isLoadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {threadMessagesData?.messages && threadMessagesData.messages.length > 0 ? (
                    threadMessagesData.messages.map((message: any, index: number) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <MessageCircle className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-sm">
                                {message.sender || message.sender_type || 'Support Team'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(message.timestamp || message.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {message.message || message.content}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">No messages yet</p>
                    </Card>
                  )}
                </div>
              )}

              {/* Send Message */}
              <div className="space-y-2 border-t pt-4">
                <Label>Reply</Label>
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={3}
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="w-full"
                >
                  {sendMessageMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
