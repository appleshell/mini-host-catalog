'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginAction(_prev: unknown, formData: FormData) {
  const user = formData.get('user') as string
  const password = formData.get('password') as string

  const validUser = process.env.ADMIN_USER || 'admin'
  const validPassword = process.env.ADMIN_PASSWORD || 'admin123'
  const token = process.env.ADMIN_TOKEN || ''

  if (user !== validUser || password !== validPassword) {
    return { error: '账号或密码错误' }
  }

  const cookieStore = await cookies()
  cookieStore.set('admin-token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7天
    path: '/',
  })

  return { success: true }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('admin-token')
  redirect('/login')
}
