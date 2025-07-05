export default function FeaturesSection() {
  return (
    // section: Özellikler bölümü. Hero'dan biraz daha açık bir arka plan ile ayrım yaratıyoruz.
    <section className="py-24 bg-slate-900">
      
      {/* Container: İçeriği merkezde tutmak ve geniş ekranlarda aşırı yayılmasını engellemek için */}
      <div className="container mx-auto px-4">
        
        {/* h2: Ana başlık - merkezde ve büyük */}
        <h2 className="text-4xl md:text-5xl font-bold text-slate-50 text-center mb-16">
          Sadece Bir Randevu Defteri Değil
        </h2>
        
        {/* Grid: Responsive 3 sütunlu grid - mobilde tek sütun, tablet ve üstünde 3 sütun */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Card 1: Yeni Müşteri Kazanın */}
          <div className="bg-slate-800 rounded-lg p-8 hover:bg-slate-750 transition-colors duration-300">
            {/* Icon placeholder - daha sonra gerçek icon eklenecek */}
            <div className="w-16 h-16 bg-slate-600 rounded-lg mb-6 flex items-center justify-center">
              <div className="text-slate-400 text-2xl">🎨</div>
            </div>
            
            {/* Card başlığı */}
            <h3 className="text-xl font-bold text-slate-50 mb-4">
              Yeni Müşteri Kazanın
            </h3>
            
            {/* Card açıklaması */}
            <p className="text-slate-300 leading-relaxed">
              Size özel, modern ve şık bir web sayfasında portfolyonuzu ve hizmetlerinizi sergileyin, yeni müşteriler ve prestij kazanın.
            </p>
          </div>
          
          {/* Card 2: İşinizi Yönetin */}
          <div className="bg-slate-800 rounded-lg p-8 hover:bg-slate-750 transition-colors duration-300">
            {/* Icon placeholder */}
            <div className="w-16 h-16 bg-slate-600 rounded-lg mb-6 flex items-center justify-center">
              <div className="text-slate-400 text-2xl">📅</div>
            </div>
            
            {/* Card başlığı */}
            <h3 className="text-xl font-bold text-slate-50 mb-4">
              İşinizi Yönetin
            </h3>
            
            {/* Card açıklaması */}
            <p className="text-slate-300 leading-relaxed">
              Müşteriler takviminizdeki boşluklara randevu alsın, otomatik SMS hatırlatmaları ile randevusuna gelmeyen müşteri oranını düşürün, gelirinizi koruyun.
            </p>
          </div>
          
          {/* Card 3: Müşterilerinizi Yönetin */}
          <div className="bg-slate-800 rounded-lg p-8 hover:bg-slate-750 transition-colors duration-300">
            {/* Icon placeholder */}
            <div className="w-16 h-16 bg-slate-600 rounded-lg mb-6 flex items-center justify-center">
              <div className="text-slate-400 text-2xl">👥</div>
            </div>
            
            {/* Card başlığı */}
            <h3 className="text-xl font-bold text-slate-50 mb-4">
              Müşterilerinizi Yönetin
            </h3>
            
            {/* Card açıklaması */}
            <p className="text-slate-300 leading-relaxed">
              Müşterilerinizin randevu geçmişini ve özel notlarını tek bir yerden yönetin, akıllı hatırlatmalar ile randevularına gelmesini sağlayın.
            </p>
          </div>
          
        </div>
      </div>
    </section>
  );
} 