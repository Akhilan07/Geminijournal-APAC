import React from "react";
import { LogOut, PlusCircle, ShieldCheck, History } from "lucide-react";
import type { User } from "firebase/auth";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onNewEntry: () => void;
  activeView: "editor" | "history";
  setActiveView: (view: "editor" | "history") => void;
  entriesCount: number;
  isConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onNewEntry,
  activeView,
  setActiveView,
  entriesCount,
  isConnected,
}) => {
  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#05050A]/70 backdrop-blur-xl relative"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 text-black font-bold text-sm shadow-md shadow-amber-500/20 border border-amber-200/30">
            <span className="font-serif italic font-bold">L</span>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-serif text-xl tracking-widest uppercase font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-300">
                Lumina
              </span>
              <span className="hidden items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-amber-300 font-sans sm:inline-flex backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                Isolated
              </span>
            </div>
            <p className="hidden text-[10px] uppercase tracking-[0.2em] text-stone-400 font-sans sm:block">
              Intelligent Reflection &bull; Cloud Firestore
            </p>
          </div>
        </div>

        {/* Actions & User State */}
        {user ? (
          <div className="flex items-center gap-3 sm:gap-6">
            {/* View Switchers */}
            <div className="flex items-center rounded-xl border border-white/10 bg-black/40 p-1 backdrop-blur-md">
              <button
                id="nav-editor-tab"
                onClick={() => {
                  onNewEntry();
                  setActiveView("editor");
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[11px] uppercase tracking-[0.2em] font-sans transition-all duration-200 cursor-pointer ${
                  activeView === "editor"
                    ? "bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold shadow-md shadow-amber-500/20"
                    : "text-stone-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Write</span>
              </button>

              <button
                id="nav-history-tab"
                onClick={() => setActiveView("history")}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[11px] uppercase tracking-[0.2em] font-sans transition-all duration-200 cursor-pointer ${
                  activeView === "history"
                    ? "bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold shadow-md shadow-amber-500/20"
                    : "text-stone-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <History className="h-3.5 w-3.5" />
                <span>Archive</span>
                {entriesCount > 0 && (
                  <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[9px] font-sans font-bold ${
                    activeView === "history"
                      ? "bg-black/30 text-black"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}>
                    {entriesCount}
                  </span>
                )}
              </button>
            </div>

            {/* Connection badge */}
            <div
              title={isConnected ? "Connected to Firestore" : "Reconnecting to Firestore"}
              className="hidden items-center gap-1.5 text-xs text-stone-400 md:flex"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-amber-500 animate-pulse"
                }`}
              ></span>
              <span className="text-[10px] uppercase tracking-widest font-sans">
                {isConnected ? "Live" : "Syncing"}
              </span>
            </div>

            {/* User Profile and Sign Out */}
            <div className="flex items-center gap-3 pl-3 sm:pl-6 border-l border-white/10">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User Avatar"}
                  className="h-8 w-8 rounded-full border border-amber-500/30 object-cover shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-xs font-sans text-amber-300 font-bold">
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              <div className="hidden flex-col text-right lg:flex">
                <span className="text-[10px] uppercase tracking-tighter text-stone-400 font-sans">
                  Authenticated as
                </span>
                <span className="text-xs font-sans text-stone-200 truncate max-w-[130px] font-medium">
                  {user.displayName || user.email}
                </span>
              </div>
              <button
                id="btn-signout"
                onClick={onLogout}
                title="Sign Out"
                className="rounded-lg p-2 text-stone-400 hover:bg-white/5 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-sans text-stone-300 border border-amber-500/20 bg-amber-500/10 px-3 py-1 rounded-full backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              Isolated Firestore
            </span>
          </div>
        )}
      </div>
      <div className="w-full accent-line opacity-75"></div>
    </header>
  );
};
