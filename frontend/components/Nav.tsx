'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getToken, signOutUser } from '@/lib/auth' // Import signOutUser instead of clearToken
import { useEffect, useState } from 'react'

export default function Nav(){
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false) // Add loading state
  
  useEffect(() => {
    setIsLoggedIn(!!getToken())
  }, [pathname])
  
  const handleHomeClick = () => {
    if (pathname === '/') {
      window.location.reload()
    } else {
      router.push('/')
    }
  }
  
  const handleLogout = async () => { // Make it async
    setIsLoggingOut(true)
    try {
      await signOutUser() // Use the proper Cognito sign out
      setIsLoggedIn(false)
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
      // Still redirect even if logout fails
      setIsLoggedIn(false)
      router.push('/')
    } finally {
      setIsLoggingOut(false)
    }
  }
  
  const item = (href: string, label: string) => (
    <Link href={href as any}
      className={`px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors ${pathname === href ? 'bg-gray-200 font-semibold' : ''}`}>
      {label}
    </Link>
  )
  
  return (
    <nav className="border-b bg-white/70 backdrop-blur">
      <div className="container flex items-center justify-between h-14">
        <Link href="/" className="font-bold text-lg">ClimateFit</Link>
        <div className="flex gap-2">
          <button 
            onClick={handleHomeClick}
            className={`px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors ${pathname === '/' ? 'bg-gray-200 font-semibold' : ''}`}>
            Home
          </button>
          {!isLoggedIn ? (
            <>
              {item('/login', 'Login/Sign-up')}
            </>
          ) : (
            <>
              {pathname === '/profile' ? (
                <button 
                  onClick={handleLogout}
                  disabled={isLoggingOut} // Disable while logging out
                  className="px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors text-red-600 disabled:opacity-50">
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              ) : (
                item('/profile', 'Profile')
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  )
}