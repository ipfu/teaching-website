import { logout } from '@/actions/auth'
import Link from 'next/link'
import type { User } from '@/lib/types'

interface Props {
  user: User
}

export default function NavBar({ user }: Props) {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="text-lg font-semibold text-blue-600">
        ระบบสอนออนไลน์
      </Link>
      <div className="flex items-center gap-4">
        {user.role === 'admin' && (
          <>
            <Link href="/admin/courses" className="text-sm text-gray-600 hover:text-gray-900">
              จัดการวิชา
            </Link>
            <Link href="/admin/users" className="text-sm text-gray-600 hover:text-gray-900">
              จัดการผู้ใช้
            </Link>
          </>
        )}
        <span className="text-sm text-gray-500">{user.name || user.email}</span>
        <form action={logout}>
          <button type="submit" className="text-sm text-red-600 hover:underline">
            ออกจากระบบ
          </button>
        </form>
      </div>
    </nav>
  )
}
