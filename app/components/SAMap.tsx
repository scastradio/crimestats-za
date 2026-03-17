'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'

const GEO_URL = '/sa-provinces.geojson'

const PROVINCE_NAME_MAP: Record<string, string> = {
  'Northern Cape': 'Northern Cape',
  'KwaZulu-Natal': 'KwaZulu-Natal',
  'Free State': 'Free State',
  'Eastern Cape': 'Eastern Cape',
  'Limpopo': 'Limpopo',
  'North West': 'North West',
  'Mpumalanga': 'Mpumalanga',
  'Western Cape': 'Western Cape',
  'Gauteng': 'Gauteng',
}

interface Props {
  onSelectProvince: (province: string) => void
}

export default function SAMap({ onSelectProvince }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <p className="text-center text-white/40 text-sm mb-3">
        Click a province to browse its precincts
      </p>

      <div className="relative bg-white/3 border border-white/10 rounded-2xl overflow-hidden p-2">
        {/* Hover tooltip */}
        {hovered && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-black/90 border border-red-500/60 rounded-lg px-4 py-2 text-sm font-semibold text-white whitespace-nowrap pointer-events-none">
            📍 {hovered} — click to browse
          </div>
        )}

        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [25, -29], scale: 1100 }}
          width={600}
          height={480}
          style={{ width: '100%', height: 'auto' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => {
                const rawName: string = geo.properties.name || geo.properties.NAME || geo.properties.woe_name || ''
                const provinceName = PROVINCE_NAME_MAP[rawName] || rawName
                const isHovered = hovered === provinceName

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => onSelectProvince(provinceName)}
                    onMouseEnter={() => setHovered(provinceName)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      default: {
                        fill: isHovered ? '#dc2626' : '#ffffff0d',
                        stroke: '#ffffff25',
                        strokeWidth: 0.8,
                        outline: 'none',
                        cursor: 'pointer',
                      },
                      hover: {
                        fill: '#dc2626',
                        stroke: '#ff6666',
                        strokeWidth: 1.2,
                        outline: 'none',
                        cursor: 'pointer',
                      },
                      pressed: {
                        fill: '#991b1b',
                        outline: 'none',
                      },
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      {/* Province pills */}
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {Object.values(PROVINCE_NAME_MAP).map(p => (
          <button
            key={p}
            onClick={() => onSelectProvince(p)}
            className="px-3 py-1 rounded-full text-xs border border-white/10 bg-white/5 text-white/50 hover:border-red-500 hover:text-white hover:bg-red-600/20 transition-all"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}
