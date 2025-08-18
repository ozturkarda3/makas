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
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Client {
  id: string
  name: string
}

interface Service {
  name: string
}

interface Appointment {
  id: string
  start_time: string
  clients: Client
  services: Service
  status?: 'booked' | 'completed' | 'cancelled'
}

export default function CalendarPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isLoading, setIsLoading] = useState(true)

  const loadAppointments = useCallback(async (userId: string) => {
    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, start_time, client_id, service_id, status')
      .eq('profile_id', userId)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError)
      return
    }

    if (appointmentsData && appointmentsData.length > 0) {
      const clientIds = appointmentsData.map(apt => apt.client_id).filter(Boolean)
      const serviceIds = appointmentsData.map(apt => apt.service_id).filter(Boolean)

      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name')
        .in('id', clientIds)

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id, name')
        .in('id', serviceIds)

      if (clientsError) console.error('Error fetching clients:', clientsError)
      if (servicesError) console.error('Error fetching services:', servicesError)

      const enrichedAppointments: Appointment[] = appointmentsData.map(appt => {
        const client = clientsData?.find(c => c.id === appt.client_id)
        const service = servicesData?.find(s => s.id === appt.service_id)
        return {
          id: appt.id,
          start_time: appt.start_time,
          clients: { id: client?.id || appt.client_id || 'unknown', name: client?.name || 'Bilinmeyen Müşteri' },
          services: { name: service?.name || 'Bilinmeyen Hizmet' },
          status: appt.status || 'booked'
        }
      })

      setAppointments(enrichedAppointments)
    } else {
      setAppointments([])
    }
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

  const handleStatusChange = async (appointmentId: string, newStatus: 'completed' | 'cancelled') => {
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

  // Format time to HH:mm
  const formatTime = (timeString: string) => {
    return format(new Date(timeString), 'HH:mm')
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
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border-slate-700"
                classNames={{
                  day_selected: "bg-slate-50 text-slate-950 hover:bg-slate-100",
                  day_today: "bg-slate-800 text-slate-50",
                  day: "text-slate-300 hover:bg-slate-800 hover:text-white",
                  head_cell: "text-slate-400",
                  nav_button: "text-slate-400 hover:bg-slate-800 hover:text-white",
                  nav_button_previous: "text-slate-400 hover:bg-slate-800 hover:text-white",
                  nav_button_next: "text-slate-400 hover:bg-slate-800 hover:text-white",
                  caption: "text-slate-300",
                  caption_label: "text-slate-300 font-medium"
                }}
              />
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
                              {formatTime(appointment.start_time)}
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
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-slate-400 text-4xl mb-3">📅</div>
                    <p className="text-slate-400 text-sm">
                      Bu tarih için planlanmış randevu bulunmuyor.
                    </p>
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
              
              {/* Note about filtering */}
              <div className="mt-6 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-slate-400 text-xs text-center">
                  Tarihe göre filtreleme yakında eklenecektir.
                </p>
              </div>
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
