import { supabase } from './supabaseClient';

export interface SendNotificationResult {
  sentTo: number;
  totalDevices: number;
}

/**
 * Broadcasts a push notification to every device registered via
 * pushService.ts. The Edge Function itself re-verifies the caller is a
 * real admin using their own session — this client-side call is not the
 * security boundary, just the trigger.
 */
export async function sendBroadcastNotification(title: string, body: string): Promise<SendNotificationResult> {
  const { data, error } = await supabase.functions.invoke('send-notification', {
    body: { title, body },
  });

  if (error) {
    throw new Error(data?.error || error.message || 'Failed to send notification.');
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return data as SendNotificationResult;
}
