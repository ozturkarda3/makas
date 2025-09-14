'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { cn, normalizePhoneNumber } from '@/lib/utils'
import CustomerCombobox from '@/components/dashboard/CustomerCombobox'

interface Service {
  id: string
  name: string
  price: number
  duration: number
}

interface StaffMember {
  id: string
  name: string
}

interface ProfileLite {
  id: string
  full_name: string | null
  opening_time?: string | null
  closing_time?: string | null
}

export default function AddAppointmentModal() {
  const supabase = createClient()
  
  // Form state
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [pendingNewClientName, setPendingNewClientName] = useState<string | null>(null)
  const [pendingNewClientPhone, setPendingNewClientPhone] = useState<string>('')
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState('')
  
  // UI state
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [profile, setProfile] = useState<ProfileLite | null>(null)
  const [selectedStaffId, setSelectedStaffId] = useState('')

  // Fetch services, staff, and owner profile on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return
        
        const [servicesRes, staffRes, profileRes] = await Promise.all([
          supabase
            .from('services')
            .select('id, name, price, duration')
            .eq('profile_id', session.user.id)
            .order('name'),
          supabase
            .from('staff_members')
            .select('id, name')
            .eq('profile_id', session.user.id)
            .order('name'),
          supabase
            .from('profiles')
            .select('id, full_name, opening_time, closing_time')
            .eq('id', session.user.id)
            .single(),
        ])

        if (servicesRes.error) {
          console.error('Error fetching services:', servicesRes.error)
          toast.error('Hizmetler yüklenirken bir hata oluştu')
        } else {
          setServices(servicesRes.data || [])
        }

        if (staffRes.error) {
          console.error('Error fetching staff members:', staffRes.error)
        } else {
          setStaffMembers((staffRes.data as StaffMember[]) || [])
        }

        if (profileRes.error) {
          console.error('Error fetching profile:', profileRes.error)
        } else {
          setProfile((profileRes.data as ProfileLite) || null)
        }
      } catch (error) {
        console.error('Error:', error)
        toast.error('Hizmetler yüklenirken bir hata oluştu')
      }
    }
    
    fetchInitialData()
  }, [supabase])  


  const handleSaveAppointment = async () => {
    // Validation with detailed feedback
    const missing: string[] = []
    if (!selectedServiceId) missing.push('Hizmet Seçimi')
    if (!selectedDate) missing.push('Tarih')
    if (!selectedTime || !selectedTime.trim()) missing.push('Saat')

    if (missing.length > 0) {
      toast.error(`Lütfen eksik alanları doldurun: ${missing.join(', ')}`)
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
      const appointmentDateTime = new Date(selectedDate!)
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

      // Determine staff_member_id early for filtered overlap query: null if owner selected, else staff id
      const resolvedStaffMemberId = selectedStaffId && selectedStaffId.startsWith('owner-') ? null : (selectedStaffId || null)

      // Check for overlapping appointments by fetching existing appointments for the same day
      const appointmentDate = format(appointmentDateTime, 'yyyy-MM-dd')
      let overlapQuery = supabase
        .from('appointments')
        .select(`
          id, 
          start_time, 
          services:services(duration)
        `)
        .eq('profile_id', session.user.id)
        .gte('start_time', `${appointmentDate}T00:00:00`)
        .lt('start_time', `${appointmentDate}T23:59:59`)

      // Staff-specific overlap filter (owner => staff_member_id IS NULL, else equals staff id)
      if (resolvedStaffMemberId === null) {
        overlapQuery = overlapQuery.is('staff_member_id', null)
      } else {
        overlapQuery = overlapQuery.eq('staff_member_id', resolvedStaffMemberId)
      }

      const { data: existingAppointments, error: overlapError } = await overlapQuery

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

      // Resolve client id: use selected combobox client; else create a walk-in
      let clientId: string
      if (selectedClientId) {
        clientId = selectedClientId
      } else {
        const nameToUse = pendingNewClientName?.trim() || 'Walk-in Müşteri'
        const phoneToUseRaw = pendingNewClientPhone.trim()
        const phoneToUse = normalizePhoneNumber(phoneToUseRaw)
        if (!phoneToUse) {
          toast.error('Geçerli bir telefon numarası giriniz')
          return
        }
        const { data: newClient, error: createClientError } = await supabase
          .from('clients')
          .insert({
            name: nameToUse,
            phone: phoneToUse,
            profile_id: session.user.id
          })
          .select('id')
          .single()

        if (createClientError || !newClient) {
          console.error('Error creating walk-in client:', createClientError)
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
          profile_id: session.user.id,
          staff_member_id: resolvedStaffMemberId,
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
      setSelectedClientId(null)
      setPendingNewClientName(null)
      setPendingNewClientPhone('')
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

  // Time slots based on working hours, 15-minute intervals
  const timeSlots: string[] = useMemo(() => {
    const slots: string[] = []
    const defaultOpen = 10
    const defaultClose = 20
    const startHour = profile?.opening_time ? parseInt(profile.opening_time.split(':')[0]) : defaultOpen
    const endHour = profile?.closing_time ? parseInt(profile.closing_time.split(':')[0]) : defaultClose
    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hh = String(h).padStart(2, '0')
        const mm = String(m).padStart(2, '0')
        slots.push(`${hh}:${mm}`)
      }
    }
    return slots
  }, [profile])

  // Hide past times if selected date is today
  const visibleTimeSlots: string[] = useMemo(() => {
    if (!selectedDate) return timeSlots
    const today = new Date()
    const isToday = format(selectedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
    if (!isToday) return timeSlots
    const currentMinutes = today.getHours() * 60 + today.getMinutes()
    return timeSlots.filter(t => {
      const [h, m] = t.split(':').map(Number)
      const minutes = h * 60 + m
      return minutes > currentMinutes
    })
  }, [timeSlots, selectedDate])

  // Clear selected time if it becomes invalid after date change
  useEffect(() => {
    if (selectedTime && !visibleTimeSlots.includes(selectedTime)) {
      setSelectedTime('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, visibleTimeSlots])

  const resetForm = () => {
    setSelectedClientId(null)
    setPendingNewClientName(null)
    setPendingNewClientPhone('')
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
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label className="text-blue-900">Müşteri</Label>
            <CustomerCombobox
              onSelectClient={(id) => { setSelectedClientId(id); setPendingNewClientName(null) }}
              allowCreate
              onCreateClient={(name) => { setSelectedClientId(null); setPendingNewClientName(name) }}
              selectedLabel={pendingNewClientName}
              tone="blue"
            />
          </div>

          {/* If creating a new customer, show phone input */}
          {pendingNewClientName && (
            <div className="space-y-2">
              <Label htmlFor="newClientPhone" className="text-blue-900">Telefon Numarası</Label>
              <Input
                id="newClientPhone"
                value={pendingNewClientPhone}
                onChange={(e) => setPendingNewClientPhone(e.target.value)}
                placeholder="5XX XXX XX XX"
                className="border-blue-900 text-blue-900 placeholder:text-gray-400 focus:border-blue-700 focus:ring-blue-700"
              />
            </div>
          )}
          
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

          {/* Staff Selection */}
          <div className="space-y-2">
            <Label htmlFor="staff" className="text-blue-900">Personel Seçimi</Label>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger className="border-blue-900 text-blue-900 focus:border-blue-700 focus:ring-blue-700">
                <SelectValue placeholder="Personel seçin" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-blue-900">
                {profile && (
                  <SelectItem value={`owner-${profile.id}`} className="text-blue-900 hover:bg-blue-50 focus:bg-blue-100">
                    {profile.full_name || 'İşletme Sahibi'}
                  </SelectItem>
                )}
                {staffMembers.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-blue-900 hover:bg-blue-50 focus:bg-blue-100">
                    {s.name}
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
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className="border-blue-900 text-blue-900 focus:border-blue-700 focus:ring-blue-700">
                <SelectValue placeholder="Saat seçin" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-blue-900">
                {visibleTimeSlots.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-blue-900">Uygun saat yok</div>
                ) : (
                  visibleTimeSlots.map((t) => (
                    <SelectItem key={t} value={t} className="text-blue-900 hover:bg-blue-50 focus:bg-blue-100">
                      {t}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
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
