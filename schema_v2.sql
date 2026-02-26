-- Paws & Speed — Schema v2
-- Run AFTER manually dropping all existing tables/types/functions.
-- Supabase Dashboard → SQL Editor → New query → paste → Run

-- ─── 1. Enums ─────────────────────────────────────────────────────────────────

CREATE TYPE public.user_role AS ENUM ('competitor', 'host', 'super_admin');
CREATE TYPE public.event_status AS ENUM ('draft', 'registration_open', 'registration_closed', 'live', 'completed');
CREATE TYPE public.registration_status AS ENUM ('pending_payment', 'pending_review', 'approved', 'rejected');

-- ─── 2. profiles ──────────────────────────────────────────────────────────────
-- One row per auth user, auto-created by trigger on auth.users INSERT.

CREATE TABLE public.profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role          user_role   NOT NULL DEFAULT 'competitor',
  display_name  TEXT        NOT NULL DEFAULT '',
  email         TEXT        NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: own row read"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles: own row update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles: hosts read all" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('host', 'super_admin'))
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── 3. Helper function (after profiles table exists) ─────────────────────────

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
$$;

-- ─── 4. host_invites ──────────────────────────────────────────────────────────
-- Codes created by admin; used once at signup to upgrade a user to host.

CREATE TABLE public.host_invites (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code       TEXT        NOT NULL UNIQUE,
  used_by    UUID        REFERENCES auth.users,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.host_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "host_invites: hosts read" ON public.host_invites FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('host', 'super_admin'))
);

CREATE OR REPLACE FUNCTION public.redeem_host_invite(invite_code TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  inv public.host_invites%ROWTYPE;
BEGIN
  SELECT * INTO inv FROM public.host_invites
  WHERE code = invite_code AND used_by IS NULL FOR UPDATE;

  IF NOT FOUND THEN RETURN FALSE; END IF;

  UPDATE public.host_invites SET used_by = auth.uid(), used_at = now() WHERE id = inv.id;
  UPDATE public.profiles SET role = 'host' WHERE id = auth.uid();
  RETURN TRUE;
END;
$$;

-- ─── 5. dogs ──────────────────────────────────────────────────────────────────
-- Owned by competitors; reused across events.

CREATE TABLE public.dogs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  breed      TEXT        NOT NULL DEFAULT '—',
  size       TEXT        NOT NULL CHECK (size IN ('S', 'M', 'I', 'L')),
  icon       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dogs: owner CRUD"     ON public.dogs FOR ALL    USING (auth.uid() = owner_id);
CREATE POLICY "dogs: hosts read all" ON public.dogs FOR SELECT USING (
  public.is_super_admin() OR
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'host')
);

-- ─── 6. events ────────────────────────────────────────────────────────────────

CREATE TABLE public.events (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id        UUID         NOT NULL REFERENCES auth.users,
  name           TEXT         NOT NULL,
  venue          TEXT         NOT NULL DEFAULT '',
  event_date     DATE,
  status         event_status NOT NULL DEFAULT 'draft',
  bank_account   TEXT         NOT NULL DEFAULT '',
  pricing_tiers  JSONB        NOT NULL DEFAULT '[]',
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Host owns their events; super_admin can access all
CREATE POLICY "events: host CRUD own"        ON public.events FOR ALL    USING (auth.uid() = host_id OR public.is_super_admin());
CREATE POLICY "events: public read non-draft" ON public.events FOR SELECT USING (status != 'draft');

-- ─── 7. event_rounds ──────────────────────────────────────────────────────────

CREATE TABLE public.event_rounds (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID         NOT NULL REFERENCES public.events ON DELETE CASCADE,
  name         TEXT         NOT NULL,
  abbreviation TEXT         NOT NULL DEFAULT '',
  sort_order   INTEGER      NOT NULL DEFAULT 0,
  sct          NUMERIC(6,2) NOT NULL DEFAULT 40,
  mct          NUMERIC(6,2) NOT NULL DEFAULT 56,
  UNIQUE (event_id, name)
);

ALTER TABLE public.event_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_rounds: host write"   ON public.event_rounds FOR ALL    USING (
  public.is_super_admin() OR
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.host_id = auth.uid())
);
CREATE POLICY "event_rounds: public read"  ON public.event_rounds FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.status != 'draft')
);

-- ─── 8. registrations ─────────────────────────────────────────────────────────

