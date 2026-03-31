import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthContext";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { LogOut, Camera, Loader2, CheckCircle, Package, AlertCircle, MessageCircle, Mail, Phone, Pencil } from "lucide-react";
import UcsdVerifiedBadge from "../components/ui/UcsdVerifiedBadge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import moment from "moment";
import { categoryLabels } from "../components/listings/ListingCard";

const CONTACT_METHODS = [
  { key: "email", icon: Mail, label: "Email", placeholder: "your@email.com" },
  { key: "phone", icon: Phone, label: "Phone", placeholder: "+1 (555) 000-0000" },
  { key: "instagram", icon: MessageCircle, label: "Instagram", placeholder: "@username" },
  { key: "whatsapp", icon: MessageCircle, label: "WhatsApp", placeholder: "+1 (555) 000-0000" },
  { key: "wechat", icon: MessageCircle, label: "WeChat", placeholder: "wechat_id" },
];

export default function Profile() {
   const { user, isLoadingAuth, refreshUser } = useAuth();
   const [profilePhoto, setProfilePhoto] = useState("");
   const [uploading, setUploading] = useState(false);
   const [saved, setSaved] = useState(false);
   const [activeTab, setActiveTab] = useState("selling");
   const [editingContacts, setEditingContacts] = useState(false);
   const [contacts, setContacts] = useState({});
   const [editingBio, setEditingBio] = useState(false);
   const [bio, setBio] = useState("");

   useEffect(() => {
     if (user) {
       setProfilePhoto(user.profile_photo || "");
       setContacts(user.preferred_contacts || {});
       setBio(user.bio || "");
     }
   }, [user]);

  const { data: myListings = [] } = useQuery({
    queryKey: ["profile-listings", user?.email],
    queryFn: () => base44.entities.Listing.filter({ seller_email: user.email }, "-created_date"),
    enabled: !!user,
  });

  const syncListingSnapshots = async (updates) => {
    const myListingIds = myListings.map((l) => l.id);
    await Promise.all(
      myListingIds.map((id) => base44.entities.Listing.update(id, updates))
    );
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setProfilePhoto(file_url);
    await base44.auth.updateMe({ profile_photo: file_url });
    await syncListingSnapshots({ seller_photo: file_url });
    await refreshUser();
    setUploading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveContacts = async () => {
    await base44.auth.updateMe({ preferred_contacts: contacts });
    await syncListingSnapshots({ seller_preferred_contacts: contacts });
    await refreshUser();
    setEditingContacts(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveBio = async () => {
    await base44.auth.updateMe({ bio });
    await syncListingSnapshots({ seller_bio: bio });
    await refreshUser();
    setEditingBio(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };


  if (isLoadingAuth || !user) return null;

  const selling = myListings.filter((l) => l.status === "available");
  const sold = myListings.filter((l) => l.status === "sold");
  const totalSold = sold.length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── Profile Header Card ── */}
      <div
        className="rounded-3xl overflow-hidden shadow-sm border-2"
        style={{ borderColor: "#F0DFC0", background: "linear-gradient(160deg, #FFF8EE 0%, #FDE8BF 100%)" }}
      >
        {/* Banner */}
        <div className="h-24 w-full" style={{ background: "linear-gradient(135deg, #F8C35E 0%, #F5A823 80%, #E09B15 100%)" }} />

        <div className="px-6 pb-6">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md" style={{ background: "linear-gradient(135deg, #F8C35E, #E09B15)" }}>
                {profilePhoto ? (
                  <img src={profilePhoto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center text-white text-3xl font-black">
                    {user.full_name?.[0]?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-white border-2 border-amber-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-amber-50 transition-colors shadow">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" /> : <Camera className="w-3.5 h-3.5 text-amber-500" />}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { base44.auth.logout(); window.location.href = createPageUrl("Landing"); }}
              className="rounded-full gap-1.5 text-red-400 border-red-200 hover:bg-red-50 text-xs h-8"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </Button>
          </div>

          {/* Name & info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
               <h1 className="text-xl font-black" style={{ color: "#4A3B2A" }}>{user.full_name}</h1>
               {user.is_ucsd_verified && <UcsdVerifiedBadge />}
               {saved && <span className="text-xs text-emerald-600 flex items-center gap-1 font-bold"><CheckCircle className="w-3 h-3" /> Saved</span>}
             </div>
            <p className="text-sm" style={{ color: "#9A7B5A" }}>{user.email}</p>

            {/* Bio */}
            <div className="mt-2">
              {editingBio ? (
                <div className="space-y-2">
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Write a short bio about yourself..."
                    className="min-h-[70px] rounded-xl text-sm resize-none"
                    style={{ borderColor: "#F0DFC0" }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveBio} className="bg-amber-600 hover:bg-amber-700 rounded-lg text-xs h-7">Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditingBio(false); setBio(user.bio || ""); }} className="rounded-lg text-xs h-7">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-start gap-1 cursor-pointer group"
                  onClick={() => setEditingBio(true)}
                >
                  <p className="text-sm" style={{ color: bio ? "#7A5C3E" : "#BBAA99" }}>
                    {bio || "Add a bio..."}
                  </p>
                  <Pencil className="w-3 h-3 mt-0.5 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" style={{ color: "#9A7B5A" }} />
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-4 mt-5 flex-wrap">
            <div className="text-center">
              <p className="text-lg font-black" style={{ color: "#4A3B2A" }}>{totalSold}</p>
              <p className="text-xs" style={{ color: "#9A7B5A" }}>Items Sold</p>
            </div>
            <div className="w-px bg-amber-200" />
            <div className="text-center">
              <p className="text-lg font-black" style={{ color: "#4A3B2A" }}>{selling.length}</p>
              <p className="text-xs" style={{ color: "#9A7B5A" }}>Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Profile Photo Notification ── */}
      {!profilePhoto && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3" style={{ background: "#FFF8EE" }}>
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm" style={{ color: "#7A4A1A" }}>Add a Profile Picture!</p>
            <p className="text-xs mt-1" style={{ color: "#9A7B5A" }}>Use a cute smiley face 😊 to increase your credibility and help buyers feel confident trading with you.</p>
          </div>
        </div>
      )}


      {/* ── Contact Methods ── */}
      <div className="bg-white rounded-3xl border-2 p-5" style={{ borderColor: "#F0DFC0" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-lg" style={{ color: "#4A3B2A" }}>💬 Preferred Contact Methods</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingContacts(!editingContacts)}
            className="text-amber-600 hover:bg-amber-50 rounded-lg text-xs font-bold"
          >
            {editingContacts ? "Done" : "Edit"}
          </Button>
        </div>

        {editingContacts ? (
          <div className="space-y-3">
            {CONTACT_METHODS.map((method) => (
              <div key={method.key} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={method.placeholder}
                  value={contacts[method.key] || ""}
                  onChange={(e) => setContacts({ ...contacts, [method.key]: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: "#FFF8EE", color: "#7A4A1A" }}>{method.label}</span>
              </div>
            ))}
            {/* Other */}
            <div className="space-y-1.5 pt-1 border-t border-amber-100">
              <span className="text-xs font-semibold" style={{ color: "#7A4A1A" }}>Other</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Method name (e.g. Telegram)"
                  value={contacts["other_label"] || ""}
                  onChange={(e) => setContacts({ ...contacts, other_label: e.target.value })}
                  className="w-32 px-3 py-2 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <input
                  type="text"
                  placeholder="Contact detail"
                  value={contacts["other_value"] || ""}
                  onChange={(e) => setContacts({ ...contacts, other_value: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
            </div>
            <Button
              onClick={handleSaveContacts}
              className="w-full bg-amber-600 hover:bg-amber-700 rounded-lg text-sm font-bold mt-3"
            >
              Save Contact Methods
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(contacts).filter(([k, v]) => v && k !== "other_label" && k !== "other_value").length === 0 && !contacts["other_value"] ? (
              <p className="text-sm" style={{ color: "#9A7B5A" }}>No contact methods added yet. Click Edit to add your preferred ways to be contacted.</p>
            ) : (
              <>
                {Object.entries(contacts)
                  .filter(([key, value]) => value && key !== "other_label" && key !== "other_value")
                  .map(([key, value]) => {
                    const method = CONTACT_METHODS.find(m => m.key === key);
                    const IconComponent = method?.icon;
                    return (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        {IconComponent && <IconComponent className="w-4 h-4" style={{ color: "#F5A823" }} />}
                        <span style={{ color: "#4A3B2A" }}><strong>{method?.label}:</strong> {value}</span>
                      </div>
                    );
                  })}
                {contacts["other_value"] && (
                  <div className="flex items-center gap-2 text-sm">
                    <MessageCircle className="w-4 h-4" style={{ color: "#F5A823" }} />
                    <span style={{ color: "#4A3B2A" }}><strong>{contacts["other_label"] || "Other"}:</strong> {contacts["other_value"]}</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Listings Tabs ── */}
      <div className="bg-white rounded-3xl border-2 p-5" style={{ borderColor: "#F0DFC0" }}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full rounded-2xl mb-5" style={{ background: "#FFF8EE" }}>
            <TabsTrigger value="selling" className="flex-1 rounded-xl text-sm font-bold gap-1.5">
              🛍 Selling ({selling.length})
            </TabsTrigger>
            <TabsTrigger value="sold" className="flex-1 rounded-xl text-sm font-bold gap-1.5">
              💰 Sold ({sold.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="selling">
            <ListingGrid listings={selling} emptyText="No active listings" />
          </TabsContent>
          <TabsContent value="sold">
            <ListingGrid listings={sold} emptyText="No sold items yet" />
          </TabsContent>
        </Tabs>
      </div>



    </div>
  );
}

function ListingGrid({ listings, emptyText }) {
  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-10 h-10 mx-auto mb-3" style={{ color: "#D4B896" }} />
        <p className="text-sm font-semibold" style={{ color: "#9A7B5A" }}>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {listings.map((listing) => {
        const photo = listing.photos?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80";
        return (
          <Link
            key={listing.id}
            to={createPageUrl("ListingDetail") + `?id=${listing.id}`}
            className="group block rounded-2xl overflow-hidden border-2 hover:shadow-md transition-all"
            style={{ borderColor: "#F0DFC0" }}
          >
            <div className="aspect-square overflow-hidden bg-amber-50">
              <img src={photo} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <div className="p-2.5">
              <p className="text-xs font-bold truncate" style={{ color: "#4A3B2A" }}>{listing.title}</p>
              <p className="text-sm font-black" style={{ color: "#E09B15" }}>${listing.price}</p>
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={listing.status === "sold"
                  ? { background: "#F3F4F6", color: "#6B7280" }
                  : { background: "#D1FAE5", color: "#065F46" }
                }
              >
                {listing.status === "sold" ? "Sold" : "Available"}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}