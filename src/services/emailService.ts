import { supabase, isSupabaseConfigured } from './supabaseClient';

/** Submits the Contact Us form — sent via Brevo, proxied through a Supabase
 *  Edge Function so the Brevo key never reaches the client. */
export async function submitContactForm(name: string, email: string, message: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('The contact form isn\u2019t set up yet — see BREVO_SETUP.md.');
  }
  const { data, error } = await supabase.functions.invoke('contact-form', {
    body: { name, email, message },
  });
  if (error) throw new Error('Could not send your message right now — please try again shortly.');
  if (data?.error) throw new Error(data.error);
}

/** Subscribes an email for new-arrival updates via Brevo. */
export async function subscribeToUpdates(email: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Signup isn\u2019t set up yet — see BREVO_SETUP.md.');
  }
  const { data, error } = await supabase.functions.invoke('subscribe', {
    body: { email },
  });
  if (error) throw new Error('Could not subscribe right now — please try again shortly.');
  if (data?.error) throw new Error(data.error);
}
