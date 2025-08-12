import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConditionalNavbar from "@/components/ConditionalNavbar"; // Profil sayfalarında gizle
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Makas",
  description: "Zanaatınızı Markanızla Taçlandırın.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="tr" className="dark">
      {/* bg-background ve text-foreground kullanarak tema değişkenlerine bağladık */}
      <body className={`${inter.className} bg-background text-foreground`}>
        <ConditionalNavbar />
        <main>{children}</main> {/* children'ı bir main etiketi içine almak daha doğru */}
        <Toaster />
      </body>
    </html>
  );
}