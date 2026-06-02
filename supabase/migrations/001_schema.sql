-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User role enum
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'pending');

-- Users table (mirrors auth.users)
CREATE TABLE public.users (
  id        uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email     text UNIQUE NOT NULL,
  name      text NOT NULL DEFAULT '',
  role      user_role NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Courses table
CREATE TABLE public.courses (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_by  uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Course teachers junction table
CREATE TABLE public.course_teachers (
  course_id   uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  teacher_id  uuid REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (course_id, teacher_id)
);

-- Course files table
CREATE TABLE public.course_files (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id    uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  filename     text NOT NULL,
  storage_path text NOT NULL,
  uploaded_by  uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Auto-create user profile row when auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for PDF files
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-files', 'course-files', false)
ON CONFLICT (id) DO NOTHING;
