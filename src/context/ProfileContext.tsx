import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@fashionable_flair/profile';

interface StoredProfile {
  name: string;
  bio: string;
  avatarIndex: number | null;
  /** ISO date this device's profile was first created — used to show
   * "Member since ..." without needing any real account system. */
  memberSince: string;
}

interface ProfileContextValue extends StoredProfile {
  isLoaded: boolean;
  updateProfile: (patch: Partial<Pick<StoredProfile, 'name' | 'bio' | 'avatarIndex'>>) => void;
}

const DEFAULTS: StoredProfile = { name: '', bio: '', avatarIndex: null, memberSince: '' };

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

/**
 * There's no customer-facing login (see AuthContext — that's admin-only),
 * so this is a purely local, on-device profile: a shopper can optionally
 * put a name, an avatar and a short line about themselves on their own
 * Profile tab. Nothing here is sent anywhere or shown to anyone else —
 * it's just AsyncStorage, same pattern as the wishlist and theme
 * preference, and it's the only "profile data" that actually exists in
 * this app.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<StoredProfile>(DEFAULTS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed: Partial<StoredProfile> = stored ? JSON.parse(stored) : {};
        const memberSince = parsed.memberSince || new Date().toISOString();
        const next: StoredProfile = { ...DEFAULTS, ...parsed, memberSince };
        setProfile(next);
        if (!stored || !parsed.memberSince) {
          // First run, or an older save from before memberSince existed —
          // write the filled-in version back so it's stable from here on.
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        }
      } catch (err) {
        console.warn('Failed to load profile from storage', err);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const updateProfile = (patch: Partial<Pick<StoredProfile, 'name' | 'bio' | 'avatarIndex'>>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((err) =>
        console.warn('Failed to persist profile', err)
      );
      return next;
    });
  };

  const value = useMemo(() => ({ ...profile, isLoaded, updateProfile }), [profile, isLoaded]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within a ProfileProvider');
  return ctx;
}
