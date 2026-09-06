import React, { useState } from "react";
import Markdown from "react-markdown";
import {
  X,
  Calendar,
  Sparkles,
  BookOpen,
  FileText,
  Lightbulb,
  MessageSquare,
  Copy,
  Check,
  Trash2,
  ArrowRight,
  Layers,
} from "lucide-react";
import type { UserInteraction, InteractionMode } from "../types";
import { LocationPreviewMap } from "./LocationPreviewMap";

interface EntryDetailModalProps {
  entry: UserInteraction | null;
  onClose: () => void;
  onContinueInEditor: (entry: UserInteraction) => void;
  onDelete: (id: string) => void;
}

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
  entry,
  onClose,
  onContinueInEditor,
  onDelete,
}) => {
  const [copied, setCopied] = useState(false);

  if (!entry) return null;

  const handleCopy = () => {
    const fullText = `# ${entry.title}\nDate: ${entry.createdAt}\nMode: ${entry.mode}\n\n## Prompt\n${entry.prompt}\n\n## Gemini Response\n${entry.aiResponse}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getModeInfo = (mode: InteractionMode) => {
    switch (mode) {
      case "summary":
        return { label: "Summary", icon: FileText, color: "text-stone-300 bg-[#0D0D0D] border-sep" };
      case "brainstorm":
        return { label: "Brainstorm", icon: Lightbulb, color: "text-gold bg-[#0D0D0D] border-sep" };
      case "chat":
        return { label: "Dialogue", icon: MessageSquare, color: "text-stone-300 bg-[#0D0D0D] border-sep" };
      case "reflection":
      default:
        return { label: "Reflection", icon: BookOpen, color: "text-gold bg-[#0D0D0D] border-sep" };
    }
  };

  const modeInfo = getModeInfo(entry.mode);
  const Icon = modeInfo.icon;
  const turns = entry.turns || [
    { role: "user", text: entry.prompt, timestamp: entry.createdAt },
    { role: "model", text: entry.aiResponse, timestamp: entry.updatedAt },
  ];

  return (
    <div
      id="entry-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        id="entry-detail-modal-container"
        className="glass-modal relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl shadow-2xl border border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] uppercase tracking-widest font-sans font-bold text-amber-300 backdrop-blur-md">
              <Icon className="h-3.5 w-3.5 text-amber-400" />
              <span>{modeInfo.label}</span>
            </span>
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-stone-400 font-sans">
              <Calendar className="h-3.5 w-3.5 text-amber-400" />
              <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="rounded-lg p-2 text-stone-400 hover:bg-white/10 hover:text-amber-300 transition-colors cursor-pointer"
              title="Copy entry"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
            <button
              onClick={() => {
                if (confirm("Delete this entry permanently?")) {
                  onDelete(entry.id);
                  onClose();
                }
              }}
              className="rounded-lg p-2 text-stone-400 hover:bg-rose-950/60 hover:text-rose-400 transition-colors cursor-pointer"
              title="Delete entry"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              id="btn-close-modal"
              onClick={onClose}
              className="rounded-lg p-2 text-stone-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-transparent">
          <div>
            <h2 className="font-serif text-2xl sm:text-4xl font-normal text-white italic tracking-tight">
              {entry.title || "Untitled Reflection"}
            </h2>
            {entry.tags && entry.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.tags.map((t) => (
                  <span key={t} className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] uppercase font-sans text-amber-300 font-bold">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Location Preview Map if attached */}
          {entry.location && (
            <div className="mb-2">
              <LocationPreviewMap location={entry.location} compact={false} />
            </div>
          )}

          {/* Conversation Turns */}
          <div className="space-y-4">
            {turns.map((turn, i) => {
              const isUser = turn.role === "user";
              return (
                <div
                  key={i}
                  className={
                    isUser
                      ? "glass-card rounded-2xl p-5 text-stone-200 border-white/10"
                      : "glass-panel rounded-2xl p-6 border-l-4 border-amber-400 border-white/10 shadow-lg"
                  }
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      {isUser ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-800 text-[10px] uppercase font-sans text-stone-300 border border-stone-700 font-bold">
                          U
                        </span>
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-black text-[9px] font-bold shadow-md shadow-amber-500/20">
                          <Sparkles className="h-2.5 w-2.5" />
                        </div>
                      )}
                      <span className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-amber-300">
                        {isUser ? "Your Journal Reflection" : "Insight by Gemini 3.6 Flash"}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-stone-400 font-sans">
                      {new Date(turn.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {isUser ? (
                    <p className="whitespace-pre-wrap font-serif text-base sm:text-lg font-light italic leading-relaxed text-white">
                      {turn.text}
                    </p>
                  ) : (
                    <div className="prose prose-invert prose-stone max-w-none text-stone-200 font-sans text-sm sm:text-base leading-relaxed">
                      <Markdown>{turn.text}</Markdown>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs text-stone-400 font-mono text-[10px] uppercase tracking-widest">
            <Layers className="h-3.5 w-3.5 text-amber-400" />
            <span>ID: {entry.id.slice(0, 8)}...</span>
          </div>

          <button
            id="btn-continue-in-editor"
            onClick={() => {
              onContinueInEditor(entry);
              onClose();
            }}
            className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-black hover:shadow-lg hover:shadow-amber-500/25 transition-all cursor-pointer"
          >
            <span>Continue Reflection</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
