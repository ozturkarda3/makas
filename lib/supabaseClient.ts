// Bu dosya hem istemci hem sunucu tarafında çalışacağı için 'use client' yazmıyoruz.
// Next.js için özel olarak tasarlanmış ssr paketinden doğru fonksiyonu import ediyoruz.
import { createBrowserClient } from '@supabase/ssr'

// Bu bir fonksiyon olarak kalmalı, çünkü her istekte yeniden çağrılması gerekebilir.
export function createClient() {
  // .env.local dosyasındaki anahtarları kullanarak tarayıcıya özel bir Supabase istemcisi oluşturur.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}