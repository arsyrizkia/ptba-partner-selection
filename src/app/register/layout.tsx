import type { Metadata } from "next";
import { RegisterProviders } from "./providers";

export const metadata: Metadata = {
  title: "Daftar Mitra",
  description: "Daftarkan perusahaan Anda sebagai mitra PT Bukit Asam Tbk melalui platform PRIMA PTBA.",
  alternates: {
    canonical: "https://prima.bukitasam.co.id/register",
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RegisterProviders>{children}</RegisterProviders>;
}
