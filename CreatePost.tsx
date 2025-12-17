import { useState } from 'react';
import { ImagePlus, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreatePostProps {
  onPostCreated: () => void;
  userProfile?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const CreatePost = ({ onPostCreated, userProfile }: CreatePostProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim() || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
        });

      if (error) throw error;
      setContent('');
      toast({
        title: "Posted!",
        description: "Your post is now live.",
      });
      onPostCreated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not create post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initials = userProfile?.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || userProfile?.username?.[0]?.toUpperCase() || '?';

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-soft">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <Avatar className="w-11 h-11 ring-2 ring-primary/10">
            <AvatarImage src={userProfile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening?"
              className="border-0 bg-transparent resize-none text-lg placeholder:text-muted-foreground focus-visible:ring-0 p-0 min-h-[60px]"
              maxLength={500}
            />

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-primary hover:bg-primary/10"
                >
                  <ImagePlus className="w-5 h-5" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {content.length}/500
                </span>
              </div>

              <Button
                type="submit"
                disabled={!content.trim() || loading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5"
              >
                {loading ? (
                  'Posting...'
                ) : (
                  <>
                    Post <Send className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
