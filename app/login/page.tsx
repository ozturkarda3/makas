'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)
  const [recoveryMessage, setRecoveryMessage] = useState('')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      console.log('Attempting sign in...')
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        throw new Error(signInError.message)
      }

      if (data.session) {
        console.log('Sign in successful, checking onboarding status...')
        
        try {
          // Check if user has completed their profile setup
          console.log('Checking profile for user ID:', data.session.user.id)
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, business_name, username, cover_image_url')
            .eq('id', data.session.user.id)
            .single()
          
          console.log('Profile fetch result:', { profile, profileError })

          if (profileError) {
            console.log('Profile fetch error detected, will create profile')
            
            // Check if the error is because profile doesn't exist
            if (profileError.code === 'PGRST116') {
              console.log('Profile not found, creating basic profile...')
              
              // Create a basic profile for the user
              const { error: createProfileError } = await supabase
                .from('profiles')
                .insert({
                  id: data.session.user.id,
                  full_name: '',
                  business_name: '',
                  username: '',
                  email: data.session.user.email
                })
              
              if (createProfileError) {
                console.log('Failed to create profile, continuing anyway')
                // Continue to welcome page anyway
              } else {
                console.log('Basic profile created successfully')
              }
            }
            
            // Redirect to welcome page to complete profile setup
            console.log('Redirecting to welcome page to complete profile setup')
            await router.push('/welcome')
            return
          }

          // Check onboarding completion
          const hasBasicInfo = profile.full_name && profile.business_name && profile.username
          const hasCoverPhoto = profile.cover_image_url

          if (!hasBasicInfo) {
            // User needs to complete basic profile info
            console.log('Redirecting to welcome page for basic info...')
            await router.push('/welcome')
          } else if (!hasCoverPhoto) {
            // User needs to add cover photo
            console.log('Redirecting to add-photo page for cover photo...')
            await router.push('/add-photo')
          } else {
            // User has completed onboarding, go to dashboard
            console.log('Onboarding complete, redirecting to dashboard...')
            await router.push('/dashboard')
          }
          
          console.log('Router.push completed')
        } catch (error) {
          console.error('Router error:', error)
          // Fallback to window.location - go to welcome page as default
          console.log('Using window.location fallback to welcome page')
          window.location.href = '/welcome'
        }
      } else {
        throw new Error('Giriş başarısız')
      }

    } catch (error) {
      console.error('Sign in error:', error)
      setError('Giriş yapılırken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordRecovery = async () => {
    if (!email) {
      setError('Şifre sıfırlama e-postası göndermek için e-posta adresinizi girin.')
      return
    }

    setIsLoading(true)
    setError('')
    setRecoveryMessage('')

    try {
      const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (recoveryError) {
        throw new Error('Şifre sıfırlama hatası oluştu')
      }

      setRecoveryMessage('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.')
      setIsRecoveryMode(true)
    } catch (error) {
      console.error('Password recovery error:', error)
      setError(error instanceof Error ? error.message : 'Şifre sıfırlama e-postası gönderilemedi')
    } finally {
      setIsLoading(false)
    }
  }

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

      {/* Right Panel - Login Form */}
      <div className="bg-slate-950 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Panelinize Giriş Yapın
          </h2>
          <p className="text-slate-400 text-center mb-8">
            Hesabınıza giriş yaparak devam edin.
          </p>

          <form onSubmit={handleSignIn} className="space-y-6">
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
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
                placeholder="Şifreniz"
              />
              <div className="text-right">
                <button
                  type="button"
                  onClick={handlePasswordRecovery}
                  className="text-sm text-slate-400 hover:text-white underline"
                >
                  Şifremi unuttum
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800 rounded-md p-3">
                {error}
              </div>
            )}

            {/* Recovery Message */}
            {recoveryMessage && (
              <div className="text-green-400 text-sm text-center bg-green-900/20 border border-green-800 rounded-md p-3">
                {recoveryMessage}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-50 text-slate-950 hover:bg-slate-200 font-bold text-lg py-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </Button>

            {/* Signup Link */}
            <p className="text-center text-slate-400">
              Hesabınız yok mu?{' '}
              <Link href="/signup" className="text-slate-200 hover:text-white underline">
                Hemen kayıt olun
              </Link>
            </p>

            {/* Back to Login Button (when in recovery mode) */}
            {isRecoveryMode && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsRecoveryMode(false)
                    setRecoveryMessage('')
                    setError('')
                  }}
                  className="text-slate-400 hover:text-white underline"
                >
                  Giriş formuna geri dön
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}