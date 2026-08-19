import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface PromptInputProps {
  instruction: string;
  setInstruction: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  disabled: boolean;
}

const QUICK_CHIPS = [
  "Remove duplicate rows",
  "Fill missing numeric values with 0",
  "Trim whitespace from all text columns",
  "Drop rows with empty values",
];

export const PromptInput: React.FC<PromptInputProps> = ({
  instruction,
  setInstruction,
  onSubmit,
  isLoading,
  disabled,
}) => {
  return (
    <div className="w-full flex flex-col gap-3">
      <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-emerald-400" />
        Describe what to clean:
      </label>

      <div className="relative">
        <textarea
          rows={3}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="e.g., Drop duplicate rows, fill missing salaries with mean, and convert dates to YYYY-MM-DD"
          disabled={disabled || isLoading}
          className="w-full rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 resize-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled || isLoading}
            onClick={() => setInstruction(chip)}
            className="text-xs px-3 py-1.5 rounded-full border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-emerald-400 hover:border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={disabled || !instruction.trim() || isLoading}
        onClick={onSubmit}
        className="mt-2 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Transforming Data with AI...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Clean CSV Now
          </>
        )}
      </button>
    </div>
  );
};