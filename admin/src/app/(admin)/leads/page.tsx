'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Stack, Title, Group, Select, Drawer, Text, Badge, Textarea,
  Button, ActionIcon, Tooltip, Anchor, Divider, ScrollArea,
  Timeline, ThemeIcon, Box,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { DataTable } from 'mantine-datatable'
import {
  IconEye, IconDownload, IconSearch, IconHistory,
  IconUser, IconPhone, IconBrandWechat, IconPackage,
  IconClipboardText,
} from '@tabler/icons-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const STATUS_OPTIONS = ['未跟进', '跟进中', '已成交', '无效']
const STATUS_COLORS: Record<string, string> = {
  '未跟进': 'gray',
  '跟进中': 'blue',
  '已成交': 'green',
  '无效': 'red',
}

type Lead = {
  id: number
  name?: string | null
  phone?: string | null
  wechat?: string | null
  requirement?: string | null
  interestedProducts?: string | null
  sessionId?: string | null
  source?: string | null
  status?: string | null
  adminNotes?: string | null
  followedAt?: number | null
  createdAt?: number | null
}

type EventRow = {
  id: number
  event: string
  productModel?: string | null
  extra?: string | null
  createdAt?: number | null
}

function formatTime(ts?: number | null) {
  if (!ts) return '-'
  return new Date(ts).toLocaleString('zh-CN', { hour12: false })
}

