'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { User } from '@supabase/supabase-js'
import Image from 'next/image'

interface Profile {
  id: string
  business_name: string
  about_text: string | null
  address: string | null
  instagram_url: string | null
  full_name: string | null
  username: string | null
  cover_image_url?: string | null
  logo_url?: string | null
}

export default function EditProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [isUpdatingBanner, setIsUpdatingBanner] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [isUpdatingLogo, setIsUpdatingLogo] = useState(false)
  
  // Form state variables
  const [businessName, setBusinessName] = useState('')
  const [aboutText, setAboutText] = useState('')
  const [address, setAddress] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')

  useEffect(() => {
    const checkUserAndFetchProfile = async () => {
      try {
        // Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }

        setUser(session.user)

        // Fetch user's profile data
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
        } else {
          setProfile(profileData)
          // Populate form fields with current data
          setBusinessName(profileData.business_name || '')
          setAboutText(profileData.about_text || '')
          setAddress(profileData.address || '')
          setInstagramUrl(profileData.instagram_url || '')
        }
      } catch (error) {
        console.error('Error:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkUserAndFetchProfile()
  }, [router, supabase])

  const handleProfileUpdate = async () => {
    if (!user) return

    setIsSaving(true)
    setShowSuccess(false)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          business_name: businessName,
          about_text: aboutText,
          address: address,
          instagram_url: instagramUrl
        })
        .eq('id', user.id)

              if (error) {
          console.error('Error updating profile:', error)
          toast.error('Profil güncellenirken bir hata oluştu. Lütfen tekrar deneyin.')
        } else {
        setShowSuccess(true)
        // Update local profile state
        if (profile) {
          setProfile({
            ...profile,
            business_name: businessName,
            about_text: aboutText,
            address: address,
            instagram_url: instagramUrl
          })
        }
        
        // Hide success message after 3 seconds
        setTimeout(() => setShowSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Profil güncellenirken bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleBannerUpload = async () => {
    if (!user) return
    if (!bannerFile) {
      toast.error('Lütfen bir görsel seçin.')
      return
    }
    try {
      setIsUpdatingBanner(true)

      const file = bannerFile
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/banner/${Date.now()}.${fileExt}`

      // Upload to existing public bucket
      const { error: uploadError } = await supabase.storage
        .from('portfolio-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Banner upload error:', uploadError)
        toast.error('Banner yüklenemedi. Lütfen tekrar deneyin.')
        return
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('portfolio-photos')
        .getPublicUrl(filePath)
      const publicUrl = publicData?.publicUrl

      if (!publicUrl) {
        toast.error('Görsel URL alınamadı.')
        return
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cover_image_url: publicUrl })
        .eq('id', user.id)

      if (updateError) {
        console.error('Profile banner update error:', updateError)
        toast.error('Profil güncellenirken bir hata oluştu.')
        return
      }

      // Update local state
      if (profile) {
        setProfile({ ...profile, cover_image_url: publicUrl })
      }
      setBannerFile(null)
      toast.success('Banner başarıyla güncellendi!')
    } catch (error) {
      console.error('Banner update error:', error)
      toast.error('Beklenmeyen bir hata oluştu.')
    } finally {
      setIsUpdatingBanner(false)
    }
  }

  const handleLogoUpload = async () => {
    if (!user) return
    if (!logoFile) {
      toast.error('Lütfen bir logo seçin.')
      return
    }
    try {
      setIsUpdatingLogo(true)

      const file = logoFile
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/logo/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('portfolio-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Logo upload error:', uploadError)
        toast.error('Logo yüklenemedi. Lütfen tekrar deneyin.')
        return
      }

      const { data: publicData } = supabase.storage
        .from('portfolio-photos')
        .getPublicUrl(filePath)
      const publicUrl = publicData?.publicUrl

      if (!publicUrl) {
        toast.error('Logo URL alınamadı.')
        return
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ logo_url: publicUrl })
        .eq('id', user.id)

      if (updateError) {
        console.error('Profile logo update error:', updateError)
        toast.error('Profil güncellenirken bir hata oluştu.')
        return
      }

      if (profile) {
        setProfile({ ...profile, logo_url: publicUrl })
      }
      setLogoFile(null)
      toast.success('Logo başarıyla güncellendi!')
    } catch (error) {
      console.error('Logo update error:', error)
      toast.error('Beklenmeyen bir hata oluştu.')
    } finally {
      setIsUpdatingLogo(false)
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

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Profilimi Düzenle
          </h1>
          <p className="text-slate-400">
            İşletme bilgilerinizi güncelleyin ve markanızı geliştirin
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg">
            <p className="text-green-400 text-center font-medium">
              ✅ Profil başarıyla güncellendi!
            </p>
          </div>
        )}

        {/* Profile Form */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-xl">
              İşletme Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label className="text-slate-300">Logo</Label>
              {profile.logo_url ? (
                <div className="mb-3">
                  <Image
                    src={profile.logo_url}
                    alt="Mevcut logo"
                    width={96}
                    height={96}
                    className="h-24 w-24 object-cover rounded-full border border-slate-700"
                  />
                </div>
              ) : null}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
              />
              <div>
                <Button
                  onClick={handleLogoUpload}
                  disabled={isUpdatingLogo || !logoFile}
                  className="bg-slate-50 text-slate-950 hover:bg-slate-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingLogo ? 'Yükleniyor...' : 'Logoyu Güncelle'}
                </Button>
              </div>
            </div>
            {/* Banner Upload */}
            <div className="space-y-2">
              <Label className="text-slate-300">Kapak Fotoğrafı (Banner)</Label>
              {profile.cover_image_url ? (
                <div className="mb-3">
                  <Image
                    src={profile.cover_image_url}
                    alt="Mevcut kapak"
                    width={1200}
                    height={160}
                    className="w-full max-h-40 object-cover rounded border border-slate-700"
                  />
                </div>
              ) : null}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
              />
              <div>
                <Button
                  onClick={handleBannerUpload}
                  disabled={isUpdatingBanner || !bannerFile}
                  className="bg-slate-50 text-slate-950 hover:bg-slate-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingBanner ? 'Yükleniyor...' : 'Banner Fotoğrafını Güncelle'}
                </Button>
              </div>
            </div>

            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="business_name" className="text-slate-300">
                İşletme Adı *
              </Label>
              <Input
                id="business_name"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="İşletmenizin adını girin"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-600"
              />
            </div>

            {/* About Text */}
            <div className="space-y-2">
              <Label htmlFor="about_text" className="text-slate-300">
                Hakkında Yazısı
              </Label>
              <textarea
                id="about_text"
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                placeholder="İşletmeniz hakkında kısa bir açıklama yazın..."
                rows={4}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder:text-slate-500 focus:border-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-600 resize-none"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-slate-300">
                Adres
              </Label>
              <Input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="İşletmenizin adresini girin"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-600"
              />
            </div>

            {/* Instagram URL */}
            <div className="space-y-2">
              <Label htmlFor="instagram_url" className="text-slate-300">
                Instagram Linki
              </Label>
              <Input
                id="instagram_url"
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/kullaniciadi"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-600"
              />
              <p className="text-xs text-slate-500">
                Instagram profilinizin tam URL&#39;sini girin
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                ← Dashboard&#39;a Dön
              </Button>
              
              <Button
                onClick={handleProfileUpdate}
                disabled={isSaving}
                className="bg-slate-50 text-slate-950 hover:bg-slate-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-950 mr-2"></div>
                    Kaydediliyor...
                  </>
                ) : (
                  'Değişiklikleri Kaydet'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Profile Info */}
        <div className="mt-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">
                Mevcut Profil Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Ad Soyad:</span>
                  <span className="ml-2 text-white">{profile.full_name || 'Belirtilmemiş'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Kullanıcı Adı:</span>
                  <span className="ml-2 text-white">{profile.username || 'Belirtilmemiş'}</span>
                </div>
                <div>
                  <span className="text-slate-400">E-posta:</span>
                  <span className="ml-2 text-white">{user.email}</span>
                </div>
                <div>
                  <span className="text-slate-400">Profil ID:</span>
                  <span className="ml-2 text-white font-mono text-xs">{profile.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
