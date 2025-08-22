'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import EmptyState from '@/components/ui/EmptyState'
import { Repeat2, Sparkles } from 'lucide-react'
import useOpportunities from '@/lib/hooks/useOpportunities'

// Opportunity type provided by the useOpportunities hook

export default function OpportunitiesPage() {
  const router = useRouter()
  const { opportunities, loading } = useOpportunities()
  const [filter, setFilter] = useState<'all' | 'lapsing' | 'upsell'>('all')

  useEffect(() => {
    // If unauthenticated, useOpportunities will return empty; keep simple redirect guard here if needed in future
  }, [])

  const filteredOpportunities = useMemo(() => {
    if (filter === 'all') return opportunities
    return opportunities.filter(o => o.type === filter)
  }, [filter, opportunities])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Yükleniyor...</div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Fırsatlar Posta Kutusu</h1>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
          <TabsList className="bg-slate-900/40 text-slate-300 border border-slate-800">
            <TabsTrigger value="all">Tümü</TabsTrigger>
            <TabsTrigger value="lapsing">Geciken Müşteriler</TabsTrigger>
            <TabsTrigger value="upsell">Ek Satış Fırsatları</TabsTrigger>
          </TabsList>
        </Tabs>

        {filteredOpportunities.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-10 w-10" />}
            title="Şimdilik fırsat yok"
            description="Seçili filtreye göre görüntülenecek fırsat bulunamadı."
            className="bg-slate-900/40 border-slate-800"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredOpportunities.map((opp) => (
              <Card key={opp.id} className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {opp.type === 'lapsing' ? (
                        <Repeat2 className="h-5 w-5 text-emerald-300" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-emerald-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-white text-base">
                        {opp.clientName}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-3">
                  <p className="text-slate-300 text-sm">{opp.description}</p>
                  <Button asChild className="bg-emerald-500/90 text-slate-950 hover:bg-emerald-400/90">
                    <a href={buildWhatsAppLink(opp.phone, opp.description)} target="_blank" rel="noopener noreferrer">
                      WhatsApp ile Yaz
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            ← Dashboard&apos;a Dön
          </Button>
        </div>
      </div>
    </div>
  )
}

function buildWhatsAppLink(phoneRaw: string, message: string): string {
  // Strip non-digits, keep leading + for parsing, then remove it as wa.me expects digits only
  const digits = (phoneRaw || '').replace(/\D/g, '')
  const text = encodeURIComponent(message)
  return `https://wa.me/${digits}?text=${text}`
}


