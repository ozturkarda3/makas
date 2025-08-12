import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    
    try {
      // Exchange the authorization code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // Check if this is a new user (signup) and create profile if needed
      if (data.user && data.session) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()

        // If no profile exists, create one with user metadata
        if (!profileData) {
          const userMetadata = data.user.user_metadata
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              full_name: userMetadata.full_name || '',
              business_name: userMetadata.business_name || '',
              username: userMetadata.username || '',
              email: data.user.email || '',
            })

          if (profileError) {
            console.error('Error creating profile:', profileError)
          }
        }
      }
      
      // Redirect to dashboard after successful authentication
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch (error) {
      console.error('Error exchanging code for session:', error)
      // If there's an error, redirect to login page
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // If no code is provided, redirect to login page
  return NextResponse.redirect(new URL('/login', request.url))
}
