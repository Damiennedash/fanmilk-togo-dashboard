'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  BellOff,
  CheckCircle2,
  LockKeyhole,
  LogOut,
  Mail,
  Moon,
  Phone,
  Settings,
  Sun,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  applyTheme,
  NOTIFICATIONS_KEY,
  PREFERENCES_EVENT,
  THEME_KEY,
} from '@/components/app-preferences';
import {
  apiFetch,
  clearSession,
  getStoredUser,
  getToken,
  SessionUser,
  updateStoredUser,
} from '@/lib/api';

export default function ProfilePage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      window.location.replace('/connexion?returnTo=/profil');
      return;
    }
    const storedUser = getStoredUser();
    if (storedUser) hydrateUser(storedUser);
    setDarkMode(localStorage.getItem(THEME_KEY) === 'dark');
    setNotificationsEnabled(
      localStorage.getItem(NOTIFICATIONS_KEY) !== 'disabled',
    );
    apiFetch<SessionUser>('/api/me')
      .then(hydrateUser)
      .catch(() => window.location.replace('/connexion?returnTo=/profil'));
  }, []);

  function hydrateUser(nextUser: SessionUser) {
    setUser(nextUser);
    setName(nextUser.name);
    setEmail(nextUser.email);
    setPhone(nextUser.phone ?? '');
    updateStoredUser(nextUser);
  }

  function updateTheme(enabled: boolean) {
    const theme = enabled ? 'dark' : 'light';
    setDarkMode(enabled);
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
    window.dispatchEvent(new Event(PREFERENCES_EVENT));
  }

  function updateNotifications(enabled: boolean) {
    setNotificationsEnabled(enabled);
    localStorage.setItem(
      NOTIFICATIONS_KEY,
      enabled ? 'enabled' : 'disabled',
    );
    window.dispatchEvent(new Event(PREFERENCES_EVENT));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const updated = await apiFetch<SessionUser>('/api/me', {
        method: 'PATCH',
        body: JSON.stringify({ name, email, phone, password }),
      });
      hydrateUser(updated);
      setPassword('');
      setMessage('Vos informations ont été mises à jour.');
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Impossible de modifier le profil.',
      );
    } finally {
      setSaving(false);
    }
  }

  const dashboardHref =
    user?.role === 'depositaire' ? '/depositaire' : '/dashboard';

  return (
    <main className="dashboard-shell min-h-screen bg-[#f3f7fb] px-5 py-8 text-[#122043] sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-5 rounded-3xl border border-blue-950/8 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/fan-site/logo-clean.png"
              alt="FanMilk"
              className="h-14 w-18 object-contain"
            />
            <div>
              <p className="text-xs font-black uppercase tracking-[.16em] text-[#0a4ea8]">
                Mon espace
              </p>
              <h1 className="text-2xl font-black text-[#082f70]">
                Profil et paramètres
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" render={<a href={dashboardHref} />}>
              <ArrowLeft /> Retour au tableau de bord
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                clearSession();
                window.location.replace('/connexion');
              }}
            >
              <LogOut /> Déconnexion
            </Button>
          </div>
        </header>

        {message && (
          <p className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
            <CheckCircle2 className="size-5" /> {message}
          </p>
        )}
        {error && (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <Card className="border-0 bg-white ring-1 ring-blue-950/8">
            <CardHeader>
              <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-[#0a4ea8]">
                <UserRound />
              </span>
              <CardTitle className="mt-3 text-2xl text-[#082f70]">
                Informations du profil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveProfile} className="space-y-5">
                <div>
                  <Label htmlFor="profile-name">Nom d’utilisateur</Label>
                  <div className="relative mt-2">
                    <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="profile-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                      className="h-12 pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="profile-email">Adresse électronique</Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="profile-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="h-12 pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="profile-phone">Numéro de téléphone</Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="profile-phone"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="+228…"
                      className="h-12 pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="profile-password">
                    Nouveau mot de passe (facultatif)
                  </Label>
                  <div className="relative mt-2">
                    <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="profile-password"
                      type="password"
                      minLength={8}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Au moins 8 caractères"
                      className="h-12 pl-10"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-12 w-full bg-[#0a4ea8] font-black hover:bg-[#082f70]"
                >
                  {saving ? 'Enregistrement…' : 'Enregistrer mes informations'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card
            id="reglages"
            className="h-fit border-0 bg-white ring-1 ring-blue-950/8"
          >
            <CardHeader>
              <span className="grid size-11 place-items-center rounded-xl bg-yellow-50 text-amber-700">
                <Settings />
              </span>
              <CardTitle className="mt-3 text-2xl text-[#082f70]">
                Réglages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4 rounded-2xl border p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-[#082f70]">
                  {darkMode ? <Moon /> : <Sun />}
                </span>
                <div className="min-w-0 flex-1">
                  <strong className="block text-sm">Mode sombre</strong>
                  <span className="text-xs text-slate-500">
                    Adapte l’affichage de votre espace.
                  </span>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={updateTheme}
                  aria-label="Activer le mode sombre"
                />
              </div>
              <div className="flex items-center gap-4 rounded-2xl border p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0a4ea8]">
                  {notificationsEnabled ? <Bell /> : <BellOff />}
                </span>
                <div className="min-w-0 flex-1">
                  <strong className="block text-sm">Notifications</strong>
                  <span className="text-xs text-slate-500">
                    Affiche les éléments qui demandent votre attention.
                  </span>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={updateNotifications}
                  aria-label="Activer les notifications"
                />
              </div>
              <p className="pt-2 text-xs leading-5 text-slate-500">
                Ces préférences sont conservées sur cet appareil. Les
                informations du profil sont enregistrées dans votre compte.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
