CREATE TYPE slot_status AS ENUM ('available', 'pending', 'booked', 'blocked');

CREATE TABLE public.time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status slot_status NOT NULL DEFAULT 'available',
  client_name TEXT,
  client_contact TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_date_start_time UNIQUE (date, start_time),
  CONSTRAINT check_end_after_start CHECK (end_time > start_time)
);

CREATE INDEX idx_time_slots_date ON public.time_slots(date);
CREATE INDEX idx_time_slots_date_status ON public.time_slots(date, status);
