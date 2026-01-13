

export type Quote = {
  id: string;
  text: string;
  author: string;
  category: 'motivation' | 'love' | 'success' | 'wisdom' | 'humor';
  source: string | null;
  created_at: string;
  updated_at: string;
  user_id?: string; 
};

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  theme_preference: 'light' | 'dark' | 'system';
  accent_color: 'blue' | 'purple' | 'green' | 'orange' | 'red';
  font_size: 'small' | 'medium' | 'large';
  notification_time: string | null;
  created_at: string;
  updated_at: string;
};

export type Favorite = {
  id: string;
  user_id: string;
  quote_id: string;
  created_at: string;
  quote?: Quote; // Joined data
};

export type Collection = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  quote_count?: number; // Computed field
};

export type CollectionQuote = {
  id: string;
  collection_id: string;
  quote_id: string;
  created_at: string;
  quote?: Quote; // Joined data
};

export type QuoteCategory = Quote['category'];

export type ThemePreference = Profile['theme_preference'];
export type AccentColor = Profile['accent_color'];
export type FontSize = Profile['font_size'];

