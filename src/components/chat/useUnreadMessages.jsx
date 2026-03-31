import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";

// Global singleton state so Layout and MyMessages share the same count
let globalUnread = 0;
let globalListeners = new Set();

function notifyListeners(count) {
  globalUnread = count;
  globalListeners.forEach(fn => fn(count));
}

export function useUnreadMessages(userEmail) {
  const [unreadCount, setUnreadCount] = useState(globalUnread);
  const intervalRef = useRef(null);

  useEffect(() => {
    globalListeners.add(setUnreadCount);
    return () => globalListeners.delete(setUnreadCount);
  }, []);

  const refresh = useCallback(async () => {
    if (!userEmail) return;
    try {
      // Fetch all conversations where user is involved
      const [asBuyer, asSeller] = await Promise.all([
        base44.entities.Conversation.filter({ buyer_email: userEmail }, "-updated_date"),
        base44.entities.Conversation.filter({ seller_email: userEmail }, "-updated_date"),
      ]);
      const map = new Map();
      [...asBuyer, ...asSeller].forEach(c => map.set(c.id, c));
      const convIds = Array.from(map.keys());
      if (!convIds.length) { notifyListeners(0); return; }

      // Count unread messages (sent to me, not read)
      // We store unread count on conversations via a helper field we update
      // Since we can't query across all messages efficiently, we track via conversation.unread_for_buyer / unread_for_seller
      let total = 0;
      Array.from(map.values()).forEach(conv => {
        const isBuyer = conv.buyer_email === userEmail;
        const isHidden = isBuyer ? conv.hidden_by_buyer : conv.hidden_by_seller;
        if (isHidden) return;
        const field = isBuyer ? "unread_for_buyer" : "unread_for_seller";
        total += (conv[field] || 0);
      });
      notifyListeners(total);
    } catch (e) {}
  }, [userEmail]);

  useEffect(() => {
    if (!userEmail) return;
    refresh();
    intervalRef.current = setInterval(refresh, 8000);
    return () => clearInterval(intervalRef.current);
  }, [userEmail, refresh]);

  return { unreadCount, refresh };
}
