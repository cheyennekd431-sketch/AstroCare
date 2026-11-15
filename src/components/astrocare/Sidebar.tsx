import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Activity, Brain, MessageSquareText, Radiation, ScanLine, Siren, Sun } from 'lucide-react';

import { cn } from '@/lib/utils';

const navItems = [
  { id: 'scanner', label: 'Scanner', icon: ScanLine, to: '/' as const },
  { id: 'history', label: 'Health history', icon: Activity, to: '/history' as const },
  { id: 'wellbeing', label: 'Well-being', icon: Brain, to: '/wellbeing' as const },
  { id: 'radiation', label: 'Radiation', icon: Radiation, to: '/radiation' as const },
  { id: 'environment', label: 'Environment', icon: Sun, to: '/environment' as const },
];

interface SidebarProps {
  onEmergency: () => void;
  onToggleChat: () => void;
}

/** Console-style navigation rail for the AstroCare med-bay interface. */
export default function Sidebar({ onEmergency, onToggleChat }: SidebarProps) {
  const { pathname } = useLocation();
  const [chatActive, setChatActive] = useState(false);

  return (
    <aside className="flex w-16 shrink-0 flex-col border-r border-border bg-sidebar xl:w-60">
      <div className="flex h-16 items-center justify-center border-b border-border px-2 xl:justify-start xl:px-4">
        <img
          src="/airo-assets/images/logo/horizontal"
          alt="AstroCare"
          className="hidden h-8 w-auto max-w-[9.5rem] self-center object-contain xl:block"
        />
        <img
          src="/airo-assets/images/logo/favicon"
          alt="AstroCare"
          className="h-9 w-9 self-center object-contain xl:hidden"
        />
      </div>

      <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-1 p-2 xl:p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.to;
          return (
            <Link
              key={item.id}
              to={item.to}
              aria-current={isActive ? 'page' : undefined}
              title={item.label}
              className={cn(
                'flex items-center gap-3 rounded-lg px-2.5 py-3 text-sm font-medium transition-colors duration-150 xl:px-3',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground',
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')} />
              <span className="hidden truncate xl:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2 border-t border-border p-2 xl:p-3">
        <button
          type="button"
          onClick={() => {
            setChatActive(true);
            onToggleChat();
          }}
          title="Open Carlitos"
          className={cn(
            'flex items-center gap-3 rounded-lg px-2.5 py-3 text-sm font-medium transition-colors duration-150 hover:bg-primary/10 xl:px-3',
            chatActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
          )}
        >
          <MessageSquareText className="h-5 w-5 shrink-0" />
          <span className="hidden truncate xl:inline">Carlitos</span>
        </button>
        <button
          type="button"
          onClick={onEmergency}
          className="ac-emergency-glow flex items-center justify-center gap-3 rounded-lg bg-destructive px-2.5 py-3 text-sm font-semibold text-destructive-foreground transition-colors duration-150 hover:bg-destructive/90 xl:justify-start xl:px-3"
        >
          <Siren className="h-5 w-5 shrink-0" />
          <span className="hidden truncate xl:inline">Emergency</span>
        </button>
      </div>
    </aside>
  );
}
