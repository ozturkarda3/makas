'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Album {
  id: string
  name: string
  created_at: string
  profile_id: string
  profiles: {
    business_name: string
    username: string
  }
}

interface Photo {
  id: string
  image_url: string
  title: string
  description: string | null
  created_at: string
  album_id: string
}

interface PublicAlbumPageProps {
  params: Promise<{ albumId: string }>
}

export default function PublicAlbumPage({ params }: PublicAlbumPageProps) {
  const supabase = createClient()
  const [album, setAlbum] = useState<Album | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [albumId, setAlbumId] = useState<string>('')

  useEffect(() => {
    const fetchAlbumData = async () => {
      try {
        // Get albumId from params
        const { albumId: id } = await params
        setAlbumId(id)

        // Fetch album details with profile info
        const { data: albumData, error: albumError } = await supabase
          .from('portfolio_albums')
          .select(`
            *,
            profiles:profiles(business_name, username)
          `)
          .eq('id', id)
          .single()

        if (albumError) {
          console.error('Error fetching album:', albumError)
          // Handle album not found
          return
        }

        setAlbum(albumData)

        // Fetch album photos
        const { data: photosData, error: photosError } = await supabase
          .from('portfolio_photos')
          .select('*')
          .eq('album_id', id)
          .order('created_at', { ascending: false })

        if (photosError) {
          console.error('Error fetching photos:', photosError)
        } else {
          setPhotos(photosData || [])
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAlbumData()
  }, [params, supabase])

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

  if (!album) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-400 text-6xl mb-4">❌</div>
          <p className="text-slate-400 text-lg mb-2">
            Albüm bulunamadı
          </p>
          <p className="text-slate-500">
            Aradığınız albüm mevcut değil veya kaldırılmış olabilir.
          </p>
          <Link href="/" className="inline-block mt-4">
            <Button variant="ghost" className="text-slate-400 hover:text-slate-200">
              Ana Sayfaya Dön
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            {album.name}
          </h1>
          <p className="text-slate-400 text-lg">
            {album.profiles?.business_name || album.profiles?.username || 'Bilinmeyen İşletme'}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            {new Date(album.created_at).toLocaleDateString('tr-TR')} tarihinde oluşturuldu
          </p>
        </div>

        {/* Photos Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
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
                  Daha sonra tekrar kontrol edin.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {photos.map((photo) => (
                <Card key={photo.id} className="bg-slate-900 border-slate-800 overflow-hidden hover:border-slate-600 transition-colors">
                  <CardContent className="p-0">
                    <div className="relative aspect-square">
                      <Image
                        src={photo.image_url}
                        alt={photo.title || 'Portfolyo fotoğrafı'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="text-white font-medium text-sm mb-1 truncate">
                        {photo.title || 'Başlıksız'}
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
          <Link href="/">
            <Button variant="ghost" className="text-slate-400 hover:text-slate-200 hover:bg-slate-800">
              ← Ana Sayfaya Dön
            </Button>
          </Link>
          <Link href={`/${album.profiles?.username || 'profile'}`}>
            <Button variant="ghost" className="text-slate-400 hover:text-slate-200 hover:bg-slate-800">
              İşletme Profilini Görüntüle
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
