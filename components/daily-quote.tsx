
import { useQuery } from '@tanstack/react-query';
import { getQuoteOfDay } from '@/lib/actions/quotes';
import { QUERY_KEYS } from '@/lib/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { QuoteCard } from './quote-card';

export function DailyQuote() {
  const { data: quote, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.quotes.daily(),
    queryFn: getQuoteOfDay,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - same quote all day
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !quote) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            Quote of the Day
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Your daily dose of inspiration</p>
        </div>
      </div>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 rounded-lg blur-xl opacity-50" />
        <div className="relative">
          <QuoteCard quote={quote} />
        </div>
      </div>
    </div>
  );
}

