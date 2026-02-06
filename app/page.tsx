'use client';



import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQuotes } from '@/lib/actions/quotes';
import { QUERY_KEYS, QUOTE_CATEGORIES } from '@/lib/constants';
import type { QuoteCategory } from '@/types/database';
import { DailyQuote } from '@/components/daily-quote';
import { QuoteCard } from '@/components/quote-card';
import { CreateQuoteDialog } from '@/components/create-quote-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Loader2, Filter, Plus } from 'lucide-react';
import { Nav } from '@/components/nav';
import { useAuth } from '@/lib/hooks/use-auth';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<QuoteCategory | 'all'>('all');
  const [authorFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.quotes.list({
      page,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      search: searchQuery || undefined,
      author: authorFilter || undefined,
    }),
    queryFn: () =>
      getQuotes({
        page,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchQuery || undefined,
        author: authorFilter || undefined,
      }),
  });

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const handleCategoryChange = (category: QuoteCategory | 'all') => {
    setSelectedCategory(category);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Nav />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Daily Quote Section */}
          <DailyQuote />

          {/* Quote Feed Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Explore Quotes
                </h2>
                <p className="text-muted-foreground mt-1">Discover wisdom, inspiration, and humor</p>
              </div>
              {isAuthenticated && (
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  size="lg"
                  className="gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="h-5 w-5" />
                  Create Quote
                </Button>
              )}
            </div>

            {/* Filters */}
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search quotes or authors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 h-12 text-base border-2 focus:border-primary transition-colors"
                  />
                </div>
                <Button type="submit" size="lg" className="px-8">Search</Button>
              </form>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Category:</span>
                </div>
                <Tabs
                  value={selectedCategory}
                  onValueChange={(value) =>
                    handleCategoryChange(value as QuoteCategory | 'all')
                  }
                >
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    {QUOTE_CATEGORIES.map((cat) => (
                      <TabsTrigger key={cat.value} value={cat.value}>
                        {cat.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Quote List */}
            {isLoading && page === 1 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error || data?.error ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
                <p className="font-semibold mb-2">Failed to load quotes</p>
                <p className="text-sm mb-4">{data?.error || error?.message || 'Please check your database setup'}</p>
                {data?.error?.includes('Database not set up') && (
                  <div className="mt-4 p-3 bg-muted rounded text-left text-sm">
                    <p className="font-semibold mb-2">Setup Instructions:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Go to your Supabase Dashboard</li>
                      <li>Open SQL Editor</li>
                      <li>Run the <code className="bg-background px-1 rounded">supabase/schema.sql</code> file</li>
                      <li>Optionally run <code className="bg-background px-1 rounded">supabase/seed.sql</code> to add quotes</li>
                    </ol>
                  </div>
                )}
                <Button
                  onClick={() => refetch()}
                  variant="outline"
                  className="mt-4"
                >
                  Retry
                </Button>
              </div>
            ) : !data?.quotes || data.quotes.length === 0 ? (
              <div className="rounded-lg border p-8 text-center text-muted-foreground">
                <p>No quotes found. Try adjusting your filters.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {data.quotes.map((quote, index) => (
                    <div
                      key={quote.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <QuoteCard quote={quote} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {data.hasMore && (
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={isLoading}
                      variant="outline"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      {showCreateDialog && (
        <CreateQuoteDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      )}
    </div>
  );
}
