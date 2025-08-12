'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface ChartData {
  date: string
  total: number
}

interface AnalyticsWidgetProps {
  appointmentData: ChartData[]
  revenueData: ChartData[]
  newClientData: ChartData[]
  timeRange: string
  setTimeRange: (value: string) => void
}

export default function AnalyticsWidget({ 
  appointmentData, 
  revenueData, 
  newClientData,
  timeRange,
  setTimeRange
}: AnalyticsWidgetProps) {
  
  // Turkish month name to short form
  const monthAbbrTR: Record<string, string> = {
    'ocak': 'Oca',
    'şubat': 'Şub',
    'mart': 'Mar',
    'nisan': 'Nis',
    'mayıs': 'May',
    'haziran': 'Haz',
    'temmuz': 'Tem',
    'ağustos': 'Ağu',
    'eylül': 'Eyl',
    'ekim': 'Eki',
    'kasım': 'Kas',
    'aralık': 'Ara',
  }

  // Shorten labels like "28 Temmuz - 3 Ağustos Haftası" to "28 Tem - 3 Ağu"
  const shortenWeekLabelTR = (label: string): string => {
    try {
      const cleaned = label.replace(/\s*Haftası\s*$/i, '')
      const parts = cleaned.split(' - ')
      if (parts.length !== 2) return label
      const toShort = (part: string) => {
        const bits = part.trim().split(/\s+/)
        if (bits.length < 2) return part
        const day = bits[0]
        const monthLong = bits.slice(1).join(' ').toLowerCase()
        const monthShort = monthAbbrTR[monthLong] || bits[1]
        return `${day} ${monthShort}`
      }
      return `${toShort(parts[0])} - ${toShort(parts[1])}`
    } catch {
      return label
    }
  }

  const xTickFormatter = (value: string) => {
    if (timeRange === '30d') {
      return shortenWeekLabelTR(value)
    }
    return value
  }

  // Helper function to format data for charts based on timeRange
  const formatChartData = (data: ChartData[]) => {
    return data.map(item => {
      if (timeRange === '7d') {
        // For 7 days: show day names (e.g., "Pzt", "Sal")
        const dayName = new Date(item.date).toLocaleDateString('tr-TR', { 
          weekday: 'short' 
        })
        return {
          ...item,
          date: dayName.charAt(0).toUpperCase() + dayName.slice(1)
        }
      } else if (timeRange === '30d') {
        // For 30 days: use the precomputed label as-is; XAxis will shorten it
        return item
      } else if (timeRange === '6m') {
        // For 6 months: show month names
        const monthName = new Date(item.date).toLocaleDateString('tr-TR', { 
          month: 'long' 
        })
        return {
          ...item,
          date: monthName.charAt(0).toUpperCase() + monthName.slice(1)
        }
      }
      return item
    })
  }

  // Chart configuration for each tab
  const chartConfigs = {
    appointments: {
      data: formatChartData(appointmentData),
      color: '#3b82f6', // Blue
      title: 'Randevu Sayısı',
      yAxisLabel: 'Randevu Sayısı'
    },
    revenue: {
      data: formatChartData(revenueData),
      color: '#10b981', // Green
      title: 'Kazanç',
      yAxisLabel: 'TL'
    },
    newClients: {
      data: formatChartData(newClientData),
      color: '#f59e0b', // Amber
      title: 'Yeni Müşteriler',
      yAxisLabel: 'Müşteri Sayısı'
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">
            {timeRange === '7d' ? 'Haftalık Analizler' : 
             timeRange === '30d' ? 'Aylık Analizler' : '6 Aylık Analizler'}
          </CardTitle>
          <ToggleGroup 
            type="single" 
            value={timeRange} 
            onValueChange={(value) => value && setTimeRange(value)}
            className="bg-slate-800 border border-slate-700"
          >
            <ToggleGroupItem 
              value="7d" 
              className="data-[state=on]:bg-slate-700 data-[state=on]:text-white text-slate-400 hover:bg-slate-700 hover:text-white"
            >
              Son 7 Gün
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="30d" 
              className="data-[state=on]:bg-slate-700 data-[state=on]:text-white text-slate-400 hover:bg-slate-700 hover:text-white"
            >
              Son 30 Gün
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="6m" 
              className="data-[state=on]:bg-slate-700 data-[state=on]:text-white text-slate-400 hover:bg-slate-700 hover:text-white"
            >
              Son 6 Ay
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-700">
            <TabsTrigger 
              value="appointments"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400"
            >
              Randevu Sayısı
            </TabsTrigger>
            <TabsTrigger 
              value="revenue"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400"
            >
              Kazanç
            </TabsTrigger>
            <TabsTrigger 
              value="newClients"
              className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400"
            >
              Yeni Müşteriler
            </TabsTrigger>
          </TabsList>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="mt-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartConfigs.appointments.data}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={xTickFormatter}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    allowDecimals={false}
                    label={{ value: chartConfigs.appointments.yAxisLabel, angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#f8fafc'
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Bar 
                    dataKey="total" 
                    fill={chartConfigs.appointments.color}
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="mt-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartConfigs.revenue.data}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={xTickFormatter}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    label={{ value: chartConfigs.revenue.yAxisLabel, angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#f8fafc'
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                    formatter={(value: number) => [`${value} TL`, 'Kazanç']}
                  />
                  <Bar 
                    dataKey="total" 
                    fill={chartConfigs.revenue.color}
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* New Clients Tab */}
          <TabsContent value="newClients" className="mt-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartConfigs.newClients.data}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={xTickFormatter}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    allowDecimals={false}
                    label={{ value: chartConfigs.newClients.yAxisLabel, angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#f8fafc'
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Bar 
                    dataKey="total" 
                    fill={chartConfigs.newClients.color}
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
