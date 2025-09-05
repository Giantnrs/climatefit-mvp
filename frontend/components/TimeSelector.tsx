import React, { useState, useEffect, useCallback, useRef } from 'react'
import { getAvailableMonths, getMonthLabel } from '@/lib/climateData'

interface TimeSelectorProps {
  onTimeChange: (monthKey: string) => void
  initialMonthKey?: string
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({ 
  onTimeChange, 
  initialMonthKey 
}) => {
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Use ref to store the latest onTimeChange function
  const onTimeChangeRef = useRef(onTimeChange)
  onTimeChangeRef.current = onTimeChange

  // Load available months on component mount
  useEffect(() => {
    const loadMonths = async () => {
      try {
        const months = await getAvailableMonths()
        setAvailableMonths(months)
        
        // Set initial selection
        if (initialMonthKey && months.includes(initialMonthKey)) {
          const [year, month] = initialMonthKey.split('-')
          setSelectedYear(year)
          setSelectedMonth(month)
          onTimeChangeRef.current(initialMonthKey)
        } else if (months.length > 0) {
          // Default to the latest month
          const latestMonth = months[months.length - 1]
          const [year, month] = latestMonth.split('-')
          setSelectedYear(year)
          setSelectedMonth(month)
          onTimeChangeRef.current(latestMonth)
        }
      } catch (error) {
        console.error('Error loading available months:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMonths()
  }, [initialMonthKey])

  // Handle year change
  const handleYearChange = useCallback((year: string) => {
    setSelectedYear(year)
    
    if (year) {
      // Find the first available month for this year
      const yearMonths = availableMonths.filter(m => m.startsWith(year))
      if (yearMonths.length > 0) {
        const firstMonth = yearMonths[0].split('-')[1]
        setSelectedMonth(firstMonth)
        onTimeChangeRef.current(`${year}-${firstMonth}`)
      } else {
        setSelectedMonth('')
      }
    } else {
      setSelectedMonth('')
    }
  }, [availableMonths])

  // Handle month change
  const handleMonthChange = useCallback((month: string) => {
    setSelectedMonth(month)
    
    if (selectedYear && month) {
      onTimeChangeRef.current(`${selectedYear}-${month}`)
    }
  }, [selectedYear])

  // Get available years
  const availableYears = Array.from(new Set(availableMonths.map(m => m.split('-')[0]))).sort()

  // Get available months for selected year
  const availableMonthsForYear = selectedYear 
    ? availableMonths
        .filter(m => m.startsWith(selectedYear))
        .map(m => m.split('-')[1])
        .sort()
    : []

  // Get month name
  const getMonthName = (monthNum: string) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return monthNames[parseInt(monthNum) - 1] || monthNum
  }

  if (loading) {
    return (
      <div className="bg-white bg-opacity-95 rounded-lg border border-gray-200 shadow-xl p-3 backdrop-blur-sm">
        <div className="text-xs font-semibold text-gray-700 mb-2 text-center">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white bg-opacity-95 rounded-lg border border-gray-200 shadow-xl p-3 backdrop-blur-sm">
      <div className="text-xs font-semibold text-gray-700 mb-2 text-center">
        {selectedYear && selectedMonth ? getMonthLabel(`${selectedYear}-${selectedMonth}`) : 'Select Date'}
      </div>
      
      <div className="space-y-2">
        {/* Year selector */}
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-medium text-gray-600">Year:</label>
          <select 
            value={selectedYear}
            onChange={(e) => handleYearChange(e.target.value)}
            className="border rounded px-2 py-1 bg-white text-xs min-w-[80px]"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        
        {/* Month selector */}
        {selectedYear && (
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-gray-600">Month:</label>
            <select 
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="border rounded px-2 py-1 bg-white text-xs min-w-[80px]"
            >
              {availableMonthsForYear.map(month => (
                <option key={month} value={month}>
                  {getMonthName(month)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
