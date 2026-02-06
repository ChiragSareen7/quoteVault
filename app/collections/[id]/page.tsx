

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCollection, getCollectionQuotes, updateCollection, removeQuoteFromCollection } from '@/lib/actions/collections';
import { QUERY_KEYS, ROUTES } from '@/lib/constants';
import { Nav } from '@/components/nav';
import { Loader2, BookOpen, ArrowLeft, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuoteCard } from '@/components/quote-card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function CollectionPage() {
  const params = useParams();
  const collectionId = params.id as string;
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');

  const { data: collectionData, isLoading: collectionLoading } = useQuery({
    queryKey: QUERY_KEYS.collections.detail(collectionId),
    queryFn: () => getCollection(collectionId),
  });

  const { data: quotesData, isLoading: quotesLoading, refetch } = useQuery({
    queryKey: QUERY_KEYS.collections.quotes(collectionId),
    queryFn: () => getCollectionQuotes(collectionId),
  });

  const updateMutation = useMutation({
    mutationFn: (updates: { name?: string; description?: string }) =>
      updateCollection(collectionId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.collections.detail(collectionId),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.collections.lists() });
      toast.success('Collection updated');
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update collection');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (quoteId: string) =>
      removeQuoteFromCollection(collectionId, quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.collections.quotes(collectionId),
      });
      toast.success('Quote removed from collection');
      refetch();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove quote');
    },
  });

  const handleEdit = () => {
    const collection = collectionData?.collection;
    if (collection) {
      setCollectionName(collection.name);
      setCollectionDescription(collection.description || '');
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdate = () => {
    if (!collectionName.trim()) {
      toast.error('Collection name is required');
      return;
    }
    updateMutation.mutate({
      name: collectionName.trim(),
      description: collectionDescription.trim() || undefined,
    });
  };

  if (collectionLoading || quotesLoading) {
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

  if (collectionData?.error || !collectionData?.collection) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <main className="container mx-auto px-4 py-8">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
            <p>Collection not found or you don&apos;t have access to it.</p>
            <Link href={ROUTES.collections}>
              <Button variant="outline" className="mt-4">
                Back to Collections
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const collection = collectionData.collection;
  const quotes = quotesData?.quotes || [];

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={ROUTES.collections}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">{collection.name}</h1>
                {collection.description && (
                  <p className="text-muted-foreground mt-1">{collection.description}</p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  {quotes.length} quote{quotes.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button onClick={handleEdit} variant="outline">
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>

          {quotes.length === 0 ? (
            <div className="rounded-lg border p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No quotes in this collection</h3>
              <p className="text-muted-foreground mb-4">
                Add quotes to this collection from the home page or favorites.
              </p>
              <Link href={ROUTES.home}>
                <Button>Browse Quotes</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quotes.map((collectionQuote) => (
                <div key={collectionQuote.id} className="relative">
                  <QuoteCard quote={collectionQuote.quote!} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-background/80 backdrop-blur"
                    onClick={() => {
                      if (confirm('Remove this quote from the collection?')) {
                        removeMutation.mutate(collectionQuote.quote_id);
                      }
                    }}
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
            <DialogDescription>
              Update collection name and description
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={collectionDescription}
                onChange={(e) => setCollectionDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={updateMutation.isPending || !collectionName.trim()}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

