import { logout } from '@/actions/auth'

export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">รอการอนุมัติ</h1>
        <p className="text-gray-600 mb-6">
          บัญชีของคุณกำลังรอการอนุมัติจากผู้ดูแลระบบ
          กรุณาลองเข้าสู่ระบบใหม่ภายหลัง
        </p>
        <form action={logout}>
          <button type="submit"
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
            ออกจากระบบ
          </button>
        </form>
      </div>
    </div>
  )
}
