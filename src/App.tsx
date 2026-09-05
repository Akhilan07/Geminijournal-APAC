import React, { useState, useEffect } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  auth,
  logoutUser,
  testConnection,
  subscribeUserInteractions,
  deleteUserInteraction,
} from "./lib/firebase";
import type { UserInteraction } from "./types";
import { Navbar } from "./components/Navbar";
import { LandingHero } from "./components/LandingHero";
import { JournalEditor } from "./components/JournalEditor";
import { EntriesHistory } from "./components/EntriesHistory";
import { EntryDetailModal } from "./components/EntryDetailModal";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  // App view state
  const [activeView, setActiveView] = useState<"editor" | "history">("editor");
  const [entries, setEntries] = useState<UserInteraction[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);

  // Detail & Continuation state
  const [selectedDetailEntry, setSelectedDetailEntry] = useState<UserInteraction | null>(null);
  const [activeEditingEntry, setActiveEditingEntry] = useState<UserInteraction | null>(null);

  // 1. Connection check on boot (Firebase Integration Skill requirement)
  useEffect(() => {
    testConnection().then((connected) => {
      setIsConnected(connected);
    });
  }, []);

  // 2. Authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 3. User interactions subscription from Firestore (Strictly owner-bound)
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setEntriesLoading(false);
      return;
    }

    setEntriesLoading(true);
    const unsubscribe = subscribeUserInteractions(
      user.uid,
      (data) => {
        setEntries(data);
        setEntriesLoading(false);
      },
      (error) => {
        console.error("Interaction subscription error:", error);
        setEntriesLoading(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setActiveEditingEntry(null);
      setSelectedDetailEntry(null);
      setActiveView("editor");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleNewEntry = () => {
    setActiveEditingEntry(null);
    setActiveView("editor");
  };

  const handleDeleteEntry = async (id: string) => {
    if (!user) return;
    try {
      await deleteUserInteraction(user.uid, id);
      // If deleted entry was in detail modal or actively edited, clear it
      if (selectedDetailEntry?.id === id) {
        setSelectedDetailEntry(null);
      }
      if (activeEditingEntry?.id === id) {
        setActiveEditingEntry(null);
      }
    } catch (err) {
      console.error("Error deleting entry:", err);
    }
  };

  const handleContinueInEditor = (entry: UserInteraction) => {
    setActiveEditingEntry(entry);
    setActiveView("editor");
  };

  const handleEntrySaved = (entry: UserInteraction) => {
    setActiveEditingEntry(entry);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-stone-700 border-t-gold mb-3"></div>
          <p className="font-serif italic text-sm text-stone-400">Navigating to Reflections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-[#D1D1D1] font-sans selection:bg-gold selection:text-black">
      <Navbar
        user={user}
        onLogout={handleLogout}
        onNewEntry={handleNewEntry}
        activeView={activeView}
        setActiveView={setActiveView}
        entriesCount={entries.length}
        isConnected={isConnected}
      />

      <main className="flex-1">
        {!user ? (
          <LandingHero onLoginSuccess={() => setActiveView("editor")} />
        ) : activeView === "editor" ? (
          <JournalEditor
            user={user}
            initialEntry={activeEditingEntry}
            onEntrySaved={handleEntrySaved}
            onViewHistory={() => setActiveView("history")}
          />
        ) : (
          <EntriesHistory
            entries={entries}
            loading={entriesLoading}
            onSelectEntry={(entry) => setSelectedDetailEntry(entry)}
            onDeleteEntry={handleDeleteEntry}
            onNewEntry={handleNewEntry}
          />
        )}
      </main>

      {/* Detail Modal */}
      {selectedDetailEntry && (
        <EntryDetailModal
          entry={selectedDetailEntry}
          onClose={() => setSelectedDetailEntry(null)}
          onContinueInEditor={handleContinueInEditor}
          onDelete={handleDeleteEntry}
        />
      )}
    </div>
  );
}
