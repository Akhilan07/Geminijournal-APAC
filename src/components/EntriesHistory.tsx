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
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-white tracking-tight">
            <span className="italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-300">
              Reflection Archives
            </span>
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-stone-300 font-sans font-light">
            {entries.length} preserved {entries.length === 1 ? "entry" : "entries"} securely stored in Cloud Firestore.
          </p>
        </div>

        <button
          id="btn-new-entry-from-history"
          onClick={onNewEntry}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] font-sans text-stone-300 shadow-sm hover:border-amber-500/40 hover:text-white transition-all cursor-pointer backdrop-blur-md"
        >
          <PlusCircle className="h-4 w-4 text-amber-400" />
          <span>New Reflection</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-400/70" />
            <input
              id="input-search-history"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, keyword, or reflections..."
              className="w-full rounded-2xl glass-input py-3 pl-11 pr-4 text-sm text-white placeholder:text-stone-500 focus:outline-none font-serif italic shadow-sm"
            />
          </div>

          {/* Mode Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {(["all", "reflection", "summary", "brainstorm", "chat"] as const).map((m) => (
              <button
                key={m}
                id={`filter-mode-${m}`}
                onClick={() => setSelectedMode(m)}
                className={`rounded-xl px-3.5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-sans transition-all duration-200 whitespace-nowrap cursor-pointer backdrop-blur-md ${
                  selectedMode === m
                    ? "bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold shadow-md shadow-amber-500/20"
                    : "border border-white/10 bg-black/30 text-stone-300 hover:border-amber-500/30 hover:bg-white/5"
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
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-sans text-stone-400 font-medium">
              <Tag className="h-3 w-3 text-amber-400" />
              <span>Filter Tags:</span>
            </span>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-rose-300 font-sans text-[10px] uppercase tracking-widest hover:bg-rose-500/20 cursor-pointer backdrop-blur-md"
              >
                Clear filter &times;
              </button>
            )}
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                className={`rounded-lg px-3 py-1 text-xs font-sans transition-all duration-200 cursor-pointer backdrop-blur-md ${
                  selectedTag === t
                    ? "border border-amber-500/40 bg-amber-500/20 text-amber-300 font-bold"
                    : "border border-white/10 bg-black/30 text-stone-300 hover:border-amber-500/30 hover:text-white"
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
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-amber-500/20 border-t-amber-400 mb-3 shadow-lg shadow-amber-500/20"></div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-sans">Accessing private records from Firestore...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredEntries.length === 0 && (
        <div
          id="history-empty-state"
          className="glass-panel rounded-3xl p-12 text-center border border-white/10"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="font-serif text-2xl font-light text-white italic">
            {entries.length === 0 ? "The silence is the soil..." : "No matching reflections"}
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-xs text-stone-300 font-sans font-light">
            {entries.length === 0
              ? "Begin by recording your first introspective journal entry or asking Gemini for guidance."
              : "Adjust your query or remove filters to explore other entries."}
          </p>
          <div className="mt-6">
            <button
              onClick={onNewEntry}
              className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-black hover:shadow-xl hover:shadow-amber-500/25 transition-all cursor-pointer"
            >
              <PlusCircle className="h-4 w-4 text-black" />
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
              className="glass-card group relative rounded-2xl p-6 shadow-md hover:border-amber-500/40 hover:bg-black/40 transition-all duration-300 cursor-pointer border border-white/10"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] uppercase tracking-widest font-sans font-bold text-amber-300 backdrop-blur-md"
                  >
                    <Icon className="h-3 w-3 text-amber-400" />
                    <span>{badge.label}</span>
                  </span>

                  <h3 className="font-serif text-xl font-normal text-stone-100 group-hover:text-amber-300 transition-colors italic">
                    {item.title || "Untitled Reflection"}
                  </h3>

                  {turnCount > 1 && (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[9px] uppercase tracking-widest font-sans font-bold text-amber-300">
                      {turnCount} turns
                    </span>
                  )}

                  {item.location && (
                    <LocationPreviewMap location={item.location} compact={true} />
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-stone-400 font-sans">
                  <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-stone-400">
                    <Calendar className="h-3 w-3 text-amber-400" />
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
                      className="rounded-lg p-1.5 text-stone-400 hover:bg-white/10 hover:text-amber-300 transition-colors"
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
                      className="rounded-lg p-1.5 text-stone-400 hover:bg-rose-950/60 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Prompt snippet */}
              <div className="mb-3 text-xs text-stone-300 font-sans">
                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-sans font-medium">User: </span>
                <span className="font-serif italic text-sm text-stone-200 line-clamp-2 leading-relaxed">
                  "{item.prompt}"
                </span>
              </div>

              {/* AI response preview */}
              <div className="rounded-xl bg-black/40 border-l-4 border-amber-400 border-white/10 p-4 text-xs text-stone-300 backdrop-blur-md">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-amber-300 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></div>
                  <span>Insight by Gemini 3.6 Flash</span>
                </div>
                <p className="line-clamp-2 leading-relaxed text-stone-300 font-sans font-light">
                  {item.aiResponse}
                </p>
              </div>

              {/* Tags & Footer */}
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(item.tags || []).map((t) => (
                    <span
                      key={t}
                      className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300 font-sans"
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-stone-400 group-hover:text-amber-300 transition-colors">
                  <span>Open &amp; Continue</span>
                  <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-amber-400" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
