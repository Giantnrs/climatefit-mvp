
'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import { getToken } from '@/lib/auth'
import { apiFetch } from '@/lib/api'

// City database will be loaded from DynamoDB API

const QuestionCard = memo(({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
    <h3 className="text-lg font-medium text-gray-900 mb-3">{title}</h3>
    {children}
  </div>
))
QuestionCard.displayName = 'QuestionCard'

export default function OnboardingPage(){
  const router = useRouter()
  
  // Check authentication and load cities on component mount
  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push('/login')
      return
    }
    
    // Load cities from API
    const loadCities = async () => {
      try {
        setCitiesLoading(true)
        const cities = await apiFetch('/api/cities')
        setCityDatabase(cities)
      } catch (error) {
        console.error('Failed to load cities:', error)
        // Set empty array if API fails
        setCityDatabase([])
      } finally {
        setCitiesLoading(false)
      }
    }
    
    loadCities()
  }, [router])

  // Form state
  const [avgTemp, setAvgTemp] = useState(20)        // -10 to 35
  const [maxSummer, setMaxSummer] = useState(30)    // 20 to 45
  const [minWinter, setMinWinter] = useState(0)     // -30 to 20
  const [tempVariation, setTempVariation] = useState(5) // 0-10 (不喜欢 to 喜欢)
  const [precipitation, setPrecipitation] = useState('moderate') // rainfall preference
  const [humidity, setHumidity] = useState('no-preference') // humidity preference
  const [save, setSave] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [citySearch, setCitySearch] = useState('')
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [cityDatabase, setCityDatabase] = useState<string[]>([])
  const [citiesLoading, setCitiesLoading] = useState(true)
  const cityInputRef = useRef<HTMLInputElement>(null)

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
    e.preventDefault()
    setPrecipitation(e.target.value)
  }, [])

  const handleHumidityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setHumidity(e.target.value)
  }, [])

  const handleSaveChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSave(e.target.checked)
  }, [])

  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
  }, [])

  // Format functions for sliders
  const formatTempVariation = useCallback((value: number) => {
    if (value <= 3) return 'Dislike'
    if (value <= 6) return 'Neutral'
    return 'Like'
  }, [])

  // 新的城市搜索和选择逻辑
  const handleCitySearch = useCallback((value: string) => {
    setCitySearch(value)
  }, [])

  const handleCitySearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleCitySearch(e.target.value)
  }, [handleCitySearch])

  const addSelectedCity = useCallback((cityName: string) => {
    setSelectedCities(prev => {
      if (prev.length < 3 && !prev.includes(cityName)) {
        return [...prev, cityName]
      }
      return prev
    })
    setCitySearch('')
  }, [])

  const removeSelectedCity = useCallback((cityToRemove: string) => {
    setSelectedCities(prev => prev.filter(city => city !== cityToRemove))
  }, [])

  const handleRemoveCity = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const city = e.currentTarget.dataset.city
    if (city) removeSelectedCity(city)
  }, [removeSelectedCity])

  const handleAddCity = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const city = e.currentTarget.dataset.city
    if (city) addSelectedCity(city)
  }, [addSelectedCity])

  const filteredCities = useMemo(() => {
    if (!citySearch || cityDatabase.length === 0) return []
    return cityDatabase
      .filter(city =>
        city.toLowerCase().includes(citySearch.toLowerCase()) &&
        !selectedCities.includes(city)
      )
      .slice(0, 8)
  }, [citySearch, cityDatabase, selectedCities])

  async function submit(e?: React.MouseEvent<HTMLButtonElement>){
    e?.preventDefault()
    if (!getToken()) {
      router.push('/login')
      return
    }

    // 验证选择的城市
    const invalidCities = selectedCities.filter(city => !cityDatabase.includes(city))
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
        favoriteCities: selectedCities,
        save
      }
      
      await apiFetch('/results', {
        method: 'POST',
        json: payload
      })

      // Always store locally for results page access
      localStorage.setItem('cf_onboarding', JSON.stringify(payload))
      
      // If user chose to save, trigger storage event for other tabs/windows
      if (save) {
        // Trigger storage event for other tabs/windows
        window.dispatchEvent(new Event('storage'))
      }
      
      // Always trigger profile update event after successful submission
      // This will update both preferences (if saved) and history
      window.dispatchEvent(new Event('profileUpdate'))
      
      router.push('/results')
    } catch (error) {
      console.error('Submission error:', error)
      alert('Failed to submit questionnaire. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Memoized components to prevent re-rendering

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


  return (
    <form onSubmit={handleFormSubmit}>
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

      <QuestionCard title="7. List 3 cities with climates you love (for positive matching)">
        <div className="space-y-4">
          {/* 已选择的城市 */}
          {selectedCities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedCities.map((city, index) => (
                <div
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm"
                >
                  {city}
                  <button
                    type="button"
                    data-city={city}
                    onClick={handleRemoveCity}
                    className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 搜索输入框 */}
          <div className="relative">
            <input
              ref={cityInputRef}
              type="text"
              value={citySearch}
              onChange={handleCitySearchChange}
              placeholder={citiesLoading ? "Loading cities..." : "Search for cities..."}
              disabled={selectedCities.length >= 3 || citiesLoading}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />

            {/* 搜索建议 */}
            {citySearch && filteredCities.length > 0 && selectedCities.length < 3 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredCities.map((city, index) => (
                  <button
                    key={index}
                    type="button"
                    data-city={city}
                    onClick={handleAddCity}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50 border-none bg-transparent cursor-pointer"
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 提示信息 */}
          <p className="text-sm text-gray-500">
            {citiesLoading
              ? "Loading cities from database..."
              : `Select up to 3 cities from our database (${cityDatabase.length} cities available). ${3 - selectedCities.length} remaining.`
            }
          </p>
        </div>
      </QuestionCard>

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
        type="button"
        onClick={submit}
        disabled={isLoading}
        className="w-full px-6 py-3 rounded-lg bg-black text-white font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
        {isLoading ? 'Submitting...' : 'Submit Questionnaire'}
      </button>
    </section>
    </form>
  )
}
