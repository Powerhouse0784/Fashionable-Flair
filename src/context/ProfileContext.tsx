import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { useAuth } from './AuthContext';

/** The device's own local profile — used whenever nobody is signed in.
 * This key's name and shape predate accounts entirely; kept as-is so
 * nothing here needs a migration for existing installs. */
const GUEST_KEY = '@fashionable_flair/profile';
/** One of these per signed-in account this device has ever used, so two
 * different accounts logging in on the same phone never see each other's
 * cached name/bio/avatar even for a moment before the network fetch below
 * confirms it. */
const accountKey = (userId: string) => `@fashionable_flair/profile:account:${userId}`;

interface EditableProfile {
  name: string;
  bio: string;
  avatarIndex: number | null;
}

interface StoredGuestProfile extends EditableProfile {
  /** ISO date this device's guest profile was first created — shown as
   * "Member since ...". Only meaningful for the guest identity; a signed-in
   * account uses its real account-creation date instead (see below). */
  memberSince: string;
}

interface ProfileContextValue extends EditableProfile {
  memberSince: string;
  isLoaded: boolean;
  /** True while nobody is signed in — i.e. this is the local guest profile,
   * not an account's. Lets the UI label which one is showing. */
  isGuest: boolean;
  updateProfile: (patch: Partial<EditableProfile>) => void;
}

const GUEST_DEFAULTS: StoredGuestProfile = { name: '', bio: '', avatarIndex: null, memberSince: '' };
const ACCOUNT_DEFAULTS: EditableProfile = { name: '', bio: '', avatarIndex: null };

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

/**
 * Two entirely separate profiles, not one shared slot: the guest profile
 * (local-only, always sitting in AsyncStorage under GUEST_KEY) and, only
 * while signed in, that account's profile (cached locally per-account-id
 * and backed by the `profiles` table). Which one is active follows the
 * session automatically.
 *
 * This separation is deliberate — it used to be a single shared record,
 * so signing in would load the account's name/bio/avatar on top of the
 * guest's, and editing anything while signed in permanently overwrote the
 * guest copy too. Signing back out then left the *account's* details
 * showing under "Guest", forever. Now: sign in and the account's own
 * profile appears (blank the first time, until they fill it in); sign out
 * and the guest profile is exactly as it was before they ever logged in,
 * untouched by anything edited while signed in.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const accountCreatedAt = session?.user?.created_at ?? null;

  const [guestProfile, setGuestProfile] = useState<StoredGuestProfile>(GUEST_DEFAULTS);
  const [guestLoaded, setGuestLoaded] = useState(false);

  const [accountProfile, setAccountProfile] = useState<EditableProfile>(ACCOUNT_DEFAULTS);
  const [accountLoaded, setAccountLoaded] = useState(false);

  // Guest profile: loaded once, and from then on is only ever touched by
  // updateProfile while signed out (see below) — nothing here reacts to
  // login/logout, which is exactly the point.
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(GUEST_KEY);
        const parsed: Partial<StoredGuestProfile> = stored ? JSON.parse(stored) : {};
        const memberSince = parsed.memberSince || new Date().toISOString();
        const next: StoredGuestProfile = { ...GUEST_DEFAULTS, ...parsed, memberSince };
        setGuestProfile(next);
        if (!stored || !parsed.memberSince) {
          AsyncStorage.setItem(GUEST_KEY, JSON.stringify(next)).catch(() => {});
        }
      } catch (err) {
        console.warn('Failed to load guest profile from storage', err);
      } finally {
        setGuestLoaded(true);
      }
    })();
  }, []);

  // Account profile: (re)loaded every time the signed-in user changes.
  // Local cache first (instant, works offline), then the `profiles` table
  // as the authoritative source. A brand-new account — no row yet — starts
  // from a clean blank profile rather than inheriting whatever the guest
  // happened to have typed on this device.
  useEffect(() => {
    if (!userId) {
      setAccountProfile(ACCOUNT_DEFAULTS);
      setAccountLoaded(false);
      return;
    }
    let cancelled = false;
    setAccountLoaded(false);

    (async () => {
      try {
        const cached = await AsyncStorage.getItem(accountKey(userId));
        if (cached && !cancelled) setAccountProfile({ ...ACCOUNT_DEFAULTS, ...JSON.parse(cached) });
      } catch (err) {
        console.warn('Failed to load cached account profile', err);
      }

      if (!isSupabaseConfigured) {
        if (!cancelled) setAccountLoaded(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, bio, avatar_index')
          .eq('user_id', userId)
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          console.warn('Failed to load synced profile', error.message);
        } else if (data) {
          const next: EditableProfile = { name: data.name ?? '', bio: data.bio ?? '', avatarIndex: data.avatar_index ?? null };
          setAccountProfile(next);
          AsyncStorage.setItem(accountKey(userId), JSON.stringify(next)).catch(() => {});
        }
        // No row yet: leave the blank ACCOUNT_DEFAULTS in place. It's
        // created for real the moment they actually edit something (see
        // updateProfile) rather than pre-seeded here with a guess.
      } catch (err) {
        console.warn('Profile sync failed', err);
      } finally {
        if (!cancelled) setAccountLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const updateProfile = (patch: Partial<EditableProfile>) => {
    if (userId) {
      setAccountProfile((prev) => {
        const next = { ...prev, ...patch };
        AsyncStorage.setItem(accountKey(userId), JSON.stringify(next)).catch((err) =>
          console.warn('Failed to persist account profile', err)
        );
        if (isSupabaseConfigured) {
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
    } else {
      setGuestProfile((prev) => {
        const next = { ...prev, ...patch };
        AsyncStorage.setItem(GUEST_KEY, JSON.stringify(next)).catch((err) =>
          console.warn('Failed to persist guest profile', err)
        );
        return next;
      });
    }
  };

  const value = useMemo<ProfileContextValue>(() => {
    if (userId) {
      return {
        ...accountProfile,
        memberSince: accountCreatedAt ?? '',
        isLoaded: accountLoaded,
        isGuest: false,
        updateProfile,
      };
    }
    return {
      ...guestProfile,
      isLoaded: guestLoaded,
      isGuest: true,
      updateProfile,
    };
  }, [userId, accountProfile, accountLoaded, accountCreatedAt, guestProfile, guestLoaded]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within a ProfileProvider');
  return ctx;
}
