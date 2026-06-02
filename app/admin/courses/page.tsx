'use client'

import { useActionState, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createCourse, deleteCourse, assignTeacher, removeTeacher } from '@/actions/courses'
import type { Course, User } from '@/lib/types'

type CourseWithTeachers = Course & { course_teachers: { teacher_id: string }[] }

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseWithTeachers[]>([])
  const [teachers, setTeachers] = useState<User[]>([])
  const [createState, createAction, isCreating] = useActionState(createCourse, null)

  const loadData = async () => {
    const supabase = createClient()
    const [{ data: c }, { data: t }] = await Promise.all([
      supabase.from('courses').select('*, course_teachers(teacher_id)').order('created_at', { ascending: false }),
      supabase.from('users').select('*').eq('role', 'teacher'),
    ])
    if (c) setCourses(c as CourseWithTeachers[])
    if (t) setTeachers(t as User[])
  }

  useEffect(() => { loadData() }, [createState])

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">จัดการวิชา</h1>

      <section className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">เพิ่มวิชาใหม่</h2>
        {createState?.error && (
          <p className="mb-3 text-sm text-red-600">{createState.error}</p>
        )}
        <form action={createAction} className="flex gap-3 flex-wrap">
          <input name="name" placeholder="ชื่อวิชา เช่น คณิตศาสตร์ ม.4" required
            className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input name="description" placeholder="คำอธิบาย (ไม่บังคับ)"
            className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" disabled={isCreating}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {isCreating ? 'กำลังสร้าง...' : 'สร้างวิชา'}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        {courses.map(course => {
          const assignedIds = new Set(course.course_teachers.map(ct => ct.teacher_id))
          const unassigned = teachers.filter(t => !assignedIds.has(t.id))
          const assigned = teachers.filter(t => assignedIds.has(t.id))

          return (
            <div key={course.id} className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">{course.name}</h3>
                  {course.description && <p className="text-gray-500 text-sm">{course.description}</p>}
                </div>
                <form action={async () => { await deleteCourse(course.id); loadData() }}>
                  <button type="submit"
                    className="text-sm text-red-500 hover:text-red-700"
                    onClick={e => { if (!confirm('ลบวิชานี้? ไฟล์ทั้งหมดจะถูกลบด้วย')) e.preventDefault() }}>
                    ลบวิชา
                  </button>
                </form>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-48">
                  <p className="text-xs font-medium text-gray-500 mb-2">ครูในวิชานี้</p>
                  <div className="flex flex-wrap gap-2">
                    {assigned.length === 0 && <span className="text-sm text-gray-400">ยังไม่มีครู</span>}
                    {assigned.map(t => (
                      <div key={t.id} className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full text-sm">
                        <span>{t.name || t.email}</span>
                        <form action={async () => { await removeTeacher(course.id, t.id); loadData() }}>
                          <button type="submit" className="text-gray-400 hover:text-red-500 ml-1">×</button>
                        </form>
                      </div>
                    ))}
                  </div>
                </div>

                {unassigned.length > 0 && (
                  <div className="flex-1 min-w-48">
                    <p className="text-xs font-medium text-gray-500 mb-2">เพิ่มครู</p>
                    <div className="flex flex-wrap gap-2">
                      {unassigned.map(t => (
                        <form key={t.id} action={async () => { await assignTeacher(course.id, t.id); loadData() }}>
                          <button type="submit"
                            className="text-sm px-3 py-1 border border-gray-300 rounded-full hover:border-blue-400 hover:text-blue-600">
                            + {t.name || t.email}
                          </button>
                        </form>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
