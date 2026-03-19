'use client'

import { useEffect, useState } from 'react'
import {
  Card, Text, Title, Stack, Group, Badge, Table,
  ThemeIcon, SimpleGrid, Grid,
} from '@mantine/core'
import { LineChart } from '@mantine/charts'
import { IconPackage, IconUsers, IconEye, IconUserPlus } from '@tabler/icons-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

type Stats = { products: number; leads: number; todayLeads: number; totalVisitors: number; todayVisitors: number }
type TrendRow = { date: string; visitors: number; events: number }
type PopularRow = { productModel: string; views: number }

function StatCard({ title, value, sub, icon, color }: {
  title: string; value: number | string; sub?: string; icon: React.ReactNode; color: string
}) {
  return (
    <Card shadow="xs" padding="lg" radius="md" withBorder>
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text size="sm" c="dimmed">{title}</Text>
          <Title order={2}>{value}</Title>
          {sub && <Text size="xs" c="dimmed">{sub}</Text>}
        </Stack>
        <ThemeIcon variant="light" color={color} size={44} radius="md">{icon}</ThemeIcon>
      </Group>
    </Card>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [trendData, setTrendData] = useState<{ date: string; 访客: number; 事件: number }[]>([])
  const [popular, setPopular] = useState<PopularRow[]>([])

  useEffect(() => {
    fetch(`${API}/api/stats`).then(r => r.json()).then(setStats).catch(() => {})
    fetch(`${API}/api/events/trend?days=14`).then(r => r.json()).then((j) => {
      setTrendData((j.data || []).map((d: TrendRow) => ({
        date: d.date?.slice(5),
        访客: d.visitors,
        事件: d.events,
      })))
    }).catch(() => {})
    fetch(`${API}/api/events/popular-products`).then(r => r.json()).then((j) => {
      setPopular(j.data || [])
    }).catch(() => {})
  }, [])

  return (
    <Stack gap="lg">
      <Title order={2}>数据概览</Title>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <StatCard title="产品总数" value={stats?.products ?? '--'} icon={<IconPackage size={22} />} color="blue" />
        <StatCard title="总访客数" value={stats?.totalVisitors ?? '--'} sub={`今日 ${stats?.todayVisitors ?? 0}`} icon={<IconEye size={22} />} color="teal" />
        <StatCard title="线索总数" value={stats?.leads ?? '--'} sub={`今日 ${stats?.todayLeads ?? 0}`} icon={<IconUserPlus size={22} />} color="orange" />
        <StatCard title="今日访客" value={stats?.todayVisitors ?? '--'} icon={<IconUsers size={22} />} color="grape" />
      </SimpleGrid>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card shadow="xs" padding="lg" radius="md" withBorder>
            <Title order={4} mb="md">访客趋势（近14天）</Title>
            {trendData.length > 0 ? (
              <LineChart
                h={240}
                data={trendData}
                dataKey="date"
                series={[
                  { name: '访客', color: 'blue' },
                  { name: '事件', color: 'teal' },
                ]}
                curveType="natural"
                withLegend
                withDots={false}
              />
            ) : (
              <Text c="dimmed" ta="center" py="xl">暂无数据</Text>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="xs" padding="lg" radius="md" withBorder h="100%">
            <Title order={4} mb="md">热门产品 Top 10</Title>
            {popular.length > 0 ? (
              <Table striped highlightOnHover fz="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>产品</Table.Th>
                    <Table.Th ta="right">浏览</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {popular.slice(0, 10).map((p, i) => (
                    <Table.Tr key={i}>
                      <Table.Td><Text size="xs" truncate maw={140}>{p.productModel || '未知'}</Text></Table.Td>
                      <Table.Td ta="right"><Badge variant="light" size="sm">{p.views}</Badge></Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text c="dimmed" ta="center" py="xl">暂无数据</Text>
            )}
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
