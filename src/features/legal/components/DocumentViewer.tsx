'use client';

import { useRef, useEffect } from 'react';
import type { LegalDocument, Language } from '@/features/legal/types';

interface DocumentViewerProps {
  document: LegalDocument;
  language: Language;
}

function renderContent(content: string) {
  const lines = content.split('\n');
  return lines.map((line, i) => {
    // Section header: line starting with # or all-caps short line
    if (line.startsWith('# ')) {
      return (
        <h2 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-2">
          {line.replace(/^# /, '')}
        </h2>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h3 key={i} className="text-base font-semibold text-gray-800 mt-4 mb-1">
          {line.replace(/^## /, '')}
        </h3>
      );
    }
    // Numbered clause
    if (/^\d+\.\s/.test(line)) {
      return (
        <p key={i} className="text-sm text-gray-700 font-medium mt-3">
          {line}
        </p>
      );
    }
    // Empty line
    if (line.trim() === '') {
      return <div key={i} className="h-2" />;
    }
    return (
      <p key={i} className="text-sm text-gray-600 leading-relaxed">
        {line}
      </p>
    );
  });
}

export function DocumentViewer({ document, language }: DocumentViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLanguage = useRef(language);

  // Maintain scroll position when switching languages
  useEffect(() => {
    if (prevLanguage.current !== language) {
      prevLanguage.current = language;
      // do not reset scroll
    }
  }, [language]);

  const content = document.getContent(language);

  return (
    <div
      ref={scrollRef}
      className="h-96 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 px-6 py-5 space-y-1 scroll-smooth"
    >
      {renderContent(content)}
    </div>
  );
}
