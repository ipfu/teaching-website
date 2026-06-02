import Link from 'next/link'
import type { Course } from '@/lib/types'

interface Props {
  course: Course
}

export default function CourseCard({ course }: Props) {
  return (
    <Link href={`/courses/${course.id}`}
      className="block p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all">
      <h3 className="font-semibold text-gray-800 text-lg">{course.name}</h3>
      {course.description && (
        <p className="text-gray-500 text-sm mt-1">{course.description}</p>
      )}
    </Link>
  )
}
