'use client'
import { MapContainer, TileLayer, Circle, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getClimateDataForMonth, getTemperatureColor, getRainfallColor, ClimateDataForMap } from '@/lib/climateData'
import ContinentSelector, { Continent } from './ContinentSelector'
import { TimeSelector } from './TimeSelector'

type Props = { 
  layer: 'temp' | 'precip'
}

// Map controller component for programmatic map control
const MapController: React.FC<{ center: [number, number], zoom: number }> = ({ center, zoom }) => {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1 })
  }, [map, center, zoom])
  
  return null
}

export default function MapView({ layer }: Props) {
  const [cityData, setCityData] = useState<ClimateDataForMap[]>([])
  const [loading, setLoading] = useState(false)
  const [forceRerender, setForceRerender] = useState(0)
  const [selectedContinent, setSelectedContinent] = useState<Continent | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0])
  const [mapZoom, setMapZoom] = useState(2)
  const [currentMonthKey, setCurrentMonthKey] = useState<string>('')

  // Force re-render when layer changes
  useEffect(() => {
    setForceRerender(prev => prev + 1)
  }, [layer])

  // Handle continent selection
  const handleContinentSelect = useCallback((continent: Continent) => {
    setSelectedContinent(continent)
    setMapCenter(continent.center)
    setMapZoom(continent.zoom)
  }, [])

  // Handle time change from TimeSelector
  const handleTimeChange = useCallback(async (monthKey: string) => {
    if (!monthKey) return
    
    setCurrentMonthKey(monthKey)
    setLoading(true)
    
    try {
      const data = await getClimateDataForMonth(monthKey)
      setCityData(data)
      // Force re-render to ensure colors update correctly
      setForceRerender(prev => prev + 1)
    } catch (error) {
      console.error('Error loading climate data:', error)
      setCityData([])
    } finally {
      setLoading(false)
    }
  }, [])

  const getCircleProps = useCallback((city: ClimateDataForMap) => {
    if (layer === 'temp') {
      const color = getTemperatureColor(city.temperature)
      return {
        color: color,
        fillColor: color,
        fillOpacity: 0.7,
        radius: 100000,
        weight: 2,
        className: 'climate-circle-glow climate-circle-gradient'
      }
    } else {
      const color = getRainfallColor(city.precipitation)
      return {
        color: color,
        fillColor: color,
        fillOpacity: 0.7,
        radius: 100000,
        weight: 2,
        className: 'climate-circle-glow climate-circle-gradient'
      }
    }
  }, [layer])

  return (
    <div className="relative w-full h-[640px]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 z-10 rounded-2xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-sm text-gray-600">Loading climate data...</div>
          </div>
        </div>
      )}
      
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="leaflet-container w-full h-full"
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
      >
        <MapController center={mapCenter} zoom={mapZoom} />
        
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {cityData.map((city, index) => (
          <Circle
            key={`${layer}-${city.cityName}-${city.latitude}-${city.longitude}-${city.temperature}-${city.precipitation}-${index}-${forceRerender}-${currentMonthKey}`}
            center={[city.latitude, city.longitude]}
            {...getCircleProps(city)}
          >
            <Tooltip permanent={false} direction="top" offset={[0, -10]}>
              <div className="text-center">
                <div className="font-semibold text-sm">{city.cityName}</div>
                {layer === 'temp' ? (
                  <div className="text-xs">
                    <div>Avg: {city.temperature.toFixed(1)}°C</div>
                    <div>Range: {city.minTemp.toFixed(1)}° - {city.maxTemp.toFixed(1)}°C</div>
                  </div>
                ) : (
                  <div className="text-xs">
                    <div>Precipitation: {city.precipitation.toFixed(1)}mm</div>
                  </div>
                )}
              </div>
            </Tooltip>
          </Circle>
        ))}
      </MapContainer>
      
      {/* Continent Selector - positioned over the map */}
      <div className="absolute top-4 left-4 z-[1000] pointer-events-auto">
        <ContinentSelector 
          onContinentSelect={handleContinentSelect}
          selectedContinent={selectedContinent?.name || null}
        />
      </div>
      
      {/* Time Selector - positioned below continent selector */}
      <div className="absolute top-96 left-4 z-[1000] pointer-events-auto">
        <TimeSelector 
          onTimeChange={handleTimeChange}
          initialMonthKey={currentMonthKey}
        />
      </div>
      
      {/* Legend - positioned over the map */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-95 p-4 rounded-lg shadow-xl border map-legend" style={{ zIndex: 1000 }}>
        <div className="text-sm font-semibold mb-3">
          {layer === 'temp' ? 'Temperature (°C)' : 'Precipitation (mm)'}
        </div>
        <div className="flex flex-col space-y-1 text-xs">
          {layer === 'temp' ? (
            <>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#0066cc'}}></div>&lt; -10°C</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#0099ff'}}></div>-10 to 0°C</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#66ccff'}}></div>0 to 10°C</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#00ff66'}}></div>10 to 20°C</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#ffff00'}}></div>20 to 25°C</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#ff9900'}}></div>25 to 30°C</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#ff3300'}}></div>30 to 35°C</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#cc0000'}}></div>&gt; 35°C</div>
            </>
          ) : (
            <>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#f5deb3'}}></div>≤ 10mm</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#deb887'}}></div>10-25mm</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#90ee90'}}></div>25-50mm</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#32cd32'}}></div>50-100mm</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#0000ff'}}></div>100-150mm</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#0000cd'}}></div>150-200mm</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#000080'}}></div>&gt; 200mm</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}