'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabaseClient'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import AddAppointmentModal from '@/components/dashboard/AddAppointmentModal'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
// import CustomCalendarCaption from '@/components/ui/CustomCalendarCaption'

interface Client {
  id: string
  name: string
}

interface Service { name: string; duration?: number | null }
interface StaffLite { name?: string | null }
interface ProfileLite { full_name?: string | null }

interface Appointment {
  id: string
  start_time: string
  clients: Client
  services: Service
  staff_members?: StaffLite | null
  profiles?: ProfileLite | null
  status?: 'booked' | 'completed' | 'cancelled'
}

export default function CalendarPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [appointmentDates, setAppointmentDates] = useState<Date[]>([])
  const [busyDates, setBusyDates] = useState<Date[]>([])
  const [mediumDates, setMediumDates] = useState<Date[]>([])
  const [lightDates, setLightDates] = useState<Date[]>([])
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  const loadAppointments = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, clients(name), services(name, duration), staff_members!appointments_staff_member_id_fkey(name), profiles(full_name)')
      .eq('profile_id', userId)
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching appointments:', error)
      return
    }

    const normalized: Appointment[] = (data || []).map((row: {
      id: string
      start_time: string
      client_id: string
      clients?: { name?: string | null } | null
      services?: { name?: string | null; duration?: number | null } | null
      staff_members?: StaffLite | null
      profiles?: ProfileLite | null
      status?: Appointment['status']
    }) => ({
      id: row.id,
      start_time: row.start_time,
      clients: { id: row.client_id, name: row.clients?.name || 'Bilinmeyen Müşteri' },
      services: { name: row.services?.name || 'Bilinmeyen Hizmet', duration: row.services?.duration ?? null },
      staff_members: row.staff_members || null,
      profiles: row.profiles || null,
      status: row.status || 'booked',
    }))

    setAppointments(normalized)
    // Derive unique appointment day dates and density buckets for calendar modifiers
    const unique = new Map<string, Date>()
    const counts = new Map<string, number>()
    for (const ap of normalized) {
      const d = new Date(ap.start_time)
      d.setHours(0, 0, 0, 0)
      const key = d.toISOString().split('T')[0]
      unique.set(key, new Date(d))
      counts.set(key, (counts.get(key) || 0) + 1)
    }
    const uniques = Array.from(unique.values())
    setAppointmentDates(uniques)
    const busy: Date[] = []
    const medium: Date[] = []
    const light: Date[] = []
    for (const [key, count] of counts.entries()) {
      const day = unique.get(key)!
      if (count >= 4) busy.push(day)
      else if (count >= 2) medium.push(day)
      else if (count === 1) light.push(day)
    }
    setBusyDates(busy)
    setMediumDates(medium)
    setLightDates(light)
  }, [supabase])

  useEffect(() => {
    const checkUserAndFetchAppointments = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }
        setUser(session.user)
        await loadAppointments(session.user.id)
      } catch (error) {
        console.error('Error:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }
    checkUserAndFetchAppointments()
  }, [router, supabase, loadAppointments])

  const handleStatusChange = async (appointmentId: string, newStatus: 'booked' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId)
      if (error) {
        console.error('Status update failed', error)
        return
      }
      if (user) {
        await loadAppointments(user.id)
      }
    } catch (e) {
      console.error('Unexpected:', e)
    }
  }

  // Filter appointments for selected date and sort by time
  const getAppointmentsForDate = (date: Date) => {
    if (!appointments.length) return []
    
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayAppointments = appointments.filter(appointment => {
      const appointmentDate = format(new Date(appointment.start_time), 'yyyy-MM-dd')
      return appointmentDate === dateStr
    })
    
    // Sort by start time (earliest first)
    return dayAppointments.sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )
  }

  // Format time to HH:mm (unused)
  // const formatTime = (timeString: string) => {
  //   return format(new Date(timeString), 'HH:mm')
  // }

  const formatTimeRange = (start: string, durationMin?: number | null) => {
    const startDate = new Date(start)
    const end = new Date(startDate)
    const dur = durationMin && durationMin > 0 ? durationMin : 30
    end.setMinutes(end.getMinutes() + dur)
    return `${format(startDate, 'HH:mm')} - ${format(end, 'HH:mm')}`
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

  if (!user) {
    return null
  }

  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : []

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Randevu Takvimi
            </h1>
            <p className="text-slate-400">
              Randevularınızı görüntüleyin ve yönetin
            </p>
          </div>
          <AddAppointmentModal />
        </div>

        {/* Two Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Panel - Calendar */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Takvim</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Custom Calendar Header */}
              <div className="flex items-center justify-between mb-3 -mt-4">
                <Button variant="ghost" size="icon" onClick={() => {
                  const prev = new Date(currentMonth)
                  prev.setMonth(prev.getMonth() - 1)
                  prev.setDate(1)
                  setCurrentMonth(prev)
                }} aria-label="Önceki ay" className="h-8 w-8">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="text-sm font-medium text-slate-200 select-none">
                  {currentMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => {
                    const next = new Date(currentMonth)
                    next.setMonth(next.getMonth() + 1)
                    next.setDate(1)
                    setCurrentMonth(next)
                  }} aria-label="Sonraki ay" className="h-8 w-8">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Date Range Shortcuts removed */}

              <div className="w-full flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={tr}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  showOutsideDays={false}
                  className="rounded-md border-slate-700 w-full [--cell-size:--spacing(14)]"
                  modifiers={{ hasAppointments: appointmentDates, busy: busyDates, medium: mediumDates, light: lightDates }}
                  modifiersClassNames={{
                    hasAppointments: 'has-appointments',
                    busy: 'busy-day',
                    medium: 'medium-day',
                    light: 'light-day',
                    today: 'today-highlight',
                    selected: 'bg-primary text-primary-foreground'
                  }}
                  formatters={{
                    formatWeekdayName: (date) => date.toLocaleDateString('tr-TR', { weekday: 'short' }).charAt(0)
                  }}
                  classNames={{
                    root: "w-fit",
                    months: "w-full flex justify-center",
                    month: "w-fit",
                    table: "w-fit",
                    month_caption: "flex items-center justify-between w-full max-w-[520px] mx-auto px-2 -mt-3",
                    nav: "hidden",
                    day_selected: "bg-slate-50 text-slate-950 hover:bg-slate-100", /* kept for fallback */
                    day_today: "border border-blue-400",
                    cell: "p-2",
                    day: "text-slate-300 hover:bg-slate-800 hover:text-white",
                    head_cell: "text-slate-400",
                    nav_button: "text-slate-400 hover:bg-slate-800 hover:text-white",
                    nav_button_previous: "text-slate-400 hover:bg-slate-800 hover:text-white",
                    nav_button_next: "text-slate-400 hover:bg-slate-800 hover:text-white",
                    caption: "text-slate-300",
                    caption_label: "text-slate-300 font-medium"
                  }}
                />
              </div>
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={() => setSelectedDate(new Date())}>Bugün</Button>
              </div>
              <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-slate-400 text-xs text-center">
                  💡 Bugün için sadece gelecek saatlerde randevu oluşturabilirsiniz
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Right Panel - Selected Day's Appointments */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">
                {selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: tr }) : 'Tarih Seçin'} Randevuları
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                selectedDateAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {selectedDateAppointments.map((appointment) => {
                      const status = appointment.status || 'booked'
                      return (
                        <div
                          key={appointment.id}
                          className={cn(
                            'p-4 rounded-lg border transition-colors',
                            'bg-slate-800 border-slate-700 hover:border-slate-600 hover:bg-slate-800',
                            status === 'completed' && 'bg-green-900/30 border-l-4 border-green-500',
                            status === 'cancelled' && 'line-through text-slate-500 opacity-60'
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-300 font-medium">
                              {formatTimeRange(appointment.start_time, appointment.services?.duration ?? undefined)}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                                Randevu
                              </span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-white">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, 'completed')}>Tamamlandı Olarak İşaretle</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, 'cancelled')}>İptal Edildi Olarak İşaretle</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(appointment.id, 'booked')}>Rezervasyon Olarak İşaretle</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <Link href={`/dashboard/clients/${appointment.clients?.id}`} className="block">
                            <div className="text-white font-medium">
                              {appointment.clients?.name || 'Müşteri bilgisi yok'}
                            </div>
                            <div className="text-slate-400 text-sm">
                              {appointment.services?.name || 'Hizmet bilgisi yok'}
                            </div>
                            <div className="text-slate-500 text-xs mt-0.5">
                              {(appointment.staff_members?.name || appointment.profiles?.full_name) ? (
                                <span>{appointment.staff_members?.name ?? appointment.profiles?.full_name}</span>
                              ) : null}
                            </div>
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center gap-3">
                    <p className="text-slate-300 text-sm">Bu gün için randevu yok</p>
                    <AddAppointmentModal />
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <div className="text-slate-400 text-4xl mb-3">📅</div>
                  <p className="text-slate-400 text-sm">
                    Lütfen sol taraftan bir tarih seçin.
                  </p>
                </div>
              )}

            </CardContent>
          </Card>
        </div>

        {/* Appointments Summary */}
        <div className="mt-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Genel Randevu Özeti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-white">{appointments.length}</div>
                  <div className="text-slate-400 text-sm">Toplam Randevu</div>
                </div>
                <div className="text-center p-4 bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">
                    {appointments.filter(a => new Date(a.start_time) >= new Date()).length}
                  </div>
                  <div className="text-slate-400 text-sm">Gelecek Randevu</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
