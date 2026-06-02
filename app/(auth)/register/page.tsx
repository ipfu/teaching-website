'use client'

import { useActionState } from 'react'
import { register } from '@/actions/auth'
import Link from 'next/link'

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">สมัครใช้งาน</h1>

        {state?.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
            <input name="name" type="text" required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
            <input name="email" type="email" required autoComplete="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)</label>
            <input name="password" type="password" required minLength={6} autoComplete="new-password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={isPending}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
            {isPending ? 'กำลังสมัคร...' : 'สมัครใช้งาน'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          มีบัญชีแล้ว?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  )
}
