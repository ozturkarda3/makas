'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import VisualProofSection from "@/components/VisualProofSection";
import PricingSection from "@/components/PricingSection";

export default function Home() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        // Do not redirect; allow logged-in users to remain on landing page
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [supabase])

  // Show loading while checking auth
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

  // Only show landing page content if user is not authenticated
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <VisualProofSection />
      <PricingSection />
    </>
  );
}