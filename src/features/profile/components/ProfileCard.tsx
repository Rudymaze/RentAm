import Image from 'next/image';
import { FiUser, FiMail, FiPhone, FiMapPin, FiHome, FiBriefcase } from 'react-icons/fi';
import type { Profile } from '../types';

interface ProfileCardProps {
  profile: Profile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
      {/* Avatar + Name */}
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name ?? 'Avatar'}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FiUser className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">
            {profile.full_name ?? 'No name set'}
          </h2>
          {profile.role && (
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium capitalize text-indigo-700">
              {profile.role}
            </span>
          )}
        </div>
      </div>

      {/* Contact info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FiMail className="h-4 w-4 shrink-0 text-gray-400" />
          <span>{profile.email ?? 'No email'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FiPhone className="h-4 w-4 shrink-0 text-gray-400" />
          <span>{profile.phone_number ?? 'Not provided'}</span>
        </div>
      </div>

      {/* Tenant-specific section */}
      {profile.role === 'tenant' && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          {profile.preferred_cities && profile.preferred_cities.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                <FiMapPin className="h-3 w-3" /> Preferred Cities
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {profile.preferred_cities.map((city) => (
                  <span
                    key={city}
                    className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700"
                  >
                    {city}
                  </span>
                ))}
              </div>
            </div>
          )}
          {profile.preferred_property_types && profile.preferred_property_types.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                <FiHome className="h-3 w-3" /> Property Types
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {profile.preferred_property_types.map((type) => (
                  <span
                    key={type}
                    className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Landlord-specific section */}
      {profile.role === 'landlord' && (
        <div className="border-t border-gray-100 pt-4 space-y-2">
          {profile.business_name && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiBriefcase className="h-4 w-4 shrink-0 text-gray-400" />
              <span>{profile.business_name}</span>
            </div>
          )}
          {profile.phone_number && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiPhone className="h-4 w-4 shrink-0 text-gray-400" />
              <span>{profile.phone_number}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
