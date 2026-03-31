import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { Search, PlusCircle, MessageSquare, User, Menu, X, LogOut, Package, Bookmark } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useUnreadMessages } from "@/components/chat/useUnreadMessages";
import LoginPromptModal from "@/components/ui/LoginPromptModal";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699a897eb1c2153fb4e55c01/7a8682d9d_ChatGPTImageFeb212026at09_10_29PM.png";

function LayoutContent({ children, currentPageName }) {
  const { user, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { unreadCount } = useUnreadMessages(user?.email);
  const unreadBadgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  const hiddenLayoutPages = ["VerifyUcsd"];
  if (hiddenLayoutPages.includes(currentPageName)) {
    return <>{children}</>;
  }

  const handlePostListingClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setShowLoginModal(true);
    }
  };

  const navLinks = [
  { name: "Browse", icon: Search, page: "Browse" },
  { name: "Post Listing", icon: PlusCircle, page: "CreateListing" },
  { name: "My Listings", icon: Package, page: "MyListings" },
  { name: "Messages", icon: MessageSquare, page: "MyMessages" },
  { name: "Saved", icon: Bookmark, page: "SavedListings" },
  { name: "About", icon: null, page: "Landing" }];


  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFF8EE", fontFamily: "'Nunito', system-ui, sans-serif" }}>

      {showLoginModal && (
        <LoginPromptModal
          title="Sign in to post a listing"
          body="Only UCSD students can post listings. Sign in with your UCSD Google account to get started."
          onClose={() => setShowLoginModal(false)}
          returnTo={window.location.origin + createPageUrl("CreateListing")}
        />
      )}

      {/* Top Nav */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" />
      <header
        className="sticky top-0 z-50 backdrop-blur-xl border-b-2"
        style={{ backgroundColor: "rgba(255,248,238,0.94)", borderColor: "#F0DFC0" }}>

        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={createPageUrl("Browse")} className="flex items-center gap-2">
            <img src={LOGO_URL} alt="UniTrade" className="w-10 h-10 object-contain" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.12))" }} />
            <span className="font-black text-xl tracking-tight" style={{ color: "#4A3B2A" }}>UniTrade</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) =>
            <Link
              key={link.page}
              to={createPageUrl(link.page)}
              onClick={link.page === "CreateListing" ? handlePostListingClick : undefined}
              className="bg-yellow-100 px-3.5 py-2 text-sm opacity-100 rounded-[10003px] relative flex items-center gap-1.5 cozy-nav-link">


                {link.icon &&
              <span className="relative">
                    <link.icon className="w-4 h-4" />
                    {link.page === "MyMessages" && unreadCount > 0 &&
                <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] px-1 bg-red-500 text-white rounded-full text-[10px] leading-none font-black flex items-center justify-center shadow-sm">
                      {unreadBadgeLabel}
                    </span>
                }
                  </span>
              }
                {link.name}
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated && user ?
            <Link
              to={createPageUrl("Profile")}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-sm transition-all hover:bg-amber-50"
              style={{ color: "#7A5C3E" }}>

                <div className="cozy-avatar">
                  {user.profile_photo ? null :


                user.full_name?.[0]?.toUpperCase() || "U"
                }
                </div>
                <span className="max-w-[90px] truncate">{user.full_name?.split(" ")[0]}</span>
              </Link> :

            <button className="cozy-sign-btn hidden md:block" onClick={() => base44.auth.redirectToLogin()}>
                Sign In ✨
              </button>
            }

            {/* Mobile toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-2xl transition-colors hover:bg-amber-50"
              style={{ color: "#4A3B2A" }}>

              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen &&
        <div className="md:hidden border-t-2 px-4 py-3 space-y-1" style={{ borderColor: "#F0DFC0", backgroundColor: "#FFF8EE" }}>
            {navLinks.map((link) =>
          <Link
            key={link.page}
            to={createPageUrl(link.page)}
            onClick={(e) => {
              setMenuOpen(false);
              if (link.page === "CreateListing") handlePostListingClick(e);
            }}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm cozy-nav-link ${currentPageName === link.page ? "cozy-nav-active" : ""}`}>

                <span className="relative">
                  {link.icon && <link.icon className="w-4 h-4" />}
                  {link.page === "MyMessages" && unreadCount > 0 &&
              <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] px-1 bg-red-500 text-white rounded-full text-[10px] leading-none font-black flex items-center justify-center shadow-sm">
                    {unreadBadgeLabel}
                  </span>
              }
                </span>
                {link.name}
              </Link>
          )}
            <hr className="my-2" style={{ borderColor: "#F0DFC0" }} />
            {isAuthenticated && user ?
          <>
                <Link
              to={createPageUrl("Profile")}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold"
              style={{ color: "#7A5C3E" }}>

                  {user.profile_photo ?
              <img src={user.profile_photo} alt="" className="w-4 h-4 rounded-full object-cover" /> :

              <User className="w-4 h-4" />
              }
                  Profile
                </Link>
                <button
              onClick={() => {base44.auth.logout();window.location.href = createPageUrl("Landing");}}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold text-red-400 w-full text-left">

                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </> :

          <button
            onClick={() => base44.auth.redirectToLogin()}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold w-full text-left"
            style={{ color: "#7A4A1A" }}>

                <User className="w-4 h-4" />
                Sign In ✨
              </button>
          }
          </div>
        }
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 pb-2" style={{ color: "#4A3B2A" }}>{children}</main>

      {/* Cozy grass ground strip */}
      <div style={{ width: "100%", lineHeight: 0, marginTop: "auto", pointerEvents: "none", userSelect: "none" }}>
        <svg
          viewBox="0 0 1440 90"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: "block", width: "100%", height: "90px" }}>

          {/* Back layer — slightly darker */}
          <path
            d="M0,60 C120,38 240,72 360,55 C480,38 600,65 720,52 C840,38 960,68 1080,54 C1200,40 1320,65 1440,50 L1440,90 L0,90 Z"
            fill="#C8DDB0" />

          {/* Front layer — lighter sage */}
          <path
            d="M0,72 C100,52 220,80 340,65 C460,50 580,78 700,63 C820,48 940,76 1060,62 C1180,48 1310,74 1440,60 L1440,90 L0,90 Z"
            fill="#DCEFC4" />

          {/* Tiny flowers / dots */}
          <circle cx="180" cy="66" r="3" fill="#F8C35E" opacity="0.7" />
          <circle cx="182" cy="64" r="2" fill="#fff" opacity="0.6" />
          <circle cx="520" cy="70" r="3" fill="#F8C35E" opacity="0.65" />
          <circle cx="522" cy="68" r="2" fill="#fff" opacity="0.6" />
          <circle cx="860" cy="64" r="3" fill="#F8C35E" opacity="0.7" />
          <circle cx="862" cy="62" r="2" fill="#fff" opacity="0.6" />
          <circle cx="1200" cy="68" r="3" fill="#F8C35E" opacity="0.65" />
          <circle cx="1202" cy="66" r="2" fill="#fff" opacity="0.6" />
          {/* Small grass tufts */}
          <path d="M80,72 Q82,62 84,72" stroke="#A8C890" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M84,72 Q87,60 90,72" stroke="#A8C890" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M420,68 Q422,58 424,68" stroke="#A8C890" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M424,68 Q427,56 430,68" stroke="#A8C890" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M760,65 Q762,55 764,65" stroke="#A8C890" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M764,65 Q767,53 770,65" stroke="#A8C890" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M1100,67 Q1102,57 1104,67" stroke="#A8C890" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M1104,67 Q1107,55 1110,67" stroke="#A8C890" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M1360,62 Q1362,52 1364,62" stroke="#A8C890" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M1364,62 Q1367,50 1370,62" stroke="#A8C890" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    </div>);

}

export default function Layout({ children, currentPageName }) {
  return <LayoutContent children={children} currentPageName={currentPageName} />;
}
