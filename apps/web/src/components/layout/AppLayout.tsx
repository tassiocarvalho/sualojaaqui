import {
  BookOpen,
  ChevronRight,
  CloudOff,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Scale,
  Search,
  Sun,
  X,
} from 'lucide-react';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LoadingState } from '@/components/ui/Display';
import { useAuth } from '@/features/auth/AuthProvider';
import { useBranding } from '@/features/branding/BrandingProvider';
import { useOffline } from '@/features/offline/OfflineProvider';
import { PendingQueueModal } from '@/features/offline/PendingQueueModal';
import { cn } from '@/lib/cn';
import { ROLE_LABELS } from '@/lib/labels';
import { MANUAL_URL } from '@/lib/manual';
import { CommandPalette } from './CommandPalette';
import { NAV_GROUPS } from './nav';

const COLLAPSED_KEY = 'sidebar-collapsed';
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const SEARCH_SHORTCUT = isMac ? '⌘K' : 'Ctrl+K';

/** Preferência de cada computador; o armazenamento pode estar bloqueado (aba anônima). */
function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  const { branding, logo } = useBranding();
  return (
    <div className="flex min-w-0 items-center gap-2.5" title={collapsed ? branding.name : undefined}>
      <img src={logo} alt="" className="size-8 shrink-0 rounded-md border border-slate-200 bg-white object-contain" />
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-slate-900">{branding.name}</p>
          {branding.tagline && <p className="truncate text-[11px] text-slate-500">{branding.tagline}</p>}
        </div>
      )}
    </div>
  );
}

/** Iniciais do usuário para o avatar ("Maria Souza" → "MS"). */
function initials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** Grupo e nome da tela atual, a partir do menu (ex.: Estoque › Produtos). */
function useCurrentPage() {
  const { pathname } = useLocation();
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      const match = item.to === '/' ? pathname === '/' : pathname === item.to || pathname.startsWith(`${item.to}/`);
      if (match) return { group: group.title, label: item.label };
    }
  }
  if (pathname.startsWith('/perfil')) return { group: 'Conta', label: 'Meu perfil' };
  if (pathname.startsWith('/termos')) return { group: 'Conta', label: 'Termos e privacidade' };
  return null;
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useBranding();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={dark ? 'Usar tema claro' : 'Usar tema escuro'}
      aria-label={dark ? 'Usar tema claro' : 'Usar tema escuro'}
      className={cn('rounded-lg p-1.5 transition-colors', className)}
    >
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}

