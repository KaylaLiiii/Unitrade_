import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";

export default function SaveButton({ listingId, user, onLoginNeeded }) {
  const queryClient = useQueryClient();

  const { data: savedItems = [] } = useQuery({
    queryKey: ["saved-listings", user?.email],
    queryFn: () => base44.entities.SavedListing.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const isSaved = savedItems.some(s => s.listing_id === listingId);

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!user) { onLoginNeeded?.(); return; }
      if (isSaved) {
        const match = savedItems.find(s => s.listing_id === listingId);
        if (match) await base44.entities.SavedListing.delete(match.id);
      } else {
        await base44.entities.SavedListing.create({ user_email: user.email, listing_id: listingId });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-listings", user?.email] }),
  });

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleMutation.mutate(); }}
      className="p-1.5 rounded-full transition-all hover:scale-110"
      style={{ background: "rgba(255,255,255,0.9)" }}
      title={isSaved ? "Remove from saved" : "Save listing"}
    >
      <Bookmark
        className="w-4 h-4"
        style={{
          color: isSaved ? "#F5A823" : "#999999",
          fill: isSaved ? "#F5A823" : "transparent",
          transition: "all 0.15s ease",
        }}
      />
    </button>
  );
}