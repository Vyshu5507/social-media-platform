import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import PostCard from '@/components/PostCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Edit2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({ display_name: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ followers: 0, following: 0 });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchPosts();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setProfile(data);
      setEditedProfile({
        display_name: data.display_name || '',
        bio: data.bio || '',
      });
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    const [followers, following] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', user.id),
      supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', user.id),
    ]);

    setStats({
      followers: followers.count || 0,
      following: following.count || 0,
    });
  };

  const fetchPosts = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          created_at,
          user_id,
          profiles!posts_user_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      const { data: likesData } = await supabase.from('likes').select('post_id');
      const { data: commentsData } = await supabase.from('comments').select('post_id');
      const { data: userLikes } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id);

      const userLikedPostIds = new Set(userLikes?.map((l) => l.post_id) || []);

      const likesCount: Record<string, number> = {};
      likesData?.forEach((like) => {
        likesCount[like.post_id] = (likesCount[like.post_id] || 0) + 1;
      });

      const commentsCount: Record<string, number> = {};
      commentsData?.forEach((comment) => {
        commentsCount[comment.post_id] = (commentsCount[comment.post_id] || 0) + 1;
      });

      const enrichedPosts = postsData?.map((post: any) => ({
        ...post,
        profile: post.profiles,
        likes_count: likesCount[post.id] || 0,
        comments_count: commentsCount[post.id] || 0,
        is_liked: userLikedPostIds.has(post.id),
      })) || [];

      setPosts(enrichedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: editedProfile.display_name || null,
          bio: editedProfile.bio || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });
      setEditing(false);
      fetchProfile();
      fetchPosts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const initials = profile?.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || profile?.username?.[0]?.toUpperCase() || '?';

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20 ring-4 ring-primary/10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              {editing ? (
                <div className="space-y-3">
                  <Input
                    value={editedProfile.display_name}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, display_name: e.target.value })
                    }
                    placeholder="Display name"
                    className="bg-muted/50"
                  />
                  <Textarea
                    value={editedProfile.bio}
                    onChange={(e) =>
                      setEditedProfile({ ...editedProfile, bio: e.target.value })
                    }
                    placeholder="Write a bio..."
                    className="bg-muted/50 resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      onClick={() => setEditing(false)}
                      variant="outline"
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-xl font-bold text-foreground">
                        {profile?.display_name || profile?.username}
                      </h1>
                      <p className="text-muted-foreground">@{profile?.username}</p>
                    </div>
                    <Button
                      onClick={() => setEditing(true)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                  {profile?.bio && (
                    <p className="mt-3 text-foreground">{profile.bio}</p>
                  )}
                </>
              )}

              <div className="flex gap-6 mt-4">
                <div>
                  <span className="font-bold text-foreground">{stats.followers}</span>
                  <span className="text-muted-foreground ml-1">Followers</span>
                </div>
                <div>
                  <span className="font-bold text-foreground">{stats.following}</span>
                  <span className="text-muted-foreground ml-1">Following</span>
                </div>
                <div>
                  <span className="font-bold text-foreground">{posts.length}</span>
                  <span className="text-muted-foreground ml-1">Posts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-foreground">Your Posts</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">You haven't posted anything yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={fetchPosts}
                onLikeUpdate={fetchPosts}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Profile;
