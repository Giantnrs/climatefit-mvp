'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { getMonthLabel, getAvailableMonths } from '@/lib/climateData'

export default function Timeline({ onChange }: { onChange: (monthKey: string) => void }) {
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [months, setMonths] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const debounceTimer = useRef<any>(null)
  
  // Load available months on component mount
  useEffect(() => {
    const loadMonths = async () => {
      try {
        const availableMonths = await getAvailableMonths()
        setMonths(availableMonths)
        // Start with the most recent month
        if (availableMonths.length > 0) {
          const latestMonth = availableMonths[availableMonths.length - 1]
          const [year, month] = latestMonth.split('-')
          setSelectedYear(year)
          setSelectedMonth(month)
        }
      } catch (error) {
        console.error('Failed to load months:', error)
        // fallback with recent months
        const fallbackMonths = []
        for (let year = 2023; year <= 2024; year++) {
          for (let month = 1; month <= 12; month++) {
            fallbackMonths.push(`${year}-${month.toString().padStart(2, '0')}`)
          }
        }
        setMonths(fallbackMonths)
        if (fallbackMonths.length > 0) {
          const latestMonth = fallbackMonths[fallbackMonths.length - 1]
          const [year, month] = latestMonth.split('-')
          setSelectedYear(year)
          setSelectedMonth(month)
        }
      } finally {
        setLoading(false)
      }
    }
    loadMonths()
  }, [])

  // Debounced onChange to prevent too many rapid updates
  const debouncedOnChange = useCallback((monthKey: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      onChange(monthKey)
    }, 100) // 100ms debounce
  }, [onChange])

  // Update month key when year or month changes
  useEffect(() => { 
    if (selectedYear && selectedMonth) {
      const monthKey = `${selectedYear}-${selectedMonth}`
      debouncedOnChange(monthKey)
    }
  }, [selectedYear, selectedMonth, debouncedOnChange])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  // Get available years from months data
  const availableYears = Array.from(new Set(months.map(m => m.split('-')[0]))).sort()
  
  // Get available months for selected year
  const availableMonthsForYear = months
    .filter(m => m.startsWith(selectedYear))
    .map(m => m.split('-')[1])
    .sort()

  return (
    <div className="rounded-xl border p-4 bg-white">
      <div className="text-center mb-4">
        <div className="text-lg font-semibold text-gray-900">
          {loading ? 'Loading...' : selectedYear && selectedMonth ? getMonthLabel(`${selectedYear}-${selectedMonth}`) : 'Select Date'}
        </div>
        <div className="text-sm text-gray-600">
          Monthly Climate Data
        </div>
      </div>
      
      {!loading && months.length > 0 && (
        <div className="space-y-4">
          {/* Year selector */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Year:</label>
            <select 
              value={selectedYear}
              onChange={(e) => {
                const year = e.target.value
                setSelectedYear(year)
                // Reset month to first available month for the selected year
                const yearMonths = months.filter(m => m.startsWith(year))
                if (yearMonths.length > 0) {
                  const firstMonth = yearMonths[0].split('-')[1]
                  setSelectedMonth(firstMonth)
                }
              }}
              className="border rounded px-3 py-2 bg-white text-sm min-w-[100px]"
            >
              <option value="">Select Year</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          {/* Month selector */}
          {selectedYear && (
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Month:</label>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border rounded px-3 py-2 bg-white text-sm min-w-[120px]"
              >
                <option value="">Select Month</option>
                {availableMonthsForYear.map(month => {
                  const monthNum = parseInt(month)
                  const monthNames = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ]
                  return (
                    <option key={month} value={month}>
                      {monthNames[monthNum - 1]} ({month})
                    </option>
                  )
                })}
              </select>
            </div>
          )}
          
          {/* Quick navigation to key years */}
          <div className="pt-3 border-t">
            <div className="text-xs text-gray-500 mb-2 text-center">Quick Jump:</div>
            <div className="flex justify-center gap-2 flex-wrap">
              {['2020', '2021', '2022', '2023', '2024'].map(year => (
                <button
                  key={year}
                  onClick={() => {
                    setSelectedYear(year)
                    // Set to December if available, otherwise first available month
                    const yearMonths = months.filter(m => m.startsWith(year))
                    if (yearMonths.length > 0) {
                      const decMonth = yearMonths.find(m => m.endsWith('-12'))
                      setSelectedMonth(decMonth ? '12' : yearMonths[0].split('-')[1])
                    }
                  }}
                  className={`text-xs px-3 py-1 rounded transition-colors ${
                    selectedYear === year
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}