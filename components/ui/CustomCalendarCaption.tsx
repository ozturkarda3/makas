'use client'

import * as React from 'react'
import { useDayPicker } from 'react-day-picker'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

type CustomCalendarCaptionProps = {
  displayMonth?: Date
}

export default function CustomCalendarCaption({ displayMonth }: CustomCalendarCaptionProps) {
  const { goToMonth } = useDayPicker()

  const handlePrevious = React.useCallback(() => {
    const base = displayMonth ?? new Date()
    const previous = new Date(base)
    previous.setMonth(base.getMonth() - 1)
    previous.setDate(1)
    goToMonth(previous)
  }, [displayMonth, goToMonth])

  const handleNext = React.useCallback(() => {
    const base = displayMonth ?? new Date()
    const next = new Date(base)
    next.setMonth(base.getMonth() + 1)
    next.setDate(1)
    goToMonth(next)
  }, [displayMonth, goToMonth])

  const monthLabel = React.useMemo(() => {
    const base = displayMonth ?? new Date()
    try {
      return base.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
    } catch {
      return base.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
  }, [displayMonth])

  const base = displayMonth ?? new Date()
  const monthIndex = base.getMonth()
  const yearValue = base.getFullYear()
  const monthNames = React.useMemo(
    () => Array.from({ length: 12 }, (_, i) => new Date(2020, i, 1).toLocaleDateString('tr-TR', { month: 'long' })),
    []
  )
  const years = React.useMemo(() => {
    const arr: number[] = []
    for (let y = 2020; y <= 2030; y++) arr.push(y)
    return arr
  }, [])

  const onMonthChange = (value: string) => {
    const m = parseInt(value, 10)
    if (Number.isNaN(m)) return
    const d = new Date(yearValue, m, 1)
    // also update selected day if available so DayPicker re-renders
    goToMonth(d)
  }

  const onYearChange = (value: string) => {
    const y = parseInt(value, 10)
    if (Number.isNaN(y)) return
    const d = new Date(y, monthIndex, 1)
    goToMonth(d)
  }

  return (
    <div className="flex items-center justify-between w-full px-2 gap-2">
      <Button variant="ghost" size="icon" aria-label="Önceki ay" onClick={handlePrevious} className="h-7 w-7">
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-2">
        <Select value={String(monthIndex)} onValueChange={onMonthChange}>
          <SelectTrigger className="h-9 w-[160px] bg-slate-900 border-slate-700 text-slate-200">
            <SelectValue placeholder={monthLabel} />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
            {monthNames.map((m, idx) => (
              <SelectItem key={idx} value={String(idx)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(yearValue)} onValueChange={onYearChange}>
          <SelectTrigger className="h-9 w-[110px] bg-slate-900 border-slate-700 text-slate-200">
            <SelectValue placeholder={String(yearValue)} />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button variant="ghost" size="icon" aria-label="Sonraki ay" onClick={handleNext} className="h-7 w-7">
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  )
}


