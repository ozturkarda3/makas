'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ChevronsUpDown, Check, User } from 'lucide-react'

type ClientItem = {
  id: string
  name: string
  phone: string | null
}

type CustomerComboboxProps = {
  onSelectClient: (clientId: string) => void
  defaultClientId?: string | null
  placeholder?: string
  className?: string
  tone?: 'slate' | 'blue'
  allowCreate?: boolean
  onCreateClient?: (name: string) => void
  selectedLabel?: string | null
}

export default function CustomerCombobox({ onSelectClient, defaultClientId = null, placeholder = 'Bir müşteri seçin...', className, tone = 'slate', allowCreate = false, onCreateClient, selectedLabel = null }: CustomerComboboxProps) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [clients, setClients] = useState<ClientItem[]>([])
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(defaultClientId)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return
        const { data, error } = await supabase
          .from('clients')
          .select('id, name, phone')
          .eq('profile_id', session.user.id)
          .order('name', { ascending: true })
        if (error) {
          console.error('Clients fetch error:', error)
          return
        }
        setClients((data || []) as ClientItem[])
        // If default id provided, ensure it's set if present
        if (defaultClientId) {
          const exists = (data || []).some((c: { id: string }) => c.id === defaultClientId)
          if (exists) setSelectedId(defaultClientId)
        }
      } catch (e) {
        console.error('Load clients error:', e)
      } finally {
        setIsLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  const filtered = useMemo(() => {
    const raw = query.trim()
    if (!raw) return clients
    const qLower = raw.toLocaleLowerCase('tr')
    const qDigits = raw.replace(/\D+/g, '')
    return clients.filter((c) => {
      const nameLower = (c.name || '').toLocaleLowerCase('tr')
      const phoneDigits = (c.phone || '').replace(/\D+/g, '')
      const nameMatches = nameLower.includes(qLower)
      const phoneMatches = qDigits.length > 0 && phoneDigits.includes(qDigits)
      return nameMatches || phoneMatches
    })
  }, [clients, query])

  const selected = selectedId ? clients.find(c => c.id === selectedId) : undefined

  const handleSelect = (id: string) => {
    setSelectedId(id)
    onSelectClient(id)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', tone === 'blue' ? 'border-blue-900 text-blue-900 focus:border-blue-700 focus:ring-blue-700' : '', className)}
        >
          <span className="flex items-center gap-2 truncate">
            <User className={cn('h-4 w-4', tone === 'blue' ? 'text-blue-900' : 'text-slate-400')} />
            {selected ? (
              <span className={cn('truncate', tone === 'blue' ? 'text-blue-900' : undefined)}>{selected.name}</span>
            ) : selectedLabel ? (
              <span className={cn('truncate', tone === 'blue' ? 'text-blue-900' : undefined)}>{selectedLabel}</span>
            ) : (
              <span className={cn(tone === 'blue' ? 'text-blue-900' : 'text-slate-500')}>{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-slate-900 border-slate-800 text-slate-200" align="start">
        <div className="p-2 border-b border-slate-800">
          <Input
            placeholder="Ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && allowCreate && query.trim().length > 0) {
                e.preventDefault()
                if (onCreateClient) {
                  onCreateClient(query.trim())
                }
                setOpen(false)
                setQuery('')
              }
            }}
            className="h-9 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
          />
        </div>
        <div className="max-h-64 overflow-auto">
          {isLoading ? (
            <div className="p-3 text-sm text-slate-400">Yükleniyor...</div>
          ) : filtered.length === 0 ? (
            <div className="p-3 space-y-2">
              <div className="text-sm text-slate-400">Sonuç bulunamadı</div>
              {allowCreate && query.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (onCreateClient) {
                      onCreateClient(query.trim())
                    }
                    setOpen(false)
                    setQuery('')
                  }}
                  className="w-full text-left px-3 py-2 bg-slate-800/60 hover:bg-slate-800 text-slate-200 rounded"
                >
                  Yeni müşteri oluştur: &quot;{query.trim()}&quot;
                </button>
              )}
            </div>
          ) : (
            <ul className="py-1">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(c.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 hover:bg-slate-800 focus:bg-slate-800 outline-none flex items-center gap-2',
                      selectedId === c.id && 'bg-slate-800'
                    )}
                  >
                    <Check className={cn('h-4 w-4 text-primary', selectedId === c.id ? 'opacity-100' : 'opacity-0')} />
                    <div className="flex-1 truncate">
                      <div className="truncate text-slate-200">{c.name}</div>
                      <div className="text-xs text-slate-400 truncate">{c.phone || ''}</div>
                    </div>
                  </button>
                </li>
              ))}
              {allowCreate && query.trim().length > 0 && (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (onCreateClient) {
                        onCreateClient(query.trim())
                      }
                      setOpen(false)
                      setQuery('')
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800 focus:bg-slate-800 outline-none flex items-center gap-2 text-slate-200"
                  >
                    <User className="h-4 w-4" /> Yeni müşteri oluştur: &quot;{query.trim()}&quot;
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}


