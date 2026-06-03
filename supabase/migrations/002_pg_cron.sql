-- ============================================================
-- Fase 3: pg_cron + notificaciones diarias
-- ============================================================
-- Pre-requisitos en Supabase Dashboard → Database → Extensions:
--   ✓ Activar pg_cron
--   ✓ Activar pg_net
--
-- Pre-requisito: Edge Function "send-notifications" desplegada
-- ============================================================

-- 1. Guardar la URL del proyecto y el service_role_key como settings de DB
--    (reemplazar con los valores reales de supabase.com → Settings → API)
ALTER DATABASE postgres SET "app.supabase_url" = 'https://XXXX.supabase.co';
ALTER DATABASE postgres SET "app.service_role_key" = 'eyJ...TU_SERVICE_ROLE_KEY';

-- Recargar configuracion para que el cron job los vea
SELECT pg_reload_conf();

-- 2. Programar el job diario a las 08:00 UTC
--    (= 05:00 Chile hora de verano / 04:00 invierno)
SELECT cron.schedule(
  'send-daily-notifications',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := jsonb_build_object('date', CURRENT_DATE::text)
  ) AS request_id;
  $$
);

-- 3. Verificar que el job quedó registrado
SELECT jobid, jobname, schedule FROM cron.job;

-- ============================================================
-- Para probar manualmente (sin esperar al cron):
-- Reemplazar YYYY-MM-DD con la fecha de reminder_date de un evento
-- ============================================================
/*
SELECT net.http_post(
  url     := current_setting('app.supabase_url') || '/functions/v1/send-notifications',
  headers := jsonb_build_object(
    'Content-Type',  'application/json',
    'Authorization', 'Bearer ' || current_setting('app.service_role_key')
  ),
  body    := jsonb_build_object('date', 'YYYY-MM-DD')
) AS request_id;
*/

-- Para ver el resultado de la ultima llamada:
-- SELECT * FROM net._http_response ORDER BY created DESC LIMIT 5;

-- Para eliminar el job si necesitas recrearlo:
-- SELECT cron.unschedule('send-daily-notifications');
