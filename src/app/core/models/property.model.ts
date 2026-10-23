export type PropertyType =
  | 'APARTMENT'
  | 'VILLA'
  | 'INDEPENDENT_HOUSE'
  | 'PLOT'
  | 'COMMERCIAL'
  | 'SOCIETY'
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

export interface SellerContact {
  maskedPhone: string;
  telUrl: string;
  whatsappUrl: string;
}

export interface VerificationReport {
  checkedOn?: string | null;
  checks: { label: string; detail: string }[];
  areas: string[];
  note: string;
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
  latitude?: number | string | null;
  longitude?: number | string | null;
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
  reraNumber?: string | null;
  totalTowers?: number | null;
  totalUnits?: number | null;
  bhkConfigurations?: number[] | null;
  askingPrice: number | string;
  estimatedMinPrice?: number | string | null;
  estimatedMaxPrice?: number | string | null;
  trustScore?: number | null;
  listingStatus?: string;
  verificationStatus?: VerificationStatus;
  lastVerifiedAt?: string | null;
  seller?: PropertySeller | null;
  sellerContact?: SellerContact | null;
  media?: PropertyMedia[];
  verificationReport?: VerificationReport | null;
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
  SOCIETY: 'Society',
  OTHER: 'Other',
};
