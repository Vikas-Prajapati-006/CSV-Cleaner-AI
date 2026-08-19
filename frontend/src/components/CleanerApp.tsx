import React, { useState, useEffect } from 'react';
import { UploadCloud, FileSpreadsheet, X, ArrowRight, Loader2, Download, CheckCircle, Code2, AlertCircle, ShieldAlert, Sparkles, RotateCcw } from 'lucide-react';

const SUGGESTIONS = [
  "Drop duplicate rows",
  "Fill missing numbers with 0",
  "Trim text spaces and clean headers",
  "Remove empty rows across all columns"
];

// Security Limits
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_FREE_CREDITS = 3;

// Type-Safe Dynamic Base URL
const API_BASE_URL: string = 
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.PUBLIC_API_BASE_URL) 
    ? (import.meta as any).env.PUBLIC_API_BASE_URL 
    : 'http://127.0.0.1:8000';

// Lightweight device hardware + canvas fingerprint generator
const getDeviceFingerprint = (): string => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const txt = 'csv-cleaner-ai-fingerprint';
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = "14px 'Arial'";
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText(txt, 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText(txt, 4, 17);
    }
    const b64 = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < b64.length; i++) {
      const char = b64.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `${Math.abs(hash)}_${navigator.hardwareConcurrency || 2}_${screen.width}x${screen.height}`;
  } catch {
    return 'generic_client_id';
  }
};

interface CleanerAppProps {
  initialInstruction?: string;
}

