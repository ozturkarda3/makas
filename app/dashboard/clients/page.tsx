'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import * as z from 'zod'
import type { User } from '@supabase/supabase-js'

interface Client {
  id: string
  name: string
  phone: string
  notes: string | null
  profile_id: string
  created_at: string
}

interface ClientFormData {
  name: string
  phone: string
  notes?: string
}

// Form validation schema
const clientSchema = z.object({
  name: z.string().min(1, 'Ad soyad gereklidir'),
  phone: z.string().min(1, 'Telefon numarası gereklidir').regex(/^[\+]?[0-9\s\-\(\)]+$/, 'Geçerli bir telefon numarası girin'),
  notes: z.string().optional()
})

export default function ClientsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Form setup
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      phone: '',
      notes: ''
    }
  })

  const fetchClients = useCallback(async (userId: string) => {
    try {
      const { data: clientsData, error } = await supabase
        .from('clients')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching clients:', error)
      } else {
        setClients(clientsData || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }, [supabase])

  useEffect(() => {
    const checkUserAndFetchClients = async () => {
      try {
        // Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }

        setUser(session.user)
        await fetchClients(session.user.id)
      } catch (error) {
        console.error('Error:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkUserAndFetchClients()
  }, [router, supabase, fetchClients])
  

  const openCreateDialog = () => {
    setIsEditMode(false)
    setEditingClient(null)
    form.reset()
    setIsDialogOpen(true)
  }

  const openEditDialog = (client: Client) => {
    setIsEditMode(true)
    setEditingClient(client)
    form.reset({
      name: client.name,
      phone: client.phone,
      notes: client.notes || ''
    })
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setIsEditMode(false)
    setEditingClient(null)
    form.reset()
  }

  const onSubmit = async (data: ClientFormData) => {
    if (!user) return

    setIsSubmitting(true)

    try {
      if (isEditMode && editingClient) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update({
            name: data.name,
            phone: data.phone,
            notes: data.notes || null
          })
          .eq('id', editingClient.id)

        if (error) {
          console.error('Error updating client:', error)
          toast.error('Müşteri güncellenirken bir hata oluştu. Lütfen tekrar deneyin.')
        } else {
          console.log('Client updated successfully')
          await fetchClients(user.id)
          closeDialog()
        }
      } else {
        // Create new client
        const { error } = await supabase
          .from('clients')
          .insert({
            name: data.name,
            phone: data.phone,
            notes: data.notes || null,
            profile_id: user.id
          })

        if (error) {
          console.error('Error creating client:', error)
          toast.error('Müşteri oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.')
        } else {
          console.log('Client created successfully')
          await fetchClients(user.id)
          closeDialog()
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (clientId: string) => {
    if (!confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (error) {
        console.error('Error deleting client:', error)
        toast.error('Müşteri silinirken bir hata oluştu. Lütfen tekrar deneyin.')
      } else {
        console.log('Client deleted successfully')
        await fetchClients(user!.id)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.')
    }
  }

  // Helper function to truncate notes for table display
  const truncateNotes = (notes: string | null, maxLength: number = 50) => {
    if (!notes) return '-'
    return notes.length > maxLength ? `${notes.substring(0, maxLength)}...` : notes
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

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Müşteri Yönetimi (CRM)
          </h1>
          <p className="text-slate-400">
            Müşteri bilgilerinizi yönetin ve takip edin
          </p>
        </div>

        {/* Actions */}
        <div className="mb-6 flex justify-between items-center">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="bg-slate-50 text-slate-950 hover:bg-slate-200">
                + Yeni Müşteri Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? 'Müşteriyi Düzenle' : 'Yeni Müşteri Ekle'}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Ad Soyad</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ahmet Yılmaz"
                            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Telefon Numarası</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="+90 555 123 45 67"
                            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Özel Notlar</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Müşteri tercihleri, özel istekler..."
                            rows={3}
                            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={closeDialog}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      İptal
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-slate-50 text-slate-950 hover:bg-slate-200"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-950 mr-2"></div>
                          {isEditMode ? 'Güncelleniyor...' : 'Oluşturuluyor...'}
                        </>
                      ) : (
                        isEditMode ? 'Güncelle' : 'Oluştur'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Clients Table */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">
              Müşterileriniz ({clients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-slate-400 text-6xl mb-4">👥</div>
                <p className="text-slate-400 text-lg mb-2">
                  Henüz hiç müşteri eklemediniz.
                </p>
                <p className="text-slate-500">
                  Yukarıdaki &quot;Yeni Müşteri Ekle&quot; butonunu kullanarak ilk müşterinizi ekleyin.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-slate-800/50">
                    <TableHead className="text-slate-300">Ad Soyad</TableHead>
                    <TableHead className="text-slate-300">Telefon Numarası</TableHead>
                    <TableHead className="text-slate-300">Özel Notlar</TableHead>
                    <TableHead className="text-slate-300">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="font-medium text-white">
                        {client.name}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {client.phone}
                      </TableCell>
                      <TableCell className="text-slate-300 max-w-xs">
                        <div className="truncate" title={client.notes || ''}>
                          {truncateNotes(client.notes)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(client)}
                            className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                          >
                            Düzenle
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(client.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            Sil
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-8 flex justify-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            ← Dashboard&#39;a Dön
          </Button>
        </div>
      </div>
    </div>
  )
}
