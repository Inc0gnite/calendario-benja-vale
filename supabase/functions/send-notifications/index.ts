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
        users!user_id(id, name, email, secret_token)
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
          html: buildEmailTemplate(event, user),
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

    // notified=true evita doble envio si el cron corre dos veces (decision D-10)
    await supabase.from('events').update({ notified: true }).eq('id', event.id)
  }

  return new Response(
    JSON.stringify({ ok: true, date, eventsProcessed: events?.length ?? 0, emailsSent: sent }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})

// ─── Design tokens ────────────────────────────────────────────────────────────

const USER_COLOR: Record<string, string> = {
  Benja: '#5DCAA5',
  Vale: '#AFA9EC',
}

const URGENCY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  alta:  { label: 'Urgencia alta',  color: '#C0392B', bg: '#FEF2F2' },
  media: { label: 'Urgencia media', color: '#A0522D', bg: '#FFF8EE' },
  baja:  { label: 'Urgencia baja',  color: '#2E7D50', bg: '#F0FDF6' },
}

const REMINDER_LABEL: Record<string, string> = {
  friday_before: 'viernes anterior al evento',
  day_before:    '1 día antes del evento',
  week_before:   '1 semana antes del evento',
  month_before:  '1 mes antes del evento',
  custom:        'fecha personalizada',
}

// ─── Email template ───────────────────────────────────────────────────────────

