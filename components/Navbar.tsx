'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth check error:', error)
          setIsAuthenticated(false)
        } else {
          console.log('Session check result:', { hasSession: !!session, userId: session?.user?.id })
          setIsAuthenticated(!!session)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, { hasSession: !!session, userId: session?.user?.id })
      setIsAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      setIsAuthenticated(false)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleForceClearSession = async () => {
    try {
      const supabase = createClient()
      // Force clear all auth data
      await supabase.auth.signOut()
      
      // Clear local storage manually
      if (typeof window !== 'undefined') {
        // Clear all Supabase related items
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('sb-')) {
            localStorage.removeItem(key)
          }
        })
        
        // Clear session storage
        sessionStorage.clear()
      }
      
      setIsAuthenticated(false)
      router.push('/')
    } catch (error) {
      console.error('Force session clear error:', error)
    }
  }

  if (isLoading) {
    return (
      <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-950/80 border-b border-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-slate-50">Makas</h1>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-950/80 border-b border-slate-800/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16">
          
          {/* Sol taraf: Marka adı - her zaman görünür */}
          <div className="flex items-center">
            <Link href={isAuthenticated ? "/dashboard" : "/"}>
              <h1 className="text-xl font-bold text-slate-50 hover:text-slate-200 transition-colors cursor-pointer">
                Makas
              </h1>
            </Link>
          </div>
          
          {/* Orta: Navigasyon linkleri - sadece giriş yapmamış kullanıcılar için */}
          {!isAuthenticated && (
            <div className="hidden md:flex items-center space-x-8 flex-1 justify-center ml-8">
              <a 
                href="#features" 
                className="text-slate-300 hover:text-slate-50 transition-colors duration-200 font-medium"
              >
                Özellikler
              </a>
              <a 
                href="#pricing" 
                className="text-slate-300 hover:text-slate-50 transition-colors duration-200 font-medium"
              >
                Fiyatlandırma
              </a>
            </div>
          )}
          
          {/* Sağ taraf: Dinamik butonlar */}
          <div className="flex items-center space-x-4 ml-auto">
            {/* Debug info - remove this later */}
            <div className="text-xs text-slate-500 mr-2">
              Auth: {isAuthenticated ? 'Yes' : 'No'}
            </div>
            
            {/* Debug button - remove this later */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleForceClearSession}
              className="text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              Force Clear
            </Button>
            
            {!isAuthenticated ? (
              <>
                {/* Giriş yapmamış kullanıcılar için */}
                <Link href="/login">
                  <Button variant="ghost" className="text-slate-300 hover:text-slate-50 hover:bg-slate-800/50">
                    Giriş Yap
                  </Button>
                </Link>
                
                <Link href="/signup">
                  <Button className="bg-slate-50 text-slate-950 hover:bg-slate-200 font-medium">
                    Hemen Başla
                  </Button>
                </Link>
              </>
            ) : (
              <>
                {/* Giriş yapmış kullanıcılar için */}
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-slate-300 hover:text-slate-50 hover:bg-slate-800/50">
                    Dashboard
                  </Button>
                </Link>
                
                <Button variant="ghost" size="icon" aria-label="Notifications" className="text-slate-300 hover:text-slate-50 hover:bg-slate-800/50">
                  <Bell className="h-5 w-5" />
                </Button>

                <Button 
                  className="bg-slate-50 text-slate-950 hover:bg-slate-200 font-medium"
                  onClick={() => router.push('/dashboard/profile')}
                >
                  Profilim
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                >
                  Çıkış Yap
                </Button>
              </>
            )}
          </div>
          
        </div>
      </div>
    </nav>
  );
} 