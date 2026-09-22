export const PROPERTY_TYPES = [
  'APARTMENT',
  'VILLA',
  'INDEPENDENT_HOUSE',
  'PLOT',
  'COMMERCIAL',
  'OTHER',
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const FURNISHING_STATUSES = [
  'UNFURNISHED',
  'SEMI_FURNISHED',
  'FULLY_FURNISHED',
] as const;

export type FurnishingStatus = (typeof FURNISHING_STATUSES)[number];

export const LISTING_STATUSES = [
  'DRAFT',
  'PENDING_VERIFICATION',
  'LIVE',
  'REJECTED',
  'ARCHIVED',
] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const VERIFICATION_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'DOCUMENT_COLLECTION',
  'AI_ANALYSIS',
  'LEGAL_REVIEW',
  'GOVERNMENT_CHECK',
  'PHYSICAL_INSPECTION',
  'VALUATION',
  'RISK_ASSESSMENT',
  'FINAL_REVIEW',
  'VERIFIED',
  'REVIEW_REQUIRED',
  'REJECTED',
] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const DOCUMENT_CATEGORIES = [
  'OWNERSHIP',
  'SALE_DEED',
  'PREVIOUS_SALE_DEED',
  'TAX',
  'ENCUMBRANCE',
  'MUTATION',
  'APPROVALS',
  'RERA',
  'LOAN_MORTGAGE',
  'SOCIETY',
  'UTILITY',
  'OTHER',
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export interface PropertyDocument {
  id: string;
  propertyId: string;
  category: DocumentCategory;
  title: string;
  notes: string | null;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize?: number;
  fileSizeBytes?: number;
  version?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationHistoryEntry {
  id: string;
  propertyId: string;
  fromStatus: VerificationStatus | null;
  toStatus: VerificationStatus;
  notes: string | null;
  createdAt: string;
  actor?: {
    id: string;
    fullName: string;
    role: string;
  };
}

export interface PropertyMedia {
  id: string;
  propertyId: string;
  type: 'PHOTO' | 'VIDEO' | 'VIEW_360' | 'INSPECTION_PHOTO' | 'OTHER';
  url: string;
  caption: string | null;
  sortOrder: number;
  createdAt?: string;
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
  state: string;
  pincode: string | null;
  bhk: number | null;
  carpetAreaSqft: number | null;
  builtUpAreaSqft: number | null;
  floor: number | null;
  totalFloors: number | null;
  ageYears: number | null;
  parkingSpaces: number | null;
  furnishing: FurnishingStatus | null;
  readyToMove: boolean | null;
  furnishingsInventory?: Array<{ key: string; qty: number }> | null;
  amenities?: string[] | null;
  nearbyPlaces?: Array<{ name: string; distance: string; category: string }> | null;
  askingPrice: number;
  estimatedMinPrice: number | null;
  estimatedMaxPrice: number | null;
  listingStatus: ListingStatus;
  verificationStatus: VerificationStatus;
  rejectionReason: string | null;
  trustScore: number | null;
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  documents?: PropertyDocument[];
  verificationHistory?: VerificationHistoryEntry[];
  media?: PropertyMedia[];
}

export interface CreatePropertyRequest {
  title: string;
  description?: string;
  propertyType: PropertyType;
  city: string;
  locality: string;
  address: string;
  state?: string;
  pincode?: string;
  bhk?: number;
  carpetAreaSqft?: number;
  builtUpAreaSqft?: number;
  floor?: number;
  totalFloors?: number;
  ageYears?: number;
  parkingSpaces?: number;
  furnishing?: FurnishingStatus;
  readyToMove?: boolean;
  askingPrice: number;
  estimatedMinPrice?: number;
  estimatedMaxPrice?: number;
}

export type UpdatePropertyRequest = Partial<CreatePropertyRequest>;

export interface PropertyListParams {
  page?: number;
  limit?: number;
  search?: string;
}
