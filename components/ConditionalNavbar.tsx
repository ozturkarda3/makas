'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'

const RESERVED_FIRST_SEGMENTS = new Set([
  '',
  'login',
  'signup',
  'dashboard',
  'api',
  '_next'
])

export default function ConditionalNavbar() {
  const pathname = usePathname() || '/'

  // Extract the first segment after '/'
  const [, firstSegment = ''] = pathname.split('/')

  // Profile pages are single top-level segments that are NOT reserved
  const isSingleSegment = pathname.split('/').filter(Boolean).length === 1
  const isProfilePage = isSingleSegment && !RESERVED_FIRST_SEGMENTS.has(firstSegment)

  if (isProfilePage) return null

  return <Navbar />
}


