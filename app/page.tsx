'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Station {
  code: string
  name: string
  province: string
  cluster: string
}

const PROVINCE_COORDS: Record<string, { x: number; y: number; label: string }> = {
  'Limpopo':       { x: 62, y: 18, label: 'Limpopo' },
  'North West':    { x: 42, y: 32, label: 'North West' },
  'Gauteng':       { x: 57, y: 35, label: 'Gauteng' },
  'Mpumalanga':    { x: 70, y: 35, label: 'Mpumalanga' },
  'Free State':    { x: 52, y: 52, label: 'Free State' },
  'KwaZulu-Natal': { x: 75, y: 55, label: 'KZN' },
  'Northern Cape': { x: 28, y: 52, label: 'N. Cape' },
  'Eastern Cape':  { x: 58, y: 72, label: 'Eastern Cape' },
  'Western Cape':  { x: 28, y: 78, label: 'Western Cape' },
}

export default function HomePage() {
  const [search, setSearch] = useState('')
  const [province, setProvince] = useState('All')
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [subscribeStation, setSubscribeStation] = useState('')
  const [subSuccess, setSubSuccess] = useState(false)
  const [totalStations, setTotalStations] = useState(0)
  const [lastUpdated, setLastUpdated] = useState('Q3 2025')
  const [view, setView] = useState<'map' | 'list'>('map')
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    if (view === 'list' || province !== 'All') {
      loadStations()
    }
  }, [search, province, view])

  async function loadStations() {
    setLoading(true)
    let query = supabase.from('stations').select('*').order('name')
    if (province !== 'All') query = query.eq('province', province)
    if (search) query = query.ilike('name', `%${search}%`)
    const { data } = await query.limit(100)
    setStations(data || [])
    setLoading(false)
  }

  async function loadStats() {
    const { count: stCount } = await supabase.from('stations').select('*', { count: 'exact', head: true })
    // Get latest quarter from DB
    const { data: latest } = await supabase
      .from('crime_stats')
      .select('year,quarter')
      .order('year', { ascending: false })
      .order('quarter', { ascending: false })
      .limit(1)
    setTotalStations(stCount || 0)
    if (latest && latest[0]) {
      const qNames = ['', 'Q1 (Apr–Jun)', 'Q2 (Jul–Sep)', 'Q3 (Oct–Dec)', 'Q4 (Jan–Mar)']
      setLastUpdated(`${qNames[latest[0].quarter]} ${latest[0].year}`)
    }
  }

  async function subscribe() {
    if (!email || !subscribeStation) return
    const { error } = await supabase.from('subscriptions').upsert(
      { email, station_code: subscribeStation },
      { onConflict: 'email,station_code' }
    )
    if (!error) { setSubSuccess(true); setEmail(''); setSubscribeStation('') }
  }

  function selectProvince(p: string) {
    setProvince(p)
    setView('list')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">CrimeStats <span className="text-red-500">ZA</span></h1>
          <p className="text-xs text-white/40 mt-0.5">Real SAPS data · Free · Updated quarterly</p>
        </div>
        <a href="#alerts" className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
          Get Alerts
        </a>
      </header>

      {/* Hero */}
      <section className="px-6 pt-10 pb-6 max-w-5xl mx-auto text-center">
        <h2 className="text-4xl font-extrabold mb-3">
          Know What's Happening In <span className="text-red-500">Your Area</span>
        </h2>
        <p className="text-white/50 text-lg max-w-xl mx-auto mb-8">
          Real SAPS crime data for 1,100+ police precincts. Trends, rankings, and instant alerts when stats change.
        </p>
        <div className="flex gap-8 justify-center flex-wrap mb-6">
          {[
            { label: 'Police Precincts', value: totalStations ? totalStations.toLocaleString() : '1,180' },
            { label: 'Years of Data', value: '5+' },
            { label: 'Crime Categories', value: '30+' },
            { label: 'Last Updated', value: lastUpdated },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-red-500">{s.value}</div>
              <div className="text-xs text-white/40 uppercase tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Map / List toggle */}
      <section className="px-6 max-w-5xl mx-auto mb-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => { setView('map'); setProvince('All') }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'map' ? 'bg-red-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
          >
            🗺 Map View
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'list' ? 'bg-red-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
          >
            ☰ List View
          </button>
          {province !== 'All' && (
            <button
              onClick={() => { setProvince('All'); setView('map') }}
              className="px-3 py-2 rounded-lg text-sm text-white/40 hover:text-white transition-colors"
            >
              ← Back to map
            </button>
          )}
        </div>

        {/* MAP VIEW */}
        {view === 'map' && (
          <div className="relative w-full max-w-2xl mx-auto">
            <p className="text-center text-white/40 text-sm mb-4">Click your province to browse precincts</p>
            {/* SA map SVG outline */}
            <div className="relative bg-white/3 border border-white/10 rounded-2xl overflow-hidden" style={{paddingBottom: '85%'}}>
              <svg
                viewBox="0 0 100 90"
                className="absolute inset-0 w-full h-full"
                style={{background: 'transparent'}}
              >
                {/* Simple SA provinces as clickable regions using approximate polygon paths */}
                {/* Western Cape */}
                <polygon points="20,65 42,62 45,72 38,85 20,85 15,78" 
                  fill={hoveredProvince === 'Western Cape' ? '#dc262680' : '#ffffff08'}
                  stroke={hoveredProvince === 'Western Cape' ? '#dc2626' : '#ffffff20'}
                  strokeWidth="0.5"
                  className="cursor-pointer transition-all"
                  onClick={() => selectProvince('Western Cape')}
                  onMouseEnter={() => setHoveredProvince('Western Cape')}
                  onMouseLeave={() => setHoveredProvince(null)}
                />
                {/* Northern Cape */}
                <polygon points="15,40 42,38 45,62 20,65 15,78 8,70 8,45"
                  fill={hoveredProvince === 'Northern Cape' ? '#dc262680' : '#ffffff08'}
                  stroke={hoveredProvince === 'Northern Cape' ? '#dc2626' : '#ffffff20'}
                  strokeWidth="0.5"
                  className="cursor-pointer transition-all"
                  onClick={() => selectProvince('Northern Cape')}
                  onMouseEnter={() => setHoveredProvince('Northern Cape')}
                  onMouseLeave={() => setHoveredProvince(null)}
                />
                {/* Eastern Cape */}
                <polygon points="42,62 65,58 75,65 70,80 50,88 38,85 45,72"
                  fill={hoveredProvince === 'Eastern Cape' ? '#dc262680' : '#ffffff08'}
                  stroke={hoveredProvince === 'Eastern Cape' ? '#dc2626' : '#ffffff20'}
                  strokeWidth="0.5"
                  className="cursor-pointer transition-all"
                  onClick={() => selectProvince('Eastern Cape')}
                  onMouseEnter={() => setHoveredProvince('Eastern Cape')}
                  onMouseLeave={() => setHoveredProvince(null)}
                />
                {/* Free State */}
                <polygon points="42,38 65,36 68,55 65,58 42,62 45,62"
                  fill={hoveredProvince === 'Free State' ? '#dc262680' : '#ffffff08'}
                  stroke={hoveredProvince === 'Free State' ? '#dc2626' : '#ffffff20'}
                  strokeWidth="0.5"
                  className="cursor-pointer transition-all"
                  onClick={() => selectProvince('Free State')}
                  onMouseEnter={() => setHoveredProvince('Free State')}
                  onMouseLeave={() => setHoveredProvince(null)}
                />
                {/* KwaZulu-Natal */}
                <polygon points="65,36 80,28 88,35 85,50 75,65 65,58 68,55"
                  fill={hoveredProvince === 'KwaZulu-Natal' ? '#dc262680' : '#ffffff08'}
                  stroke={hoveredProvince === 'KwaZulu-Natal' ? '#dc2626' : '#ffffff20'}
                  strokeWidth="0.5"
                  className="cursor-pointer transition-all"
                  onClick={() => selectProvince('KwaZulu-Natal')}
                  onMouseEnter={() => setHoveredProvince('KwaZulu-Natal')}
                  onMouseLeave={() => setHoveredProvince(null)}
                />
                {/* Gauteng */}
                <polygon points="52,28 62,26 65,36 55,38 50,35"
                  fill={hoveredProvince === 'Gauteng' ? '#dc262680' : '#ffffff15'}
                  stroke={hoveredProvince === 'Gauteng' ? '#dc2626' : '#ffffff40'}
                  strokeWidth="0.5"
                  className="cursor-pointer transition-all"
                  onClick={() => selectProvince('Gauteng')}
                  onMouseEnter={() => setHoveredProvince('Gauteng')}
                  onMouseLeave={() => setHoveredProvince(null)}
                />
                {/* North West */}
                <polygon points="30,22 52,20 52,28 50,35 42,38 30,36 25,28"
                  fill={hoveredProvince === 'North West' ? '#dc262680' : '#ffffff08'}
                  stroke={hoveredProvince === 'North West' ? '#dc2626' : '#ffffff20'}
                  strokeWidth="0.5"
                  className="cursor-pointer transition-all"
                  onClick={() => selectProvince('North West')}
                  onMouseEnter={() => setHoveredProvince('North West')}
                  onMouseLeave={() => setHoveredProvince(null)}
                />
                {/* Limpopo */}
                <polygon points="42,8 75,8 80,28 65,36 62,26 52,28 52,20 42,20"
                  fill={hoveredProvince === 'Limpopo' ? '#dc262680' : '#ffffff08'}
                  stroke={hoveredProvince === 'Limpopo' ? '#dc2626' : '#ffffff20'}
                  strokeWidth="0.5"
                  className="cursor-pointer transition-all"
                  onClick={() => selectProvince('Limpopo')}
                  onMouseEnter={() => setHoveredProvince('Limpopo')}
                  onMouseLeave={() => setHoveredProvince(null)}
                />
                {/* Mpumalanga */}
                <polygon points="62,26 80,28 75,8 75,8 78,20 80,28 65,36 62,26"
                  fill={hoveredProvince === 'Mpumalanga' ? '#dc262680' : '#ffffff08'}
                  stroke={hoveredProvince === 'Mpumalanga' ? '#dc2626' : '#ffffff20'}
                  strokeWidth="0.5"
                  className="cursor-pointer transition-all"
                  onClick={() => selectProvince('Mpumalanga')}
                  onMouseEnter={() => setHoveredProvince('Mpumalanga')}
                  onMouseLeave={() => setHoveredProvince(null)}
                />

                {/* Province labels */}
                {Object.entries(PROVINCE_COORDS).map(([prov, pos]) => (
                  <g key={prov} onClick={() => selectProvince(prov)} className="cursor-pointer"
                     onMouseEnter={() => setHoveredProvince(prov)}
                     onMouseLeave={() => setHoveredProvince(null)}>
                    {/* Red target crosshair */}
                    <circle cx={pos.x} cy={pos.y} r="2.5"
                      fill={hoveredProvince === prov ? '#dc2626' : '#dc262660'}
                      stroke="#dc2626" strokeWidth="0.5" />
                    <line x1={pos.x - 4} y1={pos.y} x2={pos.x - 2} y2={pos.y} stroke="#dc2626" strokeWidth="0.4" />
                    <line x1={pos.x + 2} y1={pos.y} x2={pos.x + 4} y2={pos.y} stroke="#dc2626" strokeWidth="0.4" />
                    <line x1={pos.x} y1={pos.y - 4} x2={pos.x} y2={pos.y - 2} stroke="#dc2626" strokeWidth="0.4" />
                    <line x1={pos.x} y1={pos.y + 2} x2={pos.x} y2={pos.y + 4} stroke="#dc2626" strokeWidth="0.4" />
                    <text x={pos.x} y={pos.y + 7} textAnchor="middle"
                      fill={hoveredProvince === prov ? '#ffffff' : '#ffffff80'}
                      fontSize="3.2" fontWeight={hoveredProvince === prov ? 'bold' : 'normal'}>
                      {pos.label}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Hover tooltip */}
              {hoveredProvince && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/80 border border-red-500/50 rounded-lg px-4 py-2 text-sm font-semibold text-white pointer-events-none">
                  {hoveredProvince} → click to browse precincts
                </div>
              )}
            </div>
          </div>
        )}

        {/* LIST VIEW */}
        {view === 'list' && (
          <div>
            <div className="flex gap-3 flex-wrap mb-4">
              <input
                type="text"
                placeholder="Search police station..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 min-w-[220px] bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500"
              />
              <select
                value={province}
                onChange={e => setProvince(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="All" className="bg-[#1a1a1a]">All Provinces</option>
                {Object.keys(PROVINCE_COORDS).map(p => (
                  <option key={p} value={p} className="bg-[#1a1a1a]">{p}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="text-center py-12 text-white/30">Loading stations...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stations.map(station => (
                  <Link key={station.code} href={`/station/${station.code}`}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-red-500/50 hover:bg-white/8 transition-all group">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors">{station.name}</h3>
                        <p className="text-xs text-white/40 mt-0.5">{station.province} · {station.cluster}</p>
                      </div>
                      <svg className="w-4 h-4 text-white/20 group-hover:text-red-500 mt-1 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
                {stations.length === 0 && (
                  <div className="col-span-3 text-center py-12 text-white/30">No stations found.</div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Alert Signup */}
      <section id="alerts" className="bg-white/5 border-y border-white/10 px-6 py-12 mt-8">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-2">Get Quarterly Crime Alerts</h2>
          <p className="text-white/50 mb-6 text-sm">We'll notify you the moment new SAPS stats drop for your precinct. Free.</p>
          {subSuccess ? (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-green-400">
              ✅ You're subscribed! We'll alert you when new stats drop.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500"
              />
              <select
                value={subscribeStation}
                onChange={e => setSubscribeStation(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="" className="bg-[#1a1a1a]">Select your police station...</option>
                {stations.map(s => (
                  <option key={s.code} value={s.code} className="bg-[#1a1a1a]">{s.name} ({s.province})</option>
                ))}
              </select>
              <button
                onClick={subscribe}
                disabled={!email || !subscribeStation}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                Alert Me
              </button>
            </div>
          )}
        </div>
      </section>

      <footer className="px-6 py-6 text-center text-white/20 text-xs border-t border-white/5">
        CrimeStats ZA · Data sourced from SAPS official quarterly statistics · Not affiliated with SAPS
      </footer>
    </div>
  )
}
