"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

type MessageStatus = "unread" | "read" | "replied";
type MessageType = "support" | "admin" | "system";

interface Message {
  id: string | number;
  sender: string;
  senderType: "admin" | "support" | "system";
  subject: string;
  preview: string;
  timestamp: Date | string;
  status: MessageStatus;
  type: MessageType;
  avatar?: string;
}

interface MessageThread {
  id: string | number;
  subject: string;
  status: "open" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  messages: {
    id: string | number;
    sender: string;
    senderType: "admin" | "support" | "user" | "system";
    content: string;
    timestamp: Date | string;
    attachments?: { name: string; url: string; type: string }[];
    avatar?: string;
  }[];
  createdAt: Date | string;
  lastActivity: Date | string;
}

// Transform API thread to Message format
const transformThreadToMessage = (thread: any): Message => {
  const lastMessage = thread.last_message || thread.messages?.[thread.messages.length - 1];
  const preview = lastMessage?.content || lastMessage?.message || thread.subject || '';
  const truncatedPreview = preview.length > 60 ? preview.substring(0, 60) + '...' : preview;
  
  return {
    id: thread.id || thread.thread_id,
    sender: thread.last_sender || 'Support Team',
    senderType: thread.last_sender_type || 'support',
    subject: thread.subject || 'Support Thread',
    preview: truncatedPreview,
    timestamp: thread.last_activity || thread.updated_at || thread.created_at || new Date(),
    status: thread.has_unread ? 'unread' : 'read',
    type: 'support',
  };
};

// Transform API thread to MessageThread format
const transformThread = (thread: any, messages: any[] = []): MessageThread => {
  return {
    id: thread.id || thread.thread_id,
    subject: thread.subject || 'Support Thread',
    status: thread.status || 'open',
    priority: thread.priority || 'medium',
    createdAt: thread.created_at || new Date(),
    lastActivity: thread.last_activity || thread.updated_at || thread.created_at || new Date(),
    messages: messages.map((msg: any) => {
      // Safely extract content - ensure it's always a string
      let content = '';
      const messageContent = msg.message || msg.content;
      if (typeof messageContent === 'string') {
        content = messageContent;
      } else if (messageContent && typeof messageContent === 'object') {
        // If it's an object, try to extract a string property or stringify it
        content = messageContent.content || messageContent.message || JSON.stringify(messageContent);
      } else if (messageContent) {
        content = String(messageContent);
      }
      
      // Safely extract timestamp - ensure it's always a Date or string
      let timestamp: Date | string = new Date();
      const msgTimestamp = msg.timestamp || msg.created_at;
      if (typeof msgTimestamp === 'string') {
        timestamp = msgTimestamp;
      } else if (msgTimestamp instanceof Date) {
        timestamp = msgTimestamp;
      } else if (msgTimestamp && typeof msgTimestamp === 'object') {
        // If timestamp is an object, try to extract a date value
        const dateValue = msgTimestamp.timestamp || msgTimestamp.created_at || msgTimestamp.date;
        if (dateValue) {
          timestamp = typeof dateValue === 'string' ? dateValue : dateValue instanceof Date ? dateValue : new Date();
        }
      }
      
      return {
        id: msg.id,
        sender: msg.sender_name || (msg.sender?.first_name && msg.sender?.last_name ? `${msg.sender.first_name} ${msg.sender.last_name}` : msg.sender?.username || msg.sender?.email) || 'Support Team',
        senderType: msg.sender_type || (msg.sender?.is_staff ? 'support' : 'user'),
        content: content,
        timestamp: timestamp,
        attachments: msg.attachments || [],
      };
    }),
  };
};

