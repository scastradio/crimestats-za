import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import UserGateWrapper from './components/UserGateWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SafeStats ZA — South Africa Crime Statistics & Alerts',
  description: 'Free crime statistics for 1,100+ South African police precincts. Real SAPS data, quarterly updates, instant alerts for your area.',
  openGraph: {
    title: 'SafeStats ZA',
    description: 'Free crime statistics for every South African police precinct. Real SAPS data, quarterly alerts.',
    siteName: 'SafeStats ZA',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserGateWrapper>{children}</UserGateWrapper>
      </body>
    </html>
  )
}
