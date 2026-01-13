
import { createServerSupabase } from '@/lib/supabase/server';
import type { Profile, ThemePreference, AccentColor, FontSize } from '@/types/database';
import { revalidatePath } from 'next/cache';

export async function getProfile() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { profile: null, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    // Profile might not exist yet, return null
    if (error.code === 'PGRST116') {
      return { profile: null };
    }
    return { profile: null, error: error.message };
  }

  return { profile: data as Profile };
}

export async function updateProfile(updates: {
  full_name?: string | null;
  theme_preference?: ThemePreference;
  accent_color?: AccentColor;
  font_size?: FontSize;
  notification_time?: string | null;
}) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Upsert profile (create if doesn't exist)
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        ...updates,
      },
      {
        onConflict: 'id',
      }
    )
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/profile');
  revalidatePath('/', 'layout');
  return { profile: data as Profile };
}

export async function updateAvatar(avatarUrl: string) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/profile');
  return { success: true };
}

