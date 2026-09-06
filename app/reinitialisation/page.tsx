'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';

export default function ReinitialisationPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token') ?? '');
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!token) {
      setError('Ce lien de réinitialisation est invalide.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setSuccess(true);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Impossible de modifier le mot de passe.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f8fc] px-5 py-10">
      <section className="w-full max-w-md rounded-3xl bg-white p-7 shadow-xl shadow-blue-950/10 sm:p-10">
        <img
          src="/fan-site/logo-clean.png"
          alt="FanMilk"
          className="mb-8 h-16 w-24 object-contain"
        />
        {success ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto size-14 text-emerald-600" />
            <h1 className="mt-5 text-3xl font-black text-[#082f70]">
              Mot de passe modifié
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Votre nouveau mot de passe est actif. Vous pouvez maintenant vous
              connecter.
            </p>
            <Button asChild className="mt-7 h-12 w-full bg-[#0a4ea8]">
              <a href="/connexion">Aller à la connexion</a>
            </Button>
          </div>
        ) : (
          <>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#0a4ea8]">
              Récupération du compte
            </p>
            <h1 className="mt-3 text-3xl font-black text-[#082f70]">
              Nouveau mot de passe
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Choisissez un mot de passe d’au moins 8 caractères.
            </p>
            <form onSubmit={submit} className="mt-7 space-y-5">
              <div>
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <div className="relative mt-2">
                  <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                    className="h-12 px-10"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirmation">Confirmer le mot de passe</Label>
                <Input
                  id="confirmation"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  required
                  minLength={8}
                  className="mt-2 h-12"
                />
              </div>
              {error && (
                <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full bg-[#0a4ea8]"
              >
                {loading ? 'Modification…' : 'Modifier le mot de passe'}
              </Button>
              <Button asChild type="button" variant="ghost" className="w-full">
                <a href="/connexion">
                  <ArrowLeft className="size-4" /> Retour à la connexion
                </a>
              </Button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
