import { useState } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CommentSection from './CommentSection';

interface PostCardProps {
  post: {
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
  };
  onDelete?: () => void;
  onLikeUpdate?: () => void;
}

const PostCard = ({ post, onDelete, onLikeUpdate }: PostCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!user || isLiking) return;
    setIsLiking(true);

    try {
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        setIsLiked(false);
        setLikesCount((prev) => prev - 1);
      } else {
        await supabase
          .from('likes')
          .insert({ post_id: post.id, user_id: user.id });
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }
      onLikeUpdate?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update like",
        variant: "destructive",
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    try {
      await supabase.from('posts').delete().eq('id', post.id);
      toast({
        title: "Post deleted",
        description: "Your post has been removed.",
      });
      onDelete?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not delete post",
        variant: "destructive",
      });
    }
  };

  const initials = post.profile?.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || post.profile?.username?.[0]?.toUpperCase() || '?';

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-soft animate-fade-in">
      <div className="flex items-start gap-3">
        <Avatar className="w-11 h-11 ring-2 ring-primary/10">
          <AvatarImage src={post.profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-foreground">
                {post.profile?.display_name || post.profile?.username}
              </span>
              <span className="text-muted-foreground text-sm ml-2">
                @{post.profile?.username}
              </span>
              <span className="text-muted-foreground text-sm ml-2">·</span>
              <span className="text-muted-foreground text-sm ml-2">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
            {user?.id === post.user_id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <p className="mt-2 text-foreground whitespace-pre-wrap">{post.content}</p>

          {post.image_url && (
            <img
              src={post.image_url}
              alt="Post"
              className="mt-3 rounded-xl max-h-96 w-full object-cover"
            />
          )}

          <div className="flex items-center gap-6 mt-4">
            <button
              onClick={handleLike}
              disabled={!user}
              className={`flex items-center gap-2 transition-all group ${
                isLiked ? 'text-accent' : 'text-muted-foreground hover:text-accent'
              }`}
            >
              <Heart
                className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                  isLiked ? 'fill-current animate-bounce-soft' : ''
                }`}
              />
              <span className="text-sm font-medium">{likesCount}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
            >
              <MessageCircle className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="text-sm font-medium">{post.comments_count}</span>
            </button>
          </div>
        </div>
      </div>

      {showComments && (
        <CommentSection postId={post.id} />
      )}
    </div>
  );
};

export default PostCard;
