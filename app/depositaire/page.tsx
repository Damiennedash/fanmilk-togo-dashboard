'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BarChart3,
  Boxes,
  Check,
  LoaderCircle,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Settings,
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
import {
  apiFetch,
  apiFetchCached,
  clearSession,
  getStoredUser,
  getToken,
  invalidateApiCache,
} from '@/lib/api';

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
  {
    href: '/depositaire',
    view: 'pilotage',
    label: 'Pilotage',
    icon: BarChart3,
  },
  {
    href: '/depositaire/ventes',
    view: 'ventes',
    label: 'Ventes',
    icon: ShoppingCart,
  },
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
  const [activeView, setActiveView] = useState<DepositaireView>(view);
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
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  );
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [productTotals, setProductTotals] = useState<
    Array<{ sku: string; name: string; quantity: number }>
  >([]);
  const [productBreakdown, setProductBreakdown] = useState<
    Array<{
      vendor: { phone: string; name: string };
      depot: string;
      sku: string;
      product: string;
      quantity: number;
    }>
  >([]);
  const pendingSales = sales.filter((sale) => sale.status === 'en_attente');
  const pendingStocks = stocks.filter((stock) => stock.status === 'en_attente');
  const validatedToday = useMemo(
    () => summary.today_revenue,
    [summary.today_revenue],
  );

  async function loadDashboard(force = false) {
    try {
      const cached = <T,>(path: string) =>
        apiFetchCached<T>(path, { force, maxAge: 300_000 });
      const storedUser = getStoredUser();
      if (storedUser?.depot) {
        setUser({ name: storedUser.name, depot: storedUser.depot });
      }
      const mapSales = (rows: any[]) =>
        rows.map((row) => ({
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
        }));
      const mapStocks = (rows: any[]) =>
        rows.map((row) => ({
          id: row.id,
          seller: row.vendor.name,
          product: `${row.product.name} (${row.product.sku})`,
          quantity: row.quantity,
          date: new Date(row.declared_at).toLocaleString('fr-FR'),
          status: row.status,
        }));

      if (activeView === 'pilotage') {
        const [nextSummary, apiSales, apiStocks] = await Promise.all([
          cached<any>('/api/depositaire/summary'),
          cached<any[]>('/api/depositaire/sales?status=en_attente'),
          cached<any[]>('/api/depositaire/stocks?status=en_attente'),
        ]);
        setSummary(nextSummary);
        setSales(mapSales(apiSales));
        setStocks(mapStocks(apiStocks));
      } else if (activeView === 'ventes') {
        setSales(
          mapSales(
            await cached<any[]>('/api/depositaire/sales?status=en_attente'),
          ),
        );
      } else if (activeView === 'stocks') {
        const productParams = new URLSearchParams({ period: selectedMonth });
        if (dateFrom) productParams.set('date_from', dateFrom);
        if (dateTo) productParams.set('date_to', dateTo);
        const [apiStocks, totals, breakdown] = await Promise.all([
          cached<any[]>('/api/depositaire/stocks?status=en_attente'),
          cached<any[]>(`/api/depositaire/product-totals?${productParams.toString()}`),
          cached<any[]>(`/api/depositaire/product-breakdown?${productParams.toString()}`),
        ]);
        setStocks(mapStocks(apiStocks));
        setProductTotals(totals);
        setProductBreakdown(breakdown);
      } else if (activeView === 'performances') {
        const apiPerformances = await cached<any[]>(
          '/api/depositaire/performances',
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
      } else if (activeView === 'primes') {
        const apiPrizes = await cached<any[]>('/api/depositaire/bonuses');
        setPrizes(
          apiPrizes.map((row) => ({
            seller: row.vendor.name,
            period: row.period,
            amount: `${fcfa(row.amount)} FCFA`,
            date: new Date(row.awarded_at).toLocaleDateString('fr-FR'),
          })),
        );
      } else if (activeView === 'difficultes') {
        const apiIssues = await cached<any[]>('/api/depositaire/difficulties');
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
      } else if (activeView === 'historique') {
        const history = await cached<any>('/api/depositaire/history');
        setSales(mapSales(history.sales));
        setStocks(mapStocks(history.stocks));
      }
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
    const refreshTimer = window.setInterval(() => loadDashboard(true), 30000);
    return () => window.clearInterval(refreshTimer);
  }, [activeView, selectedMonth, dateFrom, dateTo]);

  useEffect(() => {
    if (!notice && !loadError) return;
    const timer = window.setTimeout(() => {
      setNotice('');
      setLoadError('');
    }, 5_000);
    return () => window.clearTimeout(timer);
  }, [notice, loadError]);

  useEffect(() => {
    const syncViewWithUrl = () => {
      const matchingItem = depositaireNavigation.find(
        (item) => item.href === window.location.pathname,
      );
      setActiveView((matchingItem?.view ?? 'pilotage') as DepositaireView);
    };
    window.addEventListener('popstate', syncViewWithUrl);
    return () => window.removeEventListener('popstate', syncViewWithUrl);
  }, []);

  async function validateSale(id: number) {
    const previousSales = sales;
    setBusyAction(`sale-${id}`);
    setSales((current) => current.filter((sale) => sale.id !== id));
    setSummary((current) => ({
      ...current,
      pending_sales: Math.max(0, current.pending_sales - 1),
    }));
    setNotice(`Validation de la vente #${id} en cours…`);
    try {
      await apiFetch(`/api/depositaire/sales/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'validate' }),
      });
      invalidateApiCache();
      setNotice(`Vente #${id} validée et notification transmise à Vendor‑Bot.`);
      void loadDashboard(true);
    } catch (error) {
      setSales(previousSales);
      setSummary((current) => ({
        ...current,
        pending_sales: current.pending_sales + 1,
      }));
      setLoadError(
        error instanceof Error ? error.message : 'Validation impossible.',
      );
    } finally {
      setBusyAction(null);
    }
  }
  async function validateStock(id: number) {
    const previousStocks = stocks;
    setBusyAction(`stock-${id}`);
    setStocks((current) => current.filter((stock) => stock.id !== id));
    setSummary((current) => ({
      ...current,
      pending_stocks: Math.max(0, current.pending_stocks - 1),
    }));
    setNotice(`Validation du stock #${id} en cours…`);
    try {
      await apiFetch(`/api/depositaire/stocks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'validate' }),
      });
      invalidateApiCache();
      setNotice(`Stock #${id} validé et notification transmise à Vendor‑Bot.`);
      void loadDashboard(true);
    } catch (error) {
      setStocks(previousStocks);
      setSummary((current) => ({
        ...current,
        pending_stocks: current.pending_stocks + 1,
      }));
      setLoadError(
        error instanceof Error ? error.message : 'Validation impossible.',
      );
    } finally {
      setBusyAction(null);
    }
  }
  async function confirmReject() {
    if (!rejecting || !reason.trim()) return;
    const target = rejecting;
    const previousSales = sales;
    const previousStocks = stocks;
    setBusyAction(`${target.type}-${target.id}`);
    if (target.type === 'sale') {
      setSales((current) => current.filter((sale) => sale.id !== target.id));
      setSummary((current) => ({
        ...current,
        pending_sales: Math.max(0, current.pending_sales - 1),
      }));
    } else {
      setStocks((current) => current.filter((stock) => stock.id !== target.id));
      setSummary((current) => ({
        ...current,
        pending_stocks: Math.max(0, current.pending_stocks - 1),
      }));
    }
    setRejecting(null);
    setNotice(
      `Rejet ${target.type === 'sale' ? 'de la vente' : 'du stock'} #${target.id} en cours…`,
    );
    try {
      await apiFetch(
        `/api/depositaire/${target.type === 'sale' ? 'sales' : 'stocks'}/${target.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ action: 'reject', reason: reason.trim() }),
        },
      );
      invalidateApiCache();
      setNotice(
        `${target.type === 'sale' ? 'Vente' : 'Stock'} #${target.id} rejeté. Motif transmis via Vendor‑Bot.`,
      );
      setReason('');
      void loadDashboard(true);
    } catch (error) {
      setSales(previousSales);
      setStocks(previousStocks);
      setSummary((current) => ({
        ...current,
        pending_sales:
          target.type === 'sale'
            ? current.pending_sales + 1
            : current.pending_sales,
        pending_stocks:
          target.type === 'stock'
            ? current.pending_stocks + 1
            : current.pending_stocks,
      }));
      setRejecting(target);
      setLoadError(error instanceof Error ? error.message : 'Rejet impossible.');
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <main className="dashboard-shell min-h-screen bg-[#f3f7fb] text-[#122043] transition-colors lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col bg-[#073b86] px-4 py-5 text-white lg:flex">
        <a href="/" className="flex items-center gap-3 px-2">
          <img
            src="/fan-site/logo-clean.png"
            alt="FanMilk"
            className="h-12 w-15 object-contain"
          />
          <span>
            <strong className="block text-sm italic text-white">
              FanMilk Togo
            </strong>
            <small className="text-[10px] uppercase tracking-[.16em] text-blue-100/60">
              Espace dépositaire
            </small>
          </span>
        </a>
        <div className="mx-2 mt-6 rounded-2xl border border-white/10 bg-white/8 p-3">
          <strong className="block truncate text-xs text-white">
            {user?.depot.name ?? 'Votre dépôt'}
          </strong>
          <span className="mt-1 flex items-center gap-1 text-[11px] text-blue-100/65">
            <MapPin className="size-3" /> {user?.depot.location ?? 'Togo'}
          </span>
        </div>
        <nav className="mt-6 space-y-1 text-sm font-bold">
          {depositaireNavigation.map(
            ({ href, view: itemView, label, icon: Icon }) => (
              <a
                key={label}
                href={href}
                onClick={(event) => {
                  event.preventDefault();
                  window.history.pushState({}, '', href);
                  setActiveView(itemView);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                aria-current={activeView === itemView ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${activeView === itemView ? 'bg-white text-[#073b86]' : 'text-blue-100/70 hover:bg-white/10 hover:text-white'}`}
              >
                <Icon className="size-4" />
                {label}
              </a>
            ),
          )}
        </nav>
        <div className="mt-auto border-t border-white/10 pt-4">
          <a
            href="/profil"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-100/65 hover:bg-white/10 hover:text-white"
          >
            <Settings className="size-4" />
            Paramètres
          </a>
          <button
            onClick={() => {
              clearSession();
              window.location.assign('/connexion');
            }}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-100/65 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-4" />
            Déconnexion
          </button>
        </div>
      </aside>
      <section className="min-w-0">
        <header className="sticky top-0 z-50 flex min-h-20 items-center justify-between gap-3 border-b border-blue-950/8 bg-white/95 px-5 backdrop-blur lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 border-blue-200 text-[#073b86] lg:hidden"
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
                        onClick={(event) => {
                          event.preventDefault();
                          window.history.pushState({}, '', href);
                          setActiveView(itemView);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        aria-current={activeView === itemView ? 'page' : undefined}
                        className={`flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 ${activeView === itemView ? 'bg-white text-[#073b86]' : 'text-blue-100/80 hover:bg-white/10 hover:text-white'}`}
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
            <div className="min-w-0">
              <strong className="block truncate text-sm text-[#082f70]">
                {user?.depot.name ?? 'Votre dépôt'}
              </strong>
              <span className="flex items-center gap-1 truncate text-xs text-slate-500">
                <MapPin className="size-3" /> {user?.depot.location ?? 'Togo'}
              </span>
            </div>
          </div>
          <DashboardTools
            name={user?.name ?? 'Dépositaire'}
            roleLabel="Dépositaire"
            notifications={[
              ...(summary.pending_sales > 0
                ? [
                    {
                      title: `${summary.pending_sales} vente${summary.pending_sales > 1 ? 's' : ''} à vérifier`,
                      description:
                        'Des déclarations attendent votre validation.',
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
        </header>
        <div className="px-5 py-8 lg:px-8">
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
                {depositaireViewMeta[activeView].title}
              </h1>
              <p className="mt-2 text-slate-500">
                {depositaireViewMeta[activeView].description}
              </p>
            </div>
          </div>
          {activeView === 'pilotage' && (
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

          {activeView === 'ventes' && (
            <Card className="mt-7 border-0 bg-white ring-blue-950/7">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle>Ventes à vérifier</CardTitle>
                    <CardDescription>
                      Uniquement les ventes « en_attente » des revendeurs de
                      {user?.depot.name ?? 'votre dépôt'}
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
                              disabled={busyAction !== null}
                              onClick={() => validateSale(row.id)}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              {busyAction === `sale-${row.id}` ? (
                                <LoaderCircle className="animate-spin" />
                              ) : (
                                <Check />
                              )}
                              {busyAction === `sale-${row.id}`
                                ? 'Validation…'
                                : 'Valider'}
                            </Button>
                            <Button
                              size="sm"
                              disabled={busyAction !== null}
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

          {activeView === 'stocks' && (
            <div className="mt-6 space-y-6">
              <div className="flex flex-wrap justify-end gap-3">
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  className="w-auto bg-white"
                  aria-label="Mois des stocks vendus"
                />
                <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-auto bg-white" aria-label="Date de début" />
                <Input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} className="w-auto bg-white" aria-label="Date de fin" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {productTotals.map((product) => {
                  const image = product.sku === 'FANXTRA' ? '/fan-site/fanxtra.png' : product.sku === 'FANCHOCO' ? '/fan-site/fanchoco.jpg' : '/fan-site/fanvanille.png';
                  return (
                    <Card key={product.sku} className="border-0 bg-white ring-blue-950/7">
                      <CardContent className="flex items-center gap-4 p-5">
                        <img src={image} alt={product.name} className="size-20 rounded-xl object-contain" />
                        <div><p className="font-black text-[#082f70]">{product.name}</p><p className="text-3xl font-black">{product.quantity}</p><p className="text-xs text-slate-500">unités vendues au total</p></div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <Card className="border-0 bg-white ring-blue-950/7">
                <CardHeader><CardTitle>Ventes par produit et par revendeur</CardTitle><CardDescription>Quantités validées sur le mois sélectionné.</CardDescription></CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table><TableHeader><TableRow><TableHead>Revendeur</TableHead><TableHead>Produit</TableHead><TableHead>Quantité</TableHead></TableRow></TableHeader><TableBody>
                    {productBreakdown.map((row) => <TableRow key={`${row.vendor.phone}-${row.sku}`}><TableCell className="font-bold">{row.vendor.name}</TableCell><TableCell>{row.product}</TableCell><TableCell>{row.quantity}</TableCell></TableRow>)}
                    {!productBreakdown.length && <TableRow><TableCell colSpan={3} className="py-8 text-center text-slate-500">Aucune vente validée pour cette période.</TableCell></TableRow>}
                  </TableBody></Table>
                </CardContent>
              </Card>
            <Card className="border-0 bg-white ring-blue-950/7">
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
                        <TableCell className="font-bold">
                          {row.seller}
                        </TableCell>
                        <TableCell>{row.product}</TableCell>
                        <TableCell className="font-black">
                          {row.quantity} unités
                        </TableCell>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              disabled={busyAction !== null}
                              onClick={() => validateStock(row.id)}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              {busyAction === `stock-${row.id}` ? (
                                <LoaderCircle className="animate-spin" />
                              ) : (
                                <Check />
                              )}
                              {busyAction === `stock-${row.id}`
                                ? 'Validation…'
                                : 'Valider'}
                            </Button>
                            <Button
                              size="sm"
                              disabled={busyAction !== null}
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
            </div>
          )}

          {(activeView === 'performances' || activeView === 'primes') && (
            <section className="mt-6">
              {activeView === 'performances' && (
                <Card className="border-0 bg-white ring-blue-950/7">
                  <CardHeader>
                    <CardTitle>Performances de mes revendeurs</CardTitle>
                    <CardDescription>
                      Lecture seule · aucune attribution de prime depuis cet
                      espace
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
                            <TableCell className="font-bold">
                              {row.seller}
                            </TableCell>
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
              {activeView === 'primes' && (
                <Card className="border-0 bg-[#082f70] text-white ring-0">
                  <CardHeader>
                    <Award className="size-8 text-yellow-300" />
                    <CardTitle className="text-white">
                      Primes attribuées
                    </CardTitle>
                    <CardDescription className="text-blue-100/70">
                      Consultation en lecture seule
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {prizes.map((row) => (
                      <div
                        key={row.seller}
                        className="rounded-2xl bg-white/10 p-4"
                      >
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

          {(activeView === 'difficultes' || activeView === 'historique') && (
            <section className="mt-6">
              {activeView === 'difficultes' && (
                <Card className="border-0 bg-white ring-blue-950/7">
                  <CardHeader>
                    <CardTitle>Difficultés signalées</CardTitle>
                    <CardDescription>
                      Cadre PRIME · consultation uniquement
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        ['Ouvertes', 'ouverte', 'border-red-200 bg-red-50 text-red-800'],
                        ['En cours', 'en_cours', 'border-amber-200 bg-amber-50 text-amber-800'],
                        ['Résolues', 'resolue', 'border-emerald-200 bg-emerald-50 text-emerald-800'],
                      ].map(([label, state, tone]) => (
                        <div key={state} className={`rounded-xl border p-3 ${tone}`}>
                          <strong className="text-2xl">{issues.filter((item) => item.state === state).length}</strong>
                          <span className="ml-2 text-sm font-bold">{label}</span>
                        </div>
                      ))}
                    </div>
                    {[...issues].sort((a, b) => {
                      const rank: Record<string, number> = { ouverte: 0, en_cours: 1, resolue: 2 };
                      return rank[a.state] - rank[b.state];
                    }).map((row) => (
                      <div
                        key={row.id}
                        className={`rounded-2xl border p-4 ${row.state === 'resolue' ? 'border-emerald-200 bg-emerald-50/60' : row.state === 'en_cours' ? 'border-amber-200 bg-amber-50/60' : 'border-red-200 bg-red-50/60'}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <strong>{row.seller}</strong>
                          <Badge
                            className={
                              row.state === 'resolue'
                                ? 'bg-emerald-600 text-white'
                                : row.state === 'en_cours'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-red-600 text-white'
                            }
                          >
                            {row.state.replace('_', ' ')}
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
                    {!issues.length && <p className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">Aucune difficulté signalée.</p>}
                  </CardContent>
                </Card>
              )}
              {activeView === 'historique' && (
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
      </section>
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
                  disabled={!reason.trim() || busyAction !== null}
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
