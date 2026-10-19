'use client';
import { useState } from 'react';
import { apiFetch, invalidateApiCache } from '@/lib/api';
import { Button } from '@/components/ui/button';

type Person = {id: number; name: string};
type Issue = {id: number; state: 'ouverte' | 'en_cours' | 'resolue'; action_plan?: string; assigned_admin?: Person | null};
export function DifficultyFollowup({issue, assignees, editable, onSaved}: {issue: Issue; assignees: Person[]; editable: boolean; onSaved: (issue: Issue) => void}) {
  const [editing, setEditing] = useState(false);
  const [plan, setPlan] = useState('');
  const [assignee, setAssignee] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save(state: Issue['state']) {
    setBusy(true); setError('');
    try {
      const updated = await apiFetch<Issue>(`/api/admin/difficulties/${issue.id}`, {method:'PATCH', body:JSON.stringify({state, action_plan:plan, assigned_admin_id:assignee ? Number(assignee) : null})});
      invalidateApiCache(); onSaved(updated); setEditing(false);
    } catch(reason) { setError(reason instanceof Error ? reason.message : 'Enregistrement impossible.'); }
    finally {setBusy(false);}
  }
  return <div className="w-full space-y-3 rounded-xl border bg-white p-4 text-sm">
    <p><strong>Responsable :</strong> {issue.assigned_admin?.name || 'Non attribué'}</p>
    <p className="whitespace-pre-wrap"><strong>Actions à prendre :</strong> {issue.action_plan || 'À définir'}</p>
    {editable && !editing && <Button variant="outline" size="sm" onClick={()=>{setPlan(issue.action_plan || '');setAssignee(issue.assigned_admin ? String(issue.assigned_admin.id) : '');setEditing(true);}}>Actions, responsable et statut</Button>}
    {editing && <div className="space-y-3">
      <label className="block">Actions à prendre<textarea className="mt-1 block min-h-24 w-full rounded-lg border p-3" maxLength={5000} value={plan} onChange={e=>setPlan(e.target.value)} /></label>
      <label className="block">Attribuer à un administrateur<select className="mt-1 block w-full rounded-lg border p-3" value={assignee} onChange={e=>setAssignee(e.target.value)}><option value="">Non attribué</option>{assignees.map(person=><option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
      <p className="text-xs text-slate-500">Le responsable désigné reçoit une notification dans le site.</p>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {busy && <p role="status" className="text-blue-700">Enregistrement en cours…</p>}
      <div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={()=>void save(issue.state)}>Enregistrer</Button>{issue.state !== 'resolue' && <Button disabled={busy} onClick={()=>void save(issue.state === 'ouverte' ? 'en_cours' : 'resolue')}>{issue.state === 'ouverte' ? 'Enregistrer et passer en cours' : 'Enregistrer et résoudre'}</Button>}<Button variant="outline" disabled={busy} onClick={()=>setEditing(false)}>Annuler</Button></div>
    </div>}
  </div>;
}
