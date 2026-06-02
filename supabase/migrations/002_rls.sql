-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_files ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── users ──────────────────────────────────────────────
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (id = auth.uid() OR is_admin());

CREATE POLICY "users_update" ON public.users
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

-- ── courses ────────────────────────────────────────────
CREATE POLICY "courses_select" ON public.courses
  FOR SELECT USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM public.course_teachers
      WHERE course_id = courses.id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "courses_insert" ON public.courses
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "courses_update" ON public.courses
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "courses_delete" ON public.courses
  FOR DELETE USING (is_admin());

-- ── course_teachers ────────────────────────────────────
CREATE POLICY "course_teachers_select" ON public.course_teachers
  FOR SELECT USING (is_admin() OR teacher_id = auth.uid());

CREATE POLICY "course_teachers_insert" ON public.course_teachers
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "course_teachers_delete" ON public.course_teachers
  FOR DELETE USING (is_admin());

-- ── course_files ───────────────────────────────────────
CREATE POLICY "course_files_select" ON public.course_files
  FOR SELECT USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM public.course_teachers
      WHERE course_id = course_files.course_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "course_files_insert" ON public.course_files
  FOR INSERT WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM public.course_teachers
      WHERE course_id = course_files.course_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "course_files_delete" ON public.course_files
  FOR DELETE USING (
    is_admin()
    OR (
      uploaded_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.course_teachers
        WHERE course_id = course_files.course_id AND teacher_id = auth.uid()
      )
    )
  );

-- ── Storage policies ───────────────────────────────────
CREATE POLICY "storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'course-files'
    AND (
      is_admin()
      OR EXISTS (
        SELECT 1 FROM public.course_teachers ct
        WHERE ct.teacher_id = auth.uid()
          AND (storage.foldername(name))[1] = ct.course_id::text
      )
    )
  );

CREATE POLICY "storage_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'course-files'
    AND (
      is_admin()
      OR EXISTS (
        SELECT 1 FROM public.course_teachers ct
        WHERE ct.teacher_id = auth.uid()
          AND (storage.foldername(name))[1] = ct.course_id::text
      )
    )
  );

CREATE POLICY "storage_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'course-files'
    AND (
      is_admin()
      OR (
        owner = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.course_teachers ct
          WHERE ct.teacher_id = auth.uid()
            AND (storage.foldername(name))[1] = ct.course_id::text
        )
      )
    )
  );
