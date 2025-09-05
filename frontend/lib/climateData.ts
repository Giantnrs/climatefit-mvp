import { apiFetch } from './api'

export interface CityClimateData {
  cityName: string
  countryCode: string
  latitude: number
  longitude: number
  quarter: string
  temperature: number | null
  precipitation: number | null
  maxTemp: number | null
  minTemp: number | null
}

export interface ClimateDataForMap {
  cityName: string
  latitude: number
  longitude: number
  temperature: number
  precipitation: number
  maxTemp: number
  minTemp: number
}

// Utility functions for data processing - keeping the same color schemes
export const getTemperatureColor = (temp: number): string => {
  if (temp <= -10) return '#0066cc'      // Deep blue (< -10°C)
  if (temp <= 0) return '#0099ff'        // Blue (-10 to 0°C)
  if (temp <= 10) return '#66ccff'       // Light blue (0 to 10°C)
  if (temp <= 20) return '#00ff66'       // Green (10 to 20°C)
  if (temp <= 25) return '#ffff00'       // Yellow (20 to 25°C)
  if (temp <= 30) return '#ff9900'       // Orange (25 to 30°C)
  if (temp <= 35) return '#ff3300'       // Red (30 to 35°C)
  return '#cc0000'                       // Dark red (> 35°C)
}

export const getRainfallColor = (rainfall: number): string => {
  if (rainfall <= 10) return '#f5deb3'    // Light beige (very dry)
  if (rainfall <= 25) return '#deb887'    // Tan (dry)
  if (rainfall <= 50) return '#90ee90'    // Light green (moderate)
  if (rainfall <= 100) return '#32cd32'   // Lime green (good)
  if (rainfall <= 150) return '#0000ff'   // Blue (wet)
  if (rainfall <= 200) return '#0000cd'   // Medium blue (very wet)
  return '#000080'                        // Navy blue (extremely wet)
}

export const getMonthLabel = (monthKey: string): string => {
  const [year, month] = monthKey.split('-')
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
  const monthIndex = parseInt(month) - 1
  if (monthIndex >= 0 && monthIndex < 12) {
    return `${monthNames[monthIndex]} ${year}`
  }
  return monthKey
}

export const getQuarterLabel = (quarter: string): string => {
  const quarterLabels: Record<string, string> = {
    '2024Q1': 'Q1 2024 (Jan-Mar)',
    '2024Q2': 'Q2 2024 (Apr-Jun)', 
    '2024Q3': 'Q3 2024 (Jul-Sep)',
    '2024Q4': 'Q4 2024 (Oct-Dec)',
    '2023Q1': 'Q1 2023 (Jan-Mar)',
    '2023Q2': 'Q2 2023 (Apr-Jun)', 
    '2023Q3': 'Q3 2023 (Jul-Sep)',
    '2023Q4': 'Q4 2023 (Oct-Dec)',
  }
  return quarterLabels[quarter] || quarter
}

// API functions
export async function getAvailableMonths(): Promise<string[]> {
  try {
    const months = await apiFetch<string[]>('/api/climate/months', { withAuth: false })
    // Sort months chronologically from oldest to newest
    return months.sort((a: string, b: string) => {
      const [yearA, monthA] = a.split('-')
      const [yearB, monthB] = b.split('-')
      if (yearA !== yearB) {
        return parseInt(yearA) - parseInt(yearB)
      }
      return parseInt(monthA) - parseInt(monthB)
    })
  } catch (error) {
    console.error('Failed to fetch available months:', error)
    // fallback with recent months
    const fallbackMonths = []
    for (let year = 2023; year <= 2024; year++) {
      for (let month = 1; month <= 12; month++) {
        fallbackMonths.push(`${year}-${month.toString().padStart(2, '0')}`)
      }
    }
    return fallbackMonths
  }
}

export async function getAvailableQuarters(): Promise<string[]> {
  try {
    const quarters = await apiFetch<string[]>('/api/climate/quarters', { withAuth: false })
    // Sort quarters chronologically from oldest (2005Q1) to newest (2024Q4)
    return quarters.sort((a: string, b: string) => {
      const [yearA, quarterA] = a.split('Q')
      const [yearB, quarterB] = b.split('Q')
      if (yearA !== yearB) {
        return parseInt(yearA) - parseInt(yearB)
      }
      return parseInt(quarterA) - parseInt(quarterB)
    })
  } catch (error) {
    console.error('Failed to fetch available quarters:', error)
    // fallback with full range from 2005 to 2024
    const fallbackQuarters = []
    for (let year = 2005; year <= 2024; year++) {
      for (let quarter = 1; quarter <= 4; quarter++) {
        fallbackQuarters.push(`${year}Q${quarter}`)
      }
    }
    return fallbackQuarters
  }
}

export async function getClimateDataForMonth(monthKey: string, signal?: AbortSignal): Promise<ClimateDataForMap[]> {
  try {
    const cities = await apiFetch<CityClimateData[]>(`/api/climate/month/${monthKey}`, { 
      withAuth: false,
      signal 
    })
    
    // Filter out cities with missing data and transform for map usage
    return cities
      .filter((city: CityClimateData) => 
        city.temperature !== null && 
        city.precipitation !== null &&
        !isNaN(city.latitude) &&
        !isNaN(city.longitude)
      )
      .map((city: CityClimateData) => ({
        cityName: city.cityName,
        latitude: city.latitude,
        longitude: city.longitude,
        temperature: city.temperature!,
        precipitation: city.precipitation!,
        maxTemp: city.maxTemp || city.temperature!,
        minTemp: city.minTemp || city.temperature!
      }))
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // Request was cancelled, return empty array
      return []
    }
    console.error(`Failed to fetch climate data for month ${monthKey}:`, error)
    return [] // return empty array on error
  }
}

export async function getClimateDataForQuarter(quarter: string): Promise<ClimateDataForMap[]> {
  try {
    const cities = await apiFetch<CityClimateData[]>(`/api/climate/${quarter}`, { withAuth: false })
    
    // Filter out cities with missing data and transform for map usage
    return cities
      .filter((city: CityClimateData) => 
        city.temperature !== null && 
        city.precipitation !== null &&
        !isNaN(city.latitude) &&
        !isNaN(city.longitude)
      )
      .map((city: CityClimateData) => ({
        cityName: city.cityName,
        latitude: city.latitude,
        longitude: city.longitude,
        temperature: city.temperature!,
        precipitation: city.precipitation!,
        maxTemp: city.maxTemp || city.temperature!,
        minTemp: city.minTemp || city.temperature!
      }))
  } catch (error) {
    console.error(`Failed to fetch climate data for quarter ${quarter}:`, error)
    return [] // return empty array on error
  }
}
