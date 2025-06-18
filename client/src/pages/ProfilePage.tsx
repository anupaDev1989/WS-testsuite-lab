import React, { useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import useProfileStore from '@/stores/profileStore';
import { getSupabaseJWT } from '@/lib/authUtils';
import { TripSummary, UserProfile } from '@/types';

// Simple error boundary component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-700 rounded-md m-4">
          <h3 className="font-bold">Something went wrong</h3>
          <p className="text-sm mt-2">{this.state.error?.message || 'Unknown error'}</p>
          <Button 
            onClick={() => this.setState({ hasError: false, error: null })}
            variant="outline"
            className="mt-2"
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main ProfilePage component
const ProfilePageContent: React.FC = () => {
  const { 
    profile, 
    trips, 
    isLoading, 
    error, 
    fetchProfile,
    deleteTrip
  } = useProfileStore();
  
  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'N/A';
    }
  };
  
  const [, navigate] = useLocation();

  const loadProfileData = useCallback(async () => {
    try {
      console.log('[ProfilePage] Loading profile data...');
      const token = await getSupabaseJWT();
      if (!token) {
        console.log('[ProfilePage] No token found, redirecting to signin');
        navigate('/signin');
        return;
      }
      console.log('[ProfilePage] Token found, fetching profile...');
      await fetchProfile();
      console.log('[ProfilePage] Profile fetch completed');
    } catch (err) {
      console.error('[ProfilePage] Error loading profile data:', err);
    }
  }, [fetchProfile, navigate]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);
  
  // Debug log when profile or trips change
  useEffect(() => {
    console.log('[ProfilePage] Profile updated:', { profile, trips });
  }, [profile, trips]);

  const handleDeleteTrip = async (tripId: string) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        await deleteTrip(tripId);
        // Refresh the profile data which includes trips
        await fetchProfile();
      } catch (err) {
        console.error('Failed to delete trip:', err);
        alert('Failed to delete trip. Please try again.');
      }
    }
  };

  const handleViewTrip = (tripId: string) => {
    // Navigate to trip detail view or show modal
    console.log('View trip:', tripId);
    // For now, just show an alert
    alert(`Viewing trip: ${tripId}`);
  };

  // Show loading state only on initial load
  // Show loading state only on initial load
  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Ensure profile is defined before rendering
  if (!profile) {
    return (
      <div className="p-4 text-center">
        <p>No profile data available.</p>
        <Button 
          onClick={loadProfileData} 
          variant="outline" 
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  // Show error state if there's an error and no profile data
  if (error && !profile) {
    return (
      <div className="p-4 text-red-500">
        <p>Error loading profile: {error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-2"
          variant="outline"
        >
          Retry
        </Button>
      </div>
    );
  }

  // If we have an error but also have profile data, we'll show the profile with an error message
  const showErrorBanner = error && (
    <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
      <p className="font-medium">Error loading some data</p>
      <p className="text-sm">{typeof error === 'string' ? error : 'An unknown error occurred'}</p>
      <Button 
        onClick={loadProfileData} 
        variant="outline" 
        size="sm"
        className="mt-2"
      >
        Retry
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>
      {showErrorBanner}

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="trips">My Trips</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                View and update your profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-gray-500">{profile?.email || 'Not available'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Member since</p>
                <p className="text-sm text-gray-500">
                  {profile?.created_at ? formatDate(profile.created_at) : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Trips</CardTitle>
              <CardDescription>
                View and manage your saved trips
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!trips || trips.length === 0 ? (
                <p className="text-sm text-gray-500">No trips saved yet.</p>
              ) : (
                <div className="space-y-4">
                  {trips.map((trip: TripSummary) => (
                    <Card key={trip.id} className="relative">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{trip.title}</CardTitle>
                            <CardDescription className="space-y-2">
                              {trip.city && (
                                <p className="text-sm text-gray-500">
                                  City: {trip.city}
                                </p>
                              )}
                              <p className="text-sm text-gray-700 line-clamp-2">
                                {trip.content || trip.title || 'Untitled Trip'}
                              </p>
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDeleteTrip(trip.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">ID:</span> {trip.id}</p>
                          {trip.city && <p><span className="font-medium">City:</span> {trip.city}</p>}
                          <p><span className="font-medium">Created:</span> {trip.created_at ? formatDate(trip.created_at) : 'N/A'}</p>
                          {trip.content && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-md">
                              <p className="font-medium mb-1">LLM Response:</p>
                              <p className="text-sm whitespace-pre-wrap">{trip.content}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Wrap the ProfilePage with ErrorBoundary
export default function ProfilePage() {
  return (
    <ErrorBoundary>
      <ProfilePageContent />
    </ErrorBoundary>
  );
}
