-- Migration: add dog profile fields
-- Run once in Supabase → SQL Editor

ALTER TABLE public.dogs
  ADD COLUMN IF NOT EXISTS competition_level TEXT CHECK (competition_level IN ('A0', 'A1', 'A2', 'A3')),
  ADD COLUMN IF NOT EXISTS registered_name   TEXT,
  ADD COLUMN IF NOT EXISTS kath_number       TEXT,
  ADD COLUMN IF NOT EXISTS microchip_number  TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth     DATE;
