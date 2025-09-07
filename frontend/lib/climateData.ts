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
  // Convert daily precipitation (mm/day) to monthly total (mm/month)
  // Assuming average 30 days per month
  const monthlyTotal = rainfall * 30
  
  if (monthlyTotal <= 10) return '#8B4513'     // Saddle brown (very dry)
  if (monthlyTotal <= 25) return '#D2691E'    // Chocolate (dry)
  if (monthlyTotal <= 50) return '#F4A460'    // Sandy brown (moderate)
  if (monthlyTotal <= 100) return '#FFD700'   // Gold (good)
  if (monthlyTotal <= 150) return '#00BFFF'   // Deep sky blue (wet)
  if (monthlyTotal <= 200) return '#1E90FF'   // Dodger blue (very wet)
  return '#0000FF'                        // Pure blue (extremely wet)
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