const formatTimestamp = (date: Date | string | null | undefined): string => {
  if (!date) return "Just now";
  
  let dateObj: Date;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    // If it's an object or something else, try to extract a date value
    return "Just now";
  }
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return "Just now";
  }
  
  return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function MessagesSupportContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [newMessage, setNewMessage] = useState("");
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketPriority, setTicketPriority] = useState<"low" | "medium" | "high">("medium");

  // Fetch support threads
  const { data: threadsData, isLoading: isLoadingThreads, error: threadsError, refetch } = useQuery({
    queryKey: ['supportThreads', 'designer'],
    queryFn: async () => {
      const response = await apiClient.getSupportTickets('designer');
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
    queryKey: ['supportThreadMessages', selectedThreadId],
    queryFn: async () => {
      if (!selectedThreadId) return null;
      const threadId = selectedThreadId; // Type is narrowed to number after null check
      const response = await apiClient.getSupportThreadMessages(threadId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    enabled: !!selectedThreadId,
    staleTime: 10 * 1000,
  });

  // Update selectedThread with fetched messages
  useEffect(() => {
    if (!selectedThreadId || !threadsData) return;
    
    const threads = threadsData.threads || [];
    const thread = threads.find((t: any) => (t.id || t.thread_id) === selectedThreadId);
    if (!thread) return;
    
    // If we have messages data, use it; otherwise use empty array
    const messages = threadMessagesData?.messages || [];
    const transformedThread = transformThread(thread, messages);
    
    // Only update if the thread ID changed or messages changed to prevent infinite loops
    setSelectedThread((prev) => {
      if (!prev || prev.id !== selectedThreadId) {
        return transformedThread;
      }
      
      // Check if messages changed
      const prevMessageIds = prev.messages?.map((m: any) => m.id).sort().join(',') || '';
      const newMessageIds = messages.map((m: any) => m.id).sort().join(',');
      
      if (prevMessageIds !== newMessageIds) {
        return transformedThread;
      }
      
      return prev; // No change, return previous value
    });
  }, [threadMessagesData, threadsData, selectedThreadId]);

  // Create support thread mutation
  const createThreadMutation = useMutation({
    mutationFn: async (data: {
      subject: string;
      message: string;
      priority: "high" | "low" | "medium";
      category?: string;
    }) => {
      const response = await apiClient.createSupportThread({
        ...data,
        priority: data.priority as "high" | "low" | "medium",
        thread_type: 'designer', // Explicitly set as designer ticket
      });
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['supportThreads', 'designer'] });
      toast({
        title: "Ticket created successfully!",
        description: "Our support team will get back to you soon.",
      });
      setShowNewTicket(false);
      setTicketSubject("");
      setTicketMessage("");
      setTicketPriority("medium");
      
      // Select the newly created thread after refreshing
      if (data?.thread_id || data?.thread?.id) {
        const threadId = data.thread_id || data.thread?.id;
        // Wait for threads to refresh, then select the new thread
        const result = await refetch();
        if (result.data?.threads) {
          const newThread = result.data.threads.find((t: any) => (t.id || t.thread_id) === threadId);
          if (newThread) {
            const newMessage = transformThreadToMessage(newThread);
            // Set thread ID and message
            setSelectedThreadId(typeof threadId === 'number' ? threadId : parseInt(threadId.toString()));
            handleMessageClick(newMessage);
          }
        }
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.errorDetails?.message || error?.message || "Failed to create support ticket";
      toast({
        title: "Error",
        description: errorMessage,
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

  const threads: any[] = threadsData?.threads || [];
  const messages: Message[] = threads.map(transformThreadToMessage);
  const openThreads = threads.filter((t: any) => t.status === 'open').length;
  const closedThreads = threads.filter((t: any) => t.status === 'closed' || t.status === 'resolved').length;

  const filteredMessages = messages.filter((msg) => {
    const matchesSearch = msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         msg.preview.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || msg.type === filterType;
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "unread" && msg.status === "unread") ||
                         (filterStatus === "read" && msg.status === "read");
    return matchesSearch && matchesType && matchesStatus;
  });

  const unreadCount = messages.filter((m) => m.status === "unread").length;

  const handleMessageClick = async (message: Message) => {
    setSelectedMessage(message);
    // Find the thread for this message
    const thread = threads.find((t: any) => (t.id || t.thread_id) === message.id);
    if (thread) {
      const threadId = typeof thread.id === 'number' ? thread.id : parseInt(thread.id?.toString() || '0');
      if (!isNaN(threadId)) {
        // Set the thread ID, which will trigger the query to fetch messages
        setSelectedThreadId(threadId);
        // Set the thread initially (messages will be fetched by the query and updated via useEffect)
        setSelectedThread(transformThread(thread, []));
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThreadId) {
      toast({
        title: "Error",
        description: "Please select a thread",
        variant: "destructive",
      });
      return;
    }

    const threadId = selectedThreadId; // Type is narrowed to number after null check

    sendMessageMutation.mutate({
      threadId,
      message: newMessage.trim(),
    });
  };

  const handleCreateTicket = async () => {
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

  const getStatusBadge = (status: MessageStatus) => {
    switch (status) {
      case "unread":
        return <Badge className="bg-blue-500">Unread</Badge>;
      case "read":
        return <Badge variant="secondary">Read</Badge>;
      case "replied":
        return <Badge className="bg-green-500">Replied</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-500">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500">Medium</Badge>;
      case "low":
        return <Badge className="bg-green-500">Low</Badge>;
    }
  };

  if (!user) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">Authentication required</h3>
            <p className="text-muted-foreground">Please log in to access messages and support</p>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoadingThreads) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (threadsError) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h3 className="text-xl font-semibold mb-2">Error loading messages</h3>
            <p className="text-muted-foreground mb-4">
              {threadsError instanceof Error ? threadsError.message : 'Failed to load support threads'}
            </p>
            <Button onClick={() => refetch()}>Retry</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Messages & Support
            </h1>
            <p className="text-muted-foreground mt-1">
              Communicate with admin, support team, and stay updated
            </p>
          </div>
          <Button onClick={() => setShowNewTicket(true)} size="lg">
            <MessageSquare className="w-5 h-5 mr-2" />
            New Support Ticket
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Messages</p>
                  <p className="text-2xl font-bold">{messages.length}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Unread</p>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Open Tickets</p>
                  <p className="text-2xl font-bold">{openThreads}</p>
                </div>
                <FileText className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Resolved</p>
                  <p className="text-2xl font-bold">{closedThreads}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle>Messages</CardTitle>
                  {unreadCount > 0 && (
                    <Badge className="bg-blue-500">{unreadCount} new</Badge>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="unread">Unread</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1 max-h-[600px] overflow-y-auto">
                  <AnimatePresence>
                    {filteredMessages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <button
                          onClick={() => handleMessageClick(message)}
                          className={`w-full p-4 text-left border-b border-border hover:bg-muted/50 transition-colors ${
                            selectedMessage?.id === message.id ? "bg-primary/10 border-primary/20" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <Avatar className="w-10 h-10 flex-shrink-0">
                                <AvatarFallback>
                                  {(message.sender || 'S').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-sm truncate">{message.sender || 'Support Team'}</p>
                                  {getStatusBadge(message.status)}
                                </div>
                                <p className="text-sm font-medium truncate mb-1">{message.subject}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">{message.preview}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(message.timestamp).toLocaleDateString()} {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            {message.status === "unread" && (
                              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                            )}
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {filteredMessages.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No messages found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Message Thread View */}
          <div className="lg:col-span-2">
            {selectedThread ? (
              <Card className="h-[700px] flex flex-col">
                <CardHeader className="border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedThread.subject}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        {getPriorityBadge(selectedThread.priority)}
                        <Badge
                          variant={
                            selectedThread.status === "open"
                              ? "default"
                              : selectedThread.status === "resolved"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {selectedThread.status}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Mark as Resolved</DropdownMenuItem>
                        <DropdownMenuItem>Archive</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : selectedThread.messages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No messages yet</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {selectedThread.messages.map((msg, index) => {
                        // Timestamp is already transformed to Date or string in transformThread
                        const timestamp = msg.timestamp;
                        
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex gap-3 ${msg.senderType === "user" ? "justify-end" : "justify-start"}`}
                          >
                            {msg.senderType !== "user" && (
                              <Avatar className="w-8 h-8 flex-shrink-0">
                                <AvatarFallback>
                                  {(msg.sender || 'S').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={`max-w-[70%] ${
                                msg.senderType === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              } rounded-lg p-4`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-semibold text-sm">{msg.sender || 'Support Team'}</p>
                                <span className="text-xs opacity-70">
                                  {formatTimestamp(timestamp)}
                                </span>
                              </div>
                              <p className="text-sm">{msg.content || ''}</p>
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {msg.attachments.map((att, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 bg-background/50 rounded">
                                      <Paperclip className="w-4 h-4" />
                                      <span className="text-xs">{att.name}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            {msg.senderType === "user" && (
                              <Avatar className="w-8 h-8 flex-shrink-0">
                                <AvatarFallback>You</AvatarFallback>
                              </Avatar>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </CardContent>
                <div className="border-t border-border p-4">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Paperclip className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <ImageIcon className="w-5 h-5" />
                      </Button>
                      <Button 
                        onClick={handleSendMessage} 
                        size="lg"
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-[700px] flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="text-xl font-semibold mb-2">Select a message</h3>
                  <p className="text-muted-foreground">
                    Choose a message from the list to view the conversation
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* New Ticket Modal */}
      <AnimatePresence>
        {showNewTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowNewTicket(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl"
            >
              <CardHeader>
                <CardTitle>Create Support Ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Subject</Label>
                  <Input
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    disabled={createThreadMutation.isPending}
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Priority</Label>
                  <Select 
                    value={ticketPriority} 
                    onValueChange={(val: any) => setTicketPriority(val)}
                    disabled={createThreadMutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Message</Label>
                  <Textarea
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Describe your issue in detail..."
                    rows={6}
                    disabled={createThreadMutation.isPending}
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleCreateTicket} 
                    className="flex-1" 
                    size="lg"
                    disabled={createThreadMutation.isPending}
                  >
                    {createThreadMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Create Ticket
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewTicket(false)}
                    size="lg"
                    disabled={createThreadMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

