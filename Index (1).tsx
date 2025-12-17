import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import CreatePost from '@/components/CreatePost';
import PostCard from '@/components/PostCard';
import { Loader2 } from 'lucide-react';

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

interface Profile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchPosts();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url')
      .eq('user_id', user.id)
      .single();
    if (data) setUserProfile(data);
  };

  const fetchPosts = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get posts with profiles
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
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) throw postsError;

      // Get likes counts
      const { data: likesData } = await supabase
        .from('likes')
        .select('post_id');

      // Get comments counts
      const { data: commentsData } = await supabase
        .from('comments')
        .select('post_id');

      // Get user's likes
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
        <h1 className="text-2xl font-bold text-foreground">Home</h1>
        
        {userProfile && (
          <CreatePost onPostCreated={fetchPosts} userProfile={userProfile} />
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
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

export default Index;
