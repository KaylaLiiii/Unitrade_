import React from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

export default function LoginPromptModal({ title, body, onClose, returnTo }) {
  const dest = returnTo || window.location.href;

  const handleLogin = () => base44.auth.redirectToLogin(dest);
  const handleSignUp = () => base44.auth.redirectToLogin(dest);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          background: "#FFFDF8",
          borderRadius: 24,
          border: "2px solid #F0DFC0",
          boxShadow: "0 20px 60px rgba(90,50,10,0.18)",
          padding: "36px 28px 28px",
          maxWidth: 380,
          width: "100%",
          textAlign: "center",
          fontFamily: "'Nunito', system-ui, sans-serif",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 14, right: 16,
            background: "none", border: "none", cursor: "pointer",
            color: "#9A7B5A",
          }}
          aria-label="Close"
        >
          <X style={{ width: 20, height: 20 }} />
        </button>

        <div style={{ fontSize: 42, marginBottom: 12 }}>🔒</div>
        <h2 style={{ fontWeight: 900, fontSize: 20, color: "#3A2E22", marginBottom: 8 }}>
          {title || "Log in to continue"}
        </h2>
        <p style={{ fontWeight: 600, fontSize: 14, color: "#7A5C3E", marginBottom: 28, lineHeight: 1.6 }}>
          {body || "UniTrade is student-only. Log in to keep trading safe."}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={handleLogin}
            style={{
              background: "linear-gradient(135deg, #F8C35E, #F5A823)",
              color: "#4A3B2A",
              border: "2.5px solid #E09B15",
              borderRadius: 12,
              padding: "12px 0",
              fontWeight: 900,
              fontSize: 15,
              cursor: "pointer",
              boxShadow: "0 3px 0 #C77E0A",
              transition: "all 0.15s",
              width: "100%",
            }}
          >
            Log In
          </button>
          <button
            onClick={handleSignUp}
            style={{
              background: "#fff",
              color: "#4A3B2A",
              border: "2px solid #E5D5B8",
              borderRadius: 12,
              padding: "11px 0",
              fontWeight: 800,
              fontSize: 15,
              cursor: "pointer",
              transition: "all 0.15s",
              width: "100%",
            }}
          >
            Sign Up — it's free ✨
          </button>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none",
              color: "#9A7B5A", fontWeight: 700, fontSize: 13,
              cursor: "pointer", marginTop: 4,
              textDecoration: "underline",
            }}
          >
            Continue browsing
          </button>
        </div>

        <p style={{ marginTop: 20, fontSize: 11, color: "#BCA98A", fontWeight: 600 }}>
          We use verification to keep UniTrade safe 🎓
        </p>
      </div>
    </div>
  );
}