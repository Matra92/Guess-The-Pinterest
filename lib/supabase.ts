import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to subscribe to realtime channels
export function subscribeToPresence(channelName: string, callback: (payload: any) => void) {
  const channel = supabase.channel(channelName, {
    config: {
      presence: {
        key: 'player',
      },
    },
  });
  channel.on('broadcast', { event: 'player_update' }, (payload) => {
    callback(payload);
  });
  channel.subscribe();
  return channel;
}