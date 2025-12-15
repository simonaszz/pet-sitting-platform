import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Simple Home Page
function HomePage() {
  const { user, isAuthenticated } = useAuthStore();
  const { clearAuth } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">🐾 Pet Sitting Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Hello, {user?.name}!</span>
              <button
                onClick={clearAuth}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Welcome to Pet Sitting Platform!</h2>
            <div className="space-y-2">
              <p><strong>ID:</strong> {user?.id}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Name:</strong> {user?.name}</p>
              <p><strong>Role:</strong> {user?.role}</p>
              <p><strong>Verified:</strong> {user?.isEmailVerified ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;