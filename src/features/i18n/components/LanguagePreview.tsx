'use client';

interface PreviewItem {
  label: string;
  en: string;
  fr: string;
}

interface LanguagePreviewProps {
  items: PreviewItem[];
  className?: string;
}

export function LanguagePreview({ items, className = '' }: LanguagePreviewProps) {
  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 ${className}`}>
      {/* Column headers */}
      <div className="grid grid-cols-3 border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <span>Label</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-indigo-400" />
          English
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-blue-400" />
          Français
        </span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-100">
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-3 px-4 py-3 text-sm hover:bg-gray-50">
            <span className="font-medium text-gray-500">{item.label}</span>
            <span className="text-gray-800">{item.en}</span>
            <span className="text-gray-800">{item.fr}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
