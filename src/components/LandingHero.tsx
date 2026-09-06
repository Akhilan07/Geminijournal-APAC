import React, { useState } from "react";
import { Sparkles, ArrowRight, Bot, Lock, Database, AlertCircle, Compass, MapPin } from "lucide-react";
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
    <div className="relative flex min-h-[calc(100vh-80px)] flex-col justify-center px-4 py-16 sm:px-6 lg:px-8 bg-transparent">
      <div className="mx-auto w-full max-w-5xl text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-5 py-2 text-xs uppercase tracking-[0.2em] font-sans text-amber-300 shadow-lg shadow-amber-500/10 mb-8 backdrop-blur-md">
          <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
          <span>Gemini 3.6 Flash &bull; Location-Aware Firestore</span>
        </div>

        {/* Display Typography */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-white leading-tight">
          A tranquil sanctuary for your thoughts, <br className="hidden sm:inline" />
          <span className="italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 drop-shadow-sm">
            reflections
          </span> &amp; creative ideas.
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-base sm:text-xl text-stone-300 leading-relaxed font-sans font-light">
          Sign in to access your private, isolated journal. Converse with Gemini across multi-turn reflections, pin memory locations with Google Maps, and distill complex days into crisp syntheses.
        </p>

        {/* Primary CTA */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4">
          <button
            id="btn-google-signin"
            onClick={handleSignIn}
            disabled={loading}
            className="group relative flex items-center justify-center gap-3.5 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 px-8 py-4 text-xs uppercase tracking-[0.25em] font-sans font-bold text-black shadow-xl shadow-amber-500/20 hover:shadow-2xl hover:shadow-amber-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer overflow-hidden border border-amber-200/50"
          >
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            {loading ? (
              <div className="flex items-center gap-2.5">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black"></div>
                <span>Connecting to Google...</span>
              </div>
            ) : (
              <>
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
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
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {errorMsg && (
            <div
              id="signin-error-banner"
              className="flex items-center gap-2 rounded-xl bg-rose-950/60 border border-rose-800/80 px-4 py-2.5 text-xs text-rose-300 font-sans backdrop-blur-md"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <p className="text-[11px] uppercase tracking-widest text-stone-400 font-sans mt-1">
            Federated Google Identity &bull; Zero Password Storage
          </p>
        </div>

        {/* Architectural Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3 text-left">
          <div className="glass-card rounded-2xl p-7 relative group border border-white/10 hover:border-amber-500/40">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-5 border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Bot className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-xl font-medium text-stone-100">
              Gemini 3.6 Flash
            </h3>
            <p className="mt-2.5 text-xs text-stone-300 leading-relaxed font-sans font-light">
              Multi-turn conversational reflections, insightful syntheses, and creative brainstorming ladders configured with automated fault tolerance.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-7 relative group border border-white/10 hover:border-amber-500/40">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-5 border border-amber-500/20 group-hover:scale-110 transition-transform">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-xl font-medium text-stone-100">
              Location-Bound Memories
            </h3>
            <p className="mt-2.5 text-xs text-stone-300 leading-relaxed font-sans font-light">
              Attach precise Google Maps coordinates and reverse-geocoded place names to reflections to relive where moments occurred.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-7 relative group border border-white/10 hover:border-amber-500/40">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-5 border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-xl font-medium text-stone-100">
              Owner-Isolated Firestore
            </h3>
            <p className="mt-2.5 text-xs text-stone-300 leading-relaxed font-sans font-light">
              Hardened attribute security rules strictly isolate your journal entries under <code className="bg-black/50 px-1.5 py-0.5 rounded text-[11px] text-amber-300 font-mono">/users/&#123;uid&#125;/interactions</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
