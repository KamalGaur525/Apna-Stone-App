import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

// Layout & Pages
import Layout    from './Layout';
import Login     from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products  from './pages/Products';
import Vendors   from './pages/Vendors';
import Guests    from './pages/Guests';

// ─── Hydration Guard ──────────────────────────────────────────────────────────
// Waits for zustand/persist to read localStorage before rendering any route.
// Without this: token = null on first render → flash redirect to /login even
// when user is already logged in.

function HydrationGuard({ children }: { children: ReactNode }) {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  if (!hasHydrated) {
    // Blank screen for a single frame — no flicker, no wrong redirect
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

// ─── Protected Route ──────────────────────────────────────────────────────────
// Only runs after hydration — token value is now reliable

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
            borderRadius: '16px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#fbbf24',  // amber-400
              secondary: '#1c1917',
            },
          },
        }}
      />

      {/* HydrationGuard wraps everything — no route renders before store is ready */}
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