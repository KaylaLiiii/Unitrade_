import React, { useState } from "react";
import moment from "moment";
import { Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

const AVATAR_COLORS = [
["#F87171", "#EF4444"], ["#FB923C", "#F97316"], ["#FBBF24", "#F59E0B"],
["#34D399", "#10B981"], ["#60A5FA", "#3B82F6"], ["#A78BFA", "#8B5CF6"],
["#F472B6", "#EC4899"], ["#2DD4BF", "#14B8A6"]];


function getColorForName(name) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ConversationItem({ conversation, currentUserEmail, isActive, unreadCount, onClick, onDelete }) {
  const isBuyer = conversation.buyer_email === currentUserEmail;
  const otherName = isBuyer ? conversation.seller_name : conversation.buyer_name;
  const otherPhoto = isBuyer ? conversation.seller_photo : conversation.buyer_photo;
  const colors = getColorForName(otherName);
  const hasUnread = unreadCount > 0;
  const [deleting, setDeleting] = useState(false);

  const queryClient = useQueryClient();

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    setDeleting(true);
    try {
      const isBuyer = conversation.buyer_email === currentUserEmail;
      await base44.entities.Conversation.update(conversation.id, {
        [isBuyer ? "hidden_by_buyer" : "hidden_by_seller"]: true
      });
      // Optimistically remove from cache for current user
      queryClient.setQueryData(["my-conversations", currentUserEmail], (old) =>
      old ? old.filter((c) => c.id !== conversation.id) : old
      );
      onDelete?.(conversation.id);
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
    setDeleting(false);
  };

  return (
    <div
      className="w-full flex items-center gap-2 px-3 py-2.5 transition-all text-left group"
      style={{
        background: isActive ? "#F0EFED" : hasUnread ? "#FFF9E9" : "transparent"
      }}
      onMouseEnter={(e) => {if (!isActive) e.currentTarget.style.background = "#F4F4F2";}}
      onMouseLeave={(e) => {if (!isActive) e.currentTarget.style.background = hasUnread ? "#FFF9E9" : "transparent";}}>

       <button onClick={onClick} className="flex-1 flex items-center gap-2 min-w-0">
         {/* Avatar */}
         <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}>

           {otherPhoto ?
          <img src={otherPhoto} alt="" className="w-full h-full object-cover" /> :
          (otherName || "?")[0]?.toUpperCase()
          }
         </div>

         {/* Info */}
         <div className="flex-1 min-w-0 space-y-1">
           <div className="flex items-center gap-2">
             <span className="text-sm font-medium truncate" style={{ color: "#1F1F1F" }}>
               {otherName || "User"}
             </span>
             {hasUnread &&
            <span
              className="shrink-0 text-[10px] font-bold text-white rounded-full px-1.5 py-0.5"
              style={{ background: "#F6C453", color: "#1F1F1F" }}>

                 {unreadCount}
               </span>
            }
           </div>
           <div className="space-y-0.5">
             <p className="text-[11px] font-medium text-left truncate" style={{ color: "#F6C453" }}>
               {conversation.listing_title}
             </p>
             <p className="text-[11px] font-medium text-left truncate" style={{ color: "#888888" }}>
               {conversation.last_message || "No messages yet"}
             </p>
           </div>
         </div>
       </button>

        {/* Delete button - always visible on mobile, hover on desktop */}
        <button
        onClick={handleDelete}
        disabled={deleting}
        className="shrink-0 p-1.5 rounded-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-100"
        title="Delete conversation">

          <Trash2 className="w-4 h-4" style={{ color: "#EF4444" }} />
        </button>
        </div>);

}