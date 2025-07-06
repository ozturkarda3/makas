export default function VisualProofSection() {
  return (
    // section: Görsel kanıt bölümü. Kullanıcılara platformun nasıl göründüğünü gösteriyoruz.
    <section className="py-24 sm:py-32 bg-slate-950">
      
      {/* Container: İçeriği merkezde tutmak ve geniş ekranlarda aşırı yayılmasını engellemek için */}
      <div className="container mx-auto px-4">
        
        {/* h2: Ana başlık - merkezde ve büyük */}
        <h2 className="text-4xl md:text-5xl font-bold text-slate-50 text-center">
          Her Şey Tek Bir Yerde, Gözünüzün Önünde
        </h2>
        
        {/* Image container: Başlığın altında, üst margin ile ayrılmış */}
        <div className="mt-16 max-w-6xl mx-auto">
          
          {/* Dashboard mockup: Gerçek bir barbershop yönetim dashboard'u */}
          <div className="relative">
            {/* Subtle shadow wrapper for depth */}
            <div className="shadow-2xl rounded-xl overflow-hidden">
              {/* Dashboard interface */}
              <div className="bg-slate-950 border border-white/10 rounded-xl p-6 h-[675px] flex">
                
                {/* Left side - Calendar */}
                <div className="flex-1 pr-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-slate-50 text-lg font-semibold">Aralık 2024</h3>
                    
                    {/* Key metrics */}
                    <div className="flex space-x-6">
                      <div className="text-center">
                        <div className="text-slate-50 text-xl font-bold">127</div>
                        <div className="text-slate-400 text-xs">Toplam Randevu</div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-50 text-xl font-bold">₺3,240</div>
                        <div className="text-slate-400 text-xs">Bu Ay Gelir</div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-400 text-xl font-bold">3</div>
                        <div className="text-slate-400 text-xs">Gelmedi</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {/* Day headers */}
                    <div className="text-slate-400 text-sm font-medium p-2 text-center">Pzt</div>
                    <div className="text-slate-400 text-sm font-medium p-2 text-center">Sal</div>
                    <div className="text-slate-400 text-sm font-medium p-2 text-center">Çar</div>
                    <div className="text-slate-400 text-sm font-medium p-2 text-center">Per</div>
                    <div className="text-slate-400 text-sm font-medium p-2 text-center">Cum</div>
                    <div className="text-slate-400 text-sm font-medium p-2 text-center">Cmt</div>
                    <div className="text-slate-400 text-sm font-medium p-2 text-center">Paz</div>
                    
                    {/* Calendar days */}
                    <div className="text-slate-300 text-sm p-2 text-center">25</div>
                    <div className="text-slate-300 text-sm p-2 text-center">26</div>
                    <div className="text-slate-300 text-sm p-2 text-center">27</div>
                    <div className="text-slate-300 text-sm p-2 text-center">28</div>
                    <div className="text-slate-300 text-sm p-2 text-center">29</div>
                    <div className="text-slate-300 text-sm p-2 text-center">30</div>
                    <div className="text-slate-300 text-sm p-2 text-center">1</div>
                    
                    <div className="text-slate-300 text-sm p-2 text-center">2</div>
                    <div className="text-slate-300 text-sm p-2 text-center">3</div>
                    <div className="text-slate-300 text-sm p-2 text-center">4</div>
                    <div className="text-slate-300 text-sm p-2 text-center">5</div>
                    <div className="text-slate-300 text-sm p-2 text-center">6</div>
                    <div className="text-slate-300 text-sm p-2 text-center">7</div>
                    <div className="text-slate-300 text-sm p-2 text-center">8</div>
                    
                    <div className="text-slate-300 text-sm p-2 text-center">9</div>
                    <div className="text-slate-300 text-sm p-2 text-center">10</div>
                    <div className="text-slate-300 text-sm p-2 text-center">11</div>
                    <div className="text-slate-300 text-sm p-2 text-center">12</div>
                    <div className="text-slate-300 text-sm p-2 text-center">13</div>
                    <div className="text-slate-300 text-sm p-2 text-center">14</div>
                    <div className="text-slate-300 text-sm p-2 text-center">15</div>
                    
                    <div className="text-slate-300 text-sm p-2 text-center">16</div>
                    <div className="text-slate-300 text-sm p-2 text-center">17</div>
                    <div className="text-slate-300 text-sm p-2 text-center">18</div>
                    <div className="text-slate-300 text-sm p-2 text-center">19</div>
                    <div className="text-slate-300 text-sm p-2 text-center">20</div>
                    <div className="text-slate-300 text-sm p-2 text-center">21</div>
                    <div className="text-slate-300 text-sm p-2 text-center">22</div>
                    
                    <div className="text-slate-300 text-sm p-2 text-center">23</div>
                    <div className="text-slate-300 text-sm p-2 text-center">24</div>
                    <div className="text-slate-300 text-sm p-2 text-center">25</div>
                    <div className="text-slate-300 text-sm p-2 text-center">26</div>
                    <div className="text-slate-300 text-sm p-2 text-center">27</div>
                    <div className="text-slate-300 text-sm p-2 text-center">28</div>
                    <div className="text-slate-300 text-sm p-2 text-center">29</div>
                    
                    <div className="text-slate-300 text-sm p-2 text-center">30</div>
                    <div className="text-slate-300 text-sm p-2 text-center">31</div>
                    <div className="text-slate-300 text-sm p-2 text-center">1</div>
                    <div className="text-slate-300 text-sm p-2 text-center">2</div>
                    <div className="text-slate-300 text-sm p-2 text-center">3</div>
                    <div className="text-slate-300 text-sm p-2 text-center">4</div>
                    <div className="text-slate-300 text-sm p-2 text-center">5</div>
                  </div>
                  
                  {/* Busy days indicators */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-slate-400 text-sm">Dolu (5 randevu)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-slate-400 text-sm">Kısmen dolu (2-3 randevu)</span>
                    </div>
                  </div>
                </div>
                
                {/* Right side - Today's Appointments */}
                <div className="w-80 bg-slate-900 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-slate-50 text-lg font-semibold">Bugünkü Randevular</h3>
                    <div className="text-slate-400 text-sm">3/5 tamamlandı</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-slate-800 rounded-lg p-3">
                      <div className="text-slate-50 font-medium">Ahmet Yılmaz</div>
                      <div className="text-slate-400 text-sm">14:30 - Saç Kesimi</div>
                    </div>
                    
                    <div className="bg-slate-800 rounded-lg p-3">
                      <div className="text-slate-50 font-medium">Mehmet Demir</div>
                      <div className="text-slate-400 text-sm">16:00 - Sakal Tıraşı</div>
                    </div>
                    
                                         <div className="bg-slate-800 rounded-lg p-3">
                       <div className="text-slate-50 font-medium">Ali Kaya</div>
                       <div className="text-slate-400 text-sm">17:30 - Saç & Sakal</div>
                     </div>
                   </div>
                   
                   {/* Today's summary */}
                   <div className="mt-4 pt-4 border-t border-slate-700">
                     <div className="grid grid-cols-2 gap-4 text-sm">
                       <div>
                         <div className="text-slate-400">Bugünkü Gelir</div>
                         <div className="text-slate-50 font-semibold">₺420</div>
                       </div>
                       <div>
                         <div className="text-slate-400">Ortalama Süre</div>
                         <div className="text-slate-50 font-semibold">45 dk</div>
                       </div>
                     </div>
                   </div>
                   
                   {/* CRM Section */}
                   <div className="mt-4 pt-4 border-t border-slate-700">
                     <h4 className="text-slate-50 text-sm font-semibold mb-3">Müşteri Yönetimi</h4>
                     <div className="space-y-2">
                       <div className="flex justify-between items-center text-sm">
                         <span className="text-slate-400">Toplam Müşteri</span>
                         <span className="text-slate-50 font-medium">342</span>
                       </div>
                       <div className="flex justify-between items-center text-sm">
                         <span className="text-slate-400">Bu Ay Yeni</span>
                         <span className="text-green-400 font-medium">+28</span>
                       </div>
                       <div className="flex justify-between items-center text-sm">
                         <span className="text-slate-400">Sadık Müşteri</span>
                         <span className="text-slate-50 font-medium">89%</span>
                       </div>
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
} 