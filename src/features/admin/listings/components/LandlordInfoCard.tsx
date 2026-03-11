import Image from 'next/image';
import { FiUser, FiPhone, FiBriefcase, FiCheckCircle } from 'react-icons/fi';
import type { LandlordInfo } from '../types';

interface LandlordInfoCardProps {
  landlord: LandlordInfo;
}

export function LandlordInfoCard({ landlord }: LandlordInfoCardProps) {
  const isVerified = landlord.verified_at != null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Landlord / Agent
      </h3>

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100">
          {landlord.avatar_url ? (
            <Image
              src={landlord.avatar_url}
              alt={landlord.name}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FiUser className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">{landlord.name}</p>
            {isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                <FiCheckCircle className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>

          {landlord.business_name && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <FiBriefcase className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              {landlord.business_name}
            </div>
          )}

          {landlord.phone && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <FiPhone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              {landlord.phone}
            </div>
          )}

          {!isVerified && (
            <p className="text-xs text-amber-600">Identity not yet verified</p>
          )}
        </div>
      </div>
    </div>
  );
}
