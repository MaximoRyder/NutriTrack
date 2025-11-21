'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import en from './en.json';
import es from './es.json';
import pt from './pt.json';

type Locale = 'en' | 'es' | 'pt';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: any) => string;
}

const translations: Record<Locale, any> = { en, es, pt };

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    const browserLang = navigator.language.split('-')[0];
    if (['en', 'es', 'pt'].includes(browserLang)) {
      setLocale(browserLang as Locale);
    }
  }, []);

  const t = (key: string, params?: any): string => {
    const keys = key.split('.');
    let result = translations[locale];
    for (const k of keys) {
      result = result?.[k];
      if (!result) {
        // Fallback to English if translation is not found
        let fallbackResult = translations['en'];
        for (const fk of keys) {
          fallbackResult = fallbackResult?.[fk];
        }
        result = fallbackResult || key;
        break;
      }
    }
    
    let finalResult = result || key;
    
    // Replace parameters in the string
    if (params && typeof finalResult === 'string') {
      Object.keys(params).forEach((paramKey) => {
        const placeholder = `{${paramKey}}`;
        finalResult = finalResult.replace(new RegExp(placeholder, 'g'), params[paramKey]);
      });
    }
    
    return finalResult;
  };
  
  const value = {
    locale,
    setLocale: (newLocale: Locale) => {
        setLocale(newLocale);
    },
    t,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
