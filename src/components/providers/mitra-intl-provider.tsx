"use client";

import { NextIntlClientProvider } from "next-intl";
import { useLocale } from "@/lib/i18n/locale-context";
import { type ReactNode, useEffect, useState } from "react";

const messageImports: Record<string, () => Promise<any>> = {
  id: () => import("@/messages/id.json"),
  en: () => import("@/messages/en.json"),
};

export function MitraIntlProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const [messages, setMessages] = useState<Record<string, any> | null>(null);
  const [loadedLocale, setLoadedLocale] = useState<string>("");

  useEffect(() => {
    const loader = messageImports[locale] || messageImports.id;
    loader().then((mod) => {
      setMessages(mod.default || mod);
      setLoadedLocale(locale);
    });
  }, [locale]);

  if (!messages || loadedLocale !== locale) {
    return null;
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
