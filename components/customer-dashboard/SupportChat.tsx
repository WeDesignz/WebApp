"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

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

const getOrderMessages = (orderId: string): Message[] => {
  const storedMessages = localStorage.getItem(`chat_${orderId}`);
  if (storedMessages) {
    return JSON.parse(storedMessages);
  }
  
  return [
    {
      id: "1",
      sender: "support",
      content: "Hello! I've received your custom design order. I'll start working on it right away.",
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
  ];
};

export default function SupportChat({ open, onClose, orderId, orderTitle }: SupportChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (orderId) {
      const orderMessages = getOrderMessages(orderId);
      setMessages(orderMessages);
    }
  }, [orderId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const saveMessages = (msgs: Message[]) => {
    localStorage.setItem(`chat_${orderId}`, JSON.stringify(msgs));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    let attachmentData = null;
    
    if (selectedFile) {
      try {
        const dataURL = await fileToDataURL(selectedFile);
        attachmentData = {
          name: selectedFile.name,
          url: dataURL,
        };
      } catch (error) {
        console.error("Failed to convert file:", error);
      }
    }

    const message: Message = {
      id: Date.now().toString(),
      sender: "user",
      content: newMessage || "Sent a file",
      timestamp: new Date().toISOString(),
      ...(attachmentData && { attachment: attachmentData }),
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
    setNewMessage("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setTimeout(() => {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        sender: "support",
        content: "Got it! I'll take care of that.",
        timestamp: new Date().toISOString(),
      };
      const newMessages = [...updatedMessages, reply];
      setMessages(newMessages);
      saveMessages(newMessages);
    }, 1000);
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
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-semibold">{orderTitle}</p>
            <p className="font-mono text-xs">{orderId}</p>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
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
            <Button onClick={handleSend} size="icon" className="flex-shrink-0">
              <Send className="w-4 h-4" />
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
