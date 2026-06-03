import { createClient } from 'npm:@supabase/supabase-js@2'
import nodemailer from 'npm:nodemailer@6'

const SENDER_EMAIL = 'sk4sher@gmail.com'
const SENDER_NAME = 'Calendario Benja & Vale'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SENDER_EMAIL,
    pass: Deno.env.get('GMAIL_APP_PASSWORD'),
  },
})

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const body = await req.json().catch(() => ({}))
  const date: string = body.date ?? new Date().toISOString().split('T')[0]

  const { data: events, error } = await supabase
    .from('events')
    .select(`
      *,
      event_participants!event_id(
        user_id,
        users!user_id(id, name, email)
      )
    `)
    .eq('reminder_date', date)
    .eq('notified', false)

  if (error) {
    console.error('DB error:', error)
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let sent = 0

  for (const event of events ?? []) {
    for (const participant of event.event_participants ?? []) {
      const user = participant.users
      if (!user?.email) continue

      try {
        await transporter.sendMail({
          from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
          to: user.email,
          subject: `Recordatorio: ${event.title}`,
          html: buildEmailTemplate(event, user.name),
        })

        await supabase.from('notification_logs').insert({
          event_id: event.id,
          user_id: participant.user_id,
          status: 'sent',
        })
        sent++
      } catch (err) {
        console.error(`Email failed for ${user.email}:`, err)
        await supabase.from('notification_logs').insert({
          event_id: event.id,
          user_id: participant.user_id,
          status: 'failed',
        })
      }
    }

    // notified=true evita doble envio si cron corre dos veces (D-10)
    await supabase.from('events').update({ notified: true }).eq('id', event.id)
  }

  return new Response(
    JSON.stringify({ ok: true, date, eventsProcessed: events?.length ?? 0, emailsSent: sent }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})

const URGENCY_LABEL: Record<string, string> = {
  alta: 'Alta 🔴',
  media: 'Media 🟡',
  baja: 'Baja 🟢',
}

const REMINDER_LABEL: Record<string, string> = {
  friday_before: 'viernes anterior',
  day_before: '1 día antes',
  week_before: '1 semana antes',
  month_before: '1 mes antes',
  custom: 'fecha personalizada',
}

function buildEmailTemplate(event: Record<string, any>, recipientName: string): string {
  const eventDate = new Date(event.event_date + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const timeRow = event.event_time
    ? `<tr>
        <td style="color:#888;font-size:13px;padding:5px 0;width:90px;vertical-align:top;">Hora</td>
        <td style="color:#1A1A1A;font-size:13px;padding:5px 0;font-weight:500;">${event.event_time.slice(0, 5)}</td>
       </tr>`
    : ''

  const descRow = event.description
    ? `<tr>
        <td style="color:#888;font-size:13px;padding:5px 0;vertical-align:top;">Notas</td>
        <td style="color:#1A1A1A;font-size:13px;padding:5px 0;">${event.description}</td>
       </tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F5F0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F5F0;padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:16px;overflow:hidden;max-width:480px;width:100%;">

        <tr>
          <td style="background:#5DCAA5;padding:20px 24px;text-align:center;">
            <p style="margin:0;color:#1A1A1A;font-family:system-ui,sans-serif;font-size:12px;
              font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
              Calendario Benja &amp; Vale
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 24px;font-family:system-ui,sans-serif;">
            <p style="margin:0 0 8px;color:#888;font-size:14px;">Hola ${recipientName} 👋</p>
            <h2 style="margin:0 0 24px;color:#1A1A1A;font-size:22px;font-weight:700;line-height:1.3;">
              ${event.title}
            </h2>
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#F8F5F0;border-radius:12px;">
              <tr><td style="padding:16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#888;font-size:13px;padding:5px 0;width:90px;vertical-align:top;">Fecha</td>
                    <td style="color:#1A1A1A;font-size:13px;padding:5px 0;font-weight:500;text-transform:capitalize;">${eventDate}</td>
                  </tr>
                  ${timeRow}
                  <tr>
                    <td style="color:#888;font-size:13px;padding:5px 0;vertical-align:top;">Urgencia</td>
                    <td style="color:#1A1A1A;font-size:13px;padding:5px 0;">${URGENCY_LABEL[event.urgency] ?? event.urgency}</td>
                  </tr>
                  ${descRow}
                </table>
              </td></tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 24px 24px;text-align:center;font-family:system-ui,sans-serif;">
            <p style="margin:0;color:#bbb;font-size:11px;">
              Recordatorio automático · configurado: ${REMINDER_LABEL[event.reminder_type] ?? event.reminder_type}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
