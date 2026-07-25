-- Create additive waitlist_signups table
CREATE TABLE IF NOT EXISTS public.waitlist_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Additive RLS policy: Anyone (anon & authenticated) can submit their email to the waitlist
CREATE POLICY "Anyone can insert waitlist signups"
    ON public.waitlist_signups
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
