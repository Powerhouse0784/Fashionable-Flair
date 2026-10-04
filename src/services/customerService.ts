import { supabase, isSupabaseConfigured } from './supabaseClient';

/** One row the admin Customers screen shows per signed-up shopper — merged
 * server-side (see supabase/functions/admin-list-customers) from Supabase
 * Auth (email, sign-up/last-login dates, blocked status) and the app's own
 * `profiles` table (display name, avatar, Premium dates, bio). */
export interface AdminCustomer {
  id: string;
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  name: string | null;
  bio: string | null;
  avatarIndex: number | null;
  isPremium: boolean;
  premiumSince: string | null;
  premiumExpiresAt: string | null;
  isBlocked: boolean;
  reviewCount: number;
}

/** Every signed-up customer, newest first. Requires an admin session —
 * the edge function itself re-checks that server-side, this is just the
 * client-side call. */
export async function fetchCustomers(): Promise<AdminCustomer[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.functions.invoke('admin-list-customers');
  if (error || data?.error) {
    throw new Error(data?.error || error?.message || 'Could not load customers.');
  }
  return (data?.customers as AdminCustomer[]) || [];
}

async function manageCustomer(action: 'block' | 'unblock' | 'delete', userId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('admin-manage-customer', {
    body: { action, userId },
  });
  if (error || data?.error) {
    throw new Error(data?.error || error?.message || 'Something went wrong.');
  }
}

/** Blocks sign-in indefinitely (a 100-year ban — Supabase has no literal
 * "forever") without deleting the account or its data. */
export const blockCustomer = (userId: string) => manageCustomer('block', userId);

export const unblockCustomer = (userId: string) => manageCustomer('unblock', userId);

/** Permanently deletes the auth user; `profiles` and `testimonials` rows
 * cascade-delete with it since both reference auth.users on delete cascade. */
export const deleteCustomer = (userId: string) => manageCustomer('delete', userId);
