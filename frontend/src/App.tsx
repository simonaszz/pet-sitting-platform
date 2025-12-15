import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PetsPage from './pages/PetsPage';
import SittersPage from './pages/SittersPage';
import SitterDetailPage from './pages/SitterDetailPage';
import MySitterProfilePage from './pages/MySitterProfilePage';
import MyBookingsPage from './pages/MyBookingsPage';
import MyJobsPage from './pages/MyJobsPage';

// Layout with Navigation
function Layout({ children }: { children: React.ReactNode }) {
  const { user, clearAuth } = useAuthStore();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-xl font-bold text-gray-900 hover:text-purple-600 transition">
                🐾 Augintinių priežiūra
              </Link>
              <div className="hidden md:flex space-x-4">
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
                  Priežiūrėtojai
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
                  to="/my-sitter-profile"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    location.pathname === '/my-sitter-profile'
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
                  Rezervacijos
                </Link>
                <Link
                  to="/my-jobs"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    location.pathname === '/my-jobs'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Mano darbai
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 text-sm">Sveiki, {user?.name}!</span>
              <button
                onClick={clearAuth}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition"
              >
                Atsijungti
              </button>
            </div>
          </div>
        </div>
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
          path="/my-sitter-profile"
          element={
            <ProtectedRoute>
              <MySitterProfilePage />
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
          path="/my-jobs"
          element={
            <ProtectedRoute>
              <MyJobsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;