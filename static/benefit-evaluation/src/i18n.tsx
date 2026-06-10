import React, { createContext, useContext, useState, useEffect } from 'react';
import { view } from '@forge/bridge';
import enUS from './locales/en-US.json';
import noNO from './locales/no-NO.json';

type Translations = Record<string, any>;

const locales: Record<string, Translations> = {
  'en-US': enUS as unknown as Translations,
  'no-NO': noNO as unknown as Translations,
};

function resolve(obj: Translations, key: string): string {
  const parts = key.split('.');
  let cur: any = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return key;
    cur = cur[part];
  }
  return typeof cur === 'string' ? cur : key;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (str, [k, v]) => str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
    template
  );
}

const LocaleContext = createContext<string>('no-NO');

export const LocaleProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocale] = useState<string>('no-NO');

  useEffect(() => {
    view.getContext().then((ctx: any) => {
      if (ctx?.locale) setLocale(ctx.locale);
    });

    const handler = (e: Event) => setLocale((e as CustomEvent<string>).detail);
    window.addEventListener('languageChange', handler);
    return () => window.removeEventListener('languageChange', handler);
  }, []);

  return (
    <LocaleContext.Provider value={locale}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => useContext(LocaleContext);

export const useTranslation = () => {
  const locale = useContext(LocaleContext);
  const translations = locales[locale] ?? locales['no-NO'];
  const t = (key: string, params?: Record<string, string | number>): string =>
    interpolate(resolve(translations, key), params);
  return { t };
};
