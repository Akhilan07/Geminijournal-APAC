import React from "react";
import { Sparkles, LogOut, BookOpen, PlusCircle, ShieldCheck, History } from "lucide-react";
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
      className="sticky top-0 z-40 w-full border-b border-sep bg-[#050505]/95 backdrop-blur-md relative"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#C5A059] to-[#8E6E3A] text-black font-bold text-xs shadow-sm">
            <span className="font-serif">L</span>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-serif text-lg tracking-widest uppercase font-light text-white">
                Lumina
              </span>
              <span className="hidden items-center gap-1.5 rounded-full border border-sep bg-[#0D0D0D] px-2 py-0.5 text-[10px] uppercase tracking-widest text-gold font-sans sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C5A059]"></span>
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
            <div className="flex items-center rounded-lg border border-sep bg-[#0D0D0D] p-1">
              <button
                id="nav-editor-tab"
                onClick={() => {
                  onNewEntry();
                  setActiveView("editor");
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] font-sans transition-all cursor-pointer ${
                  activeView === "editor"
                    ? "bg-white text-black font-medium shadow-xs"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Write</span>
              </button>

              <button
                id="nav-history-tab"
                onClick={() => setActiveView("history")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] font-sans transition-all cursor-pointer ${
                  activeView === "history"
                    ? "bg-white text-black font-medium shadow-xs"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                <History className="h-3.5 w-3.5" />
                <span>Archive</span>
                {entriesCount > 0 && (
                  <span className="ml-1 rounded-full bg-stone-800 px-1.5 py-0.2 text-[9px] font-sans font-semibold text-gold">
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
                  isConnected ? "bg-[#C5A059]" : "bg-amber-500 animate-pulse"
                }`}
              ></span>
              <span className="text-[10px] uppercase tracking-widest font-sans">
                {isConnected ? "Live" : "Syncing"}
              </span>
            </div>

            {/* User Profile and Sign Out */}
            <div className="flex items-center gap-3 pl-3 sm:pl-6 border-l border-sep">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User Avatar"}
                  className="h-8 w-8 rounded-full border border-sep object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-sep bg-subtle text-xs font-sans text-gold">
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              <div className="hidden flex-col text-right lg:flex">
                <span className="text-[10px] uppercase tracking-tighter text-stone-400 font-sans">
                  Authenticated as
                </span>
                <span className="text-xs font-sans text-white truncate max-w-[130px]">
                  {user.displayName || user.email}
                </span>
              </div>
              <button
                id="btn-signout"
                onClick={onLogout}
                title="Sign Out"
                className="rounded-lg p-2 text-stone-400 hover:bg-[#0D0D0D] hover:text-gold transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] uppercase tracking-widest font-sans text-stone-400">
              <ShieldCheck className="h-3.5 w-3.5 text-gold" />
              Isolated Firestore
            </span>
          </div>
        )}
      </div>
      <div className="w-full accent-line"></div>
    </header>
  );
};
