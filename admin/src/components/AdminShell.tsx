'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Text,
  Button,
  Avatar,
  Stack,
  Divider,
  ScrollArea,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconLayoutDashboard,
  IconPackage,
  IconChartBar,
  IconUsers,
  IconLogout,
  IconServer,
} from '@tabler/icons-react'
import { logoutAction } from '@/lib/auth'

const navItems = [
  { label: '数据概览', href: '/dashboard', icon: <IconLayoutDashboard size={18} /> },
  { label: '产品管理', href: '/products', icon: <IconPackage size={18} /> },
  { label: '埋点分析', href: '/analytics', icon: <IconChartBar size={18} /> },
  { label: '客户线索', href: '/leads', icon: <IconUsers size={18} /> },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure()
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await logoutAction()
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap={8}>
              <IconServer size={22} color="var(--mantine-color-blue-6)" />
              <Text fw={700} size="lg" c="blue.7">Mini Host Admin</Text>
            </Group>
          </Group>
          <form action={handleLogout}>
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              leftSection={<IconLogout size={14} />}
              type="submit"
            >
              退出
            </Button>
          </form>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow component={ScrollArea}>
          <Stack gap={4}>
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                label={item.label}
                leftSection={item.icon}
                active={pathname.startsWith(item.href)}
                onClick={() => router.push(item.href)}
                styles={{ root: { borderRadius: 8 } }}
              />
            ))}
          </Stack>
        </AppShell.Section>
        <Divider my="sm" />
        <AppShell.Section>
          <Group gap="sm" p="xs">
            <Avatar color="blue" radius="xl" size="sm">A</Avatar>
            <Text size="sm" fw={500}>管理员</Text>
          </Group>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main bg="gray.0">{children}</AppShell.Main>
    </AppShell>
  )
}
