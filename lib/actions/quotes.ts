'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import type { Quote, QuoteCategory } from '@/types/database';
import { QUOTES_PER_PAGE } from '@/lib/constants';

export async function getQuotes(options: {
  page?: number;
  category?: QuoteCategory;
  search?: string;
  author?: string;
} = {}) {
  try {
    const supabase = await createServerSupabase();
    const { page = 1, category, search, author } = options;

    // Get both regular quotes and user quotes, then combine
    let quotesQuery = supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    let userQuotesQuery = supabase
      .from('user_quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      quotesQuery = quotesQuery.eq('category', category);
      userQuotesQuery = userQuotesQuery.eq('category', category);
    }

    if (author) {
      quotesQuery = quotesQuery.ilike('author', `%${author}%`);
      userQuotesQuery = userQuotesQuery.ilike('author', `%${author}%`);
    }

    if (search) {
      quotesQuery = quotesQuery.or(`text.ilike.%${search}%,author.ilike.%${search}%`);
      userQuotesQuery = userQuotesQuery.or(`text.ilike.%${search}%,author.ilike.%${search}%`);
    }

    // Fetch both in parallel
    const [quotesResult, userQuotesResult] = await Promise.all([
      quotesQuery,
      userQuotesQuery,
    ]);

    // Combine results
    // Add user_id: null to regular quotes to distinguish from user quotes
    const regularQuotes = (quotesResult.data || []).map((q: Quote) => ({
      ...q,
      user_id: undefined,
    }));
    const userQuotes = userQuotesResult.data || [];
    
    const allQuotes = [
      ...regularQuotes,
      ...userQuotes,
    ].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const from = (page - 1) * QUOTES_PER_PAGE;
    const to = from + QUOTES_PER_PAGE;
    const paginatedQuotes = allQuotes.slice(from, to);

    // Handle errors gracefully - if one fails, still show the other
    if (quotesResult.error && userQuotesResult.error) {
      // Check if it's a table doesn't exist error
      if (
        quotesResult.error.message?.includes('does not exist') ||
        quotesResult.error.code === '42P01'
      ) {
        return {
          quotes: [] as Quote[],
          hasMore: false,
          total: 0,
          error: 'Database not set up. Please run the schema.sql file in your Supabase SQL Editor.',
        };
      }
      return {
        quotes: [] as Quote[],
        hasMore: false,
        total: 0,
        error: quotesResult.error.message || 'Failed to load quotes',
      };
    }

    return {
      quotes: paginatedQuotes as Quote[],
      hasMore: allQuotes.length > to,
      total: allQuotes.length,
    };
  } catch (error) {
    return {
      quotes: [] as Quote[],
      hasMore: false,
      total: 0,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

export async function getQuoteById(id: string) {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Quote;
}

/**
 * Get Quote of the Day
 * 
 * Uses a deterministic algorithm based on the current date
 * to ensure everyone sees the same quote on the same day.
 * This prevents client-side manipulation.
 */
export async function getQuoteOfDay() {
  try {
    const supabase = await createServerSupabase();

    // Get total count of quotes
    const { count, error: countError } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true });

    if (countError || !count || count === 0) {
      // Return null if no quotes or error (will be handled by component)
      return null;
    }

    // Use date as seed for deterministic selection
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    
    // Simple hash function for deterministic selection
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      const char = dateString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Get quote at index (hash mod count)
    const index = Math.abs(hash) % count;
    
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .range(index, index)
      .single();

    if (error) {
      return null;
    }

    return data as Quote;
  } catch {
    return null;
  }
}

