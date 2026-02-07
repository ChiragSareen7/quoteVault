
'use client';

import { useState } from 'react';
import type { Quote } from '@/types/database';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Heart, Share2, MoreVertical, BookOpen, User } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { toggleFavorite } from '@/lib/actions/favorites';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { toast } from 'sonner';
import { isFavorite } from '@/lib/actions/favorites';
import { ShareQuoteDialog } from './share-quote-dialog';
import { AddToCollectionDialog } from './add-to-collection-dialog';

interface QuoteCardProps {
  quote: Quote;
  onFavoriteChange?: (favorited: boolean) => void;
}

export function QuoteCard({ quote, onFavoriteChange }: QuoteCardProps) {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [isSharing, setIsSharing] = useState(false);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);

  // Check if quote is favorited
  const { data: favorited = false } = useQuery({
    queryKey: [...QUERY_KEYS.favorites.detail(quote.id)],
    queryFn: () => isFavorite(quote.id),
    enabled: isAuthenticated,
  });

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to favorite quotes');
      return;
    }

    // Optimistic update
    const previousFavorited = favorited;
    queryClient.setQueryData(
      [...QUERY_KEYS.favorites.detail(quote.id)],
      !previousFavorited
    );

    const result = await toggleFavorite(quote.id);

    if (result?.error) {
      // Rollback on error
      queryClient.setQueryData(
        [...QUERY_KEYS.favorites.detail(quote.id)],
        previousFavorited
      );
      toast.error(result.error);
    } else {
      toast.success(result?.favorited ? 'Added to favorites' : 'Removed from favorites');
      onFavoriteChange?.(result?.favorited || false);
      // Invalidate favorites list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.favorites.lists() });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Quote by ${quote.author}`,
        text: `"${quote.text}" - ${quote.author}`,
      }).catch(() => {
        // Fallback to dialog if share fails
        setIsSharing(true);
      });
    } else {
      setIsSharing(true);
    }
  };

  const categoryColors: Record<string, string> = {
    motivation: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    love: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    wisdom: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    humor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  };

  const isUserQuote = quote.user_id && quote.user_id === user?.id;

  return (
    <>
      <Card className="group relative overflow-hidden border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 card-hover animate-fade-in">
        {isUserQuote && (
          <div className="absolute top-3 right-3 z-30 pointer-events-none">
            <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full border border-primary/20">
              <User className="h-3 w-3 text-primary" />
              <span className="text-xs font-medium text-primary">Your Quote</span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <CardContent className="pt-6 relative z-10">
          <div className="space-y-4">
            <p className="text-xl leading-relaxed italic font-serif text-foreground/90 group-hover:text-foreground transition-colors">
              &quot;{quote.text}&quot;
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-base">— {quote.author}</span>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                    categoryColors[quote.category] || categoryColors.motivation
                  }`}
                >
                  {quote.category}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t pt-4 relative z-10">
          <div className="flex items-center gap-2">
            <Button
              variant={favorited ? 'default' : 'outline'}
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleToggleFavorite();
              }}
              disabled={!isAuthenticated}
              type="button"
            >
              <Heart
                className={`h-4 w-4 mr-2 ${favorited ? 'fill-current' : ''}`}
              />
              {favorited ? 'Favorited' : 'Favorite'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleShare();
              }}
              type="button"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isAuthenticated && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowCollectionDialog(true);
                  }}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Add to Collection
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleShare();
                }}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share Quote
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>
      {isSharing && (
        <ShareQuoteDialog
          quote={quote}
          open={isSharing}
          onOpenChange={setIsSharing}
        />
      )}
      {showCollectionDialog && (
        <AddToCollectionDialog
          quote={quote}
          open={showCollectionDialog}
          onOpenChange={setShowCollectionDialog}
        />
      )}
    </>
  );
}