CREATE TABLE public.registrations (
  id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID                NOT NULL REFERENCES public.events ON DELETE CASCADE,
  competitor_id       UUID                NOT NULL REFERENCES auth.users,
  dog_id              UUID                NOT NULL REFERENCES public.dogs,
  selected_round_ids  UUID[]              NOT NULL DEFAULT '{}',
  status              registration_status NOT NULL DEFAULT 'pending_payment',
  price_thb           INTEGER             NOT NULL DEFAULT 0,
  receipt_image_path  TEXT,
  receipt_uploaded_at TIMESTAMPTZ,
  review_note         TEXT,
  reviewed_by         UUID                REFERENCES auth.users,
  reviewed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ         NOT NULL DEFAULT now(),
  UNIQUE (event_id, dog_id)
);

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registrations: competitor insert"         ON public.registrations FOR INSERT WITH CHECK (auth.uid() = competitor_id);
CREATE POLICY "registrations: competitor read own"       ON public.registrations FOR SELECT USING (auth.uid() = competitor_id);
CREATE POLICY "registrations: competitor update receipt" ON public.registrations FOR UPDATE USING (auth.uid() = competitor_id AND status = 'pending_payment');
CREATE POLICY "registrations: host manage"               ON public.registrations FOR ALL USING (
  public.is_super_admin() OR
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.host_id = auth.uid())
);

-- ─── 9. event_competitors ─────────────────────────────────────────────────────
-- Running order + scores per round. Source of truth for the scoring UI.

CREATE TABLE public.event_competitors (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID         NOT NULL REFERENCES public.events ON DELETE CASCADE,
  round_id        UUID         NOT NULL REFERENCES public.event_rounds ON DELETE CASCADE,
  registration_id UUID         REFERENCES public.registrations ON DELETE SET NULL,
  dog_id          UUID         NOT NULL REFERENCES public.dogs,
  dog_name        TEXT         NOT NULL,
  breed           TEXT         NOT NULL DEFAULT '—',
  human_name      TEXT         NOT NULL,
  icon            TEXT,
  size            TEXT         NOT NULL CHECK (size IN ('S', 'M', 'I', 'L')),
  run_order       INTEGER      NOT NULL DEFAULT 0,
  fault           INTEGER,
  refusal         INTEGER,
  time_sec        NUMERIC(8,3),
  time_fault      INTEGER,
  total_fault     INTEGER,
  eliminated      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (round_id, dog_id)
);

ALTER TABLE public.event_competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_competitors: host write"   ON public.event_competitors FOR ALL USING (
  public.is_super_admin() OR
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.host_id = auth.uid())
);
CREATE POLICY "event_competitors: public read"  ON public.event_competitors FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.status IN ('live', 'completed'))
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.event_competitors;

-- ─── 10. event_live_state ─────────────────────────────────────────────────────
-- One row per event tracking which round is currently live.

CREATE TABLE public.event_live_state (
  event_id      UUID        PRIMARY KEY REFERENCES public.events ON DELETE CASCADE,
  live_round_id UUID        REFERENCES public.event_rounds ON DELETE SET NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_live_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_live_state: host write"  ON public.event_live_state FOR ALL USING (
  public.is_super_admin() OR
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.host_id = auth.uid())
);
CREATE POLICY "event_live_state: public read" ON public.event_live_state FOR SELECT USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.event_live_state;

-- ─── 11. Trigger: auto-populate event_competitors on registration approval ────
-- When a registration is approved, insert one event_competitors row per
-- selected round, placed after the last competitor in that size group.

CREATE OR REPLACE FUNCTION public.handle_registration_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_round_id UUID;
  dog_rec    public.dogs%ROWTYPE;
  max_order  INTEGER;
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    SELECT * INTO dog_rec FROM public.dogs WHERE id = NEW.dog_id;

    FOREACH v_round_id IN ARRAY NEW.selected_round_ids LOOP
      SELECT COALESCE(MAX(run_order), 0) INTO max_order
        FROM public.event_competitors
        WHERE round_id = v_round_id AND size = dog_rec.size;

      INSERT INTO public.event_competitors
        (event_id, round_id, registration_id, dog_id, dog_name, breed, human_name, icon, size, run_order)
      SELECT
        NEW.event_id, v_round_id, NEW.id, NEW.dog_id,
        dog_rec.name, dog_rec.breed, p.display_name, dog_rec.icon, dog_rec.size, max_order + 1
      FROM public.profiles p WHERE p.id = NEW.competitor_id
      ON CONFLICT (round_id, dog_id) DO NOTHING;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_registration_approved
  AFTER UPDATE ON public.registrations
  FOR EACH ROW EXECUTE PROCEDURE public.handle_registration_approval();

-- ─── 12. RPC: batch reorder ───────────────────────────────────────────────────
-- Called from the frontend to reorder competitors in one round-trip.

CREATE OR REPLACE FUNCTION public.reorder_competitors(updates JSONB)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  item JSONB;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(updates) LOOP
    UPDATE public.event_competitors
      SET run_order = (item->>'run_order')::int
      WHERE id = (item->>'id')::uuid;
  END LOOP;
END;
$$;

-- ─── Done ─────────────────────────────────────────────────────────────────────
-- After running this script:
--   1. Storage → New bucket: name="receipts", public=OFF
--   2. Seed a host invite:  INSERT INTO public.host_invites (code) VALUES ('HOST2026');
--   3. Grant yourself super_admin (after signing up):
--      UPDATE public.profiles SET role = 'super_admin' WHERE email = 'you@example.com';
