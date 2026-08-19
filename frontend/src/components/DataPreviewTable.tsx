import React from 'react';
import { Download, CheckCircle2, Code2 } from 'lucide-react';

// Type-Safe Dynamic Base URL
const API_BASE_URL: string = 
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.PUBLIC_API_BASE_URL) 
    ? (import.meta as any).env.PUBLIC_API_BASE_URL 
    : 'http://127.0.0.1:8000';

interface DataPreviewTableProps {
  preview: Array<Record<string, any>>;
  rowsBefore: number;
  rowsAfter: number;
  columnsBefore: number;
  columnsAfter: number;
  generatedCode: string;
  downloadUrl: string;
}

export const DataPreviewTable: React.FC<DataPreviewTableProps> = ({
  preview,
  rowsBefore,
  rowsAfter,
  columnsBefore,
  columnsAfter,
  generatedCode,
  downloadUrl,
}) => {
  if (!preview || preview.length === 0) return null;

  const columns = Object.keys(preview[0]);

  return (
    <div className="w-full flex flex-col gap-6 mt-8 p-6 rounded-2xl border border-slate-800 bg-slate-900/60">
      {/* Stats Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Cleaning Complete
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Rows: <span className="text-slate-200 font-semibold">{rowsBefore} → {rowsAfter}</span> | Columns: <span className="text-slate-200 font-semibold">{columnsBefore} → {columnsAfter}</span>
          </p>
        </div>

        <a
          href={`${API_BASE_URL}${downloadUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-500/20"
        >
          <Download className="w-4 h-4" />
          Download Cleaned CSV
        </a>
      </div>

      {/* Table Preview */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-3 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900/40">
            {preview.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-800/40 transition-colors">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-3 whitespace-nowrap">
                    {row[col] !== null && row[col] !== undefined ? String(row[col]) : 'null'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Generated Code Toggle */}
      {generatedCode && (
        <details className="text-xs group border border-slate-800 rounded-xl p-3 bg-slate-950/50">
          <summary className="cursor-pointer font-semibold text-slate-400 group-open:text-emerald-400 flex items-center gap-2">
            <Code2 className="w-4 h-4" />
            View Generated Pandas Code
          </summary>
          <pre className="mt-3 p-4 rounded-lg bg-slate-900 border border-slate-800 text-emerald-300 overflow-x-auto font-mono">
            {generatedCode}
          </pre>
        </details>
      )}
    </div>
  );
};