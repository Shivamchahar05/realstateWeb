import { environment } from '../../environments/environment';
import type { Property, PropertyMedia, PropertyType } from '../core/models/property.model';

export const PROPERTY_TYPE_FALLBACK_IMAGES: Record<PropertyType, string> = {
  APARTMENT:
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80',
  VILLA:
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=900&q=80',
  INDEPENDENT_HOUSE:
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80',
  PLOT:
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80',
  COMMERCIAL:
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80',
  OTHER:
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
};

export function mediaAbsoluteUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = environment.assetsUrl.replace(/\/$/, '');
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}

function mediaKind(item: PropertyMedia): string {
  return (item.type || item.mediaType || '').toUpperCase();
}

export function isPhotoMedia(item: PropertyMedia): boolean {
  const kind = mediaKind(item);
  if (kind === 'VIDEO') return false;
  if (kind === 'PHOTO' || kind === 'INSPECTION_PHOTO' || kind === 'VIEW_360' || kind === 'OTHER') {
    return true;
  }
  return /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(item.url);
}

export function propertyCoverImage(property: Property): string {
  const media = [...(property.media ?? [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  const photo = media.find((m) => m.url && isPhotoMedia(m));
  if (photo?.url) {
    return mediaAbsoluteUrl(photo.url);
  }
  return (
    PROPERTY_TYPE_FALLBACK_IMAGES[property.propertyType] ??
    PROPERTY_TYPE_FALLBACK_IMAGES['OTHER']
  );
}
