'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Image from 'next/image'
import type { User } from '@supabase/supabase-js'

interface Album {
  id: string
  name: string
  created_at: string
  profile_id: string
}

interface Photo {
  id: string
  image_url: string
  caption: string
  created_at: string
  album_id: string
}

interface AlbumDetailPageProps {
  params: Promise<{ albumId: string }>
}

export default function AlbumDetailPage({ params }: AlbumDetailPageProps) {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [album, setAlbum] = useState<Album | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [albumId, setAlbumId] = useState<string>('')

  const fetchAlbumDetails = useCallback(async (id: string, userId: string) => {
    try {
      const { data: albumData, error } = await supabase
        .from('portfolio_albums')
        .select('*')
        .eq('id', id)
        .eq('profile_id', userId)
        .single()

      if (error) {
        console.error('Error fetching album:', error)
        if (error.code === 'PGRST116') {
          router.push('/dashboard/portfolio')
        }
      } else {
        setAlbum(albumData)
      }
    } catch (error) {
      console.error('Error fetching album:', error)
    }
  }, [router, supabase])

  const fetchAlbumPhotos = useCallback(async (id: string) => {
    try {
      const { data: photosData, error } = await supabase
        .from('portfolio_photos')
        .select('*')
        .eq('album_id', id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching photos:', error)
      } else {
        setPhotos(photosData || [])
      }
    } catch (error) {
      console.error('Error fetching photos:', error)
    }
  }, [supabase])

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      try {
        // Get albumId from params
        const { albumId: id } = await params
        setAlbumId(id)

        // Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }

        setUser(session.user)

        // Fetch album details and photos
        await Promise.all([
          fetchAlbumDetails(id, session.user.id),
          fetchAlbumPhotos(id)
        ])
      } catch (error) {
        console.error('Error:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkUserAndFetchData()
  }, [params, router, supabase, fetchAlbumDetails, fetchAlbumPhotos])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Lütfen sadece resim dosyası seçin.')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Dosya boyutu 5MB\'dan küçük olmalıdır.')
        return
      }
      
      setSelectedFile(file)
    }
  }

  const handlePhotoUpload = async () => {
    if (!user || !selectedFile || !albumId) return

    setIsUploading(true)

    try {
      const userId = user.id
      const fileName = `${userId}/${albumId}/${Date.now()}_${selectedFile.name}`
      
      console.log('Uploading file:', fileName)

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('portfolio-photos')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        toast.error('Dosya yükleme hatası oluştu. Lütfen tekrar deneyin.')
        return
      }

      console.log('Upload successful:', uploadData)

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('portfolio-photos')
        .getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl
      console.log('Public URL:', publicUrl)

      // Insert photo record into portfolio_photos table
      const { data: newPhoto, error: insertError } = await supabase
        .from('portfolio_photos')
        .insert({
          album_id: albumId,
          image_url: publicUrl,
          caption: selectedFile.name.split('.')[0] // Use filename without extension as caption
        })
        .select()
        .single()

      if (insertError) {
        console.error('Photo insert error:', insertError)
        toast.error('Fotoğraf kaydı oluşturulamadı. Lütfen tekrar deneyin.')
        return
      }

      console.log('Photo record created:', newPhoto)

      // Add new photo to the beginning of the list
      setPhotos(prevPhotos => [newPhoto, ...prevPhotos])
      
      // Clear selected file
      setSelectedFile(null)
      
      // Reset file input
      const fileInput = document.getElementById('photo-upload') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }

      console.log('Photo upload completed successfully')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Fotoğraf yüklenirken bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsUploading(false)
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

  if (!user || !album) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Albüm: {album.name}
          </h1>
          <p className="text-slate-400">
            Bu albüme fotoğraf yükleyin ve mevcut fotoğrafları görüntüleyin
          </p>
        </div>

        {/* Photo Upload Form */}
        <Card className="bg-slate-900 border-slate-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white text-xl">
              Yeni Fotoğraf Yükle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-slate-300 hover:file:bg-slate-600 file:cursor-pointer"
                  disabled={isUploading}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Desteklenen formatlar: JPG, PNG, GIF. Maksimum boyut: 5MB
                </p>
              </div>
              <Button
                onClick={handlePhotoUpload}
                disabled={isUploading || !selectedFile}
                className="bg-slate-50 text-slate-950 hover:bg-slate-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-950 mr-2"></div>
                    Yükleniyor...
                  </>
                ) : (
                  'Yeni Fotoğraf Yükle'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Photos Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Fotoğraflar ({photos.length})
          </h2>
          
          {photos.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="text-center py-12">
                <div className="text-slate-400 text-6xl mb-4">📷</div>
                <p className="text-slate-400 text-lg mb-2">
                  Bu albümde henüz fotoğraf yok.
                </p>
                <p className="text-slate-500">
                  Yukarıdan ilk fotoğrafınızı yükleyin.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {photos.map((photo) => (
                <Card key={photo.id} className="bg-slate-900 border-slate-800 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative aspect-square">
                      <Image
                        src={photo.image_url}
                        alt={photo.caption || 'Portfolyo fotoğrafı'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-medium text-sm mb-1 truncate">
                        {photo.caption || 'Başlıksız'}
                      </h3>
                      <p className="text-slate-400 text-xs">
                        {new Date(photo.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/portfolio')}
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            ← Portfolyo Yönetimi
          </Button>
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
