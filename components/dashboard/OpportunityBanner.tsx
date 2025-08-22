'use client'

import { useState } from 'react'
import { Sparkles, XIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

type Opportunity = {
  text: string
  [key: string]: unknown
}

export default function OpportunityBanner({ opportunity }: { opportunity: Opportunity }) {
  const [isVisible, setIsVisible] = useState(true)
  const router = useRouter()

  if (!isVisible) return null

  return (
    <div>
      <Alert
        role="link"
        tabIndex={0}
        aria-label="Akıllı Fırsatlar sayfasına git"
        onClick={() => router.push('/dashboard/opportunities')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            router.push('/dashboard/opportunities')
          }
        }}
        className="relative overflow-hidden border border-slate-800/80 px-3 py-2.5 bg-slate-900/40 hover:border-slate-700 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 before:absolute before:inset-0 before:pointer-events-none before:bg-gradient-to-r before:from-emerald-500/10 before:via-transparent before:to-transparent after:absolute after:inset-x-0 after:top-0 after:h-px after:bg-gradient-to-r after:from-emerald-400/30 after:via-emerald-300/10 after:to-transparent"
      >
        <Sparkles className="h-3.5 w-3.5 text-emerald-300 opacity-80" />
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <AlertTitle className="text-slate-200 text-sm">Akıllı Fırsat!</AlertTitle>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Kapat"
                onClick={(e) => { e.stopPropagation(); setIsVisible(false) }}
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 h-7 w-7"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            <AlertDescription className="mt-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-slate-400 text-sm">
                  {opportunity?.text}
                </p>
                <Button variant="outline" size="sm" className="border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/10" onClick={(e) => e.stopPropagation()}>
                  WhatsApp ile Yaz
                </Button>
              </div>
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  )
}


