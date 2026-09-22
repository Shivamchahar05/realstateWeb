export type PropertyType =
  | 'APARTMENT'
  | 'VILLA'
  | 'INDEPENDENT_HOUSE'
  | 'PLOT'
  | 'COMMERCIAL'
  | 'OTHER';

export type VerificationStatus = string;

export interface PropertyMedia {
  id: string;
  url: string;
  /** API field */
  type?: 'PHOTO' | 'VIDEO' | 'VIEW_360' | 'INSPECTION_PHOTO' | 'OTHER' | string;
  /** Legacy alias */
  mediaType?: string;
  caption?: string | null;
  sortOrder?: number;
}

export interface PropertySeller {
  id: string;
  fullName: string;
}

export interface PropertyHealthReport {
  id: string;
  overallScore?: number | null;
  summary?: string | null;
}

export interface PropertyDocument {
  id: string;
  category: string;
  title: string;
  status: string;
  version?: number;
}

export interface Property {
  id: string;
  propertyCode: string;
  title: string;
  description: string | null;
  propertyType: PropertyType;
  city: string;
  locality: string;
  address: string;
  state?: string;
  pincode?: string | null;
  bhk?: number | null;
  carpetAreaSqft?: number | null;
  builtUpAreaSqft?: number | null;
  floor?: number | null;
  totalFloors?: number | null;
  ageYears?: number | null;
  parkingSpaces?: number;
  furnishing?: string;
  readyToMove?: boolean;
  furnishingsInventory?: Array<{ key: string; qty: number }> | null;
  amenities?: string[] | null;
  nearbyPlaces?: Array<{ name: string; distance: string; category: string }> | null;
  askingPrice: number | string;
  estimatedMinPrice?: number | string | null;
  estimatedMaxPrice?: number | string | null;
  trustScore?: number | null;
  listingStatus?: string;
  verificationStatus?: VerificationStatus;
  lastVerifiedAt?: string | null;
  seller?: PropertySeller | null;
  media?: PropertyMedia[];
  healthReport?: PropertyHealthReport | null;
  documents?: PropertyDocument[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PropertyFilters {
  page?: number;
  limit?: number;
  city?: string;
  locality?: string;
  propertyType?: PropertyType | '';
  minPrice?: number | null;
  maxPrice?: number | null;
  search?: string;
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  APARTMENT: 'Apartment',
  VILLA: 'Villa',
  INDEPENDENT_HOUSE: 'Independent House',
  PLOT: 'Plot',
  COMMERCIAL: 'Commercial',
  OTHER: 'Other',
};
