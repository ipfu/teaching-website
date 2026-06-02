import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'
import type { User } from '@/lib/types'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('*').eq('id', authUser.id).single()

  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar user={profile as User} />
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
