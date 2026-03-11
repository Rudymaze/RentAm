'use client';

import { useState, useEffect } from 'react';
import { FiClock, FiAlertTriangle } from 'react-icons/fi';

interface ExpirationCountdownProps {
  listing_expiration_date: Date | string | null;
}

function getDaysRemaining(expirationDate: Date | string): number {
  const exp = new Date(expirationDate);
  const now = new Date();
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function ExpirationCountdown({ listing_expiration_date }: ExpirationCountdownProps) {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    if (!listing_expiration_date) return;
    setDays(getDaysRemaining(listing_expiration_date));
  }, [listing_expiration_date]);

  if (!listing_expiration_date) return null;
  if (days === null) return <span className="inline-block h-4 w-24 animate-pulse rounded bg-gray-200" />;

  const isExpired = days <= 0;
  const absDays = Math.abs(days);

  let colorClass: string;
  let Icon: typeof FiClock;

  if (isExpired) {
    colorClass = 'text-red-600';
    Icon = FiAlertTriangle;
  } else if (days < 7) {
    colorClass = 'text-red-500';
    Icon = FiAlertTriangle;
  } else if (days <= 14) {
    colorClass = 'text-amber-500';
    Icon = FiClock;
  } else {
    colorClass = 'text-green-600';
    Icon = FiClock;
  }

  const label = isExpired
    ? `Expired ${absDays} day${absDays !== 1 ? 's' : ''} ago`
    : `Expires in ${days} day${days !== 1 ? 's' : ''}`;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${colorClass}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </span>
  );
}
