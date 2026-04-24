import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Send,
  MessageSquare,
  User,
  Search,
  Plus,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: number;
  userId: number;
  userName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  read: boolean;
}

interface UserEntry {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Messaging() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [newMessageDialogOpen, setNewMessageDialogOpen] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } =
    useQuery<Conversation[]>({
      queryKey: ["/api/messages"],
      enabled: isAuthenticated,
      refetchInterval: 10000,
    });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery<
    Message[]
  >({
    queryKey: [`/api/messages/${selectedUserId}`],
    enabled: !!selectedUserId && isAuthenticated,
    refetchInterval: 5000,
  });

  // Fetch users list for new message dialog
  const { data: usersList = [], isLoading: usersLoading } = useQuery<
    UserEntry[]
  >({
    queryKey: ["/api/users/list"],
    enabled: newMessageDialogOpen && isAuthenticated,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: number; content: string }) => {
      return await apiRequest("POST", "/api/messages", data);
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({
        queryKey: [`/api/messages/${selectedUserId}`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mark messages as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return await apiRequest("PATCH", `/api/messages/${messageId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
  });

  // Mark unread messages as read when viewing a conversation
  useEffect(() => {
    if (messages.length > 0 && user) {
      const unreadMessages = messages.filter(
        (m) => !m.read && m.senderId !== user.id
      );
      unreadMessages.forEach((m) => {
        markReadMutation.mutate(m.id);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when conversation is selected
  useEffect(() => {
    if (selectedUserId) {
      inputRef.current?.focus();
    }
  }, [selectedUserId]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedUserId) return;
    sendMessageMutation.mutate({
      receiverId: selectedUserId,
      content: messageText.trim(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectConversation = (userId: number) => {
    setSelectedUserId(userId);
    setShowMobileChat(true);
  };

  const handleStartNewConversation = (targetUser: UserEntry) => {
    setSelectedUserId(targetUser.id);
    setNewMessageDialogOpen(false);
    setUserSearchTerm("");
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter((c) =>
    (c.userName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter users list by search (exclude current user)
  const filteredUsers = usersList
    .filter((u) => u.id !== user?.id)
    .filter(
      (u) =>
        `${u.firstName} ${u.lastName}`
          .toLowerCase()
          .includes(userSearchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
    );

  // Find the selected conversation's user name
  const selectedConversation = conversations.find(
    (c) => c.userId === selectedUserId
  );
  const selectedUserName = selectedConversation?.userName || "Conversation";

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <AppHeader currentRole="applicant" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader currentRole={user?.roles?.[0] || "applicant"} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-neutral-900">Messages</h1>
        </div>

        <Card className="overflow-hidden">
          <div className="flex h-[calc(100vh-220px)] min-h-[500px]">
            {/* Left Sidebar - Conversation List */}
            <div
              className={`w-full md:w-80 lg:w-96 border-r flex flex-col ${
                showMobileChat ? "hidden md:flex" : "flex"
              }`}
            >
              {/* Sidebar Header */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-lg text-neutral-900">
                    Conversations
                  </h2>
                  <Dialog
                    open={newMessageDialogOpen}
                    onOpenChange={setNewMessageDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1.5">
                        <Plus className="h-4 w-4" />
                        New
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>New Message</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                          <Input
                            placeholder="Search users..."
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <ScrollArea className="h-64">
                          {usersLoading ? (
                            <div className="flex items-center justify-center h-32">
                              <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                            </div>
                          ) : filteredUsers.length === 0 ? (
                            <p className="text-center text-sm text-neutral-500 py-8">
                              No users found
                            </p>
                          ) : (
                            <div className="space-y-1">
                              {filteredUsers.map((u) => (
                                <button
                                  key={u.id}
                                  onClick={() =>
                                    handleStartNewConversation(u)
                                  }
                                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-100 transition-colors text-left"
                                >
                                  <Avatar className="h-9 w-9">
                                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                      {getInitials(
                                        `${u.firstName} ${u.lastName}`
                                      )}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm text-neutral-900 truncate">
                                      {u.firstName} {u.lastName}
                                    </p>
                                    <p className="text-xs text-neutral-500 truncate">
                                      {u.email}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className="text-xs shrink-0"
                                  >
                                    {u.roles?.[0] || "user"}
                                  </Badge>
                                </button>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <Separator />

              {/* Conversation List */}
              <ScrollArea className="flex-1">
                {conversationsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <MessageSquare className="h-10 w-10 text-neutral-300 mb-3" />
                    <p className="text-sm font-medium text-neutral-600">
                      No conversations yet
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Start a new message to begin chatting
                    </p>
                  </div>
                ) : (
                  <div className="py-1">
                    {filteredConversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() =>
                          handleSelectConversation(conversation.userId)
                        }
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors text-left ${
                          selectedUserId === conversation.userId
                            ? "bg-primary/5 border-r-2 border-primary"
                            : ""
                        }`}
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {getInitials(conversation.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm text-neutral-900 truncate">
                              {conversation.userName}
                            </p>
                            <span className="text-xs text-neutral-400 shrink-0">
                              {formatTime(conversation.lastMessageAt)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p className="text-xs text-neutral-500 truncate">
                              {conversation.lastMessage}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <Badge className="h-5 min-w-[20px] px-1.5 text-xs bg-primary text-white shrink-0">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Right Panel - Active Conversation */}
            <div
              className={`flex-1 flex flex-col ${
                showMobileChat ? "flex" : "hidden md:flex"
              }`}
            >
              {selectedUserId ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b bg-white">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden shrink-0"
                      onClick={handleBackToList}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {getInitials(selectedUserName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-neutral-900 truncate">
                        {selectedUserName}
                      </p>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <ScrollArea className="flex-1 p-4">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                        <MessageSquare className="h-10 w-10 text-neutral-300 mb-3" />
                        <p className="text-sm text-neutral-500">
                          No messages yet. Say hello!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((message) => {
                          const isOwn = message.senderId === user?.id;
                          return (
                            <div
                              key={message.id}
                              className={`flex ${
                                isOwn ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[75%] sm:max-w-[65%] ${
                                  isOwn ? "order-1" : ""
                                }`}
                              >
                                <div
                                  className={`rounded-2xl px-4 py-2.5 ${
                                    isOwn
                                      ? "bg-primary text-primary-foreground rounded-br-md"
                                      : "bg-neutral-100 text-neutral-900 rounded-bl-md"
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {message.content}
                                  </p>
                                </div>
                                <p
                                  className={`text-[11px] text-neutral-400 mt-1 px-1 ${
                                    isOwn ? "text-right" : "text-left"
                                  }`}
                                >
                                  {formatMessageTime(message.createdAt)}
                                  {isOwn && (
                                    <span className="ml-1.5">
                                      {message.read ? "Read" : "Sent"}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t bg-white p-4">
                    <div className="flex items-center gap-2">
                      <Input
                        ref={inputRef}
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={sendMessageMutation.isPending}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={
                          !messageText.trim() || sendMessageMutation.isPending
                        }
                        size="icon"
                        className="shrink-0"
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                /* Empty State - No conversation selected */
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                    Your Messages
                  </h3>
                  <p className="text-sm text-neutral-500 max-w-sm mb-4">
                    Select a conversation from the sidebar or start a new message
                    to connect with other users.
                  </p>
                  <Button
                    onClick={() => setNewMessageDialogOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    New Message
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
