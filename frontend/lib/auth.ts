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
      // Get the token from localStorage (set by Cognito after successful auth)
         console.log('getCognitoToken user:', user)
      return getToken()
    }
    return null
  } catch (error) {
    console.log('No authenticated user:', error)
    return null
  }
}

export const signOutUser = async () => {
  try {
    await signOut()
    clearToken()
  } catch (error) {
    console.error('Error signing out:', error)
    clearToken() // Clear token anyway
  }
}