interface SidebarProps {
  /** Só no celular: fecha o menu deslizante ao navegar. */
  onNavigate?: () => void;
  /** Só no computador: menu recolhido mostra apenas os ícones. */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

function Sidebar({ onNavigate, collapsed = false, onToggleCollapsed }: SidebarProps) {
  const { user, can, logout } = useAuth();
  const navigate = useNavigate();
  const mobile = Boolean(onNavigate);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Recolhido: só o ícone, centralizado, com o nome no "title" (dica ao passar o mouse).
  const itemClass = cn(
    'relative flex items-center rounded-md py-[7px] text-[13.5px] font-medium transition-colors',
    collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5',
  );
  const footerClass = cn(itemClass, 'text-slate-600 hover:bg-slate-100 hover:text-slate-900');

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white text-slate-700">
      <div className={cn('flex h-14 shrink-0 items-center border-b border-slate-200', collapsed ? 'justify-center px-2' : 'px-4')}>
        <Brand collapsed={collapsed} />
      </div>

      <nav className={cn('sidebar-scroll flex-1 overflow-y-auto py-3', collapsed ? 'space-y-3 px-2' : 'space-y-5 px-3')}>
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => can(item.permission));
          if (items.length === 0) return null;
          return (
            <div key={group.title}>
              {collapsed ? (
                <div className="mx-2 mb-2 border-t border-slate-200" aria-hidden />
              ) : (
                <p className="mb-1 px-2.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  {group.title}
                </p>
              )}
              <ul className="space-y-px">
                {items.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={to === '/'}
                      onClick={onNavigate}
                      title={collapsed ? label : undefined}
                      aria-label={collapsed ? label : undefined}
                      className={({ isActive }) =>
                        cn(
                          itemClass,
                          isActive
                            ? 'bg-brand-50 text-brand-800 before:absolute before:inset-y-1.5 before:-left-3 before:w-[3px] before:rounded-r before:bg-brand-600'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                          isActive && collapsed && 'before:-left-2',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon className={cn('size-[18px] shrink-0', isActive ? 'text-brand-700' : 'text-slate-400')} />
                          {!collapsed && <span className="truncate">{label}</span>}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className={cn('space-y-px border-t border-slate-200', collapsed ? 'p-2' : 'p-3')}>
        <a href={MANUAL_URL} target="_blank" rel="noopener" title={collapsed ? 'Manual de uso' : undefined} className={footerClass}>
          <BookOpen className="size-[18px] shrink-0 text-slate-400" />
          {!collapsed && 'Manual de uso'}
        </a>
        <Link to="/termos" onClick={onNavigate} title={collapsed ? 'Termos e privacidade' : undefined} className={footerClass}>
          <Scale className="size-[18px] shrink-0 text-slate-400" />
          {!collapsed && 'Termos e privacidade'}
        </Link>
        {/* No celular não há barra superior: o perfil fica aqui. */}
        {mobile && (
          <NavLink to="/perfil" onClick={onNavigate} className="flex items-center gap-2.5 rounded-md px-2.5 py-2 hover:bg-slate-100">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
              {initials(user?.name)}
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-medium text-slate-900">{user?.name}</span>
              <span className="block text-xs text-slate-500">{user && ROLE_LABELS[user.role]}</span>
            </span>
          </NavLink>
        )}
        <button onClick={handleLogout} title={collapsed ? 'Sair' : undefined} className={cn(footerClass, 'w-full')}>
          <LogOut className="size-[18px] shrink-0 text-slate-400" />
          {!collapsed && 'Sair'}
        </button>
        {onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            title={collapsed ? 'Expandir menu' : undefined}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            aria-expanded={!collapsed}
            className={cn(footerClass, 'w-full text-slate-500')}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-[18px] shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="size-[18px] shrink-0" />
                Recolher menu
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function ConnectionBar() {
  const { online, pending, pendingSales, syncing, sync } = useOffline();
  const [details, setDetails] = useState(false);
  const failed = pending.filter((p) => p.error).length + pendingSales.filter((s) => s.error).length;
  const waiting = pending.length + pendingSales.length;
  if (online && waiting === 0) return null;

  return (
    <div
      className={cn(
        'no-print flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2 text-sm',
        online ? 'bg-amber-50 text-amber-900' : 'bg-[#1e293b] text-white',
      )}
    >
      {!online && (
        <span className="inline-flex items-center gap-2 font-medium">
          <CloudOff className="size-4" /> Sem internet — os registros ficam salvos neste dispositivo
        </span>
      )}
      {waiting > 0 && (
        <span className="inline-flex items-center gap-2">
          {[
            pendingSales.length > 0 && `${pendingSales.length} venda(s)`,
            pending.length > 0 && `${pending.length} movimentação(ões)`,
          ]
            .filter(Boolean)
            .join(' e ')}{' '}
          aguardando envio
          {failed > 0 && (
            <button type="button" onClick={() => setDetails(true)} className="font-bold text-red-600 underline">
              ({failed} com erro — ver o motivo)
            </button>
          )}
          {online && (
            <button onClick={() => void sync({ retryFailed: true })} className="inline-flex items-center gap-1 font-medium underline">
              <RefreshCw className={cn('size-3.5', syncing && 'animate-spin')} /> Enviar agora
            </button>
          )}
          <button type="button" onClick={() => setDetails(true)} className="font-medium underline">
            Detalhes
          </button>
        </span>
      )}
      <PendingQueueModal open={details} onClose={() => setDetails(false)} />
    </div>
  );
}

/** Barra superior (computador): onde estou, busca rápida, tema e usuário. */
function TopBar({ onSearch }: { onSearch: () => void }) {
  const { user } = useAuth();
  const page = useCurrentPage();
  return (
    <header className="no-print sticky top-0 z-20 hidden h-14 items-center gap-4 border-b border-slate-200 bg-white/95 px-6 backdrop-blur lg:flex">
      <nav aria-label="Você está em" className="flex min-w-0 items-center gap-1.5 text-sm">
        {page && (
          <>
            <span className="text-slate-500">{page.group}</span>
            <ChevronRight className="size-3.5 shrink-0 text-slate-400" />
            <span className="truncate font-medium text-slate-900">{page.label}</span>
          </>
        )}
      </nav>

      <button
        type="button"
        onClick={onSearch}
        aria-label="Busca rápida"
        className="ml-auto flex h-9 w-72 items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-3 text-sm text-slate-500 transition-colors hover:border-slate-400 hover:bg-white xl:w-80"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-left">Buscar telas, produtos…</span>
        <kbd className="kbd">{SEARCH_SHORTCUT}</kbd>
      </button>

      <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
        <ThemeToggle className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" />
        <NavLink
          to="/perfil"
          title="Meu perfil"
          className="flex items-center gap-2.5 rounded-md py-1 pr-2 pl-1 transition-colors hover:bg-slate-100"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
            {initials(user?.name)}
          </span>
          <span className="hidden leading-tight xl:block">
            <span className="block max-w-40 truncate text-sm font-medium text-slate-900">{user?.name}</span>
            <span className="block text-[11px] text-slate-500">{user && ROLE_LABELS[user.role]}</span>
          </span>
        </NavLink>
      </div>
    </header>
  );
}

function MobileBrand({ onSearch }: { onSearch: () => void }) {
  const { branding, logo } = useBranding();
  return (
    <>
      <img src={logo} alt="" className="size-7 rounded-md object-contain" />
      <span className="flex-1 truncate text-sm font-semibold">{branding.name}</span>
      <button
        type="button"
        onClick={onSearch}
        aria-label="Busca rápida"
        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
      >
        <Search className="size-[18px]" />
      </button>
      <ThemeToggle className="text-slate-500 hover:bg-slate-100" />
    </>
  );
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  const toggleCollapsed = () =>
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, value ? '0' : '1');
      } catch {
        // sem armazenamento: vale só nesta aba
      }
      return !value;
    });
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  // Ctrl+K (⌘K no Mac) abre a busca rápida de qualquer tela.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={cn('min-h-screen transition-[padding] duration-200', collapsed ? 'lg:pl-[72px]' : 'lg:pl-64')}>
      {/* Menu lateral fixo (computador), recolhível */}
      <aside
        className={cn(
          'no-print fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-200 lg:block',
          collapsed ? 'w-[72px]' : 'w-64',
        )}
      >
        <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      </aside>

      {/* Menu deslizante (celular/tablet) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3.5 right-3 z-10 rounded-md p-1 text-slate-500 hover:bg-slate-100"
              aria-label="Fechar menu"
            >
              <X className="size-5" />
            </button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <header className="no-print sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </button>
        <MobileBrand onSearch={openSearch} />
      </header>

      <TopBar onSearch={openSearch} />

      <ConnectionBar />

      <main key={location.pathname} className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
        <Suspense fallback={<LoadingState />}>
          <Outlet />
        </Suspense>
      </main>

      <CommandPalette open={searchOpen} onClose={closeSearch} />
    </div>
  );
}
