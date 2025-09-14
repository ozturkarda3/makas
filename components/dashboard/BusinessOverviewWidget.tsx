'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

type ServiceStat = {
  name: string
  revenue: number
}

type StaffStat = {
  name: string
  revenue: number
}

type CustomerStats = {
  newCustomers: number
  returningCustomers: number
}

interface BusinessOverviewWidgetProps {
  topServices?: ServiceStat[]
  topStaff?: StaffStat[]
  customerStats?: CustomerStats
  timeRange?: '7d' | '30d' | '6m'
  setTimeRange?: (value: '7d' | '30d' | '6m') => void
}

const placeholderTopServices: ServiceStat[] = [
  { name: 'Saç Kesimi', revenue: 12500 },
  { name: 'Saç Boyama', revenue: 9800 },
  { name: 'Fön', revenue: 6200 },
]

const placeholderTopStaff: StaffStat[] = [
  { name: 'Ayşe Yılmaz', revenue: 15400 },
  { name: 'Mehmet Demir', revenue: 12150 },
  { name: 'Zeynep Ak', revenue: 8900 },
]

const placeholderCustomerStats: CustomerStats = {
  newCustomers: 42,
  returningCustomers: 67,
}

function formatTRY(amount: number): string {
  try {
    return amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
  } catch {
    return `${amount} TL`
  }
}

export default function BusinessOverviewWidget({
  topServices,
  topStaff,
  customerStats,
  timeRange = '7d',
  setTimeRange,
}: BusinessOverviewWidgetProps) {
  const servicesToShow = (topServices && topServices.length > 0 ? topServices : placeholderTopServices).slice(0, 3)
  const staffToShow = (topStaff && topStaff.length > 0 ? topStaff : placeholderTopStaff).slice(0, 3)
  const customersToShow = customerStats ?? placeholderCustomerStats

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-white text-lg font-semibold">İşletme Durumu</CardTitle>
          <div className="w-36">
            <Select
              value={timeRange}
              onValueChange={(v) => setTimeRange && setTimeRange(v as '7d' | '30d' | '6m')}
            >
              <SelectTrigger className="h-8 bg-slate-800/50 border-slate-700 text-slate-200">
                <SelectValue placeholder="Dönem" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
                <SelectItem value="7d">7 Gün</SelectItem>
                <SelectItem value="30d">30 Gün</SelectItem>
                <SelectItem value="6m">6 Ay</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* En Popüler Hizmetler */}
          <section>
            <h3 className="text-slate-300 text-sm font-medium mb-3">En Popüler Hizmetler</h3>
            <div className="space-y-2">
              {servicesToShow.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-800/40 px-3 py-2"
                >
                  <span className="text-slate-200 text-sm font-medium truncate">{s.name}</span>
                  <span className="text-slate-300 text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                    {formatTRY(s.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* En İyi Performans */}
          <section>
            <h3 className="text-slate-300 text-sm font-medium mb-3">En İyi Performans</h3>
            <div className="space-y-2">
              {staffToShow.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-800/40 px-3 py-2"
                >
                  <span className="text-slate-200 text-sm font-medium truncate">{s.name}</span>
                  <span className="text-slate-300 text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                    {formatTRY(s.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Müşteri Analizi */}
          <section>
            <h3 className="text-slate-300 text-sm font-medium mb-3">Müşteri Analizi</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-md border border-slate-800 bg-slate-800/40 px-3 py-3">
                <div className="text-slate-400 text-xs">Kazanılan Yeni Müşteri Sayısı</div>
                <div className="text-white text-lg font-semibold">{customersToShow.newCustomers}</div>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-800/40 px-3 py-3">
                <div className="text-slate-400 text-xs">Geri Dönen Müşteri Sayısı</div>
                <div className="text-white text-lg font-semibold">{customersToShow.returningCustomers}</div>
              </div>
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  )
}


