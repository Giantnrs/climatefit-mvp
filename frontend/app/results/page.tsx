
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
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Top 3 Recommended Cities</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 md:grid-cols-3">
        {cities.map((c,i)=>(
          <div key={i} className="rounded-2xl border p-4 bg-white">
            <div className="h-32 rounded-xl bg-gray-200 mb-3 flex items-center justify-center">{c.image? <img src={c.image} alt={c.name} className="h-full w-full object-cover rounded-xl"/> : 'Photo'}</div>
            <h3 className="font-semibold">{c.name}</h3>
            <p className="text-gray-600 text-sm">{c.summary}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
