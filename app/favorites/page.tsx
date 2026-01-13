
import { useQuery } from '@tanstack/react-query';
import { getFavorites } from '@/lib/actions/favorites';
import { QUERY_KEYS } from '@/lib/constants';
import { QuoteCard } from '@/components/quote-card';
import { Nav } from '@/components/nav';
import { Loader2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function FavoritesPage() {
  const router = useRouter();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.favorites.lists(),
    queryFn: getFavorites,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  if (error || data?.error) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <main className="container mx-auto px-4 py-8">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
            <p>Failed to load favorites. Please try again.</p>
            <Button onClick={() => refetch()} variant="outline" className="mt-4">
              Retry
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const favorites = data?.favorites || [];

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">My Favorites</h1>
          </div>

          {favorites.length === 0 ? (
            <div className="rounded-lg border p-12 text-center">
              <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
              <p className="text-muted-foreground mb-4">
                Start exploring quotes and add them to your favorites!
              </p>
              <Button onClick={() => router.push('/')}>Browse Quotes</Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {favorites.map((favorite) => (
                <QuoteCard
                  key={favorite.id}
                  quote={favorite.quote!}
                  onFavoriteChange={(favorited) => {
                    if (!favorited) {
                      // Refetch when a favorite is removed
                      refetch();
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

