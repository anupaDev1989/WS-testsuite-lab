// src/pages/Profile/TripDetailsModal.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Check } from 'lucide-react';

interface Trip {
  id: string;
  title: string;
  content: any;
}

interface TripDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
}

const TripDetailsModal = ({ isOpen, onClose, trip }: TripDetailsModalProps) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !trip) return null;

  const contentString = JSON.stringify(trip.content, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(contentString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{trip.title}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <ScrollArea className="h-96 w-full rounded-md border p-4">
            <pre><code>{contentString}</code></pre>
          </ScrollArea>
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TripDetailsModal;
