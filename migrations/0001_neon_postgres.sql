CREATE TABLE IF NOT EXISTS people (
  id text PRIMARY KEY,
  name text NOT NULL,
  cpf text NOT NULL UNIQUE,
  phone text NOT NULL,
  email text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  parent text NULL,
  role text NOT NULL DEFAULT 'member',
  password_hash text NOT NULL,
  password_salt text NOT NULL,
  created timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id text PRIMARY KEY,
  referrer text NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  parent_name text NOT NULL,
  parent_cpf text NOT NULL UNIQUE,
  parent_email text NULL,
  phone text NOT NULL,
  child_name text NULL,
  child_cpf text NULL,
  grade text NULL,
  status text NOT NULL DEFAULT 'new',
  benefit_kind text NOT NULL DEFAULT 'discount',
  discount_month text NULL,
  tuition integer NOT NULL DEFAULT 0,
  reward integer NOT NULL DEFAULT 0,
  created timestamptz NOT NULL DEFAULT now(),
  consent timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id text PRIMARY KEY,
  actor text NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  lead text NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  action text NOT NULL,
  created timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_referrer_idx ON leads(referrer);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);
CREATE INDEX IF NOT EXISTS events_lead_idx ON events(lead);
