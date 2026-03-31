import React from "react";
import moment from "moment";

export default function MessageBubble({ message, isOwn, isOptimistic }) {
  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} flex-col mb-3`}
      style={{ animation: "fadeInMsg 150ms ease forwards", opacity: isOptimistic ? 0.7 : 1 }}
    >
      <div
        className={isOwn ? "self-end" : "self-start"}
        style={{
          maxWidth: "70%",
          padding: "9px 14px",
          borderRadius: 14,
          borderBottomRightRadius: isOwn ? 4 : 14,
          borderBottomLeftRadius: isOwn ? 14 : 4,
          background: isOwn ? "#FFF4D6" : "#F1F1EF",
          border: isOwn ? "1px solid #F6C45366" : "none",
        }}
      >
        <p style={{ fontSize: 14, color: "#1F1F1F", lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {message.text}
        </p>
      </div>
      <p style={{ fontSize: 11, color: "#AAAAAA", marginTop: 4, textAlign: isOwn ? "right" : "left", paddingRight: isOwn ? 0 : 0, paddingLeft: isOwn ? 0 : 0 }}>
        {moment(message.created_date || new Date()).format("h:mm A")}
      </p>
      <style>{`
        @keyframes fadeInMsg {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}