import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lupa Password",
  description: "Reset password akun PRIMA PTBA Anda.",
  alternates: {
    canonical: "https://prima.bukitasam.co.id/forgot-password",
  },
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
