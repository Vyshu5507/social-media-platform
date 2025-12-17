import { Link, useLocation } from 'react-router-dom';
import { Home, Users, User, LogOut, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const Sidebar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Users, label: 'Discover', path: '/discover' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border p-4 hidden lg:flex flex-col">
      <div className="flex items-center gap-2 px-3 mb-8">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Heart className="w-5 h-5 text-primary" />
        </div>
        <span className="text-xl font-bold text-foreground">Pulse</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <Button
          onClick={signOut}
          variant="ghost"
          className="justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </Button>
      )}
    </aside>
  );
};

export default Sidebar;
