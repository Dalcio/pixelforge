'use client';

import { useCallback, useEffect, useState } from 'react';

type TranslationFunction = (key: string, params?: Record<string, string | number>) => string;

// Simple in-memory cache for translations
const translationCache: Record<string, Record<string, Record<string, string>>> = {};

export function useTranslations(namespace: string): TranslationFunction {
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [locale, setLocale] = useState<string>('en');

  useEffect(() => {
    // Get locale from cookie, localStorage, or navigator
    const savedLocale = 
      document.cookie.match(/locale=([^;]+)/)?.[1] ||
      localStorage.getItem('locale') ||
      navigator.language.split('-')[0] ||
      'en';
    setLocale(savedLocale);
  }, []);

  useEffect(() => {
    async function loadTranslations() {
      // Check cache first
      if (translationCache[locale]?.[namespace]) {
        setTranslations(translationCache[locale][namespace]);
        return;
      }

      try {
        const response = await fetch(`/locales/${locale}/${namespace}.json`);
        if (response.ok) {
          const data = await response.json();
          
          // Update cache
          if (!translationCache[locale]) {
            translationCache[locale] = {};
          }
          translationCache[locale][namespace] = data;
          
          setTranslations(data);
        }
      } catch (error) {
        console.error(`Failed to load translations for ${namespace}:`, error);
        
        // Fallback to English
        if (locale !== 'en') {
          try {
            const fallbackResponse = await fetch(`/locales/en/${namespace}.json`);
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              setTranslations(fallbackData);
            }
          } catch {
            // Ignore fallback errors
          }
        }
      }
    }

    if (locale && namespace) {
      loadTranslations();
    }
  }, [locale, namespace]);

  const t: TranslationFunction = useCallback((key: string, params?: Record<string, string | number>) => {
    let text = translations[key] || key;
    
    // Replace parameters like {name} with actual values
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      }
    }
    
    return text;
  }, [translations]);

  return t;
}

export function setLocale(locale: string) {
  document.cookie = `locale=${locale};path=/;max-age=31536000`;
  localStorage.setItem('locale', locale);
  window.location.reload();
}

export function getLocale(): string {
  if (typeof window === 'undefined') return 'en';
  
  return (
    document.cookie.match(/locale=([^;]+)/)?.[1] ||
    localStorage.getItem('locale') ||
    navigator.language.split('-')[0] ||
    'en'
  );
}
