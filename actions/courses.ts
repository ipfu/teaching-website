'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCourse(
  _prevState: { error: string } | { success: true } | null,
  formData: FormData
): Promise<{ error: string } | { success: true } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name = (formData.get('name') as string).trim()
  if (!name) return { error: 'กรุณากรอกชื่อวิชา' }

  const { error } = await supabase.from('courses').insert({
    name,
    description: (formData.get('description') as string).trim(),
    created_by: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/courses')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteCourse(courseId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('courses').delete().eq('id', courseId)
  if (error) return { error: error.message }
  revalidatePath('/admin/courses')
  revalidatePath('/dashboard')
}

export async function assignTeacher(courseId: string, teacherId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('course_teachers').insert({
    course_id: courseId,
    teacher_id: teacherId,
  })
  if (error) return { error: error.message }
  revalidatePath('/admin/courses')
}

export async function removeTeacher(courseId: string, teacherId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('course_teachers')
    .delete()
    .eq('course_id', courseId)
    .eq('teacher_id', teacherId)
  if (error) return { error: error.message }
  revalidatePath('/admin/courses')
}
