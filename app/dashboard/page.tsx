'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'
import { CalendarDays, DollarSign, Users, Calendar, Scissors, BookUser, GalleryHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import WeeklyChart from '@/components/dashboard/WeeklyChart'
import TodaysAgenda from '@/components/dashboard/TodaysAgenda'
import AddAppointmentModal from '@/components/dashboard/AddAppointmentModal'
import BusinessOverviewWidget from '@/components/dashboard/BusinessOverviewWidget'
import OpportunityBanner from '../../components/dashboard/OpportunityBanner'
import useOpportunities from '@/lib/hooks/useOpportunities'

// Pure helper: process analytics data based on time range
function processAnalyticsData(
  appointments: Array<{
    id: string
    start_time: string
    status?: string | null
    client_id: string
    service_id?: string | null
    staff_member_id?: string | null
    service_name?: string
    service_price?: number
    staff_name?: string
  }>,
  clients: Array<{ id: string; created_at: string }>,
  timeRange: '7d' | '30d' | '6m'
) {
  const today = new Date()
  let start = new Date(today)
  const end = new Date(today)
  if (timeRange === '7d') {
    start.setDate(today.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
  } else if (timeRange === '30d') {
    start.setDate(today.getDate() - 29)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
  } else {
    start = new Date(today.getFullYear(), today.getMonth() - 5, 1, 0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
  }

  const inRange = appointments.filter(a => {
    const d = new Date(a.start_time)
    return d >= start && d <= end
  })

  const completed = inRange.filter(a => (a.status ?? 'booked') === 'completed')

  const serviceRevenue = new Map<string, { name: string; revenue: number }>()
  const staffRevenue = new Map<string, { name: string; revenue: number }>()

  completed.forEach(a => {
    const price = a.service_price || 0
    const sKey = a.service_id || 'unknown'
    const sName = a.service_name || 'Bilinmeyen Hizmet'
    serviceRevenue.set(sKey, { name: sName, revenue: (serviceRevenue.get(sKey)?.revenue || 0) + price })

    const stKey = a.staff_member_id || 'owner'
    const stName = a.staff_name || 'İşletme Sahibi'
    staffRevenue.set(stKey, { name: stName, revenue: (staffRevenue.get(stKey)?.revenue || 0) + price })
  })

  const clientsCreated = new Map<string, Date>(clients.map(c => [c.id, new Date(c.created_at)]))
  let newCustomers = 0
  let returningCustomers = 0
  const distinctClientIds = new Set(inRange.map(a => a.client_id))
  distinctClientIds.forEach(id => {
    const created = clientsCreated.get(id)
    if (created && created >= start && created <= end) newCustomers += 1
    else returningCustomers += 1
  })

  return {
    topServices: Array.from(serviceRevenue.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 3),
    topStaff: Array.from(staffRevenue.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 3),
    customerStats: { newCustomers, returningCustomers },
  }
}

interface Appointment {
  id: string
  start_time: string
  clients: { id: string; name: string }
  services: { name: string; price: number }
  staff_members?: { name?: string | null } | null
  profiles?: { full_name?: string | null } | null
  status?: 'booked' | 'completed' | 'cancelled'
}

// WeeklyData removed as weekly chart is no longer rendered

// Removed old AnalyticsData structure

interface DashboardStats {
  todaysAppointments: number
  todaysExpectedRevenue: number
  totalClients: number
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    todaysAppointments: 0,
    todaysExpectedRevenue: 0,
    totalClients: 0
  })
  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([])
  // Removed unused weeklyData state
  // Stats for BusinessOverviewWidget
  const [overviewTopServices, setOverviewTopServices] = useState<{ name: string; revenue: number }[]>([])
  const [overviewTopStaff, setOverviewTopStaff] = useState<{ name: string; revenue: number }[]>([])
  const [overviewCustomers, setOverviewCustomers] = useState<{ newCustomers: number; returningCustomers: number }>({ newCustomers: 0, returningCustomers: 0 })
  type RawAppointment = {
    id: string
    start_time: string
    status?: string | null
    client_id: string
    service_id?: string | null
    staff_member_id?: string | null
    service_name?: string
    service_price?: number
    staff_name?: string
  }
  type RawClient = { id: string; created_at: string }
  const [rawAppointments, setRawAppointments] = useState<RawAppointment[]>([])
  const [rawClients, setRawClients] = useState<RawClient[]>([])
  // Removed unused timeRange local state
  const [businessOverviewTimeRange, setBusinessOverviewTimeRange] = useState<'7d' | '30d' | '6m'>('7d')
  const [weeklyData, setWeeklyData] = useState<{ date: string; total: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { opportunities } = useOpportunities()

  // Initial load effect is placed after callback definitions

  // Initial load after defining data-fetching callbacks

  // Reprocess Business Overview analytics when its timeRange changes
  useEffect(() => {
    if (rawAppointments.length > 0 || rawClients.length > 0) {
      // Reprocess raw data with new timeRange
      const processedData = processAnalyticsData(
        rawAppointments,
        rawClients,
        businessOverviewTimeRange
      )
      
      setOverviewTopServices(processedData.topServices)
      setOverviewTopStaff(processedData.topStaff)
      setOverviewCustomers(processedData.customerStats)
    }
  }, [businessOverviewTimeRange, rawAppointments, rawClients])

  const fetchTodaysAppointments = useCallback(async (userId: string) => {
    try {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

      const { data, error } = await supabase
        .from('appointments')
        .select('*, clients(name), services(name, price), staff_members!appointments_staff_member_id_fkey(name), profiles(full_name)')
        .eq('profile_id', userId)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .order('start_time', { ascending: true })

      if (error) {
        console.error('Error fetching appointments:', error)
        return
      }

      const enrichedAppointments: Appointment[] = (data || []).map((row: {
        id: string
        start_time: string
        client_id: string
        clients?: { name?: string | null } | null
        services?: { name?: string | null; price?: number | null } | null
        staff_members?: Appointment['staff_members']
        profiles?: Appointment['profiles']
        status?: Appointment['status']
      }) => ({
        id: row.id,
        start_time: row.start_time,
        clients: { id: row.client_id, name: row.clients?.name || 'Bilinmeyen Müşteri' },
        services: { name: row.services?.name || 'Bilinmeyen Hizmet', price: row.services?.price || 0 },
        staff_members: row.staff_members || null,
        profiles: row.profiles || null,
        status: row.status || 'booked',
      }))

      setTodaysAppointments(enrichedAppointments)
      const todaysRevenue = enrichedAppointments.reduce((total, appointment) => total + (appointment.services.price || 0), 0)

        // Update stats
        setStats(prev => ({
          ...prev,
          todaysAppointments: enrichedAppointments.length,
          todaysExpectedRevenue: todaysRevenue
        }))
      
    } catch (error) {
      console.error('Error fetching appointments:', error)
    }
  }, [supabase])

  const fetchTotalClients = useCallback(async (userId: string) => {
    try {
      const { data: clientsData, error } = await supabase
        .from('clients')
        .select('id')
        .eq('profile_id', userId)

      if (error) {
        console.error('Error fetching clients:', error)
      } else {
        setStats(prev => ({
          ...prev,
          totalClients: clientsData?.length || 0
        }))
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }, [supabase])

  // Removed weekly data computation since WeeklyChart is no longer used

  const fetchAnalyticsData = useCallback(async (userId: string) => {
    try {
      // Always fetch a broad window (last 6 months) and slice by UI filter in-process
      const today = new Date()
      const periodStart = new Date(today.getFullYear(), today.getMonth() - 5, 1, 0, 0, 0, 0)
      const periodEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
      const startDate = periodStart.toISOString()
      const endDate = periodEnd.toISOString()

      // Fetch appointments with service/staff/client info for revenue calculation
      const { data: allAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          status,
          client_id,
          service_id,
          staff_member_id,
          services(name, price),
          staff_members!appointments_staff_member_id_fkey(name)
        `)
        .eq('profile_id', userId)
        .gte('start_time', startDate)
        .lte('start_time', endDate)

      // Fetch clients created in the selected period
      const { data: allClients, error: clientsError } = await supabase
        .from('clients')
        .select('id, created_at')
        .eq('profile_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError)
      }
      if (clientsError) {
        console.error('Error fetching clients:', clientsError)
      }

      // Normalize and store raw data for reprocessing
      const normalizedAppointments: RawAppointment[] = ((allAppointments || []) as Array<{
        id: string
        start_time: string
        status?: string | null
        client_id: string
        service_id?: string | null
        staff_member_id?: string | null
        services?: { name?: string | null; price?: number | null } | null
        staff_members?: { name?: string | null } | null
      }>).map((row) => ({
        id: row.id,
        start_time: row.start_time,
        status: row.status,
        client_id: row.client_id,
        service_id: row.service_id,
        staff_member_id: row.staff_member_id,
        service_name: row.services?.name ?? undefined,
        service_price: (row.services?.price as number | null) ?? 0,
        staff_name: row.staff_members?.name ?? undefined,
      }))
      setRawAppointments(normalizedAppointments)
      setRawClients((allClients || []) as RawClient[])
      
      // Do not process here; reprocessed in separate effect when raw data/timeRange changes

    } catch (error) {
      console.error('Error fetching analytics data:', error)
    }
  }, [supabase])

  // Fetch last 7 days for WeeklyChart
  const fetchLast7Days = useCallback(async (userId: string) => {
    try {
      const today = new Date()
      const start = new Date(today)
      start.setDate(today.getDate() - 6)
      start.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('appointments')
        .select('start_time')
        .eq('profile_id', userId)
        .gte('start_time', start.toISOString())
        .lte('start_time', today.toISOString())

      if (error) {
        console.error('Error fetching last 7 days appointments:', error)
        return
      }

      const points = computeWeeklyData((data || []) as Array<{ start_time: string }>)
      setWeeklyData(points)
    } catch (e) {
      console.error('Unexpected error fetching last 7 days appointments:', e)
    }
  }, [supabase])

  const computeWeeklyData = (appointments: Array<{ start_time: string }>): { date: string; total: number }[] => {
    const today = new Date()
    const days: Date[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      d.setHours(0, 0, 0, 0)
      days.push(d)
    }

    const counts = new Map<string, number>()
    days.forEach(d => counts.set(d.toISOString().split('T')[0], 0))

    appointments.forEach(a => {
      const d = new Date(a.start_time)
      d.setHours(0, 0, 0, 0)
      const key = d.toISOString().split('T')[0]
      if (counts.has(key)) counts.set(key, (counts.get(key) || 0) + 1)
    })

    return days.map(d => {
      const key = d.toISOString().split('T')[0]
      const label = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
      return { date: label, total: counts.get(key) || 0 }
    })
  }

  // Identify highest-priority opportunity (currently: lapsing client)
  const topOpportunity = useMemo(() => {
    if (!opportunities || opportunities.length === 0) return null
    // Priority: lapsing first, else first available
    const lapsing = opportunities.find((o) => o.type === 'lapsing')
    return lapsing || opportunities[0] || null
  }, [opportunities])

  // (moved processAnalyticsData to module scope)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }
  
  // Now that callbacks are defined, run initial load
  useEffect(() => {
    const run = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }
        setUser(session.user)
        await Promise.all([
          fetchTodaysAppointments(session.user.id),
          fetchTotalClients(session.user.id),
          fetchAnalyticsData(session.user.id),
          fetchLast7Days(session.user.id),
        ])
      } catch (error) {
        console.error('Error:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }
    run()
  }, [router, supabase, fetchTodaysAppointments, fetchTotalClients, fetchAnalyticsData, fetchLast7Days])

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Yükleniyor...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Kontrol Paneli
          </h1>
          <div className="flex items-center gap-3">
            <AddAppointmentModal />
            <div className="flex items-center gap-1">
              <Link href="/dashboard/portfolio">
                <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white" title="Portfolyo" aria-label="Portfolyo">
                  <GalleryHorizontal className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/dashboard/clients">
                <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white" title="Müşteriler" aria-label="Müşteriler">
                  <Users className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/dashboard/services">
                <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white" title="Hizmetler" aria-label="Hizmetler">
                  <Scissors className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/dashboard/team">
                <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white" title="Personel" aria-label="Personel">
                  <BookUser className="h-5 w-5" />
                </Button>
              </Link>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-white">Çıkış Yap</button>
          </div>
        </div>

        {topOpportunity && (
          <div className="mb-6">
            <OpportunityBanner opportunity={{ text: topOpportunity.description }} />
          </div>
        )}
        
        <p className="text-lg text-slate-300 mb-8">
          Hoş geldin, <span className="font-bold text-white">{user.email}</span>! İşletmeni buradan yönetebilirsin.
        </p>

                {/* Main Content Grid - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column - Quick Look (Small) + Weekly Activity (Large) */}
          <div className="flex flex-col">
            <div className="space-y-6 flex-1 flex flex-col">
              {/* Hızlı Bakış - small height */}
              <div className="min-h-[220px]">
                <Card className="bg-slate-900 border-slate-800 h-full">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-white">Hızlı Bakış</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Card className="p-6 bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                      <CardHeader className="p-0">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-slate-400" />
                          <CardTitle className="text-slate-300 text-sm font-medium">Bugünkü Randevu Sayısı</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0 pt-2">
                        <div className="text-3xl font-bold text-white">{stats.todaysAppointments}</div>
                      </CardContent>
                    </Card>

                    <Card className="p-6 bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                      <CardHeader className="p-0">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-slate-400" />
                          <CardTitle className="text-slate-300 text-sm font-medium">Bugünkü Beklenen Kazanç</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0 pt-2">
                        <div className="text-3xl font-bold text-white">{`${stats.todaysExpectedRevenue.toFixed(0)} TL`}</div>
                      </CardContent>
                    </Card>

                    <Card className="p-6 bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                      <CardHeader className="p-0">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-slate-400" />
                          <CardTitle className="text-slate-300 text-sm font-medium">Toplam Müşteri Sayısı</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0 pt-2">
                        <div className="text-3xl font-bold text-white">{stats.totalClients}</div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </div>
              
              {/* Haftalık Aktivite - large (fill remaining) */}
              <div className="flex-grow [&>div]:h-full min-h-[360px]">
                <WeeklyChart data={weeklyData} />
              </div>
            </div>
          </div>
          
          {/* Right Column - Günün Ajandası (Large) + İşletme Durumu (Small) */}
          <div className="flex flex-col">
            <div className="space-y-6 flex-1 flex flex-col">
              
              {/* Günün Ajandası - large */}
              <Card className="bg-slate-900 border-slate-800 min-h-[360px] flex-1">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-white flex items-center">
                    <Calendar className="h-8 w-8 text-slate-400 mr-3" />
                    Günün Ajandası
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TodaysAgenda appointments={todaysAppointments} onStatusChange={() => user && fetchTodaysAppointments(user.id)} />
                </CardContent>
              </Card>

              {/* İşletme Durumu - small */}
              <div className="min-h-[220px]">
                <BusinessOverviewWidget
                  topServices={overviewTopServices}
                  topStaff={overviewTopStaff}
                  customerStats={overviewCustomers}
                  timeRange={businessOverviewTimeRange}
                  setTimeRange={setBusinessOverviewTimeRange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}