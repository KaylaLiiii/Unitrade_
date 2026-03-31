import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import { createPageUrl } from "../utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import PhotoUploader from "../components/listings/PhotoUploader";
import { categoryLabels, conditionLabels, zoneLabels } from "../components/listings/ListingCard";
import Tip from "../components/ui/Tip";
import ItemBlock from "../components/listings/ItemBlock";

const EXCHANGE_OPTIONS = [
{ value: "pickup", label: "📦 Pick Up" },
{ value: "meetup", label: "🤝 Meet in Public" },
{ value: "deliver", label: "🚗 I Can Deliver" }];


function Req() {
  return <span className="text-red-500 ml-0.5">*</span>;
}

function ExchangeMethodBlock({ method, index, total, onChange, onRemove }) {
  const isPreferred = index === 0;
  return (
    <div className="rounded-2xl border-2 p-4 space-y-3" style={{ borderColor: isPreferred ? "#F5A823" : "#E5E7EB", background: isPreferred ? "#FFFDF5" : "#FAFAFA" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: isPreferred ? "#FFF8D6" : "#F3F4F6", color: isPreferred ? "#7A4A1A" : "#6B7280" }}>
          {isPreferred ? "⭐ Preferred Method" : `Method ${index + 1}`}
        </span>
        {!isPreferred &&
        <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        }
      </div>

      {/* Method selector */}
       <div className="grid grid-cols-3 gap-2">
         {EXCHANGE_OPTIONS.map((opt) =>
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange({ ...method, method: opt.value, pickup_location: "", meetup_zone: "", meetup_other: "" })}
          style={{
            padding: "10px 6px", borderRadius: 12, fontWeight: 700, fontSize: 12,
            border: method.method === opt.value ? "2.5px solid #F5A823" : "2.5px solid #F5A823",
            background: method.method === opt.value ? "#FFF8D6" : "#FFFDF5",
            color: method.method === opt.value ? "#7A4A1A" : "#7A4A1A",
            cursor: "pointer", transition: "all 0.15s",
            boxShadow: method.method === opt.value ? "0 2px 0 #E09B15" : "0 2px 0 #E09B15"
          }}>

             {opt.label}
           </button>
        )}
       </div>

      {/* Pick Up → location */}
      {method.method === "pickup" &&
      <div className="space-y-1">
          <Label className="text-xs">Approximate Pickup Location<Req /></Label>
          <Input
          placeholder="e.g. Near Warren College, Building 123"
          value={method.pickup_location || ""}
          onChange={(e) => onChange({ ...method, pickup_location: e.target.value })}
          className="h-10 rounded-xl text-sm" />

        </div>
      }

      {/* Meetup → zone picker */}
      {method.method === "meetup" &&
      <div className="space-y-2">
          <Label className="text-xs">Meetup Zone<Req /></Label>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(zoneLabels).map(([k, v]) =>
          <button
            key={k} type="button"
            onClick={() => onChange({ ...method, meetup_zone: k, meetup_other: "" })}
            style={{
              padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
              border: method.meetup_zone === k ? "2px solid #F5A823" : "2px solid #E5E7EB",
              background: method.meetup_zone === k ? "#FFF8D6" : "#fff",
              color: method.meetup_zone === k ? "#7A4A1A" : "#6B7280", cursor: "pointer"
            }}>
            {v}</button>
          )}
            <button
            type="button"
            onClick={() => onChange({ ...method, meetup_zone: "other" })}
            style={{
              padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
              border: method.meetup_zone === "other" ? "2px solid #F5A823" : "2px solid #E5E7EB",
              background: method.meetup_zone === "other" ? "#FFF8D6" : "#fff",
              color: method.meetup_zone === "other" ? "#7A4A1A" : "#6B7280", cursor: "pointer"
            }}>
            Other</button>
          </div>
          {method.meetup_zone === "other" &&
        <Input
          placeholder="Specify meetup place..."
          value={method.meetup_other || ""}
          onChange={(e) => onChange({ ...method, meetup_other: e.target.value })}
          className="h-10 rounded-xl text-sm mt-1" />

        }
        </div>
      }

      {/* Available time */}
      {method.method &&
      <div className="space-y-1">
          <Label className="text-xs">Available Time (optional)</Label>
          <Input
          placeholder="e.g. Weekdays 2-5 PM"
          value={method.available_time || ""}
          onChange={(e) => onChange({ ...method, available_time: e.target.value })}
          className="h-10 rounded-xl text-sm" />

        </div>
      }
    </div>);

}

