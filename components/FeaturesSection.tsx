import React from 'react';

const FeaturesSection = () => {
  return (
    <section id="features" className="bg-slate-900 py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Heading */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Sadece Bir Randevu Defteri Değil
          </h2>
        </div>

        {/* Three Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg 
                className="w-8 h-8 text-slate-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">
              Profesyonel Marka Sayfanız
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Size özel, modern ve şık bir web sayfasında portfolyonuzu ve hizmetlerinizi sergileyin, prestij kazanın.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg 
                className="w-8 h-8 text-slate-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">
              Otomatik No-Show Koruması
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Otomatik SMS ve WhatsApp hatırlatmaları ile randevusuna gelmeyen müşteri oranını düşürün, gelirinizi koruyun.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg 
                className="w-8 h-8 text-slate-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-4">
              Akıllı Müşteri Listesi (CRM)
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Müşterilerinizin randevu geçmişini ve özel notlarını tek bir yerden yönetin, onlarla bağınızı güçlendirin.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 