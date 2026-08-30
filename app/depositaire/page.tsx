'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BarChart3,
  Boxes,
  Check,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardTools } from '@/components/dashboard-tools';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch, clearSession, getToken } from '@/lib/api';

type Sale = {
  id: number;
  seller: string;
  phone: string;
  date: string;
  amount: number;
  place: string;
  lines: string;
  status: 'en_attente' | 'validee' | 'rejetee';
};
type Stock = {
  id: number;
  seller: string;
  product: string;
  quantity: number;
  date: string;
  status: 'en_attente' | 'valide' | 'rejete';
};

const initialSales: Sale[] = [];
const initialStocks: Stock[] = [];

function fcfa(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

export type DepositaireView =
  | 'pilotage'
  | 'ventes'
  | 'stocks'
  | 'performances'
  | 'primes'
  | 'difficultes'
  | 'historique';

const depositaireViewMeta: Record<
  DepositaireView,
  { title: string; description: string }
> = {
  pilotage: {
    title: 'Pilotage du dépôt',
    description: 'Les indicateurs essentiels de votre dépôt.',
  },
  ventes: {
    title: 'Ventes à vérifier',
    description: 'Validez ou rejetez les ventes déclarées par vos revendeurs.',
  },
  stocks: {
    title: 'Stocks à valider',
    description: 'Contrôlez les déclarations de stock de votre dépôt.',
  },
  performances: {
    title: 'Performances des revendeurs',
    description: 'Consultez les résultats des revendeurs de votre dépôt.',
  },
  primes: {
    title: 'Primes attribuées',
    description: 'Consultez les primes attribuées par l’administrateur.',
  },
  difficultes: {
    title: 'Difficultés signalées',
    description: 'Suivez les remontées PRIME de vos revendeurs.',
  },
  historique: {
    title: 'Historique traité',
    description: 'Retrouvez les ventes et les stocks déjà traités.',
  },
};

const depositaireNavigation = [
  { href: '/depositaire', view: 'pilotage', label: 'Pilotage', icon: BarChart3 },
  { href: '/depositaire/ventes', view: 'ventes', label: 'Ventes', icon: ShoppingCart },
  { href: '/depositaire/stocks', view: 'stocks', label: 'Stocks', icon: Boxes },
  {
    href: '/depositaire/performances',
    view: 'performances',
    label: 'Performances',
    icon: Users,
  },
  { href: '/depositaire/primes', view: 'primes', label: 'Primes', icon: Award },
  {
    href: '/depositaire/difficultes',
    view: 'difficultes',
    label: 'Difficultés',
    icon: MessageCircle,
  },
  {
    href: '/depositaire/historique',
    view: 'historique',
    label: 'Historique',
    icon: Check,
  },
] as const;

export function DepositaireDashboard({
  view = 'pilotage',
}: {
  view?: DepositaireView;
}) {
  const [sales, setSales] = useState(initialSales);
  const [stocks, setStocks] = useState(initialStocks);
  const [rejecting, setRejecting] = useState<{
    type: 'sale' | 'stock';
    id: number;
  } | null>(null);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');
  const [user, setUser] = useState<{
    name: string;
    depot: { name: string; location: string };
  } | null>(null);
  const [summary, setSummary] = useState({
    pending_sales: 0,
    pending_stocks: 0,
    today_revenue: 0,
    active_vendors: 0,
  });
  const [performances, setPerformances] = useState<
    Array<{
      seller: string;
      period: string;
      amount: string;
      score: number;
      valid: number;
      rejected: number;
    }>
  >([]);
  const [prizes, setPrizes] = useState<
    Array<{ seller: string; period: string; amount: string; date: string }>
  >([]);
  const [issues, setIssues] = useState<
    Array<{
      id: number;
      seller: string;
      category: string;
      description: string;
      date: string;
      state: string;
    }>
  >([]);
  const [loadError, setLoadError] = useState('');
  const pendingSales = sales.filter((sale) => sale.status === 'en_attente');
  const pendingStocks = stocks.filter((stock) => stock.status === 'en_attente');
  const validatedToday = useMemo(
    () => summary.today_revenue,
    [summary.today_revenue],
  );

  async function loadDashboard() {
    try {
      const [
        me,
        nextSummary,
        apiSales,
        apiStocks,
        apiPerformances,
        apiPrizes,
        apiIssues,
      ] = await Promise.all([
        apiFetch<any>('/api/me'),
        apiFetch<any>('/api/depositaire/summary'),
        apiFetch<any[]>('/api/depositaire/sales'),
        apiFetch<any[]>('/api/depositaire/stocks'),
        apiFetch<any[]>('/api/depositaire/performances'),
        apiFetch<any[]>('/api/depositaire/bonuses'),
        apiFetch<any[]>('/api/depositaire/difficulties'),
      ]);
      setUser(me);
      setSummary(nextSummary);
      setSales(
        apiSales.map((row) => ({
          id: row.id,
          seller: row.vendor.name,
          phone: row.vendor.phone,
          date: new Date(row.declared_at).toLocaleString('fr-FR'),
          amount: row.amount,
          place: row.location,
          lines: row.lines
            .map((line: any) => `${line.sku} × ${line.quantity}`)
            .join(' · '),
          status: row.status,
        })),
      );
      setStocks(
        apiStocks.map((row) => ({
          id: row.id,
          seller: row.vendor.name,
          product: `${row.product.name} (${row.product.sku})`,
          quantity: row.quantity,
          date: new Date(row.declared_at).toLocaleString('fr-FR'),
          status: row.status,
        })),
      );
      setPerformances(
        apiPerformances.map((row) => ({
          seller: row.vendor.name,
          period: row.period,
          amount: fcfa(row.total_sales),
          score: row.score,
          valid: row.validated_sales,
          rejected: row.rejected_sales,
        })),
      );
      setPrizes(
        apiPrizes.map((row) => ({
          seller: row.vendor.name,
          period: row.period,
          amount: `${fcfa(row.amount)} FCFA`,
          date: new Date(row.awarded_at).toLocaleDateString('fr-FR'),
        })),
      );
      setIssues(
        apiIssues.map((row) => ({
          id: row.id,
          seller: row.vendor.name,
          category: row.category,
          description: row.description,
          date: new Date(row.reported_at).toLocaleDateString('fr-FR'),
          state: row.state,
        })),
      );
      setLoadError('');
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Impossible de charger les données.',
      );
      if (!getToken())
        window.location.replace(
          `/connexion?returnTo=${encodeURIComponent(window.location.pathname)}`,
        );
    }
  }

  useEffect(() => {
    if (!getToken()) {
      window.location.replace(
        `/connexion?returnTo=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }
    loadDashboard();
  }, []);

  async function validateSale(id: number) {
    await apiFetch(`/api/depositaire/sales/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'validate' }),
    });
    await loadDashboard();
    setNotice(`Vente #${id} validée et notification transmise à Vendor‑Bot.`);
  }
  async function validateStock(id: number) {
    await apiFetch(`/api/depositaire/stocks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'validate' }),
    });
    await loadDashboard();
    setNotice(`Stock #${id} validé et notification transmise à Vendor‑Bot.`);
  }
  async function confirmReject() {
    if (!rejecting || !reason.trim()) return;
    await apiFetch(
      `/api/depositaire/${rejecting.type === 'sale' ? 'sales' : 'stocks'}/${rejecting.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ action: 'reject', reason: reason.trim() }),
      },
    );
    await loadDashboard();
    setNotice(
      `${rejecting.type === 'sale' ? 'Vente' : 'Stock'} #${rejecting.id} rejeté. Motif transmis via Vendor‑Bot.`,
    );
    setRejecting(null);
    setReason('');
  }

  return (
    <main className="dashboard-shell min-h-screen bg-[#f3f7fb] text-[#122043] transition-colors">
      <header className="sticky top-0 z-50 border-b border-blue-950/8 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-20 max-w-[1500px] items-center justify-between gap-4 px-5 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <img
              src="/fan-site/logo-clean.png"
              alt="FanMilk"
              className="h-13 w-auto"
            />
            <span className="hidden sm:block">
              <strong className="block text-sm text-[#082f70]">
                {user?.depot.name ?? 'Votre dépôt'}
              </strong>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="size-3" /> {user?.depot.location ?? 'Togo'}
              </span>
            </span>
          </a>
          <nav className="hidden items-center gap-2 text-xs font-black xl:flex">
            {depositaireNavigation.map((item) => (
              <a
                key={item.view}
                href={item.href}
                className={`rounded-lg px-3 py-2 ${view === item.view ? 'bg-blue-50 text-[#0a4ea8]' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-blue-200 text-[#073b86] xl:hidden"
                    aria-label="Ouvrir le menu de navigation"
                  />
                }
              >
                <Menu />
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[86vw] max-w-sm border-0 bg-[#073b86] p-0 text-white"
              >
                <SheetHeader className="border-b border-white/10 px-5 py-6 pr-14">
                  <div className="flex items-center gap-3">
                    <img
                      src="/fan-site/logo-clean.png"
                      alt="FanMilk"
                      className="h-12 w-15 object-contain"
                    />
                    <div>
                      <SheetTitle className="text-left font-black italic text-white">
                        {user?.depot.name ?? 'FanMilk Togo'}
                      </SheetTitle>
                      <SheetDescription className="text-left text-blue-100/65">
                        Espace dépositaire
                      </SheetDescription>
                    </div>
                  </div>
                </SheetHeader>
                <nav className="space-y-1 px-4 py-4 text-sm font-bold">
                  {depositaireNavigation.map(
                    ({ href, view: itemView, label, icon: Icon }) => (
                      <a
                        key={label}
                        href={href}
                        aria-current={view === itemView ? 'page' : undefined}
                        className={`flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 ${view === itemView ? 'bg-white text-[#073b86]' : 'text-blue-100/80 hover:bg-white/10 hover:text-white'}`}
                      >
                        <Icon className="size-5" />
                        {label}
                      </a>
                    ),
                  )}
                </nav>
                <div className="mt-auto border-t border-white/10 p-4">
                  <a
                    href="/profil"
                    className="flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-blue-100/80 hover:bg-white/10 hover:text-white"
                  >
                    <Users className="size-5" />
                    Profil et paramètres
                  </a>
                  <button
                    onClick={() => {
                      clearSession();
                      window.location.assign('/connexion?role=depositaire');
                    }}
                    className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-blue-100/80 hover:bg-white/10 hover:text-white"
                  >
                    <LogOut className="size-5" />
                    Déconnexion
                  </button>
                </div>
              </SheetContent>
            </Sheet>
            <DashboardTools
              name={user?.name ?? 'Dépositaire'}
              roleLabel="Dépositaire"
              notifications={[
                ...(summary.pending_sales > 0
                  ? [
                      {
                        title: `${summary.pending_sales} vente${summary.pending_sales > 1 ? 's' : ''} à vérifier`,
                        description: 'Des déclarations attendent votre validation.',
                        href: '/depositaire/ventes',
                      },
                    ]
                  : []),
                ...(summary.pending_stocks > 0
                  ? [
                      {
                        title: `${summary.pending_stocks} stock${summary.pending_stocks > 1 ? 's' : ''} à vérifier`,
                        description: 'Des stocks attendent votre validation.',
                        href: '/depositaire/stocks',
                      },
                    ]
                  : []),
              ]}
            />
            <button
              onClick={() => {
                clearSession();
                window.location.assign('/connexion?role=depositaire');
              }}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1500px] px-5 py-8 lg:px-8">
        {notice && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
            <MessageCircle className="mt-0.5 size-5 shrink-0" />
            <span>{notice}</span>
            <button onClick={() => setNotice('')} className="ml-auto">
              <X className="size-4" />
            </button>
          </div>
        )}
        {loadError && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {loadError}
          </div>
        )}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-[#0a4ea8]">
              Données de votre dépôt uniquement
            </p>
            <h1 className="mt-1 text-4xl font-black tracking-tight text-[#082f70]">
              {depositaireViewMeta[view].title}
            </h1>
            <p className="mt-2 text-slate-500">
              {depositaireViewMeta[view].description}
            </p>
          </div>
        </div>
        {view === 'pilotage' && (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              href: '/depositaire/ventes',
              label: 'Ventes en attente',
              value: pendingSales.length,
              suffix: 'à vérifier',
              icon: ShoppingCart,
              tone: 'bg-amber-50 text-amber-700',
            },
            {
              href: '/depositaire/stocks',
              label: 'Stocks en attente',
              value: pendingStocks.length,
              suffix: 'à vérifier',
              icon: Boxes,
              tone: 'bg-violet-50 text-violet-700',
            },
            {
              href: '/depositaire/historique',
              label: 'CA validé du jour',
              value: fcfa(validatedToday),
              suffix: 'FCFA',
              icon: BarChart3,
              tone: 'bg-emerald-50 text-emerald-700',
            },
            {
              href: '/depositaire/performances',
              label: 'Revendeurs actifs',
              value: summary.active_vendors,
              suffix: 'dans ce dépôt',
              icon: Users,
              tone: 'bg-blue-50 text-[#0a4ea8]',
            },
          ].map(({ href, label, value, suffix, icon: Icon, tone }) => (
            <a href={href} key={label}>
              <Card className="h-full border-0 bg-white ring-blue-950/7 transition-transform hover:-translate-y-1">
                <CardContent className="p-5">
                  <span
                    className={`grid size-11 place-items-center rounded-xl ${tone}`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <p className="mt-5 text-xs font-bold text-slate-500">
                    {label}
                  </p>
                  <p className="mt-1 text-3xl font-black text-[#082f70]">
                    {value}{' '}
                    <span className="text-xs text-slate-400">{suffix}</span>
                  </p>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
        )}

        {view === 'ventes' && (
        <Card className="mt-7 border-0 bg-white ring-blue-950/7">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Ventes à vérifier</CardTitle>
                <CardDescription>
                  Uniquement les ventes « en_attente » des revendeurs de SUPER
                  DEPOT
                </CardDescription>
              </div>
              <Badge className="bg-amber-50 text-amber-800">
                {pendingSales.length} en attente
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Revendeur</TableHead>
                  <TableHead>Date / lieu</TableHead>
                  <TableHead>Détail SKU</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead className="text-right">Décision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingSales.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <strong>{row.seller}</strong>
                      <span className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <Phone className="size-3" />
                        {row.phone}
                      </span>
                    </TableCell>
                    <TableCell>
                      <strong className="text-xs">{row.date}</strong>
                      <span className="mt-1 block text-xs text-slate-500">
                        {row.place}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {row.lines}
                    </TableCell>
                    <TableCell className="font-black">
                      {fcfa(row.amount)} FCFA
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => validateSale(row.id)}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Check />
                          Valider
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRejecting({ type: 'sale', id: row.id });
                            setReason('');
                          }}
                          className="border-red-200 text-red-700"
                        >
                          <X />
                          Rejeter
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!pendingSales.length && (
              <p className="py-10 text-center text-sm text-slate-500">
                Toutes les ventes ont été traitées.
              </p>
            )}
          </CardContent>
        </Card>
        )}

        {view === 'stocks' && (
        <Card className="mt-6 border-0 bg-white ring-blue-950/7">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Stocks à valider</CardTitle>
                <CardDescription>
                  Déclarations transmises par les revendeurs du dépôt
                </CardDescription>
              </div>
              <Badge className="bg-violet-50 text-violet-700">
                {pendingStocks.length} en attente
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Revendeur</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Décision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingStocks.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-bold">{row.seller}</TableCell>
                    <TableCell>{row.product}</TableCell>
                    <TableCell className="font-black">
                      {row.quantity} unités
                    </TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => validateStock(row.id)}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Check />
                          Valider
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRejecting({ type: 'stock', id: row.id });
                            setReason('');
                          }}
                          className="border-red-200 text-red-700"
                        >
                          <X />
                          Rejeter
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        )}

        {(view === 'performances' || view === 'primes') && (
        <section className="mt-6">
          {view === 'performances' && (
          <Card className="border-0 bg-white ring-blue-950/7">
            <CardHeader>
              <CardTitle>Performances de mes revendeurs</CardTitle>
              <CardDescription>
                Lecture seule · aucune attribution de prime depuis cet espace
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Revendeur</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Ventes</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Validées / rejetées</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performances.map((row) => (
                    <TableRow key={row.seller} className="cursor-pointer">
                      <TableCell className="font-bold">{row.seller}</TableCell>
                      <TableCell>{row.period}</TableCell>
                      <TableCell className="font-black">
                        {row.amount} FCFA
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-50 text-[#0a4ea8]">
                          {row.score}/100
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {row.valid} / {row.rejected}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          )}
          {view === 'primes' && (
          <Card className="border-0 bg-[#082f70] text-white ring-0">
            <CardHeader>
              <Award className="size-8 text-yellow-300" />
              <CardTitle className="text-white">Primes attribuées</CardTitle>
              <CardDescription className="text-blue-100/70">
                Consultation en lecture seule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {prizes.map((row) => (
                <div key={row.seller} className="rounded-2xl bg-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <strong>{row.seller}</strong>
                    <span className="font-black text-yellow-300">
                      {row.amount}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-blue-100/60">
                    {row.period} · attribuée le {row.date}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
          )}
        </section>
        )}

        {(view === 'difficultes' || view === 'historique') && (
        <section className="mt-6">
          {view === 'difficultes' && (
          <Card className="border-0 bg-white ring-blue-950/7">
            <CardHeader>
              <CardTitle>Difficultés signalées</CardTitle>
              <CardDescription>
                Cadre PRIME · consultation uniquement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {issues.map((row) => (
                <div
                  key={row.seller}
                  className="rounded-2xl border border-slate-100 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong>{row.seller}</strong>
                    <Badge
                      className={
                        row.state === 'ouverte'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                      }
                    >
                      {row.state}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm font-bold text-[#0a4ea8]">
                    {row.category}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {row.description}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Signalée le {row.date}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
          )}
          {view === 'historique' && (
          <Card className="border-0 bg-white ring-blue-950/7">
            <CardHeader>
              <CardTitle>Historique traité</CardTitle>
              <CardDescription>
                Filtrable par date et revendeur · lecture seule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <Input type="date" aria-label="Filtrer par date" />
                <Input
                  placeholder="Rechercher un revendeur…"
                  aria-label="Filtrer par revendeur"
                />
              </div>
              <div className="space-y-3">
                {[
                  ...sales
                    .filter((x) => x.status !== 'en_attente')
                    .map((x) => ({
                      id: `V-${x.id}`,
                      label: x.seller,
                      detail: `${fcfa(x.amount)} FCFA`,
                      status: x.status,
                    })),
                  ...stocks
                    .filter((x) => x.status !== 'en_attente')
                    .map((x) => ({
                      id: `S-${x.id}`,
                      label: x.seller,
                      detail: `${x.quantity} unités · ${x.product}`,
                      status: x.status,
                    })),
                ].map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm"
                  >
                    <span>
                      <strong>{row.id}</strong> · {row.label}
                      <small className="ml-2 text-slate-500">
                        {row.detail}
                      </small>
                    </span>
                    <Badge>{row.status}</Badge>
                  </div>
                ))}
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  Les éléments traités apparaîtront ici pendant la
                  démonstration.
                </p>
              </div>
            </CardContent>
          </Card>
          )}
        </section>
        )}
      </div>
      {rejecting && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[#07162f]/65 p-5 backdrop-blur-sm">
          <Card className="w-full max-w-lg bg-white">
            <CardHeader>
              <CardTitle>Motif de rejet obligatoire</CardTitle>
              <CardDescription>
                Ce motif sera transmis au revendeur par WhatsApp via Vendor‑Bot.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Exemple : le montant ne correspond pas au détail des produits…"
                className="min-h-28"
              />
              <div className="mt-5 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejecting(null);
                    setReason('');
                  }}
                >
                  Annuler
                </Button>
                <Button
                  disabled={!reason.trim()}
                  onClick={confirmReject}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Confirmer le rejet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}

export default function DepositairePage() {
  return <DepositaireDashboard view="pilotage" />;
}
