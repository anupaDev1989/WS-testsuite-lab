import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useLlmContext } from '@/hooks/useLlmContext';
import { ErrorMessage } from '@/components/ui/error-message';
import { useSuccessToast } from '@/components/ui/success-toast';

interface Trip {
  id: string;
  title: string;
  data: any;
  created_at: string;
  updated_at: string;
}

export function SavedTripsSection() {
  const { getToken } = useAuth();
  const { currentLlmResponse } = useLlmContext();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tripTitle, setTripTitle] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const showSuccessToast = useSuccessToast();

  // Fetch all trips
  const { data: tripsData, isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch('/api/trips', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      
      const data = await response.json();
      return data.trips as Trip[];
    }
  });

  // Save trip mutation
  const saveTripMutation = useMutation({
    mutationFn: async ({ title, data }: { title: string, data: any }) => {
      const token = await getToken();
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, data })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save trip');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      setIsDialogOpen(false);
      setTripTitle('');
      setErrorMessage(null);
      showSuccessToast({
        title: 'Trip Saved',
        description: 'Your trip has been saved successfully.'
      });
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save trip');
    }
  });

  // Delete trip mutation
  const deleteTripMutation = useMutation({
    mutationFn: async (tripId: string) => {
      const token = await getToken();
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete trip');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      setErrorMessage(null);
      showSuccessToast({
        title: 'Trip Deleted',
        description: 'Your trip has been deleted successfully.'
      });
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete trip');
    }
  });

  // Handle save trip
  const handleSaveTrip = () => {
    if (!tripTitle.trim() || !currentLlmResponse) return;
    
    saveTripMutation.mutate({ 
      title: tripTitle, 
      data: currentLlmResponse 
    });
  };

  // Handle view trip
  const handleViewTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setViewDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const trips = tripsData || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">Saved Trips</CardTitle>
        {errorMessage && (
          <ErrorMessage 
            title="Error" 
            message={errorMessage} 
          />
        )}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={!currentLlmResponse}>
              <Plus className="h-4 w-4 mr-2" />
              Save Current Trip
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Trip</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {errorMessage && (
                <ErrorMessage 
                  title="Save Error" 
                  message={errorMessage} 
                />
              )}
              <div className="space-y-2">
                <Label htmlFor="trip-title">Trip Title</Label>
                <Input
                  id="trip-title"
                  value={tripTitle}
                  onChange={(e) => setTripTitle(e.target.value)}
                  placeholder="My Awesome Trip"
                />
              </div>
              <div className="space-y-2">
                <Label>LLM Response Preview</Label>
                <div className="rounded-md bg-muted/50 p-4 text-sm overflow-auto max-h-40">
                  <pre className="whitespace-pre-wrap break-words">
                    {JSON.stringify(currentLlmResponse, null, 2)}
                  </pre>
                </div>
              </div>
              <Button 
                onClick={handleSaveTrip}
                disabled={!tripTitle.trim() || saveTripMutation.isPending || !currentLlmResponse}
                className="w-full"
              >
                {saveTripMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Trip
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {trips.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No saved trips yet.</p>
            <p className="text-sm">Save your first trip to see it here!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map((trip) => (
              <div 
                key={trip.id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div>
                  <h3 className="font-medium">{trip.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(trip.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewTrip(trip)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => deleteTripMutation.mutate(trip.id)}
                    disabled={deleteTripMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Trip View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedTrip?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-md bg-muted/50 p-4 text-sm overflow-auto max-h-[400px]">
              <pre className="whitespace-pre-wrap break-words">
                {selectedTrip ? JSON.stringify(selectedTrip.data, null, 2) : ''}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
