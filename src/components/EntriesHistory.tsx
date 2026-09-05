import React, { useState, useMemo } from "react";
import {
  Search,
  BookOpen,
  FileText,
  Lightbulb,
  MessageSquare,
  Calendar,
  Tag,
  Trash2,
  ArrowUpRight,
  Sparkles,
  PlusCircle,
  Copy,
  Check,
  Filter,
} from "lucide-react";
import type { UserInteraction, InteractionMode } from "../types";
import { LocationPreviewMap } from "./LocationPreviewMap";

interface EntriesHistoryProps {
  entries: UserInteraction[];
  loading: boolean;
  onSelectEntry: (entry: UserInteraction) => void;
  onDeleteEntry: (id: string) => void;
  onNewEntry: () => void;
}

export const EntriesHistory: React.FC<EntriesHistoryProps> = ({
  entries,
  loading,
  onSelectEntry,
  onDeleteEntry,
  onNewEntry,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMode, setSelectedMode] = useState<InteractionMode | "all">("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Collect all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      (e.tags || []).forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [entries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      // Mode filter
      if (selectedMode !== "all" && item.mode !== selectedMode) {
        return false;
      }
      // Tag filter
      if (selectedTag && !(item.tags || []).includes(selectedTag)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (item.title || "").toLowerCase().includes(q);
        const promptMatch = (item.prompt || "").toLowerCase().includes(q);
        const aiMatch = (item.aiResponse || "").toLowerCase().includes(q);
        const tagsMatch = (item.tags || []).some((t) => t.toLowerCase().includes(q));
        const locationMatch = Boolean(
          item.location &&
            ((item.location.address || "").toLowerCase().includes(q) ||
              (item.location.name || "").toLowerCase().includes(q))
        );
        return titleMatch || promptMatch || aiMatch || tagsMatch || locationMatch;
      }
      return true;
    });
  }, [entries, selectedMode, selectedTag, searchQuery]);

  const handleCopyText = (e: React.MouseEvent, entry: UserInteraction) => {
    e.stopPropagation();
    const content = `Title: ${entry.title}\n\nReflection Prompt:\n${entry.prompt}\n\nGemini Response:\n${entry.aiResponse}`;
    navigator.clipboard.writeText(content);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this reflection? This action cannot be undone.")) {
      onDeleteEntry(id);
    }
  };

  const getModeBadge = (mode: InteractionMode) => {
    switch (mode) {
      case "summary":
        return {
          label: "Summary",
          color: "bg-[#0D0D0D] text-stone-300 border-sep",
          icon: FileText,
        };
      case "brainstorm":
        return {
          label: "Brainstorm",
          color: "bg-[#0D0D0D] text-gold border-sep",
          icon: Lightbulb,
        };
      case "chat":
        return {
          label: "Dialogue",
          color: "bg-[#0D0D0D] text-stone-300 border-sep",
          icon: MessageSquare,
        };
      case "reflection":
      default:
        return {
          label: "Reflection",
          color: "bg-[#0D0D0D] text-gold border-sep",
          icon: BookOpen,
        };
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-5xl px-4 py-8 sm:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-sep pb-6">
        <div>
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-white tracking-tight">
            <span className="italic">Reflection Archives</span>
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#A8A8A8] font-sans font-light">
            {entries.length} preserved {entries.length === 1 ? "entry" : "entries"} securely stored in Cloud Firestore.
          </p>
        </div>

        <button
          id="btn-new-entry-from-history"
          onClick={onNewEntry}
          className="flex items-center justify-center gap-2 rounded-xl border border-sep bg-[#0D0D0D] px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] font-sans text-stone-300 shadow-sm hover:border-gold hover:text-white transition-all cursor-pointer"
        >
          <PlusCircle className="h-4 w-4 text-gold" />
          <span>New Reflection</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
            <input
              id="input-search-history"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, keyword, or reflections..."
              className="w-full rounded-xl border border-sep bg-[#0D0D0D] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-stone-600 focus:border-gold focus:outline-none font-serif italic shadow-sm"
            />
          </div>

          {/* Mode Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {(["all", "reflection", "summary", "brainstorm", "chat"] as const).map((m) => (
              <button
                key={m}
                id={`filter-mode-${m}`}
                onClick={() => setSelectedMode(m)}
                className={`rounded-lg px-3 py-2 text-[10px] uppercase tracking-[0.2em] font-sans transition-colors whitespace-nowrap cursor-pointer ${
                  selectedMode === m
                    ? "border border-[#C5A059] bg-[#141414] text-white shadow-sm"
                    : "border border-sep bg-[#0D0D0D] text-stone-400 hover:border-gold/60 hover:text-white"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Tag Filters (if any) */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto text-xs text-stone-400 py-1">
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-sans text-stone-500">
              <Tag className="h-3 w-3 text-gold" />
              <span>Tags:</span>
            </span>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="rounded-md border border-sep bg-stone-800 px-2 py-0.5 text-stone-200 font-sans text-[10px] uppercase tracking-widest hover:border-gold cursor-pointer"
              >
                Clear filter &times;
              </button>
            )}
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                className={`rounded-md px-2.5 py-0.5 text-xs font-sans transition-colors cursor-pointer ${
                  selectedTag === t
                    ? "border border-gold bg-[#141414] text-gold"
                    : "border border-sep bg-[#0D0D0D] text-stone-400 hover:border-gold hover:text-white"
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && entries.length === 0 && (
        <div className="py-16 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-stone-700 border-t-gold mb-3"></div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-sans">Accessing private records from Firestore...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredEntries.length === 0 && (
        <div
          id="history-empty-state"
          className="rounded-2xl border border-sep bg-[#080808] p-12 text-center"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-sep bg-[#0D0D0D] text-gold mb-4">
            <BookOpen className="h-5 w-5" />
          </div>
          <h3 className="font-serif text-xl font-light text-white italic">
            {entries.length === 0 ? "The silence is the soil..." : "No matching reflections"}
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-xs text-[#A8A8A8] font-sans">
            {entries.length === 0
              ? "Begin by recording your first introspective journal entry or asking Gemini for guidance."
              : "Adjust your query or remove filters to explore other entries."}
          </p>
          <div className="mt-6">
            <button
              onClick={onNewEntry}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-sans font-medium text-black hover:bg-[#C5A059] transition-colors cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Compose Reflection</span>
            </button>
          </div>
        </div>
      )}

      {/* Entries List */}
      <div id="entries-grid" className="space-y-4">
        {filteredEntries.map((item) => {
          const badge = getModeBadge(item.mode);
          const Icon = badge.icon;
          const turnCount = item.turns ? Math.floor(item.turns.length / 2) : 1;

          return (
            <div
              key={item.id}
              id={`entry-card-${item.id}`}
              onClick={() => onSelectEntry(item)}
              className="group relative rounded-2xl border border-sep bg-[#080808] p-6 shadow-sm hover:border-gold hover:bg-[#0c0c0c] transition-all cursor-pointer"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-widest font-sans font-medium ${badge.color}`}
                  >
                    <Icon className="h-3 w-3 text-gold" />
                    <span>{badge.label}</span>
                  </span>

                  <h3 className="font-serif text-lg font-light text-white group-hover:text-gold transition-colors italic">
                    {item.title || "Untitled Reflection"}
                  </h3>

                  {turnCount > 1 && (
                    <span className="rounded-full border border-sep bg-[#0D0D0D] px-2 py-0.5 text-[9px] uppercase tracking-widest font-sans text-gold">
                      {turnCount} turns
                    </span>
                  )}

                  {item.location && (
                    <LocationPreviewMap location={item.location} compact={true} />
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-stone-500 font-sans">
                  <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-stone-400">
                    <Calendar className="h-3 w-3 text-gold" />
                    <span>
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      title="Copy content"
                      onClick={(e) => handleCopyText(e, item)}
                      className="rounded-md p-1.5 text-stone-500 hover:bg-[#0D0D0D] hover:text-gold transition-colors"
                    >
                      {copiedId === item.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      title="Delete entry"
                      onClick={(e) => handleDelete(e, item.id)}
                      className="rounded-md p-1.5 text-stone-500 hover:bg-rose-950/50 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Prompt snippet */}
              <div className="mb-3 text-xs text-[#A8A8A8] font-sans">
                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-sans">User: </span>
                <span className="font-serif italic text-sm text-white/90 line-clamp-2 leading-relaxed">
                  "{item.prompt}"
                </span>
              </div>

              {/* AI response preview */}
              <div className="rounded-xl bg-[#0D0D0D] border-l-2 border-[#C5A059] border-t border-r border-b border-sep p-4 text-xs text-[#D1D1D1]">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-gold mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                  <span>Insight by Gemini 3.6 Flash</span>
                </div>
                <p className="line-clamp-2 leading-relaxed text-[#A8A8A8] font-sans">
                  {item.aiResponse}
                </p>
              </div>

              {/* Tags & Footer */}
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-sep text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(item.tags || []).map((t) => (
                    <span
                      key={t}
                      className="rounded-md border border-sep bg-[#0D0D0D] px-2 py-0.5 text-[10px] text-gold font-sans"
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-sans text-stone-400 group-hover:text-gold transition-colors">
                  <span>Open &amp; Continue</span>
                  <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
