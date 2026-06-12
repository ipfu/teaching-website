'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadFile(
  courseId: string,
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const file = formData.get('file') as File
  if (!file || file.size === 0) return { error: 'กรุณาเลือกไฟล์' }
  if (file.type !== 'application/pdf') return { error: 'รองรับเฉพาะไฟล์ PDF เท่านั้น' }

  const safeName = file.name.replace(/\s+/g, '_')
  const storagePath = `${courseId}/${Date.now()}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from('course-files')
    .upload(storagePath, file)

  if (uploadError) return { error: uploadError.message }

  const { error: dbError } = await supabase.from('course_files').insert({
    course_id: courseId,
    filename: file.name,
    storage_path: storagePath,
    uploaded_by: user.id,
  })

  if (dbError) {
    await supabase.storage.from('course-files').remove([storagePath])
    return { error: dbError.message }
  }

  revalidatePath(`/courses/${courseId}`)
  return null
}

export async function deleteFile(fileId: string, storagePath: string, courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase.from('course_files').delete().eq('id', fileId)
  if (error) throw new Error(error.message)
  await supabase.storage.from('course-files').remove([storagePath])
  revalidatePath(`/courses/${courseId}`)
}

export async function getSignedUrl(storagePath: string): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase.storage
    .from('course-files')
    .createSignedUrl(storagePath, 60 * 60 * 8)
  if (error || !data) return null
  return data.signedUrl
}

export async function renameFile(fileId: string, newName: string, courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const trimmed = newName.trim()
  if (!trimmed) throw new Error('ชื่อไม่ถูกต้อง')

  const { error } = await supabase
    .from('course_files')
    .update({ filename: trimmed })
    .eq('id', fileId)

  if (error) throw new Error(error.message)
  revalidatePath(`/courses/${courseId}`)
}

export async function reorderFiles(orderedIds: string[], courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('course_files').update({ display_order: index }).eq('id', id)
    )
  )

  revalidatePath(`/courses/${courseId}`)
}
