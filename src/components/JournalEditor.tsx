import React, { useState, useEffect } from "react";
import Markdown from "react-markdown";
import {
  Sparkles,
  Send,
  Save,
  RotateCcw,
  BookOpen,
  Lightbulb,
  FileText,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Tag,
  Clock,
  Layers,
} from "lucide-react";
import type { User } from "firebase/auth";
import type { InteractionMode, UserInteraction, ChatTurn } from "../types";
import { saveUserInteraction } from "../lib/firebase";

interface JournalEditorProps {
  user: User;
  initialEntry?: UserInteraction | null;
  onEntrySaved: (entry: UserInteraction) => void;
  onViewHistory: () => void;
}

const PROMPT_STARTERS: Record<InteractionMode, string[]> = {
  reflection: [
    "Today I encountered a situation that challenged my patience...",
    "A small win I had recently that made me feel proud was...",
    "Lately, I've noticed an emotional pattern whenever I work on...",
    "What I truly appreciate about where I am in life right now is...",
  ],
  summary: [
    "Here is a raw brain dump of everything that happened this week...",
    "Review my meeting and personal focus notes from today and extract the core highlights...",
    "Summarize these project deliberations into three clear decisions and takeaways...",
  ],
  brainstorm: [
    "I want to explore 5 creative solutions to reduce daily cognitive fatigue...",
    "Brainstorm fresh angles for a personal writing project about mindfulness...",
    "Help me think through unconventional avenues to level up my engineering craft...",
  ],
  chat: [
    "I have been feeling torn between two competing priorities...",
    "Can we explore why I feel hesitant about starting my next big initiative?",
    "I'd love your perspective on how to set healthier boundaries without guilt...",
  ],
};

