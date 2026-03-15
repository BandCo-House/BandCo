-- 사용 예시:
-- PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d jamplay \
--   -v db_name=jamplay \
--   -v db_app_user=jamplay_app \
--   -v db_app_password=jamplay1234 \
--   -f prisma/sql/create-app-role.sql
--
-- psql 변수는 DO $$ ... $$ 블록 안에서 기대한 방식으로 치환되지 않아서,
-- 여기서는 format(...) + \gexec 조합으로 실제 실행 SQL을 만든다.

SELECT format(
  'CREATE ROLE %I WITH LOGIN PASSWORD %L',
  :'db_app_user',
  :'db_app_password'
)
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_roles
  WHERE rolname = :'db_app_user'
)\gexec

SELECT format(
  'ALTER ROLE %I WITH LOGIN PASSWORD %L',
  :'db_app_user',
  :'db_app_password'
)
WHERE EXISTS (
  SELECT 1
  FROM pg_roles
  WHERE rolname = :'db_app_user'
)\gexec

SELECT format(
  'GRANT CONNECT, TEMPORARY ON DATABASE %I TO %I',
  :'db_name',
  :'db_app_user'
)\gexec

REVOKE ALL
ON SCHEMA public
FROM PUBLIC;

SELECT format(
  'GRANT USAGE, CREATE ON SCHEMA public TO %I',
  :'db_app_user'
)\gexec

SELECT format(
  'GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public TO %I',
  :'db_app_user'
)\gexec

SELECT format(
  'GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO %I',
  :'db_app_user'
)\gexec

SELECT format(
  'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON TABLES TO %I',
  :'db_app_user'
)\gexec

SELECT format(
  'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO %I',
  :'db_app_user'
)\gexec

SELECT format(
  'ALTER ROLE %I SET search_path TO public',
  :'db_app_user'
)\gexec
