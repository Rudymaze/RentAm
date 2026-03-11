'use client';

import { FiCheckCircle } from 'react-icons/fi';

interface SuccessMessageProps {
  message: string | null | undefined;
}

export function SuccessMessage({ message }: SuccessMessageProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
    >
      <FiCheckCircle className="mt-0.5 shrink-0" size={16} />
      <span>{message}</span>
    </div>
  );
}
