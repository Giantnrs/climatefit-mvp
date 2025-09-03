'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { getToken } from '@/lib/auth'

// Client-side rendering for MapView to avoid SSR issues
const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

import Timeline from '@/components/Timeline'

export default function HomePage(){
  const [layer, setLayer] = useState<'temp'|'precip'>('temp')
  const [currentQuarter, setCurrentQuarter] = useState<'Q1'|'Q2'|'Q3'|'Q4'>('Q4')
  const router = useRouter()

  const handleGetStarted = () => {
    const token = getToken()
    if (token) {
      router.push('/onboarding')
    } else {
      router.push('/login?from=get-started')
    }
  }

  const handleTimelineChange = (quarter: 'Q1'|'Q2'|'Q3'|'Q4') => {
    setCurrentQuarter(quarter)
  }

  return (
    <section className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">Global Climate Explorer</h1>
        <p className="text-lg text-gray-600">Explore seasonal climate patterns around the world</p>
      </div>
      
      <div className="flex gap-3 justify-center">
        {(['temp','precip'] as const).map(x=>(
          <button key={x} onClick={()=>setLayer(x)}
            className={`px-6 py-3 rounded-xl border-2 font-medium transition-all duration-200 ${
              layer===x
                ? 'bg-black text-white border-black shadow-lg' 
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:shadow-md'
            }`}>
            {x==='temp'?'🌡️ Temperature':'🌧️ Precipitation'}
          </button>
        ))}
      </div>

      {/* Map component loaded on client-side to avoid SSR window errors */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
        <MapView layer={layer} quarter={currentQuarter} />
      </div>

      <Timeline onChange={handleTimelineChange} />
      
      <div className="rounded-2xl border border-gray-200 p-8 bg-gradient-to-br from-blue-50 to-green-50 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Find Your Perfect Climate</h2>
          <p className="text-lg text-gray-700">
            Want to know which city's climate suits you best? Take our comprehensive questionnaire 
            to discover cities that match your weather preferences!
          </p>
          <button 
            onClick={handleGetStarted}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-black text-white font-semibold hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            <span>🧭</span>
            Get Started
          </button>
        </div>
      </div>
    </section>
  )
}
