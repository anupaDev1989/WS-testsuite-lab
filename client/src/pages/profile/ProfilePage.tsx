// src/pages/Profile/ProfilePage.tsx
import { useState, useEffect } from 'react';
import useProfileStore from '@/stores/profileStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Trash2, Eye, Info, Loader2 } from 'lucide-react';
import TripDetailsModal from './TripDetailsModal';

const ProfilePage = () => {
  const { profile, trips, isLoading, error, fetchProfile, deleteTrip, getTripDetails } = useProfileStore();
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleViewTrip = async (id: string) => {
    const tripDetails = await getTripDetails(id);
    if (tripDetails) {
      setSelectedTrip(tripDetails);
      setIsModalOpen(true);
    }
  };

  const handleDeleteTrip = (id: string) => {
    // Optional: Add a confirmation dialog here for better UX
    deleteTrip(id);
  };

  if (isLoading && !profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <Info className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!profile) {
    return <div className="text-center p-10">No profile data found.</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Most Recent City:</strong> {profile.city || 'Not set'}</p>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-4">My Saved Trips</h2>
      
      {trips.length === 0 ? (
        <p>You haven't saved any trips yet.</p>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => (
            <Card key={trip.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{trip.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {trip.city ? `${trip.city} - ` : ''}
                    Saved on {new Date(trip.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleViewTrip(trip.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDeleteTrip(trip.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedTrip && (
        <TripDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          trip={selectedTrip}
        />
      )}
    </div>
  );
};

export default ProfilePage;
