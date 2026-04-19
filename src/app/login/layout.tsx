import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Masuk ke portal PRIMA PTBA untuk mengelola pendaftaran dan proses pemilihan mitra.",
  alternates: {
    canonical: "https://prima.bukitasam.co.id/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
