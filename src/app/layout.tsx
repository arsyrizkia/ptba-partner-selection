import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";

export const metadata: Metadata = {
  title: "PTBA - Sistem Pemilihan Mitra",
  description: "Sistem Pemilihan Mitra PT Bukit Asam Tbk",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>{children}</AuthProvider>
        <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>
      </body>
    </html>
  );
}
