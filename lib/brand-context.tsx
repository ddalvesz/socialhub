'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import type { Brand } from './types'

interface BrandContextValue {
  brand: Brand
  setBrand: (b: Brand) => void
}

const BrandContext = createContext<BrandContextValue>({
  brand: 'gocase',
  setBrand: () => {},
})

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrandState] = useState<Brand>('gocase')

  useEffect(() => {
    const stored = localStorage.getItem('activeBrand') as Brand | null
    if (stored) setBrandState(stored)
  }, [])

  const setBrand = (b: Brand) => {
    setBrandState(b)
    localStorage.setItem('activeBrand', b)
  }

  return (
    <BrandContext.Provider value={{ brand, setBrand }}>
      {children}
    </BrandContext.Provider>
  )
}

export const useBrand = () => useContext(BrandContext)
