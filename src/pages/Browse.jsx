import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ListingCard from "../components/listings/ListingCard";
import { categoryLabels } from "../components/listings/ListingCard";

export default function Browse() {

  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState("all");
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["listings"],
    queryFn: () => base44.entities.Listing.list("-created_date", 200)
  });

  const filtered = listings.
  filter((l) => l.status === "available").
  filter((l) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        l.title?.toLowerCase().includes(term) ||
        l.description?.toLowerCase().includes(term));

    }
    return true;
  }).
  filter((l) => category === "all" ? true : l.categories?.includes(category) || l.category === category).
  filter((l) => {
    if (priceRange === "all") return true;
    if (priceRange === "0-25") return l.price <= 25;
    if (priceRange === "25-50") return l.price > 25 && l.price <= 50;
    if (priceRange === "50-100") return l.price > 50 && l.price <= 100;
    if (priceRange === "100+") return l.price > 100;
    return true;
  }).
  sort((a, b) => {
    if (sortBy === "newest") return new Date(b.created_date) - new Date(a.created_date);
    if (sortBy === "price_asc") return (a.price || 0) - (b.price || 0);
    if (sortBy === "price_desc") return (b.price || 0) - (a.price || 0);
    return 0;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Search + Filters row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 180px", minWidth: 0 }}>
          <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#999" }} />
          <input
            placeholder="Search listings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%", paddingLeft: 32, paddingRight: searchTerm ? 32 : 10,
              paddingTop: 8, paddingBottom: 8,
              border: "1.5px solid #E5E7EB", borderRadius: 10,
              fontSize: 13, outline: "none", background: "#fff",
              boxSizing: "border-box",
            }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, color: "#999" }}>
              <X style={{ width: 13, height: 13 }} />
            </button>
          )}
        </div>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-36 rounded-lg text-xs h-9">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categoryLabels).map(([k, v]) =>
              <SelectItem key={k} value={k}>{v}</SelectItem>
            )}
          </SelectContent>
        </Select>

        <Select value={priceRange} onValueChange={setPriceRange}>
          <SelectTrigger className="w-28 rounded-lg text-xs h-9">
            <SelectValue placeholder="Price" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Price</SelectItem>
            <SelectItem value="0-25">Under $25</SelectItem>
            <SelectItem value="25-50">$25 – $50</SelectItem>
            <SelectItem value="50-100">$50 – $100</SelectItem>
            <SelectItem value="100+">$100+</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-32 rounded-lg text-xs h-9">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="price_asc">Price: Low → High</SelectItem>
            <SelectItem value="price_desc">Price: High → Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p style={{ fontSize: 12, color: "#888", margin: 0 }}>{filtered.length} listings</p>

      {/* Grid */}
      {isLoading ? (
        <div style={{ display: "grid", gap: "12px" }} className="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array(10).fill(0).map((_, i) => (
            <div key={i}>
              <Skeleton style={{ aspectRatio: "4/5", borderRadius: 12, width: "100%" }} />
              <Skeleton style={{ height: 14, width: "60%", marginTop: 6, borderRadius: 6 }} />
              <Skeleton style={{ height: 12, width: "80%", marginTop: 4, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#999" }}>
          <Search style={{ width: 40, height: 40, margin: "0 auto 12px", opacity: 0.3 }} />
          <div style={{ fontWeight: 700, fontSize: 15, color: "#555" }}>No listings found</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your filters</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}
             className="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} user={user} />
          ))}
        </div>
      )}
    </div>);

}