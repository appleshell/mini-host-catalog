'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Center,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Alert,
} from '@mantine/core'
import { IconAlertCircle, IconLock } from '@tabler/icons-react'
import { loginAction } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(loginAction, null)

  useEffect(() => {
    if (state?.success) {
      router.push('/dashboard')
    }
  }, [state, router])

  return (
    <Center mih="100vh" bg="gray.0">
      <Paper shadow="md" p="xl" radius="md" w={380}>
        <Stack gap="lg">
          <Stack gap={4} align="center">
            <IconLock size={36} color="var(--mantine-color-blue-6)" />
            <Title order={2} ta="center">后台管理系统</Title>
            <Text c="dimmed" size="sm" ta="center">Mini Host Catalog Admin</Text>
          </Stack>

          {state?.error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
              {state.error}
            </Alert>
          )}

          <form action={formAction}>
            <Stack gap="md">
              <TextInput
                label="账号"
                name="user"
                placeholder="请输入账号"
                required
                autoComplete="username"
              />
              <PasswordInput
                label="密码"
                name="password"
                placeholder="请输入密码"
                required
                autoComplete="current-password"
              />
              <Button type="submit" loading={isPending} fullWidth mt="sm">
                登录
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Center>
  )
}
