
export const QUOTE_CATEGORIES = [
  { value: 'motivation', label: 'Motivation' },
  { value: 'love', label: 'Love' },
  { value: 'success', label: 'Success' },
  { value: 'wisdom', label: 'Wisdom' },
  { value: 'humor', label: 'Humor' },
] as const;

export const ACCENT_COLORS = [
  { value: 'blue', label: 'Blue' },
  { value: 'purple', label: 'Purple' },
  { value: 'green', label: 'Green' },
  { value: 'orange', label: 'Orange' },
  { value: 'red', label: 'Red' },
] as const;

export const FONT_SIZES = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
] as const;

export const THEME_PREFERENCES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const;

// Pagination
export const QUOTES_PER_PAGE = 20;
export const INFINITE_SCROLL_THRESHOLD = 0.8; // Load more when 80% scrolled

// Quote of the Day
export const QUOTE_OF_DAY_CACHE_KEY = 'quote-of-day';

// React Query cache keys
export const QUERY_KEYS = {
  quotes: {
    all: ['quotes'] as const,
    lists: () => [...QUERY_KEYS.quotes.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...QUERY_KEYS.quotes.lists(), filters] as const,
    detail: (id: string) => [...QUERY_KEYS.quotes.all, 'detail', id] as const,
    search: (query: string) => [...QUERY_KEYS.quotes.all, 'search', query] as const,
    category: (category: string) => [...QUERY_KEYS.quotes.all, 'category', category] as const,
    daily: () => [...QUERY_KEYS.quotes.all, 'daily'] as const,
  },
  favorites: {
    all: ['favorites'] as const,
    lists: () => [...QUERY_KEYS.favorites.all, 'list'] as const,
    detail: (quoteId: string) => [...QUERY_KEYS.favorites.all, 'detail', quoteId] as const,
  },
  collections: {
    all: ['collections'] as const,
    lists: () => [...QUERY_KEYS.collections.all, 'list'] as const,
    detail: (id: string) => [...QUERY_KEYS.collections.all, 'detail', id] as const,
    quotes: (id: string) => [...QUERY_KEYS.collections.all, 'quotes', id] as const,
  },
  profile: {
    all: ['profile'] as const,
    current: () => [...QUERY_KEYS.profile.all, 'current'] as const,
  },
} as const;

// Routes
export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  resetPassword: '/reset-password',
  profile: '/profile',
  favorites: '/favorites',
  collections: '/collections',
  collection: (id: string) => `/collections/${id}`,
  quote: (id: string) => `/quotes/${id}`,
} as const;

// Storage bucket names (Supabase)
export const STORAGE_BUCKETS = {
  avatars: 'avatars',
} as const;

