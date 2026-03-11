'use client';

import { useState } from 'react';
import { ProfileFormField } from '@/features/profile/components/ProfileFormField';
import { AvatarUploader } from '@/features/profile/components/AvatarUploader';
import { validateFullName, validatePhoneNumber } from '@/features/profile/utils/validation';
import type { Profile } from '@/features/profile/types';
import { updateProfile } from './actions';

interface ProfileEditFormProps {
  initialProfile: Profile;
  onSaveSuccess: () => void;
}

export default function ProfileEditForm({ initialProfile, onSaveSuccess }: ProfileEditFormProps) {
  const [fullName, setFullName] = useState(initialProfile.full_name ?? '');
  const [phoneNumber, setPhoneNumber] = useState(initialProfile.phone_number ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url ?? null);
  const [errors, setErrors] = useState<{ full_name?: string; phone_number?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const hasChanges =
    fullName !== (initialProfile.full_name ?? '') ||
    phoneNumber !== (initialProfile.phone_number ?? '');

  function validate(): boolean {
    const newErrors: typeof errors = {};
    const nameResult = validateFullName(fullName);
    if (!nameResult.valid) newErrors.full_name = nameResult.error;
    const phoneResult = validatePhoneNumber(phoneNumber);
    if (!phoneResult.valid) newErrors.phone_number = phoneResult.error;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    setToast(null);
    try {
      const result = await updateProfile({ full_name: fullName, phone_number: phoneNumber });
      if (result.success) {
        setToast({ type: 'success', message: 'Profile updated successfully!' });
        onSaveSuccess();
      } else {
        setToast({ type: 'error', message: result.error ?? 'Failed to update profile.' });
      }
    } catch {
      setToast({ type: 'error', message: 'An unexpected error occurred.' });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AvatarUploader
        currentAvatarUrl={avatarUrl}
        onAvatarChange={setAvatarUrl}
        isLoading={isSaving}
      />

      <ProfileFormField
        label="Full Name"
        value={fullName}
        onChange={setFullName}
        error={errors.full_name}
        maxLength={100}
        placeholder="Your full name"
      />

      <ProfileFormField
        label="Phone Number"
        value={phoneNumber}
        onChange={setPhoneNumber}
        error={errors.phone_number}
        placeholder="+237612345678"
      />

      {toast && (
        <p
          className={`text-sm font-medium ${
            toast.type === 'success' ? 'text-green-600' : 'text-red-500'
          }`}
        >
          {toast.message}
        </p>
      )}

      <button
        type="submit"
        disabled={!hasChanges || isSaving}
        className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
