import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { sitterService, getServiceLabel } from '../services/sitter.service';
import type { SitterProfile } from '../services/sitter.service';

export default function SittersPage() {
  const [sitters, setSitters] = useState<SitterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '',
    minRate: '',
    maxRate: '',
  });

  const loadSitters = useCallback(async () => {
    try {
      setLoading(true);
      const data = await sitterService.getAll({
        city: filters.city || undefined,
        minRate: filters.minRate ? parseFloat(filters.minRate) : undefined,
        maxRate: filters.maxRate ? parseFloat(filters.maxRate) : undefined,
      });
      console.log('Sitters loaded:', data);
      setSitters(data);
    } catch (err) {
      console.error('Nepavyko užkrauti prižiūrėtojų:', err);
    } finally {
      setLoading(false);
    }
  }, [filters.city, filters.minRate, filters.maxRate]);

  useEffect(() => {
    loadSitters();
  }, [loadSitters]);

  const handleSearch = () => {
    loadSitters();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold mb-4">🐾 Raskite prižiūrėtoją</h1>
          <p className="text-lg opacity-90">Patikimi augintinių prižiūrėtojai jūsų mieste</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Miestas"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Min. kaina €/val"
              value={filters.minRate}
              onChange={(e) => setFilters({ ...filters, minRate: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Max. kaina €/val"
              value={filters.maxRate}
              onChange={(e) => setFilters({ ...filters, maxRate: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold transition"
            >
              🔍 Ieškoti
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Kraunama...</p>
          </div>
        ) : sitters.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Prižiūrėtojų nerasta
            </h3>
            <p className="text-gray-600">Pabandykite pakeisti paieškos filtrus</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6">
              Rasta <strong>{sitters.length}</strong> prižiūrėtoj{sitters.length === 1 ? 'as' : 'ų'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sitters.map((sitter) => (
                <SitterCard key={sitter.id} sitter={sitter} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SitterCard({ sitter }: { sitter: SitterProfile }) {
  return (
    <Link
      to={`/sitters/${sitter.id}`}
      className="block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition duration-200"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {sitter.user?.name || 'Prižiūrėtojas'}
            </h3>
            <p className="text-sm text-gray-600">📍 {sitter.city}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-600">
              €{sitter.hourlyRate}
            </p>
            <p className="text-xs text-gray-500">/valanda</p>
          </div>
        </div>

        {sitter.bio && (
          <p className="text-sm text-gray-700 mb-4 line-clamp-2">{sitter.bio}</p>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-yellow-500">
            ⭐ {sitter.avgRating.toFixed(1)}
            <span className="text-gray-500 ml-1">({sitter.totalReviews})</span>
          </div>
          {sitter.experienceYears && (
            <span className="text-gray-600">
              {sitter.experienceYears} m. patirtis
            </span>
          )}
        </div>

        {sitter.services && sitter.services.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {sitter.services.slice(0, 3).map((service, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full"
              >
                {getServiceLabel(service).split(' ')[0]}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
