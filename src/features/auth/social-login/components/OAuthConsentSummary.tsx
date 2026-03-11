'use client';

import Image from 'next/image';

interface OAuthConsentSummaryProps {
  profilePicture: string;
  fullName: string;
  email: string;
}

export function OAuthConsentSummary({ profilePicture, fullName, email }: OAuthConsentSummaryProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm text-center">
      <div className="relative h-12 w-12 overflow-hidden rounded-full border border-gray-200">
        <Image
          src={profilePicture}
          alt={fullName}
          fill
          className="object-cover"
          sizes="48px"
        />
      </div>
      <div className="space-y-0.5">
        <p className="text-base font-semibold text-gray-900">{fullName}</p>
        <p className="text-sm text-gray-500">{email}</p>
      </div>
      <p className="text-sm text-gray-600 max-w-xs">
        We&apos;ll use your Google account to sign in. Your email, name, and profile picture will be
        saved.
      </p>
    </div>
  );
}
