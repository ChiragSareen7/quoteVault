
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile } from '@/lib/actions/profile';
import { QUERY_KEYS, ACCENT_COLORS, FONT_SIZES, THEME_PREFERENCES } from '@/lib/constants';
import { Nav } from '@/components/nav';
import { Loader2, User, Palette, Type, Bell } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import type { ThemePreference, AccentColor, FontSize } from '@/types/database';

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [accentColor, setAccentColor] = useState<AccentColor>('blue');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [notificationTime, setNotificationTime] = useState('09:00');

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.profile.current(),
    queryFn: getProfile,
  });

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile.current() });
      toast.success('Settings saved');
      // Apply theme changes immediately
      if (themePreference !== 'system') {
        setTheme(themePreference);
      }
      // Apply accent color
      document.documentElement.setAttribute('data-accent', accentColor);
      // Apply font size
      document.documentElement.setAttribute('data-font-size', fontSize);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update settings');
    },
  });

  useEffect(() => {
    if (data?.profile) {
      const profile = data.profile;
      setFullName(profile.full_name || '');
      setThemePreference(profile.theme_preference);
      setAccentColor(profile.accent_color);
      setFontSize(profile.font_size);
      setNotificationTime(profile.notification_time || '09:00');

      // Apply settings
      if (profile.theme_preference !== 'system') {
        setTheme(profile.theme_preference);
      }
      document.documentElement.setAttribute('data-accent', profile.accent_color);
      document.documentElement.setAttribute('data-font-size', profile.font_size);
    }
  }, [data, setTheme]);

  const handleSave = () => {
    updateMutation.mutate({
      full_name: fullName.trim() || undefined,
      theme_preference: themePreference,
      accent_color: accentColor,
      font_size: fontSize,
      notification_time: notificationTime || undefined,
    });
  };

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

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Profile & Settings</h1>

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
                  You'll receive a notification with the quote of the day at this time.
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
      </main>
    </div>
  );
}

