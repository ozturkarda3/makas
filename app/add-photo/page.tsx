'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabaseClient'
import Image from 'next/image'

export default function AddPhotoPage() {
  const router = useRouter()
  const supabase = createClient()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setIsAuthenticated(true)
    }

    checkAuth()
  }, [router, supabase.auth])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Lütfen geçerli bir resim dosyası seçin.')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Dosya boyutu 5MB\'dan küçük olmalıdır.')
        return
      }

      setSelectedFile(file)
      setError('')

      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleUploadAndFinish = async () => {
    if (!selectedFile) {
      setError('Lütfen bir fotoğraf seçin.')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        throw new Error('Kullanıcı oturumu bulunamadı.')
      }

      const userId = session.user.id
      
      // Dynamically find the default album for this user
      console.log('Looking for default album for user:', userId)
      
      const { data: initialAlbum, error: albumError } = await supabase
        .from('portfolio_albums')
        .select('id, name')
        .eq('profile_id', userId)
        .eq('name', 'Genel Çalışmalar')
        .single()
      
      let album = initialAlbum
      console.log('Initial album search result:', { album, albumError })

      // Handle album error with simple approach
      if (albumError) {
        console.log('Album not found, will create one...')
        
        // Create default album
        const { data: newAlbum, error: createError } = await supabase
          .from('portfolio_albums')
          .insert({
            name: 'Genel Çalışmalar',
            profile_id: userId
          })
          .select()
          .single()
        
        if (createError) {
          console.error('Failed to create album:', createError)
          throw new Error('Varsayılan albüm oluşturulamadı')
        }
        
        album = newAlbum
        console.log('Default album created successfully:', album)
      }

      if (!album) {
        throw new Error('Albüm bilgisi alınamadı.')
      }

      const albumId = album.id
      if (!albumId) {
        throw new Error('Albüm ID bilgisi alınamadı.')
      }

      console.log('Using album:', { albumId, albumName: album.name })
      
      const fileName = `${userId}/${albumId}/${Date.now()}_${selectedFile.name}`
      
      console.log('File path:', fileName)
      console.log('DEBUG: About to upload to bucket: portfolio-photos')

      // Upload file to Supabase Storage
      console.log('DEBUG: Starting file upload...')
      console.log('DEBUG: File details:', {
        fileName,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        bucket: 'portfolio-photos'
      })
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('portfolio-photos')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.log('DEBUG: Upload error detected, using static message')
        console.log('DEBUG: Upload error object:', uploadError)
        setError('Dosya yükleme hatası oluştu')
        setIsUploading(false)
        return
      }
      
      console.log('DEBUG: Upload successful:', uploadData)

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('portfolio-photos')
        .getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl
      console.log('DEBUG: Got public URL:', publicUrl)

      // Insert photo record into portfolio_photos table
      try {
        const { error: photoInsertError } = await supabase
          .from('portfolio_photos')
          .insert({
            profile_id: userId,
            album_id: albumId,
            image_url: publicUrl,
            file_path: fileName,
            title: selectedFile.name.split('.')[0], // Use filename without extension as title
            description: 'Portfolyo fotoğrafı'
          })

        if (photoInsertError) {
          console.log('Failed to insert photo record, continuing anyway')
          // Continue with profile update even if photo record insertion fails
        } else {
          console.log('Photo record inserted successfully')
        }
      } catch (photoError) {
        console.error('Portfolio photos table error:', photoError)
        // Continue with profile update even if photo record insertion fails
      }

      // Update profiles table with the cover image URL
      console.log('DEBUG: Updating profile with cover image URL:', publicUrl)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_image_url: publicUrl })
        .eq('id', userId)

      if (updateError) {
        console.log('DEBUG: Profile update error detected, using static message')
        console.log('DEBUG: Profile update error details:', updateError)
        setError('Profil güncelleme hatası oluştu')
        setIsUploading(false)
        return
      }
      
      console.log('DEBUG: Profile updated successfully')

      // Success! Redirect to dashboard
      router.push('/dashboard')

    } catch (error) {
      console.error('Upload error:', error)
      setError('Fotoğraf yüklenirken bir hata oluştu.')
    } finally {
      setIsUploading(false)
    }
  }

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-50 mx-auto mb-4"></div>
          <p className="text-slate-400">Doğrulanıyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Son Bir Adım: Bir Vitrin Fotoğrafı Yükleyin
          </h1>
          <p className="text-slate-300 text-lg">
            Bu fotoğraf, profil sayfanızda müşterilerinizi karşılayacak.
          </p>
        </div>

        <div className="bg-slate-900 rounded-lg p-8 border border-slate-800">
          {/* Image Preview Area */}
          <div className="mb-8">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium text-white mb-2">Fotoğraf Önizlemesi</h3>
            </div>
            
            <div className="flex justify-center">
              {previewUrl ? (
                <div className="relative">
                  <Image
                    src={previewUrl}
                    alt="Seçilen fotoğraf"
                    width={800}
                    height={256}
                    className="max-w-full h-64 object-cover rounded-lg border-2 border-slate-700"
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null)
                      setPreviewUrl(null)
                      URL.revokeObjectURL(previewUrl)
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-full h-64 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center bg-slate-800">
                  <div className="text-center">
                    <div className="text-slate-400 text-6xl mb-2">📷</div>
                    <p className="text-slate-400">Henüz fotoğraf seçilmedi</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* File Input */}
          <div className="mb-8">
            <div className="text-center">
              <label htmlFor="photo-upload" className="cursor-pointer">
                <div className="inline-flex items-center justify-center px-6 py-3 border border-slate-600 rounded-md text-slate-300 hover:text-white hover:border-slate-500 transition-colors bg-slate-800 hover:bg-slate-700">
                  <span className="mr-2">📁</span>
                  Fotoğraf Seç
                </div>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              <p className="text-slate-400 text-sm mt-2">
                PNG, JPG veya JPEG. Maksimum 5MB.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800 rounded-md p-3 mb-6">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleUploadAndFinish}
              disabled={!selectedFile || isUploading}
              className="flex-1 bg-slate-50 text-slate-950 hover:bg-slate-200 font-bold text-lg py-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Yükleniyor...' : 'Tamamla ve Panele Git'}
            </Button>
            
            <Link href="/dashboard" className="flex-1">
              <Button variant="ghost" className="w-full text-slate-400 hover:text-white border border-slate-600 hover:border-slate-500">
                Daha Sonra Yükle
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
