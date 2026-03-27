import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import {
  LayoutDashboard,
  Package,
  Users,
  UserSquare,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Vendors', path: '/vendors', icon: Users },
    { name: 'Guests', path: '/guests', icon: UserSquare },
  ];

  const SidebarContent = ({ onNav }: { onNav?: () => void }) => (
    <>
      {/* Brand */}
      <div className="px-5 pt-7 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-900/30 shrink-0">
            <ShieldCheck size={18} className="text-stone-100" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-white text-base font-black tracking-tight leading-none">
              Stone Wala
            </h1>
            <p className="text-stone-300 text-[10px] font-bold uppercase tracking-[0.2em] mt-0.5">
              Admin Panel
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-6 h-px bg-gradient-to-r from-stone-800 via-stone-700/50 to-transparent" />
      </div>

      {/* Nav label */}
      <p className="px-6 text-[9px] font-black text-stone-300 uppercase tracking-[0.3em] mb-2">
        Navigation
      </p>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={onNav}
            end={item.path === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold ${
                isActive
                  ? 'bg-amber-500 text-stone-100 shadow-md shadow-amber-900/30'
                  : 'text-stone-400 hover:bg-stone-800/70 hover:text-stone-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`shrink-0 transition-transform duration-200 ${
                    isActive ? '' : 'group-hover:scale-110'
                  }`}
                >
                  <item.icon
                    size={17}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </span>
                {item.name}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-stone-100/40" aria-hidden="true" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 mt-4">
        <div className="h-px bg-gradient-to-r from-transparent via-stone-800 to-transparent mb-3" />
        <button
          onClick={handleLogout}
          className="group flex items-center gap-3 px-3.5 py-2.5 w-full rounded-xl text-stone-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 text-sm font-semibold"
        >
          <LogOut
            size={17}
            strokeWidth={2}
            className="group-hover:-translate-x-0.5 transition-transform duration-200"
          />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-stone-100 flex">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 bg-stone-950 shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* ── Mobile Header ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-stone-950 flex items-center justify-between px-4 z-40 border-b border-stone-900">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center shrink-0">
            <ShieldCheck size={14} className="text-stone-950" strokeWidth={2.5} />
          </div>
          <span className="text-white text-base font-black tracking-tight">Stone Wala</span>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open menu"
          className="text-stone-400 hover:text-white p-2 rounded-lg hover:bg-stone-800 transition-colors duration-150"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* ── Mobile Drawer ── */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <div className="relative w-64 bg-stone-950 h-full flex flex-col animate-in slide-in-from-left duration-250 shadow-2xl">
            {/* Close row */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center shrink-0">
                  <ShieldCheck size={14} className="text-stone-950" strokeWidth={2.5} />
                </div>
                <span className="text-white text-sm font-black tracking-tight">Stone Wala</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
                className="p-1.5 text-stone-500 hover:text-white hover:bg-stone-800 rounded-lg transition-colors duration-150"
              >
                <X size={18} />
              </button>
            </div>

            <div className="h-px mx-5 bg-stone-800 mb-2" />

            {/* Reuse nav section */}
            <p className="px-6 text-[9px] font-black text-stone-600 uppercase tracking-[0.3em] mt-3 mb-2">
              Navigation
            </p>
            <nav className="flex-1 px-3 space-y-0.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold ${
                      isActive
                        ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-900/30'
                        : 'text-stone-400 hover:bg-stone-800/70 hover:text-stone-100'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                      {item.name}
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-stone-900/40" aria-hidden="true" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="p-3 mt-4">
              <div className="h-px bg-gradient-to-r from-transparent via-stone-800 to-transparent mb-3" />
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="group flex items-center gap-3 px-3.5 py-2.5 w-full rounded-xl text-stone-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 text-sm font-semibold"
              >
                <LogOut size={17} strokeWidth={2} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden lg:pt-0 pt-14">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}