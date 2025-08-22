import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabaseClient'

export type OpportunityType = 'lapsing' | 'upsell'

export type Opportunity = {
  id: string
  type: OpportunityType
  clientId: string
  clientName: string
  phone?: string | null
  description: string
}

type ClientRow = {
  id: string
  name: string
  phone?: string | null
  created_at?: string
}

type AppointmentRow = {
  client_id: string | null
  start_time: string
  services?: { id: string; name: string } | Array<{ id: string; name: string }>
}

export function useOpportunities() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])

  const findOpportunities = useCallback((clients: ClientRow[], appointments: AppointmentRow[]): Opportunity[] => {
    const today = new Date()

    // Map last appointment per client
    const latestByClient = new Map<string, Date>()
    // Service counts globally and per client
    const serviceCounts = new Map<string, { name: string; count: number }>()
    const servicesByClient = new Map<string, Set<string>>()

    for (const apt of appointments) {
      const clientId = apt.client_id || undefined
      const start = new Date(apt.start_time)
      if (clientId) {
        const current = latestByClient.get(clientId)
        if (!current || start > current) latestByClient.set(clientId, start)
      }

      const raw = apt.services
      const serviceList = Array.isArray(raw) ? raw : raw ? [raw] : []
      for (const s of serviceList) {
        const prev = serviceCounts.get(s.id) || { name: s.name, count: 0 }
        serviceCounts.set(s.id, { name: s.name, count: prev.count + 1 })
        if (clientId) {
          if (!servicesByClient.has(clientId)) servicesByClient.set(clientId, new Set())
          servicesByClient.get(clientId)!.add(s.id)
        }
      }
    }

    // Determine top services (for simple upsell heuristic)
    const topServices = Array.from(serviceCounts.entries()).sort((a, b) => b[1].count - a[1].count)
    const topA = topServices[0]
    const topB = topServices[1]

    const lapsingThresholdDays = 35
    const results: Opportunity[] = []

    for (const client of clients) {
      const clientId = client.id
      const clientName = client.name
      // Lapsing
      const last = latestByClient.get(clientId) || (client.created_at ? new Date(client.created_at) : undefined)
      if (last) {
        const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays > lapsingThresholdDays) {
          results.push({
            id: `lapsing-${clientId}`,
            type: 'lapsing',
            clientId,
            clientName,
            phone: client.phone ?? null,
            description: `${clientName}'nin son randevusunun üzerinden ${diffDays} gün geçti.`,
          })
        }
      }

      // Upsell: if client has topA but never booked topB, suggest B
      if (topA && topB) {
        const owned = servicesByClient.get(clientId) || new Set<string>()
        if (owned.has(topA[0]) && !owned.has(topB[0])) {
          results.push({
            id: `upsell-${clientId}-${topB[0]}`,
            type: 'upsell',
            clientId,
            clientName,
            phone: client.phone ?? null,
            description: `${clientName} sık sık ${topA[1].name} aldı, fakat hiç ${topB[1].name} almadı. Uygun bir zamanda önerebilirsiniz.`,
          })
        }
      }
    }

    return results
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const userId = session?.user?.id
        if (!userId) {
          setOpportunities([])
          return
        }

        const [{ data: clients, error: clientsError }, { data: appts, error: apptsError }] = await Promise.all([
          supabase.from('clients').select('id, name, phone, created_at').eq('profile_id', userId),
          supabase.from('appointments').select('client_id, start_time, services:services(id, name)').eq('profile_id', userId),
        ])

        if (clientsError) {
          // eslint-disable-next-line no-console
          console.error('useOpportunities: clients fetch error', clientsError)
        }
        if (apptsError) {
          // eslint-disable-next-line no-console
          console.error('useOpportunities: appointments fetch error', apptsError)
        }

        const clientRows = (clients || []) as ClientRow[]
        const apptRows = (appts || []) as AppointmentRow[]
        const ops = findOpportunities(clientRows, apptRows)
        setOpportunities(ops)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('useOpportunities error', err)
        setOpportunities([])
      } finally {
        setLoading(false)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { opportunities, loading }
}

export default useOpportunities


