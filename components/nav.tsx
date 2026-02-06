'use client';

/**
 * Navigation Component
 * 
 * Main navigation bar with user menu, theme toggle, and navigation links.
 * Responsive design with mobile menu support.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { signOut } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, BookOpen, Home, User, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { ROUTES } from '@/lib/constants';

function subscribe() {
  return () => {};
}
function getServerSnapshot() {
  return false;
}
function getClientSnapshot() {
  return true;
}

export function Nav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  const handleSignOut = async () => {
    await signOut();
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6" />
            <span className="font-bold text-xl">QuoteVault</span>
          </Link>

          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              <Link href={ROUTES.home}>
                <Button
                  variant={isActive(ROUTES.home) ? 'secondary' : 'ghost'}
                  size="sm"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Link href={ROUTES.favorites}>
                <Button
                  variant={isActive(ROUTES.favorites) ? 'secondary' : 'ghost'}
                  size="sm"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Favorites
                </Button>
              </Link>
              <Link href={ROUTES.collections}>
                <Button
                  variant={isActive(ROUTES.collections) ? 'secondary' : 'ghost'}
                  size="sm"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Collections
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          )}

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback>
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.user_metadata?.full_name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href={ROUTES.profile}>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href={ROUTES.login}>
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href={ROUTES.signup}>
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

