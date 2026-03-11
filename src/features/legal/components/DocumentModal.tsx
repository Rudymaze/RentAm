'use client';

import { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import type { LegalDocument, Language } from '@/features/legal/types';
import { DocumentViewer } from './DocumentViewer';
import { LanguageToggle } from './LanguageToggle';

interface DocumentModalProps {
  legalDocument: LegalDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentModal({ legalDocument, isOpen, onClose }: DocumentModalProps) {
  const [language, setLanguage] = useState<Language>('en');

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      globalThis.document.body.style.overflow = 'hidden';
    } else {
      globalThis.document.body.style.overflow = '';
    }
    return () => {
      globalThis.document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || !legalDocument) return null;

  const titles: Record<string, string> = {
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            {titles[legalDocument.documentType] ?? 'Document'}{' '}
            <span className="text-xs font-normal text-gray-400">v{legalDocument.version}</span>
          </h2>
          <div className="flex items-center gap-3">
            <LanguageToggle language={language} onChange={setLanguage} />
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              aria-label="Close"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden p-6">
          <DocumentViewer document={legalDocument} language={language} />
        </div>
      </div>
    </div>
  );
}
