'use client';

import { FiCheckSquare, FiSquare } from 'react-icons/fi';
import type { DocumentType } from '@/features/legal/types';

const LABELS: Record<DocumentType, string> = {
  terms: 'I accept the Terms of Service',
  privacy: 'I accept the Privacy Policy',
};

interface AcceptanceCheckboxProps {
  documentType: DocumentType;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function AcceptanceCheckbox({
  documentType,
  checked,
  onChange,
  disabled = false,
}: AcceptanceCheckboxProps) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-all ${
        checked
          ? 'border-indigo-400 bg-indigo-50'
          : 'border-gray-200 bg-white'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-300'}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      {checked ? (
        <FiCheckSquare size={20} className="shrink-0 text-indigo-600" />
      ) : (
        <FiSquare size={20} className="shrink-0 text-gray-400" />
      )}
      <span className={`text-sm font-medium ${checked ? 'text-indigo-700' : 'text-gray-700'}`}>
        {LABELS[documentType]}
      </span>
    </label>
  );
}
