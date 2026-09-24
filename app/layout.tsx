import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Athos • Indique e ganhe",
  description: "Programa de indicações da Escola Athos.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/athos-mark.png",
    shortcut: "/athos-mark.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
