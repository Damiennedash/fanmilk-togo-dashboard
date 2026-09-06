'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Award,
  BarChart3,
  Bell,
  CircleDollarSign,
  Database,
  LogOut,
  Menu,
  Pencil,
  Plus,
  RefreshCw,
  Settings,
  Users,
  UserRoundSearch,
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
import { Label } from '@/components/ui/label';
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
import {
  apiFetch,
  apiFetchCached,
  clearSession,
  getStoredUser,
  getToken,
  invalidateApiCache,
} from '@/lib/api';

type Account = {
  id: number;
  name: string;
  email: string;
  role: 'administrateur' | 'depositaire' | 'revendeur';
  depot: string;
  depotId: number | null;
  phone?: string;
  active: boolean;
};
type VendorRow = {
  phone: string;
  name: string;
  depot: string;
  active: boolean;
  salesCount: number;
  lastSalesAmount: number;
  lastDeclarationAt?: string | null;
};
type Issue = {
  id: number;
  seller: string;
  depot: string;
  category: string;
  description: string;
  date: string;
  state: 'ouverte' | 'en_cours' | 'resolue';
};
type Performance = {
  seller: string;
  phone: string;
  depot: string;
  amount: string;
  score: number;
  average: number;
  period: string;
  suggested: number;
  eligible: boolean;
  validated: number;
  rejected: number;
  pending: number;
};
type BonusRow = {
  id: number;
  seller: string;
  depot: string;
  period: string;
  amount: number;
  date: string;
};

const initialAccounts: Account[] = [];
const initialIssues: Issue[] = [];

export type AdminView =
  | 'pilotage'
  | 'comptes'
  | 'revendeurs'
  | 'performances'
  | 'difficultes'
  | 'donnees';

const adminViewMeta: Record<AdminView, { title: string; description: string }> =
  {
    pilotage: {
      title: 'Pilotage du réseau',
      description: 'Les indicateurs nationaux consolidés par Vendor‑Bot.',
    },
    comptes: {
      title: 'Gestion des utilisateurs',
      description: 'Créez les comptes et gérez leur accès au réseau FanMilk.',
    },
    revendeurs: {
      title: 'Liste des revendeurs',
      description:
        'Consultez tous les revendeurs enregistrés par compte ou par WhatsApp.',
    },
    performances: {
      title: 'Performances et primes',
      description: 'Analysez les résultats et attribuez les primes.',
    },
    difficultes: {
      title: 'Difficultés PRIME',
      description:
        'Suivez et traitez les difficultés remontées par le terrain.',
    },
    donnees: {
      title: 'Ventes et stocks',
      description: 'Consultez les déclarations de tous les dépôts.',
    },
  };

const adminNavigation = [
  {
    href: '/dashboard',
    view: 'pilotage',
    label: 'Pilotage national',
    icon: BarChart3,
  },
  {
    href: '/dashboard/comptes',
    view: 'comptes',
    label: 'Comptes utilisateurs',
    icon: Users,
  },
  {
    href: '/dashboard/revendeurs',
    view: 'revendeurs',
    label: 'Revendeurs',
    icon: UserRoundSearch,
  },
  {
    href: '/dashboard/performances',
    view: 'performances',
    label: 'Performances & primes',
    icon: Award,
  },
  {
    href: '/dashboard/difficultes',
    view: 'difficultes',
    label: 'Difficultés PRIME',
    icon: AlertTriangle,
  },
  {
    href: '/dashboard/donnees',
    view: 'donnees',
    label: 'Ventes & stocks',
    icon: Database,
  },
] as const;

