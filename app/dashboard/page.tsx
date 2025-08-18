'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'
import { CalendarDays, DollarSign, Users, Calendar, Edit, Scissors, BookUser, Image as ImageIcon } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import StatCard from '@/components/dashboard/StatCard'
import TodaysAgenda from '@/components/dashboard/TodaysAgenda'
import AddAppointmentModal from '@/components/dashboard/AddAppointmentModal'
import AnalyticsWidget from '@/components/dashboard/AnalyticsWidget'

interface Appointment {
  id: string
  start_time: string
  clients: { id: string; name: string }
  services: { name: string; price: number }
  status?: 'booked' | 'completed' | 'cancelled'
}

// WeeklyData removed as weekly chart is no longer rendered

interface AnalyticsData {
  date: string
  total: number
}

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
  const [appointmentData, setAppointmentData] = useState<AnalyticsData[]>([])
  const [revenueData, setRevenueData] = useState<AnalyticsData[]>([])
  const [newClientData, setNewClientData] = useState<AnalyticsData[]>([])
  type RawAppointment = { start_time: string; services?: Array<{ price: number }> }
  type RawClient = { created_at: string }
  const [rawAppointments, setRawAppointments] = useState<RawAppointment[]>([])
  const [rawClients, setRawClients] = useState<RawClient[]>([])
  const [timeRange, setTimeRange] = useState('7d')
  const [isLoading, setIsLoading] = useState(true)

  // Initial load effect is placed after callback definitions

  // Initial load after defining data-fetching callbacks

  // Reprocess analytics data when timeRange changes
  useEffect(() => {
    if (rawAppointments.length > 0 || rawClients.length > 0) {
      // Reprocess raw data with new timeRange
      const processedData = processAnalyticsData(
        rawAppointments,
        rawClients,
        timeRange
      )
      
      setAppointmentData(processedData.appointmentData)
      setRevenueData(processedData.revenueData)
      setNewClientData(processedData.newClientData)
    }
  }, [timeRange, rawAppointments, rawClients])

  const fetchTodaysAppointments = useCallback(async (userId: string) => {
    try {
      // Get today's date range (start and end of day)
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
      
      const startOfDayISO = startOfDay.toISOString()
      const endOfDayISO = endOfDay.toISOString()

      // First, fetch appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id, start_time, client_id, service_id, status')
        .eq('profile_id', userId)
        .gte('start_time', startOfDayISO)
        .lte('start_time', endOfDayISO)
        .order('start_time', { ascending: true })

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError)
        return
      }

      console.log('Raw appointments:', appointmentsData)

      // Then, fetch clients and services separately
      if (appointmentsData && appointmentsData.length > 0) {
        const clientIds = appointmentsData.map(apt => apt.client_id).filter(Boolean)
        const serviceIds = appointmentsData.map(apt => apt.service_id).filter(Boolean)

        console.log('Client IDs:', clientIds)
        console.log('Service IDs:', serviceIds)

        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, name')
          .in('id', clientIds)

        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('id, name, price')
          .in('id', serviceIds)

        if (clientsError) console.error('Error fetching clients:', clientsError)
        if (servicesError) console.error('Error fetching services:', servicesError)

        console.log('Clients data:', clientsData)
        console.log('Services data:', servicesData)

        // Combine the data
        const enrichedAppointments = appointmentsData.map(appointment => {
          const client = clientsData?.find(c => c.id === appointment.client_id)
          const service = servicesData?.find(s => s.id === appointment.service_id)
          return {
            id: appointment.id,
            start_time: appointment.start_time,
            clients: { 
              id: client?.id || appointment.client_id || 'unknown',
              name: client?.name || 'Bilinmeyen Müşteri'
            },
            services: { 
              name: service?.name || 'Bilinmeyen Hizmet',
              price: service?.price || 0
            },
            status: (appointment as any).status || 'booked'
          }
        })

        console.log('Enriched appointments:', enrichedAppointments)
        setTodaysAppointments(enrichedAppointments)
        
        // Calculate today's revenue from services
        const todaysRevenue = enrichedAppointments.reduce((total, appointment) => {
          return total + (appointment.services.price || 0)
        }, 0)

        // Update stats
        setStats(prev => ({
          ...prev,
          todaysAppointments: appointmentsData?.length || 0,
          todaysExpectedRevenue: todaysRevenue
        }))
      } else {
        setTodaysAppointments([])
        setStats(prev => ({
          ...prev,
          todaysAppointments: 0,
          todaysExpectedRevenue: 0
        }))
      }
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
      // Always fetch data covering the last 6 months INCLUDING the current month
      // Start from the first day of the month 5 months ago, through today
      const today = new Date()
      const startFrom = new Date(today)
      startFrom.setMonth(today.getMonth() - 5)
      startFrom.setDate(1)
      startFrom.setHours(0, 0, 0, 0)
      
      const startDate = startFrom.toISOString()
      const endDate = today.toISOString()

      // Fetch appointments with service information for revenue calculation
      const { data: allAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          start_time,
          services:services(price)
        `)
        .eq('profile_id', userId)
        .gte('start_time', startDate)
        .lte('start_time', endDate)

      // Fetch clients created in the last 6 months
      const { data: allClients, error: clientsError } = await supabase
        .from('clients')
        .select('created_at')
        .eq('profile_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError)
      }
      if (clientsError) {
        console.error('Error fetching clients:', clientsError)
      }

      // Store raw data for reprocessing
      setRawAppointments(allAppointments || [])
      setRawClients(allClients || [])
      
      // Process the data for analytics based on current timeRange
      const processedData = processAnalyticsData(
        allAppointments || [],
        allClients || [],
        timeRange
      )
      
      setAppointmentData(processedData.appointmentData)
      setRevenueData(processedData.revenueData)
      setNewClientData(processedData.newClientData)

    } catch (error) {
      console.error('Error fetching analytics data:', error)
    }
  }, [supabase, timeRange])

  // Helper function to process analytics data with advanced aggregation
  const processAnalyticsData = (
    appointments: Array<{ start_time: string; services?: Array<{ price: number }> }>,
    clients: Array<{ created_at: string }>,
    timeRange: string
  ) => {
    const today = new Date()
    const appointmentData: AnalyticsData[] = []
    const revenueData: AnalyticsData[] = []
    const newClientData: AnalyticsData[] = []
    
    if (timeRange === '7d') {
      // Group by individual days for last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        
        const dayStart = new Date(date)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(date)
        dayEnd.setHours(23, 59, 59, 999)
        
        const dayAppointments = appointments.filter(apt => {
          const aptDate = new Date(apt.start_time)
          return aptDate >= dayStart && aptDate <= dayEnd
        })
        
        const dayRevenue = dayAppointments.reduce((total, apt) => {
          const servicePrice = apt.services?.[0]?.price || 0
          return total + servicePrice
        }, 0)
        
        const dayNewClients = clients.filter(client => {
          const clientDate = new Date(client.created_at)
          return clientDate >= dayStart && clientDate <= dayEnd
        })
        
        const dateString = date.toISOString().split('T')[0]
        
        appointmentData.push({
          date: dateString,
          total: dayAppointments.length
        })
        
        revenueData.push({
          date: dateString,
          total: dayRevenue
        })
        
        newClientData.push({
          date: dateString,
          total: dayNewClients.length
        })
      }
    } else if (timeRange === '30d') {
      // Group by last 4 FULL weeks ending on Sundays, label each by the Sunday date (e.g., "August 11")
      const ref = new Date(today)
      ref.setHours(0, 0, 0, 0)
      const day = ref.getDay() // 0 Sun - 6 Sat
      // Closest former Sunday (exclude today if Sunday)
      const lastSunday = new Date(ref)
      if (day === 0) {
        lastSunday.setDate(ref.getDate() - 7)
      } else {
        lastSunday.setDate(ref.getDate() - day)
      }

      // Build 4 weeks: oldest to most recent completed week
      for (let i = 3; i >= 0; i--) {
        const weekEnd = new Date(lastSunday)
        weekEnd.setDate(lastSunday.getDate() - (i * 7))
        weekEnd.setHours(23, 59, 59, 999)

        const weekStart = new Date(weekEnd)
        weekStart.setDate(weekEnd.getDate() - 6)
        weekStart.setHours(0, 0, 0, 0)

        const weekAppointments = appointments.filter(apt => {
          const aptDate = new Date(apt.start_time)
          return aptDate >= weekStart && aptDate <= weekEnd
        })

        const weekRevenue = weekAppointments.reduce((total, apt) => {
          const servicePrice = apt.services?.[0]?.price || 0
          return total + servicePrice
        }, 0)

        const weekNewClients = clients.filter(client => {
          const clientDate = new Date(client.created_at)
          return clientDate >= weekStart && clientDate <= weekEnd
        })

        // Label as Monday–Sunday range in Turkish (day before month) with "Haftası"
        const sameMonth = weekStart.getMonth() === weekEnd.getMonth() && weekStart.getFullYear() === weekEnd.getFullYear()
        const startMonthName = weekStart.toLocaleDateString('tr-TR', { month: 'long' })
        const endMonthName = weekEnd.toLocaleDateString('tr-TR', { month: 'long' })
        const startDay = weekStart.getDate()
        const endDay = weekEnd.getDate()
        const label = sameMonth
          ? `${startDay} ${startMonthName} - ${endDay} ${endMonthName} Haftası`
          : `${startDay} ${startMonthName} - ${endDay} ${endMonthName} Haftası`

        appointmentData.push({
          date: label,
          total: weekAppointments.length
        })

        revenueData.push({
          date: label,
          total: weekRevenue
        })

        newClientData.push({
          date: label,
          total: weekNewClients.length
        })
      }
    } else if (timeRange === '6m') {
      // Group by months for last 6 months (including current month), oldest -> newest
      // Use a stable base anchored to the first day of the current month to avoid edge cases
      const base = new Date(today.getFullYear(), today.getMonth(), 1)
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(base.getFullYear(), base.getMonth() - i, 1)
        monthStart.setHours(0, 0, 0, 0)
        
        const monthEndDate = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999)
        
        const monthAppointments = appointments.filter(apt => {
          const aptDate = new Date(apt.start_time)
          return aptDate >= monthStart && aptDate <= monthEndDate
        })
        
        const monthRevenue = monthAppointments.reduce((total, apt) => {
          const servicePrice = apt.services?.[0]?.price || 0
          return total + servicePrice
        }, 0)
        
        const monthNewClients = clients.filter(client => {
          const clientDate = new Date(client.created_at)
          return clientDate >= monthStart && clientDate <= monthEndDate
        })
        
        // Use the month start date as the date key, but store the month name separately
        const monthStartDate = monthStart.toISOString().split('T')[0]
        
        appointmentData.push({
          date: monthStartDate,
          total: monthAppointments.length
        })
        
        revenueData.push({
          date: monthStartDate,
          total: monthRevenue
        })
        
        newClientData.push({
          date: monthStartDate,
          total: monthNewClients.length
        })
      }
    }
    
    return {
      appointmentData,
      revenueData,
      newClientData
    }
  }

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
          fetchAnalyticsData(session.user.id)
        ])
      } catch (error) {
        console.error('Error:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }
    run()
  }, [router, supabase, fetchTodaysAppointments, fetchTotalClients, fetchAnalyticsData])

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
          <button onClick={handleLogout} className="text-slate-400 hover:text-white">Çıkış Yap</button>
        </div>
        
        <p className="text-lg text-slate-300 mb-8">
          Hoş geldin, <span className="font-bold text-white">{user.email}</span>! İşletmeni buradan yönetebilirsin.
        </p>

                {/* Main Content Grid - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Panel (Left Side) - Today's Agenda Focus */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              <Card className="bg-slate-900 border-slate-800">
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
              
              {/* Analytics Widget */}
              <AnalyticsWidget 
                appointmentData={appointmentData}
                revenueData={revenueData}
                newClientData={newClientData}
                timeRange={timeRange}
                setTimeRange={setTimeRange}
              />
            </div>
          </div>
          
          {/* Sidebar (Right Side) - Stats and Quick Actions */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              
              {/* Quick Stats Section */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-white">Hızlı Bakış</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <StatCard 
                    title="Bugünkü Randevu Sayısı" 
                    value={stats.todaysAppointments}
                    icon={<CalendarDays className="h-6 w-6 text-slate-400" />}
                  />
                  <StatCard 
                    title="Bugünkü Beklenen Kazanç" 
                    value={`${stats.todaysExpectedRevenue.toFixed(0)} TL`}
                    icon={<DollarSign className="h-6 w-6 text-slate-400" />}
                  />
                  <StatCard 
                    title="Toplam Müşteri Sayısı" 
                    value={stats.totalClients}
                    icon={<Users className="h-6 w-6 text-slate-400" />}
                  />
                </CardContent>
              </Card>
              
              {/* Quick Actions */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-white">Hızlı İşlemler</CardTitle>
                </CardHeader>
                <CardContent>
                  <AddAppointmentModal />
                </CardContent>
              </Card>
              
              {/* Navigation Cards */}
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-white">Hızlı Erişim</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Calendar Card */}
                  <Link href="/dashboard/calendar" className="block p-4 rounded-lg hover:bg-slate-800 transition-colors border border-slate-700 hover:border-slate-600">
                    <div className="flex items-center">
                      <Calendar className="h-6 w-6 text-slate-400 mr-3" />
                      <div>
                        <h4 className="font-semibold text-white">Randevu Takvimi</h4>
                        <p className="text-slate-400 text-sm">Randevuları görüntüle ve yönet</p>
                      </div>
                    </div>
                  </Link>
                  
                  {/* Profile Card */}
                  <Link href="/dashboard/profile" className="block p-4 rounded-lg hover:bg-slate-800 transition-colors border border-slate-700 hover:border-slate-600">
                    <div className="flex items-center">
                      <Edit className="h-6 w-6 text-slate-400 mr-3" />
                      <div>
                        <h4 className="font-semibold text-white">Profilimi Düzenle</h4>
                        <p className="text-slate-400 text-sm">Marka bilgilerini güncelle</p>
                      </div>
                    </div>
                  </Link>
                  
                  {/* Services Card */}
                  <Link href="/dashboard/services" className="block p-4 rounded-lg hover:bg-slate-800 transition-colors border border-slate-700 hover:border-slate-600">
                    <div className="flex items-center">
                      <Scissors className="h-6 w-6 text-slate-400 mr-3" />
                      <div>
                        <h4 className="font-semibold text-white">Hizmetlerim</h4>
                        <p className="text-slate-400 text-sm">Hizmetleri ve fiyatları düzenle</p>
                      </div>
                    </div>
                  </Link>
                  
                  {/* Portfolio Card */}
                  <Link href="/dashboard/portfolio" className="block p-4 rounded-lg hover:bg-slate-800 transition-colors border border-slate-700 hover:border-slate-600">
                    <div className="flex items-center">
                      <ImageIcon className="h-6 w-6 text-slate-400 mr-3" />
                      <div>
                        <h4 className="font-semibold text-white">Portfolyo</h4>
                        <p className="text-slate-400 text-sm">Albümleri ve fotoğrafları yönet</p>
                      </div>
                    </div>
                  </Link>
                  
                  {/* Clients Card */}
                  <Link href="/dashboard/clients" className="block p-4 rounded-lg hover:bg-slate-800 transition-colors border border-slate-700 hover:border-slate-600">
                    <div className="flex items-center">
                      <BookUser className="h-6 w-6 text-slate-400 mr-3" />
                      <div>
                        <h4 className="font-semibold text-white">Müşteri Yönetimi</h4>
                        <p className="text-slate-400 text-sm">Müşteri bilgilerini yönet</p>
                      </div>
                    </div>
                  </Link>
                  
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}