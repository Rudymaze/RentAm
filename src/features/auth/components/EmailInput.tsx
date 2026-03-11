'use client';

import { useState } from 'react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  autoComplete?: string;
}

export function EmailInput({
  id = 'email',
  name = 'email',
  value,
  onChange,
  placeholder = 'you@example.com',
  label = 'Email address',
  required = false,
  autoComplete = 'email',
}: EmailInputProps) {
  const [touched, setTouched] = useState(false);
  const isInvalid = touched && value.length > 0 && !EMAIL_REGEX.test(value);

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={id}
        name={name}
        type="email"
        value={value}
        onChange={onChange}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 ${
          isInvalid
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
        }`}
      />
      {isInvalid && (
        <p className="text-xs text-red-500">Please enter a valid email address.</p>
      )}
    </div>
  );
}
