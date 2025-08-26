
'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { getToken } from '@/lib/auth'
import { apiFetch } from '@/lib/api'

// City database - in the future this could be loaded from an API
const CITY_DATABASE = [
  'Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Dunedin', 'Palmerston North',
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego',
  'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco',
  'Indianapolis', 'Seattle', 'Denver', 'Washington', 'Boston', 'El Paso', 'Nashville', 'Detroit', 'Portland',
  'London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Sheffield', 'Bradford', 'Liverpool', 'Edinburgh',
  'Bristol', 'Leicester', 'Wakefield', 'Cardiff', 'Coventry', 'Nottingham', 'Reading', 'Kingston upon Hull',
  'Preston', 'Newport', 'Swansea', 'Bradford', 'Southend-on-Sea', 'Belfast', 'Derby', 'Plymouth', 'Luton',
  'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux',
  'Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen',
  'Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kawasaki', 'Kyoto', 'Saitama',
  'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Wollongong',
  'Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton',
  'Barcelona', 'Madrid', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas',
  'Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda'
]

export default function OnboardingPage(){
  const router = useRouter()
  
  // Check authentication on component mount
  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push('/login')
      return
    }
  }, [router])

  // Form state
  const [avgTemp, setAvgTemp] = useState(20)        // -10 to 35
  const [maxSummer, setMaxSummer] = useState(30)    // 20 to 45
  const [minWinter, setMinWinter] = useState(0)     // -30 to 20
  const [tempVariation, setTempVariation] = useState(5) // 0-10 (不喜欢 to 喜欢)
  const [precipitation, setPrecipitation] = useState('moderate') // rainfall preference
  const [humidity, setHumidity] = useState('no-preference') // humidity preference
  const [favoriteCities, setFavoriteCities] = useState('')  // 3 cities
  const [save, setSave] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [cityInput, setCityInput] = useState('') // for city autocomplete
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Memoized event handlers to prevent unnecessary re-renders
  const handleAvgTempChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAvgTemp(parseInt(e.target.value))
  }, [])

  const handleMaxSummerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxSummer(parseInt(e.target.value))
  }, [])

  const handleMinWinterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMinWinter(parseInt(e.target.value))
  }, [])

  const handleTempVariationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTempVariation(parseInt(e.target.value))
  }, [])

  const handlePrecipitationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPrecipitation(e.target.value)
  }, [])

  const handleHumidityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setHumidity(e.target.value)
  }, [])

  const handleCityInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCityInput(value)
    setShowSuggestions(value.length > 0)
  }, [])

  const handleSaveChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSave(e.target.checked)
  }, [])

  const handleCityInputFocus = useCallback(() => {
    setShowSuggestions(cityInput.length > 0)
  }, [cityInput])

  const handleCityInputBlur = useCallback(() => {
    setTimeout(() => setShowSuggestions(false), 200)
  }, [])

  // Format functions for sliders
  const formatTempVariation = useCallback((value: number) => {
    if (value <= 3) return 'Dislike'
    if (value <= 6) return 'Neutral'
    return 'Like'
  }, [])

  // City filtering and suggestions
  const filteredCities = useMemo(() => {
    if (!cityInput) return []
    return CITY_DATABASE
      .filter(city => city.toLowerCase().includes(cityInput.toLowerCase()))
      .slice(0, 10) // Show max 10 suggestions
  }, [cityInput])

  const addCity = useCallback((cityName: string) => {
    const currentCities = favoriteCities.split(',').map(s => s.trim()).filter(Boolean)
    if (currentCities.length < 3 && !currentCities.includes(cityName)) {
      const newCities = [...currentCities, cityName].join(', ')
      setFavoriteCities(newCities)
    }
    setCityInput('')
    setShowSuggestions(false)
  }, [favoriteCities])

  const removeCity = useCallback((cityToRemove: string) => {
    const currentCities = favoriteCities.split(',').map(s => s.trim()).filter(Boolean)
    const newCities = currentCities.filter(city => city !== cityToRemove).join(', ')
    setFavoriteCities(newCities)
  }, [favoriteCities])

  async function submit(){
    if (!getToken()) {
      router.push('/login')
      return
    }

    const cityList = favoriteCities.split(',').map(s => s.trim()).filter(Boolean)
    
    // Validate that all cities are in our database
    const invalidCities = cityList.filter(city => !CITY_DATABASE.includes(city))
    if (invalidCities.length > 0) {
      alert(`Invalid cities: ${invalidCities.join(', ')}. Please select cities from the suggestions.`)
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        avgTemp,
        maxSummer,
        minWinter,
        tempVariation,
        precipitation,
        humidity,
        favoriteCities: cityList,
        save
      }
      
            await apiFetch('/results', {
        method: 'POST',
        json: payload
      })

      // If user chose to save, also store locally for immediate access
      if (save) {
        localStorage.setItem('cf_onboarding', JSON.stringify(payload))
        // Trigger storage event for other tabs/windows
        window.dispatchEvent(new Event('storage'))
      }
      
      router.push('/results')
    } catch (error) {
      console.error('Submission error:', error)
      alert('Failed to submit questionnaire. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Memoized components to prevent re-rendering
  const QuestionCard = memo(({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 mb-3">{title}</h3>
      {children}
    </div>
  ))
  QuestionCard.displayName = 'QuestionCard'

  const SliderQuestion = memo(({ 
    title, 
    value, 
    min, 
    max, 
    onChange, 
    unit = '°C',
    color = '#3b82f6',
    formatValue
  }: {
    title: string
    value: number
    min: number
    max: number
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    unit?: string
    color?: string
    formatValue?: (value: number) => string
  }) => (
    <QuestionCard title={title}>
      <div className="space-y-3">
        <input 
          type="range" 
          min={min} 
          max={max} 
          value={value} 
          onChange={onChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`
          }}
        />
        <div className="text-center text-lg font-medium" style={{ color }}>
          {formatValue ? formatValue(value) : `${value}${unit}`}
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
    </QuestionCard>
  ))
  SliderQuestion.displayName = 'SliderQuestion'

  const RadioQuestion = memo(({ 
    title, 
    value, 
    options, 
    onChange, 
    name 
  }: {
    title: string
    value: string
    options: { value: string; label: string }[]
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    name: string
  }) => (
    <QuestionCard title={title}>
      <div className="grid grid-cols-2 gap-3">
        {options.map(option => (
          <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={onChange}
              className="text-blue-600"
            />
            <span className="text-sm">{option.label}</span>
          </label>
        ))}
      </div>
    </QuestionCard>
  ))
  RadioQuestion.displayName = 'RadioQuestion'

  const CitySelector = memo(({ 
    favoriteCities, 
    cityInput, 
    filteredCities, 
    showSuggestions,
    onCityInputChange,
    onCityInputFocus,
    onCityInputBlur,
    onAddCity,
    onRemoveCity
  }: {
    favoriteCities: string
    cityInput: string
    filteredCities: string[]
    showSuggestions: boolean
    onCityInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onCityInputFocus: () => void
    onCityInputBlur: () => void
    onAddCity: (city: string) => void
    onRemoveCity: (city: string) => void
  }) => {
    const selectedCities = favoriteCities.split(',').map(city => city.trim()).filter(Boolean)
    
    return (
      <QuestionCard title="7. List 3 cities with climates you love (for positive matching)">
        <div className="space-y-3">
          {/* Selected cities display */}
          {favoriteCities && (
            <div className="flex flex-wrap gap-2">
              {selectedCities.map((city, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm"
                >
                  {city}
                  <button
                    type="button"
                    onClick={() => onRemoveCity(city)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* City input with autocomplete */}
          <div className="relative">
            <input 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              value={cityInput} 
              onChange={onCityInputChange}
              onFocus={onCityInputFocus}
              onBlur={onCityInputBlur}
              placeholder="Search for cities..."
              disabled={selectedCities.length >= 3}
            />
            
            {/* Autocomplete suggestions */}
            {showSuggestions && filteredCities.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredCities.map((city, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                    onMouseDown={(e) => {
                      e.preventDefault() // Prevent blur event
                      onAddCity(city)
                    }}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-500">
            Select up to 3 cities from our database. {3 - selectedCities.length} remaining.
          </p>
        </div>
      </QuestionCard>
    )
  })
  CitySelector.displayName = 'CitySelector'

  return (
    <section className="max-w-2xl mx-auto space-y-5">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Climate Preference Questionnaire</h1>
        <p className="text-gray-600">Help us find the perfect city for your climate preferences</p>
      </div>

      <SliderQuestion
        title="1. What's your preferred average temperature?"
        value={avgTemp}
        min={-10}
        max={35}
        onChange={handleAvgTempChange}
        color="#3b82f6"
      />

      <SliderQuestion
        title="2. What's the highest summer temperature you can tolerate?"
        value={maxSummer}
        min={20}
        max={45}
        onChange={handleMaxSummerChange}
        color="#ef4444"
      />

      <SliderQuestion
        title="3. What's the lowest winter temperature you can tolerate?"
        value={minWinter}
        min={-30}
        max={20}
        onChange={handleMinWinterChange}
        color="#06b6d4"
      />

      <SliderQuestion
        title="4. Do you like large temperature variations?"
        value={tempVariation}
        min={0}
        max={10}
        onChange={handleTempVariationChange}
        color="#8b5cf6"
        unit=""
        formatValue={formatTempVariation}
      />

      <RadioQuestion
        title="5. What's your precipitation preference?"
        value={precipitation}
        onChange={handlePrecipitationChange}
        name="precipitation"
        options={[
          { value: 'low', label: 'Low rainfall year-round' },
          { value: 'moderate', label: 'Moderate rainfall year-round' },
          { value: 'high', label: 'High rainfall year-round' },
          { value: 'seasonal', label: 'Distinct rainy season' }
        ]}
      />

      <QuestionCard title="6. What's your humidity preference?">
        <div className="flex gap-4 justify-center">
          {[
            { value: 'dry', label: 'Dry' },
            { value: 'humid', label: 'Humid' },
            { value: 'no-preference', label: 'No preference' }
          ].map(option => (
            <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="humidity"
                value={option.value}
                checked={humidity === option.value}
                onChange={handleHumidityChange}
                className="text-blue-600"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </QuestionCard>

      <CitySelector
        favoriteCities={favoriteCities}
        cityInput={cityInput}
        filteredCities={filteredCities}
        showSuggestions={showSuggestions}
        onCityInputChange={handleCityInputChange}
        onCityInputFocus={handleCityInputFocus}
        onCityInputBlur={handleCityInputBlur}
        onAddCity={addCity}
        onRemoveCity={removeCity}
      />

      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        <input 
          id="save" 
          type="checkbox" 
          checked={save} 
          onChange={handleSaveChange}
          className="text-blue-600"
        />
        <label htmlFor="save" className="text-sm text-gray-700">
          Save results to my profile (overwrites previous preferences)
        </label>
      </div>

      <button 
        onClick={submit} 
        disabled={isLoading}
        className="w-full px-6 py-3 rounded-lg bg-black text-white font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
        {isLoading ? 'Submitting...' : 'Submit Questionnaire'}
      </button>
    </section>
  )
}
