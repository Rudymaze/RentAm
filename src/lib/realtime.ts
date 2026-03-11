import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribe to new inquiries for a user (landlord inbox).
 * Returns an unsubscribe function.
 */
export function subscribeToInquiries(
  userId: string,
  onNewInquiry: (payload: Record<string, unknown>) => void
): () => void {
  const supabase = createClient();
  const channel: RealtimeChannel = supabase
    .channel(`inquiries:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'inquiries',
        filter: `recipient_id=eq.${userId}`,
      },
      (payload) => onNewInquiry(payload.new as Record<string, unknown>)
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

/**
 * Subscribe to new replies on a specific inquiry.
 * Returns an unsubscribe function.
 */
export function subscribeToInquiryResponses(
  inquiryId: string,
  onNewResponse: (payload: Record<string, unknown>) => void
): () => void {
  const supabase = createClient();
  const channel: RealtimeChannel = supabase
    .channel(`inquiry-responses:${inquiryId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'inquiry_responses',
        filter: `inquiry_id=eq.${inquiryId}`,
      },
      (payload) => onNewResponse(payload.new as Record<string, unknown>)
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
