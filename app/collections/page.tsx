'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCollections, createCollection, deleteCollection } from '@/lib/actions/collections';
import { QUERY_KEYS, ROUTES } from '@/lib/constants';
import { Nav } from '@/components/nav';
import { Loader2, BookOpen, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CollectionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.collections.lists(),
    queryFn: getCollections,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      createCollection(data.name, data.description),
    onSuccess: (result) => {
      if (result.collection) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.collections.lists() });
        toast.success('Collection created!');
        setIsCreateDialogOpen(false);
        setCollectionName('');
        setCollectionDescription('');
        router.push(ROUTES.collection(result.collection.id));
      } else {
        toast.error(result.error || 'Failed to create collection');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create collection');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.collections.lists() });
      toast.success('Collection deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete collection');
    },
  });

  const handleCreate = () => {
    if (!collectionName.trim()) {
      toast.error('Collection name is required');
      return;
    }
    createMutation.mutate({
      name: collectionName.trim(),
      description: collectionDescription.trim() || undefined,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this collection?')) {
      deleteMutation.mutate(id);
    }
  };

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
            <p>Failed to load collections. Please try again.</p>
            <Button onClick={() => refetch()} variant="outline" className="mt-4">
              Retry
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const collections = data?.collections || [];

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">My Collections</h1>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Collection
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Collection</DialogTitle>
                  <DialogDescription>
                    Organize your favorite quotes into collections
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={collectionName}
                      onChange={(e) => setCollectionName(e.target.value)}
                      placeholder="My Collection"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={collectionDescription}
                      onChange={(e) => setCollectionDescription(e.target.value)}
                      placeholder="A collection of my favorite quotes..."
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={createMutation.isPending || !collectionName.trim()}
                    >
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {collections.length === 0 ? (
            <div className="rounded-lg border p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No collections yet</h3>
              <p className="text-muted-foreground mb-4">
                Create a collection to organize your favorite quotes!
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Collection
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection) => (
                <Card key={collection.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{collection.name}</CardTitle>
                    {collection.description && (
                      <CardDescription>{collection.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {collection.quote_count || 0} quote
                      {(collection.quote_count || 0) !== 1 ? 's' : ''}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Link href={ROUTES.collection(collection.id)}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(collection.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

