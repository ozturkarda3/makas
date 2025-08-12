'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabaseClient'

interface ProfileData {
  full_name: string
  business_name: string
  username: string
}

export default function WelcomePage() {
  const router = useRouter()
  const supabase = createClient()

  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    business_name: '',
    username: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const checkSessionAndFetchProfile = async () => {
      try {
        // Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          router.push('/login')
          return
        }

        if (!session) {
          router.push('/login')
          return
        }

        // Fetch user profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, business_name, username')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('Profile fetch error:', profileError)
          setError('Profil bilgileri yüklenirken bir hata oluştu.')
        } else if (profile) {
          setProfileData({
            full_name: profile.full_name || '',
            business_name: profile.business_name || '',
            username: profile.username || ''
          })
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        setError('Beklenmeyen bir hata oluştu.')
      } finally {
        setIsFetching(false)
      }
    }

    checkSessionAndFetchProfile()
  }, [router, supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          business_name: profileData.business_name,
          username: profileData.username
        })
        .eq('id', session.user.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      setSuccess(true)
      
      // Redirect to next onboarding step (add photo) after a short delay
      setTimeout(() => {
        router.push('/add-photo')
      }, 1500)

    } catch (error) {
      console.error('Profile update error:', error)
      setError(error instanceof Error ? error.message : 'Profil güncellenirken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (isFetching) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-50 mx-auto mb-4"></div>
          <p className="text-slate-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-green-400 text-6xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-white mb-2">Profil Güncellendi!</h1>
          <p className="text-slate-400">Son adıma yönlendiriliyorsunuz...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Makas&apos;a Hoş Geldiniz!
          </h1>
          <p className="text-slate-300 text-lg">
            Başlamadan önce bilgilerinizi kontrol edelim ve son bir adımda profilinizi tamamlayalım.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-white">
              Ad Soyad
            </Label>
            <Input
              id="full_name"
              type="text"
              value={profileData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              required
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
              placeholder="Adınız ve soyadınız"
            />
          </div>

          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="business_name" className="text-white">
              İşletme Adı
            </Label>
            <Input
              id="business_name"
              type="text"
              value={profileData.business_name}
              onChange={(e) => handleInputChange('business_name', e.target.value)}
              required
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
              placeholder="İşletmenizin adı"
            />
          </div>

          {/* Profile URL */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-white">
              Profil URL
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-slate-400 text-sm">makas.app/</span>
              </div>
              <Input
                id="username"
                type="text"
                value={profileData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 pl-24"
                placeholder="kullanici-adi"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800 rounded-md p-3">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-50 text-slate-950 hover:bg-slate-200 font-bold text-lg py-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Kaydediliyor...' : 'Kaydet ve Devam Et'}
          </Button>

          {/* Skip Button */}
          <div className="text-center">
            <Link href="/add-photo">
              <Button variant="ghost" className="text-slate-400 hover:text-white">
                Şimdilik Atla, Son Adıma Git
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

