'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabaseClient'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  
  // Form state
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Check if user has a valid session (they should be logged in after clicking email link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı.')
      }
    }
    
    checkSession()
  }, [supabase.auth])

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.')
      return
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        throw new Error(updateError.message)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (error) {
      console.error('Password update error:', error)
      setError(error instanceof Error ? error.message : 'Şifre güncellenirken bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="text-green-400 text-6xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Şifreniz Başarıyla Güncellendi!
          </h1>
          <p className="text-slate-300 mb-6">
            Kontrol panelinize yönlendiriliyorsunuz...
          </p>
          <Link href="/dashboard">
            <Button className="bg-slate-50 text-slate-950 hover:bg-slate-200">
              Panele Git
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Yeni Şifrenizi Belirleyin
          </h1>
          <p className="text-slate-300 text-lg">
            Güvenli bir şifre seçin ve hesabınıza erişim sağlayın.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handlePasswordReset} className="space-y-6">
          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">
              Yeni Şifre
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

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-white">
              Şifreyi Tekrarlayın
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
              placeholder="Şifrenizi tekrar girin"
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
            {isLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
          </Button>

          {/* Back to Login */}
          <div className="text-center">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-400 hover:text-white">
                Giriş sayfasına dön
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
