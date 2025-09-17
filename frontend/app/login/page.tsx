'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { saveToken } from '@/lib/auth' 

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkAuthAndSaveToken = async () => {
      try {
        // Ensure Amplify is configured before using auth functions
        await import('@/lib/amplifyConfig')
        
        // Import auth functions
        const { getCurrentUser, fetchAuthSession } = await import('aws-amplify/auth')
        
        // Check if user is authenticated
        const user = await getCurrentUser()
        console.log('User authenticated:', user)
        
        if (user) {
          // User is authenticated - this could be from callback or existing session
          try {
            // Get the auth session to extract tokens
            const session = await fetchAuthSession()
            
            // Extract the token (you can choose idToken or accessToken)
            const idToken = session.tokens?.idToken?.toString()
            const accessToken = session.tokens?.accessToken?.toString()
            
            console.log('Tokens available:', { 
              hasIdToken: !!idToken, 
              hasAccessToken: !!accessToken 
            })
            
            // Save the token (choose which one you want to save)
            if (idToken) {
              saveToken(idToken)
              console.log('Token saved successfully')
            } else if (accessToken) {
              saveToken(accessToken)
              console.log('Access token saved successfully')
            }
            
            // Redirect appropriately
            const fromGetStarted = searchParams.get('from') === 'get-started'
            router.push(fromGetStarted ? '/onboarding' : '/')
            
          } catch (tokenError) {
            console.error('Error fetching auth session:', tokenError)
            // Still redirect even if token saving fails
            const fromGetStarted = searchParams.get('from') === 'get-started'
            router.push(fromGetStarted ? '/onboarding' : '/')
          }
        }
        
      } catch (error) {
        // User is not authenticated, show login UI
        console.log('User not authenticated, showing login UI:', error)
      }
    }

    checkAuthAndSaveToken()
  }, [router, searchParams])

  const handleSignIn = async () => {
    try {
      // Ensure Amplify is configured before sign in
      await import('@/lib/amplifyConfig')
      const { signInWithRedirect } = await import('aws-amplify/auth')
      
      console.log('Initiating sign in redirect...')
      await signInWithRedirect()
    } catch (error) {
      console.error('Error initiating sign in:', error)
    }
  }

  return (
    <section className="max-w-md mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center">Welcome to ClimateFit</h1>
      
      <div className="rounded-2xl border border-gray-200 p-6 bg-white shadow-lg space-y-6">
        <div className="text-center space-y-4">
          <p className="text-gray-600">
            Sign in to your account to get personalized climate recommendations
          </p>
          
          <button
            onClick={handleSignIn}
            className="w-full px-4 py-3 rounded-lg bg-black text-white font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with AWS Cognito
          </button>
        </div>
        
        <div className="text-center text-sm text-gray-500">
          <p>Secure authentication powered by AWS Cognito</p>
          <p className="mt-1">Supports email/password, social login, and MFA</p>
        </div>
      </div>
    </section>
  )
}