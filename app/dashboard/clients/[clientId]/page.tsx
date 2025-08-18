'use client'

import { useEffect, useMemo, useState, useCallback, FormEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface ClientNote {
  id: string
  client_id: string
  content: string
  created_at: string
}

interface AppointmentNote {
  id: string
  appointment_id: string
  content: string
  created_at: string
}

interface ServiceSummary {
  name: string | null
  price: number | null
}

interface Appointment {
  id: string
  start_time: string | null
  end_time: string | null
  services: ServiceSummary | null
  appointment_notes: AppointmentNote[]
}

interface ClientDetail {
  id: string
  name: string
  phone: string
  notes: string | null
  created_at: string
  client_notes: ClientNote[]
  appointments: Appointment[]
}

export default function ClientDetailPage() {
  const router = useRouter()
  const params = useParams<{ clientId: string }>()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Local form state for new notes
  const [newPersonalNote, setNewPersonalNote] = useState('')
  const [addingPersonalNote, setAddingPersonalNote] = useState(false)
  const [addingTechnicalNoteByAppointmentId, setAddingTechnicalNoteByAppointmentId] = useState<Record<string, boolean>>({})
  const [newTechnicalNoteByAppointmentId, setNewTechnicalNoteByAppointmentId] = useState<Record<string, string>>({})

  const clientId = useMemo(() => {
    const id = params?.clientId
    return Array.isArray(id) ? id[0] : id
  }, [params])

  const fetchClient = useCallback(async () => {
    if (!clientId) return
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*, client_notes(*), appointments(*, services(name, price), appointment_notes(*))')
        .eq('id', clientId)
        .single()

      if (error) {
        setErrorMessage('Müşteri bilgileri alınırken bir hata oluştu.')
        setClient(null)
        return
      }

      // Normalize arrays to ensure defined
      const base = data as unknown as Omit<ClientDetail, 'client_notes' | 'appointments'> & {
        client_notes?: ClientNote[]
        appointments?: Array<Appointment & { services?: ServiceSummary | null; appointment_notes?: AppointmentNote[] }>
      }
      const normalized: ClientDetail = {
        ...base,
        client_notes: (base?.client_notes || []) as ClientNote[],
        appointments: ((base?.appointments || []) as Array<Appointment & { services?: ServiceSummary | null; appointment_notes?: AppointmentNote[] }>).map((a) => ({
          ...a,
          services: a?.services ?? null,
          appointment_notes: (a?.appointment_notes || []) as AppointmentNote[]
        }))
      }

      setClient(normalized)
    } catch {
      setErrorMessage('Beklenmeyen bir hata oluştu.')
      setClient(null)
    } finally {
      setIsLoading(false)
    }
  }, [clientId, supabase])

  useEffect(() => {
    fetchClient()
  }, [fetchClient])

  const sortedClientNotes = useMemo(() => {
    return (client?.client_notes || [])
      .slice()
      .sort((a, b) => {
        const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0
        const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0
        return bTime - aTime
      })
  }, [client])

  // Stats for "Müşteri Karnesi"
  const {
    totalAppointments,
    daysSinceLastVisit,
    totalSpend,
    averageDaysBetweenVisits
  } = useMemo(() => {
    const appointments = (client?.appointments || [])
      .filter((a) => !!a.start_time)
      .slice()
      .sort((a, b) => new Date(a.start_time || 0).getTime() - new Date(b.start_time || 0).getTime())

    const totalAppointmentsCount = appointments.length

    // Days since last visit
    let daysSince: number | null = null
    if (appointments.length > 0) {
      const last = appointments[appointments.length - 1]
      const nowMs = Date.now()
      const lastMs = new Date(last.start_time as string).getTime()
      daysSince = Math.max(0, Math.floor((nowMs - lastMs) / (1000 * 60 * 60 * 24)))
    }

    // Total spend
    const total = appointments.reduce((sum, a) => {
      const price = typeof a.services?.price === 'number' ? a.services?.price : 0
      return sum + (price || 0)
    }, 0)

    // Average days between visits
    let avgBetween: number | null = null
    if (appointments.length >= 2) {
      let totalDiffDays = 0
      let intervals = 0
      for (let i = 1; i < appointments.length; i++) {
        const prev = new Date(appointments[i - 1].start_time as string).getTime()
        const curr = new Date(appointments[i].start_time as string).getTime()
        const diffDays = Math.abs(curr - prev) / (1000 * 60 * 60 * 24)
        totalDiffDays += diffDays
        intervals += 1
      }
      avgBetween = intervals > 0 ? Math.round(totalDiffDays / intervals) : null
    }

    return {
      totalAppointments: totalAppointmentsCount,
      daysSinceLastVisit: daysSince,
      totalSpend: total,
      averageDaysBetweenVisits: avgBetween
    }
  }, [client])

  const handleAddPersonalNote = async (e: FormEvent) => {
    e.preventDefault()
    if (!client || !newPersonalNote.trim()) return
    try {
      setAddingPersonalNote(true)
      const { data: { session } } = await supabase.auth.getSession()
      const profileId = session?.user.id
      if (!profileId) return
      const { error } = await supabase
        .from('client_notes')
        .insert({ client_id: client.id, content: newPersonalNote.trim(), profile_id: profileId, created_at: new Date().toISOString() })
      if (error) {
        console.error('insert client_notes failed', { error })
      } else {
        setNewPersonalNote('')
        await fetchClient()
      }
    } finally {
      setAddingPersonalNote(false)
    }
  }

  const handleAddTechnicalNote = (appointmentId: string) => async (e: FormEvent) => {
    e.preventDefault()
    const note = (newTechnicalNoteByAppointmentId[appointmentId] || '').trim()
    if (!client || !appointmentId || !note) return

    try {
      setAddingTechnicalNoteByAppointmentId((prev) => ({ ...prev, [appointmentId]: true }))
      const { data: { session } } = await supabase.auth.getSession()
      const profileId = session?.user.id
      if (!profileId) return

      // Sanity check: ensure this appointment belongs to current user
      const { data: apptOwn, error: apptErr } = await supabase
        .from('appointments')
        .select('id')
        .eq('id', appointmentId)
        .eq('profile_id', profileId)
        .single()
      if (apptErr || !apptOwn) {
        console.error('appointment ownership check failed', { apptErr, appointmentId, profileId })
        return
      }

      const { error } = await supabase
        .from('appointment_notes')
        .insert({ appointment_id: appointmentId, content: note, profile_id: profileId })
      if (error) {
        console.error('insert appointment_notes failed', { error })
      } else {
        setNewTechnicalNoteByAppointmentId((prev) => ({ ...prev, [appointmentId]: '' }))
        await fetchClient()
      }
    } finally {
      setAddingTechnicalNoteByAppointmentId((prev) => ({ ...prev, [appointmentId]: false }))
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

  if (errorMessage || !client) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => router.push('/dashboard/clients')} className="mb-6 text-slate-400 hover:text-slate-200 hover:bg-slate-800">← Müşterilere Dön</Button>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Müşteri Bulunamadı</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">{errorMessage || 'Aradığınız müşteri bulunamadı.'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{client.name}</h1>
            <p className="text-slate-400 mt-1">{client.phone}</p>
          </div>
          <Button variant="ghost" onClick={() => router.push('/dashboard/clients')} className="text-slate-400 hover:text-slate-200 hover:bg-slate-800">← Müşterilere Dön</Button>
        </div>

        {/* Two-column cockpit layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Servis Geçmişi */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Servis Geçmişi</CardTitle>
              </CardHeader>
              <CardContent>
                {client.appointments.length === 0 ? (
                  <p className="text-slate-400">Randevu geçmişi bulunmuyor.</p>
                ) : (
                  <div className="space-y-6">
                    {client.appointments
                      .slice()
                      .sort((a, b) => new Date(b.start_time || 0).getTime() - new Date(a.start_time || 0).getTime())
                      .map((appointment) => {
                        const sortedTechNotes = (appointment.appointment_notes || [])
                          .slice()
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        const adding = !!addingTechnicalNoteByAppointmentId[appointment.id]
                        const value = newTechnicalNoteByAppointmentId[appointment.id] || ''
                        return (
                          <div key={appointment.id} className="p-4 bg-slate-800 rounded border border-slate-700">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <div className="text-white font-medium">
                                  {(appointment.services?.name) || 'Hizmet bilgisi yok'}
                                </div>
                                <div className="text-slate-400 text-sm">
                                  {appointment.start_time ? new Date(appointment.start_time).toLocaleString('tr-TR') : 'Tarih yok'}
                                  {typeof appointment.services?.price === 'number' ? ` • ${appointment.services.price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}` : ''}
                                </div>
                              </div>
                            </div>

                            {sortedTechNotes.length === 0 ? (
                              <p className="text-slate-400 mb-2">Teknik not bulunmuyor.</p>
                            ) : (
                              <ul className="space-y-2 mb-3">
                                {sortedTechNotes.map((note) => (
                                  <li key={note.id} className="p-2 bg-slate-900 rounded border border-slate-700">
                                    <div className="text-xs text-slate-400 mb-1">{new Date(note.created_at).toLocaleString('tr-TR')}</div>
                                    <div className="text-slate-200">{note.content}</div>
                                  </li>
                                ))}
                              </ul>
                            )}

                            <form onSubmit={handleAddTechnicalNote(appointment.id)} className="flex gap-2">
                              <Input
                                value={value}
                                onChange={(e) => setNewTechnicalNoteByAppointmentId((prev) => ({ ...prev, [appointment.id]: e.target.value }))}
                                placeholder="Yeni teknik not yazın..."
                                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                              />
                              <Button type="submit" disabled={adding || !value.trim()} className="bg-slate-50 text-slate-950 hover:bg-slate-200">
                                {adding ? 'Ekleniyor...' : 'Yeni Teknik Not Ekle'}
                              </Button>
                            </form>
                          </div>
                        )
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right - Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Müşteri Karnesi */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Müşteri Karnesi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded bg-slate-800 border border-slate-700">
                    <div className="text-slate-400 text-xs">Toplam Randevu</div>
                    <div className="text-white text-xl font-semibold mt-1">{totalAppointments}</div>
                  </div>
                  <div className="p-3 rounded bg-slate-800 border border-slate-700">
                    <div className="text-slate-400 text-xs">Son Ziyaretten Beri</div>
                    <div className="text-white text-xl font-semibold mt-1">{typeof daysSinceLastVisit === 'number' ? `${daysSinceLastVisit} gün` : '—'}</div>
                  </div>
                  <div className="p-3 rounded bg-slate-800 border border-slate-700">
                    <div className="text-slate-400 text-xs">Toplam Harcama</div>
                    <div className="text-white text-xl font-semibold mt-1">{totalSpend.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</div>
                  </div>
                  <div className="p-3 rounded bg-slate-800 border border-slate-700">
                    <div className="text-slate-400 text-xs">Ziyaretler Arası Ortalama</div>
                    <div className="text-white text-xl font-semibold mt-1">{typeof averageDaysBetweenVisits === 'number' ? `${averageDaysBetweenVisits} gün` : 'Hesaplanıyor'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Kişisel Notlar */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Kişisel Notlar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedClientNotes.length === 0 ? (
                    <p className="text-slate-400">Henüz kişisel not bulunmuyor.</p>
                  ) : (
                    <ul className="space-y-3">
                      {sortedClientNotes.map((note) => (
                        <li key={note.id} className="p-3 bg-slate-800 rounded border border-slate-700">
                          <div className="text-xs text-slate-400 mb-1">{new Date(note.created_at).toLocaleString('tr-TR')}</div>
                          <div className="whitespace-pre-wrap text-slate-200">{note.content}</div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <form onSubmit={handleAddPersonalNote} className="space-y-2">
                    <Textarea
                      value={newPersonalNote}
                      onChange={(e) => setNewPersonalNote(e.target.value)}
                      placeholder="Yeni kişisel not yazın..."
                      rows={3}
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none"
                    />
                    <div className="flex justify-end">
                      <Button type="submit" disabled={addingPersonalNote || !newPersonalNote.trim()} className="bg-slate-50 text-slate-950 hover:bg-slate-200">
                        {addingPersonalNote ? 'Ekleniyor...' : 'Yeni Not Ekle'}
                      </Button>
                    </div>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}


