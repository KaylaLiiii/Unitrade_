import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import SaveButton from "./SaveButton";

const conditionLabels = {
  new: "New",
  like_new: "Like New",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

const conditionColors = {
  new: { bg: "#E8F8ED", color: "#2E7D50", border: "#8FCB9B" },
  like_new: { bg: "#FFF8D6", color: "#8B6C00", border: "#F8C35E" },
  good: { bg: "#E8F0FF", color: "#3459A5", border: "#A7D8F0" },
  fair: { bg: "#FFF0E0", color: "#9B5A00", border: "#FFB86C" },
  poor: { bg: "#F5F5F5", color: "#666", border: "#ccc" },
};

const categoryLabels = {
  textbooks: "📚 Textbooks",
  electronics: "💻 Electronics",
  furniture: "🪑 Furniture",
  clothing: "👕 Clothing",
  bikes: "🚲 Bikes & Scooters",
  dorm_essentials: "🛏️ Dorm",
  tickets: "🎟️ Tickets",
  food: "🍜 Food",
  game: "🎮 Game",
  kitchen: "🍽️ Kitchen",
  other: "📦 Other",
};

const zoneLabels = {
  price_center: "Price Center",
  geisel_library: "Geisel Library",
  student_center: "Student Center",
  sun_god: "Sun God Lawn",
  rimac: "RIMAC",
  sixth_market: "Sixth Market",
  warren_mall: "Warren Mall",
  muir_quad: "Muir Quad",
};

export default function ListingCard({ listing, user }) {
  const rawPhoto = listing.photos?.[0] || null;
  const photo = rawPhoto
    ? (rawPhoto.includes("unsplash.com")
        ? rawPhoto.replace(/[?&]w=\d+/, "").replace(/[?&]q=\d+/, "") + (rawPhoto.includes("?") ? "&" : "?") + "w=400&q=70&fm=webp"
        : rawPhoto)
    : null;

  return (
    <Link to={createPageUrl("ListingDetail") + `?id=${listing.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div style={{ cursor: "pointer" }}>
        {/* Image */}
        <div style={{
          position: "relative",
          aspectRatio: "4/5",
          overflow: "hidden",
          borderRadius: "12px",
          background: "#F0E8DA",
        }}>
          {photo ? (
            <img
              src={photo}
              alt={listing.title}
              loading="lazy"
              decoding="async"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#C4A882", fontSize: "28px",
            }}>📦</div>
          )}

          {/* Save button */}
          <div style={{ position: "absolute", top: 6, right: 6, zIndex: 2 }}>
            <SaveButton listingId={listing.id} user={user} />
          </div>

          {/* Sold overlay */}
          {listing.status === "sold" && (
            <div style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.48)",
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "12px",
            }}>
              <span style={{
                color: "white", fontWeight: 800, fontSize: "15px",
                background: "rgba(0,0,0,0.45)", padding: "4px 14px",
                borderRadius: "999px", border: "1.5px solid rgba(255,255,255,0.6)",
                letterSpacing: "1.5px",
              }}>SOLD</span>
            </div>
          )}
        </div>

        {/* Info below image */}
        <div style={{ paddingTop: "6px", paddingLeft: "2px", paddingRight: "2px" }}>
          <div style={{
            fontWeight: 800, fontSize: "14px", color: "#1A1A1A",
            marginBottom: "2px", lineHeight: 1.2,
          }}>
            ${listing.price}
          </div>
          <div style={{
            fontWeight: 500, fontSize: "12px", color: "#555",
            lineHeight: 1.3,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {listing.title}
          </div>
        </div>
      </div>
    </Link>
  );
}

export { conditionLabels, categoryLabels, zoneLabels };