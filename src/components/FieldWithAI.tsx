import { useState, useRef, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { ai } from "../lib/gemini";
import type { Lang } from "../types";

export function FieldWithAI({ label, value, onChange, fieldName, placeholder, lang }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  fieldName: string;
  placeholder?: string;
  lang: Lang;
}) {
  const [improving, setImproving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleImprove = async () => {
    if (!value.trim()) return;
    setImproving(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an expert communications strategist. Improve the following input for a creative/project brief.
          Field: ${fieldName}
          Current value: ${value}

          Make it professional, clear, and concise. Respond ONLY with the improved text, nothing else. Respond in ${lang === 'no' ? 'Norwegian' : 'English'}.`
      });
      onChange(response.text?.trim() || value);
    } catch (e) {
      console.error(e);
    } finally {
      setImproving(false);
    }
  };

  return (
    <div className="space-y-space-2">
      <div className="flex justify-between items-center">
        <label className="font-body text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
        <button
          onClick={handleImprove}
          disabled={improving || !value.trim()}
          className="text-terracotta hover:text-terracotta/80 disabled:opacity-50 flex items-center gap-1 text-xs font-medium transition-colors"
        >
          {improving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          {lang === 'no' ? 'Forbedre med AI' : 'Improve with AI'}
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={1}
        className="w-full bg-background border border-border rounded-md p-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-terracotta resize-none overflow-hidden min-h-[40px]"
      />
    </div>
  );
}
