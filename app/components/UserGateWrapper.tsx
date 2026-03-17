'use client'

import dynamic from 'next/dynamic'

const UserGate = dynamic(() => import('./UserGate'), { ssr: false })

export default function UserGateWrapper({ children }: { children: React.ReactNode }) {
  return <UserGate>{children}</UserGate>
}