export const JournalEditor: React.FC<JournalEditorProps> = ({
  user,
  initialEntry,
  onEntrySaved,
  onViewHistory,
}) => {
  const [mode, setMode] = useState<InteractionMode>("reflection");
  const [title, setTitle] = useState("");
  const [promptText, setPromptText] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  
  // Active session tracking
  const [currentId, setCurrentId] = useState<string>(() => crypto.randomUUID());
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [latestAiResponse, setLatestAiResponse] = useState<string>("");
  const [modelUsed, setModelUsed] = useState<string>("gemini-3.6-flash");

  // Status & Transaction Verification
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync if an initialEntry was passed (e.g. from history detail)
  useEffect(() => {
    if (initialEntry) {
      setCurrentId(initialEntry.id);
      setTitle(initialEntry.title);
      setMode(initialEntry.mode);
      setTags(initialEntry.tags || []);
      setLatestAiResponse(initialEntry.aiResponse);
      setTurns(initialEntry.turns || [
        { role: "user", text: initialEntry.prompt, timestamp: initialEntry.createdAt },
        { role: "model", text: initialEntry.aiResponse, timestamp: initialEntry.updatedAt },
      ]);
      setPromptText("");
      setModelUsed(initialEntry.modelUsed || "gemini-3.6-flash");
    }
  }, [initialEntry]);

  // Mode descriptions
  const modeOptions: Array<{
    id: InteractionMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    desc: string;
  }> = [
    {
      id: "reflection",
      label: "Reflection",
      icon: BookOpen,
      desc: "Mindful insights and philosophical sounding board",
    },
    {
      id: "summary",
      label: "Summary",
      icon: FileText,
      desc: "Key themes, synthesis, and actionable takeaways",
    },
    {
      id: "brainstorm",
      label: "Brainstorm",
      icon: Lightbulb,
      desc: "Creative angles and exploratory next steps",
    },
    {
      id: "chat",
      label: "Dialogue",
      icon: MessageSquare,
      desc: "Multi-turn conversational journaling partner",
    },
  ];

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, "");
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Production Directive 6.2: Guaranteed Transaction Verification (Input-to-Save Completeness)
  const executeSaveToFirestore = async (entry: UserInteraction) => {
    try {
      setSaveError(null);
      await saveUserInteraction(user.uid, entry);
      setSaveSuccess(true);
      onEntrySaved(entry);
      setTimeout(() => setSaveSuccess(false), 3500);
      return true;
    } catch (err: any) {
      console.error("Firestore save failure:", err);
      setSaveError(
        "Network or permission issue saving entry to Firestore. Your text is preserved below. Please click 'Retry Save'."
      );
      return false;
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const promptToSend = promptText.trim();
    if (!promptToSend || loading) return;

    setLoading(true);
    setErrorMessage(null);
    setSaveError(null);

    const now = new Date().toISOString();
    const newTurn: ChatTurn = {
      role: "user",
      text: promptToSend,
      timestamp: now,
    };

    // Prepare previous turns for multi-turn dialogue
    const previousTurns = turns.map((t) => ({ role: t.role, text: t.text }));

    try {
      const res = await fetch("/api/gemini/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToSend,
          mode,
          title: title.trim() || undefined,
          previousTurns,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with HTTP ${res.status}`);
      }

      const data = await res.json();
      const aiText = data.response || "No response generated.";
      const returnedTitle = data.title || title || "Untitled Reflection";
      const resolvedModel = data.modelUsed || "gemini-3.6-flash";

      const aiTurn: ChatTurn = {
        role: "model",
        text: aiText,
        timestamp: new Date().toISOString(),
      };

      const updatedTurns = [...turns, newTurn, aiTurn];
      const entryToSave: UserInteraction = {
        id: currentId,
        userId: user.uid,
        title: returnedTitle,
        prompt: turns.length === 0 ? promptToSend : turns[0].text,
        aiResponse: aiText,
        mode,
        tags,
        turns: updatedTurns,
        modelUsed: resolvedModel,
        createdAt: turns.length === 0 ? now : (turns[0]?.timestamp || now),
        updatedAt: new Date().toISOString(),
      };

      // State updates
      setTitle(returnedTitle);
      setLatestAiResponse(aiText);
      setTurns(updatedTurns);
      setModelUsed(resolvedModel);

      // CRITICAL TRANSACTION VERIFICATION:
      // Persist to Cloud Firestore before clearing prompt buffer
      const saved = await executeSaveToFirestore(entryToSave);
      if (saved) {
        // Clear current prompt input for subsequent turn
        setPromptText("");
      }
    } catch (err: any) {
      console.error("Gemini interaction failed:", err);
      setErrorMessage(
        err.message || "Failed to generate reflection. Please check your internet or retry."
      );
      // NOTE: We deliberately do NOT clear promptText here so the user never loses their work!
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!latestAiResponse) return;
    navigator.clipboard.writeText(latestAiResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartFresh = () => {
    setCurrentId(crypto.randomUUID());
    setTitle("");
    setPromptText("");
    setLatestAiResponse("");
    setTurns([]);
    setTags([]);
    setErrorMessage(null);
    setSaveError(null);
  };

  return (
    <div className="relative mx-auto w-full max-w-5xl px-4 py-8 sm:px-8">
      {/* Top Banner with Mode Selector & New Session */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-sep pb-6">
        <div>
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-white tracking-tight">
            {turns.length > 0 ? (
              <span className="flex items-center gap-3">
                <span className="italic">{title || "Active Journal Entry"}</span>
                <span className="rounded-full border border-sep bg-[#0D0D0D] px-2.5 py-0.5 text-[10px] uppercase tracking-widest font-sans font-medium text-gold">
                  {turns.length / 2} {turns.length === 2 ? "turn" : "turns"}
                </span>
              </span>
            ) : (
              <span className="italic">Navigating the Reflection</span>
            )}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#A8A8A8] font-sans font-light">
            Record your introspection. Gemini analyzes nuances, extracts essential truths, and safeguards memory in Cloud Firestore.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {turns.length > 0 && (
            <button
              id="btn-start-fresh"
              onClick={handleStartFresh}
              className="flex items-center gap-1.5 rounded-lg border border-sep bg-[#0D0D0D] px-3.5 py-2 text-[10px] uppercase tracking-[0.2em] font-sans text-stone-300 hover:border-gold hover:text-white transition-all cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-gold" />
              <span>New Reflection</span>
            </button>
          )}
          <button
            id="btn-view-history-shortcut"
            onClick={onViewHistory}
            className="flex items-center gap-1.5 rounded-lg border border-sep bg-[#0D0D0D] px-3.5 py-2 text-[10px] uppercase tracking-[0.2em] font-sans text-stone-300 hover:border-gold hover:text-white transition-all cursor-pointer"
          >
            <Clock className="h-3.5 w-3.5 text-gold" />
            <span>Archive</span>
          </button>
        </div>
      </div>

      {/* Mode Selector Cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {modeOptions.map((opt) => {
          const Icon = opt.icon;
          const isSelected = mode === opt.id;
          return (
            <button
              key={opt.id}
              id={`mode-select-${opt.id}`}
              type="button"
              onClick={() => setMode(opt.id)}
              className={`flex flex-col rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                isSelected
                  ? "border-[#C5A059] bg-[#141414] text-white shadow-md"
                  : "border-sep bg-[#0D0D0D] text-stone-400 hover:border-gold/50 hover:bg-[#121212]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-md ${
                    isSelected ? "bg-[#050505] text-gold border border-gold/40" : "bg-[#050505] text-stone-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {isSelected && (
                  <span className="h-2 w-2 rounded-full bg-gold"></span>
                )}
              </div>
              <span className="mt-2.5 text-[11px] uppercase tracking-widest font-sans font-semibold">
                {opt.label}
              </span>
              <span
                className={`mt-1 text-[11px] line-clamp-2 leading-tight font-sans ${
                  isSelected ? "text-[#D1D1D1]" : "text-[#777]"
                }`}
              >
                {opt.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Conversation Thread (if multi-turn) */}
      {turns.length > 0 && (
        <div id="interaction-turns-list" className="mb-8 space-y-6">
          {turns.map((turn, idx) => {
            const isUser = turn.role === "user";
            return (
              <div
                key={idx}
                className={
                  isUser
                    ? "rounded-2xl border border-sep bg-[#080808] p-6 text-[#D1D1D1] ml-4 sm:ml-12"
                    : "rounded-2xl bg-[#0D0D0D] p-7 border-l-2 border-[#C5A059] border-t border-r border-b border-sep shadow-md mr-4 sm:mr-12"
                }
              >
                <div className="flex items-center justify-between border-b border-sep pb-3 mb-4">
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
                  <span className="text-[10px] uppercase tracking-widest text-stone-400 font-sans">
                    {new Date(turn.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {isUser ? (
                  <p className="whitespace-pre-wrap font-serif text-lg font-light leading-relaxed text-white">
                    {turn.text}
                  </p>
                ) : (
                  <div className="prose prose-invert prose-stone max-w-none text-[#D1D1D1] font-sans text-sm sm:text-base leading-relaxed">
                    <Markdown>{turn.text}</Markdown>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction & Feedback Banners */}
      {errorMessage && (
        <div
          id="editor-error-banner"
          className="mb-4 flex items-center justify-between rounded-xl bg-rose-950/40 border border-rose-800 p-4 text-xs text-rose-300 font-sans"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => handleSubmit()}
            className="font-medium underline hover:text-white cursor-pointer ml-2 uppercase tracking-widest text-[10px]"
          >
            Retry Call
          </button>
        </div>
      )}

      {saveError && (
        <div
          id="firestore-save-error-banner"
          className="mb-4 flex items-center justify-between rounded-xl bg-amber-950/40 border border-[#C5A059] p-4 text-xs text-amber-200 font-sans"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-gold" />
            <span>{saveError}</span>
          </div>
          <button
            id="btn-retry-save"
            onClick={() => {
              if (turns.length > 0) {
                const lastTurn = turns[turns.length - 1];
                executeSaveToFirestore({
                  id: currentId,
                  userId: user.uid,
                  title: title || "Untitled Reflection",
                  prompt: turns[0].text,
                  aiResponse: lastTurn.role === "model" ? lastTurn.text : latestAiResponse,
                  mode,
                  tags,
                  turns,
                  modelUsed,
                  createdAt: turns[0].timestamp,
                  updatedAt: new Date().toISOString(),
                });
              }
            }}
            className="rounded-md bg-[#C5A059] px-3 py-1 text-black font-medium hover:bg-white transition-colors cursor-pointer text-[10px] uppercase tracking-widest"
          >
            Retry Save
          </button>
        </div>
      )}

      {saveSuccess && (
        <div
          id="firestore-save-success-banner"
          className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-950/40 border border-emerald-800 px-4 py-2.5 text-xs text-emerald-300 font-sans"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Saved to your private Firestore database successfully.</span>
        </div>
      )}

      {/* Editor Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-sep bg-[#080808] p-6 shadow-xl">
        {/* Optional Title and Metadata row */}
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <input
            id="input-entry-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Entry title (optional, Gemini will craft one)"
            className="w-full sm:flex-1 rounded-lg border border-sep bg-[#0D0D0D] px-3.5 py-2.5 text-sm text-white placeholder:text-stone-600 focus:border-gold focus:outline-none font-serif italic"
          />

          {/* Tag Input */}
          <div className="flex w-full sm:w-auto items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-stone-500 shrink-0" />
            <input
              id="input-entry-tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add tag + Enter"
              className="w-full sm:w-36 rounded-lg border border-sep bg-[#0D0D0D] px-3 py-2 text-xs text-white placeholder:text-stone-600 focus:border-gold focus:outline-none font-sans"
            />
          </div>
        </div>

        {/* Rendered Tag Badges */}
        {tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-md border border-sep bg-[#141414] px-2.5 py-0.5 text-xs text-gold font-sans"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="text-stone-400 hover:text-white cursor-pointer ml-1"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Prompt Starters (show if thread is empty) */}
        {turns.length === 0 && (
          <div className="mb-4">
            <span className="text-[10px] uppercase tracking-[0.2em] font-sans text-stone-400">
              Inspiration Prompts:
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {PROMPT_STARTERS[mode].map((starter, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPromptText(starter)}
                  className="rounded-full border border-sep bg-[#0D0D0D] px-3 py-1 text-[11px] text-stone-300 hover:border-gold hover:text-white transition-colors cursor-pointer text-left font-serif italic"
                >
                  {starter.length > 50 ? starter.slice(0, 50) + "..." : starter}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Textarea */}
        <div className="relative">
          <textarea
            id="textarea-journal-prompt"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={turns.length > 0 ? 3 : 6}
            placeholder={
              turns.length > 0
                ? "Continue your reflection..."
                : `Write your ${mode} here... (e.g. How do I strip back the noise to find the essential truth of the design?)`
            }
            className="w-full resize-y rounded-xl border border-sep bg-[#050505] p-4 text-base sm:text-lg text-white placeholder:text-stone-600 focus:border-gold focus:outline-none leading-relaxed font-serif italic"
          />
        </div>

        {/* Action Controls Footer */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <div className="flex items-center gap-3 text-xs text-stone-400 font-sans">
            <span className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-gold" />
              <span className="text-[10px] uppercase tracking-widest">Model:</span>
              <code className="rounded border border-sep bg-[#0D0D0D] px-1.5 py-0.5 text-[11px] text-gold font-mono">
                {modelUsed}
              </code>
            </span>
            <span>&bull;</span>
            <span className="text-[10px] uppercase tracking-widest">{promptText.length} chars</span>
          </div>

          <div className="flex items-center gap-3">
            {latestAiResponse && (
              <button
                type="button"
                id="btn-copy-latest"
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg border border-sep bg-[#0D0D0D] px-3 py-2 text-[10px] uppercase tracking-[0.2em] font-sans text-stone-300 hover:border-gold hover:text-white transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            )}

            <button
              id="btn-submit-reflection"
              type="submit"
              disabled={loading || !promptText.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] font-sans font-medium text-black shadow-lg hover:bg-[#C5A059] hover:text-black active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-600 border-t-black"></div>
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-[#8E6E3A]" />
                  <span>
                    {turns.length > 0 ? "Send Follow-up" : `Synthesize ${modeOptions.find((m) => m.id === mode)?.label}`}
                  </span>
                  <Send className="h-3 w-3 ml-0.5 opacity-80" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
