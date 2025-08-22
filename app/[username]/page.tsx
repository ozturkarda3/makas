import Image from 'next/image'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import BookingModal from '@/components/BookingModal'

export default async function PublicBarberProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { username } = await params

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      full_name,
      business_name,
      about_text,
      cover_image_url,
      logo_url,
      services:services(id, name, duration, price),
      portfolio_albums:portfolio_albums(
        id,
        name,
        portfolio_photos:portfolio_photos(id, image_url, caption)
      ),
      staff_members:staff_members(*)
    `)
    .eq('username', username)
    .single()

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Profil bulunamadı</h1>
          <p className="text-slate-400">Aradığınız berber profili mevcut değil veya gizli olabilir.</p>
        </div>
      </div>
    )
  }

  // Ensure staff members are available for BookingModal step 1
  type StaffLite = { id: string; name: string }
  let staffMembers: StaffLite[] = (profile as unknown as { staff_members?: StaffLite[] }).staff_members || []
  if (!staffMembers || staffMembers.length === 0) {
    const { data: staffFallback } = await supabase
      .from('staff_members')
      .select('id, name')
      .eq('profile_id', profile.id)
    staffMembers = staffFallback || []
  }

  const albums = (profile.portfolio_albums || []) as Array<{
    id: string
    name: string
    portfolio_photos: Array<{ id: string; image_url: string; caption: string | null }>
  }>

  const services = (profile.services || []) as Array<{
    id: string
    name: string
    duration: number | null
    price: number | null
  }>

  const defaultAlbumId = albums[0]?.id

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* HERO SECTION */}
      <section className="relative h-56 md:h-64 lg:h-72 w-full">
        {profile.cover_image_url ? (
          <Image
            src={profile.cover_image_url}
            alt={profile.business_name || 'Kapak görseli'}
            fill
            priority
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-5xl mx-auto px-4 text-center">
            {/* Logo or placeholder */}
            {profile.logo_url ? (
              <div className="mx-auto mb-6 h-24 w-24 rounded-full overflow-hidden border border-slate-300/30 relative">
                <Image
                  src={profile.logo_url}
                  alt={`${profile.business_name || 'Logo'}`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-slate-200/20 border border-slate-300/30 backdrop-blur flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {profile.business_name?.charAt(0)?.toUpperCase() || 'M'}
                </span>
              </div>
            )}
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
              {profile.business_name || 'Berber Profili'}
            </h1>
            {profile.about_text && (
              <p className="mt-4 text-lg md:text-xl text-slate-200 max-w-3xl mx-auto">
                {profile.about_text}
              </p>
            )}
            <div className="mt-2">
              <Button
                size="lg"
                className="text-base px-8 py-6 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-900/30 ring-1 ring-white/10 transition-transform duration-200 hover:scale-[1.02]"
              >
                Randevu Al
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* SERVICES SECTION */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Hizmetler</h2>
          {services.length === 0 ? (
            <p className="text-slate-400">Henüz hizmet eklenmemiş.</p>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <Card key={service.id} className="bg-slate-900 border-slate-800">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                        <p className="text-slate-400 text-sm mt-1">
                          {service.duration ? `${service.duration} dk` : 'Süre belirtilmemiş'} ·{' '}
                          {typeof service.price === 'number' ? `${service.price} TL` : 'Fiyat belirtilmemiş'}
                        </p>
                      </div>
                      <BookingModal
                        profile={{ id: profile.id, full_name: (profile as { full_name?: string | null }).full_name }}
                        staffMembers={staffMembers.map((s: StaffLite) => ({ id: s.id, name: s.name }))}
                        service={{
                          id: service.id,
                          name: service.name,
                          price: service.price ?? 0,
                          duration: service.duration ?? 30,
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* PORTFOLIO SECTION */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Portfolyo</h2>
          {albums.length === 0 ? (
            <p className="text-slate-400">Henüz albüm eklenmemiş.</p>
          ) : (
            <Tabs defaultValue={defaultAlbumId} className="w-full">
              <TabsList className="bg-slate-900 border border-slate-800">
                {albums.map((album) => (
                  <TabsTrigger key={album.id} value={album.id} className="data-[state=active]:bg-slate-800">
                    {album.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {albums.map((album) => (
                <TabsContent key={album.id} value={album.id} className="mt-6">
                  {album.portfolio_photos?.length ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {album.portfolio_photos.map((photo) => (
                        <a
                          key={photo.id}
                          href={photo.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative group overflow-hidden rounded-lg border border-slate-800 bg-slate-900"
                        >
                          <div className="relative aspect-square">
                            <Image
                              src={photo.image_url}
                              alt={photo.caption || 'Portfolyo fotoğrafı'}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400">Bu albümde henüz fotoğraf yok.</p>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </section>

        {/* REVIEWS SECTION */}
        <section className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Müşteri Yorumları</h2>
          <p className="text-slate-400">Yorum ve puanlama özelliği yakında eklenecektir.</p>
        </section>
      </main>
    </div>
  )
}


