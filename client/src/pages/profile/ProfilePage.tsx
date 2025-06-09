import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save } from 'lucide-react';
import { SavedTripsSection } from './SavedTripsSection';
import { useAuth } from '@/hooks/useAuth';
import { ErrorMessage } from '@/components/ui/error-message';
import { useSuccessToast } from '@/components/ui/success-toast';

interface ProfileData {
  user_id: string;
  email: string;
  city?: string;
  created_at: string;
}

export function ProfilePage() {
  const { user, getToken } = useAuth();
  const queryClient = useQueryClient();
  const [city, setCity] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const showSuccessToast = useSuccessToast();

  // Fetch profile data
  const { data, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      return data.profile as ProfileData;
    },
    enabled: !!user // Only run query if user is logged in
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (newCity: string) => {
      const token = await getToken();
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ city: newCity })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      showSuccessToast({
        title: 'Profile Updated',
        description: 'Your profile information has been saved successfully.'
      });
      setErrorMessage(null);
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update profile');
    }
  });

  // Update city state when profile data changes
  useEffect(() => {
    if (data?.city) {
      setCity(data.city);
    }
  }, [data]);

  // Handle save button click
  const handleSave = () => {
    updateProfileMutation.mutate(city);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <ErrorMessage 
          title="Profile Error" 
          message="Failed to load your profile information. Please try again later." 
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and saved trips</p>
      </div>

      <div className="space-y-8">
        <div className="bg-card rounded-lg border p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Account Information</h2>
              <p className="text-sm text-muted-foreground">Update your account details</p>
            </div>
            
            <div className="space-y-4 max-w-md">
              {errorMessage && (
                <ErrorMessage 
                  title="Update Error" 
                  message={errorMessage} 
                />
              )}
              
              <div>
                <label className="text-sm font-medium leading-none">Email</label>
                <Input 
                  value={user?.email} 
                  disabled 
                  className="mt-1 bg-muted/50" 
                />
              </div>
              
              <div>
                <label className="text-sm font-medium leading-none">City</label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter your city"
                  />
                  <Button 
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <SavedTripsSection />
      </div>
    </div>
  );
}
