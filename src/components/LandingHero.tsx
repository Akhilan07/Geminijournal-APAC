import React, { useState } from "react";
import { Sparkles, Shield, KeyRound, Database, ArrowRight, Bot, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { loginWithGoogle } from "../lib/firebase";

interface LandingHeroProps {
  onLoginSuccess?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await loginWithGoogle();
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error("Sign-in failed:", err);
      // Friendly message for popup cancellation or network error
      if (err?.code === "auth/popup-closed-by-user") {
        setErrorMsg("Sign-in window was closed. Please try again.");
      } else {
        setErrorMsg(err?.message || "Failed to authenticate with Google. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-80px)] flex-col justify-center px-4 py-16 sm:px-6 lg:px-8 bg-[#050505]">
      <div className="absolute top-0 left-0 w-full accent-line"></div>
      <div className="mx-auto w-full max-w-4xl text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-sep bg-[#0D0D0D] px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] font-sans text-gold shadow-xs mb-8">
          <Sparkles className="h-3.5 w-3.5 text-gold" />
          <span>Gemini 3.6 Flash &bull; Cloud Firestore</span>
        </div>

        {/* Display Typography */}
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-white leading-tight">
          A tranquil sanctuary for your thoughts, <span className="italic text-[#C5A059]">reflections</span> &amp; creative ideas.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-[#A8A8A8] leading-relaxed font-sans font-light">
          Sign in to access your private, isolated journal. Converse with Gemini across multi-turn reflections, explore creative brainstorming angles, and distill complex days into crisp syntheses.
        </p>

        {/* Primary CTA */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4">
          <button
            id="btn-google-signin"
            onClick={handleSignIn}
            disabled={loading}
            className="flex items-center justify-center gap-3 rounded-xl bg-white px-7 py-3.5 text-xs uppercase tracking-[0.2em] font-sans font-medium text-black shadow-lg hover:bg-[#C5A059] hover:text-black active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-600 border-t-black"></div>
                <span>Connecting to Google...</span>
              </div>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27a7.22 7.22 0 0 1 0-4.54V6.58H1.25a11.98 11.98 0 0 0 0 10.84l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Sign in with Google</span>
                <ArrowRight className="h-4 w-4 ml-1 opacity-70" />
              </>
            )}
          </button>

          {errorMsg && (
            <div
              id="signin-error-banner"
              className="flex items-center gap-2 rounded-lg bg-rose-950/50 border border-rose-800 px-4 py-2 text-xs text-rose-300 font-sans"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <p className="text-[11px] uppercase tracking-widest text-stone-400 font-sans">
            Federated Google Identity &bull; Zero Password Storage
          </p>
        </div>

        {/* Architectural Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3 text-left">
          <div className="rounded-2xl border border-sep bg-[#0D0D0D] p-7 shadow-xs hover:border-gold transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-900 text-gold mb-5 border border-sep">
              <Bot className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-lg font-light text-white">
              Gemini 3.6 Flash
            </h3>
            <p className="mt-2.5 text-xs text-[#A8A8A8] leading-relaxed font-sans">
              Multi-turn conversational reflections, insightful syntheses, and creative brainstorming ladders configured with automated fault tolerance.
            </p>
          </div>

          <div className="rounded-2xl border border-sep bg-[#0D0D0D] p-7 shadow-xs hover:border-gold transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-900 text-gold mb-5 border border-sep">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-lg font-light text-white">
              Owner-Isolated Firestore
            </h3>
            <p className="mt-2.5 text-xs text-[#A8A8A8] leading-relaxed font-sans">
              Hardened attribute security rules strictly isolate your journal entries under <code className="bg-[#050505] px-1.5 py-0.5 rounded text-[11px] text-gold font-mono">/users/&#123;uid&#125;/interactions</code> so no other user can access your data.
            </p>
          </div>

          <div className="rounded-2xl border border-sep bg-[#0D0D0D] p-7 shadow-xs hover:border-gold transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-900 text-gold mb-5 border border-sep">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-lg font-light text-white">
              Zero-Exposure Secrets
            </h3>
            <p className="mt-2.5 text-xs text-[#A8A8A8] leading-relaxed font-sans">
              Gemini API keys and infrastructure credentials remain strictly guarded on the backend server, never leaking into client browser bundles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
