'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { createClient } from '@/lib/supabaseClient'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Service {
  id: string
  name: string
  price: number
  duration: number
}

export default function AddAppointmentModal() {
  const supabase = createClient()
  
  // Form state
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState('')
  
  // UI state
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [services, setServices] = useState<Service[]>([])

  // Fetch services on component mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return
        
        const { data: servicesData, error } = await supabase
          .from('services')
          .select('id, name, price, duration')
          .eq('profile_id', session.user.id)
          .order('name')
        
        if (error) {
          console.error('Error fetching services:', error)
          toast.error('Hizmetler yüklenirken bir hata oluştu')
        } else {
          setServices(servicesData || [])
        }
      } catch (error) {
        console.error('Error:', error)
        toast.error('Hizmetler yüklenirken bir hata oluştu')
      }
    }
    
    fetchServices()
  }, [supabase])  


  const handleSaveAppointment = async () => {
    // Validation
    if (!clientName.trim() || !clientPhone.trim() || !selectedServiceId || !selectedDate || !selectedTime) {
      toast.error('Lütfen tüm alanları doldurun')
      return
    }

    setIsLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        toast.error('Oturum bulunamadı')
        return
      }

      // Combine date and time
      const appointmentDateTime = new Date(selectedDate)
      const [hours, minutes] = selectedTime.split(':')
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      // Check if appointment is in the past
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      // If appointment is today, check if the time is in the future
      if (selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
        const currentHour = now.getHours()
        const currentMinute = now.getMinutes()
        const selectedHour = parseInt(hours)
        const selectedMinute = parseInt(minutes)
        
        // Check if selected time is in the past
        if (selectedHour < currentHour || (selectedHour === currentHour && selectedMinute <= currentMinute)) {
          toast.error('Bugün için sadece gelecek saatlerde randevu oluşturabilirsiniz')
          return
        }
      }
      
      // Check if appointment is in the past (for any date)
      if (appointmentDateTime <= now) {
        toast.error('Geçmiş tarih veya saatte randevu oluşturamazsınız')
        return
      }

      // Check for overlapping appointments
      const selectedService = services.find(s => s.id === selectedServiceId)
      if (!selectedService) {
        toast.error('Seçilen hizmet bulunamadı')
        return
      }

      // Calculate appointment end time based on service duration
      const appointmentEndTime = new Date(appointmentDateTime)
      appointmentEndTime.setMinutes(appointmentEndTime.getMinutes() + selectedService.duration)

      // Check for overlapping appointments by fetching existing appointments for the same day
      const appointmentDate = format(appointmentDateTime, 'yyyy-MM-dd')
      const { data: existingAppointments, error: overlapError } = await supabase
        .from('appointments')
        .select(`
          id, 
          start_time, 
          services:services(duration)
        `)
        .eq('profile_id', session.user.id)
        .gte('start_time', `${appointmentDate}T00:00:00`)
        .lt('start_time', `${appointmentDate}T23:59:59`)

      if (overlapError) {
        console.error('Error checking overlaps:', overlapError)
        toast.error('Randevu çakışması kontrol edilirken hata oluştu')
        return
      }

      // Check for overlaps
      const hasOverlap = existingAppointments?.some(existing => {
        const existingStart = new Date(existing.start_time)
        const existingDuration = existing.services?.[0]?.duration || 30 // Default to 30 minutes if not found
        const existingEnd = new Date(existingStart)
        existingEnd.setMinutes(existingEnd.getMinutes() + existingDuration)

        // Check if appointments overlap
        // New: [appointmentDateTime, appointmentEndTime]
        // Existing: [existingStart, existingEnd]
        // They overlap if: newStart < existingEnd AND newEnd > existingStart
        return appointmentDateTime < existingEnd && appointmentEndTime > existingStart
      })

      if (hasOverlap) {
        toast.error('Bu saatte zaten bir randevunuz bulunuyor. Lütfen farklı bir saat seçin.')
        return
      }

      // First, create or get the client
      let clientId: string
      
      // Check if client already exists
      const { data: existingClient, error: clientCheckError } = await supabase
        .from('clients')
        .select('id')
        .eq('profile_id', session.user.id)
        .eq('phone', clientPhone)
        .single()

      if (clientCheckError && clientCheckError.code !== 'PGRST116') {
        console.error('Error checking client:', clientCheckError)
        toast.error('Müşteri kontrolü sırasında hata oluştu')
        return
      }

      if (existingClient) {
        // Use existing client
        clientId = existingClient.id
      } else {
        // Create new client
        const { data: newClient, error: createClientError } = await supabase
          .from('clients')
          .insert({
            name: clientName,
            phone: clientPhone,
            profile_id: session.user.id
          })
          .select('id')
          .single()

        if (createClientError) {
          console.error('Error creating client:', createClientError)
          toast.error('Müşteri oluşturulurken hata oluştu')
          return
        }

        clientId = newClient.id
      }

      // Create appointment with current table structure
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          client_id: clientId,
          service_id: selectedServiceId,
          start_time: appointmentDateTime.toISOString(),
          profile_id: session.user.id
        })

      if (appointmentError) {
        console.error('Error creating appointment:', appointmentError)
        console.error('Error details:', {
          message: appointmentError.message,
          code: appointmentError.code,
          details: appointmentError.details,
          hint: appointmentError.hint
        })
        toast.error(`Randevu oluşturulurken hata oluştu: ${appointmentError.message}`)
        return
      }

      // Success!
      toast.success('Randevu başarıyla oluşturuldu!')
      
      // Reset form and close modal
      setClientName('')
      setClientPhone('')
      setSelectedDate(undefined)
      setSelectedTime('')
      setIsOpen(false)

    } catch (error) {
      console.error('Error:', error)
      toast.error('Randevu oluşturulurken beklenmeyen bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setClientName('')
    setClientPhone('')
    setSelectedServiceId('')
    setSelectedDate(undefined)
    setSelectedTime('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-slate-50 text-slate-950 hover:bg-slate-200 font-medium">
          Yeni Randevu Ekle
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] bg-slate-100 border border-slate-800 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-blue-900">Hızlı Randevu Ekle</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Client Name */}
          <div className="space-y-2">
            <Label htmlFor="clientName" className="text-blue-900">Müşteri Adı</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Müşteri adını girin"
              className="border-blue-900 text-blue-900 placeholder:text-gray-400 focus:border-blue-700 focus:ring-blue-700"
            />
          </div>
          
          {/* Client Phone */}
          <div className="space-y-2">
            <Label htmlFor="clientPhone" className="text-blue-900">Müşteri Telefonu</Label>
            <Input
              id="clientPhone"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="5XX XXX XX XX"
              className="border-blue-900 text-blue-900 placeholder:text-gray-400 focus:border-blue-700 focus:ring-blue-700"
            />
          </div>
          
          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="service" className="text-blue-900">Hizmet Seçimi</Label>
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
              <SelectTrigger className="border-blue-900 text-blue-900 focus:border-blue-700 focus:ring-blue-700">
                <SelectValue placeholder="Hizmet seçin" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-blue-900">
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id} className="text-blue-900 hover:bg-blue-50 focus:bg-blue-100">
                    {service.name} - {service.price} TL
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="text-blue-900">Tarih</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-blue-900 text-blue-900 hover:bg-blue-50",
                    !selectedDate && "text-gray-400"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: tr }) : "Tarih seçin"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border border-blue-900" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  disabled={(date) => {
                    // Get start of today (midnight)
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    
                    // Disable all dates before today
                    return date < today
                  }}
                  locale={tr}
                  className="text-blue-900"
                  classNames={{
                    day_selected: "bg-blue-900 text-white hover:bg-blue-800",
                    day_today: "bg-blue-100 text-blue-900",
                    day: "text-blue-900 hover:bg-blue-50",
                    day_disabled: "text-gray-400 cursor-not-allowed",
                    head_cell: "text-blue-900",
                    nav_button: "text-blue-900 hover:bg-blue-50",
                    caption: "text-blue-900",
                    caption_label: "text-blue-900 font-semibold"
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Time Selection */}
          <div className="space-y-2">
            <Label htmlFor="time" className="text-blue-900">Saat</Label>
            <Input
              id="time"
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="border-blue-900 text-blue-900 focus:border-blue-700 focus:ring-blue-700"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={resetForm} className="text-blue-900 border-blue-900 hover:bg-blue-50">
            Sıfırla
          </Button>
          <Button 
            onClick={handleSaveAppointment} 
            disabled={isLoading}
            className="bg-blue-900 text-white hover:bg-blue-800"
          >
            {isLoading ? 'Kaydediliyor...' : 'Randevuyu Kaydet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
