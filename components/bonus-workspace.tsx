'use client';
import {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';

type Performance = {phone:string; seller:string; depot:string; amount:string; score:number; validated:number; pending:number; rejected:number; dailySales:Array<{id:number; date:string; amount:number; eligible:boolean; bonusAwarded:boolean}>};
type Bonus = {id:number; seller:string; depot:string; amount:number; date:string};
const money=(value:number)=>`${value.toLocaleString('fr-FR')} FCFA`;
export function BonusWorkspace({performances, bonuses, editable, loading, scope, onAssign}: {performances:Performance[]; bonuses:Bonus[]; editable:boolean; loading:boolean; scope:string; onAssign:(id:number,seller:string)=>Promise<void>}) {
 const [tab,setTab]=useState<'pending'|'history'>('pending');
 const [search,setSearch]=useState('');
 const [page,setPage]=useState(1);
 const [busy,setBusy]=useState<number|null>(null);
 useEffect(()=>{setPage(1);},[tab,search,scope]);
 const pending=performances.flatMap(person=>person.dailySales.filter(sale=>sale.eligible&&!sale.bonusAwarded).map(sale=>({...sale,seller:person.seller,depot:person.depot}))).sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
 const matches=(row:{seller:string;depot:string})=>`${row.seller} ${row.depot}`.toLocaleLowerCase('fr').includes(search.trim().toLocaleLowerCase('fr'));
 const awaiting=pending.filter(matches), history=bonuses.filter(matches);
 const count=tab==='pending'?awaiting.length:history.length;
 const pages=Math.max(1,Math.ceil(count/10)), current=Math.min(page,pages), start=(current-1)*10;
 async function assign(id:number,seller:string){if(busy!==null)return;setBusy(id);try{await onAssign(id,seller);}finally{setBusy(null);}}
 return <section className="mt-6 space-y-5">
  <div className="grid gap-4 sm:grid-cols-3">{[['Primes à attribuer',String(pending.length)],['Montant restant à attribuer',money(pending.length*500)],['Déjà attribué sur le mois sélectionné',money(bonuses.reduce((sum,row)=>sum+row.amount,0))]].map(([label,value])=><div key={label} className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-[#082f70]">{value}</p></div>)}</div>
  <div className="overflow-hidden rounded-2xl border bg-white">
   <div className="space-y-4 border-b p-5"><h2 className="text-xl font-bold">Attribution des primes</h2><p className="text-sm text-slate-500">Une vente validée supérieure à 18 000 FCFA donne droit à 500 FCFA. Les filtres de mois et de dépôt s’appliquent aux deux onglets.</p>
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2" role="tablist" aria-label="Gestion des primes"><Button role="tab" aria-selected={tab==='pending'} variant={tab==='pending'?'default':'outline'} onClick={()=>setTab('pending')}>À attribuer ({pending.length})</Button><Button role="tab" aria-selected={tab==='history'} variant={tab==='history'?'default':'outline'} onClick={()=>setTab('history')}>Historique des primes ({bonuses.length})</Button></div><input aria-label="Rechercher un revendeur ou un dépôt" placeholder="Rechercher un revendeur…" className="w-full rounded-xl border px-4 py-2 sm:w-72" value={search} onChange={event=>setSearch(event.target.value)} /></div>
   </div>
   <div className="overflow-x-auto" role="tabpanel" aria-label={tab==='pending'?'À attribuer':'Historique des primes'}><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-4">Revendeur · Dépôt</th><th className="p-4">{tab==='pending'?'Date de vente':'Date d’attribution'}</th>{tab==='pending'&&<th className="p-4">Vente</th>}<th className="p-4">Prime</th><th className="p-4 text-right">{tab==='pending'?'Action':'Statut'}</th></tr></thead><tbody>
    {tab==='pending'?awaiting.slice(start,start+10).map(row=><tr key={row.id} className="border-t"><td className="p-4"><strong>{row.seller}</strong><span className="block text-slate-500">{row.depot}</span></td><td className="p-4 whitespace-nowrap">{new Date(`${row.date}T00:00:00`).toLocaleDateString('fr-FR')}</td><td className="p-4 whitespace-nowrap"><span className="block text-xs text-slate-500">V-{row.id}</span>{money(row.amount)}</td><td className="p-4 whitespace-nowrap font-bold">500 FCFA</td><td className="p-4 text-right"><Button disabled={!editable||busy!==null} onClick={()=>void assign(row.id,row.seller)}>{busy===row.id?'Attribution…':'Attribuer'}</Button></td></tr>):history.slice(start,start+10).map(row=><tr key={row.id} className="border-t"><td className="p-4"><strong>{row.seller}</strong><span className="block text-slate-500">{row.depot}</span></td><td className="p-4">{row.date}</td><td className="p-4 font-bold">{money(row.amount)}</td><td className="p-4 text-right text-emerald-700">Attribuée</td></tr>)}
    {count===0&&<tr><td colSpan={tab==='pending'?5:4} className="p-10 text-center text-slate-500">{loading?'Chargement…':search?'Aucun résultat pour cette recherche.':tab==='pending'?'Toutes les primes éligibles ont été attribuées.':'Aucune prime attribuée pour cette sélection.'}</td></tr>}
   </tbody></table></div>
   <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4"><span className="text-sm text-slate-500">{count} résultat(s) · Page {current} sur {pages}</span><div className="flex gap-2"><Button variant="outline" disabled={current===1} onClick={()=>setPage(current-1)}>Précédent</Button><Button variant="outline" disabled={current===pages} onClick={()=>setPage(current+1)}>Suivant</Button></div></div>
  </div>
  <details className="rounded-2xl border bg-white p-5"><summary className="cursor-pointer font-bold">Consulter les performances des revendeurs</summary><div className="mt-4 max-h-80 overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Revendeur</th><th className="p-3">CA</th><th className="p-3">Score</th><th className="p-3">Ventes</th></tr></thead><tbody>{performances.map(row=><tr key={row.phone} className="border-t"><td className="p-3">{row.seller}<span className="block text-slate-500">{row.depot}</span></td><td className="p-3 whitespace-nowrap">{row.amount} FCFA</td><td className="p-3">{row.score}/100</td><td className="p-3">{row.validated} validées · {row.pending} en attente · {row.rejected} rejetées</td></tr>)}</tbody></table></div></details>
 </section>;
}
