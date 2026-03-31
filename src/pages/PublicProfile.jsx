import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "../utils";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package, Mail, Phone, MessageCircle } from "lucide-react";
import { categoryLabels } from "../components/listings/ListingCard";
import UcsdVerifiedBadge from "../components/ui/UcsdVerifiedBadge";

const CONTACT_METHODS = [
  { key: "email", icon: Mail, label: "Email" },
  { key: "phone", icon: Phone, label: "Phone" },
  { key: "instagram", icon: MessageCircle, label: "Instagram" },
  { key: "whatsapp", icon: MessageCircle, label: "WhatsApp" },
  { key: "wechat", icon: MessageCircle, label: "WeChat" },
];

export default function PublicProfile() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    if (!email) return;
    // Derive profile from their listings since User entity restricts cross-user reads
    base44.entities.Listing.filter({ seller_email: email }, "-created_date", 1).then((items) => {
      if (items.length > 0) {
        setProfileUser({
          email,
          full_name: items[0].seller_name || email,
          profile_photo: items[0].seller_photo || null,
          is_ucsd_verified: items[0].seller_is_ucsd_verified || false,
          bio: items[0].seller_bio || "",
          preferred_contacts: items[0].seller_preferred_contacts || {},
        });
      } else {
        setProfileUser(null);
      }
      setLoadingUser(false);
    });
  }, [email]);

  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ["public-listings", email],
    queryFn: () => base44.entities.Listing.filter({ seller_email: email }, "-created_date"),
    enabled: !!email,
  });

  const selling = listings.filter((l) => l.status === "available");
  const sold = listings.filter((l) => l.status === "sold");

  if (loadingUser) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 pt-4">
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Profile not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-amber-600 font-bold text-sm">← Go Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Profile Card */}
      <div className="rounded-3xl overflow-hidden shadow-sm border-2" style={{ borderColor: "#F0DFC0", background: "linear-gradient(160deg, #FFF8EE 0%, #FDE8BF 100%)" }}>
        <div className="h-20 w-full" style={{ background: "linear-gradient(135deg, #F8C35E 0%, #F5A823 80%, #E09B15 100%)" }} />
        <div className="px-6 pb-6">
          <div className="-mt-10 mb-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md flex items-center justify-center text-white text-2xl font-black"
              style={{ background: "linear-gradient(135deg, #F8C35E, #E09B15)" }}>
              {profileUser.profile_photo
                ? <img src={profileUser.profile_photo} alt="" className="w-full h-full object-cover" />
                : profileUser.full_name?.[0]?.toUpperCase() || "?"
              }
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black" style={{ color: "#4A3B2A" }}>{profileUser.full_name}</h1>
            {profileUser.is_ucsd_verified && <UcsdVerifiedBadge />}
          </div>

          {/* Bio */}
          {profileUser.bio && (
            <p className="text-sm mt-2" style={{ color: "#7A5C3E" }}>{profileUser.bio}</p>
          )}

          {/* Contact Methods */}
          {Object.keys(profileUser.preferred_contacts || {}).length > 0 && (
            <div className="mt-3 space-y-1.5">
              {Object.entries(profileUser.preferred_contacts)
                .filter(([key, value]) => value && key !== "other_label" && key !== "other_value")
                .map(([key, value]) => {
                  const method = CONTACT_METHODS.find(m => m.key === key);
                  const IconComponent = method?.icon;
                  return (
                    <div key={key} className="flex items-center gap-2 text-xs">
                      {IconComponent && <IconComponent className="w-3.5 h-3.5" style={{ color: "#F5A823" }} />}
                      <span style={{ color: "#7A5C3E" }}><strong>{method?.label}:</strong> {value}</span>
                    </div>
                  );
                })}
              {profileUser.preferred_contacts["other_value"] && (
                <div className="flex items-center gap-2 text-xs">
                  <MessageCircle className="w-3.5 h-3.5" style={{ color: "#F5A823" }} />
                  <span style={{ color: "#7A5C3E" }}><strong>{profileUser.preferred_contacts["other_label"] || "Other"}:</strong> {profileUser.preferred_contacts["other_value"]}</span>
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-5 mt-4 flex-wrap">
            <div className="text-center">
              <p className="text-lg font-black" style={{ color: "#4A3B2A" }}>{sold.length}</p>
              <p className="text-xs" style={{ color: "#9A7B5A" }}>Sold</p>
            </div>
            <div className="w-px bg-amber-200" />
            <div className="text-center">
              <p className="text-lg font-black" style={{ color: "#4A3B2A" }}>{selling.length}</p>
              <p className="text-xs" style={{ color: "#9A7B5A" }}>Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Listings */}
      <div className="bg-white rounded-3xl border-2 p-5" style={{ borderColor: "#F0DFC0" }}>
        <h2 className="font-black text-base mb-4" style={{ color: "#4A3B2A" }}>🛍 Active Listings ({selling.length})</h2>
        {listingsLoading ? (
          <div className="grid grid-cols-2 gap-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}</div>
        ) : selling.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-8 h-8 mx-auto mb-2" style={{ color: "#D4B896" }} />
            <p className="text-sm" style={{ color: "#9A7B5A" }}>No active listings</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {selling.map((listing) => {
              const photo = listing.photos?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80";
              return (
                <Link key={listing.id} to={createPageUrl("ListingDetail") + `?id=${listing.id}`}
                  className="group block rounded-2xl overflow-hidden border-2 hover:shadow-md transition-all" style={{ borderColor: "#F0DFC0" }}>
                  <div className="aspect-square overflow-hidden bg-amber-50">
                    <img src={photo} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-bold truncate" style={{ color: "#4A3B2A" }}>{listing.title}</p>
                    <p className="text-sm font-black" style={{ color: "#E09B15" }}>${listing.price}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}