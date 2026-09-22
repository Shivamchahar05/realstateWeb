export const FURNISHING_ITEMS = [
  { key: 'FANS', label: 'Fans' },
  { key: 'EXHAUST_FANS', label: 'Exhaust Fans' },
  { key: 'GEYSERS', label: 'Geysers' },
  { key: 'STOVE', label: 'Stove' },
  { key: 'LIGHTS', label: 'Lights' },
  { key: 'CURTAINS', label: 'Curtains' },
  { key: 'MODULAR_KITCHEN', label: 'Modular Kitchen' },
  { key: 'CHIMNEY', label: 'Chimney' },
  { key: 'WARDROBES', label: 'Wardrobes' },
  { key: 'AC_SPLIT', label: 'Split ACs' },
  { key: 'AC_WINDOW', label: 'Window ACs' },
  { key: 'SOFA', label: 'Sofa' },
  { key: 'DINING_TABLE', label: 'Dining Table' },
  { key: 'BEDS', label: 'Beds' },
  { key: 'WATER_PURIFIER', label: 'Water Purifier' },
  { key: 'WASHING_MACHINE', label: 'Washing Machine' },
  { key: 'REFRIGERATOR', label: 'Refrigerator' },
  { key: 'MICROWAVE', label: 'Microwave' },
  { key: 'TV', label: 'TV' },
  { key: 'SMART_LOCK', label: 'Smart Lock / Access' },
] as const;

export const AMENITY_CATEGORIES = [
  { key: 'ALL', label: 'All' },
  { key: 'SPORTS', label: 'Sports' },
  { key: 'SAFETY', label: 'Safety' },
  { key: 'ENVIRONMENT', label: 'Environment' },
  { key: 'CONVENIENCE', label: 'Convenience' },
  { key: 'PROPERTY', label: 'Property' },
] as const;

export const AMENITIES = [
  { key: 'GYMNASIUM', label: 'Gymnasium', category: 'SPORTS' },
  { key: 'SWIMMING_POOL', label: 'Swimming Pool', category: 'SPORTS' },
  { key: 'KIDS_PLAY_AREA', label: "Kids' Play Area", category: 'SPORTS' },
  { key: 'YOGA_AREA', label: 'Yoga Area', category: 'SPORTS' },
  { key: 'JOGGING_TRACK', label: 'Jogging / Cycle Track', category: 'SPORTS' },
  { key: 'CLUBHOUSE', label: 'Clubhouse', category: 'CONVENIENCE' },
  { key: 'SECURITY_24X7', label: '24 x 7 Security', category: 'SAFETY' },
  { key: 'POWER_BACKUP', label: 'Power Backup', category: 'CONVENIENCE' },
  { key: 'WATER_SUPPLY_24X7', label: '24 x 7 Water Supply', category: 'CONVENIENCE' },
  { key: 'CCTV', label: 'CCTV Surveillance', category: 'SAFETY' },
  { key: 'FIRE_SAFETY', label: 'Fire Safety', category: 'SAFETY' },
  { key: 'LARGE_GREEN_AREA', label: 'Large Green Area', category: 'ENVIRONMENT' },
  { key: 'PARK', label: 'Park', category: 'ENVIRONMENT' },
  { key: 'ATTACHED_MARKET', label: 'Attached Market', category: 'CONVENIENCE' },
  { key: 'VISITOR_PARKING', label: 'Visitor Parking', category: 'PROPERTY' },
  { key: 'LIFT', label: 'Lift', category: 'PROPERTY' },
  { key: 'INTERCOM', label: 'Intercom', category: 'PROPERTY' },
  { key: 'RAINWATER_HARVESTING', label: 'Rain Water Harvesting', category: 'ENVIRONMENT' },
  { key: 'SEWAGE_TREATMENT', label: 'Sewage Treatment', category: 'ENVIRONMENT' },
  { key: 'MAINTENANCE_STAFF', label: 'Maintenance Staff', category: 'CONVENIENCE' },
] as const;

export const NEARBY_CATEGORIES = [
  { key: 'METRO', label: 'Metro' },
  { key: 'SCHOOL', label: 'School' },
  { key: 'HOSPITAL', label: 'Hospital' },
  { key: 'MARKET', label: 'Market' },
  { key: 'HIGHWAY', label: 'Highway' },
  { key: 'OTHER', label: 'Other' },
] as const;

export function furnishingLabel(key: string): string {
  return FURNISHING_ITEMS.find((i) => i.key === key)?.label ?? key.replaceAll('_', ' ');
}

export function amenityMeta(key: string) {
  return AMENITIES.find((a) => a.key === key) ?? null;
}

export function nearbyCategoryLabel(key: string): string {
  return NEARBY_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}
