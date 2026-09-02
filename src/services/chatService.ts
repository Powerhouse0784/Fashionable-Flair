import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

/**
 * Sends a message to the Gemini-backed chat Edge Function. Never talks to
 * Gemini directly — the API key lives only on the server side (see
 * supabase/functions/chat/index.ts and CHATBOT_SETUP.md).
 */
export async function sendChatMessage(message: string, history: ChatMessage[]): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error('Chat isn\u2019t set up yet — see CHATBOT_SETUP.md.');
  }

  const { data, error } = await supabase.functions.invoke('chat', {
    body: { message, history },
  });

  if (error) {
    // Log the real error to the console — the message shown in the chat
    // bubble stays generic (a shopper doesn't need deploy details), but
    // whoever's debugging this from devtools/logs gets the actual cause:
    // most often the "chat" Edge Function hasn't been deployed yet, or
    // GEMINI_API_KEY hasn't been set — see CHATBOT_SETUP.md steps 3–4.
    console.error('Chat function invoke failed (check: is the "chat" Edge Function deployed? Is GEMINI_API_KEY set?):', error);
    throw new Error('The assistant is unavailable right now — please try again shortly.');
  }
  if (data?.error) {
    console.error('Chat function returned an error:', data.error);
    throw new Error(data.error);
  }
  if (!data?.reply) {
    throw new Error('No response received.');
  }

  return data.reply as string;
}
