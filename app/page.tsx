import {
  ArrowRight,
  BadgeCheck,
  Bot,
  CircleCheck,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Store,
  TrendingUp,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const metrics = [
  { label: 'Ventes déclarées', value: '2,48 M', unit: 'FCFA', icon: TrendingUp, change: '+12,4 %' },
  { label: 'Produits vendus', value: '1 286', unit: 'unités', icon: ShoppingBag, change: '+8,1 %' },
  { label: 'Revendeurs actifs', value: '84', unit: 'ce mois', icon: Store, change: '92 %' },
];

const bars = [42, 58, 51, 74, 66, 87, 78, 94, 83, 101, 96, 118];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-emerald-950/8 bg-background/88 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="/" className="flex items-center gap-3" aria-label="FanMilk Dashboard — accueil">
            <span className="grid size-10 place-items-center rounded-[14px] bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(0,104,71,.2)]">
              <span className="text-lg font-black tracking-[-.08em]">FM</span>
            </span>
            <span>
              <span className="block text-[15px] font-extrabold leading-none tracking-tight">FANMILK TOGO</span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[.19em] text-muted-foreground">Sales intelligence</span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex" aria-label="Navigation principale">
            <a href="#fonctionnement" className="transition-colors hover:text-primary">Fonctionnement</a>
            <a href="#apercu" className="transition-colors hover:text-primary">Aperçu</a>
            <a href="#securite" className="transition-colors hover:text-primary">Sécurité</a>
          </nav>

          <a href="/connexion" className={cn(buttonVariants({ size: 'lg' }), 'h-10 rounded-xl px-5 font-bold shadow-sm')}>
            Se connecter <ArrowRight data-icon="inline-end" />
          </a>
        </div>
      </header>

      <section className="relative border-b border-emerald-950/8 px-5 pb-18 pt-16 lg:px-8 lg:pb-24 lg:pt-22">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_18%,rgba(255,205,28,.24),transparent_24%),radial-gradient(circle_at_8%_76%,rgba(0,125,83,.1),transparent_28%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[.88fr_1.12fr]">
          <div className="max-w-xl">
            <Badge variant="secondary" className="mb-6 h-7 border border-primary/10 bg-primary/8 px-3 text-primary">
              <CircleCheck /> Pilotage commercial en temps réel
            </Badge>
            <h1 className="text-balance text-[clamp(2.6rem,5vw,4.9rem)] font-black leading-[.94] tracking-[-.055em] text-emerald-950">
              Chaque vente devient une décision claire.
            </h1>
            <p className="mt-7 max-w-lg text-pretty text-lg leading-8 text-muted-foreground">
              Centralisez les déclarations WhatsApp, suivez les performances des revendeurs et anticipez les besoins de stock depuis un seul espace FanMilk.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="/connexion" className={cn(buttonVariants({ size: 'lg' }), 'h-12 rounded-xl px-6 text-base font-bold shadow-[0_12px_28px_rgba(0,104,71,.18)]')}>
                Accéder au Dashboard <ArrowRight data-icon="inline-end" />
              </a>
              <a href="#fonctionnement" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-12 rounded-xl border-primary/15 bg-white/70 px-6 text-base font-semibold')}>
                Découvrir le flux
              </a>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-emerald-950/70">
              <span className="flex items-center gap-2"><BadgeCheck className="size-4 text-primary" /> Données centralisées</span>
              <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Double authentification</span>
            </div>
          </div>

          <div id="apercu" className="relative">
            <div className="absolute -inset-5 -z-10 rounded-[40px] bg-gradient-to-br from-primary/14 via-transparent to-yellow-300/25 blur-2xl" />
            <div className="overflow-hidden rounded-[28px] border border-emerald-950/10 bg-[#f9fbf8] p-3 shadow-[0_34px_90px_rgba(2,67,49,.16)] sm:p-4">
              <div className="rounded-[20px] border border-emerald-950/8 bg-white">
                <div className="flex items-center justify-between border-b border-emerald-950/8 px-5 py-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">Vue générale</p>
                    <p className="mt-1 font-bold text-emerald-950">Activité commerciale</p>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700"><span className="size-1.5 rounded-full bg-emerald-500" /> Données synchronisées</Badge>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-3">
                  {metrics.map(({ label, value, unit, icon: Icon, change }) => (
                    <Card key={label} size="sm" className="border-0 bg-[#f7faf6] ring-0">
                      <CardHeader className="pb-1">
                        <div className="flex items-center justify-between">
                          <span className="grid size-8 place-items-center rounded-lg bg-white text-primary shadow-sm"><Icon className="size-4" /></span>
                          <span className="text-[10px] font-bold text-emerald-700">{change}</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
                        <p className="mt-1 text-xl font-black tracking-tight text-emerald-950">{value} <span className="text-[10px] font-semibold text-muted-foreground">{unit}</span></p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="grid gap-4 px-4 pb-4 md:grid-cols-[1.5fr_.8fr]">
                  <Card className="border-0 ring-emerald-950/8">
                    <CardHeader>
                      <CardTitle>Progression des ventes</CardTitle>
                      <CardDescription>Déclarations consolidées — 12 derniers jours</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex h-36 items-end gap-2 border-b border-emerald-950/10">
                        {bars.map((height, index) => (
                          <span key={index} className="flex-1 rounded-t-md bg-primary/85 transition-colors hover:bg-primary" style={{ height }} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 bg-emerald-950 text-white ring-0">
                    <CardHeader>
                      <CardTitle className="text-white">Objectif du mois</CardTitle>
                      <CardDescription className="text-emerald-100/70">Le réseau progresse bien</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-black tracking-tight">78<span className="text-lg text-yellow-300">%</span></p>
                      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/12"><div className="h-full w-[78%] rounded-full bg-yellow-300" /></div>
                      <p className="mt-4 text-xs leading-5 text-emerald-100/70">Plus que 22 % pour dépasser l’objectif national.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="fonctionnement" className="bg-emerald-950 px-5 py-14 text-white lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-yellow-300">Un flux maîtrisé</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Du terrain à la direction, sans ressaisie.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: Bot, title: 'Vendor Bot', text: 'Collecte guidée via WhatsApp' },
              { icon: PackageCheck, title: 'MySQL sécurisé', text: 'Centralisation et historique' },
              { icon: TrendingUp, title: 'Dashboard', text: 'Décisions et rapports instantanés' },
            ].map(({ icon: Icon, title, text }, index) => (
              <div key={title} className="relative rounded-2xl border border-white/10 bg-white/6 p-5">
                <span className="mb-5 grid size-10 place-items-center rounded-xl bg-yellow-300 text-emerald-950"><Icon className="size-5" /></span>
                <p className="font-bold">{index + 1}. {title}</p>
                <p className="mt-1 text-sm leading-6 text-emerald-100/65">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer id="securite" className="border-t border-emerald-950/8 bg-white px-5 py-7 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 FanMilk Togo — Pilotage commercial.</p>
          <p className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Accès protégé par authentification à double facteur</p>
        </div>
      </footer>
    </main>
  );
}
