import { useState } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserCardProps {
  profile: {
    id: string;
    user_id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  };
  isFollowing: boolean;
  onFollowChange?: () => void;
}

const UserCard = ({ profile, isFollowing: initialIsFollowing, onFollowChange }: UserCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    if (!user || loading) return;

    setLoading(true);
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', profile.user_id);
        setIsFollowing(false);
        toast({
          title: "Unfollowed",
          description: `You unfollowed @${profile.username}`,
        });
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: profile.user_id,
          });
        setIsFollowing(true);
        toast({
          title: "Following",
          description: `You're now following @${profile.username}`,
        });
      }
      onFollowChange?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update follow status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initials = profile.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || profile.username?.[0]?.toUpperCase() || '?';

  const isOwnProfile = user?.id === profile.user_id;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
      <Avatar className="w-12 h-12 ring-2 ring-primary/10">
        <AvatarImage src={profile.avatar_url || undefined} />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">
          {profile.display_name || profile.username}
        </p>
        <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>
      </div>

      {!isOwnProfile && user && (
        <Button
          onClick={handleFollow}
          disabled={loading}
          variant={isFollowing ? 'outline' : 'default'}
          size="sm"
          className={
            isFollowing
              ? 'border-border hover:border-destructive hover:text-destructive'
              : 'bg-primary hover:bg-primary/90'
          }
        >
          {isFollowing ? (
            <>
              <UserMinus className="w-4 h-4 mr-1" />
              Unfollow
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-1" />
              Follow
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default UserCard;
