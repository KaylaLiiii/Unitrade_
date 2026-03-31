import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function MultiItemSuccess() {
  const params = new URLSearchParams(window.location.search);
  const count = parseInt(params.get("count")) || 1;
  const listingIds = params.get("ids")?.split(",") || [];
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#FFF8EE" }}>
      <div className="max-w-md w-full text-center space-y-6">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <Check className="w-10 h-10 text-emerald-600" />
        </div>

        {/* Headline */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Your items are live!</h1>
          <p className="text-slate-600">
            We created <span className="font-bold text-amber-600">{count}</span> separate listing{count !== 1 ? "s" : ""}.
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <Link to={createPageUrl("MyListings")}>
            <Button size="lg" className="bg-amber-400 text-primary-foreground px-8 text-sm font-medium rounded-3xl inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow w-full hover:bg-slate-800 h-12">
              View My Listings
            </Button>
          </Link>
          <Link to={createPageUrl("Browse")}>
            <Button variant="outline" size="lg" className="bg-background my-2 px-8 text-sm font-medium rounded-3xl inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input shadow-sm hover:bg-accent hover:text-accent-foreground w-full h-12">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>);

}