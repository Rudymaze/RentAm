'use client';

import { useState, useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import type { LocationAccuracy } from '../types';

interface CoordinateDisplayProps {
  latitude: number | null;
  longitude: number | null;
  on_coordinates_change: (lat: number, lng: number) => void;
  is_editable: boolean;
}

const ACCURACY_CONFIG: Record<LocationAccuracy, { label: string; colorClass: string }> = {
  precise: { label: 'Precise', colorClass: 'text-green-600' },
  approximate: { label: 'Approximate', colorClass: 'text-yellow-600' },
  address_only: { label: 'Address only', colorClass: 'text-orange-500' },
};

function deriveAccuracy(lat: number | null, lng: number | null): LocationAccuracy {
  if (lat == null || lng == null) return 'address_only';
  const latDec = lat.toString().split('.')[1]?.length ?? 0;
  const lngDec = lng.toString().split('.')[1]?.length ?? 0;
  if (latDec >= 5 && lngDec >= 5) return 'precise';
  if (latDec >= 3 && lngDec >= 3) return 'approximate';
  return 'address_only';
}

type ValidationState = { valid: boolean; message: string } | null;

export function CoordinateDisplay({
  latitude,
  longitude,
  on_coordinates_change,
  is_editable,
}: CoordinateDisplayProps) {
  const [latInput, setLatInput] = useState(latitude != null ? String(latitude) : '');
  const [lngInput, setLngInput] = useState(longitude != null ? String(longitude) : '');
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationState>(null);

  // Sync inputs when props change from outside (e.g. map click)
  useEffect(() => {
    setLatInput(latitude != null ? String(latitude) : '');
    setLngInput(longitude != null ? String(longitude) : '');
    setValidation(null);
  }, [latitude, longitude]);

  function commitChange() {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!isNaN(lat) && !isNaN(lng)) {
      on_coordinates_change(lat, lng);
    }
  }

  async function handleValidate() {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (isNaN(lat) || isNaN(lng)) {
      setValidation({ valid: false, message: 'Please enter valid numbers first.' });
      return;
    }
    setValidating(true);
    setValidation(null);
    try {
      const res = await fetch('/api/properties/validate-coordinates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });
      const json = await res.json();
      if (json.success) {
        setValidation({ valid: true, message: json.data?.message ?? 'Coordinates are valid.' });
        on_coordinates_change(lat, lng);
      } else {
        setValidation({ valid: false, message: json.error ?? 'Validation failed.' });
      }
    } catch {
      setValidation({ valid: false, message: 'Validation request failed. Try again.' });
    } finally {
      setValidating(false);
    }
  }

  const accuracy = deriveAccuracy(latitude, longitude);
  const { label: accuracyLabel, colorClass } = ACCURACY_CONFIG[accuracy];

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-600">Coordinates</span>
        <span className={`text-xs font-medium ${colorClass}`}>{accuracyLabel}</span>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-0.5 block text-xs text-gray-500">Latitude</label>
          <input
            type="number"
            step="any"
            value={latInput}
            onChange={(e) => setLatInput(e.target.value)}
            onBlur={commitChange}
            readOnly={!is_editable}
            placeholder="e.g. 3.8480"
            className="w-full rounded border border-gray-300 px-2 py-1.5 font-mono text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 read-only:bg-gray-50"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-xs text-gray-500">Longitude</label>
          <input
            type="number"
            step="any"
            value={lngInput}
            onChange={(e) => setLngInput(e.target.value)}
            onBlur={commitChange}
            readOnly={!is_editable}
            placeholder="e.g. 11.5021"
            className="w-full rounded border border-gray-300 px-2 py-1.5 font-mono text-xs outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 read-only:bg-gray-50"
          />
        </div>
      </div>

      {/* Validate button (only when editable) */}
      {is_editable && (
        <button
          type="button"
          onClick={handleValidate}
          disabled={validating || !latInput || !lngInput}
          className="w-full rounded bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 disabled:opacity-50"
        >
          {validating ? 'Validating…' : 'Validate'}
        </button>
      )}

      {/* Validation result */}
      {validation && (
        <p
          className={`flex items-center gap-1.5 text-xs ${
            validation.valid ? 'text-green-600' : 'text-red-500'
          }`}
        >
          {validation.valid ? (
            <FiCheckCircle className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <FiAlertCircle className="h-3.5 w-3.5 shrink-0" />
          )}
          {validation.message}
        </p>
      )}
    </div>
  );
}
