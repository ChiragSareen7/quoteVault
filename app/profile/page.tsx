
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile } from '@/lib/actions/profile';
import { QUERY_KEYS, ACCENT_COLORS, FONT_SIZES, THEME_PREFERENCES } from '@/lib/constants';
import { Nav } from '@/components/nav';
import { Loader2, User, Palette, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import type { ThemePreference, AccentColor, FontSize } from '@/types/database';
import type { Profile } from '@/types/database';

function ProfileForm({
  profile,
  onSuccess,
}: {
  profile: Profile;
  onSuccess: () => void;
}) {
  const { setTheme } = useTheme();
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [themePreference, setThemePreference] = useState<ThemePreference>(profile.theme_preference);
  const [accentColor, setAccentColor] = useState<AccentColor>(profile.accent_color);
  const [fontSize, setFontSize] = useState<FontSize>(profile.font_size);
  const [notificationTime, setNotificationTime] = useState(profile.notification_time || '09:00');

  // Sync theme to next-themes when profile loads (external system)
  useEffect(() => {
    if (profile.theme_preference !== 'system') {
      setTheme(profile.theme_preference);
    }
  }, [profile.theme_preference, setTheme]);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      onSuccess();
      toast.success('Settings saved');
      if (themePreference !== 'system') {
        setTheme(themePreference);
      }
      document.documentElement.setAttribute('data-accent', accentColor);
      document.documentElement.setAttribute('data-font-size', fontSize);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update settings');
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      full_name: fullName.trim() || undefined,
      theme_preference: themePreference,
      accent_color: accentColor,
      font_size: fontSize,
      notification_time: notificationTime || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Profile Information</CardTitle>
          </div>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>Customize the look and feel of the app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={themePreference}
              onValueChange={(value) => setThemePreference(value as ThemePreference)}
            >
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THEME_PREFERENCES.map((pref) => (
                  <SelectItem key={pref.value} value={pref.value}>
                    {pref.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accent">Accent Color</Label>
            <Select
              value={accentColor}
              onValueChange={(value) => {
                setAccentColor(value as AccentColor);
                document.documentElement.setAttribute('data-accent', value);
              }}
            >
              <SelectTrigger id="accent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCENT_COLORS.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    {color.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fontSize">Font Size</Label>
            <Select
              value={fontSize}
              onValueChange={(value) => {
                setFontSize(value as FontSize);
                document.documentElement.setAttribute('data-font-size', value);
              }}
            >
              <SelectTrigger id="fontSize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZES.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Set your daily quote notification time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notificationTime">Daily Quote Time</Label>
            <Input
              id="notificationTime"
              type="time"
              value={notificationTime}
              onChange={(e) => setNotificationTime(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              You&apos;ll receive a notification with the quote of the day at this time.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          size="lg"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.profile.current(),
    queryFn: getProfile,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  const profile = data?.profile;
  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <main className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">No profile found.</p>
        </main>
      </div>
    );
  }

  // Apply theme/dom when profile is first available (sync from server)
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-accent', profile.accent_color);
    document.documentElement.setAttribute('data-font-size', profile.font_size);
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Profile & Settings</h1>
          <ProfileForm
            key={profile.id}
            profile={profile}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile.current() })}
          />
        </div>
      </main>
    </div>
  );
}

