'use client'

export interface Continent {
  name: string
  center: [number, number]
  zoom: number
  icon: string
}

export const continents: Continent[] = [
  { name: 'Asia', center: [35, 105], zoom: 3, icon: '🌏' },
  { name: 'Europe', center: [54, 15], zoom: 4, icon: '🌍' },
  { name: 'Africa', center: [0, 20], zoom: 3, icon: '🌍' },
  { name: 'North America', center: [45, -100], zoom: 3, icon: '🌎' },
  { name: 'South America', center: [-15, -60], zoom: 3, icon: '🌎' },
  { name: 'Oceania', center: [-25, 140], zoom: 4, icon: '🌏' },
  { name: 'World', center: [20, 0], zoom: 2, icon: '🌐' }
]

interface Props {
  onContinentSelect: (continent: Continent) => void
  selectedContinent: string | null
}

export default function ContinentSelector({ onContinentSelect, selectedContinent }: Props) {
  return (
    <div className="bg-white bg-opacity-98 rounded-lg border-2 border-gray-300 shadow-2xl p-3 backdrop-blur-sm continent-selector">
      <h3 className="text-xs font-semibold text-gray-900 mb-2">Regions</h3>
      <div className="space-y-1">
        {continents.map((continent) => (
          <button
            key={continent.name}
            onClick={() => onContinentSelect(continent)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
              selectedContinent === continent.name
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm'
            }`}
          >
            <span className="text-sm">{continent.icon}</span>
            <span>{continent.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
