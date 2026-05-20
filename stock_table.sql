CREATE TABLE public.stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  color text NOT NULL,
  size text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  min_stock integer NOT NULL DEFAULT 5,
  supplier text,
  cost numeric(10,2),
  width numeric(10,2),
  height numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE(color, size)
);

ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
