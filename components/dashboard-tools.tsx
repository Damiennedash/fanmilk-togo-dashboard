'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, BellOff, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  NOTIFICATIONS_KEY,
  PREFERENCES_EVENT,
} from '@/components/app-preferences';

export type DashboardNotification = {
  title: string;
  description: string;
  href: string;
};

export function DashboardTools({
  name,
  roleLabel,
  notifications,
}: {
  name: string;
  roleLabel: string;
  notifications: DashboardNotification[];
}) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    const syncPreferences = () =>
      setNotificationsEnabled(
        localStorage.getItem(NOTIFICATIONS_KEY) !== 'disabled',
      );
    syncPreferences();
    window.addEventListener(PREFERENCES_EVENT, syncPreferences);
    window.addEventListener('storage', syncPreferences);
    return () => {
      window.removeEventListener(PREFERENCES_EVENT, syncPreferences);
      window.removeEventListener('storage', syncPreferences);
    };
  }, []);

  const initials = useMemo(
    () =>
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() || 'FM',
    [name],
  );
  const visibleNotifications = notificationsEnabled ? notifications : [];

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Ouvrir les notifications"
            />
          }
        >
          {notificationsEnabled ? <Bell /> : <BellOff />}
          {visibleNotifications.length > 0 && (
            <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
          <PopoverHeader className="border-b px-4 py-3">
            <PopoverTitle className="font-black text-[#082f70]">
              Notifications
            </PopoverTitle>
            <PopoverDescription>
              {notificationsEnabled
                ? `${visibleNotifications.length} information${visibleNotifications.length > 1 ? 's' : ''} à consulter`
                : 'Les notifications sont désactivées.'}
            </PopoverDescription>
          </PopoverHeader>
          <div className="p-2">
            {visibleNotifications.length ? (
              visibleNotifications.map((item) => (
                <a
                  key={`${item.href}-${item.title}`}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-blue-50"
                >
                  <span className="size-2 shrink-0 rounded-full bg-[#0a4ea8]" />
                  <span className="min-w-0 flex-1">
                    <strong className="block text-sm text-[#082f70]">
                      {item.title}
                    </strong>
                    <span className="block text-xs text-slate-500">
                      {item.description}
                    </span>
                  </span>
                  <ChevronRight className="size-4 text-slate-400" />
                </a>
              ))
            ) : (
              <p className="px-3 py-6 text-center text-sm text-slate-500">
                {notificationsEnabled
                  ? 'Aucune nouvelle notification.'
                  : 'Vous pouvez les réactiver dans Paramètres.'}
              </p>
            )}
          </div>
          <a
            href="/profil#reglages"
            className="block border-t px-4 py-3 text-center text-xs font-black text-[#0a4ea8] hover:bg-blue-50"
          >
            Régler les notifications
          </a>
        </PopoverContent>
      </Popover>
      <a
        href="/profil"
        aria-label="Ouvrir mon profil"
        className="flex items-center gap-3 rounded-xl p-1 hover:bg-blue-50"
      >
        <span className="grid size-9 place-items-center rounded-full bg-blue-50 text-xs font-black text-[#0a4ea8]">
          {initials}
        </span>
        <span className="hidden text-left sm:block">
          <strong className="block max-w-40 truncate text-xs">{name}</strong>
          <span className="text-[10px] text-slate-500">{roleLabel}</span>
        </span>
      </a>
    </div>
  );
}
