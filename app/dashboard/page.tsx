'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Activity,
  Award,
  BarChart3,
  Bell,
  CircleDollarSign,
  Database,
  LogOut,
  Menu,
  Pencil,
  FileDown,
  Printer,
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
  mfaEnabled?: boolean;
};
type Analytics = {
  current_revenue: number;
  previous_revenue: number;
  change_percent: number;
  validated_sales: number;
  pending_sales: number;
  daily: Array<{ date: string; amount: number; sales: number }>;
  vendor_ranking: Array<{ phone: string; name: string; depot: string; amount: number; sales: number }>;
  depot_ranking: Array<{ id: number; name: string; amount: number; sales: number }>;
  product_targets: Array<{ product: { id: number; sku: string; name: string }; quantity_target: number; actual_quantity: number; completion_rate: number }>;
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
  dailySales: Array<{
    id: number;
    date: string;
    amount: number;
    eligible: boolean;
    bonusAwarded: boolean;
    bonusAmount: number;
  }>;
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
  | 'analyses'
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
    analyses: {
      title: 'Analyses et suivi',
      description: 'Comparez les périodes, suivez les objectifs et contrôlez les opérations.',
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
    href: '/dashboard/analyses',
    view: 'analyses',
    label: 'Analyses & audit',
    icon: Activity,
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
  const [activeView, setActiveView] = useState<AdminView>(view);
  const [accounts, setAccounts] = useState(initialAccounts);
  const [issues, setIssues] = useState(initialIssues);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountRole, setAccountRole] =
    useState<Account['role']>('administrateur');
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editRole, setEditRole] = useState<Account['role']>('administrateur');
  const [vendors, setVendors] = useState<VendorRow[]>([]);
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
      date: string;
    }>
  >([]);
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
  const [depots, setDepots] = useState<Array<{ id: number; name: string }>>([]);
  const [summary, setSummary] = useState({
    active_vendors: 0,
    validated_revenue: 0,
    open_difficulties: 0,
    awarded_bonuses: 0,
  });
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [auditRows, setAuditRows] = useState<any[]>([]);
  const [deliveryRows, setDeliveryRows] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [adminName, setAdminName] = useState('Administrateur');
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const monthKey = (value: Date) =>
    `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(monthKey(now));
  const [selectedDepot, setSelectedDepot] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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
        apiFetchCached<T>(path, { force, maxAge: 300_000 });
      const storedUser = getStoredUser();
      if (storedUser?.name) setAdminName(storedUser.name);
      const depotQuery = selectedDepot ? `?depot_id=${selectedDepot}` : '';
      const query = new URLSearchParams();
      if (selectedDepot) query.set('depot_id', selectedDepot);
      if (dateFrom) query.set('date_from', dateFrom);
      if (dateTo) query.set('date_to', dateTo);
      const filteredQuery = query.size ? `?${query.toString()}` : '';

      if (activeView === 'pilotage') {
        const summarySeparator = selectedDepot ? '&' : '?';
        const [nextSummary, sales, stocks, apiDepots] = await Promise.all([
          cached<any>(
            `/api/admin/summary${depotQuery}${summarySeparator}period=${selectedMonth}`,
          ),
          cached<any[]>(`/api/admin/sales${filteredQuery}`),
          cached<any[]>(`/api/admin/stocks${filteredQuery}`),
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
            detail: `${Number(row.amount).toLocaleString('fr-FR')} FCFA · ${(row.lines ?? []).map((line: any) => `${line.sku}: ${line.quantity}`).join(', ') || 'aucun produit'}`,
            status: row.status,
            date: row.declared_at,
          })),
          ...stocks.map((row) => ({
            type: 'Stock',
            ref: `S-${row.id}`,
            seller: row.vendor.name,
            depot: row.depot.name,
            detail: `${row.product.sku} · ${row.quantity} unités`,
            status: row.status,
            date: row.declared_at,
          })),
        ]);
      } else if (activeView === 'comptes') {
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
            mfaEnabled: row.mfa_enabled,
          })),
        );
      } else if (activeView === 'revendeurs') {
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
      } else if (activeView === 'analyses') {
        const separator = selectedDepot ? '&' : '?';
        const [nextAnalytics, nextAudit, nextDeliveries, apiDepots, nextSystem] = await Promise.all([
          cached<Analytics>(`/api/admin/analytics${depotQuery}${separator}period=${selectedMonth}`),
          cached<any[]>(`/api/admin/audit${filteredQuery}`),
          cached<any[]>('/api/admin/notifications?limit=100'),
          cached<any[]>('/api/admin/depots'),
          cached<any>('/api/admin/system-status'),
        ]);
        setAnalytics(nextAnalytics);
        setAuditRows(nextAudit);
        setDeliveryRows(nextDeliveries);
        setDepots(apiDepots);
        setSystemStatus(nextSystem);
      } else if (activeView === 'performances') {
        const separator = selectedDepot ? '&' : '?';
        const [apiPerformances, apiBonuses, apiDepots] = await Promise.all([
          cached<any[]>(
            `/api/admin/performances${depotQuery}${separator}period=${selectedMonth}`,
          ),
          cached<any[]>(
            `/api/admin/bonuses${depotQuery}${separator}period=${selectedMonth}`,
          ),
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
            dailySales: (row.daily_sales ?? []).map((sale: any) => ({
              id: sale.id,
              date: sale.date,
              amount: Number(sale.amount),
              eligible: sale.eligible,
              bonusAwarded: sale.bonus_awarded,
              bonusAmount: Number(sale.bonus_amount || 0),
            })),
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
      } else if (activeView === 'difficultes') {
        const [apiIssues, apiDepots] = await Promise.all([
          cached<any[]>(`/api/admin/difficulties${filteredQuery}`),
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
      } else if (activeView === 'donnees') {
        const productParams = new URLSearchParams(query);
        productParams.set('period', selectedMonth);
        const [sales, stocks, apiDepots, totals, breakdown] = await Promise.all([
          cached<any[]>(`/api/admin/sales${filteredQuery}`),
          cached<any[]>(`/api/admin/stocks${filteredQuery}`),
          cached<any[]>('/api/admin/depots'),
          cached<any[]>(`/api/admin/product-totals?${productParams.toString()}`),
          cached<any[]>(`/api/admin/product-breakdown?${productParams.toString()}`),
        ]);
        setDepots(apiDepots);
        setProductTotals(totals);
        setProductBreakdown(breakdown);
        setGlobalRows([
          ...sales.map((row) => ({
            type: 'Vente',
            ref: `V-${row.id}`,
            seller: row.vendor.name,
            depot: row.depot.name,
            detail: `${Number(row.amount).toLocaleString('fr-FR')} FCFA · ${(row.lines ?? []).map((line: any) => `${line.sku}: ${line.quantity}`).join(', ') || 'aucun produit'}`,
            status: row.status,
            date: row.declared_at,
          })),
          ...stocks.map((row) => ({
            type: 'Stock',
            ref: `S-${row.id}`,
            seller: row.vendor.name,
            depot: row.depot.name,
            detail: `${row.product.sku} · ${row.quantity} unités`,
            status: row.status,
            date: row.declared_at,
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
  }, [activeView, selectedMonth, selectedDepot, dateFrom, dateTo]);

  useEffect(() => {
    const syncViewWithUrl = () => {
      const matchingItem = adminNavigation.find(
        (item) => item.href === window.location.pathname,
      );
      setActiveView((matchingItem?.view ?? 'pilotage') as AdminView);
    };
    window.addEventListener('popstate', syncViewWithUrl);
    return () => window.removeEventListener('popstate', syncViewWithUrl);
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    const prefetchTimer = window.setTimeout(() => {
      const paths = [
        `/api/admin/summary?period=${selectedMonth}`,
        '/api/admin/users',
        '/api/admin/vendors',
        `/api/admin/performances?period=${selectedMonth}`,
        `/api/admin/analytics?period=${selectedMonth}`,
        '/api/admin/bonuses',
        '/api/admin/difficulties',
        '/api/admin/sales',
        '/api/admin/stocks',
        '/api/admin/depots',
      ];
      void Promise.allSettled(
        paths.map((path) => apiFetchCached(path, { maxAge: 300_000 })),
      );
    }, 250);
    return () => window.clearTimeout(prefetchTimer);
  }, [selectedMonth]);

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
        phone: String(form.get('phone') ?? '').trim() || null,
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
          phone: String(form.get('phone') ?? '').trim() || null,
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
  async function assignPrize(saleId: number, seller: string) {
    setActionError('');
    try {
      await apiFetch('/api/admin/bonuses', {
        method: 'POST',
        body: JSON.stringify({ sale_id: saleId }),
      });
      invalidateApiCache();
      await loadDashboard(true);
      setNotice(`Prime de 500 FCFA attribuée à ${seller} pour cette vente.`);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Attribution impossible.',
      );
    }
  }

  useEffect(() => {
    if (!notice && !actionError && !loadError) return;
    const timer = window.setTimeout(() => {
      setNotice('');
      setActionError('');
      setLoadError('');
    }, 5_000);
    return () => window.clearTimeout(timer);
  }, [notice, actionError, loadError]);
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

  async function resetMfa(row: Account) {
    if (!window.confirm(`Réinitialiser Google Authenticator pour ${row.name} ?`)) return;
    try {
      const result = await apiFetch<{ message: string }>(`/api/admin/users/${row.id}/reset-mfa`, { method: 'POST' });
      invalidateApiCache();
      await loadDashboard(true);
      setNotice(result.message);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Réinitialisation impossible.');
    }
  }

  async function saveTarget(productId: number, quantity: number) {
    try {
      const rows = await apiFetch<Analytics['product_targets']>('/api/admin/targets', {
        method: 'PUT',
        body: JSON.stringify({
          product_id: productId,
          period: selectedMonth,
          depot_id: selectedDepot ? Number(selectedDepot) : null,
          quantity_target: quantity,
        }),
      });
      setAnalytics((current) => current ? { ...current, product_targets: rows } : current);
      invalidateApiCache();
      setNotice('Objectif produit enregistré.');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Enregistrement impossible.');
    }
  }

  async function retryDelivery(id: number) {
    try {
      const updated = await apiFetch<any>(`/api/admin/notifications/${id}/retry`, { method: 'POST' });
      setDeliveryRows((rows) => rows.map((row) => row.id === id ? updated : row));
      setNotice('Nouvelle tentative de notification terminée.');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Nouvelle tentative impossible.');
    }
  }

  function exportAnalyticsCsv() {
    if (!analytics) return;
    const lines = [
      ['Classement', 'Nom', 'Dépôt', 'Ventes', 'CA FCFA'],
      ...analytics.vendor_ranking.map((row, index) => [index + 1, row.name, row.depot, row.sales, row.amount]),
      [],
      ['Date', 'Nombre de ventes', 'CA FCFA'],
      ...analytics.daily.map((row) => [row.date, row.sales, row.amount]),
    ];
    const csv = lines.map((line) => line.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(';')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `fanmilk-analyses-${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <main className="dashboard-shell min-h-screen bg-[#f3f7fb] text-[#122043] transition-colors lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="hidden min-h-screen flex-col bg-[#073b86] px-4 py-5 text-white lg:flex">
        <a href="/" className="flex items-center gap-3 px-2">
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
        </a>
        <nav className="mt-10 space-y-1 text-sm font-bold">
          {adminNavigation.map(
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
                className={`flex items-center gap-3 rounded-xl px-3 py-3 ${activeView === itemView ? 'bg-white text-[#073b86]' : 'text-blue-100/70 hover:bg-white/10 hover:text-white'}`}
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
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-100/65"
          >
            <Settings className="size-4" />
            Paramètres
          </a>
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
                    <Settings className="size-5" />
                    Profil et paramètres
                  </a>
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
                {adminViewMeta[activeView].title}
              </h1>
              <p className="mt-2 text-slate-500">
                {adminViewMeta[activeView].description}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {(activeView === 'donnees' || activeView === 'difficultes' || activeView === 'analyses') && (
                <>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                    className="h-10 w-auto bg-white"
                    aria-label="Date de début"
                  />
                  <Input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(event) => setDateTo(event.target.value)}
                    className="h-10 w-auto bg-white"
                    aria-label="Date de fin"
                  />
                </>
              )}
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
          {activeView === 'pilotage' && (
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

          {activeView === 'pilotage' && (
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
                          <TableHead>Date</TableHead>
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
                              {new Date(row.date).toLocaleString('fr-FR')}
                            </TableCell>
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

          {activeView === 'comptes' && (
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
                    {(
                      <div>
                        <Label>
                          Téléphone WhatsApp {accountRole === 'revendeur' ? '*' : '(pour les alertes)'}
                        </Label>
                        <Input
                          name="phone"
                          type="tel"
                          inputMode="tel"
                          required={accountRole === 'revendeur'}
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
                              {row.role !== 'revendeur' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => resetMfa(row)}
                                  title="Réinitialiser Google Authenticator"
                                >
                                  MFA
                                </Button>
                              )}
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

          {activeView === 'revendeurs' && (
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

          {activeView === 'analyses' && analytics && (
            <div className="mt-6 space-y-6">
              {systemStatus && (!systemStatus.email_configured || !systemStatus.whatsapp_configured) && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <strong>Canaux à configurer :</strong>{' '}
                  {!systemStatus.email_configured && 'e-mail Resend '}
                  {!systemStatus.whatsapp_configured && 'WhatsApp '}
                  — les alertes restent enregistrées dans l’application et pourront être renvoyées.
                </div>
              )}
              <div className="flex flex-wrap gap-2 print:hidden">
                <Button variant="outline" onClick={exportAnalyticsCsv}><FileDown /> Exporter Excel (CSV)</Button>
                <Button variant="outline" onClick={() => window.print()}><Printer /> Imprimer / PDF</Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['CA de la période', analytics.current_revenue.toLocaleString('fr-FR') + ' FCFA'],
                  ['Période précédente', analytics.previous_revenue.toLocaleString('fr-FR') + ' FCFA'],
                  ['Évolution', `${analytics.change_percent > 0 ? '+' : ''}${analytics.change_percent}%`],
                  ['Ventes validées / en attente', `${analytics.validated_sales} / ${analytics.pending_sales}`],
                ].map(([label, value]) => (
                  <Card key={label} className="border-0 bg-white ring-blue-950/7"><CardContent className="p-5"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-[#082f70]">{value}</p></CardContent></Card>
                ))}
              </div>
              <Card className="border-0 bg-white ring-blue-950/7">
                <CardHeader><CardTitle>Ventes validées par jour</CardTitle><CardDescription>Chaque barre représente le chiffre d’affaires quotidien.</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  {analytics.daily.map((row) => {
                    const maximum = Math.max(...analytics.daily.map((item) => item.amount), 1);
                    return <div key={row.date} className="grid grid-cols-[88px_1fr_120px] items-center gap-3 text-xs"><span>{new Date(`${row.date}T12:00:00`).toLocaleDateString('fr-FR')}</span><div className="h-7 overflow-hidden rounded-lg bg-blue-50"><div className="h-full rounded-lg bg-[#0a4ea8]" style={{ width: `${Math.max(row.amount * 100 / maximum, 2)}%` }} /></div><strong className="text-right">{row.amount.toLocaleString('fr-FR')} FCFA</strong></div>;
                  })}
                  {analytics.daily.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Aucune vente validée sur cette période.</p>}
                </CardContent>
              </Card>
              <div className="grid gap-6 xl:grid-cols-2">
                <Card className="border-0 bg-white ring-blue-950/7"><CardHeader><CardTitle>Classement des revendeurs</CardTitle></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Revendeur</TableHead><TableHead>Dépôt</TableHead><TableHead>Ventes</TableHead><TableHead>CA</TableHead></TableRow></TableHeader><TableBody>{analytics.vendor_ranking.map((row, index) => <TableRow key={row.phone}><TableCell>{index + 1}</TableCell><TableCell className="font-bold">{row.name}</TableCell><TableCell>{row.depot}</TableCell><TableCell>{row.sales}</TableCell><TableCell>{row.amount.toLocaleString('fr-FR')} FCFA</TableCell></TableRow>)}{analytics.vendor_ranking.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-slate-500">Aucun résultat.</TableCell></TableRow>}</TableBody></Table></CardContent></Card>
                <Card className="border-0 bg-white ring-blue-950/7"><CardHeader><CardTitle>Classement des dépôts</CardTitle></CardHeader><CardContent className="space-y-3">{analytics.depot_ranking.map((row, index) => <div key={row.id} className="flex items-center justify-between rounded-xl bg-blue-50/60 p-3"><span><strong>{index + 1}. {row.name}</strong><small className="block text-slate-500">{row.sales} vente(s)</small></span><strong>{row.amount.toLocaleString('fr-FR')} FCFA</strong></div>)}{analytics.depot_ranking.length === 0 && <p className="text-sm text-slate-500">Aucun résultat.</p>}</CardContent></Card>
              </div>
              <Card className="border-0 bg-white ring-blue-950/7"><CardHeader><CardTitle>Objectifs par produit</CardTitle><CardDescription>Objectifs nationaux ou du dépôt sélectionné pour {selectedMonth}.</CardDescription></CardHeader><CardContent className="grid gap-4 lg:grid-cols-3">{analytics.product_targets.map((row) => <form key={row.product.id} onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void saveTarget(row.product.id, Number(form.get('target'))); }} className="rounded-2xl border p-4"><strong>{row.product.name}</strong><p className="mt-1 text-sm text-slate-500">Réalisé : {row.actual_quantity} · {row.completion_rate}%</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-500" style={{ width: `${Math.min(row.completion_rate, 100)}%` }} /></div><div className="mt-4 flex gap-2"><Input name="target" type="number" min="0" defaultValue={row.quantity_target} aria-label={`Objectif ${row.product.name}`} /><Button type="submit" size="sm">Enregistrer</Button></div></form>)}</CardContent></Card>
              <Card className="border-0 bg-white ring-blue-950/7"><CardHeader><CardTitle>Livraison des notifications</CardTitle><CardDescription>Historique e-mail, WhatsApp et nouvelles tentatives.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Destinataire</TableHead><TableHead>Alerte</TableHead><TableHead>E-mail</TableHead><TableHead>WhatsApp</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{deliveryRows.map((row) => <TableRow key={row.id}><TableCell>{new Date(row.created_at).toLocaleString('fr-FR')}</TableCell><TableCell>{row.recipient?.name ?? '—'}</TableCell><TableCell>{row.title}</TableCell><TableCell><Badge variant="outline">{row.email_status}</Badge></TableCell><TableCell><Badge variant="outline">{row.whatsapp_status}</Badge></TableCell><TableCell><Button size="sm" variant="outline" onClick={() => retryDelivery(row.id)}>Réessayer</Button></TableCell></TableRow>)}{deliveryRows.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-slate-500">Aucune notification envoyée.</TableCell></TableRow>}</TableBody></Table></CardContent></Card>
              <Card className="border-0 bg-white ring-blue-950/7"><CardHeader><CardTitle>Journal d’audit</CardTitle><CardDescription>Traçabilité des validations, rejets, modifications, suspensions et primes.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Responsable</TableHead><TableHead>Action</TableHead><TableHead>Élément</TableHead><TableHead>Détail</TableHead></TableRow></TableHeader><TableBody>{auditRows.map((row) => <TableRow key={row.id}><TableCell>{new Date(row.created_at).toLocaleString('fr-FR')}</TableCell><TableCell>{row.actor?.name ?? 'Système'}</TableCell><TableCell><Badge variant="outline">{String(row.action).replaceAll('_', ' ')}</Badge></TableCell><TableCell>{row.entity_type} #{row.entity_id}</TableCell><TableCell>{row.description}</TableCell></TableRow>)}{auditRows.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-slate-500">Aucune opération enregistrée pour ces dates.</TableCell></TableRow>}</TableBody></Table></CardContent></Card>
            </div>
          )}

          {activeView === 'performances' && (
            <Card className="mt-6 border-0 bg-white ring-blue-950/7">
              <CardHeader>
                <CardTitle>Performances et attribution des primes</CardTitle>
                <CardDescription>
                  Règle : chaque vente validée dépassant 18 000 FCFA donne droit
                  à une prime fixe de 500 FCFA. Aucun cumul mensuel.
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
                          <div className="min-w-52 space-y-2">
                            {row.dailySales.map((sale) => (
                              <div
                                key={sale.id}
                                className="rounded-lg border bg-slate-50 px-2 py-1.5 text-xs"
                              >
                                <strong>
                                  {new Date(`${sale.date}T00:00:00`).toLocaleDateString('fr-FR')}
                                </strong>{' '}
                                · {sale.amount.toLocaleString('fr-FR')} FCFA
                                <span className="block text-slate-500">
                                  {sale.bonusAwarded
                                    ? 'Prime de 500 FCFA attribuée'
                                    : sale.eligible
                                      ? 'Éligible à 500 FCFA'
                                      : 'Seuil non atteint'}
                                </span>
                              </div>
                            ))}
                            {row.dailySales.length === 0 && (
                              <span className="text-slate-400">Aucune vente validée</span>
                            )}
                            <small className="block text-slate-400">
                              {row.validated} validée(s) · {row.rejected} rejetée(s)
                              {' · '}{row.pending} en attente
                            </small>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex min-w-32 flex-col items-end gap-2">
                            {row.dailySales
                              .filter((sale) => sale.eligible && !sale.bonusAwarded)
                              .map((sale) => (
                                <Button
                                  key={sale.id}
                                  size="sm"
                                  onClick={() => assignPrize(sale.id, row.seller)}
                                  className="bg-yellow-400 text-[#082f70] hover:bg-yellow-300"
                                >
                                  <Award /> 500 FCFA · {new Date(`${sale.date}T00:00:00`).toLocaleDateString('fr-FR')}
                                </Button>
                              ))}
                            {!row.dailySales.some(
                              (sale) => sale.eligible && !sale.bonusAwarded,
                            ) && <span className="text-xs text-slate-400">Aucune prime à attribuer</span>}
                          </div>
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

          {activeView === 'performances' && bonuses.length > 0 && (
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

          {(activeView === 'difficultes' || activeView === 'donnees') && (
            <section className="mt-6">
              {activeView === 'difficultes' && (
                <Card className="border-0 bg-white ring-blue-950/7">
                  <CardHeader>
                    <CardTitle>Gestion des difficultés</CardTitle>
                    <CardDescription>
                      L’administrateur seul peut mettre à jour l’état
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
                          <strong className="text-2xl">
                            {issues.filter((item) => item.state === state).length}
                          </strong>
                          <span className="ml-2 text-sm font-bold">{label}</span>
                        </div>
                      ))}
                    </div>
                    {[...issues]
                      .sort((a, b) => {
                        const rank = { ouverte: 0, en_cours: 1, resolue: 2 };
                        return rank[a.state] - rank[b.state];
                      })
                      .map((row) => (
                      <div
                        key={row.id}
                        className={`rounded-2xl border p-4 ${
                          row.state === 'resolue'
                            ? 'border-emerald-200 bg-emerald-50/60'
                            : row.state === 'en_cours'
                              ? 'border-amber-200 bg-amber-50/60'
                              : 'border-red-200 bg-red-50/60'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span>
                            <strong>{row.seller}</strong>
                            <small className="ml-2 text-slate-400">
                              {row.depot}
                            </small>
                          </span>
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
                    {!loading && issues.length === 0 && (
                      <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                        Aucune difficulté signalée pour cette sélection.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
              {activeView === 'donnees' && (
                <div className="space-y-6">
                  <Card className="border-0 bg-white ring-blue-950/7">
                    <CardHeader>
                      <CardTitle>Ventes Vendor‑Bot</CardTitle>
                      <CardDescription>
                        Date, montant et détail des produits de chaque vente.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Référence</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Revendeur</TableHead>
                            <TableHead>Dépôt</TableHead>
                            <TableHead>Détail</TableHead>
                            <TableHead>Statut</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {globalRows.filter((row) => row.type === 'Vente').map((row) => (
                            <TableRow key={row.ref}>
                              <TableCell className="font-bold">{row.ref}</TableCell>
                              <TableCell>{new Date(row.date).toLocaleString('fr-FR')}</TableCell>
                              <TableCell>{row.seller}</TableCell>
                              <TableCell>{row.depot}</TableCell>
                              <TableCell>{row.detail}</TableCell>
                              <TableCell><Badge variant="outline">{row.status.replace('_', ' ')}</Badge></TableCell>
                            </TableRow>
                          ))}
                          {!loading && !globalRows.some((row) => row.type === 'Vente') && (
                            <TableRow><TableCell colSpan={6} className="py-8 text-center text-slate-500">Aucune vente pour cette sélection.</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

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
                    <CardHeader>
                      <CardTitle>Stocks vendus par revendeur</CardTitle>
                      <CardDescription>Répartition de FanXtra, FanChoco et FanVanille sur la période.</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <Table>
                        <TableHeader><TableRow><TableHead>Revendeur</TableHead><TableHead>Dépôt</TableHead><TableHead>Produit</TableHead><TableHead>Quantité vendue</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {productBreakdown.map((row) => (
                            <TableRow key={`${row.vendor.phone}-${row.sku}`}><TableCell className="font-bold">{row.vendor.name}</TableCell><TableCell>{row.depot}</TableCell><TableCell>{row.product}</TableCell><TableCell>{row.quantity}</TableCell></TableRow>
                          ))}
                          {!loading && productBreakdown.length === 0 && (
                            <TableRow><TableCell colSpan={4} className="py-8 text-center text-slate-500">Aucun stock vendu pour cette sélection.</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
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
                {(
                  <div>
                    <Label>
                      Téléphone WhatsApp {editRole === 'revendeur' ? '*' : '(pour les alertes)'}
                    </Label>
                    <Input
                      name="phone"
                      defaultValue={editingAccount.phone ?? ''}
                      readOnly={
                        editingAccount.role === 'revendeur' &&
                        Boolean(editingAccount.phone)
                      }
                      required={editRole === 'revendeur'}
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
    </main>
  );
}

export default function DashboardPage() {
  return <AdminDashboard view="pilotage" />;
}
