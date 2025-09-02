import { getToken, clearToken } from './auth'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'

type Options = RequestInit & { json?: any; withAuth?: boolean }

export async function apiFetch<T=any>(path:string, opts:Options={}){
  const url = `${API_BASE_URL}${path}`
  const headers: Record<string, string> = { 
    'Content-Type':'application/json', 
    ...(opts.headers||{}) 
  }
  
  // Add JWT token if withAuth is true or not explicitly set to false for protected endpoints
  if (opts.withAuth !== false && (opts.withAuth || path.startsWith('/profile') || path.startsWith('/results'))) {
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
      console.log(`🔑 Adding token to request for ${path}`)
    } else {
      console.log(`⚠️ No token found for protected endpoint ${path}`)
    }
  }
  
  console.log(`📡 Making request to ${path}`)
  const body = opts.json!==undefined? JSON.stringify(opts.json): opts.body
  const res = await fetch(url, { ...opts, headers, body, cache:'no-store' })
  
  console.log(`📊 Response status: ${res.status} for ${path}`)
  
  // Handle token expiration - but be more specific about when to redirect
  if (res.status === 401) {
    console.log(`🚫 401 Unauthorized for ${path}`)
    
    // Only handle as token expiration if this was a request that included a token
    const hadToken = headers['Authorization'] !== undefined
    const isAuthEndpoint = path.startsWith('/auth/')
    
    if (hadToken && !isAuthEndpoint) {
      console.log('🔄 Token expired, clearing token and redirecting to login')
      clearToken()
      
      // Add a small delay and check if we're not already redirecting
      setTimeout(() => {
        if (typeof window !== 'undefined' && 
            !window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/auth')) {
          console.log('🔀 Redirecting to login page')
          window.location.href = '/login'
        }
      }, 100)
      
      throw new Error('Session expired. Please log in again.')
    }
  }
  
  if(!res.ok) {
    let errorMessage = 'Request failed'
    try {
      const errorData = await res.json()
      errorMessage = errorData.error || errorData.message || errorMessage
    } catch {
      errorMessage = await res.text() || `HTTP ${res.status}: ${res.statusText}`
    }
    console.log(`❌ Request failed: ${errorMessage}`)
    throw new Error(errorMessage)
  }
  
  console.log(`✅ Request successful for ${path}`)
  const ct = res.headers.get('content-type')||''
  return ct.includes('application/json') ? res.json() as Promise<T> : res.text() as any
}
