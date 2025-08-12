'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

interface Album {
  id: string
  name: string
  created_at: string
  profile_id: string
}

export default function PortfolioPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [albums, setAlbums] = useState<Album[]>([])
  const [newAlbumName, setNewAlbumName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  const fetchAlbums = useCallback(async (userId: string) => {
    try {
      const { data: albumsData, error } = await supabase
        .from('portfolio_albums')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching albums:', error)
      } else {
        setAlbums(albumsData || [])
      }
    } catch (error) {
      console.error('Error fetching albums:', error)
    }
  }, [supabase])

  useEffect(() => {
    const checkUserAndFetchAlbums = async () => {
      try {
        // Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }

        setUser(session.user)

        // Fetch user's albums
        await fetchAlbums(session.user.id)
      } catch (error) {
        console.error('Error:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkUserAndFetchAlbums()
  }, [router, supabase, fetchAlbums])

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !newAlbumName.trim()) return

    setIsCreating(true)

    try {
      const { data: newAlbum, error } = await supabase
        .from('portfolio_albums')
        .insert({
          name: newAlbumName.trim(),
          profile_id: user.id
        })
        .select()
        .single()

              if (error) {
          console.error('Error creating album:', error)
          toast.error('Albüm oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.')
        } else {
        // Add new album to the beginning of the list
        setAlbums(prevAlbums => [newAlbum, ...prevAlbums])
        
        // Clear input field
        setNewAlbumName('')
        
        console.log('Album created successfully:', newAlbum)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Albüm oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsCreating(false)
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Portfolyo Yönetimi
          </h1>
          <p className="text-slate-400">
            Albümlerinizi oluşturun ve portfolyo fotoğraflarınızı organize edin
          </p>
        </div>

        {/* Create New Album Form */}
        <Card className="bg-slate-900 border-slate-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white text-xl">
              Yeni Albüm Oluştur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAlbum} className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  placeholder="Albüm adını girin..."
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-600"
                  disabled={isCreating}
                />
              </div>
              <Button
                type="submit"
                disabled={isCreating || !newAlbumName.trim()}
                className="bg-slate-50 text-slate-950 hover:bg-slate-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-950 mr-2"></div>
                    Oluşturuluyor...
                  </>
                ) : (
                  'Yeni Albüm Oluştur'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Albums Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Albümleriniz ({albums.length})
          </h2>
          
          {albums.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="text-center py-12">
                <div className="text-slate-400 text-6xl mb-4">📁</div>
                <p className="text-slate-400 text-lg mb-2">
                  Henüz hiç albüm oluşturmadınız.
                </p>
                <p className="text-slate-500">
                  Yukarıdaki formu kullanarak ilk albümünüzü oluşturun.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {albums.map((album) => (
                <Link 
                  key={album.id} 
                  href={`/dashboard/portfolio/${album.id}`}
                  className="block group"
                >
                  <Card className="bg-slate-900 border-slate-800 hover:border-slate-600 transition-colors cursor-pointer group-hover:bg-slate-800/50">
                    <CardContent className="p-6">
                      {/* Album Cover Placeholder */}
                      <div className="w-full h-32 bg-slate-800 rounded-lg mb-4 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                        <span className="text-slate-400 text-4xl group-hover:text-slate-300">
                          📷
                        </span>
                      </div>
                      
                      {/* Album Info */}
                      <div className="text-center">
                        <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-slate-200 transition-colors">
                          {album.name}
                        </h3>
                        <p className="text-slate-400 text-sm">
                          Fotoğraf sayısı: <span className="text-slate-300">0</span>
                        </p>
                        <p className="text-slate-500 text-xs mt-1">
                          {new Date(album.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-center">
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
