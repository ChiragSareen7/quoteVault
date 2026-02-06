

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getClientSupabase } from '@/lib/supabase/client';
import { useEffect, useMemo } from 'react';

export function useAuth() {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => getClientSupabase(), []);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      // Invalidate and refetch user query when auth state changes
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, queryClient]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}

