import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    // nav: Ana navigasyon bileşeni. Sayfanın en üstünde sabit kalacak.
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-950/80 border-b border-slate-800/50">
      
      {/* Container: İçeriği düzenlemek ve geniş ekranlarda aşırı yayılmasını engellemek için */}
      <div className="container mx-auto px-4">
        
        {/* Flex container: Sol, orta ve sağ bölümleri düzenlemek için */}
        <div className="flex items-center h-16">
          
          {/* Sol taraf: Marka adı */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-slate-50">
              Makas
            </h1>
          </div>
          
          {/* Orta: Navigasyon linkleri - mobilde gizli ve merkezde */}
          <div className="hidden md:flex items-center space-x-8 flex-1 justify-center ml-8">
            <a 
              href="#features" 
              className="text-slate-300 hover:text-slate-50 transition-colors duration-200 font-medium"
            >
              Özellikler
            </a>
            <a 
              href="#pricing" 
              className="text-slate-300 hover:text-slate-50 transition-colors duration-200 font-medium"
            >
              Fiyatlandırma
            </a>
          </div>
          
          {/* Sağ taraf: Aksiyon butonları */}
          <div className="flex items-center space-x-4">
            {/* Giriş Yap butonu - ghost variant */}
            <Button variant="ghost" className="text-slate-300 hover:text-slate-50 hover:bg-slate-800/50">
              Giriş Yap
            </Button>
            
            {/* Hemen Başla butonu - default variant */}
            <Button className="bg-slate-50 text-slate-950 hover:bg-slate-200 font-medium">
              Hemen Başla
            </Button>
          </div>
          
        </div>
      </div>
    </nav>
  );
} 