import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { I18nManager } from 'react-native';
import { Language, rtlLanguages, translations } from './translations';

type I18nValue = { language: Language; setLanguage: (language: Language) => void; t: (key: keyof typeof translations.en) => string; isRTL: boolean };
const I18nContext = createContext<I18nValue>({ language: 'en', setLanguage: () => undefined, t: key => translations.en[key], isRTL: false });
const supported: Language[] = ['en', 'ur', 'ar', 'fr', 'es', 'zh'];
function deviceLanguage(): Language { const code = Localization.getLocales()[0]?.languageCode?.toLowerCase() || 'en'; return supported.includes(code as Language) ? code as Language : 'en'; }
export function I18nProvider({ children }: { children: React.ReactNode }) { const [language, setLanguageState] = useState<Language>('en'); useEffect(() => { AsyncStorage.getItem('language').then(saved => { const next = (saved as Language) || deviceLanguage(); setLanguageState(next); I18nManager.allowRTL(rtlLanguages.includes(next)); I18nManager.forceRTL(rtlLanguages.includes(next)); }); }, []); const setLanguage = (next: Language) => { setLanguageState(next); AsyncStorage.setItem('language', next); I18nManager.allowRTL(rtlLanguages.includes(next)); I18nManager.forceRTL(rtlLanguages.includes(next)); }; const isRTL = rtlLanguages.includes(language); const t = (key: keyof typeof translations.en) => translations[language][key] || translations.en[key]; return <I18nContext.Provider value={{ language, setLanguage, t, isRTL }}>{children}</I18nContext.Provider>; }
export const useI18n = () => useContext(I18nContext);
