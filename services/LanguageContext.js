import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { translations } from './translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('fr');

  useEffect(() => {
    AsyncStorage.getItem('glossia_lang').then(val => {
      if (val === 'en' || val === 'fr') setLang(val);
    });
  }, []);

  function toggleLang() {
    const next = lang === 'fr' ? 'en' : 'fr';
    setLang(next);
    AsyncStorage.setItem('glossia_lang', next);
  }

  function t(key, ...args) {
    const val = translations[lang]?.[key] ?? translations['fr']?.[key];
    if (typeof val === 'function') return val(...args);
    return val ?? key;
  }

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
