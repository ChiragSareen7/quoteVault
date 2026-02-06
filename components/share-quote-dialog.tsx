
import { useState } from 'react';
import type { Quote } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Share2, Download, BookOpen } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';
import { AddToCollectionDialog } from './add-to-collection-dialog';

interface ShareQuoteDialogProps {
  quote: Quote;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareQuoteDialog({
  quote,
  open,
  onOpenChange,
}: ShareQuoteDialogProps) {
  const { isAuthenticated } = useAuth();
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);

  const handleSystemShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Quote by ${quote.author}`,
          text: `"${quote.text}" - ${quote.author}`,
        });
        onOpenChange(false);
      } catch {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      const text = `"${quote.text}" - ${quote.author}`;
      await navigator.clipboard.writeText(text);
      onOpenChange(false);
    }
  };

  const handleGenerateImage = async (template: number) => {
    // This would generate a quote card image
    // For now, we'll create a simple canvas-based image
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Background based on template
    const backgrounds = [
      '#1e293b', // Dark blue
      '#7c3aed', // Purple
      '#059669', // Green
    ];

    ctx.fillStyle = backgrounds[template - 1] || backgrounds[0];
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Text styling
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Wrap text
    const words = quote.text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
      const testLine = currentLine + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > canvas.width - 200 && currentLine) {
        lines.push(currentLine);
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    });
    lines.push(currentLine);

    // Draw quote text
    const lineHeight = 60;
    const startY = canvas.height / 2 - (lines.length * lineHeight) / 2;
    lines.forEach((line, index) => {
      ctx.fillText(
        line.trim(),
        canvas.width / 2,
        startY + index * lineHeight,
        canvas.width - 200
      );
    });

    // Draw author
    ctx.font = '32px Arial';
    ctx.fillText(`— ${quote.author}`, canvas.width / 2, startY + lines.length * lineHeight + 40);

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quote-${quote.id}-template-${template}.png`;
        a.click();
        URL.revokeObjectURL(url);
        onOpenChange(false);
      }
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Quote</DialogTitle>
            <DialogDescription>
              Share this quote via system share or generate a quote card image
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="share" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="share">Share</TabsTrigger>
              <TabsTrigger value="image">Quote Card</TabsTrigger>
            </TabsList>
            <TabsContent value="share" className="space-y-4">
              <div className="space-y-2">
                <Button
                  onClick={handleSystemShare}
                  className="w-full"
                  variant="default"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share via System
                </Button>
                {isAuthenticated && (
                  <Button
                    onClick={() => {
                      setShowCollectionDialog(true);
                      onOpenChange(false);
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Add to Collection
                  </Button>
                )}
              </div>
            </TabsContent>
            <TabsContent value="image" className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((template) => (
                  <Button
                    key={template}
                    onClick={() => handleGenerateImage(template)}
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <div
                      className={`w-full h-24 rounded ${
                        template === 1
                          ? 'bg-slate-700'
                          : template === 2
                          ? 'bg-purple-600'
                          : 'bg-emerald-600'
                      }`}
                    />
                    <span className="text-xs">Template {template}</span>
                  </Button>
                ))}
              </div>
              <Button
                onClick={() => handleGenerateImage(1)}
                className="w-full"
                variant="default"
              >
                <Download className="mr-2 h-4 w-4" />
                Generate & Download
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
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

