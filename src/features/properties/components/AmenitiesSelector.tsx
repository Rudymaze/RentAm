'use client';

const AMENITIES = [
  { key: 'wifi', label: 'WiFi' },
  { key: 'parking', label: 'Parking' },
  { key: 'garden', label: 'Garden' },
  { key: 'pool', label: 'Pool' },
  { key: 'security', label: 'Security' },
  { key: 'furnished', label: 'Furnished' },
  { key: 'air_conditioning', label: 'Air Conditioning' },
  { key: 'heating', label: 'Heating' },
  { key: 'laundry', label: 'Laundry' },
  { key: 'gym', label: 'Gym' },
  { key: 'balcony', label: 'Balcony' },
  { key: 'kitchen', label: 'Kitchen' },
];

interface AmenitiesSelectorProps {
  selectedAmenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
}

export function AmenitiesSelector({ selectedAmenities, onAmenitiesChange }: AmenitiesSelectorProps) {
  function toggle(key: string) {
    if (selectedAmenities.includes(key)) {
      onAmenitiesChange(selectedAmenities.filter((a) => a !== key));
    } else {
      onAmenitiesChange([...selectedAmenities, key]);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        {selectedAmenities.length > 0
          ? `${selectedAmenities.length} amenit${selectedAmenities.length === 1 ? 'y' : 'ies'} selected`
          : 'No amenities selected'}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {AMENITIES.map(({ key, label }) => {
          const checked = selectedAmenities.includes(key);
          return (
            <label
              key={key}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                checked
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(key)}
                className="h-4 w-4 rounded accent-indigo-600"
              />
              {label}
            </label>
          );
        })}
      </div>
    </div>
  );
}
