import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PetsPage from './pages/PetsPage';
import SittersPage from './pages/SittersPage';
import SitterDetailPage from './pages/SitterDetailPage';
import MyProfilePage from './pages/MyProfilePage';
import MyBookingsPage from './pages/MyBookingsPage';
import NewBookingPage from './pages/NewBookingPage';
import MyJobsPage from './pages/MyJobsPage';
import { bookingService, VisitStatus } from './services/booking.service';

function roleHas(userRole: string | undefined, required: 'OWNER' | 'SITTER') {
  if (!userRole) return false;
  if (userRole === 'BOTH') return true;
  return userRole === required;
}

function getFirstName(fullName: string | undefined) {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  return parts[0] ?? '';
}

function getGreetingByTime(date: Date) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return 'Labas rytas';
  if (hour >= 11 && hour < 18) return 'Laba diena';
  if (hour >= 18 && hour < 23) return 'Labas vakaras';
  return 'Labas';
}

function toLithuanianVocative(firstName: string) {
  const name = firstName.trim();
  if (!name) return '';

  const lower = name.toLowerCase();

  if (lower.endsWith('ius') && name.length > 3) return `${name.slice(0, -3)}iau`;
  if (lower.endsWith('as') && name.length > 2) return `${name.slice(0, -2)}ai`;
  if (lower.endsWith('is') && name.length > 2) return `${name.slice(0, -2)}i`;
  if (lower.endsWith('us') && name.length > 2) return `${name.slice(0, -2)}au`;
  if (lower.endsWith('ė') && name.length > 1) return `${name.slice(0, -1)}e`;

  return name;
}

function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = count > 99 ? '99+' : String(count);

  return (
    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold rounded-full bg-red-600 text-white">
      {label}
    </span>
  );
}

