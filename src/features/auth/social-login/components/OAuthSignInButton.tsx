'use client';

import { FcGoogle } from 'react-icons/fc';
import { FiLoader } from 'react-icons/fi';

interface OAuthSignInButtonProps {
  isLoading: boolean;
  onClick: () => void;
}

export function OAuthSignInButton({ isLoading, onClick }: OAuthSignInButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <FiLoader size={18} className="animate-spin text-gray-500" />
      ) : (
        <FcGoogle size={20} />
      )}
      {isLoading ? 'Redirecting…' : 'Sign in with Google'}
    </button>
  );
}
