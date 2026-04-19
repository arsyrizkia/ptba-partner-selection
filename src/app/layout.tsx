import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { LocaleProvider } from "@/lib/i18n/locale-context";

export const metadata: Metadata = {
  metadataBase: new URL("https://prima.bukitasam.co.id"),
  title: {
    default: "PRIMA PTBA - Sistem Pemilihan Mitra",
    template: "%s | PRIMA PTBA",
  },
  description:
    "Platform resmi pemilihan mitra PT Bukit Asam Tbk (PTBA) untuk proyek energi baru terbarukan. Daftar, ajukan proposal, dan ikuti proses seleksi secara transparan.",
  applicationName: "PRIMA PTBA",
  keywords: [
    "PTBA",
    "PT Bukit Asam",
    "pemilihan mitra",
    "partner selection",
    "energi baru terbarukan",
    "renewable energy",
    "MIND ID",
    "BUMN",
    "tender",
    "proyek energi",
  ],
  authors: [{ name: "PT Bukit Asam Tbk" }],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://prima.bukitasam.co.id",
    siteName: "PRIMA PTBA",
    title: "PRIMA PTBA - Sistem Pemilihan Mitra",
    description:
      "Platform resmi pemilihan mitra PT Bukit Asam Tbk untuk proyek energi baru terbarukan.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PRIMA PTBA - Sistem Pemilihan Mitra",
    description:
      "Platform resmi pemilihan mitra PT Bukit Asam Tbk untuk proyek energi baru terbarukan.",
  },
  alternates: {
    canonical: "https://prima.bukitasam.co.id",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
  other: {
    "theme-color": "#1B3A5C",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "PT Bukit Asam Tbk",
  url: "https://prima.bukitasam.co.id",
  logo: "https://prima.bukitasam.co.id/ptba-logo.png",
  description:
    "Platform resmi pemilihan mitra PT Bukit Asam Tbk untuk proyek energi baru terbarukan.",
  sameAs: ["https://www.ptba.co.id"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <AuthProvider>
          <LocaleProvider>{children}</LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
