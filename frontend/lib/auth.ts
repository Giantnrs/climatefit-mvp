
'use client'
const KEY='cf_token'
export const saveToken=(t:string)=> localStorage.setItem(KEY,t)
export const getToken=()=> typeof window==='undefined'? null : localStorage.getItem(KEY)
export const clearToken=()=> localStorage.removeItem(KEY)
