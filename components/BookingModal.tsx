'use client'

import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabaseClient'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

type BookingService = {
  id: string
  name: string
  price: number
  duration: number // minutes
}

type PublicProfile = {
  id: string
  full_name?: string | null
}

type StaffMemberLite = {
  id: string
  name: string
}

interface BookingModalProps {
  profile: PublicProfile
  service: BookingService
  staffMembers: StaffMemberLite[]
}

// Generates half-hour time slots between given hours (inclusive start, exclusive end)
function generateDailySlots(startHour: number, endHour: number): string[] {
  const slots: string[] = []
  for (let h = startHour; h < endHour; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  // Add final :00 for the endHour if you want booking exactly at end (commonly not). We'll skip.
  return slots
}

function toDateWithTime(baseDate: Date, timeHHmm: string): Date {
  const [hh, mm] = timeHHmm.split(':').map((n) => parseInt(n, 10))
  const d = new Date(baseDate)
  d.setHours(hh, mm, 0, 0)
  return d
}

export default function BookingModal({ profile, service, staffMembers }: BookingModalProps) {
  const supabase = createClient()

  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [busyByResource, setBusyByResource] = useState<Record<string, Array<{ start: Date; end: Date }>>>({})
  const [localStaffMembers, setLocalStaffMembers] = useState<StaffMemberLite[]>(staffMembers || [])
  const hasStaffSelection = (localStaffMembers?.length || 0) > 0
  const [selectedStaff, setSelectedStaff] = useState<string>(hasStaffSelection ? 'any' : 'owner')

  // Business hours for public booking (adjust as needed)
  const allSlots = useMemo(() => generateDailySlots(9, 21), [])

  // If staff members weren't available from SSR, attempt a client-side fetch when dialog opens
  useEffect(() => {
    const fetchStaffIfNeeded = async () => {
      if (!isOpen) return
      if (localStaffMembers.length > 0) return
      try {
        const { data, error } = await supabase
          .from('staff_members')
          .select('id, name')
          .eq('profile_id', profile.id)
        if (error) {
          console.error('Personel listesi alınamadı:', error)
          return
        }
        if (data && data.length > 0) {
          setLocalStaffMembers(data as StaffMemberLite[])
          setSelectedStaff('any')
          setStep(1)
        }
      } catch (err) {
        console.error('Personel alınırken hata:', err)
      }
    }
    fetchStaffIfNeeded()
  }, [isOpen, localStaffMembers.length, profile.id, supabase])

  // When date changes and dialog is open, fetch existing appointments for that day
  useEffect(() => {
    const fetchConflictsForDay = async () => {
      if (!selectedDate || !isOpen) return
      try {
        // Build day boundaries in local time
        const startOfDay = new Date(selectedDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(selectedDate)
        endOfDay.setHours(23, 59, 59, 999)

        const { data: appointments, error } = await supabase
          .from('appointments')
          .select(`id, start_time, staff_member_id, services:services(duration)`) // need services to know durations
          .eq('profile_id', profile.id)
          .gte('start_time', startOfDay.toISOString())
          .lte('start_time', endOfDay.toISOString())

        if (error) {
          console.error('Randevu sorgu hatası:', error)
          setBusyByResource({})
          return
        }

        const next: Record<string, Array<{ start: Date; end: Date }>> = {}
        for (const apt of (appointments || []) as Array<{ start_time: string; staff_member_id: string | null; services?: Array<{ duration: number }> }>) {
          const start = new Date(apt.start_time)
          const durationMinutes: number = apt.services?.[0]?.duration || 30
          const end = new Date(start)
          end.setMinutes(end.getMinutes() + durationMinutes)
          const key = apt.staff_member_id ?? 'owner'
          if (!next[key]) next[key] = []
          next[key].push({ start, end })
        }

        setBusyByResource(next)
      } catch (err) {
        console.error('Çakışma alınırken hata:', err)
        setBusyByResource({})
      }
    }

    fetchConflictsForDay()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, isOpen, profile.id])

  const doesOverlap = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => aStart < bEnd && aEnd > bStart

  // Determine if a given slot is available based on service duration and existing busy intervals
  const isSlotAvailable = (slot: string): boolean => {
    if (!selectedDate) return false
    const start = toDateWithTime(selectedDate, slot)
    const end = new Date(start)
    end.setMinutes(end.getMinutes() + (service.duration || 30))

    // If date is today, disallow past time slots
    const now = new Date()
    const isSameDay = selectedDate.toDateString() === now.toDateString()
    if (isSameDay && start <= now) return false

    const resources: string[] = ['owner', ...(localStaffMembers?.map(s => s.id) || [])]

    if (selectedStaff === 'any') {
      return resources.some((key) => {
        const intervals = busyByResource[key] || []
        return !intervals.some(({ start: bStart, end: bEnd }) => doesOverlap(start, end, bStart, bEnd))
      })
    }

    const key = selectedStaff
    const intervals = busyByResource[key] || []
    return !intervals.some(({ start: bStart, end: bEnd }) => doesOverlap(start, end, bStart, bEnd))
  }

  const handleTimeSelect = (slot: string) => {
    setSelectedTime(slot)
    setStep(3)
  }

  const handleBack = () => {
    if (hasStaffSelection) {
      if (step === 3) setStep(2)
      else setStep(1)
    } else {
      if (step === 3) setStep(2)
    }
  }

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime || !customerName.trim() || !customerPhone.trim()) {
      toast.error('Lütfen tarih, saat ve iletişim bilgilerini tamamlayın')
      return
    }

    setIsSubmitting(true)
    try {
      // Compose start datetime
      const start = toDateWithTime(selectedDate, selectedTime)

      // 1) Find or create client by phone for this profile
      let clientId: string | null = null
      const { data: existingClient, error: clientFetchError } = await supabase
        .from('clients')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('phone', customerPhone)
        .maybeSingle()

      if (clientFetchError) {
        console.error('Müşteri kontrol hatası:', clientFetchError)
        toast.error('Müşteri kontrolü sırasında hata oluştu')
        setIsSubmitting(false)
        return
      }

      if (existingClient) {
        clientId = existingClient.id
      } else {
        const { data: newClient, error: createClientError } = await supabase
          .from('clients')
          .insert({ name: customerName, phone: customerPhone, profile_id: profile.id })
          .select('id')
          .single()
        if (createClientError || !newClient) {
          console.error('Müşteri oluşturma hatası:', createClientError)
          toast.error('Müşteri oluşturulamadı')
          setIsSubmitting(false)
          return
        }
        clientId = newClient.id
      }

      // 2) Determine staff assignment
      let staffMemberIdToAssign: string | null = null
      if (selectedStaff === 'owner') {
        staffMemberIdToAssign = null
      } else if (selectedStaff === 'any') {
        const startCopy = new Date(start)
        const endCopy = new Date(start)
        endCopy.setMinutes(endCopy.getMinutes() + (service.duration || 30))
        const resources: Array<string | null> = [null, ...(localStaffMembers?.map(s => s.id) || [])]
        const available = resources.find((key) => {
          const resourceKey = key ?? 'owner'
          const intervals = busyByResource[resourceKey] || []
          return !intervals.some(({ start: bStart, end: bEnd }) => doesOverlap(startCopy, endCopy, bStart, bEnd))
        })
        staffMemberIdToAssign = available ?? null
      } else {
        staffMemberIdToAssign = selectedStaff
      }

      // 3) Create appointment
      const insertData: Record<string, any> = {
        client_id: clientId,
        service_id: service.id,
        start_time: start.toISOString(),
        profile_id: profile.id,
      }
      insertData['staff_member_id'] = staffMemberIdToAssign

      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert(insertData)

      if (appointmentError) {
        console.error('Randevu oluşturma hatası:', appointmentError)
        toast.error('Randevu oluşturulamadı')
        setIsSubmitting(false)
        return
      }

      toast.success('Randevunuz başarıyla oluşturuldu!')
      // Reset and close
      setSelectedDate(undefined)
      setSelectedTime('')
      setCustomerName('')
      setCustomerPhone('')
      setStep(hasStaffSelection ? 1 : 2)
      setIsOpen(false)
    } catch (err) {
      console.error('Booking error:', err)
      toast.error('Beklenmeyen bir hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // reset on close
      setStep(hasStaffSelection ? 1 : 2)
      setSelectedDate(undefined)
      setSelectedTime('')
      setCustomerName('')
      setCustomerPhone('')
      setBusyByResource({})
      setIsSubmitting(false)
      setSelectedStaff(hasStaffSelection ? 'any' : 'owner')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-slate-50 text-slate-950 hover:bg-slate-200 font-medium">
          Randevu Al
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] bg-slate-100 border border-slate-300">
        <DialogHeader>
          <DialogTitle className="text-slate-900 flex items-center justify-between">
            <span>{service.name}</span>
            <span className="text-sm font-medium text-slate-600">{service.price} TL</span>
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Optional Staff Selection */}
        {step === 1 && hasStaffSelection && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-800">Personel Seçimi</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger className="w-full bg-white border-slate-300 text-slate-900">
                  <SelectValue placeholder="Personel seçin" />
                </SelectTrigger>
                <SelectContent className="bg-white text-slate-900 border-slate-300">
                  <SelectItem value="any">Fark Etmez - Müsait Olan İlk Kişi</SelectItem>
                  <SelectItem value="owner">{profile.full_name || 'İşletme Sahibi'}</SelectItem>
                  {localStaffMembers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Date & Time */}
        {((step === 1 && !hasStaffSelection) || step === 2) && (
          <div className="space-y-4">
            <div>
              <Label className="text-slate-800">Tarih Seçin</Label>
              <div className="mt-2 rounded-md border border-slate-300 bg-white p-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={tr}
                  className="text-slate-900"
                  disabled={(date) => {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    return date < today
                  }}
                />
              </div>
            </div>

            {selectedDate && (
              <div>
                <Label className="text-slate-800">Saat Seçin</Label>
                <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {allSlots.map((slot) => {
                    const available = isSlotAvailable(slot)
                    return (
                      <Button
                        key={slot}
                        variant={selectedTime === slot ? 'default' : 'outline'}
                        className={`h-10 ${selectedTime === slot ? 'bg-blue-600 text-white hover:bg-blue-500' : 'border-slate-300 text-slate-800 hover:bg-slate-200'} ${!available ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!available}
                        onClick={() => handleTimeSelect(slot)}
                      >
                        {slot}
                      </Button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Contact Details */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                {selectedDate && `${format(selectedDate, 'PPP', { locale: tr })}`} • {selectedTime}
              </div>
              <Button variant="outline" className="text-slate-800" onClick={handleBack}>Geri</Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName" className="text-slate-800">Adınız Soyadınız</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Adınızı ve soyadınızı giriniz"
                className="bg-white border-slate-300 text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone" className="text-slate-800">Telefon Numaranız</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="5XX XXX XX XX"
                className="bg-white border-slate-300 text-slate-900"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 1 && hasStaffSelection ? (
            <Button onClick={() => setStep(2)} className="bg-blue-600 text-white hover:bg-blue-500">
              Devam Et
            </Button>
          ) : ((step === 1 && !hasStaffSelection) || step === 2) ? (
            <div className="flex items-center gap-3">
              {step === 2 && hasStaffSelection && (
                <Button
                  type="button"
                  variant="outline"
                  className="text-slate-800"
                  onClick={() => setStep(1)}
                >
                  Geri
                </Button>
              )}
              <Button
                onClick={() => setStep(3)}
                disabled={!selectedDate || !selectedTime}
                className="bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Devam Et
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleConfirmBooking}
              disabled={isSubmitting || !customerName.trim() || !customerPhone.trim()}
              className="bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Kaydediliyor...' : 'Randevuyu Onayla'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}



