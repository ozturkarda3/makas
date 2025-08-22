import Link from 'next/link'
import { CalendarCheck2, MoreHorizontal } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import AddAppointmentModal from "@/components/dashboard/AddAppointmentModal"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"

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
  staff_members?: { name?: string | null } | null
  profiles?: { full_name?: string | null } | null
  status?: 'booked' | 'completed' | 'cancelled'
}

interface TodaysAgendaProps {
  appointments: Appointment[]
  onStatusChange: () => void
}

export default function TodaysAgenda({ appointments, onStatusChange }: TodaysAgendaProps) {
  const supabase = createClient()

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
      onStatusChange()
    } catch (e) {
      console.error('Unexpected:', e)
    }
  }

  // Format time to HH:mm
  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white text-lg font-semibold">
          Günün Ajandası
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-slate-400 mb-4">
              <CalendarCheck2 className="h-12 w-12 text-slate-400 mx-auto" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Bugün Ajandanız Temiz
            </h3>
            <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
              Bugün için planlanmış bir randevunuz bulunmuyor. Yeni bir randevu ekleyerek başlayabilirsiniz.
            </p>
            <AddAppointmentModal />
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            <div className="space-y-3">
              {appointments.map((appointment) => {
                const status = appointment.status || 'booked'
                return (
                  <div
                    key={appointment.id}
                    className={cn(
                      'flex items-center justify-between px-3 py-3 transition-colors rounded-md',
                      // Subtle divider between items
                      'border-b border-slate-800 last:border-b-0',
                      'hover:bg-slate-800/40',
                      // Status styles
                      status === 'completed' && 'opacity-50',
                      status === 'cancelled' && 'line-through text-slate-500'
                    )}
                  >
                    {/* Time */}
                    <div className="flex-shrink-0">
                      <span className="text-slate-300 font-medium text-sm">
                        {formatTime(appointment.start_time)}
                      </span>
                    </div>
                    
                    {/* Client and Service Info */}
                    <div className="flex-1 ml-4 min-w-0">
                      <Link href={`/dashboard/clients/${appointment.clients.id}`} className="block">
                        <div className="font-semibold text-slate-100 text-sm truncate">
                          {appointment.clients.name}
                        </div>
                        <div className="text-slate-400 text-xs truncate">
                          {appointment.services.name}
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5 truncate">
                          {(appointment.staff_members?.name || appointment.profiles?.full_name) ? (
                            <span>{appointment.staff_members?.name ?? appointment.profiles?.full_name}</span>
                          ) : null}
                        </div>
                      </Link>
                    </div>
                    
                    {/* Status indicator + actions */}
                    <div className="flex-shrink-0 ml-3 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${status === 'cancelled' ? 'bg-red-500' : status === 'completed' ? 'bg-slate-400' : 'bg-green-400'}`}></div>
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
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Link 
          href="/dashboard/calendar"
          className="text-slate-300 hover:text-white text-sm font-medium transition-colors flex items-center"
        >
          Tüm Takvimi Görüntüle
          <span className="ml-2 text-slate-400">→</span>
        </Link>
      </CardFooter>
    </Card>
  )
}
