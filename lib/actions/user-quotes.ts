
import { createServerSupabase } from '@/lib/supabase/server';
import type { QuoteCategory } from '@/types/database';
import { revalidatePath } from 'next/cache';

async function getOrCreateMyQuotesCollection(supabase: any, userId: string) {
  // Check if "My Quotes" collection exists
  const { data: existing } = await supabase
    .from('collections')
    .select('id')
    .eq('user_id', userId)
    .eq('name', 'My Quotes')
    .maybeSingle();

  if (existing) {
    return existing.id;
  }

  // Create "My Quotes" collection if it doesn't exist
  const { data: newCollection, error } = await supabase
    .from('collections')
    .insert({
      user_id: userId,
      name: 'My Quotes',
      description: 'Quotes I created',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create collection: ${error.message}`);
  }

  return newCollection.id;
}

export async function createUserQuote(data: {
  text: string;
  author: string;
  category: QuoteCategory;
  source?: string;
}) {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Not authenticated. Please sign in to create quotes.' };
    }

    if (!data.text.trim() || !data.author.trim()) {
      return { error: 'Quote text and author are required' };
    }

    // Create the quote
    const { data: quote, error: quoteError } = await supabase
      .from('user_quotes')
      .insert({
        user_id: user.id,
        text: data.text.trim(),
        author: data.author.trim(),
        category: data.category,
        source: data.source?.trim() || null,
      })
      .select()
      .single();

    if (quoteError) {
      return { error: `Failed to create quote: ${quoteError.message}` };
    }

    // Automatically add to "My Quotes" collection
    try {
      const collectionId = await getOrCreateMyQuotesCollection(supabase, user.id);
      
      // Add user quote to collection using user_quote_id (not quote_id)
      const { error: collectionError } = await supabase
        .from('collection_quotes')
        .insert({
          collection_id: collectionId,
          user_quote_id: quote.id, // Use user_quote_id for user-created quotes
          quote_id: null,
        });
      
      // Ignore duplicate errors (quote already in collection)
      if (collectionError && collectionError.code !== '23505') {
        console.error('Failed to add quote to collection:', collectionError);
      }
    } catch (collectionError) {
      // If adding to collection fails, still return success for quote creation
      // The quote was created successfully, collection addition is secondary
      console.error('Failed to add quote to collection:', collectionError);
    }

    revalidatePath('/');
    revalidatePath('/collections');
    return { quote };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

export async function getUserQuotes() {
  try {
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from('user_quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { quotes: [], error: error.message };
    }

    return { quotes: data || [] };
  } catch (error) {
    return {
      quotes: [],
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

export async function deleteUserQuote(quoteId: string) {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('user_quotes')
      .delete()
      .eq('id', quoteId)
      .eq('user_id', user.id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

