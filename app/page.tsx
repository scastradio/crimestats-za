'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const SAMap = dynamic(() => import('./components/SAMap'), { ssr: false })

interface Station {
  code: string
  name: string
  province: string
  cluster: string
}

const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
  'Free State', 'Mpumalanga', 'Limpopo', 'North West', 'Northern Cape'
]

export default function HomePage() {
  const [search, setSearch] = useState('')
  const [province, setProvince] = useState('All')
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [subscribeStation, setSubscribeStation] = useState('')
  const [subSuccess, setSubSuccess] = useState(false)
  const [totalStations, setTotalStations] = useState(0)
  const [lastUpdated, setLastUpdated] = useState('Q3 2025')
  const [view, setView] = useState<'map' | 'list'>('map')
  const [allStations, setAllStations] = useState<{code: string; name: string; province: string}[]>([])

  useEffect(() => { loadStats(); loadAllStations() }, [])

  useEffect(() => {
    if (view === 'list' || province !== 'All') loadStations()
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

  async function loadAllStations() {
    // Load all stations in batches for the alert signup dropdown
    const { data } = await supabase.from('stations').select('code,name,province').order('province').order('name').limit(1200)
    setAllStations(data || [])
  }

  async function loadStats() {
    const { count: stCount } = await supabase.from('stations').select('*', { count: 'exact', head: true })
    const { data: latest } = await supabase
      .from('crime_stats')
      .select('year,quarter')
      .order('year', { ascending: false })
      .order('quarter', { ascending: false })
      .limit(1)
    setTotalStations(stCount || 0)
    if (latest?.[0]) {
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

  function handleProvinceSelect(p: string) {
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

      {/* View toggle */}
      <section className="px-6 max-w-5xl mx-auto mb-6">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => { setView('map'); setProvince('All') }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'map' ? 'bg-red-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
          >
            🗺 Map
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'list' ? 'bg-red-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
          >
            ☰ List
          </button>
          {province !== 'All' && (
            <button
              onClick={() => { setProvince('All'); setView('map') }}
              className="px-3 py-2 rounded-lg text-sm text-white/40 hover:text-white transition-colors"
            >
              ← Back to map
            </button>
          )}
          {province !== 'All' && (
            <span className="text-sm text-red-400 font-medium">📍 {province}</span>
          )}
        </div>

        {/* MAP */}
        {view === 'map' && (
          <SAMap onSelectProvince={handleProvinceSelect} />
        )}

        {/* LIST */}
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
                {PROVINCES.map(p => (
                  <option key={p} value={p} className="bg-[#1a1a1a]">{p}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="text-center py-12 text-white/30">Loading stations...</div>
            ) : (
              <>
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
                </div>
                {stations.length === 0 && (
                  <div className="text-center py-12 text-white/30">No stations found.</div>
                )}
              </>
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
                {allStations.map(s => (
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
