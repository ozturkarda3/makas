'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import * as z from 'zod'
import type { User } from '@supabase/supabase-js'

interface Service {
  id: string
  name: string
  price: number
  duration: number
  profile_id: string
  created_at: string
}

interface ServiceFormData {
  name: string
  price: string
  duration: string
}

// Form validation schema
const serviceSchema = z.object({
  name: z.string().min(1, 'Hizmet adı gereklidir'),
  price: z.string().min(1, 'Fiyat gereklidir').regex(/^\d+(\.\d{1,2})?$/, 'Geçerli bir fiyat girin'),
  duration: z.string().min(1, 'Süre gereklidir').regex(/^\d+$/, 'Geçerli bir süre girin (dakika)')
})

export default function ServicesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Form setup
  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      price: '',
      duration: ''
    }
  })

  useEffect(() => {
    const checkUserAndFetchServices = async () => {
      try {
        // Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }

        setUser(session.user)
        await fetchServices(session.user.id)
      } catch (error) {
        console.error('Error:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkUserAndFetchServices()
  }, [router, supabase])

  const fetchServices = async (userId: string) => {
    try {
      const { data: servicesData, error } = await supabase
        .from('services')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching services:', error)
      } else {
        setServices(servicesData || [])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const openCreateDialog = () => {
    setIsEditMode(false)
    setEditingService(null)
    form.reset()
    setIsDialogOpen(true)
  }

  const openEditDialog = (service: Service) => {
    setIsEditMode(true)
    setEditingService(service)
    form.reset({
      name: service.name,
      price: service.price.toString(),
      duration: service.duration.toString()
    })
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setIsEditMode(false)
    setEditingService(null)
    form.reset()
  }

  const onSubmit = async (data: ServiceFormData) => {
    if (!user) return

    setIsSubmitting(true)

    try {
      if (isEditMode && editingService) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update({
            name: data.name,
            price: parseFloat(data.price),
            duration: parseInt(data.duration)
          })
          .eq('id', editingService.id)

        if (error) {
          console.error('Error updating service:', error)
          toast.error('Hizmet güncellenirken bir hata oluştu. Lütfen tekrar deneyin.')
        } else {
          console.log('Service updated successfully')
          await fetchServices(user.id)
          closeDialog()
        }
      } else {
        // Create new service
        const { error } = await supabase
          .from('services')
          .insert({
            name: data.name,
            price: parseFloat(data.price),
            duration: parseInt(data.duration),
            profile_id: user.id
          })

        if (error) {
          console.error('Error creating service:', error)
          toast.error('Hizmet oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.')
        } else {
          console.log('Service created successfully')
          await fetchServices(user.id)
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

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Bu hizmeti silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)

      if (error) {
        console.error('Error deleting service:', error)
        toast.error('Hizmet silinirken bir hata oluştu. Lütfen tekrar deneyin.')
      } else {
        console.log('Service deleted successfully')
        await fetchServices(user!.id)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.')
    }
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
            Hizmet ve Fiyat Yönetimi
          </h1>
          <p className="text-slate-400">
            Sunduğunuz hizmetleri ve fiyatları düzenleyin
          </p>
        </div>

        {/* Actions */}
        <div className="mb-6 flex justify-between items-center">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="bg-slate-50 text-slate-950 hover:bg-slate-200">
                + Yeni Hizmet Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? 'Hizmeti Düzenle' : 'Yeni Hizmet Ekle'}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Hizmet Adı</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Saç Kesimi, Sakal Tıraşı..."
                            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Fiyat (₺)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="50.00"
                            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Süre (Dakika)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="30"
                            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
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

        {/* Services Table */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">
              Hizmetleriniz ({services.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-slate-400 text-6xl mb-4">💇‍♂️</div>
                <p className="text-slate-400 text-lg mb-2">
                  Henüz hiç hizmet eklemediniz.
                </p>
                <p className="text-slate-500">
                  Yukarıdaki "Yeni Hizmet Ekle" butonunu kullanarak ilk hizmetinizi ekleyin.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-slate-800/50">
                    <TableHead className="text-slate-300">Hizmet Adı</TableHead>
                    <TableHead className="text-slate-300">Fiyat</TableHead>
                    <TableHead className="text-slate-300">Süre</TableHead>
                    <TableHead className="text-slate-300">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="font-medium text-white">
                        {service.name}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        ₺{service.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {service.duration} dakika
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(service)}
                            className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                          >
                            Düzenle
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(service.id)}
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
            ← Dashboard'a Dön
          </Button>
        </div>
      </div>
    </div>
  )
}