// Layout with Navigation
function Layout({ children }: { children: React.ReactNode }) {
  const { user, clearAuth } = useAuthStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [pendingJobsCount, setPendingJobsCount] = useState(0);

  const isSitter = roleHas(user?.role, 'SITTER');
  const isOwner = roleHas(user?.role, 'OWNER');
  const firstName = getFirstName(user?.name);
  const greetingName = toLithuanianVocative(firstName) || firstName;
  const greetingText = firstName ? `${getGreetingByTime(new Date())}, ${greetingName}!` : '';

  useEffect(() => {
    if (!user) {
      const timer = window.setTimeout(() => {
        setPendingBookingsCount(0);
        setPendingJobsCount(0);
      }, 0);

      return () => window.clearTimeout(timer);
    }

    let canceled = false;

    const loadCounts = async () => {
      try {
        if (isOwner) {
          const bookings = await bookingService.getMyBookings();
          const count = bookings.filter((b) => b.status === VisitStatus.PENDING).length;
          if (!canceled) setPendingBookingsCount(count);
        } else if (!canceled) {
          setPendingBookingsCount(0);
        }

        if (isSitter) {
          const jobs = await bookingService.getMyJobs();
          const count = jobs.filter((b) => b.status === VisitStatus.PENDING).length;
          if (!canceled) setPendingJobsCount(count);
        } else if (!canceled) {
          setPendingJobsCount(0);
        }
      } catch {
        // ignore
      }
    };

    void loadCounts();
    const interval = window.setInterval(loadCounts, 30000);

    return () => {
      canceled = true;
      window.clearInterval(interval);
    };
  }, [isOwner, isSitter, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMobileMenuOpen(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (navRef.current && navRef.current.contains(target)) return;

      setMobileMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav ref={navRef} className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition"
                aria-label={mobileMenuOpen ? 'Uždaryti meniu' : 'Atidaryti meniu'}
                aria-expanded={mobileMenuOpen}
              >
                <span className="text-xl">{mobileMenuOpen ? '✕' : '☰'}</span>
              </button>

              <Link
                to="/"
                className="text-xl font-bold text-gray-900 hover:text-purple-600 transition whitespace-nowrap min-w-0"
              >
                <span className="inline-flex items-center gap-2 min-w-0">
                  <span>🐾</span>
                  <span className="hidden sm:inline truncate">Augintinių priežiūra</span>
                  <span className="sm:hidden truncate">Augintiniai</span>
                </span>
              </Link>

              <div className="hidden lg:flex gap-2 whitespace-nowrap">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    location.pathname === '/'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Pagrindinis
                </Link>
                <Link
                  to="/sitters"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    location.pathname === '/sitters'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Prižiūrėtojai
                </Link>
                <Link
                  to="/pets"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    location.pathname === '/pets'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Mano augintiniai
                </Link>
                <Link
                  to="/my-profile"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    location.pathname === '/my-profile'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Mano profilis
                </Link>
                <Link
                  to="/bookings"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    location.pathname === '/bookings'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    Rezervacijos
                    <NotificationBadge count={pendingBookingsCount} />
                  </span>
                </Link>

                {isSitter && (
                  <>
                    <Link
                      to="/my-jobs"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                        location.pathname === '/my-jobs'
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        Mano darbai
                        <NotificationBadge count={pendingJobsCount} />
                      </span>
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline text-gray-700 text-sm max-w-56 truncate">{greetingText}</span>
              <button
                onClick={clearAuth}
                className="px-3 sm:px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 active:bg-red-800 active:scale-[0.98] active:opacity-90 transition"
              >
                <span className="hidden sm:inline">Atsijungti</span>
                <span className="sm:hidden">Išeiti</span>
              </button>
            </div>
          </div>
        </div>

        {greetingText && (
          <div className="sm:hidden border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
              <div className="text-sm text-gray-600 truncate">{greetingText}</div>
            </div>
          </div>
        )}

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
              <div className="flex flex-col gap-2">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    location.pathname === '/'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Pagrindinis
                </Link>
                <Link
                  to="/sitters"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    location.pathname === '/sitters'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Prižiūrėtojai
                </Link>
                <Link
                  to="/pets"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    location.pathname === '/pets'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Mano augintiniai
                </Link>
                <Link
                  to="/my-profile"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    location.pathname === '/my-profile'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Mano profilis
                </Link>
                <Link
                  to="/bookings"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    location.pathname === '/bookings'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="inline-flex items-center justify-between w-full">
                    <span>Rezervacijos</span>
                    <NotificationBadge count={pendingBookingsCount} />
                  </span>
                </Link>
                {isSitter && (
                  <Link
                    to="/my-jobs"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                      location.pathname === '/my-jobs'
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="inline-flex items-center justify-between w-full">
                      <span>Mano darbai</span>
                      <NotificationBadge count={pendingJobsCount} />
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <main>{children}</main>
    </div>
  );
}

// Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <Layout>{children}</Layout>;
}

function RoleProtectedRoute({
  requiredRole,
  children,
}: {
  requiredRole: 'SITTER' | 'OWNER';
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();

  if (!roleHas(user?.role, requiredRole)) {
    return <Navigate to="/my-profile" />;
  }

  return <>{children}</>;
}

// Home Page
function HomePage() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-8 mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Sveiki atvykę į Augintinių priežiūros platformą! 🐾
          </h2>
          <p className="text-gray-700">
            Pradėkite naudotis platforma pridėdami savo augintinius.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Jūsų profilis</h3>
          <div className="space-y-2">
            <p className="text-gray-700">
              <strong>El. paštas:</strong> {user?.email}
            </p>
            <p className="text-gray-700">
              <strong>Vardas:</strong> {user?.name}
            </p>
            <p className="text-gray-700">
              <strong>Rolė:</strong> {user?.role}
            </p>
            <p className="text-gray-700">
              <strong>Patvirtintas:</strong> {user?.isEmailVerified ? 'Taip ✅' : 'Ne ❌'}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/pets"
            className="block bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
          >
            <div className="text-4xl mb-3">🐕</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Mano augintiniai</h3>
            <p className="text-gray-600">Tvarkykite savo augintinių informaciją</p>
          </Link>

          <div className="block bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-6">
            <div className="text-4xl mb-3 opacity-50">🔜</div>
            <h3 className="text-lg font-bold text-gray-500 mb-2">Daugiau funkcijų</h3>
            <p className="text-gray-400">Greitai...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sitters"
          element={
            <ProtectedRoute>
              <SittersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sitters/:id"
          element={
            <ProtectedRoute>
              <SitterDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pets"
          element={
            <ProtectedRoute>
              <PetsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-profile"
          element={
            <ProtectedRoute>
              <MyProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-sitter-profile"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRole="SITTER">
                <Navigate to="/my-profile?tab=sitter" />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings/new"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRole="OWNER">
                <NewBookingPage />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-jobs"
          element={
            <ProtectedRoute>
              <RoleProtectedRoute requiredRole="SITTER">
                <MyJobsPage />
              </RoleProtectedRoute>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;