export type UserRole = 'admin' | 'teacher' | 'pending'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  created_at: string
}

export interface Course {
  id: string
  name: string
  description: string
  created_by: string | null
  created_at: string
}

export interface CourseTeacher {
  course_id: string
  teacher_id: string
  assigned_at: string
}

export interface CourseFile {
  id: string
  course_id: string
  filename: string
  storage_path: string
  uploaded_by: string | null
  created_at: string
  display_order: number
}
