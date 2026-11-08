import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { translations, type Language, type TranslationSchema } from '../i18n/translations';
import { formatMoney, formatDate, formatMonth, type FormatMoneyOptions } from '@hisab/shared';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: TranslationSchema;
  formatAmount: (amount: bigint | number | string, options?: Omit<FormatMoneyOptions, 'bengaliDigits'>) => string;
  formatDateStr: (isoDate: string) => string;
  formatMonthStr: (yearMonth: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'hisab_khata_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'bn') {
        return saved;
      }
    } catch {
      // localStorage may fail in restricted contexts
    }
    return 'bn';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next: Language = prev === 'bn' ? 'en' : 'bn';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t: TranslationSchema = useMemo(() => translations[language], [language]);

  const formatAmount = useCallback(
    (amount: bigint | number | string, options?: Omit<FormatMoneyOptions, 'bengaliDigits'>) => {
      return formatMoney(amount, {
        ...options,
        bengaliDigits: language === 'bn',
      });
    },
    [language]
  );

  const formatDateStr = useCallback(
    (isoDate: string) => {
      return formatDate(isoDate, language);
    },
    [language]
  );

  const formatMonthStr = useCallback(
    (yearMonth: string) => {
      return formatMonth(yearMonth, language);
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
      formatAmount,
      formatDateStr,
      formatMonthStr,
    }),
    [language, setLanguage, toggleLanguage, t, formatAmount, formatDateStr, formatMonthStr]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
