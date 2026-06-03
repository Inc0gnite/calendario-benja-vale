# PROJECT DOSSIER FINAL
## Calendario Benja & Vale
**Versión:** PROJECT_BIBLE_FINAL · **Framework:** KIKAKU → TAKUMI → KENSETSU

---

## Executive Summary

Sistema de calendario web colaborativo para dos personas (Benja y Vale) que permite crear, editar y eliminar eventos con notificaciones automáticas por email. Acceso sin login mediante links secretos únicos. Diseño Dark Focus + Warm Cream que respeta la preferencia del sistema operativo. Stack 100% gratuito: Next.js en Vercel + Supabase + Gmail SMTP.

---

## 1. Project Overview

| Campo | Valor |
|---|---|
| **Nombre** | Calendario Benja & Vale |
| **Descripción** | App web colaborativa de calendario con notificaciones automáticas por email |
| **Estado** | Listo para construcción |
| **Fase actual** | KENSETSU aprobado → Implementación |
| **Última actualización** | Junio 2026 |

---

## 2. Business Context

### Problem Statement
Benja y Vale necesitan un espacio compartido para registrar eventos importantes y recibir recordatorios automáticos por email, sin depender de apps de terceros con cuentas y configuraciones complejas.

### Business Goals
- Calendario siempre accesible desde cualquier dispositivo sin instalar apps
- Notificaciones automáticas sin intervención manual
- Sin costos de operación

### Success Criteria
- Ambos usuarios pueden crear y editar eventos desde sus links
- Los emails llegan correctamente según el tipo de recordatorio configurado
- La app funciona en modo oscuro y claro según preferencia del sistema

### Constraints
- Costo: $0 (todo gratuito)
- Usuarios: solo Benja y Vale, no se necesita registro
- Notificaciones: solo por email

### Stakeholders / Users
| Persona | Email | Color | Link |
|---|---|---|---|
| Benja | b.vilchesf@gmail.com | Teal `#5DCAA5` | `/calendar?token=BENJA_TOKEN` |
| Vale | valegomezalania03@gmail.com | Purple `#AFA9EC` | `/calendar?token=VALE_TOKEN` |

---

## 3. KIKAKU Section

### Solución Recomendada
App web (Next.js) + base de datos (Supabase) + cron jobs (pg_cron) + email (Gmail SMTP). Sin login: autenticación por token secreto en URL.

### Stack Tecnológico
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Scheduler:** pg_cron (nativo en Supabase)
- **Email:** Nodemailer + Gmail SMTP (sk4sher@gmail.com)
- **Hosting:** Vercel (gratuito, conectado a GitHub)
- **Auth:** Token UUID en query param, validado por Row Level Security

### Arquitectura Conceptual
```
Benja/Vale (browser)
    ↓ link secreto con token
Next.js (Vercel)
    ↓ API REST
Supabase PostgreSQL
    ↓ pg_cron (diario 08:00)
Edge Function send-notifications
    ↓ Nodemailer SMTP
Gmail → b.vilchesf@gmail.com / valegomezalania03@gmail.com
```

---

## 4. TAKUMI Section

### Design Direction
**Dark Focus + Warm Cream** — modo oscuro como base (`#1A1A1A`), modo claro crema (`#F8F5F0`). El sistema operativo decide cuál mostrar.

### Design System Tokens

| Token | Modo oscuro | Modo claro |
|---|---|---|
| Fondo principal | `#1A1A1A` | `#F8F5F0` |
| Superficie card | `#242424` | `#FFFFFF` |
| Benja | `#5DCAA5` | `#5DCAA5` |
| Vale | `#AFA9EC` | `#AFA9EC` |
| Urgencia Alta | `#F09595` | `#F09595` |
| Urgencia Media | `#FAC775` | `#FAC775` |
| Urgencia Baja | `#C0DD97` | `#C0DD97` |
| Texto principal | `#E0E0E0` | `#1A1A1A` |
| Texto muted | `#888888` | `#888888` |

### Pantallas
1. **Vista principal** — Strip semanal + lista de eventos del día
2. **Formulario crear/editar** — Todos los campos del evento
3. **Vista detalle evento** — Info completa + botones editar/eliminar

