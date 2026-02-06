"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { Language, useTranslation } from "@/lib/i18n"

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (path: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('english')
  const { t } = useTranslation(language)

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('k8s-language') as Language
    if (savedLanguage && ['english', 'spanish', 'french', 'german'].includes(savedLanguage)) {
      setLanguageState(savedLanguage)
    }
  }, [])

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
    localStorage.setItem('k8s-language', newLanguage)
    
    // Update HTML lang attribute
    document.documentElement.lang = newLanguage === 'english' ? 'en' : 
                                   newLanguage === 'spanish' ? 'es' :
                                   newLanguage === 'french' ? 'fr' : 'de'
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