export const CleanerApp: React.FC<CleanerAppProps> = ({ initialInstruction = '' }) => {
  const [file, setFile] = useState<File | null>(null);
  const [instruction, setInstruction] = useState(initialInstruction);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fingerprint, setFingerprint] = useState<string>('');
  
  // Track Free Usage Credits via localStorage
  const [usageCount, setUsageCount] = useState<number>(0);

  useEffect(() => {
    setFingerprint(getDeviceFingerprint());
    const savedUsage = localStorage.getItem('csv_cleaner_usage_count');
    if (savedUsage) {
      setUsageCount(parseInt(savedUsage, 10));
    }
  }, []);

  const isLimitReached = usageCount >= MAX_FREE_CREDITS;

  const resetDevCredits = () => {
    localStorage.removeItem('csv_cleaner_usage_count');
    setUsageCount(0);
    setError(null);
  };

  const validateAndSetFile = (selectedFile: File | undefined) => {
    if (isLimitReached) {
      setError("You have exhausted all 3 free cleaning credits on this device.");
      return;
    }

    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Only .csv files are supported.');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setError(`File size exceeds 25 MB (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB). Please upload a smaller file.`);
      return;
    }

    setError(null);
    setResult(null);
    setFile(selectedFile);
  };

  const handleClean = async () => {
    if (isLimitReached) {
      setError("You have reached your 3 free operations limit.");
      return;
    }

    if (!file || !instruction.trim()) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('instruction', instruction);
    formData.append('fingerprint', fingerprint);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/clean-csv`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          setUsageCount(MAX_FREE_CREDITS);
          localStorage.setItem('csv_cleaner_usage_count', MAX_FREE_CREDITS.toString());
        }
        throw new Error(errData.detail || 'Failed to clean dataset with backend sandbox.');
      }

      const data = await response.json();
      setResult(data);

      // Increment Usage Count on Success
      const newCount = usageCount + 1;
      setUsageCount(newCount);
      localStorage.setItem('csv_cleaner_usage_count', newCount.toString());

    } catch (err: any) {
      setError(err.message || 'Connection lost to execution backend.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* Usage Credit Indicator Banner */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-slate-800 bg-[#161b22] text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Free Demo Tier</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Credits Remaining:</span>
            <span className={`px-2 py-0.5 rounded font-bold ${
              isLimitReached 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {Math.max(0, MAX_FREE_CREDITS - usageCount)} / {MAX_FREE_CREDITS}
            </span>
          </div>

          {/* Dev Reset Helper Button for Localhost Testing */}
          <button
            onClick={resetDevCredits}
            title="Reset credits for local testing"
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors cursor-pointer border border-slate-700"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset (Dev)</span>
          </button>
        </div>
      </div>

      {/* Main Studio Card */}
      <div className="bg-[#161b22] border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
        
        {isLimitReached ? (
          /* Locked UI State */
          <div className="p-8 text-center border border-rose-500/20 rounded-lg bg-rose-500/5 space-y-3">
            <div className="h-12 w-12 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">Free Usage Limit Exhausted</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              You have completed all 3 free sandbox cleaning transformations. To prevent API quota abuse, additional requests from this device/IP are restricted.
            </p>
          </div>
        ) : (
          /* Active Upload Area */
          <>
            {!file ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  validateAndSetFile(e.dataTransfer.files?.[0]);
                }}
                onClick={() => document.getElementById('csv-input')?.click()}
                className={`border border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center gap-3 ${
                  isDragOver 
                    ? 'border-emerald-500 bg-emerald-500/5' 
                    : 'border-slate-700 hover:border-slate-600 bg-[#0d1117]'
                }`}
              >
                <input
                  id="csv-input"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => validateAndSetFile(e.target.files?.[0])}
                />
                <div className="h-10 w-10 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    Click to upload, or drag and drop your CSV
                  </p>
                  <p className="text-xs text-slate-400 mt-1">UTF-8 formatted CSV • Max 25 MB • Zero-Token streaming</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-700 bg-[#0d1117]">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200 font-mono">{file.name}</p>
                    <p className="text-[11px] text-slate-400">{(file.size / 1024).toFixed(1)} KB • Ready for transformation</p>
                  </div>
                </div>
                <button
                  onClick={() => { setFile(null); setResult(null); setError(null); }}
                  className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Cleaning Instructions */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Transformation Rules
              </label>
              <textarea
                rows={3}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Describe what to clean (e.g. 'Drop duplicate rows, impute null salaries with 0')"
                disabled={!file || isLoading}
                className="w-full rounded-lg border border-slate-700 bg-[#0d1117] p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-40 resize-none font-mono"
              />

              {/* Quick Filter Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTIONS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={!file || isLoading}
                    onClick={() => setInstruction(preset)}
                    className="text-[11px] px-2.5 py-1 rounded border border-slate-700 bg-[#0d1117] text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleClean}
              disabled={!file || !instruction.trim() || isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Running AST Sandbox Pipeline...</span>
                </>
              ) : (
                <>
                  <span>Execute Cleaning ({MAX_FREE_CREDITS - usageCount} credits left)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Output Grid Preview */}
      {result && (
        <div className="bg-[#161b22] border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs font-semibold text-white">Pipeline Execution Completed</span>
                <p className="text-[11px] text-slate-400 font-mono">
                  Rows: {result.rows_before} → {result.rows_after} | Columns: {result.columns_before} → {result.columns_after}
                </p>
              </div>
            </div>

            <a
              href={`${API_BASE_URL}${result.download_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-md bg-white text-slate-900 hover:bg-slate-200 text-xs font-semibold transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Download Clean CSV
            </a>
          </div>

          {/* Clean Spreadsheet Grid */}
          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-[#0d1117]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#161b22] text-slate-300 border-b border-slate-800">
                <tr>
                  {Object.keys(result.preview[0] || {}).map((col) => (
                    <th key={col} className="px-3.5 py-2 font-semibold text-slate-200">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {result.preview.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                    {Object.keys(row).map((col) => (
                      <td key={col} className="px-3.5 py-2 whitespace-nowrap">
                        {row[col] !== null && row[col] !== undefined ? (
                          String(row[col])
                        ) : (
                          <span className="text-slate-500 italic">null</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Code Inspection */}
          {result.generated_code && (
            <details className="text-xs font-mono group pt-2">
              <summary className="cursor-pointer text-slate-400 hover:text-slate-200 flex items-center gap-1.5 select-none">
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>View Generated Pandas Logic</span>
              </summary>
              <pre className="mt-2.5 p-3 rounded-lg bg-[#0d1117] border border-slate-800 text-emerald-400 overflow-x-auto text-[11px] leading-relaxed">
                {result.generated_code}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
};