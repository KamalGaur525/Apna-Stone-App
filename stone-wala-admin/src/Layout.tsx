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
  X
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

  return (
    <div className="min-h-screen bg-stone-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-stone-950 text-stone-300">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Stone Wala</h1>
          <p className="text-sm text-stone-500 mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 font-medium shadow-sm'
                    : 'hover:bg-stone-900 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-900">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-stone-900 hover:text-red-300 transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-stone-950 flex items-center justify-between px-4 z-40 shadow-sm">
        <h1 className="text-xl font-bold text-white tracking-tight">Stone Wala</h1>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="text-stone-300 p-2 rounded-lg hover:bg-stone-800"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-stone-950/50 backdrop-blur-sm z-50 flex">
          <div className="w-64 bg-stone-950 h-full flex flex-col text-stone-300 animate-in slide-in-from-left duration-200">
            <div className="p-4 flex items-center justify-between border-b border-stone-900">
              <h2 className="text-xl font-bold text-white">Menu</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-6">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-amber-500 text-stone-950 font-medium shadow-sm'
                        : 'hover:bg-stone-900 hover:text-white'
                    }`
                  }
                >
                  <item.icon size={20} />
                  {item.name}
                </NavLink>
              ))}
            </nav>

            <div className="p-4 border-t border-stone-900">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-stone-900 hover:text-red-300 transition-colors"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
          {/* Click outside to close */}
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden lg:pt-0 pt-16">
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}