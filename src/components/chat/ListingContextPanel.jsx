import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";

export default function ListingContextPanel({ conversation, listing: passedListing, currentUserEmail, onMarkSold }) {
   const { data: queriedListing } = useQuery({
     queryKey: ["listing-context", conversation?.listing_id],
     queryFn: () => base44.entities.Listing.filter({ id: conversation.listing_id }).then(r => r[0] || null),
     enabled: !!conversation?.listing_id && !passedListing,
   });

   const listing = passedListing || queriedListing;

   if (!conversation && !listing) return (
     <div className="flex items-center justify-center h-full" style={{ color: "#CCCCCC" }}>
       <p className="text-sm">Select a conversation</p>
     </div>
   );

   const isSeller = conversation ? currentUserEmail === conversation.seller_email : false;
   const photo = listing?.photos?.[0];

  return (
    <div className="p-4 space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#AAAAAA" }}>About this item</p>

      {/* Item image */}
       <div className="rounded-xl overflow-hidden aspect-square bg-gray-100 relative">
         {photo
           ? <img src={photo} alt={listing?.title} className="w-full h-full object-cover" />
           : <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
         }
         {listing?.status === "sold" && (
           <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
             <span className="text-white font-black text-3xl tracking-widest">SOLD</span>
           </div>
         )}
       </div>

      {listing && (
        <div>
          <p className="font-semibold text-sm" style={{ color: "#1F1F1F" }}>{listing.title}</p>
          <p className="font-bold text-base mt-0.5" style={{ color: "#E09B15" }}>${listing.price}</p>
          <p className="text-xs mt-0.5" style={{ color: "#888888" }}>
            {listing.status === "available" ? "✅ Available" : listing.status === "on_hold" ? "⏸ On Hold" : "🔴 Sold"}
          </p>
        </div>
      )}

      {listing && isSeller && listing.status !== "sold" && (
        <button
          onClick={onMarkSold}
          className="w-full py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
          style={{ background: "#1F1F1F", color: "#FFFFFF" }}
        >
          Mark as Sold
        </button>
      )}

      {listing && !isSeller && listing.status === "available" && (
        <Link
          to={createPageUrl("ListingDetail") + `?id=${conversation?.listing_id || listing?.id}`}
          className="block w-full py-2 rounded-xl text-sm font-semibold text-center transition-all hover:opacity-80"
          style={{ background: "#F6C453", color: "#1F1F1F" }}
        >
          View
        </Link>
      )}

      {listing?.status === "sold" && (
        <div className="p-3 rounded-xl text-sm text-center font-semibold" style={{ background: "#FEE2E2", color: "#991B1B" }}>
          <MessageCircle className="w-4 h-4 mx-auto mb-1" />
          This item has sold. You can view the chat but cannot send messages.
        </div>
      )}
    </div>
  );
}