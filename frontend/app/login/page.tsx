'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { saveToken } from '@/lib/auth'
import dynamic from 'next/dynamic'

import { getCurrentUser, fetchAuthSession, signInWithRedirect } from 'aws-amplify/auth'
import '@/lib/amplifyConfig'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkAuthAndSaveToken = async () => {
      try {
        const storedRedirect = localStorage.getItem('redirect_after_auth')
        const fromGetStarted =
          searchParams.get('from') === 'get-started' || storedRedirect === '/onboarding'

        const user = await getCurrentUser()

        if (user) {
          if (storedRedirect) {
            localStorage.removeItem('redirect_after_auth')
          }

          try {
            const session = await fetchAuthSession()
            const idToken = session.tokens?.idToken?.toString()
            const accessToken = session.tokens?.accessToken?.toString()

            if (idToken) {
              saveToken(idToken)
            } else if (accessToken) {
              saveToken(accessToken)
            }

            const redirectPath = fromGetStarted ? '/onboarding' : '/'
            router.push(redirectPath)
          } catch (tokenError) {
            console.error('Error fetching auth session:', tokenError)
            const redirectPath = fromGetStarted ? '/onboarding' : '/'
            router.push(redirectPath)
          }
        } else {
          // Not logged in
          handleSignIn()
        }
      } catch (error) {
        console.log('User not authenticated, redirecting to hosted UI:', error)
        handleSignIn()
      }
    }

    checkAuthAndSaveToken()
  }, [router, searchParams])

  const handleSignIn = async () => {
    try {
      const fromParam = searchParams.get('from')
      if (fromParam) {
        localStorage.setItem(
          'redirect_after_auth',
          fromParam === 'get-started' ? '/onboarding' : '/'
        )
      }
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
          <p className="text-gray-600">Redirecting you to sign in...</p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        </div>
        <div className="text-center text-sm text-gray-500">
          <p>Secure authentication powered by AWS Cognito</p>
        </div>
      </div>
    </section>
  )
}

// Export the component with no SSR
const LoginPage = dynamic(() => Promise.resolve(LoginContent), { 
  ssr: false,
  loading: () => (
    <section className="max-w-md mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center">Welcome to ClimateFit</h1>
      <div className="rounded-2xl border border-gray-200 p-6 bg-white shadow-lg space-y-6">
        <div className="text-center space-y-4">
          <p className="text-gray-600">Loading...</p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
          </div>
        </div>
      </div>
    </section>
  )
})

export default LoginPage