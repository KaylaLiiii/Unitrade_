import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Pencil, CheckCircle, Trash2, Package, AlertTriangle } from "lucide-react";
import confetti from "canvas-confetti";

export default function MyListings() {
   const { user, isAuthenticated, isLoadingAuth } = useAuth();
   const [showOnHoldModal, setShowOnHoldModal] = useState(false);
   const [holdItem, setHoldItem] = useState(null);
   const [showSoldItems, setShowSoldItems] = useState(false);
   const [showSalePriceModal, setShowSalePriceModal] = useState(false);
   const [currentSaleItem, setCurrentSaleItem] = useState(null);
   const [salePrice, setSalePrice] = useState("");
   const [editingSalePrice, setEditingSalePrice] = useState(null);
   const queryClient = useQueryClient();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["my-listings", user?.email],
    queryFn: () => base44.entities.Listing.filter({ seller_email: user.email }, "-created_date"),
    enabled: !!user,
  });

  const markSold = useMutation({
    mutationFn: ({ id, sale_price }) => base44.entities.Listing.update(id, { status: "sold", sale_price }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      const duration = 3000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({ particleCount: 7, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#F8C35E","#F5A823","#10B981","#60A5FA","#F472B6"] });
        confetti({ particleCount: 7, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#F8C35E","#F5A823","#10B981","#60A5FA","#F472B6"] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
      setShowSalePriceModal(false);
      setSalePrice("");
      setCurrentSaleItem(null);
    },
  });

  const updateSalePrice = useMutation({
    mutationFn: ({ id, sale_price }) => base44.entities.Listing.update(id, { sale_price }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      setEditingSalePrice(null);
      setSalePrice("");
    },
  });

  const handleMarkSold = (id) => {
    const listing = listings.find(l => l.id === id);
    setCurrentSaleItem(listing);
    setSalePrice("");
    setShowSalePriceModal(true);
  };

  const handleSaleSubmit = () => {
    if (!salePrice || parseFloat(salePrice) < 0) return;
    markSold.mutate({ id: currentSaleItem.id, sale_price: parseFloat(salePrice) });
  };

  const handleSaveSalePrice = () => {
    if (!salePrice || parseFloat(salePrice) < 0) return;
    updateSalePrice.mutate({ id: editingSalePrice, sale_price: parseFloat(salePrice) });
  };

  const totalIncome = listings.filter((l) => l.status === "sold").reduce((sum, l) => sum + (l.sale_price || l.price), 0);

  const deleteListing = useMutation({
    mutationFn: (id) => base44.entities.Listing.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-listings"] }),
  });

  const toggleOnHold = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Listing.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-listings", user?.email] }),
  });

  const handleToggleOnHold = (listing) => {
    if (listing.status === "on_hold") {
      toggleOnHold.mutate({ id: listing.id, status: "available" });
    } else {
      setHoldItem(listing.id);
      setShowOnHoldModal(true);
    }
  };

  const handleConfirmOnHold = async () => {
    toggleOnHold.mutate({ id: holdItem, status: "on_hold" });
    setShowOnHoldModal(false);
    setHoldItem(null);
  };



  const activeListings = listings.filter((l) => l.status !== "sold");
  const soldListings = listings.filter((l) => l.status === "sold");

  if (isLoadingAuth) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Listings</h1>
          <p className="text-sm text-slate-500 mt-1">{activeListings.length} active</p>
        </div>
        <Link to={createPageUrl("CreateListing")}>
          <Button className="bg-slate-900 hover:bg-slate-800 rounded-xl gap-2">
            <PlusCircle className="w-4 h-4" />
            New Listing
          </Button>
        </Link>
      </div>

      {/* Cashier Card */}
      <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="font-black text-lg text-amber-900 mb-2">💰 Cashier</h2>
            <p className="text-3xl font-black text-amber-600">${totalIncome.toFixed(2)}</p>
            <p className="text-sm text-amber-700 mt-1">Total income from {soldListings.length} sold {soldListings.length === 1 ? "item" : "items"}</p>
          </div>
          {soldListings.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSoldItems(!showSoldItems)}
              className="rounded-lg border-amber-200 text-amber-800 hover:bg-amber-100 text-xs font-bold h-8"
            >
              {showSoldItems ? "Hide" : "View"} Sold ({soldListings.length})
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl">
              <Skeleton className="w-24 h-24 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : activeListings.length === 0 && !showSoldItems ? (
        <div className="text-center py-20 bg-white rounded-2xl">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-700">No active listings</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">Post your first item to get started</p>
          <Link to={createPageUrl("CreateListing")}>
            <Button className="bg-slate-900 hover:bg-slate-800 rounded-xl">Post a Listing</Button>
          </Link>
        </div>
      ) : showSoldItems ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-slate-900">Sold Items</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowSoldItems(false)} className="text-slate-500 text-xs h-7">
              Back to Active
            </Button>
          </div>
          {soldListings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-600">No sold items yet</p>
            </div>
          ) : (
            soldListings.map((listing) => {
              const photo = listing.photos?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80";
              return (
                <div
                  key={listing.id}
                  className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100"
                >
                  <Link
                    to={createPageUrl("ListingDetail") + `?id=${listing.id}`}
                    className="w-20 h-20 rounded-xl overflow-hidden shrink-0"
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={createPageUrl("ListingDetail") + `?id=${listing.id}`}
                      className="font-semibold text-sm text-slate-900 hover:text-amber-600 transition-colors"
                    >
                      {listing.title}
                    </Link>
                    <p className="text-sm font-bold text-amber-600 mt-1">${listing.price}</p>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span>Sale price: <span className="font-bold text-amber-600">${listing.sale_price || listing.price}</span></span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 rounded"
                        onClick={() => {
                          setEditingSalePrice(listing.id);
                          setSalePrice((listing.sale_price || listing.price).toString());
                        }}
                      >
                        <Pencil className="w-3 h-3 text-amber-600" />
                      </Button>
                    </div>
                    </div>
                    <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg shrink-0"
                    onClick={() => { if (window.confirm("Are you sure you want to delete this listing?")) deleteListing.mutate(listing.id); }}
                    >
                    <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {activeListings.map((listing) => {
            const photo = listing.photos?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80";
            return (
              <div
                key={listing.id}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-sm transition-shadow"
              >
                <Link
                  to={createPageUrl("ListingDetail") + `?id=${listing.id}`}
                  className="w-20 h-20 rounded-xl overflow-hidden shrink-0"
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      to={createPageUrl("ListingDetail") + `?id=${listing.id}`}
                      className="font-semibold text-sm text-slate-900 hover:text-amber-600 truncate transition-colors"
                    >
                      {listing.title}
                    </Link>
                    <Badge
                      className={
                        listing.status === "on_hold"
                          ? "bg-orange-100 text-orange-700 border-0 text-xs"
                          : "bg-emerald-50 text-emerald-700 border-0 text-xs"
                      }
                    >
                      {listing.status === "on_hold" ? "On Hold" : "Available"}
                    </Badge>
                  </div>
                  <p className="text-sm font-bold text-amber-600">${listing.price}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                   {listing.status !== "sold" && (

                     <>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-9 w-9 rounded-lg"
                         title={listing.status === "on_hold" ? "Remove from on-hold" : "Mark on hold"}
                         onClick={() => handleToggleOnHold(listing)}
                         style={{ color: listing.status === "on_hold" ? "#F5A823" : "#999" }}
                       >
                         <AlertTriangle className="w-4 h-4" />
                       </Button>
                       <Link to={createPageUrl("CreateListing") + `?edit=${listing.id}`}>
                         <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                           <Pencil className="w-4 h-4 text-slate-500" />
                         </Button>
                       </Link>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-9 w-9 rounded-lg"
                         onClick={() => handleMarkSold(listing.id)}
                       >
                         <CheckCircle className="w-4 h-4 text-emerald-500" />
                       </Button>
                     </>
                   )}
                   <Button
                     variant="ghost"
                     size="icon"
                     className="h-9 w-9 rounded-lg"
                     onClick={() => { if (window.confirm("Are you sure you want to delete this listing?")) deleteListing.mutate(listing.id); }}
                   >
                     <Trash2 className="w-4 h-4 text-red-400" />
                   </Button>
                 </div>
              </div>
            );
          })}
        </div>
        )}

        {/* Sale Price Modal */}
         {showSalePriceModal && (
           <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
             <div className="bg-white rounded-3xl p-6 max-w-sm w-full border-2 border-amber-200">
               <h3 className="font-black text-lg text-slate-900 mb-2">How much did you sell it for?</h3>
               <p className="text-sm text-slate-500 mb-4">{currentSaleItem?.title}</p>
               <input
                 type="number"
                 placeholder="Enter sale price"
                 value={salePrice}
                 onChange={(e) => setSalePrice(e.target.value)}
                 className="w-full px-3 py-2 rounded-xl border border-amber-200 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-amber-300 mb-4"
                 min="0"
                 step="0.01"
               />
               <div className="flex gap-2">
                 <Button
                   variant="outline"
                   onClick={() => setShowSalePriceModal(false)}
                   className="flex-1 rounded-lg"
                 >
                   Cancel
                 </Button>
                 <Button
                   onClick={handleSaleSubmit}
                   className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold"
                 >
                   Confirm Sale
                 </Button>
               </div>
             </div>
           </div>
         )}

         {/* Edit Sale Price Modal */}
         {editingSalePrice && (
           <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
             <div className="bg-white rounded-3xl p-6 max-w-sm w-full border-2 border-amber-200">
               <h3 className="font-black text-lg text-slate-900 mb-2">Edit Sale Price</h3>
               <input
                 type="number"
                 placeholder="Enter sale price"
                 value={salePrice}
                 onChange={(e) => setSalePrice(e.target.value)}
                 className="w-full px-3 py-2 rounded-xl border border-amber-200 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-amber-300 mb-4"
                 min="0"
                 step="0.01"
               />
               <div className="flex gap-2">
                 <Button
                   variant="outline"
                   onClick={() => setEditingSalePrice(null)}
                   className="flex-1 rounded-lg"
                 >
                   Cancel
                 </Button>
                 <Button
                   onClick={handleSaveSalePrice}
                   className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold"
                 >
                   Save Price
                 </Button>
               </div>
             </div>
           </div>
         )}

        {/* On Hold Modal */}
         {showOnHoldModal && (
           <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
             <div className="bg-white rounded-3xl p-6 max-w-sm w-full border-2 border-amber-200">
               <h3 className="font-black text-lg text-slate-900 mb-3">⚠️ Mark as On Hold?</h3>
               <p className="text-sm text-slate-600 mb-4">When an item is on hold, it won't appear in the Browse page until you cancel the on-hold status.</p>
               <div className="flex gap-2">
                 <Button
                   variant="outline"
                   onClick={() => setShowOnHoldModal(false)}
                   className="flex-1 rounded-lg"
                 >
                   Cancel
                 </Button>
                 <Button
                   onClick={handleConfirmOnHold}
                   className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold"
                 >
                   Mark as On Hold
                 </Button>
               </div>
             </div>
           </div>
         )}


        </div>
        );
}