### UX Decisions
- Stripe lateral de color en cada evento = persona responsable (lectura instantánea)
- Dots bajo cada día en el strip = densidad de eventos sin mostrar detalle
- Día actual destacado con fondo teal (color Benja como neutro de la app)

---

## 5. KENSETSU Section

### Database Schema

```sql
-- Usuarios (solo Benja y Vale)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  secret_token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Eventos
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  description TEXT,
  urgency TEXT CHECK (urgency IN ('alta', 'media', 'baja')) DEFAULT 'media',
  reminder_type TEXT CHECK (reminder_type IN (
    'friday_before', 'day_before', 'week_before', 'month_before', 'custom'
  )) DEFAULT 'friday_before',
  reminder_date DATE,
  notified BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participantes del evento
CREATE TABLE event_participants (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  PRIMARY KEY (event_id, user_id)
);

-- Log de notificaciones enviadas
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES users(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('sent', 'failed'))
);

-- Índices
CREATE INDEX idx_events_reminder_date ON events(reminder_date);
CREATE INDEX idx_events_notified ON events(notified);

-- Seed: insertar Benja y Vale
INSERT INTO users (name, email) VALUES
  ('Benja', 'b.vilchesf@gmail.com'),
  ('Vale', 'valegomezalania03@gmail.com');
```

### Lógica de reminder_date

```typescript
// lib/reminders.ts
export function calculateReminderDate(
  eventDate: Date,
  reminderType: string,
  customDate?: Date
): Date {
  const d = new Date(eventDate);
  switch (reminderType) {
    case 'day_before':
      d.setDate(d.getDate() - 1);
      return d;
    case 'week_before':
      d.setDate(d.getDate() - 7);
      return d;
    case 'month_before':
      d.setDate(d.getDate() - 30);
      return d;
    case 'friday_before':
      // Retrocede hasta el viernes anterior
      d.setDate(d.getDate() - 1);
      while (d.getDay() !== 5) d.setDate(d.getDate() - 1);
      return d;
    case 'custom':
      return customDate!;
    default:
      return d;
  }
}
```

### pg_cron — Query diaria

```sql
-- Activa en Supabase Dashboard → Database → Extensions → pg_cron
-- Luego en SQL Editor:
SELECT cron.schedule(
  'send-daily-notifications',
  '0 8 * * *',  -- Todos los días a las 08:00 UTC
  $$
    SELECT net.http_post(
      url := current_setting('app.edge_function_url') || '/send-notifications',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object('date', CURRENT_DATE::text)
    );
  $$
);
```

### Edge Function — send-notifications

```typescript
// supabase/functions/send-notifications/index.ts
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sk4sher@gmail.com',
    pass: Deno.env.get('GMAIL_APP_PASSWORD'),
  },
})

Deno.serve(async (req) => {
  const { date } = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Buscar eventos que deben notificar hoy
  const { data: events } = await supabase
    .from('events')
    .select(`
      *,
      event_participants(user_id, users(name, email))
    `)
    .eq('reminder_date', date)
    .eq('notified', false)

  for (const event of events ?? []) {
    for (const participant of event.event_participants) {
      const { name, email } = participant.users

      await transporter.sendMail({
        from: '"Calendario Benja & Vale" <sk4sher@gmail.com>',
        to: email,
        subject: `Recordatorio: ${event.title}`,
        html: buildEmailTemplate(event, name),
      })

      // Log del envío
      await supabase.from('notification_logs').insert({
        event_id: event.id,
        user_id: participant.user_id,
        status: 'sent',
      })
    }

    // Marcar como notificado
    await supabase
      .from('events')
      .update({ notified: true })
      .eq('id', event.id)
  }

  return new Response(JSON.stringify({ ok: true, sent: events?.length }))
})
```

### Variables de entorno (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
BENJA_SECRET_TOKEN=uuid-v4-generado
VALE_SECRET_TOKEN=uuid-v4-generado
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

---

## 6. Decision Log (completo)

