"use client";

import { MitraIntlProvider } from "@/components/providers/mitra-intl-provider";

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MitraIntlProvider>{children}</MitraIntlProvider>;
}
