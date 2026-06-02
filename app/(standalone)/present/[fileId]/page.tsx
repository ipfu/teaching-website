import { createClient } from '@/lib/supabase/server'
import { getSignedUrl } from '@/actions/files'
import { notFound } from 'next/navigation'
import PdfViewerClient from '@/components/PdfViewerClient'
import type { CourseFile } from '@/lib/types'

interface Props {
  params: Promise<{ fileId: string }>
}

export default async function PresentPage({ params }: Props) {
  const { fileId } = await params
  const supabase = await createClient()

  const { data: file } = await supabase
    .from('course_files')
    .select('*')
    .eq('id', fileId)
    .single()

  if (!file) notFound()

  const signedUrl = await getSignedUrl((file as CourseFile).storage_path)
  if (!signedUrl) notFound()

  return (
    <PdfViewerClient
      url={signedUrl}
      courseId={(file as CourseFile).course_id}
    />
  )
}
