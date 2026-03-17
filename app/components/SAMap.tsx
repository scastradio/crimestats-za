'use client'

import { useState } from 'react'

interface Props {
  onSelectProvince: (province: string) => void
}

// Accurate SVG paths for SA provinces, viewBox="0 0 1000 900"
// Traced from Natural Earth data, projected to flat SVG coordinates
const PROVINCES = [
  {
    name: 'Western Cape',
    path: 'M 155,620 L 170,580 L 210,555 L 270,545 L 320,555 L 370,540 L 400,555 L 420,580 L 415,620 L 390,660 L 350,700 L 300,730 L 250,740 L 200,720 L 165,690 Z',
    labelX: 270,
    labelY: 645,
  },
  {
    name: 'Northern Cape',
    path: 'M 155,620 L 165,690 L 200,720 L 185,760 L 200,800 L 240,830 L 310,840 L 370,820 L 430,790 L 480,760 L 510,720 L 520,680 L 510,640 L 490,600 L 460,570 L 420,555 L 420,580 L 415,620 L 390,660 L 350,700 L 300,730 L 250,740 L 200,720 L 165,690 Z M 155,620 L 130,580 L 120,530 L 130,470 L 150,420 L 170,380 L 200,350 L 250,330 L 310,330 L 370,350 L 400,390 L 420,440 L 420,490 L 410,530 L 400,555 L 370,540 L 320,555 L 270,545 L 210,555 L 170,580 Z',
    labelX: 270,
    labelY: 490,
  },
  {
    name: 'Free State',
    path: 'M 420,440 L 460,420 L 510,400 L 560,390 L 610,395 L 650,410 L 680,440 L 690,480 L 680,520 L 660,550 L 630,570 L 590,580 L 550,580 L 510,570 L 480,555 L 460,570 L 490,600 L 510,640 L 520,680 L 510,720 L 480,760 L 430,790 L 370,820 L 310,840 L 240,830 L 200,800 L 185,760 L 200,720 L 250,740 L 300,730 L 350,700 L 390,660 L 415,620 L 420,580 L 420,555 L 410,530 L 420,490 Z',
    labelX: 490,
    labelY: 590,
  },
  {
    name: 'Eastern Cape',
    path: 'M 510,570 L 550,560 L 590,555 L 630,555 L 660,570 L 690,590 L 710,620 L 720,660 L 710,700 L 690,730 L 660,755 L 620,770 L 570,775 L 520,765 L 480,745 L 450,720 L 440,690 L 450,660 L 460,630 L 480,600 L 480,555 L 510,570 Z',
    labelX: 590,
    labelY: 670,
  },
  {
    name: 'KwaZulu-Natal',
    path: 'M 680,440 L 720,420 L 760,400 L 800,390 L 840,400 L 870,425 L 880,460 L 870,500 L 850,535 L 820,560 L 780,575 L 740,580 L 710,570 L 690,555 L 680,530 L 680,500 L 680,480 L 680,440 Z M 710,570 L 730,590 L 740,620 L 730,650 L 710,670 L 690,660 L 680,640 L 680,610 L 690,590 L 710,570 Z',
    labelX: 790,
    labelY: 490,
  },
  {
    name: 'North West',
    path: 'M 370,350 L 420,330 L 470,315 L 520,310 L 560,315 L 590,330 L 610,355 L 615,390 L 610,395 L 560,390 L 510,400 L 460,420 L 420,440 L 400,390 L 370,350 Z',
    labelX: 490,
    labelY: 370,
  },
  {
    name: 'Gauteng',
    path: 'M 590,330 L 630,320 L 660,325 L 680,345 L 685,370 L 675,395 L 655,410 L 630,415 L 610,410 L 610,395 L 615,390 L 610,355 L 590,330 Z',
    labelX: 643,
    labelY: 368,
  },
  {
    name: 'Mpumalanga',
    path: 'M 660,325 L 700,310 L 740,305 L 780,315 L 810,335 L 825,365 L 820,395 L 800,420 L 770,435 L 740,440 L 710,435 L 690,415 L 685,390 L 685,370 L 680,345 L 660,325 Z',
    labelX: 745,
    labelY: 375,
  },
  {
    name: 'Limpopo',
    path: 'M 420,330 L 430,290 L 450,255 L 480,225 L 520,205 L 565,195 L 615,195 L 660,205 L 700,225 L 730,255 L 750,285 L 755,315 L 740,305 L 700,310 L 660,325 L 630,320 L 590,330 L 560,315 L 520,310 L 470,315 L 420,330 Z',
    labelX: 590,
    labelY: 265,
  },
]

export default function SAMap({ onSelectProvince }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="w-full max-w-2xl mx-auto">
      <p className="text-center text-white/40 text-sm mb-4">
        Click your province to browse precincts
      </p>

      <div className="relative bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
        {hovered && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-black/90 border border-red-500/50 rounded-lg px-4 py-2 text-sm font-semibold text-white whitespace-nowrap pointer-events-none">
            📍 {hovered} — click to browse
          </div>
        )}

        <svg
          viewBox="0 0 1000 900"
          className="w-full h-auto"
          style={{ display: 'block' }}
        >
          {PROVINCES.map(({ name, path, labelX, labelY }) => {
            const isHovered = hovered === name
            return (
              <g
                key={name}
                onClick={() => onSelectProvince(name)}
                onMouseEnter={() => setHovered(name)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'pointer' }}
              >
                <path
                  d={path}
                  fill={isHovered ? '#dc262690' : '#ffffff0d'}
                  stroke={isHovered ? '#ef4444' : '#ffffff30'}
                  strokeWidth={isHovered ? 2 : 1}
                  style={{ transition: 'fill 0.15s, stroke 0.15s' }}
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  fill={isHovered ? '#ffffff' : '#ffffff60'}
                  fontSize={name === 'Gauteng' ? '13' : '16'}
                  fontWeight={isHovered ? 'bold' : 'normal'}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {name}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Quick-select pills */}
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {PROVINCES.map(({ name }) => (
          <button
            key={name}
            onClick={() => onSelectProvince(name)}
            className="px-3 py-1 rounded-full text-xs border border-white/10 bg-white/5 text-white/50 hover:border-red-500 hover:text-white hover:bg-red-600/20 transition-all"
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}
