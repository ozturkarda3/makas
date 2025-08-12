import { Card } from "@/components/ui/card"

interface StatCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
}

export default function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <Card className="p-6 bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
      <div className="flex items-center space-x-4">
        {/* Icon Section */}
        <div className="flex-shrink-0">
          {icon || (
            <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center">
              <span className="text-slate-400 text-xl">📊</span>
            </div>
          )}
        </div>
        
        {/* Content Section */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-400 font-medium">
            {title}
          </p>
          <p className="text-3xl font-bold text-white mt-1">
            {value}
          </p>
        </div>
      </div>
    </Card>
  )
}
