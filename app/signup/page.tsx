'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// DİKKAT: Import satırı değişti!
import { createClient } from '@/lib/supabaseClient'

export default function SignupPage() {
  const router = useRouter()
  
  // Form state
  const [fullName, setFullName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // DİKKAT: Supabase client'ı burada fonksiyon çağrılarak oluşturuluyor.
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Step 1: Create user account with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            business_name: businessName,
            username: username,
          }
        }
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (authData.user) {
        console.log('User created:', authData.user)
        console.log('Session exists:', !!authData.session)
        
        // Insert profile record into profiles table and get the created profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            business_name: businessName,
            username: username,
            full_name: fullName,
          })
          

        if (profileError) {
          throw new Error(profileError.message)
        }

        console.log('Profile created successfully')

        // Create default portfolio album for the new user
        try {
          const { error: albumError } = await supabase
            .from('portfolio_albums')
            .insert({
              name: 'Genel Çalışmalar',
              profile_id: authData.user.id
            })

          if (albumError) {
            console.error('Failed to create default album:', albumError)
            // Don't block the user flow if album creation fails
          } else {
            console.log('Default portfolio album created successfully')
          }
        } catch (albumError) {
          console.error('Error creating default album:', albumError)
          // Continue with the flow even if album creation fails
        }

        // Check if user is already signed in (no email confirmation required)
        if (authData.session) {
          // Success! Redirect to welcome/onboarding page first
          console.log('User signed in, redirecting to welcome page...')
          try {
            await router.push('/welcome')
            console.log('Router.push to welcome completed')
          } catch (error) {
            console.error('Router error:', error)
            // Fallback to window.location
            console.log('Using window.location fallback')
            window.location.href = '/welcome'
          }
        } else {
          // Email confirmation required - but let's try to sign in anyway
          console.log('Email confirmation required, attempting sign in...')
          
          // Try to sign in with the credentials
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          })
          
          if (signInError) {
            console.log('Sign in error:', signInError)
            setError('Hesabınız başarıyla oluşturuldu! Lütfen e-posta adresinizi onaylayın.')
          } else if (signInData.session) {
            console.log('Sign in successful, redirecting to welcome page...')
            try {
              await router.push('/welcome')
            } catch (error) {
              console.error('Router error:', error)
              window.location.href = '/welcome'
            }
          }
        }
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  // ... (Geri kalan JSX kodu (formun görseli) tamamen aynı kalacak)
  // Sadece yukarıdaki JavaScript mantığını değiştiriyoruz.
  return (
    <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2">
      
      {/* Left Panel - Branding */}
      <div className="hidden md:flex flex-col items-center justify-center bg-slate-900 text-center p-8">
        <Link href="/">
          <h1 className="text-4xl font-bold text-white mb-4">
            Makas
          </h1>
        </Link>
        <p className="text-slate-300 max-w-sm">
          Zanaatınızı Markanızla Taçlandırın. Randevu kaosuna son verin, sanatınıza odaklanın.
        </p>
      </div>

      {/* Right Panel - Sign-up Form */}
      <div className="bg-slate-950 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Makas&apos;a Hoş Geldiniz
          </h2>
          <p className="text-slate-400 text-center mb-8">
            Hesabınızı oluşturarak ilk adımı atın.
          </p>

          <form onSubmit={handleSignUp} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-white">
                Ad Soyad
              </Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                placeholder="Adınız ve soyadınız"
              />
            </div>

            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="businessName" className="text-white">
                İşletme Adı
              </Label>
              <Input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
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
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-700 bg-slate-800 text-slate-300 text-sm">
                  makas.app/
                </span>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  required
                  className="rounded-l-none bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                  placeholder="kullanici-adi"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                E-posta Adresi
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                placeholder="ornek@email.com"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Şifre
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                placeholder="En az 6 karakter"
              />
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
              {isLoading ? 'Hesap Oluşturuluyor...' : 'Hesap Oluştur ve Başla'}
            </Button>

            {/* Login Link */}
            <p className="text-center text-slate-400">
              Zaten hesabınız var mı?{' '}
              <Link href="/login" className="text-slate-200 hover:text-white underline">
                Giriş yapın
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}