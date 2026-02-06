'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import type { Collection, CollectionQuote, Quote } from '@/types/database';
import { revalidatePath } from 'next/cache';

export async function getCollections() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { collections: [] as Collection[], error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { collections: [] as Collection[], error: error.message };
  }

  // Get quote counts for each collection
  const collectionsWithCounts = await Promise.all(
    (data || []).map(async (collection) => {
      const { count } = await supabase
        .from('collection_quotes')
        .select('*', { count: 'exact', head: true })
        .eq('collection_id', collection.id);

      return {
        ...collection,
        quote_count: count || 0,
      } as Collection;
    })
  );

  return { collections: collectionsWithCounts };
}

export async function getCollection(id: string) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { collection: null, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    return { collection: null, error: error.message };
  }

  return { collection: data as Collection };
}

export async function getCollectionQuotes(collectionId: string) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { quotes: [] as CollectionQuote[], error: 'Not authenticated' };
  }

  // Verify collection ownership
  const { data: collection } = await supabase
    .from('collections')
    .select('id')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .single();

  if (!collection) {
    return { quotes: [] as CollectionQuote[], error: 'Collection not found' };
  }

  // Fetch both regular quotes and user quotes from the collection
  const { data: regularQuotes, error: regularError } = await supabase
    .from('collection_quotes')
    .select('*, quote:quotes(*)')
    .eq('collection_id', collectionId)
    .not('quote_id', 'is', null)
    .order('created_at', { ascending: false });

  const { data: userQuotes, error: userError } = await supabase
    .from('collection_quotes')
    .select('*, user_quote:user_quotes(*)')
    .eq('collection_id', collectionId)
    .not('user_quote_id', 'is', null)
    .order('created_at', { ascending: false });

  if (regularError && userError) {
    return { quotes: [] as CollectionQuote[], error: regularError.message };
  }

  // Combine both types of quotes
  const allQuotes = [
    ...(regularQuotes || []).map((cq) => ({
      ...cq,
      quote: cq.quote as Quote,
      quote_id: cq.quote_id,
    })),
    ...(userQuotes || []).map((cq) => ({
      ...cq,
      quote: cq.user_quote as Quote,
      quote_id: cq.user_quote_id, // Use user_quote_id as quote_id for consistency
    })),
  ].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return {
    quotes: allQuotes as CollectionQuote[],
  };
}

export async function createCollection(name: string, description?: string) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { collection: null, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('collections')
    .insert({
      user_id: user.id,
      name,
      description: description || null,
    })
    .select()
    .single();

  if (error) {
    return { collection: null, error: error.message };
  }

  revalidatePath('/collections');
  return { collection: data as Collection };
}

export async function updateCollection(
  id: string,
  updates: { name?: string; description?: string }
) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('collections')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/collections');
  revalidatePath(`/collections/${id}`);
  return { success: true };
}

export async function deleteCollection(id: string) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/collections');
  return { success: true };
}

export async function addQuoteToCollection(collectionId: string, quoteId: string, isUserQuote: boolean = false) {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Not authenticated. Please sign in to add quotes to collections.' };
    }

    // Verify collection ownership
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('id')
      .eq('id', collectionId)
      .eq('user_id', user.id)
      .single();

    if (collectionError || !collection) {
      return { error: 'Collection not found or you do not have access to it.' };
    }

    // Insert based on quote type
    const insertData = isUserQuote
      ? {
          collection_id: collectionId,
          user_quote_id: quoteId,
          quote_id: null,
        }
      : {
          collection_id: collectionId,
          quote_id: quoteId,
          user_quote_id: null,
        };

    const { error } = await supabase.from('collection_quotes').insert(insertData);

    if (error) {
      // Ignore duplicate errors (quote already in collection)
      if (error.code === '23505') {
        return { success: true };
      }
      // Check for foreign key constraint (quote doesn't exist)
      if (error.code === '23503') {
        return { error: 'Quote not found' };
      }
      return { error: `Failed to add quote: ${error.message}` };
    }

    revalidatePath(`/collections/${collectionId}`);
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

export async function removeQuoteFromCollection(collectionId: string, quoteId: string) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify collection ownership
  const { data: collection } = await supabase
    .from('collections')
    .select('id')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .single();

  if (!collection) {
    return { error: 'Collection not found' };
  }

  // Try deleting as regular quote first, then as user quote
  const { error: regularError } = await supabase
    .from('collection_quotes')
    .delete()
    .eq('collection_id', collectionId)
    .eq('quote_id', quoteId);

  // If not found as regular quote, try as user quote
  if (regularError && regularError.code !== 'PGRST116') {
    // PGRST116 means no rows found, which is fine - try user quote
    const { error: userError } = await supabase
      .from('collection_quotes')
      .delete()
      .eq('collection_id', collectionId)
      .eq('user_quote_id', quoteId);

    if (userError && userError.code !== 'PGRST116') {
      return { error: userError.message };
    }
  }

  revalidatePath(`/collections/${collectionId}`);
  return { success: true };
}

