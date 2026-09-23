export type PropertyRequestStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'VISIT_SCHEDULED'
  | 'VISITED'
  | 'READY_TO_BUY'
  | 'TOKEN_ACCEPTED'
  | 'DEAL_CLOSED'
  | 'CANCELLED';

export const PROPERTY_REQUEST_FLOW: PropertyRequestStatus[] = [
  'NEW',
  'CONTACTED',
  'VISIT_SCHEDULED',
  'VISITED',
  'READY_TO_BUY',
  'TOKEN_ACCEPTED',
  'DEAL_CLOSED',
];

export const PROPERTY_REQUEST_STATUS_LABELS: Record<PropertyRequestStatus, string> = {
  NEW: 'Request submitted',
  CONTACTED: 'Buyer contacted',
  VISIT_SCHEDULED: 'Visit scheduled',
  VISITED: 'Visit completed',
  READY_TO_BUY: 'Ready to buy',
  TOKEN_ACCEPTED: 'Token accepted',
  DEAL_CLOSED: 'Deal closed',
  CANCELLED: 'Cancelled',
};

export function propertyRequestStatusLabel(status: string): string {
  if (status === 'CLOSED') return PROPERTY_REQUEST_STATUS_LABELS.CANCELLED;
  return PROPERTY_REQUEST_STATUS_LABELS[status as PropertyRequestStatus] ?? status;
}

export function nextPropertyRequestStatus(status: string): PropertyRequestStatus | null {
  const current = status === 'CLOSED' ? 'CANCELLED' : status;
  if (current === 'DEAL_CLOSED' || current === 'CANCELLED') return null;
  const idx = PROPERTY_REQUEST_FLOW.indexOf(current as PropertyRequestStatus);
  if (idx < 0 || idx >= PROPERTY_REQUEST_FLOW.length - 1) return null;
  return PROPERTY_REQUEST_FLOW[idx + 1]!;
}

export interface PropertyRequestProperty {
  id: string;
  propertyCode: string;
  title: string;
  city: string;
  locality: string;
  askingPrice: string | number;
  listingStatus?: string;
  sellerId?: string;
}

export interface PropertyRequestBuyer {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
}

export interface PropertyRequest {
  id: string;
  propertyId: string;
  buyerId?: string;
  message?: string | null;
  status: PropertyRequestStatus | string;
  createdAt: string;
  updatedAt: string;
  label?: string;
  property?: PropertyRequestProperty;
  buyer?: PropertyRequestBuyer;
}
