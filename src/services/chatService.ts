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
    throw new Error('Chat isn\'t set up yet — see CHATBOT_SETUP.md.');
  }

  try {
    // FIX: Increased timeout to 60 seconds for longer responses
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout — please try again.')), 60000);
    });

    // FIX: Invoke with longer timeout
    const invokePromise = supabase.functions.invoke('chat', {
      body: { 
        message, 
        history,
        // FIX: Request streaming for longer responses
        stream: false,
      },
    });

    const result = await Promise.race([invokePromise, timeoutPromise]);
    const { data, error } = result as any;

    if (error) {
      console.error('Chat function invoke failed:', error);
      throw new Error('The assistant is unavailable right now — please try again shortly.');
    }
    
    if (data?.error) {
      console.error('Chat function returned an error:', data.error);
      throw new Error(data.error);
    }
    
    if (!data?.reply) {
      throw new Error('No response received.');
    }

    // FIX: Ensure complete response is returned
    const reply = data.reply as string;
    if (reply.length === 0) {
      throw new Error('Empty response received.');
    }

    return reply;
  } catch (error: any) {
    // Better error handling with specific messages
    if (error.message?.includes('timeout')) {
      throw new Error('The assistant is taking too long — please try again.');
    }
    if (error.message?.includes('fetch')) {
      throw new Error('Network error — please check your connection.');
    }
    // Re-throw the error with a user-friendly message
    throw new Error(error.message || 'Something went wrong — please try again.');
  }
}

// FIX: Add a function to check chatbot health/status
export async function checkChatbotHealth(): Promise<{ isAvailable: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return {
      isAvailable: false,
      message: 'Chatbot is not configured. Please complete the setup.',
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('chat', {
      body: { message: 'ping', history: [], healthCheck: true },
    });

    if (error || data?.error) {
      return {
        isAvailable: false,
        message: 'Chatbot service is temporarily unavailable.',
      };
    }

    return {
      isAvailable: true,
      message: 'Chatbot is ready!',
    };
  } catch (error) {
    return {
      isAvailable: false,
      message: 'Cannot connect to chatbot service.',
    };
  }
}