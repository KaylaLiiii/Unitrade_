import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, ArrowLeft, Send } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import ConversationItem from "../components/chat/ConversationItem";
import MessageBubble from "../components/chat/MessageBubble";
import ListingContextPanel from "../components/chat/ListingContextPanel";
import MessageToast from "../components/chat/MessageToast";
import UcsdVerifiedBadge from "../components/ui/UcsdVerifiedBadge";
import { createPageUrl } from "../utils";
import { Link, useSearchParams, useNavigate } from "react-router-dom";

export default function MyMessages() {
   const { user, isLoadingAuth } = useAuth();
   const [searchParams, setSearchParams] = useSearchParams();
   const navigate = useNavigate();
   const [activeConvId, setActiveConvId] = useState(null);
   const [text, setText] = useState("");
   const [optimisticMsgs, setOptimisticMsgs] = useState([]);
   const [mobileView, setMobileView] = useState("list");
   const [toasts, setToasts] = useState([]);
   const [unreadMap, setUnreadMap] = useState({}); // convId -> count
   const [typingTimeout, setTypingTimeout] = useState(null);

   // Debug state
   const [lastPollTime, setLastPollTime] = useState(null);
   const [showDebug] = useState(false);

   const bottomRef = useRef(null);
   const textareaRef = useRef(null);
   const scrollContainerRef = useRef(null);
   const activeConvIdRef = useRef(activeConvId);
   const queryClient = useQueryClient();

   activeConvIdRef.current = activeConvId;

   // Check URL
   const [pendingListing, setPendingListing] = useState(null);
   useEffect(() => {
     const cid = searchParams.get("conversationId");
     const listingId = searchParams.get("listingId");
     const sellerEmail = searchParams.get("sellerEmail");
     if (cid) { setActiveConvId(cid); setMobileView("chat"); }
     if (listingId && sellerEmail) { setPendingListing({ listingId, sellerEmail }); setMobileView("chat"); }
   }, [searchParams]);

  // ── Conversations (poll every 10s) ──
  const { data: conversations = [], isLoading: convsLoading } = useQuery({
    queryKey: ["my-conversations", user?.email],
    queryFn: async () => {
      const [asBuyer, asSeller] = await Promise.all([
        base44.entities.Conversation.filter({ buyer_email: user.email }, "-updated_date"),
        base44.entities.Conversation.filter({ seller_email: user.email }, "-updated_date"),
      ]);
      const map = new Map();
      [...asBuyer, ...asSeller].forEach((c) => map.set(c.id, c));
      // Filter out conversations hidden by current user
      const filtered = Array.from(map.values()).filter(c => {
        const isBuyer = c.buyer_email === user.email;
        return isBuyer ? !c.hidden_by_buyer : !c.hidden_by_seller;
      });
      return filtered.sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const activeConversation = conversations.find(c => c.id === activeConvId) || null;

  // ── Fetch active listing to check sold status ──
  const { data: activeListing } = useQuery({
    queryKey: ["active-listing", activeConversation?.listing_id || pendingListing?.listingId],
    queryFn: async () => {
      const listingId = activeConversation?.listing_id || pendingListing?.listingId;
      if (!listingId) return null;
      return await base44.entities.Listing.filter({ id: listingId }).then(r => r[0]);
    },
    enabled: !!(activeConversation?.listing_id || pendingListing?.listingId),
    refetchInterval: 5000,
  });

  const isSold = activeListing?.status === "sold";

  // ── Messages (poll every 6s) ──
   const { data: messages = [], isLoading: msgsLoading } = useQuery({
     queryKey: ["messages", activeConvId],
     queryFn: async () => {
       try {
         return await base44.entities.Message.filter({ conversation_id: activeConvId }, "created_date", 50);
       } catch (e) {
         console.error("Message fetch error:", e);
         return [];
       }
     },
     enabled: !!activeConvId,
     refetchInterval: 3000,
     staleTime: 1000,
   });

  // Build unread map from conversations
  useEffect(() => {
    if (!user || !conversations.length) return;
    const newMap = {};
    conversations.forEach(conv => {
      const isBuyer = conv.buyer_email === user.email;
      const unreadCount = isBuyer ? conv.unread_for_buyer : conv.unread_for_seller;
      if (unreadCount > 0) newMap[conv.id] = unreadCount;
    });
    setUnreadMap(newMap);

    // Update document title
    const total = Object.values(newMap).reduce((a, b) => a + b, 0);
    document.title = total > 0 ? `(${total}) UniTrade` : "UniTrade";
  }, [conversations, user]);

  // ── Detect new incoming messages & show toasts ──
  const prevMsgCountRef = useRef({});
  useEffect(() => {
    if (!user || !messages.length || !conversations.length) return;

    conversations.forEach(conv => {
      const convMsgs = messages.filter(m => m.conversation_id === conv.id);
      const incomingUnread = convMsgs.filter(m => m.sender_email !== user.email && !m.is_read);
      const prevCount = prevMsgCountRef.current[conv.id] || 0;
      const currentCount = incomingUnread.length;

      if (currentCount > prevCount && activeConvIdRef.current !== conv.id) {
        // New message in a different thread → toast
        const newest = incomingUnread[incomingUnread.length - 1];
        if (newest) {
          const isBuyer = conv.buyer_email === user.email;
          const senderName = isBuyer ? conv.seller_name : conv.buyer_name;
          setToasts(prev => [...prev.slice(-2), {
            id: `${Date.now()}-${conv.id}`,
            senderName: senderName || "Someone",
            text: newest.text,
            listingTitle: conv.listing_title,
            convId: conv.id,
          }]);
        }
      }
      prevMsgCountRef.current[conv.id] = currentCount;
    });
  }, [conversations]);

  // ── Mark messages as read when opening a thread ──
  useEffect(() => {
    if (!activeConvId || !user || !messages.length) return;
    const unread = messages.filter(m => m.sender_email !== user.email && !m.is_read);
    if (!unread.length) return;
    // Mark all unread in this thread as read after a short delay
    const timer = setTimeout(async () => {
      await base44.entities.Message.update(unread[0].id, { is_read: true });
      queryClient.invalidateQueries({ queryKey: ["messages", activeConvId] });
      queryClient.invalidateQueries({ queryKey: ["my-conversations", user?.email] });
      queryClient.invalidateQueries({ queryKey: ["all-my-messages-unread", user?.email] });
    }, 1500);
    return () => clearTimeout(timer);
  }, [activeConvId, messages.length, user, queryClient]);

  // ── Smart scroll: only auto-scroll if near bottom ──
  const prevMsgLen = useRef(0);
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const allLen = messages.length + optimisticMsgs.length;
    if (allLen > prevMsgLen.current) {
      const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distFromBottom < 120) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
    prevMsgLen.current = allLen;
  }, [messages, optimisticMsgs]);

  // Clear optimistic msgs when real ones arrive
  useEffect(() => { setOptimisticMsgs([]); }, [messages.length]);

  // ── Send message ──
    const sendMessage = useMutation({
      mutationFn: async (msgText) => {
        setLastPollTime(new Date().toISOString());
        let convId = activeConvId;

        // If pending listing, create conversation first
         if (pendingListing && !activeConvId) {
           // Use already-fetched pendingListingData if available, otherwise fetch
           const listing = pendingListingData || (await base44.entities.Listing.filter({ id: pendingListing.listingId }).then(r => r[0]));
           if (!listing) throw new Error("Listing not found");

           try {
             const conv = await base44.entities.Conversation.create({
               listing_id: pendingListing.listingId,
               listing_title: listing.title,
               buyer_email: user.email,
               buyer_name: user.full_name,
               buyer_photo: user.profile_photo || "",
               buyer_is_ucsd_verified: user.is_ucsd_verified || false,
               seller_email: listing.seller_email,
               seller_name: listing.seller_name,
               seller_photo: listing.seller_photo || "",
               seller_is_ucsd_verified: listing.seller_is_ucsd_verified || false
             }, { timeout: 10000 });
             convId = conv.id;
             setActiveConvId(conv.id);
             setPendingListing(null);
           } catch (e) {
             console.error("Failed to create conversation:", e);
             throw new Error("Unable to start conversation. Please try again.");
           }
         }

        if (!convId) throw new Error("No conversation selected");

        try {
          await base44.entities.Message.create({
            conversation_id: convId,
            sender_email: user.email,
            sender_name: user.full_name,
            text: msgText,
            is_read: false,
          }, { timeout: 10000 });
        } catch (e) {
          console.error("Failed to create message:", e);
          throw e;
        }
        try {
          await base44.entities.Conversation.update(convId, {
            last_message: msgText,
            last_message_date: new Date().toISOString(),
          }, { timeout: 10000 });
        } catch (e) {
          console.error("Failed to update conversation:", e);
          throw e;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["messages", activeConvId] });
        queryClient.invalidateQueries({ queryKey: ["my-conversations", user?.email] });
        queryClient.invalidateQueries({ queryKey: ["all-my-messages-unread", user?.email] });
      },
      onError: (err) => {
         console.error("Send message error:", err);
         setOptimisticMsgs([]);
         if (err?.status === 422) {
           const listingId = activeConversation?.listing_id || pendingListing?.listingId;
           if (listingId) {
             queryClient.setQueryData(["active-listing", listingId], (current) =>
               current ? { ...current, status: "sold" } : current
             );
             queryClient.invalidateQueries({ queryKey: ["active-listing", listingId] });
           }
           alert("This item has sold. You can view the chat but cannot send messages.");
           return;
         }
         alert("Failed to send message. Please try again.");
       },
    });

  const handleSend = () => {
    if (isSold) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    setOptimisticMsgs(prev => [...prev, {
      id: `opt-${Date.now()}`,
      text: trimmed,
      sender_email: user.email,
      created_date: new Date().toISOString(),
      _optimistic: true,
    }]);
    setText("");
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; }
    sendMessage.mutate(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  const handleMarkSold = async () => {
    if (!activeConversation?.listing_id) return;
    const listingId = activeConversation.listing_id;
    queryClient.setQueryData(["active-listing", listingId], (current) =>
      current ? { ...current, status: "sold" } : current
    );
    await base44.entities.Listing.update(listingId, { status: "sold" });
    queryClient.invalidateQueries({ queryKey: ["active-listing", listingId] });
    queryClient.invalidateQueries({ queryKey: ["listing-context", listingId] });
    queryClient.invalidateQueries({ queryKey: ["messages", activeConvId] });
  };

  const openConversation = (convId) => {
    setActiveConvId(convId);
    setOptimisticMsgs([]);
    setMobileView("chat");
    // Immediately clear unread badge for this conversation
    setUnreadMap(prev => ({ ...prev, [convId]: 0 }));
  };

  // For pending listing, fetch seller info from the listing
  const { data: pendingListingData } = useQuery({
    queryKey: ["pending-listing-data", pendingListing?.listingId],
    queryFn: () => base44.entities.Listing.filter({ id: pendingListing.listingId }).then(r => r[0]),
    enabled: !!(pendingListing?.listingId && !activeConversation)
  });

  const otherName = activeConversation
    ? (activeConversation.buyer_email === user?.email ? activeConversation.seller_name : activeConversation.buyer_name)
    : (pendingListingData?.seller_name || "");
  const otherPhoto = activeConversation
    ? (activeConversation.buyer_email === user?.email ? activeConversation.seller_photo : activeConversation.buyer_photo)
    : (pendingListingData?.seller_photo || null);
  const otherEmail = activeConversation
    ? (activeConversation.buyer_email === user?.email ? activeConversation.seller_email : activeConversation.buyer_email)
    : (pendingListing?.sellerEmail || null);

  const allMessages = [...messages, ...optimisticMsgs];
  const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0);

  if (isLoadingAuth || !user) return null;

  return (
    <div style={{ fontFamily: "Inter, DM Sans, system-ui, sans-serif", background: "#FAFAF8", height: "calc(100vh - 5.5rem)", display: "flex", flexDirection: "column" }}>
      <style>{`
        .msg-input:focus { outline: none; box-shadow: 0 0 0 2px #F6C453; }
        .send-btn:hover { opacity: 0.85; transform: scale(1.05); }
        .send-btn { transition: all 0.15s ease; }
      `}</style>

      {/* Toasts */}
      {toasts.map((toast, i) => (
        <div key={toast.id} style={{ position: "fixed", bottom: 24 + i * 80, right: 24, zIndex: 9999 }}>
          <MessageToast
            toast={toast}
            onDismiss={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            onClick={() => {
                openConversation(toast.convId);
                setToasts(prev => prev.filter(t => t.id !== toast.id));
                setSearchParams({ conversationId: toast.convId });
              }}
          />
        </div>
      ))}

      {/* 3-pane container */}
      <div className="flex flex-1 overflow-hidden rounded-2xl border" style={{ borderColor: "#E8E8E6", background: "#FFFFFF" }}>

        {/* LEFT: Conversation List */}
        <div
          className={`shrink-0 border-r flex flex-col overflow-hidden ${mobileView === "chat" ? "hidden md:flex" : "flex"}`}
          style={{ width: "100%", maxWidth: 280, borderColor: "#EFEFED" }}
        >
          <div className="px-4 py-4 border-b flex items-center justify-between" style={{ borderColor: "#EFEFED" }}>
            <h2 className="font-semibold text-base" style={{ color: "#1F1F1F" }}>Messages</h2>
            {totalUnread > 0 && (
              <span className="text-[11px] font-bold text-white rounded-full px-2 py-0.5" style={{ background: "#F6C453", color: "#1F1F1F" }}>
                {totalUnread}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {convsLoading ? (
              <div className="p-4 space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-16 px-4">
                <MessageSquare className="w-8 h-8 mx-auto mb-3" style={{ color: "#CCCCCC" }} />
                <p className="text-sm font-medium" style={{ color: "#888888" }}>No messages yet</p>
                <p className="text-xs mt-1" style={{ color: "#AAAAAA" }}>Start by messaging a seller from a listing.</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  currentUserEmail={user.email}
                  isActive={conv.id === activeConvId}
                  unreadCount={unreadMap[conv.id] || 0}
                  onClick={() => openConversation(conv.id)}
                  onDelete={(convId) => {
                    if (activeConvId === convId) setActiveConvId(null);
                    queryClient.invalidateQueries({ queryKey: ["my-conversations", user.email] });
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* CENTER: Chat Thread */}
        <div
          className={`flex flex-col flex-1 overflow-hidden ${mobileView === "list" ? "hidden md:flex" : "flex"}`}
          style={{ background: "#FFFFFF" }}
        >
          {!activeConvId && !pendingListing ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <MessageSquare className="w-12 h-12" style={{ color: "#DDDDDD" }} />
              <p className="text-sm font-medium" style={{ color: "#AAAAAA" }}>Select a conversation to start chatting</p>
            </div>
          ) : (activeConvId || pendingListing) && (
            <>
              {/* Chat Header */}
              {pendingListing && !activeConversation && (
                 <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0" style={{ borderColor: "#EFEFED" }}>
                   <button className="md:hidden p-1.5 rounded-lg mr-1 hover:bg-gray-100 transition-colors" onClick={() => setMobileView("list")}>
                     <ArrowLeft className="w-4 h-4" style={{ color: "#555" }} />
                   </button>
                   <Link to={createPageUrl("PublicProfile") + `?email=${encodeURIComponent(pendingListingData?.seller_email || "")}`} className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden hover:opacity-80 transition-opacity"
                     style={{ background: "linear-gradient(135deg, #F8C35E, #F5A823)" }}>
                     {pendingListingData?.seller_photo
                       ? <img src={pendingListingData.seller_photo} alt="" className="w-full h-full object-cover" />
                       : (pendingListingData?.seller_name?.[0]?.toUpperCase() || "?")}
                   </Link>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-1.5 flex-wrap">
                       <Link to={createPageUrl("PublicProfile") + `?email=${encodeURIComponent(pendingListingData?.seller_email || "")}`} className="font-semibold text-sm truncate hover:underline" style={{ color: "#1F1F1F" }}>{pendingListingData?.seller_name || "User"}</Link>
                       {pendingListingData?.seller_is_ucsd_verified
                         ? <UcsdVerifiedBadge />
                         : null
                       }
                     </div>
                     <p className="text-[11px] truncate" style={{ color: "#AAAAAA" }}>{pendingListingData?.title}</p>
                   </div>
                 </div>
               )}
              {activeConversation && (
                <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0" style={{ borderColor: "#EFEFED" }}>
                  <button className="md:hidden p-1.5 rounded-lg mr-1 hover:bg-gray-100 transition-colors" onClick={() => setMobileView("list")}>
                    <ArrowLeft className="w-4 h-4" style={{ color: "#555" }} />
                  </button>
                  <Link to={createPageUrl("PublicProfile") + `?email=${encodeURIComponent(otherEmail || "")}`} className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden hover:opacity-80 transition-opacity"
                    style={{ background: "linear-gradient(135deg, #F8C35E, #F5A823)" }}>
                    {otherPhoto
                      ? <img src={otherPhoto} alt="" className="w-full h-full object-cover" />
                      : (otherName?.[0]?.toUpperCase() || "?")}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link to={createPageUrl("PublicProfile") + `?email=${encodeURIComponent(otherEmail || "")}`} className="font-semibold text-sm truncate hover:underline" style={{ color: "#1F1F1F" }}>{otherName || "User"}</Link>
                      {(activeConversation.buyer_email === user?.email ? activeConversation.seller_is_ucsd_verified : activeConversation.buyer_is_ucsd_verified)
                        ? <UcsdVerifiedBadge />
                        : null
                      }
                    </div>
                    <p className="text-[11px] truncate" style={{ color: "#AAAAAA" }}>{activeConversation?.listing_title}</p>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4">
                {msgsLoading ? (
                  <div className="space-y-3">
                    {Array(5).fill(0).map((_, i) => (
                      <div key={i} className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}>
                        <Skeleton className="h-10 w-36 rounded-2xl" />
                      </div>
                    ))}
                  </div>
                ) : allMessages.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-sm" style={{ color: "#AAAAAA" }}>No messages yet. Say hello! 👋</p>
                  </div>
                ) : (
                  allMessages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.sender_email === user.email}
                      isOptimistic={!!msg._optimistic}
                    />
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input Area */}
              <div className="shrink-0 px-4 py-3 border-t" style={{ borderColor: "#EFEFED" }}>
                <div className="flex items-end gap-2">
                  <textarea
                   ref={textareaRef}
                   value={text}
                   onChange={handleTextChange}
                   onKeyDown={handleKeyDown}
                   placeholder="Message about this item…"
                   rows={1}
                   disabled={isSold}
                   className="msg-input flex-1 resize-none rounded-xl border px-3 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                   style={{
                     borderColor: "#E8E8E6",
                     background: "#FAFAF8",
                     color: "#1F1F1F",
                     fontSize: 16,
                     lineHeight: 1.5,
                     minHeight: 40,
                     maxHeight: 120,
                     fontFamily: "inherit",
                   }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!text.trim() || sendMessage.isPending || isSold}
                    className="send-btn shrink-0 w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40"
                    style={{ background: "#F6C453" }}
                  >
                    <Send className="w-4 h-4" style={{ color: "#1F1F1F" }} />
                  </button>
                </div>
                <p className="text-[10px] mt-1.5" style={{ color: "#CCCCCC" }}>Enter to send · Shift+Enter for new line</p>
              </div>
            </>
          )}
        </div>

        {/* RIGHT: Listing Context Panel */}
        <div
          className="hidden lg:flex flex-col shrink-0 border-l overflow-y-auto"
          style={{ width: 220, borderColor: "#EFEFED" }}
        >
          <ListingContextPanel
            conversation={activeConversation}
            listing={activeConversation ? activeListing : pendingListingData}
            currentUserEmail={user.email}
            onMarkSold={handleMarkSold}
          />
        </div>
      </div>

      {/* Debug panel (hidden by default) */}
      {showDebug && (
        <div style={{ position: "fixed", bottom: 8, left: 8, background: "#111", color: "#0f0", fontSize: 10, padding: "6px 10px", borderRadius: 6, zIndex: 9999, fontFamily: "monospace" }}>
          <div>Polling: every 3s (msgs) / 5s (convs)</div>
          <div>Last poll: {lastPollTime || "—"}</div>
          <div>Unread map: {JSON.stringify(unreadMap)}</div>
          <div>Total unread: {totalUnread}</div>
        </div>
      )}
    </div>
  );
}
