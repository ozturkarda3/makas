import Link from 'next/link'
import { CalendarCheck2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import EmptyState from "@/components/ui/EmptyState"
import AddAppointmentModal from "@/components/dashboard/AddAppointmentModal"

interface Client {
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
}

interface TodaysAgendaProps {
  appointments: Appointment[]
}

export default function TodaysAgenda({ appointments }: TodaysAgendaProps) {
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
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <div 
                key={appointment.id}
                className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
              >
                {/* Time */}
                <div className="flex-shrink-0">
                  <span className="text-slate-300 font-medium text-sm">
                    {formatTime(appointment.start_time)}
                  </span>
                </div>
                
                {/* Client and Service Info */}
                <div className="flex-1 ml-4 min-w-0">
                  <div className="text-white font-medium text-sm truncate">
                    {appointment.clients.name}
                  </div>
                  <div className="text-slate-400 text-xs truncate">
                    {appointment.services.name}
                  </div>
                </div>
                
                {/* Status indicator */}
                <div className="flex-shrink-0 ml-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
              </div>
            ))}
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
