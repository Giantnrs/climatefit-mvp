
import { getToken } from './auth'

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
    }
  }
  
  const body = opts.json!==undefined? JSON.stringify(opts.json): opts.body
  const res = await fetch(url, { ...opts, headers, body, cache:'no-store' })
  
  if(!res.ok) {
    let errorMessage = 'Request failed'
    try {
      const errorData = await res.json()
      errorMessage = errorData.error || errorData.message || errorMessage
    } catch {
      errorMessage = await res.text() || `HTTP ${res.status}: ${res.statusText}`
    }
    throw new Error(errorMessage)
  }
  
  const ct = res.headers.get('content-type')||''
  return ct.includes('application/json') ? res.json() as Promise<T> : res.text() as any
}
