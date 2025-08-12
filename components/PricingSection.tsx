import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";

export default function PricingSection() {
  return (
    // section: Fiyatlandırma bölümü. Tek ve basit plan ile kullanıcıları karıştırmıyoruz.
    <section id="pricing" className="py-24 bg-slate-900">
      
      {/* Container: İçeriği merkezde tutmak ve geniş ekranlarda aşırı yayılmasını engellemek için */}
      <div className="container mx-auto px-4">
        
        {/* h2: Ana başlık - merkezde ve büyük */}
        <h2 className="text-4xl md:text-5xl font-bold text-slate-50 text-center mb-16">
          Tek ve Basit Plan
        </h2>
        
        {/* Pricing card container: Merkezde tek kart */}
        <div className="flex justify-center">
          
          {/* Pricing card: Makas Pro planı */}
          <div className="bg-slate-800 rounded-xl p-8 md:p-12 max-w-md w-full border border-slate-700/50 shadow-xl">
            
            {/* Plan title */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-slate-50 mb-2">
                Makas Pro
              </h3>
              <div className="text-4xl font-bold text-slate-50">
                49 TL
                <span className="text-lg font-normal text-slate-400"> / ay</span>
              </div>
            </div>
            
            {/* Features list */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-slate-300">Sınırsız Randevu</span>
              </div>
              <div className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-slate-300">Otomatik Hatırlatmalar</span>
              </div>
              <div className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-slate-300">Marka Sayfanız</span>
              </div>
              <div className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-slate-300">Müşteri Yönetimi</span>
              </div>
              <div className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-slate-300">SMS Bildirimleri</span>
              </div>
              <div className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-slate-300">7/24 Destek</span>
              </div>
            </div>
            
            {/* CTA Button */}
            <Link href="/signup">
              <Button className="w-full bg-slate-50 text-slate-950 hover:bg-slate-200 font-bold text-lg py-6">
                Hemen Başla
              </Button>
            </Link>
            
          </div>
        </div>
      </div>
    </section>
  );
} 