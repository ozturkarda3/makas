'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface WeeklyData {
  date: string
  total: number
}

interface WeeklyChartProps {
  data: WeeklyData[]
}

export default function WeeklyChart({ data }: WeeklyChartProps) {
  // Format the data for better display
  const formattedData = data.map(item => ({
    ...item,
    // Format date to show day name (e.g., "Pzt", "Sal")
    date: new Date(item.date).toLocaleDateString('tr-TR', { 
      weekday: 'short' 
    }).charAt(0).toUpperCase() + new Date(item.date).toLocaleDateString('tr-TR', { 
      weekday: 'short' 
    }).slice(1)
  }))

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Haftalık Aktivite</CardTitle>
        <CardDescription className="text-slate-400">
          Son 7 günün randevu sayısı
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData}>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                allowDecimals={false}
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
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary stats below the chart */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-slate-400 text-sm">Toplam Randevu</p>
              <p className="text-white font-semibold text-lg">
                {data.reduce((sum, item) => sum + item.total, 0)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Günlük Ortalama</p>
              <p className="text-white font-semibold text-lg">
                {Math.round(data.reduce((sum, item) => sum + item.total, 0) / data.length)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
