import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sitterService, getServiceLabel } from '../services/sitter.service';
import { getApiErrorMessage } from '../utils/apiError';
import type { SitterProfile } from '../services/sitter.service';

export default function SitterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sitter, setSitter] = useState<SitterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSitter = useCallback(async () => {
    try {
      setLoading(true);
      const data = await sitterService.getById(id!);
      setSitter(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Prižiūrėtojas nerastas'));
      console.error('Failed to load sitter:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadSitter();
    }
  }, [id, loadSitter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Kraunama...</p>
        </div>
      </div>
    );
  }

  if (error || !sitter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Prižiūrėtojas nerastas
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/sitters')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition duration-200 font-semibold"
          >
            ← Grįžti į sąrašą
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => navigate('/sitters')}
            className="mb-4 text-white hover:underline flex items-center gap-2"
          >
            ← Grįžti į sąrašą
          </button>
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl">
                {sitter.user?.avatar ? (
                  <img
                    src={sitter.user.avatar}
                    alt={sitter.user?.name}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  '👤'
                )}
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">
                {sitter.user?.name || 'Prižiūrėtojas'}
              </h1>
              <p className="text-lg opacity-90">📍 {sitter.city}</p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center text-yellow-300">
                  ⭐ <span className="ml-1 text-xl font-semibold">{sitter.avgRating.toFixed(1)}</span>
                  <span className="ml-1 opacity-75">({sitter.totalReviews} atsiliepimai)</span>
                </div>
                {sitter.isVerified && (
                  <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-semibold">
                    ✓ Patvirtintas
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold">€{sitter.hourlyRate}</p>
              <p className="text-lg opacity-90">/valanda</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            {sitter.bio && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Apie mane</h2>
                <p className="text-gray-700 leading-relaxed">{sitter.bio}</p>
              </div>
            )}

            {/* Services */}
            {sitter.services && sitter.services.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Paslaugos</h2>
                <div className="grid grid-cols-2 gap-3">
                  {sitter.services.map((service, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-4 py-3 bg-purple-50 rounded-lg"
                    >
                      <span className="text-2xl">✓</span>
                      <span className="font-medium text-gray-800">
                        {getServiceLabel(service)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos */}
            {sitter.photos && sitter.photos.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Nuotraukos</h2>
                <div className="grid grid-cols-3 gap-4">
                  {sitter.photos.map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo}
                      alt={`Nuotrauka ${idx + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Informacija</h2>
              <div className="space-y-4">
                {sitter.experienceYears !== null && sitter.experienceYears !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500">Patirtis</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {sitter.experienceYears} {sitter.experienceYears === 1 ? 'metai' : 'metų'}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Maksimalus augintinių skaičius</p>
                  <p className="text-lg font-semibold text-gray-900">{sitter.maxPets || 1}</p>
                </div>
                {sitter.responseTime && (
                  <div>
                    <p className="text-sm text-gray-500">Atsako per</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ~{sitter.responseTime} min
                    </p>
                  </div>
                )}
                {sitter.address && (
                  <div>
                    <p className="text-sm text-gray-500">Adresas</p>
                    <p className="text-lg font-semibold text-gray-900">{sitter.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact/Book */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Susisiekti</h2>
              {sitter.user?.phone && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Telefonas</p>
                  <a
                    href={`tel:${sitter.user.phone}`}
                    className="text-lg font-semibold text-purple-600 hover:text-purple-700"
                  >
                    📞 {sitter.user.phone}
                  </a>
                </div>
              )}
              {sitter.user?.email && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-1">El. paštas</p>
                  <a
                    href={`mailto:${sitter.user.email}`}
                    className="text-lg font-semibold text-purple-600 hover:text-purple-700 break-all"
                  >
                    ✉️ {sitter.user.email}
                  </a>
                </div>
              )}
              <button
                onClick={() => navigate(`/bookings?sitterProfileId=${sitter.id}`)}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition duration-200 font-semibold"
              >
                📅 Rezervuoti
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
