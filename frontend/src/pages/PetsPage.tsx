import { useState, useEffect } from 'react';
import { petService, PetType, getPetTypeLabel } from '../services/pet.service';
import type { Pet, CreatePetData } from '../services/pet.service';

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      setLoading(true);
      const data = await petService.getAll();
      setPets(data);
    } catch (err) {
      setError('Nepavyko užkrauti augintinių');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ar tikrai norite ištrinti šį augintinį?')) return;

    try {
      await petService.delete(id);
      setPets(pets.filter(p => p.id !== id));
    } catch (err) {
      alert('Nepavyko ištrinti augintinio');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">🐾 Mano augintiniai</h1>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition duration-200 font-semibold"
            >
              + Pridėti augintinį
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Kraunama...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        ) : pets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🐕</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Dar neturite augintinių
            </h3>
            <p className="text-gray-600 mb-6">
              Pradėkite pridėdami savo pirmąjį augintinį!
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition duration-200 font-semibold"
            >
              Pridėti augintinį
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Add Pet Modal */}
      {showModal && (
        <AddPetModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadPets();
          }}
        />
      )}
    </div>
  );
}

// Pet Card Component
function PetCard({ pet, onDelete }: { pet: Pet; onDelete: (id: string) => void }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{pet.name}</h3>
            <p className="text-sm text-gray-600">{getPetTypeLabel(pet.type)}</p>
          </div>
          <button
            onClick={() => onDelete(pet.id)}
            className="text-red-500 hover:text-red-700 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <div className="space-y-2 text-sm">
          {pet.breed && (
            <p className="text-gray-700">
              <span className="font-semibold">Veislė:</span> {pet.breed}
            </p>
          )}
          {pet.age !== null && pet.age !== undefined && (
            <p className="text-gray-700">
              <span className="font-semibold">Amžius:</span> {pet.age} m.
            </p>
          )}
          {pet.notes && (
            <p className="text-gray-700">
              <span className="font-semibold">Pastabos:</span> {pet.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Add Pet Modal Component
function AddPetModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState<CreatePetData>({
    name: '',
    type: PetType.DOG,
    breed: '',
    age: undefined,
    notes: '',
    medicalNotes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await petService.create(formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Nepavyko pridėti augintinio');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' ? (value ? parseInt(value) : undefined) : value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Pridėti augintinį</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Vardas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vardas *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Reksas"
              />
            </div>

            {/* Tipas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipas *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={PetType.DOG}>🐕 Šuo</option>
                <option value={PetType.CAT}>🐈 Katė</option>
                <option value={PetType.BIRD}>🐦 Paukštis</option>
                <option value={PetType.RABBIT}>🐰 Triušis</option>
                <option value={PetType.OTHER}>🐾 Kita</option>
              </select>
            </div>

            {/* Veislė */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Veislė
              </label>
              <input
                type="text"
                name="breed"
                value={formData.breed}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Vokiečių aviganis"
              />
            </div>

            {/* Amžius */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amžius (metais)
              </label>
              <input
                type="number"
                name="age"
                min="0"
                value={formData.age || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="3"
              />
            </div>

            {/* Pastabos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pastabos
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Labai draugiškas..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Atšaukti
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition font-semibold"
              >
                {loading ? 'Pridedama...' : 'Pridėti'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