function parseProducts(raw?: string | null): string[] {
  try { return JSON.parse(raw || '[]') } catch { return [] }
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [selected, setSelected] = useState<Lead | null>(null)
  const [events, setEvents] = useState<EventRow[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const PAGE_SIZE = 20

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`${API}/api/leads?${params}`)
      const json = await res.json()
      setLeads(json.data || [])
      setTotal(json.total || 0)
    } catch {
      notifications.show({ message: '加载线索失败', color: 'red' })
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  async function openDetail(lead: Lead) {
    setSelected(lead)
    setNotes(lead.adminNotes || '')
    setStatus(lead.status || '未跟进')

    if (lead.sessionId) {
      setEventsLoading(true)
      try {
        // Fetch events for this session via filtering all events
        const res = await fetch(`${API}/api/events?sessionId=${lead.sessionId}`)
        const json = await res.json()
        setEvents(json.data || [])
      } catch {
        setEvents([])
      } finally {
        setEventsLoading(false)
      }
    } else {
      setEvents([])
    }
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`${API}/api/leads/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes: notes }),
      })
      if (!res.ok) throw new Error()
      notifications.show({ message: '已保存', color: 'green' })
      setSelected(null)
      fetchLeads()
    } catch {
      notifications.show({ message: '保存失败', color: 'red' })
    } finally {
      setSaving(false)
    }
  }

  function handleExportCSV() {
    const headers = ['ID', '姓名', '手机', '微信', '需求', '状态', '来源', '提交时间']
    const rows = leads.map((l) => [
      l.id,
      l.name || '',
      l.phone || '',
      l.wechat || '',
      (l.requirement || '').replace(/,/g, '，'),
      l.status || '',
      l.source || '',
      formatTime(l.createdAt),
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const eventLabel: Record<string, string> = {
    product_view: '浏览产品',
    product_card_click: '点击产品卡片',
    filter_applied: '使用筛选',
    search_query: '搜索',
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>客户线索</Title>
        <Button
          variant="outline"
          leftSection={<IconDownload size={16} />}
          onClick={handleExportCSV}
        >
          导出 CSV
        </Button>
      </Group>

      <Group>
        <Select
          placeholder="所有状态"
          data={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1) }}
          clearable
          leftSection={<IconSearch size={14} />}
          w={180}
        />
        <Text size="sm" c="dimmed">共 {total} 条线索</Text>
      </Group>

      <DataTable
        withTableBorder
        borderRadius="md"
        striped
        highlightOnHover
        records={leads}
        fetching={loading}
        minHeight={200}
        totalRecords={total}
        recordsPerPage={PAGE_SIZE}
        page={page}
        onPageChange={setPage}
        columns={[
          {
            accessor: 'status',
            title: '状态',
            width: 90,
            render: (l) => (
              <Badge color={STATUS_COLORS[l.status || '未跟进'] || 'gray'} variant="light" size="sm">
                {l.status || '未跟进'}
              </Badge>
            ),
          },
          { accessor: 'name', title: '姓名', width: 90, render: (l) => l.name || '-' },
          { accessor: 'phone', title: '手机', width: 130 },
          { accessor: 'wechat', title: '微信', width: 130, render: (l) => l.wechat || '-' },
          {
            accessor: 'requirement',
            title: '需求描述',
            render: (l) => (
              <Text size="xs" lineClamp={2} maw={240}>{l.requirement || '-'}</Text>
            ),
          },
          { accessor: 'source', title: '来源', width: 90, render: (l) => l.source || '-' },
          {
            accessor: 'createdAt',
            title: '提交时间',
            width: 160,
            render: (l) => <Text size="xs">{formatTime(l.createdAt)}</Text>,
          },
          {
            accessor: 'actions',
            title: '操作',
            width: 80,
            render: (l) => (
              <Tooltip label="查看详情">
                <ActionIcon variant="subtle" color="blue" onClick={() => openDetail(l)}>
                  <IconEye size={16} />
                </ActionIcon>
              </Tooltip>
            ),
          },
        ]}
      />

      {/* 线索详情 Drawer */}
      <Drawer
        opened={!!selected}
        onClose={() => setSelected(null)}
        title="线索详情"
        position="right"
        size="md"
        padding="lg"
      >
        {selected && (
          <ScrollArea h="calc(100vh - 80px)" pr="sm">
            <Stack gap="md">
              {/* 基本信息 */}
              <Box>
                <Text fw={600} size="sm" mb="xs">基本信息</Text>
                <Stack gap={6}>
                  {selected.name && (
                    <Group gap={6}>
                      <IconUser size={14} color="gray" />
                      <Text size="sm">{selected.name}</Text>
                    </Group>
                  )}
                  {selected.phone && (
                    <Group gap={6}>
                      <IconPhone size={14} color="gray" />
                      <Anchor href={`tel:${selected.phone}`} size="sm">{selected.phone}</Anchor>
                    </Group>
                  )}
                  {selected.wechat && (
                    <Group gap={6}>
                      <IconBrandWechat size={14} color="gray" />
                      <Text size="sm">{selected.wechat}</Text>
                    </Group>
                  )}
                  {selected.requirement && (
                    <Group gap={6} align="flex-start">
                      <IconClipboardText size={14} color="gray" style={{ marginTop: 2 }} />
                      <Text size="sm" style={{ flex: 1 }}>{selected.requirement}</Text>
                    </Group>
                  )}
                </Stack>
              </Box>

              {/* 感兴趣的产品 */}
              {parseProducts(selected.interestedProducts).length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Group gap={6} mb="xs">
                      <IconPackage size={14} />
                      <Text fw={600} size="sm">感兴趣的产品</Text>
                    </Group>
                    <Group gap={6} wrap="wrap">
                      {parseProducts(selected.interestedProducts).map((p, i) => (
                        <Badge key={i} variant="outline" size="sm">{p}</Badge>
                      ))}
                    </Group>
                  </Box>
                </>
              )}

              {/* 浏览轨迹 */}
              {selected.sessionId && (
                <>
                  <Divider />
                  <Box>
                    <Group gap={6} mb="xs">
                      <IconHistory size={14} />
                      <Text fw={600} size="sm">浏览轨迹</Text>
                    </Group>
                    {eventsLoading ? (
                      <Text size="xs" c="dimmed">加载中...</Text>
                    ) : events.length > 0 ? (
                      <Timeline active={events.length} bulletSize={18} lineWidth={2}>
                        {events.slice(0, 20).map((e, i) => (
                          <Timeline.Item
                            key={i}
                            title={
                              <Text size="xs" fw={500}>
                                {eventLabel[e.event] || e.event}
                                {e.productModel && ` — ${e.productModel}`}
                              </Text>
                            }
                            bullet={<ThemeIcon size={18} radius="xl" color="blue" variant="light"><IconHistory size={10} /></ThemeIcon>}
                          >
                            <Text size="xs" c="dimmed">{formatTime(e.createdAt)}</Text>
                          </Timeline.Item>
                        ))}
                      </Timeline>
                    ) : (
                      <Text size="xs" c="dimmed">无浏览记录</Text>
                    )}
                  </Box>
                </>
              )}

              <Divider />

              {/* 跟进状态 & 备注 */}
              <Box>
                <Text fw={600} size="sm" mb="xs">跟进操作</Text>
                <Stack gap="sm">
                  <Select
                    label="跟进状态"
                    data={STATUS_OPTIONS}
                    value={status}
                    onChange={setStatus}
                  />
                  <Textarea
                    label="跟进备注"
                    placeholder="记录跟进情况..."
                    autosize
                    minRows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.currentTarget.value)}
                  />
                  <Button loading={saving} onClick={handleSave}>保存</Button>
                </Stack>
              </Box>
            </Stack>
          </ScrollArea>
        )}
      </Drawer>
    </Stack>
  )
}
