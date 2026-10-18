"use client";
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';

type Module = { key: string; label: string; editable: boolean };
export function AdminPermissions({ account, onClose, onSaved }: {
  account: { id: number; name: string; permissions?: string[] };
  onClose: () => void; onSaved: () => void;
}) {
  const [modules, setModules] = useState<Module[]>([]);
  const [permissions, setPermissions] = useState(account.permissions ?? []);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  useEffect(() => { apiFetch<Module[]>('/api/admin/permissions').then(setModules).catch(e => setError(e.message)); }, []);
  function toggle(key: string, action: 'view' | 'edit', checked: boolean) {
    const next = new Set(permissions);
    if (checked) { next.add(`${key}.${action}`); if (action === 'edit') next.add(`${key}.view`); }
    else { next.delete(`${key}.${action}`); if (action === 'view') next.delete(`${key}.edit`); }
    if (checked && ['audit', 'notifications', 'systeme'].includes(key)) next.add('analyses.view');
    if (!checked && key === 'analyses' && action === 'view') {
      for (const p of [...next]) if (['audit', 'notifications', 'systeme'].includes(p.split('.')[0])) next.delete(p);
    }
    setPermissions([...next]);
  }
  async function save() {
    setSaving(true); setError('');
    try { await apiFetch(`/api/admin/users/${account.id}/permissions`, { method: 'PUT', body: JSON.stringify({ permissions }) }); onSaved(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Enregistrement impossible'); }
    finally { setSaving(false); }
  }
  return <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="permission-title" onKeyDown={event => { if (event.key === 'Escape' && !saving) { event.stopPropagation(); onClose(); } if (event.key === 'Tab') { const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])')); const first = controls[0]; const last = controls[controls.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } } }}>
    <section className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white text-slate-900 shadow-xl">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4">
        <h2 id="permission-title" className="text-lg font-bold sm:text-xl">Droits de {account.name}</h2>
        <Button ref={closeRef} type="button" variant="ghost" size="icon" className="shrink-0" aria-label="Fermer les droits d’accès" title="Fermer sans enregistrer" disabled={saving} onClick={onClose}><X /></Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-3">
      <p className="mt-2 text-sm text-slate-600">Cochez les informations consultables et les actions autorisées. Modifier autorise aussi la consultation. Les droits s’appliquent dès l’enregistrement.</p>
      <p className="mt-2 rounded-lg bg-blue-50 p-3 text-sm">La gestion des administrateurs et de leurs droits reste réservée à djata.akossiwa@gmail.com. Les contrôles (journal, notifications et état technique) activent aussi la page Analyses. Le pilotage donne accès aux indicateurs consolidés ; le journal et l’historique des notifications couvrent toutes les rubriques.</p>
      {error && <p role="alert" className="my-3 text-red-700">{error}</p>}
      {!modules.length ? <p className="py-6">Chargement des rubriques…</p> : <table className="my-5 w-full text-sm"><thead><tr className="border-b text-left"><th className="py-3">Rubrique</th><th>Consulter</th><th>Modifier / agir</th></tr></thead><tbody>{modules.map(module => <tr key={module.key} className="border-b"><td className="py-3 pr-3">{module.label}</td><td><input type="checkbox" className="h-5 w-5" aria-label={`Consulter : ${module.label}`} checked={permissions.includes(`${module.key}.view`)} onChange={e => toggle(module.key, 'view', e.target.checked)} /></td><td>{module.editable ? <input type="checkbox" className="h-5 w-5" aria-label={`Modifier : ${module.label}`} checked={permissions.includes(`${module.key}.edit`)} onChange={e => toggle(module.key, 'edit', e.target.checked)} /> : '—'}</td></tr>)}</tbody></table>}
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t bg-white px-5 py-4"><Button variant="outline" disabled={saving} onClick={onClose}>Annuler</Button><Button disabled={saving || !modules.length} onClick={() => void save()}>{saving ? 'Enregistrement…' : 'Enregistrer les droits'}</Button></div>
    </section>
  </div>;
}
