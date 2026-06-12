CREATE POLICY "course_files_update" ON public.course_files
  FOR UPDATE USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM public.course_teachers
      WHERE course_id = course_files.course_id AND teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM public.course_teachers
      WHERE course_id = course_files.course_id AND teacher_id = auth.uid()
    )
  );
