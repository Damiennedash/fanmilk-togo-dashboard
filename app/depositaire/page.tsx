'use client';

import { useMemo, useState } from 'react';
import { Award, BarChart3, Bell, Boxes, Check, LogOut, MapPin, MessageCircle, Phone, ShoppingCart, Users, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

type Sale = { id: number; seller: string; phone: string; date: string; amount: number; place: string; lines: string; status: 'en_attente' | 'validee' | 'rejetee' };
type Stock = { id: number; seller: string; product: string; quantity: number; date: string; status: 'en_attente' | 'valide' | 'rejete' };

const initialSales: Sale[] = [
  { id: 1042, seller: 'Ama Kossi', phone: '+228 90 11 24 38', date: '29 août · 08:42', amount: 48500, place: 'Marché de Bè', lines: 'FXT × 18 · FCH × 9 · FVA × 7', status: 'en_attente' },
  { id: 1041, seller: 'Yao Mensah', phone: '+228 96 42 15 07', date: '29 août · 08:16', amount: 29500, place: 'Adidogomé', lines: 'FXT × 14 · FVA × 6', status: 'en_attente' },
  { id: 1039, seller: 'Dédévi Afi', phone: '+228 91 36 70 12', date: '29 août · 07:58', amount: 41000, place: 'Agoè Assiyéyé', lines: 'FXT × 16 · FCH × 10', status: 'en_attente' },
];

const initialStocks: Stock[] = [
  { id: 301, seller: 'Ama Kossi', product: 'FanXtra (FXT)', quantity: 22, date: '29 août · 09:02', status: 'en_attente' },
  { id: 300, seller: 'Yao Mensah', product: 'FanChoco (FCH)', quantity: 7, date: '29 août · 08:34', status: 'en_attente' },
];

const performances = [
  { seller: 'Ama Kossi', period: 'Août 2026', amount: '682 500', score: 92, valid: 28, rejected: 1 },
  { seller: 'Yao Mensah', period: 'Août 2026', amount: '541 000', score: 84, valid: 23, rejected: 2 },
  { seller: 'Dédévi Afi', period: 'Août 2026', amount: '486 500', score: 79, valid: 20, rejected: 2 },
];

const prizes = [
  { seller: 'Ama Kossi', period: 'Juillet 2026', amount: '35 000 FCFA', date: '03 août 2026' },
  { seller: 'Yao Mensah', period: 'Juillet 2026', amount: '25 000 FCFA', date: '03 août 2026' },
];

const issues = [
  { seller: 'Dédévi Afi', category: 'Équipement', description: 'Glacière endommagée pendant la tournée.', date: '28 août', state: 'ouverte' },
  { seller: 'Yao Mensah', category: 'Produit', description: 'Rupture FanChoco sur la zone Adidogomé.', date: '27 août', state: 'en_cours' },
];

function fcfa(value: number) { return new Intl.NumberFormat('fr-FR').format(value); }

export default function DepositairePage() {
  const [sales, setSales] = useState(initialSales);
  const [stocks, setStocks] = useState(initialStocks);
  const [rejecting, setRejecting] = useState<{ type: 'sale' | 'stock'; id: number } | null>(null);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');
  const pendingSales = sales.filter((sale) => sale.status === 'en_attente');
  const pendingStocks = stocks.filter((stock) => stock.status === 'en_attente');
  const validatedToday = useMemo(() => sales.filter((sale) => sale.status === 'validee').reduce((sum, sale) => sum + sale.amount, 0) + 119000, [sales]);

  function validateSale(id: number) { setSales((rows) => rows.map((row) => row.id === id ? { ...row, status: 'validee' } : row)); setNotice(`Vente #${id} validée. La confirmation sera envoyée au revendeur via Vendor‑Bot.`); }
  function validateStock(id: number) { setStocks((rows) => rows.map((row) => row.id === id ? { ...row, status: 'valide' } : row)); setNotice(`Stock #${id} validé. Vendor‑Bot notifiera le revendeur.`); }
  function confirmReject() { if (!rejecting || !reason.trim()) return; if (rejecting.type === 'sale') setSales((rows) => rows.map((row) => row.id === rejecting.id ? { ...row, status: 'rejetee' } : row)); else setStocks((rows) => rows.map((row) => row.id === rejecting.id ? { ...row, status: 'rejete' } : row)); setNotice(`${rejecting.type === 'sale' ? 'Vente' : 'Stock'} #${rejecting.id} rejeté. Motif transmis via Vendor‑Bot : « ${reason.trim()} »`); setRejecting(null); setReason(''); }

  return (
    <main className="min-h-screen bg-[#f3f7fb] text-[#122043]">
      <header className="sticky top-0 z-50 border-b border-blue-950/8 bg-white/95 backdrop-blur"><div className="mx-auto flex min-h-20 max-w-[1500px] items-center justify-between gap-4 px-5 lg:px-8"><a href="/" className="flex items-center gap-3"><img src="/fan-site/logo-clean.png" alt="FanMilk" className="h-13 w-auto" /><span className="hidden sm:block"><strong className="block text-sm text-[#082f70]">SUPER DEPOT</strong><span className="flex items-center gap-1 text-xs text-slate-500"><MapPin className="size-3" /> Lomé · Adidogomé</span></span></a><nav className="hidden gap-5 text-xs font-black text-slate-500 xl:flex"><a href="#ventes">Ventes</a><a href="#stocks">Stocks</a><a href="#performances">Performances</a><a href="#primes">Primes</a><a href="#difficultes">Difficultés</a><a href="#historique">Historique</a></nav><div className="flex items-center gap-2"><Button variant="ghost" size="icon" className="relative"><Bell /><span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" /></Button><div className="hidden text-right sm:block"><strong className="block text-xs">Kodjo Amégan</strong><span className="text-[10px] text-slate-500">Dépositaire</span></div><a href="/connexion" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100"><LogOut className="size-4" /><span className="hidden sm:inline">Déconnexion</span></a></div></div></header>
      <div className="mx-auto max-w-[1500px] px-5 py-8 lg:px-8">
        {notice && <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800"><MessageCircle className="mt-0.5 size-5 shrink-0" /><span>{notice}</span><button onClick={() => setNotice('')} className="ml-auto"><X className="size-4" /></button></div>}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-black text-[#0a4ea8]">Données de votre dépôt uniquement</p><h1 className="mt-1 text-4xl font-black tracking-tight text-[#082f70]">Contrôle des déclarations</h1><p className="mt-2 text-slate-500">Les ventes et stocks proviennent de Vendor‑Bot et de PostgreSQL sur Render.</p></div><Badge className="w-fit bg-blue-50 px-4 py-2 text-[#0a4ea8]">Source prévue · Vendor‑Bot / PostgreSQL</Badge></div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
          { href: '#ventes', label: 'Ventes en attente', value: pendingSales.length, suffix: 'à vérifier', icon: ShoppingCart, tone: 'bg-amber-50 text-amber-700' },
          { href: '#stocks', label: 'Stocks en attente', value: pendingStocks.length, suffix: 'à vérifier', icon: Boxes, tone: 'bg-violet-50 text-violet-700' },
          { href: '#historique', label: 'CA validé du jour', value: fcfa(validatedToday), suffix: 'FCFA', icon: BarChart3, tone: 'bg-emerald-50 text-emerald-700' },
          { href: '#performances', label: 'Revendeurs actifs', value: 18, suffix: 'dans ce dépôt', icon: Users, tone: 'bg-blue-50 text-[#0a4ea8]' },
        ].map(({ href, label, value, suffix, icon: Icon, tone }) => <a href={href} key={label}><Card className="h-full border-0 bg-white ring-blue-950/7 transition-transform hover:-translate-y-1"><CardContent className="p-5"><span className={`grid size-11 place-items-center rounded-xl ${tone}`}><Icon className="size-5" /></span><p className="mt-5 text-xs font-bold text-slate-500">{label}</p><p className="mt-1 text-3xl font-black text-[#082f70]">{value} <span className="text-xs text-slate-400">{suffix}</span></p></CardContent></Card></a>)}</div>

        <Card id="ventes" className="mt-7 border-0 bg-white ring-blue-950/7"><CardHeader><div className="flex items-center justify-between gap-4"><div><CardTitle>Ventes à vérifier</CardTitle><CardDescription>Uniquement les ventes « en_attente » des revendeurs de SUPER DEPOT</CardDescription></div><Badge className="bg-amber-50 text-amber-800">{pendingSales.length} en attente</Badge></div></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Revendeur</TableHead><TableHead>Date / lieu</TableHead><TableHead>Détail SKU</TableHead><TableHead>Montant</TableHead><TableHead className="text-right">Décision</TableHead></TableRow></TableHeader><TableBody>{pendingSales.map((row) => <TableRow key={row.id}><TableCell><strong>{row.seller}</strong><span className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Phone className="size-3" />{row.phone}</span></TableCell><TableCell><strong className="text-xs">{row.date}</strong><span className="mt-1 block text-xs text-slate-500">{row.place}</span></TableCell><TableCell className="text-xs font-semibold">{row.lines}</TableCell><TableCell className="font-black">{fcfa(row.amount)} FCFA</TableCell><TableCell><div className="flex justify-end gap-2"><Button size="sm" onClick={() => validateSale(row.id)} className="bg-emerald-600 hover:bg-emerald-700"><Check />Valider</Button><Button size="sm" variant="outline" onClick={() => { setRejecting({ type: 'sale', id: row.id }); setReason(''); }} className="border-red-200 text-red-700"><X />Rejeter</Button></div></TableCell></TableRow>)}</TableBody></Table>{!pendingSales.length && <p className="py-10 text-center text-sm text-slate-500">Toutes les ventes ont été traitées.</p>}</CardContent></Card>

        <Card id="stocks" className="mt-6 border-0 bg-white ring-blue-950/7"><CardHeader><div className="flex items-center justify-between"><div><CardTitle>Stocks à valider</CardTitle><CardDescription>Déclarations transmises par les revendeurs du dépôt</CardDescription></div><Badge className="bg-violet-50 text-violet-700">{pendingStocks.length} en attente</Badge></div></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Revendeur</TableHead><TableHead>Produit</TableHead><TableHead>Quantité</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Décision</TableHead></TableRow></TableHeader><TableBody>{pendingStocks.map((row) => <TableRow key={row.id}><TableCell className="font-bold">{row.seller}</TableCell><TableCell>{row.product}</TableCell><TableCell className="font-black">{row.quantity} unités</TableCell><TableCell>{row.date}</TableCell><TableCell><div className="flex justify-end gap-2"><Button size="sm" onClick={() => validateStock(row.id)} className="bg-emerald-600 hover:bg-emerald-700"><Check />Valider</Button><Button size="sm" variant="outline" onClick={() => { setRejecting({ type: 'stock', id: row.id }); setReason(''); }} className="border-red-200 text-red-700"><X />Rejeter</Button></div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>

        <section id="performances" className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]"><Card className="border-0 bg-white ring-blue-950/7"><CardHeader><CardTitle>Performances de mes revendeurs</CardTitle><CardDescription>Lecture seule · aucune attribution de prime depuis cet espace</CardDescription></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Revendeur</TableHead><TableHead>Période</TableHead><TableHead>Ventes</TableHead><TableHead>Score</TableHead><TableHead>Validées / rejetées</TableHead></TableRow></TableHeader><TableBody>{performances.map((row) => <TableRow key={row.seller} className="cursor-pointer"><TableCell className="font-bold">{row.seller}</TableCell><TableCell>{row.period}</TableCell><TableCell className="font-black">{row.amount} FCFA</TableCell><TableCell><Badge className="bg-blue-50 text-[#0a4ea8]">{row.score}/100</Badge></TableCell><TableCell>{row.valid} / {row.rejected}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card><Card id="primes" className="border-0 bg-[#082f70] text-white ring-0"><CardHeader><Award className="size-8 text-yellow-300" /><CardTitle className="text-white">Primes attribuées</CardTitle><CardDescription className="text-blue-100/70">Consultation en lecture seule</CardDescription></CardHeader><CardContent className="space-y-3">{prizes.map((row) => <div key={row.seller} className="rounded-2xl bg-white/10 p-4"><div className="flex items-center justify-between"><strong>{row.seller}</strong><span className="font-black text-yellow-300">{row.amount}</span></div><p className="mt-1 text-xs text-blue-100/60">{row.period} · attribuée le {row.date}</p></div>)}</CardContent></Card></section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2"><Card id="difficultes" className="border-0 bg-white ring-blue-950/7"><CardHeader><CardTitle>Difficultés signalées</CardTitle><CardDescription>Cadre PRIME · consultation uniquement</CardDescription></CardHeader><CardContent className="space-y-3">{issues.map((row) => <div key={row.seller} className="rounded-2xl border border-slate-100 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{row.seller}</strong><Badge className={row.state === 'ouverte' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}>{row.state}</Badge></div><p className="mt-2 text-sm font-bold text-[#0a4ea8]">{row.category}</p><p className="mt-1 text-sm text-slate-600">{row.description}</p><p className="mt-2 text-xs text-slate-400">Signalée le {row.date}</p></div>)}</CardContent></Card><Card id="historique" className="border-0 bg-white ring-blue-950/7"><CardHeader><CardTitle>Historique traité</CardTitle><CardDescription>Filtrable par date et revendeur · lecture seule</CardDescription></CardHeader><CardContent><div className="mb-4 grid gap-3 sm:grid-cols-2"><Input type="date" aria-label="Filtrer par date" /><Input placeholder="Rechercher un revendeur…" aria-label="Filtrer par revendeur" /></div><div className="space-y-3">{[...sales.filter((x) => x.status !== 'en_attente').map((x) => ({ id: `V-${x.id}`, label: x.seller, detail: `${fcfa(x.amount)} FCFA`, status: x.status })), ...stocks.filter((x) => x.status !== 'en_attente').map((x) => ({ id: `S-${x.id}`, label: x.seller, detail: `${x.quantity} unités · ${x.product}`, status: x.status }))].map((row) => <div key={row.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm"><span><strong>{row.id}</strong> · {row.label}<small className="ml-2 text-slate-500">{row.detail}</small></span><Badge>{row.status}</Badge></div>)}<p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Les éléments traités apparaîtront ici pendant la démonstration.</p></div></CardContent></Card></section>
      </div>
      {rejecting && <div className="fixed inset-0 z-[100] grid place-items-center bg-[#07162f]/65 p-5 backdrop-blur-sm"><Card className="w-full max-w-lg bg-white"><CardHeader><CardTitle>Motif de rejet obligatoire</CardTitle><CardDescription>Ce motif sera transmis au revendeur par WhatsApp via Vendor‑Bot.</CardDescription></CardHeader><CardContent><Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Exemple : le montant ne correspond pas au détail des produits…" className="min-h-28" /><div className="mt-5 flex justify-end gap-3"><Button variant="outline" onClick={() => { setRejecting(null); setReason(''); }}>Annuler</Button><Button disabled={!reason.trim()} onClick={confirmReject} className="bg-red-600 hover:bg-red-700">Confirmer le rejet</Button></div></CardContent></Card></div>}
    </main>
  );
}
