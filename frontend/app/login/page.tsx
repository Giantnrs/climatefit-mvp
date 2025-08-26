
'use client'
import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { saveToken } from '@/lib/auth'
import { useRouter } from 'next/navigation'

type Mode='login'|'signup'|'forgot'

export default function LoginPage(){
  const [mode,setMode]=useState<Mode>('login')
  const router=useRouter()
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [confirmPassword,setConfirmPassword]=useState('')
  const [username,setUsername]=useState('')
  const [code,setCode]=useState('')
  const [msg,setMsg]=useState<string|null>(null)
  const [isLoading,setIsLoading]=useState(false)

  async function onSubmit(e:React.FormEvent){
    e.preventDefault(); setMsg(null)
    
    // 验证确认密码
    if((mode === 'signup' || mode === 'forgot') && password !== confirmPassword){
      setMsg('Passwords do not match!')
      return
    }
    
    setIsLoading(true)
    try {
      if(mode==='login'){
        const r = await apiFetch<{token:string}>('/auth/login',{method:'POST',json:{email,password}, withAuth: false})
        saveToken(r.token); router.push('/onboarding')
      }else if(mode==='signup'){
        await apiFetch('/auth/register',{method:'POST',json:{email,password,username}, withAuth: false})
        setMsg('Registered successfully! Please login.'); setMode('login')
        setConfirmPassword('')
      }else{
        await apiFetch('/auth/forgot',{method:'POST',json:{email,code,newPassword:password}, withAuth: false})
        setMsg('Password reset successfully! Please login.'); setMode('login')
        setConfirmPassword('')
      }
    } catch (error: any) {
      setMsg(error.message || 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="max-w-md mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center">{mode==='login'?'Welcome Back':'Get Started'}</h1>
      <div className="rounded-2xl border border-gray-200 p-6 bg-white shadow-lg space-y-6">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          <button 
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              mode==='login'?'bg-white text-black shadow-sm':'text-gray-600 hover:text-black'
            }`} 
            onClick={()=>{setMode('login'); setMsg(null); setConfirmPassword('')}}>
            Login
          </button>
          <button 
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              mode==='signup'?'bg-white text-black shadow-sm':'text-gray-600 hover:text-black'
            }`} 
            onClick={()=>{setMode('signup'); setMsg(null); setConfirmPassword('')}}>
            Sign up
          </button>
          <button 
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              mode==='forgot'?'bg-white text-black shadow-sm':'text-gray-600 hover:text-black'
            }`} 
            onClick={()=>{setMode('forgot'); setMsg(null); setConfirmPassword('')}}>
            Reset
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-4">
          {mode==='signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200" 
                value={username} 
                onChange={e=>setUsername(e.target.value)} 
                required
                disabled={isLoading}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200" 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              required
              disabled={isLoading}
            />
          </div>
          
          {mode!=='forgot' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200" 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                required
                disabled={isLoading}
              />
            </div>
          )}
          
          {mode==='signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input 
                type="password" 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200" 
                value={confirmPassword} 
                onChange={e=>setConfirmPassword(e.target.value)} 
                required
                disabled={isLoading}
              />
            </div>
          )}
          
          {mode==='forgot' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                <input 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200" 
                  value={code} 
                  onChange={e=>setCode(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input 
                  type="password" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200" 
                  value={password} 
                  onChange={e=>setPassword(e.target.value)} 
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200" 
                  value={confirmPassword} 
                  onChange={e=>setConfirmPassword(e.target.value)} 
                  required
                  disabled={isLoading}
                />
              </div>
            </>
          )}
          
          {msg && (
            <div className={`p-3 rounded-lg text-sm ${
              msg.includes('successfully') || msg.includes('Registered') 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {msg}
            </div>
          )}
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-lg bg-black text-white font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Loading...
              </div>
            ) : (
              mode==='login'?'Sign In': mode==='signup'?'Create Account':'Reset Password'
            )}
          </button>
        </form>
      </div>
    </section>
  )
}
