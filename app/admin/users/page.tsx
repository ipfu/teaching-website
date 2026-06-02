import { createClient } from '@/lib/supabase/server'
import { setUserRole } from '@/actions/users'
import type { User } from '@/lib/types'

const ROLE_LABELS: Record<string, string> = {
  admin: 'ผู้ดูแลระบบ',
  teacher: 'ครู',
  pending: 'รออนุมัติ',
}

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  const pending = (users as User[])?.filter(u => u.role === 'pending') ?? []
  const active = (users as User[])?.filter(u => u.role !== 'pending') ?? []

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">จัดการผู้ใช้</h1>

      {pending.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-amber-700 mb-3">
            รออนุมัติ ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map(user => (
              <div key={user.id}
                className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{user.name || '-'}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <form action={setUserRole.bind(null, user.id, 'teacher')}>
                  <button type="submit"
                    className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                    อนุมัติ
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">ผู้ใช้ทั้งหมด</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-white rounded-xl border border-gray-200">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">ชื่อ</th>
                <th className="text-left px-4 py-3">อีเมล</th>
                <th className="text-left px-4 py-3">สิทธิ์</th>
                <th className="text-left px-4 py-3">เปลี่ยนสิทธิ์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {active.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{user.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.role !== 'admin' && (
                      <form action={setUserRole.bind(null, user.id, 'admin')}>
                        <button type="submit"
                          className="text-xs text-purple-600 hover:underline">
                          ตั้งเป็น Admin
                        </button>
                      </form>
                    )}
                    {user.role === 'admin' && (
                      <form action={setUserRole.bind(null, user.id, 'teacher')}>
                        <button type="submit"
                          className="text-xs text-gray-500 hover:underline">
                          ลด เป็น ครู
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
