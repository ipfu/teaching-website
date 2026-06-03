'use client'

import { deleteFile } from '@/actions/files'
import type { CourseFile } from '@/lib/types'
import Link from 'next/link'

interface Props {
  files: CourseFile[]
  currentUserId: string
  isAdmin: boolean
}

export default function FileList({ files, currentUserId, isAdmin }: Props) {
  if (files.length === 0) {
    return <p className="text-gray-500 text-sm">ยังไม่มีไฟล์ในวิชานี้</p>
  }

  return (
    <div className="space-y-2">
      {files.map(file => {
        const canDelete = isAdmin || file.uploaded_by === currentUserId

        return (
          <div key={file.id}
            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl">📄</span>
              <div className="min-w-0">
                <p className="font-medium text-gray-800 truncate">{file.filename}</p>
                <p className="text-xs text-gray-400">
                  {new Date(file.created_at).toLocaleDateString('th-TH')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-4">
              <Link
                href={`/present/${file.id}`}
                className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
              >
                เริ่มสอน
              </Link>
              {canDelete && (
                <form action={deleteFile.bind(null, file.id, file.storage_path, file.course_id)}>
                  <button
                    type="submit"
                    className="text-sm text-red-500 hover:text-red-700"
                    onClick={e => { if (!confirm('ลบไฟล์นี้?')) e.preventDefault() }}
                  >
                    ลบ
                  </button>
                </form>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
