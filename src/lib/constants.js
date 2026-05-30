export const ACTIVITY_TYPES = {
  restaurant: { label: 'Restaurant', emoji: '🍽️', pinColor: '#ea580c' },
  attraction: { label: 'Attraction', emoji: '🗼', pinColor: '#2563eb' },
  hotel:      { label: 'Hotel',      emoji: '🏨', pinColor: '#7c3aed' },
  transport:  { label: 'Transport',  emoji: '🚅', pinColor: '#16a34a' },
  other:      { label: 'Other',      emoji: '📌', pinColor: '#6b7280' },
}

export const TYPE_OPTIONS = Object.entries(ACTIVITY_TYPES).map(([value, meta]) => ({
  value,
  label: `${meta.emoji} ${meta.label}`,
}))
