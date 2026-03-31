import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck, Mail, ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/AuthContext";

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699a897eb1c2153fb4e55c01/7a8682d9d_ChatGPTImageFeb212026at09_10_29PM.png";

export default function VerifyUcsd() {
  const navigate = useNavigate();
  const { user, isLoadingAuth, refreshUser } = useAuth();
  const [step, setStep] = useState("email"); // "email" | "code"
  const [ucsdEmail, setUcsdEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user) { base44.auth.redirectToLogin(); return; }
    if (user.is_ucsd_verified) { navigate(createPageUrl("Browse")); return; }
    if (user.email?.endsWith("@ucsd.edu")) setUcsdEmail(user.email);
  }, [user, isLoadingAuth]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleSendCode = async () => {
    setError("");
    const email = ucsdEmail.trim().toLowerCase();
    if (!email.endsWith("@ucsd.edu")) return setError("Use @ucsd.edu email.");
    setSending(true);
    try {
      const result = await base44.functions.invoke("verify-ucsd-send", { email });
      if (!result || (result.message && result.message !== "Code sent")) throw new Error(result?.message || "Failed to send code");
      setCooldown(60);
      setStep("code");
    } catch (e) {
      setError(e.message || "Failed to send code");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async () => {
    setError("");
    const email = ucsdEmail.trim().toLowerCase();
    const trimmedCode = code.trim();
    if (trimmedCode.length !== 6) return setError("Enter 6 digits.");
    setVerifying(true);
    try {
      const result = await base44.functions.invoke("verify-ucsd-confirm", { email, code: trimmedCode });
      if (result?.message && result.message !== "Verified") throw new Error(result.message);
      setSuccess(true);
      await refreshUser();
      setTimeout(() => navigate(createPageUrl("Browse")), 1200);
    } catch (e) {
      setError(e.message || "Invalid code");
    } finally {
      setVerifying(false);
    }
  };

  if (isLoadingAuth || !user) return null;

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FFF8EE" }}>
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: "#EEF2FF" }}>
            <ShieldCheck className="w-10 h-10" style={{ color: "#4338CA" }} />
          </div>
          <h2 className="text-2xl font-black" style={{ color: "#4A3B2A" }}>UCSD Verified! 🎉</h2>
          <p className="text-sm" style={{ color: "#9A7B5A" }}>You now have full access to UniTrade.</p>
          <p className="text-xs" style={{ color: "#BBAA99" }}>Redirecting you to browse…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#FFF8EE" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={LOGO_URL} alt="UniTrade" className="w-14 h-14 object-contain mx-auto mb-3" />
          <h1 className="text-2xl font-black" style={{ color: "#4A3B2A" }}>Verify your UCSD Email</h1>
          <p className="text-sm mt-1" style={{ color: "#9A7B5A" }}>UniTrade is for UCSD students only. Verify your @ucsd.edu email to unlock full access.</p>
        </div>

        <div className="bg-white rounded-3xl border-2 p-6 space-y-5" style={{ borderColor: "#F0DFC0" }}>
          {step === "email" ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-bold" style={{ color: "#4A3B2A" }}>Your @ucsd.edu email</label>
                <Input
                  type="email"
                  placeholder="you@ucsd.edu"
                  value={ucsdEmail}
                  onChange={(e) => setUcsdEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                  className="h-11 rounded-xl"
                />
              </div>
              {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
              <Button
                onClick={handleSendCode}
                disabled={sending}
                className="w-full h-11 rounded-xl font-bold"
                style={{ background: "linear-gradient(135deg, #F8C35E, #F5A823)", color: "#4A3B2A", border: "2px solid #E09B15" }}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Mail className="w-4 h-4 mr-2" /> Send Verification Code</>}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <button onClick={() => { setStep("email"); setError(""); setCode(""); }} className="text-sm font-bold flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ color: "#9A7B5A" }}>
                  <ArrowLeft className="w-3.5 h-3.5" /> Change email
                </button>
              </div>
              <p className="text-sm" style={{ color: "#7A5C3E" }}>
                We sent a 6-digit code to <strong>{ucsdEmail}</strong>. Check your inbox (and spam folder).
              </p>
              <div className="space-y-2">
                <label className="text-sm font-bold" style={{ color: "#4A3B2A" }}>6-digit code</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
                  className="h-11 rounded-xl text-center text-lg font-mono tracking-widest"
                />
              </div>
              {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
              <Button
                onClick={handleVerifyCode}
                disabled={verifying || code.length !== 6}
                className="w-full h-11 rounded-xl font-bold"
                style={{ background: "linear-gradient(135deg, #F8C35E, #F5A823)", color: "#4A3B2A", border: "2px solid #E09B15" }}
              >
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Code"}
              </Button>
              <div className="text-center">
                {cooldown > 0 ? (
                  <p className="text-xs" style={{ color: "#BBAA99" }}>Resend available in {cooldown}s</p>
                ) : (
                  <button onClick={handleSendCode} disabled={sending} className="text-xs font-bold hover:opacity-70 transition-opacity" style={{ color: "#F5A823" }}>
                    {sending ? "Sending…" : "Resend code"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs mt-4" style={{ color: "#BBAA99" }}>
          Only @ucsd.edu emails are accepted. No Google sign-in.
        </p>
      </div>
    </div>
  );
}