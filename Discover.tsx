import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import UserCard from '@/components/UserCard';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

const Discover = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfiles();
      fetchFollowing();
    }
  }, [user]);

  const fetchProfiles = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, username, display_name, avatar_url, bio')
        .neq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowing = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    setFollowing(new Set(data?.map((f) => f.following_id) || []));
  };

  const filteredProfiles = profiles.filter((profile) =>
    profile.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Discover</h1>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="pl-10 bg-muted/50"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? 'No users found' : 'No other users yet'}
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden shadow-soft">
            {filteredProfiles.map((profile) => (
              <UserCard
                key={profile.id}
                profile={profile}
                isFollowing={following.has(profile.user_id)}
                onFollowChange={fetchFollowing}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Discover;
