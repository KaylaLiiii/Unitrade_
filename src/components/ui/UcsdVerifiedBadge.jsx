import React from "react";
import { ShieldCheck } from "lucide-react";

export default function UcsdVerifiedBadge({ className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${className}`}
      style={{ background: "#EEF2FF", color: "#4338CA", border: "1.5px solid #C7D2FE" }}
    >
      <ShieldCheck className="w-3 h-3" />
      UCSD Verified
    </span>
  );
}