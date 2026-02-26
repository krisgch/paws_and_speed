import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://pawsandspeed.app';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'noreply@pawsandspeed.app';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: Record<string, unknown>;
  old_record: Record<string, unknown> | null;
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('Resend error:', err);
  }
}

serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();
    const { record, old_record } = payload;

    if (payload.table !== 'registrations') {
      return new Response('ok', { status: 200 });
    }

    const newStatus = record.status as string;
    const oldStatus = old_record?.status as string | undefined;

    // Fetch event info
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('name, id, host_id')
      .eq('id', record.event_id as string)
      .single();

    if (!event) return new Response('ok', { status: 200 });

    // ── Receipt uploaded (pending_payment → pending_review) ──────────────────
    if (newStatus === 'pending_review' && oldStatus !== 'pending_review') {
      // Notify host
      const { data: hostProfile } = await supabaseAdmin
        .from('profiles')
        .select('email, display_name')
        .eq('id', event.host_id)
        .single();

      if (hostProfile?.email) {
        const link = `${SITE_URL}/host/events/${event.id}/registrations`;
        await sendEmail(
          hostProfile.email,
          `New registration to review — ${event.name}`,
          `<p>Hi ${hostProfile.display_name},</p>
           <p>A new registration receipt has been uploaded and is ready for review.</p>
           <p><a href="${link}">View registrations →</a></p>`
        );
      }
    }

    // ── Approved ─────────────────────────────────────────────────────────────
    if (newStatus === 'approved' && oldStatus !== 'approved') {
      const { data: competitorProfile } = await supabaseAdmin
        .from('profiles')
        .select('email, display_name')
        .eq('id', record.competitor_id as string)
        .single();

      if (competitorProfile?.email) {
        const link = `${SITE_URL}/events/${event.id}/live`;
        await sendEmail(
          competitorProfile.email,
          `Registration approved — ${event.name}`,
          `<p>Hi ${competitorProfile.display_name},</p>
           <p>Great news! Your registration for <strong>${event.name}</strong> has been approved.</p>
           <p><a href="${link}">Watch the live results →</a></p>`
        );
      }
    }

    // ── Rejected ──────────────────────────────────────────────────────────────
    if (newStatus === 'rejected' && oldStatus !== 'rejected') {
      const { data: competitorProfile } = await supabaseAdmin
        .from('profiles')
        .select('email, display_name')
        .eq('id', record.competitor_id as string)
        .single();

      if (competitorProfile?.email) {
        const note = record.review_note ? `<p>Note from host: ${record.review_note}</p>` : '';
        await sendEmail(
          competitorProfile.email,
          `Registration update — ${event.name}`,
          `<p>Hi ${competitorProfile.display_name},</p>
           <p>Unfortunately your registration for <strong>${event.name}</strong> was not approved at this time.</p>
           ${note}
           <p>Please contact the event host if you have questions.</p>`
        );
      }
    }

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('send-notification error:', err);
    return new Response('error', { status: 500 });
  }
});
