import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, X, Loader2, AlertCircle } from "lucide-react";

export default function PhotoUploader({ photos = [], onChange, max = 5 }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX = 1200;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
            else { width = Math.round((width * MAX) / height); height = MAX; }
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })), "image/jpeg", 0.82);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    setError("");
    const newPhotos = [...photos];
    for (const file of files) {
      if (newPhotos.length >= max) break;
      const compressed = await compressImage(file);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: compressed });
        newPhotos.push(file_url);
      } catch (err) {
        setError("Failed to upload photo. Please try again.");
        setUploading(false);
        return;
      }
    }
    onChange(newPhotos);
    setUploading(false);
    // reset input so same file can be re-selected
    e.target.value = "";
  };

  const removePhoto = (index) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {photos.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-colors">
            {uploading ? (
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            ) : (
              <>
                <Camera className="w-6 h-6 text-slate-400" />
                <span className="text-[10px] text-slate-400 mt-1">Add Photo</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>
      <p className="text-xs text-slate-400">{photos.length}/{max} photos</p>
    </div>
  );
}