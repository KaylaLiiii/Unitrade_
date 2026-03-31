import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import LoginPromptModal from "../components/ui/LoginPromptModal";
import { useAuth } from "@/components/AuthContext";
import { ShoppingBag, Zap, MapPin, GraduationCap, Phone, Mail, CheckCircle2 } from "lucide-react";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699a897eb1c2153fb4e55c01/7a8682d9d_ChatGPTImageFeb212026at09_10_29PM.png";

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated: isAuth } = useAuth();
  const [loginModal, setLoginModal] = useState(null);

  const { data: featuredListings = [] } = useQuery({
    queryKey: ["featured-listings"],
    queryFn: () => base44.entities.Listing.filter({ status: "available" }, "-created_date", 6)
  });

  const handlePostItem = () => {
    if (!isAuth) {
      base44.auth.redirectToLogin(window.location.origin + createPageUrl("CreateListing"));
    } else {
      navigate(createPageUrl("CreateListing"));
    }
  };

  return (
    <div style={{ fontFamily: "'Nunito', system-ui, sans-serif" }}>
      {loginModal &&
      <LoginPromptModal
        title={loginModal.title}
        body={loginModal.body}
        onClose={() => setLoginModal(null)}
        returnTo={loginModal.returnTo} />

      }

      {/* Hero */}
      <section className="px-5 pt-8 pb-12 text-center" style={{ paddingTop: 32, paddingBottom: 56, paddingLeft: 20, paddingRight: 20 }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <img src={LOGO_URL} alt="UniTrade" style={{ width: 80, height: 80, margin: "0 auto 16px", objectFit: "contain" }} />
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#00629B", color: "#FFD700", borderRadius: 999, padding: "6px 18px", fontWeight: 900, fontSize: 14, marginBottom: 14, letterSpacing: 1 }}>
            <GraduationCap size={16} color="#FFD700" /> UCSD Only
          </div>
          <h1 style={{ fontSize: "clamp(28px, 8vw, 56px)", fontWeight: 900, lineHeight: 1.1, color: "#4A3B2A", marginBottom: 14 }}>
            On-Campus Marketplace
          </h1>

          <p style={{ fontSize: "clamp(14px, 4vw, 18px)", color: "#7A5C3E", fontWeight: 600, lineHeight: 1.6, marginBottom: 24 }}>
            Buy &amp; Sell with Students Near You.<br />
            Fast. Simple. Safe.
          </p>

          <Link to={createPageUrl("Browse")} className="bg-yellow-400 text-base font-semibold normal-case rounded-[28px] land-btn-primary" style={{ fontSize: 16, padding: "14px 36px", display: "inline-flex", marginBottom: 12, gap: 8 }}>
            <ShoppingBag size={18} /> Start Browsing
          </Link>

          <div style={{ marginBottom: 32 }}>
            <button onClick={() => base44.auth.redirectToLogin()} className="bg-[#ffefc7] rounded-[28px] land-btn-secondary" style={{ fontSize: 16, padding: "14px 36px", display: "inline-flex" }}>
              Join with UCSD Google
            </button>
          </div>


          {/* Trust Badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, maxWidth: 560, margin: "0 auto", justifyContent: "center" }}>
            {[
              [<CheckCircle2 size={14} color="#5BAA7A" />, "UCSD Verified"],
              [<Zap size={14} color="#F5A823" />, "Fast Messaging"],
              [<MapPin size={14} color="#E07050" />, "Campus Pickup"]
            ].map(([icon, label]) =>
            <div key={label} style={{ padding: "10px 14px", background: "#FAFAF8", borderRadius: 12, fontSize: 13, fontWeight: 700, color: "#4A3B2A", display: "flex", alignItems: "center", gap: 6 }}>
                {icon} {label}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Why UniTrade */}
      <section style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 96 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 900, color: "#4A3B2A", textAlign: "center", marginBottom: 56 }}>Why UniTrade?</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, maxWidth: 900, margin: "0 auto" }}>
            {/* Other Marketplaces */}
            <div style={{ padding: "28px 28px", background: "#F8F8F6", borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: "#7A5C3E", marginBottom: 20, textAlign: "left" }}>Other Marketplaces</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {["Anyone can join", "Slow replies", "Scammers & bots", "Hard to trust strangers", "Charges service/transaction fee"].map((item) =>
                <li key={item} style={{ fontSize: 15, color: "#888", marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ color: "#DDD", fontWeight: 900, marginTop: 2 }}>✕</span>
                    <span>{item}</span>
                  </li>
                )}
              </ul>
            </div>

            {/* UniTrade */}
            <div style={{ padding: "28px 28px", background: "linear-gradient(135deg, #FFF9E6 0%, #FFFCF0 100%)", borderRadius: 20, border: "2px solid #F6C453", boxShadow: "0 8px 24px rgba(246,196,83,0.15)" }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: "#4A3B2A", marginBottom: 20, textAlign: "left" }}>UniTrade</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {["UCSD students only", "Instant messaging", "In-campus trades only", "Clean & trustworthy", "100% free"].map((item) =>
                <li key={item} style={{ fontSize: 15, color: "#4A3B2A", marginBottom: 16, fontWeight: 700, display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ color: "#F6C453", fontWeight: 900, marginTop: 2 }}>✓</span>
                    <span>{item}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 96, background: "#FAFAF8" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 900, color: "#4A3B2A", textAlign: "center", marginBottom: 64 }}>How It Works</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 40, maxWidth: 900, margin: "0 auto" }}>
            {[
            { num: "1", title: "Post in Seconds", desc: "Add photos, price, and pickup details" },
            { num: "2", title: "Chat Instantly", desc: "Connect with buyers on campus" },
            { num: "3", title: "Meet on Campus", desc: "Safe exchanges in public zones" }].
            map((step) =>
            <div key={step.num} style={{ textAlign: "center" }}>
                <div style={{ width: 56, height: 56, background: "linear-gradient(135deg, #F8C35E 0%, #F5A823 100%)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontWeight: 900, fontSize: 28, color: "#fff", boxShadow: "0 4px 12px rgba(245,168,35,0.3)" }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#4A3B2A", marginBottom: 12 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: "#888", lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Exclusivity */}
      <section style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 96 }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center", padding: "36px 24px", background: "linear-gradient(135deg, #FFF9E6 0%, #FFFCF0 100%)", borderRadius: 24, border: "2px solid #F6C453" }}>
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699a897eb1c2153fb4e55c01/74aa7a1a6_image.png" alt="UCSD Triton" style={{ width: 80, height: 80, margin: "0 auto 16px", objectFit: "contain" }} />
          <h2 style={{ fontSize: "clamp(28px, 5vw, 38px)", fontWeight: 900, color: "#4A3B2A", marginBottom: 24 }}>Built for UCSD Tritons</h2>
          <p style={{ fontSize: 16, color: "#7A5C3E", lineHeight: 1.8, margin: 0, fontWeight: 500 }}>
            Sign in as a UCSD student to keep our community safe, trustworthy, and exclusively for our campus. No strangers. No scammers. Just your campus community.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      {!isAuth &&
      <section style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 96, textAlign: "center" }}>
          <div style={{ maxWidth: 500, margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(26px, 5vw, 36px)", fontWeight: 900, color: "#4A3B2A", marginBottom: 24 }}>Ready to trade smarter?</h2>
            <button className="land-btn-primary" onClick={() => base44.auth.redirectToLogin()} style={{ fontSize: 16, padding: "16px 40px" }}>
              Join UniTrade
            </button>
          </div>
        </section>
      }

      {/* Safety Guidelines */}
      <section style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 72, background: "#F8F8F6" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: "#4A3B2A", marginBottom: 40, textAlign: "center" }}>Safety Guidelines for Tritons</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, maxWidth: 800, margin: "0 auto" }}>
            <div style={{ padding: 32, background: "#fff", borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <div style={{ marginBottom: 12 }}><GraduationCap size={28} color="#7A5C3E" /></div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#4A3B2A", marginBottom: 12 }}>Meet in Public Campus Areas</h3>
              <p style={{ fontSize: 14, color: "#888", lineHeight: 1.7, margin: 0 }}>Always meet in busy, well-lit areas on campus. Avoid empty buildings or hidden locations. Your safety comes first.</p>
            </div>

            <div style={{ padding: 32, background: "#fff", borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <div style={{ marginBottom: 12 }}><CheckCircle2 size={28} color="#5BAA7A" /></div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#4A3B2A", marginBottom: 12 }}>Inspect Items Before Paying</h3>
              <p style={{ fontSize: 14, color: "#888", lineHeight: 1.7, margin: 0 }}>Confirm condition and functionality before completing the transaction. Don't pay until you're sure the item matches the listing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us */}
      <section style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 56, paddingBottom: 72, textAlign: "center" }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: "#4A3B2A", marginBottom: 24 }}>Contact Us</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
            <a href="mailto:unitradeucsd@gmail.com" style={{ fontSize: 15, fontWeight: 700, color: "#7A5C3E", textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
              <Mail size={16} /> unitradeucsd@gmail.com
            </a>
            <a href="https://instagram.com/unitradeucsd" target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, fontWeight: 700, color: "#7A5C3E", textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
              @unitradeucsd
            </a>
          </div>
        </div>
      </section>

    </div>);

}