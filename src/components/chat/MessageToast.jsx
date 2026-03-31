import React, { useEffect } from "react";
import { X, MessageSquare } from "lucide-react";

export default function MessageToast({ toast, onDismiss, onClick }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [toast.id]);

  return (
    <div
      onClick={onClick}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        background: "#FFFFFF",
        borderLeft: "3px solid #F6C453",
        borderRadius: 12,
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
        padding: "12px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        maxWidth: 320,
        cursor: "pointer",
        animation: "toastIn 200ms ease forwards",
        fontFamily: "Inter, DM Sans, system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FFF4D6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <MessageSquare style={{ width: 15, height: 15, color: "#F6C453" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#1F1F1F", margin: 0 }}>New message</p>
        <p style={{ fontSize: 12, color: "#555555", margin: "2px 0 0", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {toast.senderName}: {toast.text}
        </p>
        {toast.listingTitle && (
          <p style={{ fontSize: 11, color: "#AAAAAA", margin: "2px 0 0" }}>about {toast.listingTitle}</p>
        )}
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDismiss(); }}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#AAAAAA", flexShrink: 0 }}
      >
        <X style={{ width: 12, height: 12 }} />
      </button>
    </div>
  );
}