function buildEmailTemplate(
  event: Record<string, any>,
  recipient: { name: string; secret_token: string }
): string {
  const appUrl = Deno.env.get('APP_URL') ?? 'https://tu-app.vercel.app'
  const userColor = USER_COLOR[recipient.name] ?? '#5DCAA5'
  const urgency = URGENCY_CONFIG[event.urgency] ?? URGENCY_CONFIG.media
  const calendarUrl = `${appUrl}/calendar?token=${recipient.secret_token}&date=${event.event_date}`

  const dateObj = new Date(event.event_date + 'T12:00:00')
  const dayNum = dateObj.getDate().toString()
  const monthShort = dateObj
    .toLocaleDateString('es-AR', { month: 'short' })
    .toUpperCase()
    .replace('.', '')
  const fullDate = dateObj.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const timeSection = event.event_time
    ? `<td style="width:1px;padding:0 20px;vertical-align:middle;">
         <div style="width:1px;height:40px;background:#E4E4E7;"></div>
       </td>
       <td style="vertical-align:middle;">
         <p style="margin:0;color:#A1A1AA;font-size:10px;font-weight:700;
           text-transform:uppercase;letter-spacing:0.1em;">Hora</p>
         <p style="margin:4px 0 0;color:#18181B;font-size:22px;font-weight:800;
           letter-spacing:-0.02em;line-height:1;">${event.event_time.slice(0, 5)}</p>
         <p style="margin:1px 0 0;color:#A1A1AA;font-size:11px;font-weight:500;">hs</p>
       </td>`
    : ''

  const descSection = event.description
    ? `<tr>
         <td style="background:#FFFFFF;padding:0 36px 28px;">
           <table width="100%" cellpadding="0" cellspacing="0">
             <tr>
               <td style="border-left:3px solid ${userColor};padding:2px 0 2px 16px;">
                 <p style="margin:0 0 5px;color:#A1A1AA;font-size:10px;font-weight:700;
                   text-transform:uppercase;letter-spacing:0.1em;">Descripción</p>
                 <p style="margin:0;color:#52525B;font-size:14px;line-height:1.7;">${event.description}</p>
               </td>
             </tr>
           </table>
         </td>
       </tr>`
    : ''

  const participants: any[] = event.event_participants ?? []
  const participantChips = participants
    .map((p: any) => {
      const name = p.users?.name ?? ''
      const color = USER_COLOR[name] ?? '#5DCAA5'
      return `<td style="padding-right:10px;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:8px;height:8px;background:${color};border-radius:50%;
              vertical-align:middle;"></td>
            <td style="padding-left:7px;color:#3F3F46;font-size:13px;font-weight:600;
              vertical-align:middle;">${name}</td>
          </tr>
        </table>
      </td>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Recordatorio: ${event.title}</title>
</head>
<body style="margin:0;padding:0;background:#EEECEA;-webkit-font-smoothing:antialiased;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" role="presentation"
  style="background:#EEECEA;">
<tr><td align="center" style="padding:44px 16px 60px;">

  <table width="540" cellpadding="0" cellspacing="0" role="presentation"
    style="max-width:540px;width:100%;border-radius:20px;overflow:hidden;
      box-shadow:0 2px 6px rgba(0,0,0,0.05),0 20px 60px rgba(0,0,0,0.1);">

    <!-- Accent stripe -->
    <tr>
      <td height="4" bgcolor="${userColor}"
        style="font-size:0;line-height:0;background:${userColor};">&nbsp;</td>
    </tr>

    <!-- Header bar -->
    <tr>
      <td bgcolor="#FFFFFF" style="background:#FFFFFF;padding:20px 32px 18px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td width="7" height="7"
                    style="width:7px;height:7px;background:${userColor};border-radius:50%;
                      vertical-align:middle;"></td>
                  <td style="padding-left:8px;color:#A1A1AA;font-size:10px;font-weight:700;
                    letter-spacing:0.12em;text-transform:uppercase;vertical-align:middle;">
                    Calendario Benja &amp; Vale
                  </td>
                </tr>
              </table>
            </td>
            <td align="right">
              <span style="background:${urgency.bg};color:${urgency.color};font-size:10px;
                font-weight:700;padding:4px 11px;border-radius:20px;letter-spacing:0.06em;
                text-transform:uppercase;">${urgency.label}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Hero section -->
    <tr>
      <td bgcolor="#FFFFFF" style="background:#FFFFFF;padding:6px 36px 32px;">
        <p style="margin:0 0 10px;color:#A1A1AA;font-size:10px;font-weight:700;
          text-transform:uppercase;letter-spacing:0.14em;">Recordatorio</p>
        <h1 style="margin:0 0 28px;color:#18181B;font-size:28px;font-weight:800;
          line-height:1.2;letter-spacing:-0.03em;">${event.title}</h1>

        <!-- Date card -->
        <table cellpadding="0" cellspacing="0" role="presentation"
          style="background:#F7F6F4;border-radius:14px;">
          <tr>
            <td style="padding:18px 22px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Calendar icon block -->
                  <td style="vertical-align:top;">
                    <table cellpadding="0" cellspacing="0"
                      style="background:#18181B;border-radius:10px;overflow:hidden;width:52px;">
                      <tr>
                        <td height="22"
                          style="background:${userColor};padding:4px 0 3px;text-align:center;">
                          <span style="color:#18181B;font-size:9px;font-weight:800;
                            letter-spacing:0.15em;text-transform:uppercase;">${monthShort}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0 6px;text-align:center;">
                          <span style="color:#FFFFFF;font-size:26px;font-weight:800;
                            letter-spacing:-0.02em;line-height:1;">${dayNum}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Date text -->
                  <td style="padding-left:16px;vertical-align:middle;">
                    <p style="margin:0;color:#A1A1AA;font-size:10px;font-weight:700;
                      text-transform:uppercase;letter-spacing:0.1em;">Fecha del evento</p>
                    <p style="margin:5px 0 0;color:#18181B;font-size:14px;font-weight:600;
                      text-transform:capitalize;line-height:1.35;">${fullDate}</p>
                  </td>
                  ${timeSection}
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${descSection}

    <!-- Divider -->
    <tr>
      <td bgcolor="#FFFFFF" style="background:#FFFFFF;padding:0 36px;">
        <div style="height:1px;background:#F0EFED;font-size:0;"></div>
      </td>
    </tr>

    <!-- Participants -->
    <tr>
      <td bgcolor="#FFFFFF" style="background:#FFFFFF;padding:20px 36px 16px;">
        <p style="margin:0 0 10px;color:#A1A1AA;font-size:10px;font-weight:700;
          text-transform:uppercase;letter-spacing:0.1em;">Participantes</p>
        <table cellpadding="0" cellspacing="0">
          <tr>${participantChips}</tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td bgcolor="#FFFFFF" style="background:#FFFFFF;padding:20px 36px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <a href="${calendarUrl}"
                style="display:inline-block;background:${userColor};color:#18181B;
                  font-size:14px;font-weight:700;text-decoration:none;
                  padding:14px 36px;border-radius:12px;letter-spacing:0.01em;">
                Ver en el Calendario &nbsp;&rarr;
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background:#F2F0EE;padding:18px 36px 22px;
        border-top:1px solid #E8E6E3;">
        <p style="margin:0;color:#A1A1AA;font-size:11px;text-align:center;
          line-height:1.75;">
          Recordatorio automático &mdash; configurado ${REMINDER_LABEL[event.reminder_type] ?? ''}<br>
          <span style="color:#C4C2C0;">Hola ${recipient.name} &middot; Calendario Benja &amp; Vale</span>
        </p>
      </td>
    </tr>

  </table>

</td></tr>
</table>
</body>
</html>`
}
