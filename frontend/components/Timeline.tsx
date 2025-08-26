
'use client'
import { useEffect, useRef, useState } from 'react'
import { getQuarterLabel } from '@/lib/cityData'

type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'

export default function Timeline({ onChange }: { onChange: (quarter: Quarter) => void }) {
  const [currentIndex, setCurrentIndex] = useState(3) // Start with Q4 (latest)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<any>(null)
  
  const quarters: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4']
  
  useEffect(() => { 
    onChange(quarters[currentIndex]) 
  }, [currentIndex, onChange])
  
  useEffect(() => {
    if (playing) {
      timer.current = setInterval(() => 
        setCurrentIndex(x => x >= 3 ? 0 : x + 1), 1000
      )
    } else if (timer.current) { 
      clearInterval(timer.current) 
    }
    return () => timer.current && clearInterval(timer.current)
  }, [playing])
  
  return (
    <div className="rounded-xl border p-4 bg-white">
      <div className="flex items-center gap-3 mb-3">
        <button 
          className="px-4 py-2 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors flex items-center gap-2" 
          onClick={() => setPlaying(p => !p)}
        >
          {playing ? (
            <>
              <div className="w-3 h-3 flex gap-0.5">
                <div className="w-1 h-3 bg-gray-600"></div>
                <div className="w-1 h-3 bg-gray-600"></div>
              </div>
              Pause
            </>
          ) : (
            <>
              <div className="w-0 h-0 border-l-4 border-l-gray-600 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
              Play
            </>
          )}
        </button>
        <div className="flex-1 text-center">
          <div className="text-lg font-semibold text-gray-900">
            {getQuarterLabel(quarters[currentIndex])}
          </div>
          <div className="text-sm text-gray-600">
            Climate Data Timeline
          </div>
        </div>
      </div>
      
      <div className="relative">
        <input 
          type="range" 
          min={0} 
          max={3} 
          value={currentIndex} 
          onChange={e => setCurrentIndex(parseInt(e.target.value))} 
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentIndex / 3) * 100}%, #e5e7eb ${(currentIndex / 3) * 100}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          {quarters.map((quarter, index) => (
            <button
              key={quarter}
              onClick={() => setCurrentIndex(index)}
              className={`px-2 py-1 rounded transition-colors ${
                currentIndex === index 
                  ? 'bg-blue-100 text-blue-800 font-medium' 
                  : 'hover:bg-gray-100'
              }`}
            >
              {quarter}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
