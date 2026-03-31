import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, AlertCircle, Loader2, Pencil, CheckCircle2 } from "lucide-react";
import { categoryLabels, conditionLabels } from "./ListingCard";
import Tip from "@/components/ui/Tip";

function Req() {
  return <span className="text-red-500 ml-0.5">*</span>;
}

export default function ItemBlock({ index, item, onChange, onRemove, onPhotoError, photoError }) {
  const [uploading, setUploading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const fileInputRef = React.useRef(null);

  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          let width = img.width;
          let height = img.height;
          if (width > 1200) {
            height = (height * 1200) / width;
            width = 1200;
          }
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })), "image/jpeg", 0.85);
        };
      };
    });
  };

  const handlePhotoSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length > 1) {
      onPhotoError("Please create a new item block for each separate listing.");
      return;
    }

    onPhotoError(null);
    setUploading(true);

    try {
      const compressed = await compressImage(files[0]);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: compressed });
      onChange({ ...item, photo: file_url });
    } finally {
      setUploading(false);
    }
  };

  // Collapsed summary row
  if (collapsed) {
    return (
      <div
        className="flex items-center gap-3 rounded-2xl border-2 px-4 py-3"
        style={{ borderColor: "#8FCB9B", background: "#F0FAF2" }}
      >
        {item.photo ? (
          <img src={item.photo} alt="Item" className="w-10 h-10 object-cover rounded-lg shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-lg shrink-0">📦</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{item.title || `Item ${index + 1}`}</p>
          <p className="text-xs text-slate-500">{item.price ? `$${item.price}` : "—"}{item.condition ? ` · ${conditionLabels[item.condition] || item.condition}` : ""}</p>
        </div>
        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="p-1.5 rounded-lg hover:bg-green-100 transition-colors text-green-700 shrink-0"
          title="Edit item"
        >
          <Pencil className="w-4 h-4" />
        </button>
        {index > 0 && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-400 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 p-6 space-y-4" style={{ borderColor: "#F0DFC0", background: "#FFFDF8" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold px-3 py-1.5 rounded-full" style={{ background: "#FFF8D6", color: "#7A4A1A" }}>
          Item {index + 1}
        </span>
        {index > 0 && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Photo Error */}
      {photoError && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {photoError}
        </div>
      )}

      {/* Photo Display */}
      <div className="space-y-2">
        <Label className="text-sm">Photo<Req /></Label>
        <div
          className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-amber-50 transition-colors"
          style={{ borderColor: "#F0DFC0" }}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          {item.photo ? (
            <div className="relative inline-block">
              <img src={item.photo} alt="Item" className="h-32 w-32 object-cover rounded-lg" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange({ ...item, photo: "" });
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="text-sm text-slate-500 py-4">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "📸 Click to add one photo"}
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          className="hidden"
        />
        <Tip text="Each photo creates one separate listing." />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label className="text-sm">Title<Req /></Label>
        <Input
          placeholder="e.g. Organic Chemistry Textbook"
          value={item.title}
          onChange={(e) => onChange({ ...item, title: e.target.value })}
          className="h-10 rounded-xl"
        />
      </div>

      {/* Category & Condition */}
      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-xs">Categories<Req /></Label>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(categoryLabels).map(([k, v]) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  const updated = item.categories.includes(k)
                    ? item.categories.filter(c => c !== k)
                    : [...item.categories, k];
                  onChange({ ...item, categories: updated });
                }}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 11,
                  border: item.categories.includes(k) ? "2px solid #F5A823" : "2px solid #E5E7EB",
                  background: item.categories.includes(k) ? "#FFF8D6" : "#fff",
                  color: item.categories.includes(k) ? "#7A4A1A" : "#6B7280",
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Condition<Req /></Label>
          <Select value={item.condition} onValueChange={(v) => onChange({ ...item, condition: v })}>
            <SelectTrigger className="h-10 rounded-xl text-sm">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(conditionLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Price */}
      <div className="space-y-2">
        <Label className="text-sm">Price ($)<Req /></Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={item.price}
          onChange={(e) => onChange({ ...item, price: e.target.value })}
          className="h-10 rounded-xl"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label className="text-sm">Description <span className="text-slate-400 text-xs font-normal">(optional)</span></Label>
        <Textarea
          placeholder="Describe your item..."
          value={item.description}
          onChange={(e) => onChange({ ...item, description: e.target.value })}
          className="min-h-[80px] rounded-xl text-sm"
        />
      </div>

      {/* Done button */}
      <button
        type="button"
        onClick={() => setCollapsed(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-colors"
        style={{ background: "#E8F8ED", color: "#2E7D50", border: "2px solid #8FCB9B" }}
      >
        <CheckCircle2 className="w-4 h-4" />
        Done
      </button>
    </div>
  );
}