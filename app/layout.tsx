import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Makas",
  description: "Zanaatınızı Markanızla Taçlandırın.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // "dark" class'ı ekleyerek temayı karanlık moda zorluyoruz.
    <html lang="tr" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50`}>
        {children}
      </body>
    </html>
  );
}