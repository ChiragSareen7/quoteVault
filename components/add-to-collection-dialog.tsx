

import { useState } from 'react';
import type { Quote, Collection } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCollections, addQuoteToCollection } from '@/lib/actions/collections';
import { QUERY_KEYS } from '@/lib/constants';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface AddToCollectionDialogProps {
  quote: Quote;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToCollectionDialog({
  quote,
  open,
  onOpenChange,
}: AddToCollectionDialogProps) {
  const queryClient = useQueryClient();
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(
    new Set()
  );

  const { data: collectionsData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.collections.lists(),
    queryFn: getCollections,
  });

  const addMutation = useMutation({
    mutationFn: async (collectionId: string) => {
      // Check if this is a user quote (has user_id property)
      const isUserQuote = !!quote.user_id;
      const result = await addQuoteToCollection(collectionId, quote.id, isUserQuote);
      if (result?.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.collections.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.collections.quotes('*'),
      });
      toast.success('Quote added to collection');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add quote to collection');
    },
  });

  const handleToggleCollection = (collectionId: string) => {
    const newSelected = new Set(selectedCollections);
    if (newSelected.has(collectionId)) {
      newSelected.delete(collectionId);
    } else {
      newSelected.add(collectionId);
    }
    setSelectedCollections(newSelected);
  };

  const handleAdd = async () => {
    if (selectedCollections.size === 0) {
      toast.error('Please select at least one collection');
      return;
    }

    try {
      // Add to all selected collections
      const promises = Array.from(selectedCollections).map((collectionId) =>
        addMutation.mutateAsync(collectionId)
      );
      await Promise.all(promises);
      
      // Only close if all succeeded
      onOpenChange(false);
      setSelectedCollections(new Set());
    } catch (error) {
      // Error is already handled by mutation onError
      // Don't close dialog so user can retry
    }
  };

  const collections = collectionsData?.collections || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Collection</DialogTitle>
          <DialogDescription>
            Select one or more collections to add this quote to
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>You don't have any collections yet.</p>
              <p className="text-sm mt-2">Create a collection first to add quotes.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {collections.map((collection: Collection) => (
                <Button
                  key={collection.id}
                  variant={
                    selectedCollections.has(collection.id)
                      ? 'default'
                      : 'outline'
                  }
                  className="w-full justify-start"
                  onClick={() => handleToggleCollection(collection.id)}
                >
                  {collection.name}
                  {collection.quote_count !== undefined && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {collection.quote_count} quotes
                    </span>
                  )}
                </Button>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={
                selectedCollections.size === 0 || addMutation.isPending
              }
            >
              {addMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                `Add to ${selectedCollections.size} collection${
                  selectedCollections.size !== 1 ? 's' : ''
                }`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

