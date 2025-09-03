
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'

type Profile = { email:string, username?:string, preferences?:any, history?:{cities:string[], date:string}[] }
export default function ProfilePage(){
  const [p,setP]=useState<Profile|null>(null)
  const [loading,setLoading]=useState(true)

  const fetchProfile = async () => {
    setLoading(true)
    try{ 
      console.log('Fetching profile from API...')
      const profile = await apiFetch<Profile>('/profile', { method:'GET'})
      console.log('Profile fetched:', profile)
      setP(profile)
    }
    catch(error){ 
      console.error('Failed to fetch profile from API:', error)
      // Fallback to localStorage if API fails
      const localPrefs = localStorage.getItem('cf_onboarding')
      
      const demoProfile = {
        email:'demo@user.com', 
        username:'demo', 
        preferences: localPrefs ? JSON.parse(localPrefs) : null, // Don't provide demo data
        history: []
      }
      console.log('Using fallback profile:', demoProfile)
      setP(demoProfile) 
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  // Listen for storage changes to detect updates from questionnaire
  useEffect(() => {
    const handleStorageChange = () => {
      fetchProfile()
    }
    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom events from questionnaire submission
    const handleProfileUpdate = () => {
      fetchProfile()
    }
    window.addEventListener('profileUpdate', handleProfileUpdate)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('profileUpdate', handleProfileUpdate)
    }
  }, [])

  const formatPreferences = (preferences: any): { question: string; answer: string }[] => {
    if (!preferences) return []
    
    const formatters = {
      avgTemp: (val: any) => `${val}°C`,
      maxSummer: (val: any) => `${val}°C`,
      minWinter: (val: any) => `${val}°C`,
      tempVariation: (val: any) => {
        if (val <= 3) return 'Dislike'
        if (val <= 6) return 'Neutral'
        return 'Like'
      },
      precipitation: (val: any) => {
        const labels: { [key: string]: string } = {
          'low': 'Low rainfall year-round',
          'moderate': 'Moderate rainfall year-round', 
          'high': 'High rainfall year-round',
          'seasonal': 'Distinct rainy season'
        }
        return labels[val] || val
      },
      humidity: (val: any) => {
        const labels: { [key: string]: string } = {
          'dry': 'Dry',
          'humid': 'Humid',
          'no-preference': 'No preference'
        }
        return labels[val] || val
      },
      favoriteCities: (val: any) => Array.isArray(val) ? val.join(', ') : val || 'None selected'
    }

    const questions = [
      { key: 'avgTemp', question: "1. What's your preferred average temperature?" },
      { key: 'maxSummer', question: "2. What's the highest summer temperature you can tolerate?" },
      { key: 'minWinter', question: "3. What's the lowest winter temperature you can tolerate?" },
      { key: 'tempVariation', question: "4. Do you like large temperature variations?" },
      { key: 'precipitation', question: "5. What's your precipitation preference?" },
      { key: 'humidity', question: "6. What's your humidity preference?" },
      { key: 'favoriteCities', question: "7. List 3 cities with climates you love (for positive matching)" }
    ]

    return questions
      .filter(q => preferences.hasOwnProperty(q.key))
      .map(q => ({
        question: q.question,
        answer: formatters[q.key as keyof typeof formatters](preferences[q.key])
      }))
  }

  if (loading) {
    return (
      <section className="space-y-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center">User Profile</h1>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">User Profile</h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 p-6 bg-white shadow-sm">
            <h3 className="font-semibold mb-4 text-lg text-center">Account Information</h3>
            <div className="space-y-3 text-center">
              <div>
                <p className="text-sm text-gray-600">Username</p>
                <p className="font-medium text-lg">{p?.username || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-lg">{p?.email || 'Not available'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Member Since</p>
                <p className="font-medium text-lg">
                  {p?.email ? new Date().toLocaleDateString() : 'Not available'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border border-gray-200 p-6 bg-white shadow-sm">
            <h3 className="font-semibold mb-4 text-lg">Test History</h3>
            {p?.history?.length ? (
              <div className="space-y-4">
                {p.history.slice().reverse().map((h, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-2 font-medium">
                      <span className="inline-flex items-center gap-1">
                        📅 {h.date}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {h.cities.map((city, cityIndex) => (
                        <div key={cityIndex} className="text-sm font-medium text-gray-800 py-1 px-2 bg-white rounded border-l-4 border-blue-500">
                          {city}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No test history yet</p>
                <Link 
                  href="/onboarding" 
                  className="inline-block px-6 py-3 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors">
                  Take Your First Test
                </Link>
              </div>
            )}
          </div>
        </div>
        
        <div className="rounded-2xl border border-gray-200 p-6 bg-white shadow-sm">
          <h3 className="font-semibold mb-4 text-lg">Climate Preferences</h3>
          {(() => {
            const preferences = formatPreferences(p?.preferences)
            return preferences.length > 0 ? (
              <div className="space-y-4">
                {preferences.map((item: { question: string; answer: string }, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {item.question}
                    </div>
                    <div className="text-sm text-blue-600 font-medium">
                      {item.answer}
                    </div>
                  </div>
                ))}
                <Link 
                  href="/onboarding" 
                  className="inline-block w-full mt-4 px-4 py-2 rounded-lg bg-black text-white text-center hover:bg-gray-800 transition-colors">
                  Update Preferences
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <p className="text-gray-500 mb-4">No climate preferences set yet</p>
                <p className="text-sm text-gray-400 mb-6">
                  Take our questionnaire to discover cities that match your climate preferences
                </p>
                <Link 
                  href="/onboarding" 
                  className="inline-block px-6 py-3 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors">
                  Take Questionnaire
                </Link>
              </div>
            )
          })()}
        </div>
      </div>
    </section>
  )
}
