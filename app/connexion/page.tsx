'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  apiFetch,
  apiFetchWithToken,
  clearSession,
  getStoredUser,
  getToken,
  saveSession,
  SessionUser,
} from '@/lib/api';

export default function ConnexionPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [forgotten, setForgotten] = useState(false);
  const [message, setMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionPrompt, setSessionPrompt] = useState(false);
  const [existingUser, setExistingUser] = useState<SessionUser | null>(null);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaQrCode, setMfaQrCode] = useState('');
  const [mfaManualKey, setMfaManualKey] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [loginDestination, setLoginDestination] = useState('/dashboard');

  useEffect(() => {
    const checkExistingSession = () => {
      const storedUser = getStoredUser();
      if (getToken() && storedUser) {
        setExistingUser(storedUser);
        setSessionPrompt(true);
      }
    };
    checkExistingSession();
    window.addEventListener('pageshow', checkExistingSession);
    return () => window.removeEventListener('pageshow', checkExistingSession);
  }, []);

  function userHome(user: SessionUser) {
    return user.role === 'depositaire' ? '/depositaire' : '/dashboard';
  }

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await apiFetch<{
        mfa_required: boolean;
        mfa_setup_required: boolean;
        mfa_token: string;
        qr_code?: string;
        manual_key?: string;
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setMfaToken(result.mfa_token);
      setMfaQrCode(result.qr_code ?? '');
      setMfaManualKey(result.manual_key ?? '');
      setMfaCode('');
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Connexion impossible.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await apiFetchWithToken<{
        access_token: string;
        user: SessionUser;
        recovery_codes?: string[];
      }>('/api/auth/mfa/verify', mfaToken, {
        method: 'POST',
        body: JSON.stringify({ code: mfaCode }),
      });
      if (result.user.role === 'revendeur')
        throw new Error(
          'Les revendeurs utilisent Vendor‑Bot sur WhatsApp pour leurs déclarations.',
        );
      saveSession(result.access_token, result.user);
      const requestedPath = new URLSearchParams(window.location.search).get(
        'returnTo',
      );
      const allowedReturn =
        requestedPath === '/profil' ||
        (result.user.role === 'depositaire' &&
          requestedPath?.startsWith('/depositaire')) ||
        (result.user.role === 'administrateur' &&
          requestedPath?.startsWith('/dashboard'));
      const destination = allowedReturn && requestedPath ? requestedPath : userHome(result.user);
      if (result.recovery_codes?.length) {
        setRecoveryCodes(result.recovery_codes);
        setLoginDestination(destination);
      } else {
        window.location.replace(destination);
      }
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Connexion impossible.',
      );
    } finally {
      setLoading(false);
    }
  }
  async function submitReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResetLoading(true);
    setMessage('');
    setResetError('');
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiFetch<{ message: string }>(
        '/api/auth/forgot-password',
        { method: 'POST', body: JSON.stringify({ email: form.get('email') }) },
      );
      setMessage(result.message);
    } catch (reason) {
      setResetError(
        reason instanceof Error
          ? reason.message
          : 'Service momentanément indisponible.',
      );
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f4f8fc] lg:grid-cols-[1.08fr_.92fr]">
      <AlertDialog open={sessionPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vous êtes déjà connecté</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous revenir à votre tableau de bord ou vous déconnecter
              pour utiliser un autre compte ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              variant="outline"
              onClick={() => {
                clearSession();
                setExistingUser(null);
                setSessionPrompt(false);
              }}
            >
              Se déconnecter
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                if (existingUser)
                  window.location.replace(userHome(existingUser));
              }}
              className="bg-[#0a4ea8] hover:bg-[#082f70]"
            >
              Revenir au tableau de bord
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <section className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_68%_45%,#0e78db_0%,#0754ad_40%,#052f79_75%,#031d52_100%)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:34px_34px]" />
        <a href="/" className="relative z-40 flex items-center gap-3">
          <img
            src="/fan-site/logo-clean.png"
            alt="FanMilk"
            className="h-15 w-20 object-contain"
          />
          <span className="text-xl font-extrabold italic">FanMilk Togo</span>
        </a>
        <div className="relative z-10 mx-auto h-[520px] w-full max-w-[680px]">
          <div className="fan-orbit-glow absolute inset-[12%] rounded-full" />
          <img
            src="/fan-site/milk-orbit.png"
            alt=""
            aria-hidden="true"
            className="fan-milk-orbit absolute inset-[16%] z-10 h-[68%] w-[68%] object-contain"
          />
          <div className="fan-pack-wrap fan-pack-wrap-one">
            <img
              src="/fan-site/fanxtra.png"
              alt="FanXtra"
              className="fan-xtra-pack fan-xtra-pack-one"
            />
          </div>
          <div className="fan-pack-wrap fan-pack-wrap-two">
            <img
              src="/fan-site/fanxtra.png"
              alt="FanXtra"
              className="fan-xtra-pack fan-xtra-pack-two"
            />
          </div>
          <div className="fan-nutrient fan-nutrient-b2">
            <span>
              B<sub>2</sub>
            </span>
          </div>
          <div className="fan-nutrient fan-nutrient-b6">
            <span>
              B<sub>6</sub>
            </span>
          </div>
          <div className="fan-nutrient fan-nutrient-phosphore">
            <span>PHOSPHORE</span>
          </div>
          <div className="fan-nutrient fan-nutrient-iode">
            <span>IODE</span>
          </div>
          <div className="fan-nutrient fan-nutrient-calcium">
            <span>CALCIUM</span>
          </div>
        </div>
        <div className="relative z-40">
          <p className="text-xs font-black uppercase tracking-[.22em] text-yellow-300">
            Espace commercial sécurisé
          </p>
          <h1 className="mt-3 text-4xl font-black leading-none">
            Vos décisions alimentent le réseau.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-blue-100/70">
            Vendor‑Bot collecte les déclarations WhatsApp, PostgreSQL les
            conserve sur Render, puis chaque profil accède uniquement aux
            fonctions autorisées.
          </p>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <a
            href="/"
            className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#0a4ea8]"
          >
            <ArrowLeft className="size-4" />
            Retour à l’accueil
          </a>
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img
              src="/fan-site/logo-clean.png"
              alt="FanMilk"
              className="h-12 w-16 object-contain"
            />
            <span className="font-extrabold text-[#082f70]">FANMILK TOGO</span>
          </div>
          {!forgotten ? (
            <>
              {recoveryCodes.length > 0 ? (
                <>
                  <p className="text-xs font-black uppercase tracking-[.18em] text-[#0a4ea8]">Sécurité du compte</p>
                  <h2 className="mt-3 text-3xl font-black text-[#082f70]">Conservez vos codes de secours</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-500">Chaque code permet une seule connexion si vous perdez l’accès à Google Authenticator. Ils ne seront plus affichés.</p>
                  <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border bg-white p-4 font-mono text-sm font-bold">
                    {recoveryCodes.map((code) => <span key={code} className="rounded-lg bg-blue-50 p-2 text-center">{code}</span>)}
                  </div>
                  <div className="mt-5 grid gap-3">
                    <Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(recoveryCodes.join('\n'))}>Copier les codes</Button>
                    <Button type="button" className="bg-[#0a4ea8]" onClick={() => window.location.replace(loginDestination)}>J’ai sauvegardé mes codes</Button>
                  </div>
                </>
              ) : !mfaToken ? (
                <>
              <h2 className="text-4xl font-black tracking-tight text-[#082f70]">
                Bienvenue
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Connectez-vous avec les identifiants de votre compte FanMilk.
                Votre espace s’ouvrira automatiquement.
              </p>
              <form onSubmit={submitCredentials} className="mt-7 space-y-5">
                <div>
                  <Label htmlFor="email">Adresse électronique</Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="nom@fanmilk.tg"
                      className="h-12 pl-10"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mot de passe</Label>
                    <button
                      type="button"
                      onClick={() => setForgotten(true)}
                      className="text-xs font-bold text-[#0a4ea8]"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative mt-2">
                    <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-12 px-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
                {error && (
                  <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-xl bg-[#0a4ea8] text-base font-black hover:bg-[#082f70]"
                >
                  {loading ? 'Connexion…' : 'Se connecter'} <ArrowRight />
                </Button>
                <p className="flex items-center justify-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  Jeton de session sécurisé · droits vérifiés côté serveur
                </p>
              </form>
                </>
              ) : (
                <>
                  <p className="text-xs font-black uppercase tracking-[.18em] text-[#0a4ea8]">
                    Double authentification
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-[#082f70]">
                    Code Google Authenticator
                  </h2>
                  {mfaQrCode && (
                    <div className="mt-5 rounded-2xl border bg-white p-4 text-center">
                      <p className="mb-3 text-sm text-slate-600">
                        Première connexion : scannez ce QR code avec Google
                        Authenticator, puis saisissez le code affiché.
                      </p>
                      <img
                        src={mfaQrCode}
                        alt="QR code Google Authenticator FanMilk"
                        className="mx-auto size-44"
                      />
                      <p className="mt-2 break-all text-xs text-slate-500">
                        Clé manuelle : <strong>{mfaManualKey}</strong>
                      </p>
                    </div>
                  )}
                  {!mfaQrCode && (
                    <p className="mt-3 text-sm text-slate-500">
                      Ouvrez Google Authenticator et recopiez le code à six
                      chiffres de votre compte FanMilk.
                    </p>
                  )}
                  <form onSubmit={submitMfa} className="mt-6 space-y-4">
                    <Label htmlFor="mfa-code">Code Authenticator à 6 chiffres ou code de secours</Label>
                    <Input
                      id="mfa-code"
                      inputMode="text"
                      autoComplete="one-time-code"
                      pattern="([0-9]{6}|[A-Fa-f0-9]{8})"
                      maxLength={8}
                      required
                      value={mfaCode}
                      onChange={(event) =>
                        setMfaCode(event.target.value.replace(/[^A-Fa-f0-9]/g, '').toUpperCase())
                      }
                      className="h-14 text-center text-2xl font-black tracking-[.35em]"
                    />
                    {error && (
                      <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
                        {error}
                      </p>
                    )}
                    <Button
                      type="submit"
                      disabled={loading || ![6, 8].includes(mfaCode.length)}
                      className="h-12 w-full bg-[#0a4ea8]"
                    >
                      {loading ? 'Vérification…' : 'Vérifier et se connecter'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setMfaToken('');
                        setMfaQrCode('');
                        setMfaCode('');
                      }}
                      className="w-full"
                    >
                      Retour
                    </Button>
                  </form>
                </>
              )}
            </>
          ) : (
            <>
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#0a4ea8]">
                Récupération du compte
              </p>
              <h2 className="mt-3 text-3xl font-black text-[#082f70]">
                Mot de passe oublié
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Saisissez l’adresse électronique liée à votre compte.
              </p>
              <form onSubmit={submitReset} className="mt-7">
                <Label htmlFor="reset-email">Adresse électronique</Label>
                <Input
                  id="reset-email"
                  name="email"
                  type="email"
                  required
                  className="mt-2 h-12"
                />
                {message && (
                  <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
                    {message}
                  </p>
                )}
                {resetError && (
                  <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
                    {resetError}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={resetLoading}
                  className="mt-5 h-12 w-full bg-[#0a4ea8]"
                >
                  {resetLoading ? 'Envoi…' : 'Envoyer le lien'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setForgotten(false);
                    setMessage('');
                    setResetError('');
                  }}
                  className="mt-2 w-full"
                >
                  Retour à la connexion
                </Button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
