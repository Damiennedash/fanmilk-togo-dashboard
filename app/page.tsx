import { ArrowRight, Bot, ChartNoAxesCombined, ShieldCheck, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const products = [
  { name: 'FanXtra', type: 'Yaourt glacé', image: '/products/fan-xtra.png', color: 'from-sky-100 to-blue-50' },
  { name: 'FanYogo', type: 'Yaourt fraise', image: '/products/fan-yogo.png', color: 'from-pink-100 to-rose-50' },
  { name: 'FanChoco', type: 'Glace chocolat', image: '/products/fan-choco.jpg', color: 'from-amber-100 to-orange-50' },
  { name: 'FanVanille', type: 'Boisson lactée', image: '/products/fan-vanille.png', color: 'from-yellow-100 to-amber-50' },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-950">
      <header className="sticky top-0 z-50 border-b border-blue-950/8 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="/" className="flex items-center gap-3" aria-label="FanMilk Togo — accueil">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#073b86] text-sm font-black italic text-white shadow-lg shadow-blue-900/20">FAN</span>
            <span><strong className="block text-lg font-black italic leading-none text-[#073b86]">FanMilk</strong><span className="mt-1 block text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">Togo</span></span>
          </a>
          <nav className="hidden items-center gap-8 text-sm font-bold text-slate-600 md:flex" aria-label="Navigation principale">
            <a href="#produits" className="hover:text-[#0757b9]">Nos produits</a><a href="#pilotage" className="hover:text-[#0757b9]">Pilotage</a><a href="#yaourts" className="hover:text-[#0757b9]">Nos yaourts</a>
          </nav>
          <a href="/connexion" className={cn(buttonVariants({ size: 'lg' }), 'h-11 rounded-full bg-[#0757b9] px-6 font-bold hover:bg-[#063f87]')}>Dashboard <ArrowRight data-icon="inline-end" /></a>
        </div>
      </header>

      <section className="relative bg-[linear-gradient(120deg,#eaf7ff_0%,#ffffff_43%,#fff3c7_100%)] px-5 py-14 lg:px-8 lg:py-20">
        <div className="absolute -left-24 top-10 size-80 rounded-full bg-sky-300/25 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[.82fr_1.18fr]">
          <div className="relative z-10">
            <Badge className="mb-6 rounded-full bg-[#e40d2f] px-4 py-1.5 text-white"><Sparkles /> Les saveurs que le Togo aime</Badge>
            <h1 className="max-w-xl text-[clamp(3.2rem,6vw,6rem)] font-black leading-[.86] tracking-[-.065em] text-[#073b86]">Le plaisir<br /><span className="text-[#e40d2f]">FanMilk</span>, piloté en temps réel.</h1>
            <p className="mt-7 max-w-lg text-lg font-medium leading-8 text-slate-600">Glaces, yaourts et boissons lactées : suivez chaque vente de vos produits FanMilk depuis un espace unique.</p>
            <div className="mt-8 flex flex-wrap gap-3"><a href="/connexion" className={cn(buttonVariants({ size: 'lg' }), 'h-13 rounded-full bg-[#0757b9] px-7 text-base font-black shadow-xl shadow-blue-900/20 hover:bg-[#063f87]')}>Accéder au Dashboard <ArrowRight /></a><a href="#produits" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-13 rounded-full border-[#0757b9]/20 bg-white px-7 text-base font-bold text-[#0757b9]')}>Voir les produits</a></div>
          </div>
          <div className="relative min-h-[430px] lg:min-h-[560px]"><div className="absolute inset-8 rounded-full bg-white/70 shadow-[0_40px_100px_rgba(6,63,135,.14)]" /><img src="/products/fan-assortiment.png" alt="Assortiment FanMilk : FanXtra, FanYogo, FanChoco et FanVanille" className="relative z-10 mx-auto h-[430px] w-full object-contain drop-shadow-[0_25px_25px_rgba(17,54,93,.2)] lg:h-[560px]" /><div className="absolute bottom-5 right-2 z-20 rounded-2xl border border-white bg-white/90 p-4 shadow-xl backdrop-blur sm:right-10"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Ventes aujourd’hui</p><p className="mt-1 text-2xl font-black text-[#073b86]">286 produits <span className="text-sm text-emerald-600">+8,6 %</span></p></div></div>
        </div>
      </section>

      <section id="produits" className="px-5 py-20 lg:px-8"><div className="mx-auto max-w-7xl"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.22em] text-[#e40d2f]">La famille FanMilk</p><h2 className="mt-3 text-4xl font-black tracking-tight text-[#073b86]">Nos produits stars</h2></div><p className="max-w-md text-sm leading-6 text-slate-500">Une vision claire des performances de chaque référence, du dépôt jusqu’au point de vente.</p></div><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{products.map((product) => <article key={product.name} className={`group overflow-hidden rounded-[28px] bg-gradient-to-br ${product.color} p-5 ring-1 ring-blue-950/6 transition-transform hover:-translate-y-1`}><div className="grid h-52 place-items-center"><img src={product.image} alt={product.name} className="max-h-44 w-full object-contain drop-shadow-xl transition-transform group-hover:scale-105" /></div><p className="mt-3 text-2xl font-black italic text-[#073b86]">{product.name}</p><p className="mt-1 text-sm font-semibold text-slate-500">{product.type}</p></article>)}</div></div></section>

      <section id="pilotage" className="bg-[#073b86] px-5 py-16 text-white lg:px-8"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><p className="text-xs font-black uppercase tracking-[.2em] text-yellow-300">Du terrain au Dashboard</p><h2 className="mt-4 text-4xl font-black tracking-tight">Chaque vente compte. Chaque produit aussi.</h2></div><div className="grid gap-4 sm:grid-cols-3">{[{ icon: Bot, title: 'Vendor Bot', text: 'Déclarations guidées via WhatsApp' }, { icon: ChartNoAxesCombined, title: 'Analyse produit', text: 'FanXtra, FanYogo, glaces et yaourts' }, { icon: ShieldCheck, title: 'Données sécurisées', text: 'Historique centralisé dans MySQL' }].map(({ icon: Icon, title, text }) => <div key={title} className="rounded-3xl border border-white/15 bg-white/8 p-6"><span className="grid size-11 place-items-center rounded-2xl bg-yellow-300 text-[#073b86]"><Icon /></span><h3 className="mt-5 font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-blue-100/70">{text}</p></div>)}</div></div></section>
      <section id="yaourts" className="px-5 py-20 lg:px-8"><div className="mx-auto max-w-7xl overflow-hidden rounded-[34px] bg-[#eaf7ff] shadow-xl shadow-blue-950/10"><img src="/products/yaourt-banner.jpg" alt="Yaourts FanMilk nature et vanille" className="h-auto w-full object-cover" /></div></section>
      <footer className="border-t border-blue-950/8 px-5 py-7 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:justify-between"><p>© 2026 FanMilk Togo</p><p>Glaces · Yaourts · Boissons lactées · Pilotage commercial</p></div></footer>
    </main>
  );
}
