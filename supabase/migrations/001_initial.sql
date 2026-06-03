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
