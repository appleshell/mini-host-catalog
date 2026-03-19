'use client'

import { useEffect, useState } from 'react'
import {
  Stack, Title, Grid, Card, Text, Table, Badge, SimpleGrid,
} from '@mantine/core'
import { LineChart, BarChart, DonutChart } from '@mantine/charts'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

type TrendRow = { date: string; visitors: number; events: number }
type PopularRow = { productModel: string; views: number }
type SearchTerm = { term: string; count: number }
type UaStats = { wechat: number; mobile: number; desktop: number }

export default function AnalyticsPage() {
  const [trendData, setTrendData] = useState<{ date: string; 访客: number; 事件数: number }[]>([])
  const [popularData, setPopularData] = useState<{ name: string; 浏览量: number }[]>([])
  const [searchTerms, setSearchTerms] = useState<SearchTerm[]>([])
  const [donutData, setDonutData] = useState<{ name: string; value: number; color: string }[]>([])

  useEffect(() => {
    fetch(`${API}/api/events/trend?days=30`).then(r => r.json()).then(j => {
      setTrendData((j.data || []).map((d: TrendRow) => ({
        date: d.date?.slice(5),
        访客: d.visitors,
        事件数: d.events,
      })))
    }).catch(() => {})

    fetch(`${API}/api/events/popular-products`).then(r => r.json()).then(j => {
      setPopularData((j.data || []).slice(0, 10).map((d: PopularRow) => ({
        name: d.productModel || '未知',
        浏览量: d.views,
      })))
    }).catch(() => {})

    fetch(`${API}/api/events/search-terms`).then(r => r.json()).then(j => {
      setSearchTerms(j.data || [])
    }).catch(() => {})

    fetch(`${API}/api/events/ua-stats`).then(r => r.json()).then(j => {
      const ua = j.data as UaStats
      setDonutData([
        { name: '微信', value: ua.wechat, color: 'green' },
        { name: '手机浏览器', value: ua.mobile, color: 'blue' },
        { name: '桌面端', value: ua.desktop, color: 'gray' },
      ].filter(d => d.value > 0))
    }).catch(() => {})
  }, [])

  return (
    <Stack gap="lg">
      <Title order={2}>埋点分析</Title>

      <Card shadow="xs" padding="lg" radius="md" withBorder>
        <Title order={4} mb="md">访客 & 事件趋势（近30天）</Title>
        {trendData.length > 0 ? (
          <LineChart
            h={260}
            data={trendData}
            dataKey="date"
            series={[
              { name: '访客', color: 'blue.6' },
              { name: '事件数', color: 'teal.6' },
            ]}
            curveType="natural"
            withLegend
            withDots={false}
          />
        ) : (
          <Text c="dimmed" ta="center" py="xl">暂无数据</Text>
        )}
      </Card>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card shadow="xs" padding="lg" radius="md" withBorder>
            <Title order={4} mb="md">热门产品浏览量 Top 10</Title>
            {popularData.length > 0 ? (
              <BarChart
                h={240}
                data={popularData}
                dataKey="name"
                series={[{ name: '浏览量', color: 'blue.6' }]}
                tickLine="y"
                withBarValueLabel
              />
            ) : (
              <Text c="dimmed" ta="center" py="xl">暂无数据</Text>
            )}
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card shadow="xs" padding="lg" radius="md" withBorder>
            <Title order={4} mb="md">访客来源分布</Title>
            {donutData.length > 0 ? (
              <DonutChart
                data={donutData}
                h={200}
                withLabelsLine
                withLabels
                paddingAngle={4}
              />
            ) : (
              <Text c="dimmed" ta="center" py="xl">暂无数据</Text>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      <Card shadow="xs" padding="lg" radius="md" withBorder>
        <Title order={4} mb="md">热门搜索词 Top 10</Title>
        {searchTerms.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>排名</Table.Th>
                  <Table.Th>搜索词</Table.Th>
                  <Table.Th ta="right">次数</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {searchTerms.slice(0, 10).map((t, i) => (
                  <Table.Tr key={i}>
                    <Table.Td><Badge variant="light" size="sm" color="gray">#{i + 1}</Badge></Table.Td>
                    <Table.Td>{t.term}</Table.Td>
                    <Table.Td ta="right"><Badge variant="light" size="sm">{t.count}</Badge></Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </SimpleGrid>
        ) : (
          <Text c="dimmed" ta="center" py="xl">暂无搜索记录</Text>
        )}
      </Card>
    </Stack>
  )
}
