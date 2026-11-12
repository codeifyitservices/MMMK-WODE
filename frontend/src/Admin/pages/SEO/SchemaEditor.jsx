import React, { useMemo } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, RotateCcw } from 'lucide-react';

export default function SchemaEditor({
  value,
  onChange,
  onGenerate,
  onReset,
  isLoading = false,
  autoSchemaAvailable = false,
  placeholder,
  rows = 10,
  label,
}) {
  const validation = useMemo(() => {
    if (!value || !value.trim()) {
      return { valid: true, error: null };
    }
    try {
      JSON.parse(value);
      return { valid: true, error: null };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }, [value]);

  const handleFormat = () => {
    if (!value || !value.trim()) return;
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
    } catch (_) {}
  };

  return (
    <div className="space-y-2">
      {(label || onGenerate || onReset) && (
        <div className="flex items-center justify-between gap-2 pb-1">
          {label && (
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {label}
            </span>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {onGenerate && (
              <button
                type="button"
                onClick={onGenerate}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-black px-3 py-1.5 text-xs font-medium text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                Generate Schema
              </button>
            )}
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                disabled={isLoading || !autoSchemaAvailable}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition disabled:opacity-40 cursor-pointer"
              >
                <RotateCcw size={12} />
                Reset to Auto
              </button>
            )}
          </div>
        </div>
      )}

      <div className="relative">
        <textarea
          rows={rows}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '{\n  "@context": "https://schema.org",\n  ...\n}'}
          className={`w-full font-mono text-xs p-3 rounded-lg border bg-gray-50 focus:bg-white transition-all outline-none leading-relaxed ${
            validation.valid
              ? 'border-gray-200 focus:border-[#dfba73] focus:ring-1 focus:ring-[#dfba73]'
              : 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
          }`}
          spellCheck={false}
        />

        {value && validation.valid && (
          <button
            type="button"
            onClick={handleFormat}
            className="absolute top-2.5 right-3 text-[11px] bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-2 py-0.5 rounded shadow-xs"
          >
            Prettify JSON
          </button>
        )}
      </div>

      {value && !validation.valid && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
          <AlertCircle size={14} className="shrink-0" />
          <span>Invalid JSON-LD Syntax: {validation.error}</span>
        </div>
      )}

      {value && validation.valid && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50/50 p-1.5 rounded">
          <CheckCircle2 size={13} className="shrink-0" />
          <span>Valid JSON-LD schema ready for search engine indexers.</span>
        </div>
      )}
    </div>
  );
}
