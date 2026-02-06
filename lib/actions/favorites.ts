'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import type { Favorite, Quote } from '@/types/database';
import { revalidatePath } from 'next/cache';

export async function getFavorites() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { favorites: [] as Favorite[], error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('favorites')
    .select('*, quote:quotes(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { favorites: [] as Favorite[], error: error.message };
  }

  return {
    favorites: (data || []).map((fav) => ({
      ...fav,
      quote: fav.quote as Quote,
    })) as Favorite[],
  };
}

export async function isFavorite(quoteId: string) {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('quote_id', quoteId)
      .maybeSingle(); // Use maybeSingle to avoid error if not found

    return !error && !!data;
  } catch {
    return false;
  }
}

export async function toggleFavorite(quoteId: string) {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Not authenticated. Please sign in to favorite quotes.' };
    }

    // Check if already favorited
    const { data: existing, error: checkError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('quote_id', quoteId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid error if not found

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is fine
      return { error: `Failed to check favorite: ${checkError.message}` };
    }

    if (existing) {
      // Remove favorite
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('quote_id', quoteId);

      if (error) {
        return { error: `Failed to remove favorite: ${error.message}` };
      }

      revalidatePath('/favorites');
      return { favorited: false };
    } else {
      // Add favorite
      const { error } = await supabase.from('favorites').insert({
        user_id: user.id,
        quote_id: quoteId,
      });

      if (error) {
        // Check for specific error codes
        if (error.code === '23503') {
          return { error: 'Quote not found' };
        }
        if (error.code === '23505') {
          // Duplicate - already favorited (shouldn't happen but handle it)
          return { favorited: true };
        }
        return { error: `Failed to add favorite: ${error.message}` };
      }

      revalidatePath('/favorites');
      return { favorited: true };
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