| ID | Decisión | Razón | Owner |
|---|---|---|---|
| D-01 | Dark Focus + Warm Cream | Preferencia explícita del usuario | TAKUMI |
| D-02 | Benja=Teal, Vale=Purple | Distinción sin connotaciones de género | TAKUMI |
| D-03 | Vista semanal como principal | Más accionable para 2 personas | TAKUMI |
| D-04 | Dots bajo el día en strip | Comunica densidad sin mostrar detalle | TAKUMI |
| D-05 | Stripe lateral = persona | Lectura instantánea sin leer texto | TAKUMI |
| D-06 | Next.js App Router | Routing server-side, API routes, deploy trivial | KENSETSU |
| D-07 | pg_cron en Supabase | Elimina servicio externo, corre en la misma DB | KENSETSU |
| D-08 | Nodemailer + Gmail SMTP | Sin costo, cuenta disponible | KENSETSU |
| D-09 | Token en query param | Más simple para link directo en navegador | KENSETSU |
| D-10 | notified=true tras envío | Evita doble envío si cron corre dos veces | KENSETSU |

---

## 7. Risk Log (completo)

| ID | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| R-01 | prefers-color-scheme no soportado en algún browser | Baja | Bajo | Fallback a modo oscuro |
| R-02 | Formulario largo en pantallas pequeñas | Media | Medio | Scroll interno, campos ordenados por frecuencia |
| R-03 | Gmail bloquea envíos | Baja | Alto | App Password, límite diario muy bajo (2 emails) |
| R-04 | Token expuesto en historial del browser | Media | Medio | UUID v4 largo (36 chars), sin datos sensibles en URL |
| R-05 | pg_cron falla silenciosamente | Baja | Alto | Tabla notification_logs con status sent/failed |

---

## 8. Roadmap de Construcción

| Fase | Objetivo | Estimación |
|---|---|---|
| **Fase 1 — MVP** | Setup: Next.js + Supabase + deploy Vercel | ~2–3 hrs |
| **Fase 2 — Core** | Calendario + CRUD completo de eventos | ~4–6 hrs |
| **Fase 3 — Notificaciones** | pg_cron + Edge Function + Gmail | ~2–3 hrs |
| **Fase 4 — Pulido** | Validaciones, loading states, responsividad | ~1–2 hrs |
| **Total** | | **~9–14 hrs** |

---

## 9. Estructura del Proyecto

```
calendario-benja-vale/
├── app/
│   ├── page.tsx
│   ├── calendar/page.tsx
│   ├── event/
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
│   └── api/
│       ├── events/route.ts
│       └── events/[id]/route.ts
├── components/
│   ├── WeekStrip.tsx
│   ├── EventCard.tsx
│   ├── EventForm.tsx
│   └── ThemeProvider.tsx
├── lib/
│   ├── supabase.ts
│   ├── auth.ts
│   └── reminders.ts
├── supabase/
│   ├── migrations/001_initial.sql
│   └── functions/send-notifications/index.ts
└── .env.local
```

---

## 10. Configuración Previa al Desarrollo

### Gmail App Password (sk4sher@gmail.com)
1. Ir a **myaccount.google.com → Seguridad → Verificación en dos pasos** (debe estar activada)
2. Ir a **Contraseñas de aplicación**
3. Crear una nueva: nombre "Calendario Benja Vale"
4. Copiar la contraseña de 16 caracteres → guardar en `.env.local` como `GMAIL_APP_PASSWORD`

### Supabase
1. Crear nuevo proyecto en **supabase.com**
2. Copiar `URL` y `anon key` desde **Settings → API**
3. Ejecutar `migrations/001_initial.sql` en el **SQL Editor**
4. Activar extensión `pg_cron` en **Database → Extensions**
5. Activar extensión `pg_net` (para HTTP desde pg_cron)

### Vercel
1. Conectar repositorio GitHub en **vercel.com**
2. Agregar todas las variables de entorno en **Settings → Environment Variables**
3. Deploy automático en cada push a `main`

---

*PROJECT DOSSIER FINAL generado por el framework KIKAKU → TAKUMI → KENSETSU*
