'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SUPPORTED_COUNTRIES } from '@/lib/types';

/** Lightweight country selection type for the UI context */
export interface SelectedCountry {
  name: string;
  code: string;
  flag: string;
}

interface CountryContextValue {
  selectedCountry: SelectedCountry | null;
  setSelectedCountry: (country: SelectedCountry) => void;
  countries: SelectedCountry[];
}

const CountryContext = createContext<CountryContextValue>({
  selectedCountry: null,
  setSelectedCountry: () => {},
  countries: SUPPORTED_COUNTRIES,
});

export function CountryProvider({ children }: { children: ReactNode }) {
  const [selectedCountry, setSelectedCountry] = useState<SelectedCountry | null>(null);

  useEffect(() => {
    if (!selectedCountry && SUPPORTED_COUNTRIES.length > 0) {
      setSelectedCountry(SUPPORTED_COUNTRIES[0]);
    }
  }, [selectedCountry]);

  return (
    <CountryContext.Provider
      value={{
        selectedCountry,
        setSelectedCountry,
        countries: SUPPORTED_COUNTRIES,
      }}
    >
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const context = useContext(CountryContext);
  if (!context) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return context;
}
