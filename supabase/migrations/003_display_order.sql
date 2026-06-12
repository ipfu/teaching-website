ALTER TABLE public.course_files
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;
