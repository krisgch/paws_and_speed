export type UserRole = 'competitor' | 'host';
export type EventStatus = 'draft' | 'registration_open' | 'registration_closed' | 'live' | 'completed';
export type RegistrationStatus = 'pending_payment' | 'pending_review' | 'approved' | 'rejected';

export interface UserProfile {
  id: string;
  role: UserRole;
  display_name: string;
  email: string;
  created_at: string;
}

export interface Dog {
  id: string;
  owner_id: string;
  name: string;
  breed: string;
  size: 'S' | 'M' | 'I' | 'L';
  icon: string | null;
  created_at: string;
}

export interface PricingTier {
  runs: number;
  price: number;
  label: string;
}

export interface Event {
  id: string;
  host_id: string;
  name: string;
  venue: string;
  event_date: string | null;
  status: EventStatus;
  bank_account: string;
  pricing_tiers: PricingTier[];
  created_at: string;
  updated_at: string;
}

export interface EventRound {
  id: string;
  event_id: string;
  name: string;
  abbreviation: string;
  sort_order: number;
  sct: number;
  mct: number;
}

export interface Registration {
  id: string;
  event_id: string;
  competitor_id: string;
  dog_id: string;
  selected_round_ids: string[];
  status: RegistrationStatus;
  price_thb: number;
  receipt_image_path: string | null;
  receipt_uploaded_at: string | null;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface EventCompetitor {
  id: string;
  event_id: string;
  round_id: string;
  registration_id: string | null;
  dog_id: string;
  dog_name: string;
  breed: string;
  human_name: string;
  icon: string | null;
  size: 'S' | 'M' | 'I' | 'L';
  run_order: number;
  fault: number | null;
  refusal: number | null;
  time_sec: number | null;
  time_fault: number | null;
  total_fault: number | null;
  eliminated: boolean;
  created_at: string;
}

export interface EventLiveState {
  event_id: string;
  live_round_id: string | null;
  updated_at: string;
}

// Supabase Database type for the client generic
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'created_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>;
      };
      dogs: {
        Row: Dog;
        Insert: Omit<Dog, 'id' | 'created_at'>;
        Update: Partial<Omit<Dog, 'id' | 'owner_id' | 'created_at'>>;
      };
      events: {
        Row: Event;
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Event, 'id' | 'host_id' | 'created_at'>>;
      };
      event_rounds: {
        Row: EventRound;
        Insert: Omit<EventRound, 'id'>;
        Update: Partial<Omit<EventRound, 'id' | 'event_id'>>;
      };
      registrations: {
        Row: Registration;
        Insert: Omit<Registration, 'id' | 'created_at'>;
        Update: Partial<Omit<Registration, 'id' | 'event_id' | 'competitor_id' | 'created_at'>>;
      };
      event_competitors: {
        Row: EventCompetitor;
        Insert: Omit<EventCompetitor, 'id' | 'created_at'>;
        Update: Partial<Omit<EventCompetitor, 'id' | 'event_id' | 'round_id' | 'created_at'>>;
      };
      event_live_state: {
        Row: EventLiveState;
        Insert: EventLiveState;
        Update: Partial<EventLiveState>;
      };
      host_invites: {
        Row: { id: string; code: string; used_by: string | null; used_at: string | null; created_at: string };
        Insert: { code: string };
        Update: never;
      };
    };
    Functions: {
      redeem_host_invite: { Args: { invite_code: string }; Returns: boolean };
      reorder_competitors: { Args: { updates: string }; Returns: void };
    };
  };
}
