'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Station {
  code: string
  name: string
  province: string
}

const COOKIE_NAME = 'csza_user_registered'
const COOKIE_DAYS = 365

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

interface Props {
  children: React.ReactNode
}

export default function UserGate({ children }: Props) {
  const [show, setShow] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [precinct, setPrecinct] = useState('')
  const [marketing, setMarketing] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stations, setStations] = useState<Station[]>([])
  const [stationSearch, setStationSearch] = useState('')

  useEffect(() => {
    const existing = getCookie(COOKIE_NAME)
    if (!existing) {
      const t = setTimeout(() => setShow(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    if (!show) return
    supabase.from('stations').select('code,name,province').order('province').order('name').limit(1200)
      .then(({ data }) => setStations(data || []))
  }, [show])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !email.trim() || !phone.trim() || !precinct) {
      setError('Please fill in all fields including your police precinct.')
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    try {
      await supabase.from('users').upsert(
        { name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), precinct_code: precinct, marketing_opt_in: marketing },
        { onConflict: 'email' }
      )
      // Also subscribe them to their precinct alerts
      await supabase.from('subscriptions').upsert(
        { email: email.trim().toLowerCase(), station_code: precinct },
        { onConflict: 'email,station_code' }
      )
      setCookie(COOKIE_NAME, email.trim().toLowerCase(), COOKIE_DAYS)
      setShow(false)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {children}
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            {/* Logo */}
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-white">SafeStats <span className="text-red-500">ZA</span></h1>
              <p className="text-white/40 text-sm mt-1">Free SA crime statistics · safestats.co.za</p>
            </div>

            <h2 className="text-lg font-semibold text-white mb-1">Create your free account</h2>
            <p className="text-white/40 text-sm mb-6">Quick setup — takes 30 seconds. Get quarterly alerts for your area.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wide mb-1.5 block">Full Name</label>
                <input
                  type="text"
                  placeholder="John Smith"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wide mb-1.5 block">Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wide mb-1.5 block">Contact Number</label>
                <input
                  type="tel"
                  placeholder="+27 82 000 0000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-white/50 uppercase tracking-wide mb-1.5 block">Your Police Precinct</label>
                <input
                  type="text"
                  placeholder="Search your area..."
                  value={stationSearch}
                  onChange={e => setStationSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-red-500 transition-colors mb-1.5"
                />
                <select
                  value={precinct}
                  onChange={e => setPrecinct(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="" className="bg-[#1a1a1a]">
                    {stations.length === 0 ? 'Loading precincts...' : 'Select your precinct...'}
                  </option>
                  {stations
                    .filter(s => !stationSearch || s.name.toLowerCase().includes(stationSearch.toLowerCase()) || s.province.toLowerCase().includes(stationSearch.toLowerCase()))
                    .map(s => (
                      <option key={s.code} value={s.code} className="bg-[#1a1a1a]">
                        {s.name} ({s.province})
                      </option>
                    ))}
                </select>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={e => setMarketing(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border transition-colors ${marketing ? 'bg-red-600 border-red-600' : 'bg-transparent border-white/30'} flex items-center justify-center`}>
                    {marketing && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                </div>
                <span className="text-xs text-white/40 leading-relaxed">
                  I'd like to receive quarterly crime alert emails and occasional product updates. You can unsubscribe at any time. <span className="text-white/20">(optional)</span>
                </span>
              </label>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors mt-1"
              >
                {loading ? 'Saving...' : 'Get Free Access →'}
              </button>

              <p className="text-center text-white/20 text-xs">
                No credit card. No spam. SA crime data, free forever.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
