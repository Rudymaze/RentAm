// Cameroon geographic bounds
const CAM_LAT_MIN = 1.67;
const CAM_LAT_MAX = 13.0;
const CAM_LON_MIN = 8.5;
const CAM_LON_MAX = 16.0;

export interface City {
  id: string;
  nameEn: string;
  nameFr: string;
  region: string;
  latitude: number;
  longitude: number;
  population: number | null;
  isActive: boolean;
  searchVector: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  getDisplayName(language: 'en' | 'fr'): string;
  isWithinCameroonBounds(): boolean;
}

export interface CityFavorite {
  id: string;
  userId: string;
  cityId: string;
  createdAt: Date;
}

export interface CitySearch {
  id: string;
  userId: string;
  cityId: string;
  searchedAt: Date;
}

export interface CityFormInput {
  nameEn: string;
  nameFr: string;
  region: string;
  latitude: number;
  longitude: number;
  population: number | null;
  isActive: boolean;
}

export function createCity(data: Omit<City, 'getDisplayName' | 'isWithinCameroonBounds'>): City {
  return {
    ...data,
    getDisplayName(language: 'en' | 'fr') {
      return language === 'fr' ? data.nameFr : data.nameEn;
    },
    isWithinCameroonBounds() {
      return (
        data.latitude >= CAM_LAT_MIN &&
        data.latitude <= CAM_LAT_MAX &&
        data.longitude >= CAM_LON_MIN &&
        data.longitude <= CAM_LON_MAX
      );
    },
  };
}