export default function CreateListing() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { user, isAuthenticated, isLoadingAuth } = useAuth();
   const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [multiMode, setMultiMode] = useState(false);
  const [itemErrors, setItemErrors] = useState({});

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      base44.auth.redirectToLogin(window.location.origin + location.pathname + location.search + location.hash);
    }
    if (!isLoadingAuth && isAuthenticated && user) {
      setLoading(false);
    }
  }, [isLoadingAuth, isAuthenticated, user, location.pathname, location.search, location.hash]);

  const [form, setForm] = useState({
    title: "",
    categories: [],
    price: "",
    condition: "",
    description: "",
    photos: []
  });

  const [items, setItems] = useState([{
    photo: "",
    title: "",
    categories: [],
    price: "",
    condition: "",
    description: ""
  }]);

  const [exchangeMethods, setExchangeMethods] = useState([{ method: "", pickup_location: "", meetup_zone: "", meetup_other: "", available_time: "" }]);

  const editId = searchParams.get("edit");

  useEffect(() => {
    if (editId) {
      base44.entities.Listing.filter({ id: editId }).then((items) => {
        const found = items[0];
        if (found) {
          const l = found;
          setForm({
            title: l.title || "",
            categories: l.categories || (l.category ? [l.category] : []),
            price: l.price?.toString() || "",
            condition: l.condition || "",
            description: l.description || "",
            photos: l.photos || []
          });
          if (l.exchange_methods?.length) {
            setExchangeMethods(l.exchange_methods);
          } else if (l.delivery_method) {
            setExchangeMethods([{
              method: l.delivery_method,
              pickup_location: l.pickup_location || "",
              meetup_zone: l.meetup_zone || "",
              meetup_other: l.meetup_other || "",
              available_time: l.available_time || ""
            }]);
          }
        }
      });
    }
  }, [editId]);

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const updateMethod = (index, updated) => {
    setExchangeMethods((prev) => prev.map((m, i) => i === index ? updated : m));
  };

  const addMethod = () => {
    setExchangeMethods((prev) => [...prev, { method: "", pickup_location: "", meetup_zone: "", meetup_other: "", available_time: "" }]);
  };

  const removeMethod = (index) => {
    setExchangeMethods((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    if (multiMode) {
      const errors = {};
      let hasError = false;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.photo) {
          errors[i] = "Please add a photo.";
          hasError = true;
        }
        if (!item.title.trim()) {
            errors[i] = errors[i] || "Please enter a title.";
            hasError = true;
          }
          if (!item.categories || item.categories.length === 0) {
            errors[i] = errors[i] || "Please select at least one category.";
            hasError = true;
          }
        if (!item.price) {
          errors[i] = errors[i] || "Please enter a price.";
          hasError = true;
        }
        if (!item.condition) {
          errors[i] = errors[i] || "Please select a condition.";
          hasError = true;
        }
      }
      if (hasError) {
        setItemErrors(errors);
        return "Please complete all required fields for each item.";
      }
    } else {
      if (!form.title.trim()) return "Please enter a title.";
      if (!form.categories || form.categories.length === 0) return "Please select at least one category.";
      if (!form.price) return "Please enter a price.";
      if (!form.condition) return "Please select a condition.";
    }
    if (!exchangeMethods[0]?.method) return "Please select at least one exchange method.";
    for (let i = 0; i < exchangeMethods.length; i++) {
      const m = exchangeMethods[i];
      if (!m.method) return `Please select a method for Exchange Method ${i + 1}.`;
      if (m.method === "pickup" && !m.pickup_location?.trim()) return `Please enter a pickup location for Method ${i + 1}.`;
      if (m.method === "meetup" && !m.meetup_zone) return `Please select a meetup zone for Method ${i + 1}.`;
      if (m.method === "meetup" && m.meetup_zone === "other" && !m.meetup_other?.trim()) return `Please specify the meetup place for Method ${i + 1}.`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setItemErrors({});
    const err = validate();
    if (err) {setFormError(err);window.scrollTo({ top: 0, behavior: "smooth" });return;}
    setSaving(true);
    const primary = exchangeMethods[0];

    try {
      if (multiMode) {
        const createdIds = [];
        for (const item of items) {
          const data = {
            title: item.title,
            categories: item.categories,
            price: parseFloat(item.price) || 0,
            condition: item.condition,
            description: item.description,
            photos: [item.photo],
            seller_email: user.email,
            seller_name: user.full_name,
            seller_photo: user.profile_photo || "",
            seller_is_ucsd_verified: user.is_ucsd_verified || false,
            status: "available",
            exchange_methods: exchangeMethods,
            delivery_method: primary.method,
            pickup_location: primary.pickup_location || "",
            meetup_zone: primary.method === "meetup" && primary.meetup_zone !== "other" ? primary.meetup_zone : "",
            meetup_other: primary.method === "meetup" && primary.meetup_zone === "other" ? primary.meetup_other : "",
            available_time: primary.available_time || ""
          };
          const created = await base44.entities.Listing.create(data);
          createdIds.push(created.id);
        }
        navigate(createPageUrl("MultiItemSuccess") + `?count=${items.length}&ids=${createdIds.join(",")}`);
      } else {
        const data = {
          title: form.title,
          categories: form.categories,
          price: parseFloat(form.price) || 0,
          condition: form.condition,
          description: form.description,
          photos: form.photos,
          seller_email: user.email,
          seller_name: user.full_name,
          seller_photo: user.profile_photo || "",
          seller_is_ucsd_verified: user.is_ucsd_verified || false,
          status: "available",
          exchange_methods: exchangeMethods,
          delivery_method: primary.method,
          pickup_location: primary.pickup_location || "",
          meetup_zone: primary.method === "meetup" && primary.meetup_zone !== "other" ? primary.meetup_zone : "",
          meetup_other: primary.method === "meetup" && primary.meetup_zone === "other" ? primary.meetup_other : "",
          available_time: primary.available_time || ""
        };
        if (editId) {
          await base44.entities.Listing.update(editId, data);
        } else {
          await base44.entities.Listing.create(data);
        }
        navigate(createPageUrl("MyListings"));
      }
    } catch (error) {
      setFormError(error?.data?.error || error?.message || "Unable to post listing. Please try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  const usedMethods = exchangeMethods.map((m) => m.method).filter(Boolean);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            {editId ? "Edit Listing" : multiMode ? "Post Multiple Items" : "Post a Listing"}
          </h1>
          <p className="text-sm text-slate-500">
            {multiMode ? "Create multiple separate listings at once." : "Fill in the details below to list your item for sale."}
          </p>
        </div>
        {!editId &&
        <button
          type="button"
          onClick={() => {setMultiMode(!multiMode);setFormError("");setItemErrors({});}}
          className="text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
          style={{ background: multiMode ? "#FFF8D6" : "#F3F4F6", color: multiMode ? "#7A4A1A" : "#6B7280" }}>

            {multiMode ? "← Single Item" : "Multi Items →"}
          </button>
        }
      </div>
      <p className="text-xs text-slate-400 mb-6"><span className="text-red-500">*</span> Required fields</p>

      {formError &&
      <div className="mb-6 p-4 rounded-2xl border-2 border-red-200 bg-red-50 text-red-700 font-semibold text-sm flex items-center gap-2">
          ⚠️ Failed to post: {formError}
        </div>
      }

      <form onSubmit={handleSubmit} className="space-y-6">
        {multiMode ?
        // Multi-item mode
        <>
            <div className="space-y-3">
              {items.map((item, i) =>
            <ItemBlock
              key={i}
              index={i}
              item={item}
              onChange={(updated) => {
                const newItems = [...items];
                newItems[i] = updated;
                setItems(newItems);
              }}
              onRemove={() => {
                if (items.length > 1) {
                  setItems(items.filter((_, idx) => idx !== i));
                  const newErrors = { ...itemErrors };
                  delete newErrors[i];
                  setItemErrors(newErrors);
                }
              }}
              onPhotoError={(err) => {
                setItemErrors({ ...itemErrors, [i]: err });
              }}
              photoError={itemErrors[i]} />

            )}
            </div>

            <button
            type="button"
            onClick={() => setItems([...items, { photo: "", title: "", categories: [], price: "", condition: "", description: "" }])}
            className="flex items-center gap-2 text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors">

              <PlusCircle className="w-4 h-4" />
              Add Another Item
            </button>
          </> :

        // Single-item mode
        <>
            <div className="space-y-2">
              <Label>Photos</Label>
              <PhotoUploader photos={form.photos} onChange={(p) => handleChange("photos", p)} />
              <Tip text="Clear, well-lit photos help your item sell faster. Use natural light and show the full item." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title<Req /></Label>
              <Input
              id="title"
              placeholder="e.g. Organic Chemistry Textbook"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="h-11 rounded-xl" />

              <Tip text='Be specific. Include brand and condition (e.g. "TI-84 Calculator – Like New").' />
            </div>

            <div className="space-y-2">
              <Label>Categories<Req /></Label>
              <p className="text-xs text-slate-500 mb-2">Select at least one</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      const updated = form.categories.includes(k)
                        ? form.categories.filter(c => c !== k)
                        : [...form.categories, k];
                      handleChange("categories", updated);
                    }}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 999,
                      fontWeight: 700,
                      fontSize: 13,
                      border: form.categories.includes(k) ? "2.5px solid #F5A823" : "2.5px solid #E5E7EB",
                      background: form.categories.includes(k) ? "#FFF8D6" : "#fff",
                      color: form.categories.includes(k) ? "#7A4A1A" : "#6B7280",
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
              <Label>Condition<Req /></Label>
              <Select value={form.condition} onValueChange={(v) => handleChange("condition", v)}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(conditionLabels).map(([k, v]) =>
                <SelectItem key={k} value={k}>{v}</SelectItem>
                )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price ($)<Req /></Label>
              <Input
              id="price"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={form.price}
              onChange={(e) => handleChange("price", e.target.value)}
              className="h-11 rounded-xl" />

              <Tip text="Check similar listings to price competitively." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description <span className="text-slate-400 text-xs font-normal">(optional)</span></Label>
              <Textarea
              id="description"
              placeholder="Describe your item, including any wear and tear..."
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="min-h-[100px] rounded-xl" />

              <Tip text="Mention condition, pickup location, and any defects to avoid confusion." />
            </div>
          </>
        }

        {/* Exchange Methods */}
        <div className="space-y-3">
          <Label>
            {multiMode ? "Exchange Method (applies to all items)" : "Exchange Method"}
            <Req /> 
          </Label>
          {exchangeMethods.map((m, i) =>
          <ExchangeMethodBlock
            key={i}
            method={m}
            index={i}
            total={exchangeMethods.length}
            onChange={(updated) => updateMethod(i, updated)}
            onRemove={() => removeMethod(i)} />

          )}
          {exchangeMethods.length < 3 &&
          <button
            type="button"
            onClick={addMethod}
            className="flex items-center gap-2 text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors mt-1">

              <PlusCircle className="w-4 h-4" />
              Add another exchange method
            </button>
          }
          {multiMode &&
          <Tip text="This exchange method will apply to all items in this submission." />
          }
        </div>

        <Button
          type="submit"
          disabled={saving}
          size="lg"
          className="w-full bg-slate-900 hover:bg-slate-800 rounded-xl h-12 text-base">

          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? "Save Changes" : multiMode ? `Post ${items.length} Item${items.length !== 1 ? "s" : ""}` : "Post Listing"}
        </Button>
      </form>
    </div>);

}
