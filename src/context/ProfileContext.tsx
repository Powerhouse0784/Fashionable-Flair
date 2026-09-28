import React, { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { useAuth } from './AuthContext';

const STORAGE_KEY = '@fashionable_flair/profile';

interface StoredProfile {
  name: string;
  bio: string;
  avatarIndex: number | null;
  /** ISO date this device's profile was first created — used to show
   * "Member since ..." without needing any real account system. Stays
   * device-local even for signed-in accounts; it's a fun local stat, not
   * an account attribute. */
  memberSince: string;
}

interface ProfileContextValue extends StoredProfile {
  isLoaded: boolean;
  updateProfile: (patch: Partial<Pick<StoredProfile, 'name' | 'bio' | 'avatarIndex'>>) => void;
}

const DEFAULTS: StoredProfile = { name: '', bio: '', avatarIndex: null, memberSince: '' };

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

/**
 * Two layers, deliberately: AsyncStorage is always the local baseline —
 * works instantly for a guest, no network needed, exactly like before
 * this feature existed. When a shopper is signed in (see AuthContext),
 * the `profiles` table becomes the source of truth on top of that: on
 * login this pulls their saved name/bio/avatar down (or, the very first
 * time, pushes whatever they'd already set as a guest UP to create that
 * row), and every edit after that writes through to both places. Log out
 * and the local copy is still sitting there as a perfectly normal guest
 * profile — nothing is deleted.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [profile, setProfile] = useState<StoredProfile>(DEFAULTS);
  const [isLoaded, setIsLoaded] = useState(false);
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const syncedForUserId = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed: Partial<StoredProfile> = stored ? JSON.parse(stored) : {};
        const memberSince = parsed.memberSince || new Date().toISOString();
        const next: StoredProfile = { ...DEFAULTS, ...parsed, memberSince };
        setProfile(next);
        if (!stored || !parsed.memberSince) {
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        }
      } catch (err) {
        console.warn('Failed to load profile from storage', err);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // Runs once per login (guarded by syncedForUserId), after the local
  // load above has finished, so a first-time push up carries the real
  // local values rather than the transient DEFAULTS.
  useEffect(() => {
    if (!userId) {
      syncedForUserId.current = null;
      return;
    }
    if (!isSupabaseConfigured || !isLoaded || syncedForUserId.current === userId) return;
    syncedForUserId.current = userId;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, bio, avatar_index')
          .eq('user_id', userId)
          .maybeSingle();
        if (error) {
          console.warn('Failed to load synced profile', error.message);
          return;
        }
        if (data) {
          setProfile((prev) => {
            const next: StoredProfile = {
              name: data.name ?? '',
              bio: data.bio ?? '',
              avatarIndex: data.avatar_index ?? null,
              memberSince: prev.memberSince,
            };
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
            return next;
          });
        } else {
          const current = profileRef.current;
          const { error: upsertError } = await supabase
            .from('profiles')
            .upsert(
              { user_id: userId, name: current.name || null, bio: current.bio || null, avatar_index: current.avatarIndex },
              { onConflict: 'user_id' }
            );
          if (upsertError) console.warn('Failed to create synced profile', upsertError.message);
        }
      } catch (err) {
        console.warn('Profile sync failed', err);
      }
    })();
  }, [userId, isLoaded]);

  const updateProfile = (patch: Partial<Pick<StoredProfile, 'name' | 'bio' | 'avatarIndex'>>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((err) =>
        console.warn('Failed to persist profile', err)
      );
      if (userId && isSupabaseConfigured) {
        supabase
          .from('profiles')
          .upsert(
            { user_id: userId, name: next.name || null, bio: next.bio || null, avatar_index: next.avatarIndex },
            { onConflict: 'user_id' }
          )
          .then(({ error }: { error: { message: string } | null }) => {
            if (error) console.warn('Failed to sync profile', error.message);
          });
      }
      return next;
    });
  };

  const value = useMemo(() => ({ ...profile, isLoaded, updateProfile }), [profile, isLoaded, userId]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within a ProfileProvider');
  return ctx;
}
