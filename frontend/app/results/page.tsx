
'use client'
import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

type City = { name:string, summary:string, image?:string }
export default function ResultsPage(){
  const [cities,setCities]=useState<City[]>([])
  const [error,setError]=useState<string|null>(null)
  useEffect(()=>{
    (async ()=>{
      try{
        const raw=localStorage.getItem('cf_onboarding')
        const payload= raw? JSON.parse(raw): {}
        const res = await apiFetch<City[]>('/results', { method:'POST', json: payload })
        setCities(res)
      }catch(e:any){
        setError('Using demo results. ' + (e?.message||''))
        setCities([
          {name:'Auckland', summary:'Mild temperatures, moderate rainfall year-round.'},
          {name:'Wellington', summary:'Windy, temperate maritime climate with cool summers.'},
          {name:'Christchurch', summary:'Cooler winters, drier overall with more temperature variation.'},
        ])
      }
    })()
  },[])
  return (
    <section className="space-y-8 max-w-7xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-center text-gray-900">Top 3 Recommended Cities</h1>
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      
      <div className="grid gap-8 md:grid-cols-3">
        {cities.map((c, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            {/* City Image */}
            <div className="h-48 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
              {c.image ? (
                <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-gray-500">
                  <div className="text-3xl mb-2">🏙️</div>
                  <p className="text-sm">City Photo</p>
                </div>
              )}
            </div>
            
            {/* City Information */}
            <div className="p-8">
              <div className="mb-4 text-center">
                <h3 className="text-lg font-bold text-gray-900">{c.name}</h3>
              </div>
              
              <div className="space-y-3">
                {c.summary.split('\n').map((line, lineIndex) => {
                  const [label, value] = line.split(': ');
                  
                  return (
                    <div key={lineIndex}>
                      <div className="font-bold text-gray-700 text-sm">
                        {label}:
                      </div>
                      <div className="text-gray-600 text-sm">
                        {value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
