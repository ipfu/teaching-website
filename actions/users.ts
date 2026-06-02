'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { UserRole } from '@/lib/types'

export async function setUserRole(userId: string, role: UserRole) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}
