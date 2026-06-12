import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import FileUpload from '@/components/FileUpload'
import FileList from '@/components/FileList'
import { getSignedUrl } from '@/actions/files'
import type { Course, CourseFile } from '@/lib/types'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CoursePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const [{ data: course }, { data: files }, { data: profile }] = await Promise.all([
    supabase.from('courses').select('*').eq('id', id).single(),
    supabase
      .from('course_files')
      .select('*')
      .eq('course_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('users').select('role').eq('id', authUser!.id).single(),
  ])

  if (!course) notFound()

  const isAdmin = profile?.role === 'admin'

  const signedUrlEntries = await Promise.all(
    ((files as CourseFile[]) ?? []).map(async file => [
      file.id,
      await getSignedUrl(file.storage_path),
    ])
  )
  const signedUrls = Object.fromEntries(
    signedUrlEntries.filter(([, url]) => url !== null)
  ) as Record<string, string>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:underline">วิชาของฉัน</Link>
        <span>/</span>
        <span className="text-gray-800">{(course as Course).name}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-800">{(course as Course).name}</h1>
        {(course as Course).description && (
          <p className="text-gray-500 mt-1">{(course as Course).description}</p>
        )}
      </div>

      <section className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-600 mb-3">อัปโหลดไฟล์ PDF</h2>
        <FileUpload courseId={id} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">ไฟล์การสอน</h2>
        <FileList
          files={(files as CourseFile[]) ?? []}
          signedUrls={signedUrls}
          currentUserId={authUser!.id}
          isAdmin={isAdmin}
        />
      </section>
    </div>
  )
}
