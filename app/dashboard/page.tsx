import {
  Bell,
  ChevronDown,
  CircleAlert,
  FileChartColumn,
  LayoutDashboard,
  LogOut,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const nav = [
  { label: 'Vue générale', icon: LayoutDashboard, active: true },
  { label: 'Ventes', icon: ShoppingBag },
  { label: 'Stocks', icon: Package },
  { label: 'Revendeurs', icon: Users },
  { label: 'Dépôts', icon: Store },
  { label: 'Rapports', icon: FileChartColumn },
];

const declarations = [
  { name: 'Ama K.', depot: 'SUPER DEPOT', amount: '48 500', pieces: 31, status: 'Validée', time: '08:42' },
  { name: 'Kodjo A.', depot: 'SAINT MARTIN', amount: '36 000', pieces: 24, status: 'Validée', time: '08:31' },
  { name: 'Dédévi M.', depot: 'GERM DOSSEH', amount: '29 500', pieces: 19, status: 'À vérifier', time: '08:16' },
  { name: 'Yao B.', depot: 'YEHONAM', amount: '41 000', pieces: 28, status: 'Validée', time: '07:58' },
];

const bars = [48, 65, 54, 88, 70, 95, 82, 106, 91, 124, 108, 138, 126, 151];

const productSales = [
  { name: 'FanXtra', category: 'Yaourt glacé', sold: 82, share: '28,7 %', image: '/products/fan-xtra.png', tone: 'bg-sky-50' },
  { name: 'FanYogo', category: 'Yaourt fraise', sold: 71, share: '24,8 %', image: '/products/fan-yogo.png', tone: 'bg-pink-50' },
  { name: 'FanVanille', category: 'Boisson lactée', sold: 59, share: '20,6 %', image: '/products/fan-vanille.png', tone: 'bg-amber-50' },
  { name: 'Yaourts', category: 'Nature & vanille', sold: 48, share: '16,8 %', image: '/products/yaourt-nature.png', tone: 'bg-blue-50' },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#f3f7fb] text-foreground lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden min-h-screen flex-col bg-[#073b86] px-4 py-5 text-white lg:flex">
        <a href="/" className="flex items-center gap-3 px-2">
          <span className="grid size-10 place-items-center rounded-[13px] bg-white font-black italic text-[#073b86]">FAN</span>
          <span><span className="block text-sm font-extrabold italic">FanMilk Togo</span><span className="text-[10px] uppercase tracking-[.16em] text-blue-100/60">Dashboard</span></span>
        </a>
        <nav className="mt-10 space-y-1" aria-label="Navigation du Dashboard">
          {nav.map(({ label, icon: Icon, active }) => (
            <a key={label} href="#" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${active ? 'bg-white text-[#073b86]' : 'text-blue-100/70 hover:bg-white/8 hover:text-white'}`}>
              <Icon className="size-4" /> {label}
            </a>
          ))}
        </nav>
        <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
          <a href="#" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-emerald-100/65 hover:bg-white/8 hover:text-white"><Settings className="size-4" /> Paramètres</a>
          <a href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-emerald-100/65 hover:bg-white/8 hover:text-white"><LogOut className="size-4" /> Déconnexion</a>
        </div>
      </aside>

      <section className="min-w-0">
        <header className="flex h-18 items-center justify-between border-b border-emerald-950/8 bg-white px-5 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden"><span className="grid size-9 place-items-center rounded-xl bg-primary font-black text-white">FM</span><span className="font-extrabold text-emerald-950">Dashboard</span></div>
          <div className="relative hidden w-full max-w-sm md:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher un revendeur, un dépôt…" className="h-10 rounded-xl bg-[#f6f8f5] pl-10" />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative rounded-xl"><Bell /><span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-red-500" /></Button>
            <div className="h-8 w-px bg-border" />
            <button className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-muted">
              <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-xs font-black text-primary">AD</span>
              <span className="hidden sm:block"><span className="block text-xs font-bold">Admin FanMilk</span><span className="text-[10px] text-muted-foreground">Administrateur</span></span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </button>
          </div>
        </header>

        <div className="p-5 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-sm font-semibold text-primary">Samedi 29 août 2026</p><h1 className="mt-1 text-3xl font-black tracking-[-.035em] text-emerald-950">Bonjour, Admin 👋</h1><p className="mt-2 text-sm text-muted-foreground">Voici l’activité commerciale de votre réseau aujourd’hui.</p></div>
            <Button className="h-10 rounded-xl font-bold"><FileChartColumn /> Exporter le rapport</Button>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Ventes du jour', value: '428 500', suffix: 'FCFA', icon: TrendingUp, note: '+14,2 % vs hier' },
              { label: 'Produits vendus', value: '286', suffix: 'unités', icon: ShoppingBag, note: '+8,6 % vs hier' },
              { label: 'Déclarations', value: '68', suffix: 'sur 84', icon: FileChartColumn, note: '81 % reçues' },
              { label: 'Alertes actives', value: '5', suffix: 'à traiter', icon: CircleAlert, note: '2 prioritaires' },
            ].map(({ label, value, suffix, icon: Icon, note }, index) => (
              <Card key={label} className="border-0 bg-white ring-emerald-950/7">
                <CardHeader className="pb-1"><div className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-xl bg-primary/8 text-primary"><Icon className="size-4" /></span><Badge variant={index === 3 ? 'destructive' : 'secondary'}>{note}</Badge></div></CardHeader>
                <CardContent><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-black tracking-tight text-emerald-950">{value} <span className="text-xs font-semibold text-muted-foreground">{suffix}</span></p></CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_.75fr]">
            <Card className="border-0 bg-white ring-emerald-950/7">
              <CardHeader><CardTitle>Évolution des ventes</CardTitle><CardDescription>Montants déclarés sur les 14 derniers jours</CardDescription></CardHeader>
              <CardContent>
                <div className="flex h-56 items-end gap-2 border-b border-l border-emerald-950/10 pl-3">
              {bars.map((height, index) => <span key={index} title={`${height * 4000} FCFA`} className="flex-1 rounded-t-md bg-gradient-to-t from-[#073b86] to-sky-400" style={{ height }} />)}
                </div>
                <div className="mt-3 flex justify-between text-[10px] font-semibold text-muted-foreground"><span>16 AOÛT</span><span>22 AOÛT</span><span>29 AOÛT</span></div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-[#073b86] text-white ring-0">
              <CardHeader><CardTitle className="text-white">Objectif mensuel</CardTitle><CardDescription className="text-emerald-100/60">Août 2026</CardDescription></CardHeader>
              <CardContent>
                <p className="text-4xl font-black">78<span className="text-xl text-yellow-300">%</span></p>
                <Progress value={78} className="mt-5 [&_[data-slot=progress-indicator]]:bg-yellow-300" />
                <div className="mt-6 grid grid-cols-2 gap-4 text-sm"><div><p className="text-emerald-100/50">Réalisé</p><p className="mt-1 font-bold">18,7 M FCFA</p></div><div><p className="text-emerald-100/50">Objectif</p><p className="mt-1 font-bold">24 M FCFA</p></div></div>
                <p className="mt-6 rounded-xl bg-white/7 p-3 text-xs leading-5 text-emerald-100/65">À ce rythme, l’objectif sera atteint le 31 août.</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-5 border-0 bg-white ring-blue-950/7">
            <CardHeader className="flex-row items-end justify-between"><div><CardTitle>Ventes par produit</CardTitle><CardDescription>Les références FanMilk les plus vendues aujourd’hui</CardDescription></div><Badge className="bg-blue-50 text-[#0757b9]">260 unités suivies</Badge></CardHeader>
            <CardContent><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{productSales.map((product) => <div key={product.name} className={`flex items-center gap-4 rounded-2xl ${product.tone} p-4`}><span className="grid size-20 shrink-0 place-items-center rounded-2xl bg-white shadow-sm"><img src={product.image} alt={product.name} className="max-h-16 max-w-18 object-contain" /></span><div><p className="font-black text-[#073b86]">{product.name}</p><p className="text-xs text-slate-500">{product.category}</p><p className="mt-2 text-xl font-black">{product.sold} <span className="text-[10px] font-bold text-slate-500">unités</span></p><p className="text-xs font-bold text-emerald-600">{product.share} des ventes</p></div></div>)}</div></CardContent>
          </Card>

          <Card className="mt-5 border-0 bg-white ring-emerald-950/7">
            <CardHeader className="flex-row items-center justify-between"><div><CardTitle>Dernières déclarations</CardTitle><CardDescription>Mises à jour reçues depuis WhatsApp</CardDescription></div><Button variant="outline" size="sm">Voir toutes</Button></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Revendeur</TableHead><TableHead>Dépôt</TableHead><TableHead>Ventes</TableHead><TableHead>Produits</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Heure</TableHead></TableRow></TableHeader>
                <TableBody>{declarations.map((row) => <TableRow key={`${row.name}-${row.time}`}><TableCell className="font-bold">{row.name}</TableCell><TableCell>{row.depot}</TableCell><TableCell className="font-semibold">{row.amount} FCFA</TableCell><TableCell>{row.pieces}</TableCell><TableCell><Badge variant={row.status === 'Validée' ? 'secondary' : 'outline'} className={row.status === 'Validée' ? 'bg-emerald-50 text-emerald-700' : 'border-yellow-300 bg-yellow-50 text-yellow-800'}>{row.status}</Badge></TableCell><TableCell className="text-right text-muted-foreground">{row.time}</TableCell></TableRow>)}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
