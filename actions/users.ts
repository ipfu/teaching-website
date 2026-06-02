'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { UserRole } from '@/lib/types'

export async function setUserRole(userId: string, role: UserRole) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: caller } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (caller?.role !== 'admin') throw new Error('Forbidden')

  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}
