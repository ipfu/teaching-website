'use client'

import { useActionState, useRef, useEffect } from 'react'
import { uploadFile } from '@/actions/files'

interface Props {
  courseId: string
}

export default function FileUpload({ courseId }: Props) {
  const uploadWithCourse = uploadFile.bind(null, courseId)
  const [state, formAction, isPending] = useActionState(uploadWithCourse, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!state) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-3 flex-wrap">
      {state?.error && (
        <p className="w-full text-sm text-red-600">{state.error}</p>
      )}
      <input
        name="file"
        type="file"
        accept="application/pdf"
        required
        className="flex-1 min-w-0 text-sm text-gray-600 file:mr-3 file:px-4 file:py-1.5 file:bg-blue-50 file:border file:border-blue-300 file:rounded-lg file:text-blue-600 file:cursor-pointer hover:file:bg-blue-100"
      />
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
      >
        {isPending ? 'กำลังอัปโหลด...' : 'อัปโหลด PDF'}
      </button>
    </form>
  )
}
