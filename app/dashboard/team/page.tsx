'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabaseClient'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

type StaffMember = {
  id: string
  name: string
  role: string
  commission_rate: number
  profile_id: string
  created_at?: string
}

const staffSchema = z.object({
  name: z.string().min(1, 'Ad soyad gereklidir'),
  role: z.string().min(1, 'Rol gereklidir'),
  commission_rate: z.coerce.number().min(0, '0 ile 1 arasında olmalı').max(1, '0 ile 1 arasında olmalı'),
})

type StaffFormData = z.infer<typeof staffSchema>

export default function TeamPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const to = new Date()
    const from = new Date()
    from.setDate(to.getDate() - 29)
    from.setHours(0, 0, 0, 0)
    to.setHours(23, 59, 59, 999)
    return { from, to }
  })
  type StaffPerformance = { staff_id: string; appointmentCount: number; totalRevenue: number }
  const [performanceData, setPerformanceData] = useState<StaffPerformance[]>([])

  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: '',
      role: '',
      commission_rate: 0.4,
    },
  })

  const fetchStaff = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('staff_members')
        .select('id, name, role, comission_rate, profile_id, created_at')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching staff members:', error)
        return
      }

      const normalized = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        role: row.role,
        commission_rate: typeof row.comission_rate === 'number' ? row.comission_rate : Number(row.comission_rate ?? 0),
        profile_id: row.profile_id,
        created_at: row.created_at,
      })) as StaffMember[]

      setStaff(normalized)
    } catch (err) {
      console.error('Error fetching staff members:', err)
    }
  }, [supabase])

  useEffect(() => {
    const run = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }
        setUser(session.user)
        await fetchStaff(session.user.id)
        await fetchPerformanceData(session.user.id)
      } catch (error) {
        console.error('Error:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }
    run()
  }, [router, supabase, fetchStaff])

  useEffect(() => {
    const load = async () => {
      if (!user) return
      await fetchPerformanceData(user.id)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.from, dateRange.to])

  const fetchPerformanceData = async (userId: string) => {
    try {
      // 1) Fetch staff list
      const { data: staffRows, error: staffError } = await supabase
        .from('staff_members')
        .select('id')
        .eq('profile_id', userId)

      if (staffError) {
        console.error('Error fetching staff list:', staffError)
        setPerformanceData([])
        return
      }

      const staffIds = (staffRows || []).map((r: any) => r.id) as string[]

      // 2) Fetch completed appointments in range with service prices
      const fromIso = dateRange.from.toISOString()
      const toIso = dateRange.to.toISOString()
      const { data: appts, error: apptsError } = await supabase
        .from('appointments')
        .select('staff_member_id, services:services(price)')
        .eq('profile_id', userId)
        .eq('status', 'completed')
        .gte('start_time', fromIso)
        .lte('start_time', toIso)

      if (apptsError) {
        console.error('Error fetching performance appointments:', apptsError)
        setPerformanceData([])
        return
      }

      // 3) Aggregate per staff
      const perfMap = new Map<string, { appointmentCount: number; totalRevenue: number }>()
      for (const sid of staffIds) perfMap.set(sid, { appointmentCount: 0, totalRevenue: 0 })

      for (const row of (appts || []) as Array<{ staff_member_id: string | null; services?: { price?: number } | Array<{ price?: number }> }>) {
        const sid = row.staff_member_id
        if (!sid) continue
        if (!perfMap.has(sid)) perfMap.set(sid, { appointmentCount: 0, totalRevenue: 0 })
        const raw = row.services
        const price = Array.isArray(raw) ? (raw[0]?.price ?? 0) : (raw?.price ?? 0)
        const entry = perfMap.get(sid)!
        entry.appointmentCount += 1
        entry.totalRevenue += price
      }

      const result: StaffPerformance[] = Array.from(perfMap.entries()).map(([staff_id, v]) => ({
        staff_id,
        appointmentCount: v.appointmentCount,
        totalRevenue: v.totalRevenue,
      }))
      setPerformanceData(result)
    } catch (err) {
      console.error('Error computing performance:', err)
      setPerformanceData([])
    }
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    form.reset()
  }

  const onSubmit = async (data: StaffFormData) => {
    if (!user) return
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('staff_members')
        .insert({
          name: data.name,
          role: data.role,
          comission_rate: Number(data.commission_rate),
          profile_id: user.id,
        })

      if (error) {
        console.error('Error creating staff member:', error)
      } else {
        await fetchStaff(user.id)
        closeDialog()
      }
    } catch (error) {
      console.error('Error creating staff member:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-50 mx-auto mb-4"></div>
          <p className="text-slate-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Ekip Yönetimi</h1>
            <p className="text-slate-400">Personel bilgilerinizi yönetin ve yeni ekip üyeleri ekleyin</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-slate-50 text-slate-950 hover:bg-slate-200">
                + Yeni Personel Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
              <DialogHeader>
                <DialogTitle>Yeni Personel Ekle</DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Ad Soyad</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ahmet Yılmaz" className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Rol</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Usta / Çırak" className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="commission_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Prim Oranı (0 - 1)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" max="1" {...field} className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={closeDialog}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      İptal
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-slate-50 text-slate-950 hover:bg-slate-200"
                    >
                      {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="bg-slate-900 border-slate-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Tarih Aralığı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-full sm:w-auto justify-start text-left font-normal text-slate-200 border-slate-700', !dateRange.from && 'text-slate-400')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from && dateRange.to
                      ? `${format(dateRange.from, 'PPP', { locale: tr })} - ${format(dateRange.to, 'PPP', { locale: tr })}`
                      : 'Tarih aralığı seçin'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-900 border border-slate-800" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range: any) => {
                      if (!range) return
                      const from = range.from ? new Date(range.from) : dateRange.from
                      const to = range.to ? new Date(range.to) : dateRange.to
                      if (from) from.setHours(0, 0, 0, 0)
                      if (to) to.setHours(23, 59, 59, 999)
                      setDateRange({ from: from || dateRange.from, to: to || dateRange.to })
                    }}
                    numberOfMonths={2}
                    locale={tr}
                    className="text-slate-200"
                    classNames={{
                      day_selected: 'bg-slate-50 text-slate-950 hover:bg-slate-200',
                      day_today: 'bg-slate-800 text-slate-50',
                      day: 'text-slate-300 hover:bg-slate-800 hover:text-white',
                      head_cell: 'text-slate-400',
                      nav_button: 'text-slate-400 hover:bg-slate-800 hover:text-white',
                      caption: 'text-slate-300',
                      caption_label: 'text-slate-300 font-medium',
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Staff Table */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Personel Listesi ({staff.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-slate-800/50">
                  <TableHead className="text-slate-300">Ad Soyad</TableHead>
                  <TableHead className="text-slate-300">Rol</TableHead>
                  <TableHead className="text-slate-300">Prim Oranı</TableHead>
                  <TableHead className="text-slate-300">Tamamlanan Randevu</TableHead>
                  <TableHead className="text-slate-300">Toplam Ciro</TableHead>
                  <TableHead className="text-slate-300">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map(member => (
                  <TableRow key={member.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="text-white">{member.name}</TableCell>
                    <TableCell className="text-slate-300">{member.role}</TableCell>
                    <TableCell className="text-slate-300">{(member.commission_rate * 100).toFixed(0)}%</TableCell>
                    {(() => {
                      const perf = performanceData.find((p) => p.staff_id === member.id)
                      const count = perf?.appointmentCount ?? 0
                      const revenue = perf?.totalRevenue ?? 0
                      return (
                        <>
                          <TableCell className="text-slate-300">{count}</TableCell>
                          <TableCell className="text-slate-300">{revenue.toFixed(0)} TL</TableCell>
                        </>
                      )
                    })()}
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-200 hover:bg-slate-800">Düzenle</Button>
                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-900/20">Sil</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


