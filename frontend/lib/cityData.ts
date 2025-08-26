// Temporary city weather database
// Structure: city name, latitude, longitude, seasonal data (Q1-Q4)
// Each season has: quarter, maxTemp, minTemp, avgTemp, avgRainfall

export interface SeasonalData {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' // Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec
  maxTemp: number // °C
  minTemp: number // °C
  avgTemp: number // °C
  avgRainfall: number // mm
}

export interface CityWeatherData {
  name: string
  latitude: number
  longitude: number
  data: SeasonalData[]
}

// Sample data for major cities around the world
export const CITY_WEATHER_DATABASE: CityWeatherData[] = [
  {
    name: 'Auckland',
    latitude: -36.8485,
    longitude: 174.7633,
    data: [
      { quarter: 'Q1', maxTemp: 24, minTemp: 16, avgTemp: 20, avgRainfall: 80 },
      { quarter: 'Q2', maxTemp: 19, minTemp: 11, avgTemp: 15, avgRainfall: 120 },
      { quarter: 'Q3', maxTemp: 16, minTemp: 8, avgTemp: 12, avgRainfall: 110 },
      { quarter: 'Q4', maxTemp: 21, minTemp: 13, avgTemp: 17, avgRainfall: 90 }
    ]
  },
  {
    name: 'Wellington',
    latitude: -41.2865,
    longitude: 174.7762,
    data: [
      { quarter: 'Q1', maxTemp: 21, minTemp: 14, avgTemp: 17.5, avgRainfall: 85 },
      { quarter: 'Q2', maxTemp: 16, minTemp: 9, avgTemp: 12.5, avgRainfall: 130 },
      { quarter: 'Q3', maxTemp: 13, minTemp: 6, avgTemp: 9.5, avgRainfall: 140 },
      { quarter: 'Q4', maxTemp: 18, minTemp: 11, avgTemp: 14.5, avgRainfall: 95 }
    ]
  },
  {
    name: 'New York',
    latitude: 40.7128,
    longitude: -74.0060,
    data: [
      { quarter: 'Q1', maxTemp: 8, minTemp: -1, avgTemp: 3.5, avgRainfall: 95 },
      { quarter: 'Q2', maxTemp: 24, minTemp: 15, avgTemp: 19.5, avgRainfall: 110 },
      { quarter: 'Q3', maxTemp: 28, minTemp: 20, avgTemp: 24, avgRainfall: 100 },
      { quarter: 'Q4', maxTemp: 16, minTemp: 7, avgTemp: 11.5, avgRainfall: 85 }
    ]
  },
  {
    name: 'Los Angeles',
    latitude: 34.0522,
    longitude: -118.2437,
    data: [
      { quarter: 'Q1', maxTemp: 20, minTemp: 9, avgTemp: 14.5, avgRainfall: 75 },
      { quarter: 'Q2', maxTemp: 24, minTemp: 14, avgTemp: 19, avgRainfall: 5 },
      { quarter: 'Q3', maxTemp: 28, minTemp: 18, avgTemp: 23, avgRainfall: 2 },
      { quarter: 'Q4', maxTemp: 24, minTemp: 12, avgTemp: 18, avgRainfall: 25 }
    ]
  },
  {
    name: 'London',
    latitude: 51.5074,
    longitude: -0.1278,
    data: [
      { quarter: 'Q1', maxTemp: 9, minTemp: 2, avgTemp: 5.5, avgRainfall: 55 },
      { quarter: 'Q2', maxTemp: 19, minTemp: 9, avgTemp: 14, avgRainfall: 50 },
      { quarter: 'Q3', maxTemp: 22, minTemp: 12, avgTemp: 17, avgRainfall: 55 },
      { quarter: 'Q4', maxTemp: 12, minTemp: 4, avgTemp: 8, avgRainfall: 65 }
    ]
  },
  {
    name: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    data: [
      { quarter: 'Q1', maxTemp: 8, minTemp: 1, avgTemp: 4.5, avgRainfall: 50 },
      { quarter: 'Q2', maxTemp: 20, minTemp: 9, avgTemp: 14.5, avgRainfall: 55 },
      { quarter: 'Q3', maxTemp: 25, minTemp: 14, avgTemp: 19.5, avgRainfall: 60 },
      { quarter: 'Q4', maxTemp: 12, minTemp: 4, avgTemp: 8, avgRainfall: 55 }
    ]
  },
  {
    name: 'Tokyo',
    latitude: 35.6762,
    longitude: 139.6503,
    data: [
      { quarter: 'Q1', maxTemp: 10, minTemp: 1, avgTemp: 5.5, avgRainfall: 110 },
      { quarter: 'Q2', maxTemp: 25, minTemp: 16, avgTemp: 20.5, avgRainfall: 160 },
      { quarter: 'Q3', maxTemp: 30, minTemp: 23, avgTemp: 26.5, avgRainfall: 140 },
      { quarter: 'Q4', maxTemp: 18, minTemp: 8, avgTemp: 13, avgRainfall: 95 }
    ]
  },
  {
    name: 'Sydney',
    latitude: -33.8688,
    longitude: 151.2093,
    data: [
      { quarter: 'Q1', maxTemp: 26, minTemp: 19, avgTemp: 22.5, avgRainfall: 100 },
      { quarter: 'Q2', maxTemp: 20, minTemp: 11, avgTemp: 15.5, avgRainfall: 130 },
      { quarter: 'Q3', maxTemp: 18, minTemp: 8, avgTemp: 13, avgRainfall: 70 },
      { quarter: 'Q4', maxTemp: 23, minTemp: 15, avgTemp: 19, avgRainfall: 75 }
    ]
  },
  {
    name: 'Singapore',
    latitude: 1.3521,
    longitude: 103.8198,
    data: [
      { quarter: 'Q1', maxTemp: 31, minTemp: 24, avgTemp: 27.5, avgRainfall: 160 },
      { quarter: 'Q2', maxTemp: 32, minTemp: 25, avgTemp: 28.5, avgRainfall: 140 },
      { quarter: 'Q3', maxTemp: 32, minTemp: 25, avgTemp: 28.5, avgRainfall: 170 },
      { quarter: 'Q4', maxTemp: 31, minTemp: 24, avgTemp: 27.5, avgRainfall: 270 }
    ]
  },
  {
    name: 'Moscow',
    latitude: 55.7558,
    longitude: 37.6176,
    data: [
      { quarter: 'Q1', maxTemp: -4, minTemp: -10, avgTemp: -7, avgRainfall: 35 },
      { quarter: 'Q2', maxTemp: 19, minTemp: 8, avgTemp: 13.5, avgRainfall: 70 },
      { quarter: 'Q3', maxTemp: 23, minTemp: 12, avgTemp: 17.5, avgRainfall: 80 },
      { quarter: 'Q4', maxTemp: 4, minTemp: -2, avgTemp: 1, avgRainfall: 50 }
    ]
  },
  {
    name: 'Dubai',
    latitude: 25.2048,
    longitude: 55.2708,
    data: [
      { quarter: 'Q1', maxTemp: 24, minTemp: 14, avgTemp: 19, avgRainfall: 20 },
      { quarter: 'Q2', maxTemp: 37, minTemp: 26, avgTemp: 31.5, avgRainfall: 5 },
      { quarter: 'Q3', maxTemp: 41, minTemp: 29, avgTemp: 35, avgRainfall: 0 },
      { quarter: 'Q4', maxTemp: 31, minTemp: 20, avgTemp: 25.5, avgRainfall: 10 }
    ]
  },
  {
    name: 'Mumbai',
    latitude: 19.0760,
    longitude: 72.8777,
    data: [
      { quarter: 'Q1', maxTemp: 29, minTemp: 19, avgTemp: 24, avgRainfall: 5 },
      { quarter: 'Q2', maxTemp: 33, minTemp: 26, avgTemp: 29.5, avgRainfall: 525 },
      { quarter: 'Q3', maxTemp: 30, minTemp: 24, avgTemp: 27, avgRainfall: 340 },
      { quarter: 'Q4', maxTemp: 32, minTemp: 20, avgTemp: 26, avgRainfall: 15 }
    ]
  },
  {
    name: 'Cairo',
    latitude: 30.0444,
    longitude: 31.2357,
    data: [
      { quarter: 'Q1', maxTemp: 20, minTemp: 9, avgTemp: 14.5, avgRainfall: 5 },
      { quarter: 'Q2', maxTemp: 35, minTemp: 20, avgTemp: 27.5, avgRainfall: 1 },
      { quarter: 'Q3', maxTemp: 35, minTemp: 22, avgTemp: 28.5, avgRainfall: 0 },
      { quarter: 'Q4', maxTemp: 25, minTemp: 14, avgTemp: 19.5, avgRainfall: 3 }
    ]
  },
  {
    name: 'Cape Town',
    latitude: -33.9249,
    longitude: 18.4241,
    data: [
      { quarter: 'Q1', maxTemp: 26, minTemp: 16, avgTemp: 21, avgRainfall: 15 },
      { quarter: 'Q2', maxTemp: 20, minTemp: 10, avgTemp: 15, avgRainfall: 95 },
      { quarter: 'Q3', maxTemp: 18, minTemp: 8, avgTemp: 13, avgRainfall: 80 },
      { quarter: 'Q4', maxTemp: 23, minTemp: 13, avgTemp: 18, avgRainfall: 25 }
    ]
  },
  {
    name: 'São Paulo',
    latitude: -23.5505,
    longitude: -46.6333,
    data: [
      { quarter: 'Q1', maxTemp: 28, minTemp: 19, avgTemp: 23.5, avgRainfall: 240 },
      { quarter: 'Q2', maxTemp: 23, minTemp: 13, avgTemp: 18, avgRainfall: 60 },
      { quarter: 'Q3', maxTemp: 24, minTemp: 12, avgTemp: 18, avgRainfall: 40 },
      { quarter: 'Q4', maxTemp: 27, minTemp: 16, avgTemp: 21.5, avgRainfall: 140 }
    ]
  }
]

// Utility functions for data processing
export const getTemperatureColor = (temp: number): string => {
  if (temp <= -10) return '#0066cc'      // Deep blue
  if (temp <= 0) return '#0099ff'        // Blue
  if (temp <= 10) return '#66ccff'       // Light blue
  if (temp <= 20) return '#00ff66'       // Green
  if (temp <= 25) return '#ffff00'       // Yellow
  if (temp <= 30) return '#ff9900'       // Orange
  if (temp <= 35) return '#ff3300'       // Red
  return '#cc0000'                       // Dark red
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

export const getDataForQuarter = (quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4') => {
  return CITY_WEATHER_DATABASE.map(city => ({
    ...city,
    currentData: city.data.find(d => d.quarter === quarter)!
  }))
}

export const getQuarterLabel = (quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'): string => {
  const labels = {
    'Q1': 'Q1 (Jan-Mar)',
    'Q2': 'Q2 (Apr-Jun)', 
    'Q3': 'Q3 (Jul-Sep)',
    'Q4': 'Q4 (Oct-Dec)'
  }
  return labels[quarter]
}
