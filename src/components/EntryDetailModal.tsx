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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        id="entry-detail-modal-container"
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-[#080808] shadow-2xl border border-sep overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-sep px-6 py-4 bg-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-[10px] uppercase tracking-widest font-sans font-medium ${modeInfo.color}`}>
              <Icon className="h-3 w-3 text-gold" />
              <span>{modeInfo.label}</span>
            </span>
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-stone-400 font-sans">
              <Calendar className="h-3 w-3 text-gold" />
              <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="rounded-lg p-1.5 text-stone-500 hover:bg-[#141414] hover:text-gold transition-colors cursor-pointer"
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
              className="rounded-lg p-1.5 text-stone-500 hover:bg-rose-950/50 hover:text-rose-400 transition-colors cursor-pointer"
              title="Delete entry"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              id="btn-close-modal"
              onClick={onClose}
              className="rounded-lg p-1.5 text-stone-500 hover:bg-[#141414] hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#080808]">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-light text-white italic tracking-tight">
              {entry.title || "Untitled Reflection"}
            </h2>
            {entry.tags && entry.tags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {entry.tags.map((t) => (
                  <span key={t} className="rounded-md border border-sep bg-[#0D0D0D] px-2.5 py-0.5 text-[10px] uppercase font-sans text-gold">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Conversation Turns */}
          <div className="space-y-4">
            {turns.map((turn, i) => {
              const isUser = turn.role === "user";
              return (
                <div
                  key={i}
                  className={
                    isUser
                      ? "rounded-xl border border-sep bg-[#050505] p-5 text-white"
                      : "rounded-xl bg-[#0D0D0D] border-l-2 border-[#C5A059] border-t border-r border-b border-sep p-5 shadow-sm"
                  }
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-sep">
                    <div className="flex items-center gap-2">
                      {isUser ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-800 text-[10px] uppercase font-sans text-stone-300">
                          U
                        </span>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gold"></div>
                      )}
                      <span className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-gold">
                        {isUser ? "Your Journal Reflection" : "Insight by Gemini 3.6 Flash"}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-stone-500 font-sans">
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
                    <div className="prose prose-invert prose-stone max-w-none text-[#D1D1D1] font-sans text-sm leading-relaxed">
                      <Markdown>{turn.text}</Markdown>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-sep px-6 py-4 bg-[#0A0A0A]">
          <div className="flex items-center gap-2 text-xs text-stone-500 font-mono text-[10px] uppercase tracking-widest">
            <Layers className="h-3.5 w-3.5 text-gold" />
            <span>ID: {entry.id.slice(0, 8)}...</span>
          </div>

          <button
            id="btn-continue-in-editor"
            onClick={() => {
              onContinueInEditor(entry);
              onClose();
            }}
            className="flex items-center gap-2 rounded-xl bg-white px-5 py-2 text-[10px] uppercase tracking-[0.2em] font-sans font-medium text-black hover:bg-[#C5A059] transition-all cursor-pointer"
          >
            <span>Continue Reflection</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
