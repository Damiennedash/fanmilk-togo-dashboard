'use client';

import { FormEvent, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';

export default function ConnexionPage() {
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setStep('otp');
  }

  function submitOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code !== '123456') {
      setError('Le code saisi est incorrect. Pour cette démonstration, utilisez 123456.');
      return;
    }
    window.location.assign('/dashboard');
  }

  return (
    <main className="grid min-h-screen bg-[#f4f8fc] lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-[#073b86] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(250,204,21,.25),transparent_26%),radial-gradient(circle_at_15%_80%,rgba(56,189,248,.22),transparent_30%)]" />
        <a href="/" className="relative flex items-center gap-3">
          <img src="/fan-site/logo.png" alt="FanMilk" className="h-14 w-18 rounded-xl bg-white object-contain p-1" />
          <span className="text-lg font-extrabold italic tracking-tight">FanMilk Togo</span>
        </a>
        <div className="relative max-w-lg">
          <img src="/products/fan-assortiment.png" alt="Produits FanMilk" className="mb-4 h-64 w-full object-contain drop-shadow-2xl" />
          <p className="text-xs font-bold uppercase tracking-[.2em] text-yellow-300">Espace commercial sécurisé</p>
          <h1 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-.045em]">Pilotez toutes les saveurs FanMilk.</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-blue-100/70">Retrouvez les ventes de FanXtra, FanYogo, FanChoco, FanVanille et de nos yaourts.</p>
        </div>
        <div className="relative flex items-center gap-3 text-sm text-blue-100/70"><ShieldCheck className="size-5 text-yellow-300" /> Connexion chiffrée · Session sécurisée · Journal d’accès</div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <a href="/" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="size-4" /> Retour à l’accueil</a>

          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src="/fan-site/logo.png" alt="FanMilk" className="h-12 w-16 object-contain" />
            <span className="font-extrabold text-emerald-950">FANMILK TOGO</span>
          </div>

          {step === 'credentials' ? (
            <>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Étape 1 sur 2</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.035em] text-emerald-950">Bienvenue sur votre espace</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Saisissez vos identifiants professionnels pour continuer.</p>

              <form onSubmit={submitCredentials} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse e-mail</Label>
                  <Input id="email" name="email" type="email" defaultValue="admin@fanmilk.tg" required className="h-12 rounded-xl bg-white px-4" autoComplete="username" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Input id="password" name="password" type={showPassword ? 'text' : 'password'} defaultValue="FanMilk2026!" required className="h-12 rounded-xl bg-white px-4 pr-12" autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1 top-1 grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-muted-foreground"><input type="checkbox" className="accent-emerald-700" /> Se souvenir de moi</label>
                  <button type="button" className="font-semibold text-primary hover:underline">Mot de passe oublié ?</button>
                </div>
                <Button type="submit" size="lg" className="h-12 w-full rounded-xl text-base font-bold">Continuer <ArrowRight data-icon="inline-end" /></Button>
              </form>
            </>
          ) : (
            <>
              <button type="button" onClick={() => { setStep('credentials'); setError(''); }} className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" /> Modifier les identifiants</button>
              <span className="mb-5 grid size-13 place-items-center rounded-2xl bg-primary/10 text-primary"><LockKeyhole className="size-6" /></span>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Étape 2 sur 2</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.035em] text-emerald-950">Vérifiez votre identité</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Entrez le code à 6 chiffres envoyé à votre adresse professionnelle.</p>

              <form onSubmit={submitOtp} className="mt-8">
                <Label htmlFor="otp" className="mb-3">Code de sécurité</Label>
                <InputOTP id="otp" maxLength={6} value={code} onChange={setCode} containerClassName="w-full" aria-label="Code de sécurité à six chiffres">
                  <InputOTPGroup className="grid w-full grid-cols-6 gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => <InputOTPSlot key={index} index={index} className="size-12 rounded-xl border bg-white text-lg font-bold first:rounded-xl first:border last:rounded-xl" />)}
                  </InputOTPGroup>
                </InputOTP>
                {error && <p role="alert" className="mt-3 text-sm font-medium text-red-600">{error}</p>}
                <p className="mt-4 rounded-xl bg-yellow-50 p-3 text-xs leading-5 text-yellow-900">Mode démonstration : utilisez le code <strong>123456</strong>.</p>
                <Button type="submit" size="lg" disabled={code.length !== 6} className="mt-6 h-12 w-full rounded-xl text-base font-bold">Vérifier et accéder</Button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
