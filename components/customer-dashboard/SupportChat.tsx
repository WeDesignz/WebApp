"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Message {
  id: string;
  sender: "user" | "support";
  content: string;
  timestamp: string;
  attachment?: {
    name: string;
    url: string;
  };
}

interface SupportChatProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  orderTitle: string;
}

export default function SupportChat({ open, onClose, orderId, orderTitle }: SupportChatProps) {
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch order comments from API
  const { data: commentsData, isLoading: isLoadingComments, error: commentsError, refetch } = useQuery({
    queryKey: ['orderComments', orderId],
    queryFn: async () => {
      const response = await apiClient.getOrderComments(orderId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    enabled: open && !!orderId,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds for new messages
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; media_ids?: number[] }) => {
      const response = await apiClient.addOrderComment(orderId, {
        message: data.message,
        comment_type: 'customer',
        media_ids: data.media_ids,
      });
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      // Refresh comments after sending
      queryClient.invalidateQueries({ queryKey: ['orderComments', orderId] });
      // Invalidate unread count query
      queryClient.invalidateQueries({ queryKey: ['orderComments', orderId, 'unread'] });
      setNewMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error sending message",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Transform API comments to Message format
  const messages: Message[] = commentsData?.comments?.map((comment: any) => ({
    id: comment.id.toString(),
    sender: comment.comment_type === 'customer' ? 'user' : 'support',
    content: comment.message,
    timestamp: comment.created_at,
    attachment: comment.media && comment.media.length > 0 ? {
      name: comment.media[0].file?.name || comment.media[0].file_url?.split('/').pop() || 'Attachment',
      url: comment.media[0].file_url || comment.media[0].file
    } : undefined
  })) || [];

  // Scroll to bottom when messages change or chat is opened
  useEffect(() => {
    if (open && scrollRef.current) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        if (scrollRef.current) {
          // ScrollArea component wraps content in a viewport div
          const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
          if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
          } else {
            // Fallback: try to find any scrollable element
            const scrollable = scrollRef.current.querySelector('[style*="overflow"]') as HTMLElement;
            if (scrollable) {
              scrollable.scrollTop = scrollable.scrollHeight;
            }
          }
        }
      }, 200);
    }
  }, [messages, open]);

  // Mark messages as read when chat modal is opened
  useEffect(() => {
    if (open && orderId) {
      // Call API to mark messages as read on backend (creates read receipts)
      apiClient.markOrderCommentsAsRead(Number(orderId))
        .then(() => {
          // Invalidate unread count query to update counters immediately
          queryClient.invalidateQueries({ queryKey: ['orderComments', orderId, 'unread'] });
          // Also refetch comments to get updated is_read status
          queryClient.invalidateQueries({ queryKey: ['orderComments', orderId] });
        })
        .catch((error: any) => {
          // Only log non-404 errors (endpoint may not exist yet)
          if (error?.statusCode !== 404) {
            console.error('Error marking messages as read:', error);
          }
        });
    }
  }, [open, orderId, queryClient]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedFile) {
      toast({
        title: "Empty message",
        description: "Please enter a message or select a file.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      let mediaIds: number[] = [];
      
      // TODO: Upload file if selected and get media_id
      // For now, we'll just send the message text
      // File upload can be implemented later using MediaFiles API
      
      if (selectedFile) {
        // TODO: Upload file first, then attach media_id
        toast({
          title: "File upload",
          description: "File upload will be implemented soon. Please send a text message for now.",
          variant: "default",
        });
        setIsSending(false);
        return;
      }

      await sendMessageMutation.mutateAsync({
        message: newMessage.trim(),
        media_ids: mediaIds.length > 0 ? mediaIds : undefined,
      });
    } catch (error: any) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>Support Chat</DialogTitle>
          <DialogDescription>
            Communicate with support about this order
          </DialogDescription>
          <div className="text-sm text-muted-foreground space-y-1 mt-2">
            <p className="font-semibold">{commentsData?.order_title || orderTitle}</p>
            <p className="font-mono text-xs">Order #{commentsData?.order_id || orderId} • {commentsData?.order_type || 'Order'}</p>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          {isLoadingComments ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : commentsError ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-2">Error loading messages</p>
              <p className="text-sm text-muted-foreground">
                {commentsError instanceof Error ? commentsError.message : 'Failed to load messages'}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()} 
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">No messages yet</p>
              <p className="text-sm text-muted-foreground">
                Start a conversation by sending a message below.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback>
                    {message.sender === "user" ? "You" : "S"}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={`flex flex-col gap-1 max-w-[70%] ${
                    message.sender === "user" ? "items-end" : ""
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  {message.attachment && (
                    <a
                      href={message.attachment.url}
                      download={message.attachment.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors cursor-pointer"
                    >
                      <Paperclip className="w-4 h-4" />
                      <span className="text-primary underline">{message.attachment.name}</span>
                    </a>
                  )}
                  <span className="text-xs text-muted-foreground px-1">
                    {new Date(message.timestamp).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t">
          {selectedFile && (
            <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded text-sm">
              <Paperclip className="w-4 h-4" />
              <span className="flex-1 truncate">{selectedFile.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1"
                onClick={() => setSelectedFile(null)}
              >
                ×
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx"
            />
            <Button 
              variant="outline" 
              size="icon" 
              className="flex-shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button 
              onClick={handleSend} 
              size="icon" 
              className="flex-shrink-0"
              disabled={isSending || (!newMessage.trim() && !selectedFile)}
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Messages are private between you and support
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
