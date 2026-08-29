'use client';

import { FormEvent, useState } from 'react';
import { AlertTriangle, Bell, Box, CheckCircle2, ClipboardPlus, History, LogOut, PackageCheck, Target, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const stock = [
  { name: 'FanXtra', qty: 48, image: '/fan-site/fanxtra.png', status: 'Disponible' },
  { name: 'FanYogo', qty: 32, image: '/fan-site/fanyogo.png', status: 'Disponible' },
  { name: 'FanChoco', qty: 8, image: '/fan-site/fanchoco.jpg', status: 'Stock faible' },
  { name: 'Yaourt Nature', qty: 15, image: '/fan-site/yaourt-nature.png', status: 'À réapprovisionner' },
];

export default function DepositairePage() {
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState(false);

  function submitSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
    setShowForm(false);
  }

  return (
    <main className="min-h-screen bg-[#f3f7fb] text-[#122043]">
      <header className="border-b border-blue-950/8 bg-white"><div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8"><a href="/" className="flex items-center gap-3"><img src="/fan-site/logo.png" alt="FanMilk" className="h-14 w-auto" /><span className="hidden text-sm font-black text-[#082f70] sm:block">Espace Dépositaire</span></a><div className="flex items-center gap-2"><Button variant="ghost" size="icon" className="relative"><Bell /><span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" /></Button><a href="/" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100"><LogOut className="size-4" />Déconnexion</a></div></div></header>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        {saved && <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700"><CheckCircle2 className="size-5" />La vente a été enregistrée et transmise à FanMilk.</div>}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-black text-[#0a4ea8]">Dépôt Super Depot · Lomé</p><h1 className="mt-2 text-4xl font-black tracking-tight text-[#082f70]">Bonjour, Kodjo 👋</h1><p className="mt-2 text-slate-500">Déclarez vos ventes et surveillez votre stock du jour.</p></div><Button onClick={() => { setSaved(false); setShowForm(true); }} className="h-12 rounded-xl bg-[#0a4ea8] px-6 font-black hover:bg-[#082f70]"><ClipboardPlus />Déclarer une vente</Button></div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
          { label: 'Ventes du jour', value: '48 500', unit: 'FCFA', icon: TrendingUp, note: '+12 %' },
          { label: 'Produits vendus', value: '31', unit: 'unités', icon: PackageCheck, note: 'Aujourd’hui' },
          { label: 'Stock disponible', value: '103', unit: 'unités', icon: Box, note: '4 références' },
          { label: 'Objectif semaine', value: '76', unit: '%', icon: Target, note: 'En bonne voie' },
        ].map(({ label, value, unit, icon: Icon, note }) => <Card key={label} className="border-0 bg-white ring-blue-950/7"><CardHeader className="pb-2"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#0a4ea8]"><Icon className="size-5" /></span><Badge variant="secondary">{note}</Badge></div></CardHeader><CardContent><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-[#082f70]">{value} <span className="text-xs text-slate-400">{unit}</span></p></CardContent></Card>)}</div>

        {showForm && <Card className="mt-6 border-2 border-blue-200 bg-white"><CardHeader><CardTitle>Nouvelle déclaration de vente</CardTitle><CardDescription>Renseignez les ventes réalisées aujourd’hui.</CardDescription></CardHeader><CardContent><form onSubmit={submitSale} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div><Label htmlFor="product">Produit</Label><select id="product" className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm"><option>FanXtra</option><option>FanYogo</option><option>FanChoco</option><option>FanVanille</option><option>FanIce</option><option>Yaourt Nature</option><option>Yaourt Vanille</option></select></div><div><Label htmlFor="quantity">Quantité vendue</Label><Input id="quantity" type="number" min="1" defaultValue="12" className="mt-2 h-11" required /></div><div><Label htmlFor="amount">Montant FCFA</Label><Input id="amount" type="number" min="1" defaultValue="18000" className="mt-2 h-11" required /></div><div className="flex items-end gap-2"><Button type="submit" className="h-11 flex-1 bg-[#0a4ea8] font-black">Enregistrer</Button><Button type="button" variant="outline" className="h-11" onClick={() => setShowForm(false)}>Annuler</Button></div></form></CardContent></Card>}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
          <Card className="border-0 bg-white ring-blue-950/7"><CardHeader><CardTitle>Mon stock</CardTitle><CardDescription>Quantités disponibles dans votre dépôt</CardDescription></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2">{stock.map((item) => <div key={item.name} className="flex items-center gap-4 rounded-2xl bg-[#f5f9ff] p-4"><span className="grid size-20 shrink-0 place-items-center rounded-xl bg-white"><img src={item.image} alt={item.name} className="max-h-16 max-w-18 object-contain" /></span><div><p className="font-black text-[#082f70]">{item.name}</p><p className="mt-1 text-2xl font-black">{item.qty} <span className="text-xs text-slate-400">unités</span></p><Badge className={item.qty < 10 ? 'mt-2 bg-red-50 text-red-700' : item.qty < 20 ? 'mt-2 bg-yellow-50 text-yellow-800' : 'mt-2 bg-emerald-50 text-emerald-700'}>{item.status}</Badge></div></div>)}</div></CardContent></Card>
          <div className="space-y-6"><Card className="border-0 bg-[#082f70] text-white ring-0"><CardHeader><CardTitle className="text-white">Actions rapides</CardTitle></CardHeader><CardContent className="space-y-3"><button onClick={() => setShowForm(true)} className="flex w-full items-center gap-3 rounded-xl bg-white/10 p-4 text-left text-sm font-bold hover:bg-white/15"><ClipboardPlus className="text-yellow-300" />Déclarer mes ventes</button><button className="flex w-full items-center gap-3 rounded-xl bg-white/10 p-4 text-left text-sm font-bold hover:bg-white/15"><AlertTriangle className="text-yellow-300" />Signaler une rupture</button><button className="flex w-full items-center gap-3 rounded-xl bg-white/10 p-4 text-left text-sm font-bold hover:bg-white/15"><History className="text-yellow-300" />Voir mon historique</button></CardContent></Card><Card className="border-0 bg-yellow-50 ring-yellow-200"><CardHeader><CardTitle className="text-yellow-900">Alerte stock</CardTitle><CardDescription className="text-yellow-800">FanChoco est presque épuisé. Pensez à demander un réapprovisionnement.</CardDescription></CardHeader></Card></div>
        </div>
      </div>
    </main>
  );
}
