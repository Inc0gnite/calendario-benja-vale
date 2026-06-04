-- ===========================================================
-- Fase 3: pg_cron + notificaciones diarias
-- ===========================================================
-- Pre-requisitos en Supabase Dashboard → Database → Extensions:
--   ✓ Activar pg_cron
--   ✓ Activar pg_net
--
-- Pre-requisito: Edge Function "send-notifications" desplegada
-- ============================================================

-- Nota: Supabase no permite ALTER DATABASE SET en proyectos gestionados.
-- Los valores se hardcodean directamente en el cron job (son settings de infra, no secretos de usuario).

-- 1. Programar el job diario a las 08:00 UTC
--    (= 05:00 Chile hora de verano / 04:00 invierno)
SELECT cron.schedule(
  'send-daily-notifications',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://puhfueaskuvjnuucvejk.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer TU_SERVICE_ROLE_KEY_JWT'
    ),
    body    := jsonb_build_object('date', CURRENT_DATE::text)
  ) AS request_id;
  $$
);

-- 2. Verificar que el job quedó registrado
SELECT jobid, jobname, schedule FROM cron.job;

-- ============================================================
-- Para probar manualmente (sin esperar al cron):
-- Reemplazar YYYY-MM-DD con la reminder_date de un evento real
-- ============================================================
/*
SELECT net.http_post(
  url     := 'https://puhfueaskuvjnuucvejk.supabase.co/functions/v1/send-notifications',
  headers := jsonb_build_object(
    'Content-Type',  'application/json',
    'Authorization', 'Bearer TU_SERVICE_ROLE_KEY_JWT'
  ),
  body    := jsonb_build_object('date', 'YYYY-MM-DD')
) AS request_id;
*/

-- Para ver el resultado de la ultima llamada:
-- SELECT * FROM net._http_response ORDER BY created DESC LIMIT 5;

-- Para eliminar el job si necesitas recrearlo:
-- SELECT cron.unschedule('send-daily-notifications');
