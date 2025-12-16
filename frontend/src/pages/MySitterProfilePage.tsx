import { useState, useEffect, useCallback } from 'react';
import { sitterService, AVAILABLE_SERVICES, getServiceLabel } from '../services/sitter.service';
import { getApiErrorMessage } from '../utils/apiError';
import type { SitterProfile, CreateSitterProfileData } from '../services/sitter.service';

export default function MySitterProfilePage() {
  const [profile, setProfile] = useState<SitterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<CreateSitterProfileData>({
    bio: '',
    city: '',
    address: '',
    hourlyRate: 10,
    services: [],
    maxPets: 1,
    experienceYears: 0,
  });
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await sitterService.getMyProfile();
      setProfile(data);
      setFormData({
        bio: data.bio || '',
        city: data.city,
        address: data.address || '',
        hourlyRate: Number(data.hourlyRate),
        services: data.services || [],
        maxPets: data.maxPets || 1,
        experienceYears: data.experienceYears || 0,
      });
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Nepavyko užkrauti profilio');
      if (msg.toLowerCase().includes('nerastas')) {
        setEditing(true);
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (profile) {
        await sitterService.updateProfile(formData);
      } else {
        await sitterService.createProfile(formData);
      }
      await loadProfile();
      setEditing(false);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Klaida išsaugant profilį'));
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = (service: string) => {
    const services = formData.services || [];
    if (services.includes(service)) {
      setFormData({
        ...formData,
        services: services.filter((s) => s !== service),
      });
    } else {
      setFormData({
        ...formData,
        services: [...services, service],
      });
    }
  };

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Kraunama...</p>
        </div>
      </div>
    );
  }

  if (!editing && profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Mano prižiūrėtojo profilis</h1>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                ✏️ Redaguoti
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-1">MIESTAS</h3>
                <p className="text-lg">📍 {profile.city}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-1">KAINA</h3>
                <p className="text-2xl font-bold text-purple-600">€{profile.hourlyRate}/val</p>
              </div>

              {profile.bio && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">APRAŠYMAS</h3>
                  <p className="text-gray-700">{profile.bio}</p>
                </div>
              )}

              {profile.services && profile.services.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">PASLAUGOS</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.services.map((service, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                      >
                        {getServiceLabel(service)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">PATIRTIS</h3>
                  <p className="text-lg">{profile.experienceYears || 0} metai</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">MAX. AUGINTINIŲ</h3>
                  <p className="text-lg">{profile.maxPets || 1}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Reitingas</p>
                    <p className="text-xl">⭐ {profile.avgRating.toFixed(1)} ({profile.totalReviews} atsiliepimai)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {profile ? 'Redaguoti profilį' : 'Sukurti prižiūrėtojo profilį'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Miestas *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Vilnius"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valandinis įkainis (€) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.5"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aprašymas
              </label>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Papasakokite apie save ir savo patirtį..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paslaugos
              </label>
              <div className="space-y-2">
                {AVAILABLE_SERVICES.map((service) => (
                  <label key={service} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.services?.includes(service)}
                      onChange={() => handleServiceToggle(service)}
                      className="mr-2"
                    />
                    <span>{getServiceLabel(service)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patirtis (metais)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.experienceYears}
                  onChange={(e) => setFormData({ ...formData, experienceYears: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max. augintinių
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxPets}
                  onChange={(e) => setFormData({ ...formData, maxPets: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              {profile && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Atšaukti
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition font-semibold"
              >
                {loading ? 'Išsaugoma...' : profile ? 'Išsaugoti' : 'Sukurti'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
