"use client";

import { MitraIntlProvider } from "@/components/providers/mitra-intl-provider";

export function RegisterProviders({ children }: { children: React.ReactNode }) {
  return <MitraIntlProvider>{children}</MitraIntlProvider>;
}
