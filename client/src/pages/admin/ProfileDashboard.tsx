import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ErrorMessage } from '@/components/ui/error-message';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface UserProfile {
  user_id: string;
  email: string;
  city?: string;
  created_at: string;
  trip_count: number;
}

export function ProfileDashboard() {
  const { getToken } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch all user profiles (admin only)
  const { data: profilesData, isLoading } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      try {
        const token = await getToken();
        const response = await fetch('/api/admin/profiles', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user profiles. Admin access required.');
        }
        
        const data = await response.json();
        return data.profiles as UserProfile[];
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to fetch user profiles');
        return [];
      }
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const profiles = profilesData || [];

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Monitor user profiles and saved trips</p>
      </div>

      {errorMessage && (
        <ErrorMessage 
          title="Access Error" 
          message={errorMessage} 
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{profiles.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Total Saved Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {profiles.reduce((total, profile) => total + (profile.trip_count || 0), 0)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Users with City Info</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {profiles.filter(profile => profile.city).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>List of all user profiles</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Saved Trips</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No user profiles found</TableCell>
                </TableRow>
              ) : (
                profiles.map(profile => (
                  <TableRow key={profile.user_id}>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>{profile.city || 'Not set'}</TableCell>
                    <TableCell>{profile.trip_count || 0}</TableCell>
                    <TableCell>{new Date(profile.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
