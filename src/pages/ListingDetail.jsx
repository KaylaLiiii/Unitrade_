import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Clock,
  MessageSquare,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Shield,
  Copy,
  Check,
  Bookmark,
  Mail,
  Phone } from
"lucide-react";
import UcsdVerifiedBadge from "../components/ui/UcsdVerifiedBadge";
import Tip from "../components/ui/Tip";
import { conditionLabels, categoryLabels, zoneLabels } from "../components/listings/ListingCard";
import LoginPromptModal from "../components/ui/LoginPromptModal";
import SaveButton from "../components/listings/SaveButton";

export default function ListingDetail() {
  const [searchParams, setSearchParams] = useSearchParams();
  const listingId = searchParams.get("id");
  const navigate = useNavigate();
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (auth) => {
      if (auth) setUser(await base44.auth.me());
    });
  }, []);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", listingId],
    queryFn: async () => {
      const items = await base44.entities.Listing.filter({ id: listingId });
      return items[0];
    },
    enabled: !!listingId
  });

  const { data: saveCount = 0 } = useQuery({
    queryKey: ["save-count", listingId],
    queryFn: async () => {
      const items = await base44.entities.SavedListing.filter({ listing_id: listingId });
      return items.length;
    },
    enabled: !!listingId
  });

  // After login return, auto-open message flow
  useEffect(() => {
    if (searchParams.get("openMessage") === "true" && user && listing) {
      handleMessageSeller();
    }
  }, [user, listing, searchParams]);

  const handleMessageSeller = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    // Navigate to chat with listing info, conversation will be created on first message
    navigate(createPageUrl("MyMessages") + `?listingId=${listingId}&sellerEmail=${encodeURIComponent(listing.seller_email)}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="aspect-[16/10] rounded-2xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>);

  }

  if (!listing) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-semibold text-slate-700">Listing not found</h2>
        <Link to={createPageUrl("Browse")}>
          <Button variant="link" className="mt-2">Back to Browse</Button>
        </Link>
      </div>);

  }

  const photos = listing.photos?.length ?
  listing.photos :
  ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"];

  const isOwnListing = user?.email === listing.seller_email;

  const handleShareListing = () => {
    const url = `${window.location.origin}${createPageUrl("ListingDetail")}?id=${listingId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {showLoginModal &&
      <LoginPromptModal
        title="Log in to message sellers"
        body="UniTrade is student-only. Log in to keep trading safe."
        onClose={() => setShowLoginModal(false)}
        returnTo={`${window.location.origin}${createPageUrl("ListingDetail")}?id=${listingId}&openMessage=true`} />

      }
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">

        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Fullscreen overlay */}
        {fullscreen &&
        <div
          onClick={() => setFullscreen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "zoom-out"
          }}>

            <img
            src={photos[currentPhoto]}
            alt={listing.title}
            style={{ maxWidth: "95vw", maxHeight: "95vh", objectFit: "contain", borderRadius: 12 }}
            onClick={(e) => e.stopPropagation()} />

            <button
            onClick={() => setFullscreen(false)}
            style={{
              position: "absolute", top: 16, right: 20,
              background: "rgba(255,255,255,0.15)", border: "none",
              color: "white", fontSize: 28, cursor: "pointer",
              borderRadius: "50%", width: 40, height: 40,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
            ×</button>
          </div>
        }

        {/* Photos */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden cursor-zoom-in" style={{ backgroundColor: "#FFF8EE" }} onClick={() => setFullscreen(true)}>
            <img
              src={photos[currentPhoto]}
              alt={listing.title}
              loading="eager"
              decoding="async"
              className="w-full h-full object-contain" />

            {listing.status === "sold" &&
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold text-2xl tracking-widest uppercase">Sold</span>
              </div>
            }
            {photos.length > 1 &&
            <>
                <button
                onClick={(e) => {e.stopPropagation();setCurrentPhoto((p) => p === 0 ? photos.length - 1 : p - 1);}}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">

                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                onClick={(e) => {e.stopPropagation();setCurrentPhoto((p) => p === photos.length - 1 ? 0 : p + 1);}}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">

                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            }
          </div>
          {photos.length > 1 &&
          <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.map((p, i) =>
            <button
              key={i}
              onClick={() => setCurrentPhoto(i)}
              className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 ring-2 transition-all ${
              i === currentPhoto ? "ring-amber-500" : "ring-transparent"}`
              }>

                  <img src={p} alt="" className="w-full h-full object-cover" />
                </button>
            )}
            </div>
          }
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <h1 className="text-2xl font-bold text-slate-900">{listing.title}</h1>
              <SaveButton listingId={listingId} user={user} onLoginNeeded={() => setShowLoginModal(true)} />
            </div>
            <p className="text-3xl font-extrabold text-amber-600 mb-3">${listing.price}</p>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {listing.categories?.map((cat) =>
              <Badge key={cat} className="bg-amber-50 text-amber-700 border-0 text-xs">
                  {categoryLabels[cat] || cat}
                </Badge>
              ) ||
              <Badge className="bg-amber-50 text-amber-700 border-0 text-xs">
                  {categoryLabels[listing.category] || listing.category}
                </Badge>
              }
              <Badge variant="outline" className="text-xs">
                {conditionLabels[listing.condition] || listing.condition}
              </Badge>
            </div>
            {saveCount > 0 &&
            <p className="flex items-center gap-1 text-sm mt-1" style={{ color: "#9A8070" }}>
                <Bookmark className="w-3.5 h-3.5" style={{ fill: "#F6C453", color: "#F6C453" }} />
                {saveCount} {saveCount === 1 ? "person has" : "people have"} saved this listing
              </p>
            }
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">{listing.description}</p>

          <div className="bg-amber-100 p-4 rounded-xl space-y-3">
            {/* Exchange methods */}
            {listing.exchange_methods && listing.exchange_methods.length > 0 ?
            listing.exchange_methods.map((method, idx) =>
            <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {listing.exchange_methods.length > 1 && idx === 0 && <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-800 rounded-full">Preferred</span>}
                    <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 14px", borderRadius: 999, fontWeight: 800, fontSize: 13,
                  background: method.method === "pickup" ? "#EEF2FF" : method.method === "meetup" ? "#FFF8D6" : "#ECFDF5",
                  color: method.method === "pickup" ? "#4338CA" : method.method === "meetup" ? "#7A4A1A" : "#065F46",
                  border: `2px solid ${method.method === "pickup" ? "#C7D2FE" : method.method === "meetup" ? "#F8C35E" : "#6EE7B7"}`
                }}>
                      {method.method === "pickup" && "📦 Pick Up"}
                      {method.method === "meetup" && "🤝 Meet in Public"}
                      {method.method === "deliver" && "🚗 Seller Can Deliver"}
                    </span>
                  </div>
                  {method.method === "pickup" && method.pickup_location &&
              <div className="flex items-center gap-3 text-sm text-slate-600 ml-8">
                      <MapPin className="w-4 h-4 text-amber-500" />
                      <span>{method.pickup_location}</span>
                    </div>
              }
                  {method.method === "meetup" && (method.meetup_zone || method.meetup_other) &&
              <div className="flex items-center gap-3 text-sm text-slate-600 ml-8">
                      <MapPin className="w-4 h-4 text-amber-500" />
                      <span className="font-medium">
                        {method.meetup_zone ? zoneLabels[method.meetup_zone] || method.meetup_zone : method.meetup_other}
                      </span>
                    </div>
              }
                  {method.available_time &&
              <div className="flex items-center gap-3 text-sm text-slate-600 ml-8">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>{method.available_time}</span>
                    </div>
              }
                </div>
            ) :

            <>
                {listing.delivery_method &&
              <div className="flex items-center gap-2">
                    <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 14px", borderRadius: 999, fontWeight: 800, fontSize: 13,
                  background: listing.delivery_method === "pickup" ? "#EEF2FF" : listing.delivery_method === "meetup" ? "#FFF8D6" : "#ECFDF5",
                  color: listing.delivery_method === "pickup" ? "#4338CA" : listing.delivery_method === "meetup" ? "#7A4A1A" : "#065F46",
                  border: `2px solid ${listing.delivery_method === "pickup" ? "#C7D2FE" : listing.delivery_method === "meetup" ? "#F8C35E" : "#6EE7B7"}`
                }}>
                      {listing.delivery_method === "pickup" && "📦 Pick Up"}
                      {listing.delivery_method === "meetup" && "🤝 Meet in Public"}
                      {listing.delivery_method === "deliver" && "🚗 Seller Can Deliver"}
                    </span>
                  </div>
              }
                {listing.delivery_method === "pickup" && listing.pickup_location &&
              <div className="flex items-center gap-3 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    <span>{listing.pickup_location}</span>
                  </div>
              }
                {listing.delivery_method === "meetup" && (listing.meetup_zone || listing.meetup_other) &&
              <div className="flex items-center gap-3 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    <span className="font-medium">
                      {listing.meetup_zone ? zoneLabels[listing.meetup_zone] || listing.meetup_zone : listing.meetup_other}
                    </span>
                  </div>
              }
                {!listing.delivery_method && listing.meetup_zone &&
              <div className="flex items-center gap-3 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    <span className="font-medium">{zoneLabels[listing.meetup_zone] || listing.meetup_zone}</span>
                  </div>
              }
                {listing.available_time &&
              <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>{listing.available_time}</span>
                  </div>
              }
              </>
            }
            <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
              
              








            </div>
          </div>

          {/* Seller info */}
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
            <Link
              to={createPageUrl("PublicProfile") + `?email=${encodeURIComponent(listing.seller_email)}`}
              className="flex items-center gap-3 p-4 hover:bg-amber-50 hover:border-amber-200 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold overflow-hidden">
                {listing.seller_photo ?
                <img src={listing.seller_photo} alt="" className="w-full h-full object-cover" /> :
                listing.seller_name?.[0]?.toUpperCase() || "S"
                }
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-semibold text-sm text-slate-900">{listing.seller_name || "Seller"}</p>
                  {listing.seller_is_ucsd_verified && <UcsdVerifiedBadge />}
                </div>
                <p className="text-xs text-slate-500">UCSD Student · View profile →</p>
              </div>
            </Link>

            {/* Bio */}
            {listing.seller_bio && (
              <div className="px-4 pb-3 text-xs text-slate-600 border-t border-slate-50 pt-2">
                {listing.seller_bio}
              </div>
            )}

            {/* Contact Methods */}
            {listing.seller_preferred_contacts && Object.keys(listing.seller_preferred_contacts).some(k => listing.seller_preferred_contacts[k] && k !== "other_label") && (
              <div className="px-4 pb-4 space-y-1.5 border-t border-slate-50 pt-2">
                <p className="text-xs font-bold text-slate-500 mb-1">Preferred Contact</p>
                {[
                  { key: "email", label: "Email", icon: Mail },
                  { key: "phone", label: "Phone", icon: Phone },
                  { key: "instagram", label: "Instagram", icon: MessageSquare },
                  { key: "whatsapp", label: "WhatsApp", icon: MessageSquare },
                  { key: "wechat", label: "WeChat", icon: MessageSquare },
                ].filter(m => listing.seller_preferred_contacts[m.key]).map(m => (
                  <div key={m.key} className="flex items-center gap-2 text-xs">
                    <m.icon className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-slate-700"><strong>{m.label}:</strong> {listing.seller_preferred_contacts[m.key]}</span>
                  </div>
                ))}
                {listing.seller_preferred_contacts["other_value"] && (
                  <div className="flex items-center gap-2 text-xs">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-slate-700"><strong>{listing.seller_preferred_contacts["other_label"] || "Other"}:</strong> {listing.seller_preferred_contacts["other_value"]}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <Tip text="Check the seller's rating and response time before making a trade." />

          {!isOwnListing && listing.status === "available" &&
          <Button
            onClick={handleMessageSeller}
            size="lg"
            className="w-full bg-slate-900 hover:bg-slate-800 rounded-xl h-12 text-base gap-2">

              <MessageSquare className="w-4 h-4" />
              Message Seller
            </Button>
          }

          <div className="flex items-start gap-2 p-3 bg-emerald-50 rounded-xl text-xs text-emerald-700">
            <Shield className="w-4 h-4 shrink-0 mt-0.5" />
            <span>For your safety, always meet in designated campus zones during daylight hours.</span>
          </div>
        </div>
      </div>
    </div>);

}