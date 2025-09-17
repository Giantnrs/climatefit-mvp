'use client'
import { signOut, getCurrentUser } from 'aws-amplify/auth'

const KEY='cf_token'

// Keep existing functions for backward compatibility
export const saveToken=(t:string)=> localStorage.setItem(KEY,t)
export const getToken=()=> typeof window==='undefined'? null : localStorage.getItem(KEY)
export const clearToken=()=> localStorage.removeItem(KEY)

// New Cognito functions
export const getCognitoToken = async () => {
  try {
    const user = await getCurrentUser()
    if (user) {
      console.log('getCognitoToken user:', user)
      return getToken()
    }
    return null
  } catch (error) {
    console.log('No authenticated user:', error)
    return null
  }
}

// Force logout by redirecting to Cognito logout URL
export const signOutUser = async () => {
  try {
    console.log('Starting force logout...')
    
    // Clear all local auth data
    clearToken()
    
    // Clear all Cognito-related storage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('amplify-') || 
          key.startsWith('aws-amplify-') || 
          key.startsWith('CognitoIdentityServiceProvider')) {
        localStorage.removeItem(key)
      }
    })
    
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('amplify-') || 
          key.startsWith('aws-amplify-') || 
          key.startsWith('CognitoIdentityServiceProvider')) {
        sessionStorage.removeItem(key)
      }
    })
    
    // Force redirect to Cognito logout endpoint
    const cognitoDomain = 'us-east-1djzjfpja1.auth.us-east-1.amazoncognito.com'
    const clientId = '2tj54esn827sjk6iro0b1r2hrq'
    const logoutUri = window.location.origin // This will be http://localhost:3000 in development
    const logoutUrl = `https://${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`
    
    console.log('Redirecting to logout URL:', logoutUrl)
    
    // This will terminate the Cognito session and redirect back to your app
    window.location.href = logoutUrl
    
  } catch (error) {
    console.error('Error in logout process:', error)
    // Fallback: just clear everything and refresh
    clearToken()
    window.location.reload()
  }
}