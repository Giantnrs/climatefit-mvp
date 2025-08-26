
'use client'
import { MapContainer, TileLayer, Circle, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getDataForQuarter, getTemperatureColor, getRainfallColor } from '@/lib/cityData'

type Props = { 
  layer: 'temp' | 'precip'
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'
}

export default function MapView({ layer, quarter }: Props) {
  const cityData = getDataForQuarter(quarter)

  const getCircleProps = (city: any) => {
    const data = city.currentData
    if (layer === 'temp') {
      return {
        color: getTemperatureColor(data.avgTemp),
        fillColor: getTemperatureColor(data.avgTemp),
        fillOpacity: 0.7,
        radius: 50000,
        weight: 2
      }
    } else {
      return {
        color: getRainfallColor(data.avgRainfall),
        fillColor: getRainfallColor(data.avgRainfall),
        fillOpacity: 0.7,
        radius: 50000,
        weight: 2
      }
    }
  }

  return (
    <div className="relative">
      <MapContainer 
        center={[20, 0]} 
        zoom={2} 
        zoomControl={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        dragging={true}
        className="leaflet-container"
        style={{ height: '480px', width: '100%' }}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {cityData.map((city, index) => (
          <Circle
            key={index}
            center={[city.latitude, city.longitude]}
            {...getCircleProps(city)}
          >
            <Tooltip permanent={false} direction="top" offset={[0, -10]}>
              <div className="text-center">
                <div className="font-semibold text-sm">{city.name}</div>
                {layer === 'temp' ? (
                  <div className="text-xs">
                    <div>Avg: {city.currentData.avgTemp}°C</div>
                    <div>Range: {city.currentData.minTemp}° - {city.currentData.maxTemp}°C</div>
                  </div>
                ) : (
                  <div className="text-xs">
                    <div>Rainfall: {city.currentData.avgRainfall}mm</div>
                  </div>
                )}
              </div>
            </Tooltip>
          </Circle>
        ))}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg">
        <div className="text-sm font-semibold mb-2">
          {layer === 'temp' ? 'Temperature (°C)' : 'Rainfall (mm)'}
        </div>
        <div className="flex flex-col space-y-1 text-xs">
          {layer === 'temp' ? (
            <>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#0066cc'}}></div>≤ -10°C</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#0099ff'}}></div>-10 to 0°C</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#66ccff'}}></div>0 to 10°C</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#00ff66'}}></div>10 to 20°C</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#ffff00'}}></div>20 to 25°C</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#ff9900'}}></div>25 to 30°C</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#ff3300'}}></div>30 to 35°C</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#cc0000'}}></div>> 35°C</div>
            </>
          ) : (
            <>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#f5deb3'}}></div>≤ 10mm</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#deb887'}}></div>10-25mm</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#90ee90'}}></div>25-50mm</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#32cd32'}}></div>50-100mm</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#0000ff'}}></div>100-150mm</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#0000cd'}}></div>150-200mm</div>
              <div className="flex items-center"><div className="w-4 h-4 mr-2" style={{backgroundColor: '#000080'}}></div>> 200mm</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
