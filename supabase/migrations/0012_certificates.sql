-- 1. Create additive certificates table with course_id BIGINT
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id BIGINT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    certificate_number TEXT UNIQUE NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_course_certificate UNIQUE (user_id, course_id)
);

-- 2. Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- 3. Additive RLS Policies (New policies only)
CREATE POLICY "Users can view own certificates"
    ON public.certificates
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own certificates"
    ON public.certificates
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
