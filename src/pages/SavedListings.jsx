import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import { createPageUrl } from "../utils";
import { Badge } from "@/components/ui/badge";
import { conditionLabels } from "../components/listings/ListingCard";

export default function SavedListings() {
   const { user, isLoadingAuth } = useAuth();
   const navigate = useNavigate();
   const queryClient = useQueryClient();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["saved-listings-view", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const savedItems = await base44.entities.SavedListing.filter({ user_email: user.email });
      if (!savedItems.length) return [];
      const listingIds = savedItems.map(s => s.listing_id);
      const items = await base44.entities.Listing.filter({ id: { $in: listingIds } });
      return items;
    },
    enabled: !!user,
  });

  const removeMutation = useMutation({
    mutationFn: async (listingId) => {
      const savedItems = await base44.entities.SavedListing.filter({ user_email: user.email });
      const match = savedItems.find(s => s.listing_id === listingId);
      if (match) await base44.entities.SavedListing.delete(match.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-listings-view", user?.email] }),
  });

  // Filter out sold listings
  const visibleListings = listings.filter(l => l.status !== "sold");

  const statusStyle = (status) => {
    if (status === "on_hold") return { bg: "#FFF8D6", color: "#7A4A1A", border: "#F8C35E", label: "On Hold" };
    return { bg: "#ECFDF5", color: "#065F46", border: "#6EE7B7", label: "Available" };
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-amber-50 rounded-xl transition-colors">
          <ArrowLeft className="w-4 h-4" style={{ color: "#7A5C3E" }} />
        </button>
        <div>
          <h1 className="text-2xl font-black" style={{ color: "#4A3B2A" }}>Saved Listings</h1>
          <p className="text-sm" style={{ color: "#9A8070" }}>{visibleListings.length} item{visibleListings.length !== 1 ? "s" : ""} saved</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl border" style={{ borderColor: "#F0DFC0" }}>
              <Skeleton className="w-20 h-20 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : visibleListings.length === 0 ? (
        <div className="text-center py-20">
          <Bookmark className="w-12 h-12 mx-auto mb-3" style={{ color: "#E0C890" }} />
          <p className="text-base font-bold" style={{ color: "#7A5C3E" }}>No saved listings</p>
          <p className="text-sm mt-1" style={{ color: "#AAAAAA" }}>Browse and save listings you're interested in.</p>
          <Link to={createPageUrl("Browse")} className="inline-block mt-4 px-5 py-2 rounded-2xl text-sm font-bold" style={{ background: "#F6C453", color: "#4A3B2A" }}>
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleListings.map((listing) => {
            const style = statusStyle(listing.status);
            const photo = listing.photos?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80";
            return (
              <div key={listing.id} className="flex gap-4 p-4 bg-white rounded-2xl border hover:shadow-md transition-all" style={{ borderColor: "#F0DFC0" }}>
                <Link to={createPageUrl("ListingDetail") + `?id=${listing.id}`} className="shrink-0">
                  <img src={photo} alt={listing.title} className="w-20 h-20 rounded-xl object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={createPageUrl("ListingDetail") + `?id=${listing.id}`} className="block">
                    <h3 className="font-bold truncate" style={{ color: "#4A3B2A" }}>{listing.title}</h3>
                    <p className="text-lg font-black" style={{ color: "#F5A823" }}>${listing.price}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: style.bg, color: style.color, border: `1.5px solid ${style.border}` }}>
                        {style.label}
                      </span>
                      <span className="text-xs" style={{ color: "#AAAAAA" }}>{conditionLabels[listing.condition] || listing.condition}</span>
                    </div>
                  </Link>
                </div>
                <button
                  onClick={() => removeMutation.mutate(listing.id)}
                  className="shrink-0 p-2 rounded-xl hover:bg-red-50 transition-colors self-start"
                  title="Remove from saved"
                >
                  <Bookmark className="w-4 h-4" style={{ color: "#F6C453", fill: "#F6C453" }} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}