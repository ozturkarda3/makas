import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    // section: Ana bölüm etiketimiz. Tüm ekranı kaplamasını ve içeriği ortalamasını söylüyoruz.
    // p-4: Mobil cihazlarda kenarlardan biraz boşluk bırakır.
    <section className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-50 p-4">
      
      {/* div: İçeriğin çok geniş ekranlarda aşırı yayılmasını engelleyen bir sarmalayıcı. */}
      <div className="text-center max-w-4xl mx-auto">
        
        {/* h1: Ana Başlığımız. Mobil için büyük, orta ekranlardan (md) itibaren devasa boyutta. */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          Zanaatınızı Markanızla Taçlandırın.
        </h1>
        
        {/* p: Alt Başlığımız. Daha küçük ve hafif soluk bir renkle (slate-400) hiyerarşi oluşturuyoruz. */}
        <p className="text-lg md:text-xl text-slate-400 mb-8 leading-relaxed">
          Size özel web sayfanız ve akıllı randevu sisteminizle, müşterilerinizin gözünde bir adım öne çıkın.
        </p>
        
        {/* Button: Ana eylem butonumuz. shadcn/ui prop'u olan size='lg' ile ve ek sınıflarla daha da büyük ve dikkat çekici. */}
        <Button size="lg" className="px-8 py-7 text-lg font-bold">
          Hemen Başla
        </Button>

      </div>
    </section>
  );
}