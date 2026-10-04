import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Menggunakan wrapper Toaster dari shadcn/ui (yang membungkus sonner)
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Perpustakaan Arunika",
  description: "Level 1 Library Management System - Perpustakaan Arunika",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-slate-50 min-h-screen`}
      >
        {/* Tempat untuk Sidebar/Navbar global nantinya bisa ditambahkan di sini */}

        <main>{children}</main>

        {/* Komponen Sonner diletakkan di root agar bisa diakses global */}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