export function AdminDashboard({ view = 'pilotage' }: { view?: AdminView }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [issues, setIssues] = useState(initialIssues);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountRole, setAccountRole] =
    useState<Account['role']>('administrateur');
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editRole, setEditRole] = useState<Account['role']>('administrateur');
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [prize, setPrize] = useState<Performance | null>(null);
  const [prizeAmount, setPrizeAmount] = useState('');
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [bonuses, setBonuses] = useState<BonusRow[]>([]);
  const [globalRows, setGlobalRows] = useState<
    Array<{
      type: string;
      ref: string;
      seller: string;
      depot: string;
      detail: string;
      status: string;
    }>
  >([]);
  const [depots, setDepots] = useState<Array<{ id: number; name: string }>>([]);
  const [summary, setSummary] = useState({
    active_vendors: 0,
    validated_revenue: 0,
    open_difficulties: 0,
    awarded_bonuses: 0,
  });
  const [adminName, setAdminName] = useState('Administrateur');
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const monthKey = (value: Date) =>
    `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(monthKey(now));
  const [selectedDepot, setSelectedDepot] = useState('');
  const todayLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Lome',
  }).format(now);
  const currentMonth = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Lome',
  }).format(now);
  const previousMonthDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  );
  const previousMonth = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Lome',
  }).format(previousMonthDate);
  const capitalize = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);
  const monthOptions = [
    { value: monthKey(now), label: capitalize(currentMonth) },
    { value: monthKey(previousMonthDate), label: capitalize(previousMonth) },
  ];

  async function loadDashboard(force = false) {
    setLoading(true);
    try {
      const cached = <T,>(path: string) =>
        apiFetchCached<T>(path, { force, maxAge: 15_000 });
      const storedUser = getStoredUser();
      if (storedUser?.name) setAdminName(storedUser.name);
      const depotQuery = selectedDepot ? `?depot_id=${selectedDepot}` : '';

      if (view === 'pilotage') {
        const summarySeparator = selectedDepot ? '&' : '?';
        const [nextSummary, sales, stocks, apiDepots] = await Promise.all([
          cached<any>(
            `/api/admin/summary${depotQuery}${summarySeparator}period=${selectedMonth}`,
          ),
          cached<any[]>(`/api/admin/sales${depotQuery}`),
          cached<any[]>(`/api/admin/stocks${depotQuery}`),
          cached<any[]>('/api/admin/depots'),
        ]);
        setSummary(nextSummary);
        setDepots(apiDepots);
        setGlobalRows([
          ...sales.map((row) => ({
            type: 'Vente',
            ref: `V-${row.id}`,
            seller: row.vendor.name,
            depot: row.depot.name,
            detail: `${Number(row.amount).toLocaleString('fr-FR')} FCFA`,
            status: row.status,
          })),
          ...stocks.map((row) => ({
            type: 'Stock',
            ref: `S-${row.id}`,
            seller: row.vendor.name,
            depot: row.depot.name,
            detail: `${row.product.sku} · ${row.quantity} unités`,
            status: row.status,
          })),
        ]);
      } else if (view === 'comptes') {
        const [apiAccounts, apiDepots] = await Promise.all([
          cached<any[]>('/api/admin/users'),
          cached<any[]>('/api/admin/depots'),
        ]);
        setDepots(apiDepots);
        setAccounts(
          apiAccounts.map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            role: row.role,
            depot: row.depot?.name ?? 'Vue nationale',
            depotId: row.depot?.id ?? null,
            phone: row.phone,
            active: row.active,
          })),
        );
      } else if (view === 'revendeurs') {
        const [apiVendors, apiDepots] = await Promise.all([
          cached<any[]>(`/api/admin/vendors${depotQuery}`),
          cached<any[]>('/api/admin/depots'),
        ]);
        setDepots(apiDepots);
        setVendors(
          apiVendors.map((row) => ({
            phone: row.phone,
            name: row.name,
            depot: row.depot.name,
            active: row.active,
            salesCount: row.sales_count,
            lastSalesAmount: Number(row.last_sales_amount || 0),
            lastDeclarationAt: row.last_declaration_at,
          })),
        );
      } else if (view === 'performances') {
        const separator = selectedDepot ? '&' : '?';
        const [apiPerformances, apiBonuses, apiDepots] = await Promise.all([
          cached<any[]>(
            `/api/admin/performances${depotQuery}${separator}period=${selectedMonth}`,
          ),
          cached<any[]>('/api/admin/bonuses'),
          cached<any[]>('/api/admin/depots'),
        ]);
        setDepots(apiDepots);
        setPerformances(
          apiPerformances.map((row) => ({
            seller: row.vendor.name,
            phone: row.vendor.phone,
            depot: row.depot.name,
            amount: Number(row.total_sales).toLocaleString('fr-FR'),
            score: row.score,
            average: Number(row.depot_average),
            period: row.period,
            suggested: Number(row.suggested_bonus),
            eligible: row.eligible,
            validated: row.validated_sales,
            rejected: row.rejected_sales,
            pending: row.pending_sales,
          })),
        );
        setBonuses(
          apiBonuses.map((row) => ({
            id: row.id,
            seller: row.vendor.name,
            depot: row.depot.name,
            period: row.period,
            amount: Number(row.amount),
            date: new Date(row.awarded_at).toLocaleDateString('fr-FR'),
          })),
        );
      } else if (view === 'difficultes') {
        const [apiIssues, apiDepots] = await Promise.all([
          cached<any[]>(`/api/admin/difficulties${depotQuery}`),
          cached<any[]>('/api/admin/depots'),
        ]);
        setDepots(apiDepots);
        setIssues(
          apiIssues.map((row) => ({
            id: row.id,
            seller: row.vendor.name,
            depot: row.depot.name,
            category: row.category,
            description: row.description,
            date: new Date(row.reported_at).toLocaleDateString('fr-FR'),
            state: row.state,
          })),
        );
      } else if (view === 'donnees') {
        const [sales, stocks, apiDepots] = await Promise.all([
          cached<any[]>(`/api/admin/sales${depotQuery}`),
          cached<any[]>(`/api/admin/stocks${depotQuery}`),
          cached<any[]>('/api/admin/depots'),
        ]);
        setDepots(apiDepots);
        setGlobalRows([
          ...sales.map((row) => ({
            type: 'Vente',
            ref: `V-${row.id}`,
            seller: row.vendor.name,
            depot: row.depot.name,
            detail: `${Number(row.amount).toLocaleString('fr-FR')} FCFA`,
            status: row.status,
          })),
          ...stocks.map((row) => ({
            type: 'Stock',
            ref: `S-${row.id}`,
            seller: row.vendor.name,
            depot: row.depot.name,
            detail: `${row.product.sku} · ${row.quantity} unités`,
            status: row.status,
          })),
        ]);
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
    } finally {
      setLoading(false);
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
  }, [view, selectedMonth, selectedDepot]);

  function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    setActionError('');
    const form = new FormData(event.currentTarget);
    const role = form.get('role') as Account['role'];
    const depot = depots.find(
      (item) => item.name === String(form.get('depot')),
    );
    apiFetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        name: form.get('name'),
        email: form.get('email'),
        role,
        depot_id: role === 'administrateur' ? null : depot?.id,
        phone:
          role === 'revendeur' ? String(form.get('phone') ?? '').trim() : null,
        password: 'FanMilk-Temp-2026!',
      }),
    })
      .then(async () => {
        invalidateApiCache();
        await loadDashboard(true);
        setShowAccountForm(false);
        setAccountRole('administrateur');
        setNotice('Compte créé. Mot de passe temporaire : FanMilk-Temp-2026!');
      })
      .catch((error) =>
        setActionError(
          error instanceof Error
            ? error.message
            : 'Impossible de créer ce compte.',
        ),
      );
  }

  async function updateAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAccount) return;
    setActionError('');
    const form = new FormData(event.currentTarget);
    try {
      await apiFetch(`/api/admin/users/${editingAccount.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          role: editRole,
          depot_id:
            editRole === 'administrateur' ? null : Number(form.get('depot_id')),
          phone:
            editRole === 'revendeur'
              ? String(form.get('phone') ?? '').trim()
              : null,
          password: String(form.get('password') ?? ''),
        }),
      });
      invalidateApiCache();
      await loadDashboard(true);
      setEditingAccount(null);
      setNotice('Profil utilisateur modifié avec succès.');
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Modification impossible.',
      );
    }
  }

  async function nextIssueState(id: number) {
    const row = issues.find((item) => item.id === id);
    if (!row) return;
    await apiFetch(`/api/admin/difficulties/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        state: row.state === 'ouverte' ? 'en_cours' : 'resolue',
      }),
    });
    invalidateApiCache();
    await loadDashboard(true);
    setNotice('État de la difficulté enregistré.');
  }
  async function assignPrize() {
    if (!prize || !Number(prizeAmount)) return;
    await apiFetch('/api/admin/bonuses', {
      method: 'POST',
      body: JSON.stringify({
        vendor_phone: prize.phone,
        period: prize.period,
        amount: Number(prizeAmount),
      }),
    });
    invalidateApiCache();
    await loadDashboard(true);
    setNotice(
      `Prime de ${Number(prizeAmount).toLocaleString('fr-FR')} FCFA attribuée à ${prize.seller}.`,
    );
    setPrize(null);
    setPrizeAmount('');
  }
  async function toggleAccount(row: Account) {
    try {
      await apiFetch(`/api/admin/users/${row.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !row.active }),
      });
      invalidateApiCache();
      await loadDashboard(true);
      setNotice(`Compte ${row.active ? 'suspendu' : 'réactivé'}.`);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Action impossible.',
      );
    }
  }

  return (
    <main className="dashboard-shell min-h-screen bg-[#f3f7fb] text-[#122043] transition-colors lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="hidden min-h-screen flex-col bg-[#073b86] px-4 py-5 text-white lg:flex">
        <Link href="/" className="flex items-center gap-3 px-2">
          <img
            src="/fan-site/logo-clean.png"
            alt="FanMilk"
            className="h-12 w-15 object-contain"
          />
          <span>
            <strong className="block text-sm italic">FanMilk Togo</strong>
            <small className="text-[10px] uppercase tracking-[.16em] text-blue-100/60">
              Administration nationale
            </small>
          </span>
        </Link>
        <nav className="mt-10 space-y-1 text-sm font-bold">
          {adminNavigation.map(
            ({ href, view: itemView, label, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 ${view === itemView ? 'bg-white text-[#073b86]' : 'text-blue-100/70 hover:bg-white/10 hover:text-white'}`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ),
          )}
        </nav>
        <div className="mt-auto border-t border-white/10 pt-4">
          <Link
            href="/profil"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-100/65"
          >
            <Settings className="size-4" />
            Paramètres
          </Link>
          <button
            onClick={() => {
              clearSession();
              window.location.assign('/connexion?role=admin');
            }}
            className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-100/65"
          >
            <LogOut className="size-4" />
            Déconnexion
          </button>
        </div>
      </aside>
      <section className="min-w-0">
        <header className="sticky top-0 z-50 flex min-h-20 items-center justify-between border-b border-blue-950/8 bg-white/95 px-5 backdrop-blur lg:px-8">
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
                        FanMilk Togo
                      </SheetTitle>
                      <SheetDescription className="text-left text-blue-100/65">
                        Administration nationale
                      </SheetDescription>
                    </div>
                  </div>
                </SheetHeader>
                <nav className="space-y-1 px-4 py-4 text-sm font-bold">
                  {adminNavigation.map(
                    ({ href, view: itemView, label, icon: Icon }) => (
                      <Link
                        key={label}
                        href={href}
                        aria-current={view === itemView ? 'page' : undefined}
                        className={`flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 ${view === itemView ? 'bg-white text-[#073b86]' : 'text-blue-100/80 hover:bg-white/10 hover:text-white'}`}
                      >
                        <Icon className="size-5" />
                        {label}
                      </Link>
                    ),
                  )}
                </nav>
                <div className="mt-auto border-t border-white/10 p-4">
                  <Link
                    href="/profil"
                    className="flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-blue-100/80 hover:bg-white/10 hover:text-white"
                  >
                    <Settings className="size-5" />
                    Profil et paramètres
                  </Link>
                  <button
                    onClick={() => {
                      clearSession();
                      window.location.assign('/connexion?role=admin');
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
                Vue nationale
              </strong>
              <span className="block truncate text-xs text-slate-500">
                Aucun filtre de dépôt imposé
              </span>
            </div>
          </div>
          <DashboardTools
            name={adminName}
            roleLabel="Administrateur"
            notifications={[
              {
                title: `${summary.open_difficulties} difficulté${summary.open_difficulties > 1 ? 's' : ''} à suivre`,
                description: 'Consultez les remontées PRIME ouvertes.',
                href: '/dashboard/difficultes',
              },
            ].filter(() => summary.open_difficulties > 0)}
          />
        </header>
        <div className="p-5 lg:p-8">
          {notice && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
              <Bell className="size-5" />
              {notice}
              <button className="ml-auto" onClick={() => setNotice('')}>
                ×
              </button>
            </div>
          )}
          {actionError && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              <AlertTriangle className="size-5 shrink-0" />
              {actionError}
              <button className="ml-auto" onClick={() => setActionError('')}>
                ×
              </button>
            </div>
          )}
          {loadError && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {loadError}
            </div>
          )}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black text-[#0a4ea8]">
                {capitalize(todayLabel)}
              </p>
              <h1 className="mt-1 text-4xl font-black text-[#082f70]">
                {adminViewMeta[view].title}
              </h1>
              <p className="mt-2 text-slate-500">
                {adminViewMeta[view].description}
              </p>
            </div>
            <div className="flex gap-3">
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="h-10 rounded-xl border bg-white px-3 text-sm font-bold"
                aria-label="Période"
              >
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedDepot}
                onChange={(event) => setSelectedDepot(event.target.value)}
                className="h-10 rounded-xl border bg-white px-3 text-sm font-bold"
                aria-label="Dépôt"
              >
                <option value="">Tous les dépôts</option>
                {depots.map((depot) => (
                  <option key={depot.id} value={depot.id}>
                    {depot.name}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => loadDashboard(true)}
                aria-label="Actualiser les données Vendor-Bot"
                title="Actualiser les données"
              >
                <RefreshCw className={loading ? 'animate-spin' : ''} />
              </Button>
            </div>
          </div>
          {loading && (
            <div
              className="mt-5 h-1 overflow-hidden rounded-full bg-blue-100"
              role="status"
              aria-label="Chargement des données"
            >
              <div className="h-full w-1/3 animate-pulse rounded-full bg-[#0a4ea8]" />
            </div>
          )}
          {view === 'pilotage' && (
            <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: 'Revendeurs actifs',
                  value: String(summary.active_vendors),
                  note: 'réseau national',
                  icon: Users,
                  tone: 'bg-blue-50 text-blue-700',
                },
                {
                  label: 'CA validé',
                  value: Number(summary.validated_revenue).toLocaleString(
                    'fr-FR',
                  ),
                  note: 'FCFA sur la période',
                  icon: CircleDollarSign,
                  tone: 'bg-emerald-50 text-emerald-700',
                },
                {
                  label: 'Difficultés ouvertes',
                  value: String(summary.open_difficulties),
                  note: 'à suivre',
                  icon: AlertTriangle,
                  tone: 'bg-red-50 text-red-700',
                },
                {
                  label: 'Primes attribuées',
                  value: Number(summary.awarded_bonuses).toLocaleString(
                    'fr-FR',
                  ),
                  note: 'FCFA sur la période',
                  icon: Award,
                  tone: 'bg-yellow-50 text-yellow-800',
                },
              ].map(({ label, value, note, icon: Icon, tone }) => (
                <Card key={label} className="border-0 bg-white ring-blue-950/7">
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
                      {value}
                    </p>
                    <p className="text-xs text-slate-400">{note}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {view === 'pilotage' && (
            <Card className="mt-6 border-0 bg-white ring-blue-950/7">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>Dernières soumissions Vendor‑Bot</CardTitle>
                    <CardDescription>
                      Une vente en attente apparaît ici immédiatement, mais elle
                      entre dans le CA seulement après validation du
                      dépositaire.
                    </CardDescription>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800">
                    {
                      globalRows.filter(
                        (row) =>
                          row.type === 'Vente' && row.status === 'en_attente',
                      ).length
                    }{' '}
                    vente(s) en attente
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {globalRows.length ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Référence</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Revendeur</TableHead>
                          <TableHead>Dépôt</TableHead>
                          <TableHead>Détail</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {globalRows.slice(0, 6).map((row) => (
                          <TableRow key={`${row.type}-${row.ref}`}>
                            <TableCell className="font-bold">
                              {row.ref}
                            </TableCell>
                            <TableCell>{row.type}</TableCell>
                            <TableCell>{row.seller}</TableCell>
                            <TableCell>{row.depot}</TableCell>
                            <TableCell>{row.detail}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  row.status === 'en_attente'
                                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                                    : ''
                                }
                              >
                                {row.status.replaceAll('_', ' ')}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-blue-50/70 p-5 text-sm text-slate-600">
                    Aucune déclaration finalisée pour le moment. Dans WhatsApp,
                    le revendeur doit poursuivre jusqu’au message « Votre
                    déclaration a bien été enregistrée ».
                  </div>
                )}
                <a
                  href="/dashboard/donnees"
                  className="mt-4 inline-flex text-sm font-black text-[#0a4ea8] hover:underline"
                >
                  Voir toutes les ventes et tous les stocks →
                </a>
              </CardContent>
            </Card>
          )}

          {view === 'comptes' && (
            <Card className="mt-6 border-0 bg-white ring-blue-950/7">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Gestion des comptes utilisateurs</CardTitle>
                    <CardDescription>
                      Création, rattachement au dépôt et désactivation
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setActionError('');
                      setShowAccountForm((value) => !value);
                    }}
                    className="bg-[#0a4ea8]"
                  >
                    <Plus />
                    Créer un compte
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showAccountForm && (
                  <form
                    onSubmit={createAccount}
                    className="mb-6 grid gap-4 rounded-2xl bg-blue-50/70 p-5 sm:grid-cols-2 xl:grid-cols-3"
                  >
                    <div>
                      <Label>Nom *</Label>
                      <Input name="name" required className="mt-2 bg-white" />
                    </div>
                    <div>
                      <Label>Adresse électronique *</Label>
                      <Input
                        name="email"
                        type="email"
                        required
                        className="mt-2 bg-white"
                      />
                    </div>
                    <div>
                      <Label>Rôle *</Label>
                      <select
                        name="role"
                        value={accountRole}
                        onChange={(event) =>
                          setAccountRole(event.target.value as Account['role'])
                        }
                        className="mt-2 h-10 w-full rounded-md border bg-white px-3"
                      >
                        <option value="administrateur">Administrateur</option>
                        <option value="depositaire">Dépositaire</option>
                        <option value="revendeur">Revendeur</option>
                      </select>
                    </div>
                    {accountRole !== 'administrateur' && (
                      <div>
                        <Label>Dépôt de rattachement *</Label>
                        <select
                          name="depot"
                          required
                          className="mt-2 h-10 w-full rounded-md border bg-white px-3"
                        >
                          {depots.map((depot) => (
                            <option key={depot.id}>{depot.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {accountRole === 'revendeur' && (
                      <div>
                        <Label>Téléphone WhatsApp du revendeur *</Label>
                        <Input
                          name="phone"
                          type="tel"
                          inputMode="tel"
                          required
                          placeholder="228XXXXXXXX"
                          className="mt-2 bg-white"
                        />
                      </div>
                    )}
                    <div className="flex items-end gap-2">
                      <Button type="submit">Enregistrer</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAccountForm(false);
                          setActionError('');
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </form>
                )}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Dépôt</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accounts.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-bold">
                            {row.name}
                            {row.phone && (
                              <small className="block text-slate-400">
                                {row.phone}
                              </small>
                            )}
                          </TableCell>
                          <TableCell>{row.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{row.role}</Badge>
                          </TableCell>
                          <TableCell>{row.depot}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                row.active
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }
                            >
                              {row.active ? 'actif' : 'suspendu'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingAccount(row);
                                  setEditRole(row.role);
                                  setActionError('');
                                }}
                              >
                                <Pencil /> Modifier
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleAccount(row)}
                                className={
                                  row.active
                                    ? 'border-red-200 text-red-700'
                                    : ''
                                }
                              >
                                {row.active ? 'Suspendre' : 'Réactiver'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!loading && accounts.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="py-10 text-center text-slate-500"
                          >
                            Aucun compte utilisateur trouvé.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {view === 'revendeurs' && (
            <Card className="mt-6 border-0 bg-white ring-blue-950/7">
              <CardHeader>
                <CardTitle>Répertoire des revendeurs</CardTitle>
                <CardDescription>
                  Profils créés dans l’administration ou enregistrés directement
                  par Vendor‑Bot.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Revendeur</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Dépôt</TableHead>
                      <TableHead>Déclarations</TableHead>
                      <TableHead>Dernière vente</TableHead>
                      <TableHead>Dernière activité</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map((row) => (
                      <TableRow key={row.phone}>
                        <TableCell className="font-bold">{row.name}</TableCell>
                        <TableCell>{row.phone}</TableCell>
                        <TableCell>{row.depot}</TableCell>
                        <TableCell>{row.salesCount}</TableCell>
                        <TableCell>
                          {row.lastSalesAmount.toLocaleString('fr-FR')} FCFA
                        </TableCell>
                        <TableCell>
                          {row.lastDeclarationAt
                            ? new Date(row.lastDeclarationAt).toLocaleString(
                                'fr-FR',
                              )
                            : 'Aucune'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              row.active
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }
                          >
                            {row.active ? 'actif' : 'suspendu'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && vendors.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-10 text-center text-slate-500"
                        >
                          Aucun revendeur pour ce dépôt.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {view === 'performances' && (
            <Card className="mt-6 border-0 bg-white ring-blue-950/7">
              <CardHeader>
                <CardTitle>Performances et attribution des primes</CardTitle>
                <CardDescription>
                  Règle proposée : score ≥ 80 et CA supérieur à la moyenne du
                  dépôt
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Revendeur</TableHead>
                      <TableHead>Dépôt</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead>CA</TableHead>
                      <TableHead>Décision</TableHead>
                      <TableHead>Ventes</TableHead>
                      <TableHead className="text-right">Prime</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performances.map((row) => (
                      <TableRow key={row.seller}>
                        <TableCell className="font-bold">
                          {row.seller}
                        </TableCell>
                        <TableCell>{row.depot}</TableCell>
                        <TableCell>{row.period}</TableCell>
                        <TableCell className="font-black">
                          {row.amount} FCFA
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              row.eligible
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }
                          >
                            {row.eligible ? 'Éligible' : 'Non éligible'}
                          </Badge>
                          <small className="mt-1 block text-slate-400">
                            Score {row.score}/100 · moyenne{' '}
                            {row.average.toLocaleString('fr-FR')} FCFA
                          </small>
                        </TableCell>
                        <TableCell>
                          <span className="text-emerald-700">
                            {row.validated} validée(s)
                          </span>
                          <small className="block text-slate-400">
                            {row.rejected} rejetée(s) · {row.pending} en attente
                          </small>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => {
                              setPrize(row);
                              setPrizeAmount(
                                row.suggested ? String(row.suggested) : '',
                              );
                            }}
                            className="bg-yellow-400 text-[#082f70] hover:bg-yellow-300"
                          >
                            <Award />
                            {row.eligible ? 'Attribuer' : 'Décider'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && performances.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="py-10 text-center text-slate-500"
                        >
                          Aucun revendeur actif pour cette période.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {view === 'performances' && bonuses.length > 0 && (
            <Card className="mt-6 border-0 bg-white ring-blue-950/7">
              <CardHeader>
                <CardTitle>Primes déjà attribuées</CardTitle>
                <CardDescription>
                  Historique des décisions enregistrées.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Revendeur</TableHead>
                      <TableHead>Dépôt</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bonuses.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-bold">
                          {row.seller}
                        </TableCell>
                        <TableCell>{row.depot}</TableCell>
                        <TableCell>{row.period}</TableCell>
                        <TableCell>
                          {row.amount.toLocaleString('fr-FR')} FCFA
                        </TableCell>
                        <TableCell>{row.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {(view === 'difficultes' || view === 'donnees') && (
            <section className="mt-6">
              {view === 'difficultes' && (
                <Card className="border-0 bg-white ring-blue-950/7">
                  <CardHeader>
                    <CardTitle>Gestion des difficultés</CardTitle>
                    <CardDescription>
                      L’administrateur seul peut mettre à jour l’état
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {issues.map((row) => (
                      <div key={row.id} className="rounded-2xl border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span>
                            <strong>{row.seller}</strong>
                            <small className="ml-2 text-slate-400">
                              {row.depot}
                            </small>
                          </span>
                          <Badge>{row.state}</Badge>
                        </div>
                        <p className="mt-2 text-sm font-bold text-[#0a4ea8]">
                          {row.category}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {row.description}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <small className="text-slate-400">{row.date}</small>
                          {row.state !== 'resolue' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => nextIssueState(row.id)}
                            >
                              {row.state === 'ouverte'
                                ? 'Passer en cours'
                                : 'Marquer résolue'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              {view === 'donnees' && (
                <Card className="border-0 bg-white ring-blue-950/7">
                  <CardHeader>
                    <CardTitle>Consultation des ventes et stocks</CardTitle>
                    <CardDescription>
                      Vue globale · aucune validation possible côté
                      administrateur
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Référence</TableHead>
                          <TableHead>Revendeur</TableHead>
                          <TableHead>Dépôt</TableHead>
                          <TableHead>Détail</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {globalRows.map((row) => (
                          <TableRow key={row.ref}>
                            <TableCell>{row.type}</TableCell>
                            <TableCell className="font-bold">
                              {row.ref}
                            </TableCell>
                            <TableCell>{row.seller}</TableCell>
                            <TableCell>{row.depot}</TableCell>
                            <TableCell>{row.detail}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{row.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </section>
          )}
        </div>
      </section>
      {editingAccount && (
        <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-[#07162f]/65 p-5 backdrop-blur-sm">
          <Card className="w-full max-w-2xl bg-white">
            <CardHeader>
              <Pencil className="size-8 text-[#0a4ea8]" />
              <CardTitle>Modifier le profil utilisateur</CardTitle>
              <CardDescription>
                Modifiez ses informations, son rôle ou son dépôt de
                rattachement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={updateAccount}
                className="grid gap-4 sm:grid-cols-2"
              >
                <div>
                  <Label>Nom *</Label>
                  <Input
                    name="name"
                    defaultValue={editingAccount.name}
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Adresse électronique *</Label>
                  <Input
                    name="email"
                    type="email"
                    defaultValue={editingAccount.email}
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Rôle *</Label>
                  <select
                    name="role"
                    value={editRole}
                    onChange={(event) =>
                      setEditRole(event.target.value as Account['role'])
                    }
                    className="mt-2 h-10 w-full rounded-md border bg-white px-3"
                  >
                    <option value="administrateur">Administrateur</option>
                    <option value="depositaire">Dépositaire</option>
                    <option value="revendeur">Revendeur</option>
                  </select>
                </div>
                {editRole !== 'administrateur' && (
                  <div>
                    <Label>Dépôt de rattachement *</Label>
                    <select
                      name="depot_id"
                      defaultValue={editingAccount.depotId ?? ''}
                      required
                      className="mt-2 h-10 w-full rounded-md border bg-white px-3"
                    >
                      <option value="" disabled>
                        Choisir un dépôt
                      </option>
                      {depots.map((depot) => (
                        <option key={depot.id} value={depot.id}>
                          {depot.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {editRole === 'revendeur' && (
                  <div>
                    <Label>Téléphone WhatsApp *</Label>
                    <Input
                      name="phone"
                      defaultValue={editingAccount.phone ?? ''}
                      readOnly={
                        editingAccount.role === 'revendeur' &&
                        Boolean(editingAccount.phone)
                      }
                      required
                      className="mt-2"
                    />
                    {editingAccount.role === 'revendeur' &&
                      editingAccount.phone && (
                        <small className="mt-1 block text-slate-400">
                          Le numéro est verrouillé pour préserver l’historique
                          WhatsApp.
                        </small>
                      )}
                  </div>
                )}
                <div>
                  <Label>Nouveau mot de passe</Label>
                  <Input
                    name="password"
                    type="password"
                    minLength={8}
                    placeholder="Laisser vide pour ne pas changer"
                    className="mt-2"
                  />
                </div>
                <div className="flex items-end justify-end gap-3 sm:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingAccount(null)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-[#0a4ea8]">
                    Enregistrer les modifications
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      {prize && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[#07162f]/65 p-5 backdrop-blur-sm">
          <Card className="w-full max-w-lg bg-white">
            <CardHeader>
              <Award className="size-9 text-yellow-500" />
              <CardTitle>Attribuer une prime à {prize.seller}</CardTitle>
              <CardDescription>
                {prize.period} · CA {prize.amount} FCFA · score {prize.score}
                /100
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label>Montant proposé (modifiable)</Label>
              <Input
                type="number"
                value={prizeAmount}
                onChange={(event) => setPrizeAmount(event.target.value)}
                className="mt-2"
              />
              <p className="mt-3 rounded-xl bg-yellow-50 p-3 text-xs text-yellow-900">
                Calcul proposé : seuil de score atteint et chiffre d’affaires
                supérieur à la moyenne du dépôt.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setPrize(null)}>
                  Annuler
                </Button>
                <Button onClick={assignPrize} className="bg-[#0a4ea8]">
                  Enregistrer et notifier
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}

export default function DashboardPage() {
  return <AdminDashboard view="pilotage" />;
}
