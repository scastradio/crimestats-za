import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CrimeStats ZA — SA Crime Statistics & Alerts',
  description: 'Track crime trends across 1,100+ South African police precincts. 12 years of SAPS data, free quarterly alerts.',
  openGraph: {
    title: 'CrimeStats ZA',
    description: 'Track crime trends across South Africa. Free quarterly alerts.',
    siteName: 'CrimeStats ZA',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
