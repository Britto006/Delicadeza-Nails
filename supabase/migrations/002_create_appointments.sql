CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'cancelled');

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES public.time_slots(id) ON DELETE RESTRICT,
  client_name TEXT NOT NULL,
  client_contact TEXT NOT NULL,
  status appointment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_slot UNIQUE (slot_id)
);

CREATE INDEX idx_appointments_slot_id ON public.appointments(slot_id);
CREATE INDEX idx_appointments_status ON public.appointments(status);
