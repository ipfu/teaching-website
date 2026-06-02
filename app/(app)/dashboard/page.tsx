import { createClient } from '@/lib/supabase/server'
import CourseCard from '@/components/CourseCard'
import type { Course } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">วิชาของฉัน</h1>
      {courses && courses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(courses as Course[]).map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">ยังไม่มีวิชาที่ได้รับมอบหมาย</p>
      )}
    </div>
  )
}
