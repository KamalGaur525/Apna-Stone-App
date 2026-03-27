import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { ShieldCheck } from 'lucide-react';

// Layout & Pages
import Layout    from './Layout';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products  from './pages/Products';
import Vendors   from './pages/Vendors';
import Guests    from './pages/Guests';

// ─── Hydration Guard ──────────────────────────────────────────────────────────

function HydrationGuard({ children }: { children: ReactNode }) {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Brand mark */}
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-900/20">
            <ShieldCheck size={22} className="text-stone-100" strokeWidth={2.5} />
          </div>
          {/* Spinner track */}
          <div className="w-5 h-5 border-2 border-stone-300 border-t-amber-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ─── Protected Route ──────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1c1917', // stone-900
            color: '#fff',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '500',
            padding: '10px 14px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          },
          success: {
            iconTheme: {
              primary: '#fbbf24',  // amber-400
              secondary: '#1c1917',
            },
          },
        }}
      />

      <HydrationGuard>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected Admin Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="vendors"  element={<Vendors />}  />
            <Route path="guests"   element={<Guests />}   />
          </Route>

          {/* 404 — unknown routes go to login if logged out, home if logged in */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HydrationGuard>
    </BrowserRouter>
  );
}