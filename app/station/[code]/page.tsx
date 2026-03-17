'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface CrimeStat {
  category_code: string
  year: number
  quarter: number
  count: number
  crime_categories: { name: string; group_name: string }
}

interface Station {
  code: string
  name: string
  province: string
  cluster: string
}

const QUARTER_LABEL = (y: number, q: number) => `Q${q} ${y}`
const GROUP_COLORS: Record<string, string> = {
  contact: '#ef4444',
  contact_sexual: '#f97316',
  contact_robbery: '#f59e0b',
  property: '#3b82f6',
  other: '#8b5cf6',
}

export default function StationPage() {
  const { code } = useParams<{ code: string }>()
  const [station, setStation] = useState<Station | null>(null)
  const [stats, setStats] = useState<CrimeStat[]>([])
  const [selectedCategory, setSelectedCategory] = useState('murder')
  const [categories, setCategories] = useState<Array<{code: string, name: string, group_name: string}>>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [subDone, setSubDone] = useState(false)

  useEffect(() => {
    loadStation()
    loadStats()
    loadCategories()
  }, [code])

  async function loadStation() {
    const { data } = await supabase.from('stations').select('*').eq('code', code).single()
    setStation(data)
  }

  async function loadStats() {
    const { data } = await supabase
      .from('crime_stats')
      .select('*, crime_categories(name, group_name)')
      .eq('station_code', code)
      .order('year').order('quarter')
    setStats(data || [])
    setLoading(false)
  }

  async function loadCategories() {
    const { data } = await supabase.from('crime_categories').select('*').order('group_name').order('name')
    setCategories(data || [])
  }

  async function subscribe() {
    if (!email) return
    await supabase.from('subscriptions').upsert({ email, station_code: code }, { onConflict: 'email,station_code' })
    setSubDone(true)
  }

  // Build trend chart data for selected category
  const trendData = stats
    .filter(s => s.category_code === selectedCategory)
    .map(s => ({ label: QUARTER_LABEL(s.year, s.quarter), count: s.count, year: s.year, quarter: s.quarter }))

  // Latest quarter summary
  const latestYear = Math.max(...stats.map(s => s.year), 0)
  const latestQ = Math.max(...stats.filter(s => s.year === latestYear).map(s => s.quarter), 0)
  const latestStats = stats.filter(s => s.year === latestYear && s.quarter === latestQ)

  // Total crimes latest quarter
  const totalLatest = latestStats.reduce((sum, s) => sum + s.count, 0)

  // Top 5 crimes latest quarter
  const top5 = [...latestStats]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // YoY change for selected category
  const prevYearStat = stats.find(s => s.category_code === selectedCategory && s.year === latestYear - 1 && s.quarter === latestQ)
  const currentStat = stats.find(s => s.category_code === selectedCategory && s.year === latestYear && s.quarter === latestQ)
  const yoyChange = prevYearStat && currentStat && prevYearStat.count > 0
    ? ((currentStat.count - prevYearStat.count) / prevYearStat.count * 100).toFixed(1)
    : null

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
      <div className="text-white/30">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-white/40 hover:text-white transition-colors text-sm">← Back</Link>
        <div>
          <h1 className="text-lg font-bold">{station?.name} <span className="text-red-500">Police Station</span></h1>
          <p className="text-xs text-white/40">{station?.province} · {station?.cluster}</p>
        </div>
      </header>

      <main className="px-6 py-8 max-w-5xl mx-auto">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-2xl font-bold text-white">{totalLatest.toLocaleString()}</div>
            <div className="text-xs text-white/40 mt-1">Total crimes Q{latestQ} {latestYear}</div>
          </div>
          {top5.slice(0, 3).map(s => (
            <div key={s.category_code} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-red-400">{s.count.toLocaleString()}</div>
              <div className="text-xs text-white/40 mt-1 truncate">{s.crime_categories?.name}</div>
            </div>
          ))}
        </div>

        {/* Trend Chart */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="font-semibold text-white">Crime Trend (2020–2024)</h2>
              {yoyChange !== null && (
                <p className="text-xs mt-0.5">
                  <span className={parseFloat(yoyChange) > 0 ? 'text-red-400' : 'text-green-400'}>
                    {parseFloat(yoyChange) > 0 ? '▲' : '▼'} {Math.abs(parseFloat(yoyChange))}% vs last year
                  </span>
                </p>
              )}
            </div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-red-500"
            >
              {categories.map(c => (
                <option key={c.code} value={c.code} className="bg-[#1a1a1a]">{c.name}</option>
              ))}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#ef4444' }} />
              <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top crimes bar chart */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-white mb-4">Latest Quarter Breakdown</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={top5.map(s => ({ name: s.crime_categories?.name?.replace('Robbery with aggravating circumstances', 'Aggravated Robbery').slice(0, 20), count: s.count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#ef4444' }} />
              <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alert signup */}
        <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-6">
          <h2 className="font-semibold text-white mb-1">Get Alerted When New Stats Drop</h2>
          <p className="text-sm text-white/50 mb-4">We'll email you the moment SAPS releases new quarterly data for {station?.name}.</p>
          {subDone ? (
            <div className="text-green-400 text-sm">✅ Done! You'll get an email when new stats are published.</div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}
                className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500" />
              <button onClick={subscribe} disabled={!email}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors">
                Alert Me
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="px-6 py-6 text-center text-white/20 text-xs border-t border-white/5">
        CrimeStats ZA · Data sourced from SAPS official quarterly statistics
      </footer>
    </div>
  )
}
