import { FiMapPin, FiTag } from 'react-icons/fi';
import { MdBed, MdBathtub } from 'react-icons/md';
import type { ListingDetail } from '../types';

function formatPrice(listing: ListingDetail): string {
  const price =
    listing.listing_type === 'rent' ? listing.rental_price : listing.sale_price;
  if (!price) return 'Price on request';
  return `${price.toLocaleString('fr-CM')} FCFA${listing.listing_type === 'rent' ? '/month' : ''}`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</h3>
      {children}
    </div>
  );
}

interface ListingDetailSectionProps {
  listing: ListingDetail;
}

export function ListingDetailSection({ listing }: ListingDetailSectionProps) {
  return (
    <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-5">
      {/* Title & type */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">{listing.title}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              listing.listing_type === 'rent'
                ? 'bg-violet-50 text-violet-700'
                : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            <FiTag className="h-3 w-3" />
            {listing.listing_type === 'rent' ? 'For Rent' : 'For Sale'}
          </span>
          <span className="text-xs text-gray-500 capitalize">
            {listing.property_type.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Price */}
      <Section title="Pricing">
        <p className="text-xl font-bold text-indigo-600">{formatPrice(listing)}</p>
      </Section>

      {/* Location */}
      <Section title="Location">
        <div className="flex items-start gap-1.5 text-sm text-gray-700">
          <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
          <span>
            {listing.address ? `${listing.address}, ` : ''}{listing.city_name}
          </span>
        </div>
        {listing.latitude && listing.longitude && (
          <p className="mt-1 font-mono text-xs text-gray-400">
            {listing.latitude.toFixed(5)}, {listing.longitude.toFixed(5)}
          </p>
        )}
      </Section>

      {/* Specs */}
      {(listing.bedrooms != null || listing.bathrooms != null) && (
        <Section title="Specifications">
          <div className="flex gap-4">
            {listing.bedrooms != null && (
              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                <MdBed className="h-4 w-4 text-gray-400" />
                {listing.bedrooms} bedroom{listing.bedrooms !== 1 ? 's' : ''}
              </div>
            )}
            {listing.bathrooms != null && (
              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                <MdBathtub className="h-4 w-4 text-gray-400" />
                {listing.bathrooms} bathroom{listing.bathrooms !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Description */}
      {listing.description && (
        <Section title="Description">
          <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
            {listing.description}
          </p>
        </Section>
      )}

      {/* Amenities */}
      {listing.amenities.length > 0 && (
        <Section title="Amenities">
          <div className="flex flex-wrap gap-1.5">
            {listing.amenities.map((amenity) => (
              <span
                key={amenity}
                className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700"
              >
                {amenity.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
