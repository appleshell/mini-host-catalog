'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Stack, Title, Button, Group, TextInput, Select, Drawer,
  SimpleGrid, Textarea, Switch, NumberInput, Text, Image,
  ActionIcon, Tooltip, Badge, Box, FileButton, Loader, Center,
  Modal,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { DataTable } from 'mantine-datatable'
import { IconPlus, IconEdit, IconTrash, IconPhoto, IconSearch } from '@tabler/icons-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

type Product = {
  id: number; category: string; model: string; imageUrl?: string | null
  cpu?: string | null; memory?: string | null; storage?: string | null
  gpu?: string | null; network?: string | null; audio?: string | null
  display?: string | null; otherPorts?: string | null; dimensions?: string | null
  os?: string | null; power?: string | null; cooling?: string | null
  mounting?: string | null; notes?: string | null
  networkCount?: number | null; serialCount?: number | null
  hasWifi?: boolean | null; hasFanless?: boolean | null
}

const CATEGORIES = [
  '工控机', '服务器', '嵌入式', '迷你主机', '工作站', '显示器', '其他'
]

function emptyProduct(): Omit<Product, 'id'> {
  return {
    category: '', model: '', imageUrl: null, cpu: null, memory: null,
    storage: null, gpu: null, network: null, audio: null, display: null,
    otherPorts: null, dimensions: null, os: null, power: null, cooling: null,
    mounting: null, notes: null, networkCount: null, serialCount: null,
    hasWifi: null, hasFanless: null,
  }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const form = useForm<Omit<Product, 'id'>>({ initialValues: emptyProduct() })

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const url = categoryFilter
        ? `${API}/api/products?category=${encodeURIComponent(categoryFilter)}`
        : `${API}/api/products`
      const res = await fetch(url)
      const json = await res.json()
      setProducts(json.data || [])
    } catch {
      notifications.show({ message: '加载产品失败', color: 'red' })
    } finally {
      setLoading(false)
    }
  }, [categoryFilter])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  function openCreate() {
    setEditTarget(null)
    form.setValues(emptyProduct())
    setDrawerOpen(true)
  }

  function openEdit(p: Product) {
    setEditTarget(p)
    form.setValues({ ...p })
    setDrawerOpen(true)
  }

  async function handleSave(values: Omit<Product, 'id'>) {
    setSaving(true)
    try {
      const url = editTarget ? `${API}/api/products/${editTarget.id}` : `${API}/api/products`
      const method = editTarget ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error('保存失败')
      notifications.show({ message: editTarget ? '产品已更新' : '产品已创建', color: 'green' })
      setDrawerOpen(false)
      fetchProducts()
    } catch {
      notifications.show({ message: '保存失败', color: 'red' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await fetch(`${API}/api/products/${deleteTarget.id}`, { method: 'DELETE' })
      notifications.show({ message: '产品已删除', color: 'green' })
      setDeleteTarget(null)
      fetchProducts()
    } catch {
      notifications.show({ message: '删除失败', color: 'red' })
    }
  }

  async function handleUpload(file: File | null) {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${API}/api/upload`, { method: 'POST', body: fd })
      const json = await res.json()
      form.setFieldValue('imageUrl', json.url)
      notifications.show({ message: '图片已上传', color: 'green' })
    } catch {
      notifications.show({ message: '上传失败', color: 'red' })
    } finally {
      setUploading(false)
    }
  }

  const filtered = products.filter((p) =>
    !search || p.model.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>产品管理</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>新增产品</Button>
      </Group>

      <Group>
        <TextInput
          placeholder="搜索型号..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          w={240}
        />
        <Select
          placeholder="所有分类"
          data={CATEGORIES}
          value={categoryFilter}
          onChange={setCategoryFilter}
          clearable
          w={180}
        />
      </Group>

      <DataTable
        withTableBorder
        borderRadius="md"
        striped
        highlightOnHover
        records={filtered}
        fetching={loading}
        minHeight={200}
        columns={[
          {
            accessor: 'imageUrl',
            title: '图片',
            width: 70,
            render: (p) => p.imageUrl
              ? <Image src={`${API}${p.imageUrl}`} h={40} w={40} fit="contain" radius="sm" />
              : <Box w={40} h={40} bg="gray.1" style={{ borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconPhoto size={16} color="gray" />
                </Box>
          },
          { accessor: 'category', title: '分类', width: 100, render: (p) => <Badge variant="light" size="sm">{p.category}</Badge> },
          { accessor: 'model', title: '产品型号', width: 180 },
          { accessor: 'cpu', title: 'CPU', width: 160, render: (p) => <Text size="xs" c="dimmed" lineClamp={1}>{p.cpu || '-'}</Text> },
          { accessor: 'memory', title: '内存', width: 100, render: (p) => p.memory || '-' },
          { accessor: 'storage', title: '硬盘', width: 120, render: (p) => p.storage || '-' },
          { accessor: 'network', title: '网络', width: 120, render: (p) => <Text size="xs" lineClamp={1}>{p.network || '-'}</Text> },
          {
            accessor: 'actions',
            title: '操作',
            width: 100,
            render: (p) => (
              <Group gap={4}>
                <Tooltip label="编辑">
                  <ActionIcon variant="subtle" color="blue" onClick={() => openEdit(p)}>
                    <IconEdit size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="删除">
                  <ActionIcon variant="subtle" color="red" onClick={() => setDeleteTarget(p)}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            ),
          },
        ]}
      />

      {/* 新增/编辑 Drawer */}
      <Drawer
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editTarget ? '编辑产品' : '新增产品'}
        position="right"
        size="xl"
        padding="lg"
      >
        <form onSubmit={form.onSubmit(handleSave)}>
          <Stack gap="sm">
            <SimpleGrid cols={2} spacing="sm">
              <Select
                label="分类"
                data={CATEGORIES}
                required
                {...form.getInputProps('category')}
              />
              <TextInput label="产品型号" required {...form.getInputProps('model')} />
            </SimpleGrid>

            {/* 图片上传 */}
            <Stack gap={4}>
              <Text size="sm" fw={500}>产品图片</Text>
              <Group align="center">
                {form.values.imageUrl && (
                  <Image src={`${API}${form.values.imageUrl}`} h={60} w={60} fit="contain" radius="sm" />
                )}
                <FileButton onChange={handleUpload} accept="image/*">
                  {(props) => (
                    <Button variant="outline" size="xs" {...props} loading={uploading}>
                      {form.values.imageUrl ? '重新上传' : '上传图片'}
                    </Button>
                  )}
                </FileButton>
              </Group>
            </Stack>

            <SimpleGrid cols={2} spacing="sm">
              <Textarea label="CPU" autosize minRows={2} {...form.getInputProps('cpu')} />
              <SimpleGrid cols={1} spacing="sm">
                <TextInput label="内存" {...form.getInputProps('memory')} />
                <TextInput label="硬盘" {...form.getInputProps('storage')} />
              </SimpleGrid>
            </SimpleGrid>

            <SimpleGrid cols={2} spacing="sm">
              <TextInput label="GPU" {...form.getInputProps('gpu')} />
              <TextInput label="显示" {...form.getInputProps('display')} />
            </SimpleGrid>
            <SimpleGrid cols={2} spacing="sm">
              <Textarea label="网络接口" autosize minRows={2} {...form.getInputProps('network')} />
              <Textarea label="其它接口" autosize minRows={2} {...form.getInputProps('otherPorts')} />
            </SimpleGrid>
            <SimpleGrid cols={2} spacing="sm">
              <TextInput label="音频" {...form.getInputProps('audio')} />
              <TextInput label="物理尺寸" {...form.getInputProps('dimensions')} />
            </SimpleGrid>
            <SimpleGrid cols={2} spacing="sm">
              <TextInput label="操作系统" {...form.getInputProps('os')} />
              <TextInput label="电源" {...form.getInputProps('power')} />
            </SimpleGrid>
            <SimpleGrid cols={2} spacing="sm">
              <TextInput label="散热" {...form.getInputProps('cooling')} />
              <TextInput label="安装方式" {...form.getInputProps('mounting')} />
            </SimpleGrid>
            <SimpleGrid cols={2} spacing="sm">
              <NumberInput label="网口数量" {...form.getInputProps('networkCount')} />
              <NumberInput label="串口数量" {...form.getInputProps('serialCount')} />
            </SimpleGrid>
            <SimpleGrid cols={2} spacing="sm">
              <Switch label="支持 WiFi" {...form.getInputProps('hasWifi', { type: 'checkbox' })} />
              <Switch label="无风扇" {...form.getInputProps('hasFanless', { type: 'checkbox' })} />
            </SimpleGrid>
            <Textarea label="备注" autosize minRows={2} {...form.getInputProps('notes')} />

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setDrawerOpen(false)}>取消</Button>
              <Button type="submit" loading={saving}>保存</Button>
            </Group>
          </Stack>
        </form>
      </Drawer>

      {/* 删除确认弹窗 */}
      <Modal
        opened={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="确认删除"
        size="sm"
        centered
      >
        <Text>确定要删除产品 <strong>{deleteTarget?.model}</strong> 吗？</Text>
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={() => setDeleteTarget(null)}>取消</Button>
          <Button color="red" onClick={handleDelete}>确认删除</Button>
        </Group>
      </Modal>
    </Stack>
  )
}
