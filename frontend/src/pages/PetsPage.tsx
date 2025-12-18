import { useState, useEffect, useCallback, useRef } from 'react';
import PageHeader from '../components/PageHeader';
import { petService, PetType, getPetTypeLabel } from '../services/pet.service';
import { getApiErrorMessage } from '../utils/apiError';
import { useToast } from '../hooks/useToast';
import type { Pet, CreatePetData } from '../services/pet.service';

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [error, setError] = useState('');

  const loadPets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await petService.getAll();
      setPets(data);
    } catch {
      setError('Nepavyko užkrauti augintinių');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  const handleDelete = async (id: string) => {
    if (!confirm('Ar tikrai norite ištrinti šį augintinį?')) return;

    try {
      await petService.delete(id);
      setPets(pets.filter(p => p.id !== id));
    } catch {
      alert('Nepavyko ištrinti augintinio');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="🐾 Mano augintiniai"
        right={(
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-white text-purple-700 rounded-lg shadow hover:bg-purple-50 active:bg-purple-100 active:scale-[0.98] active:opacity-90 transition duration-200 font-semibold"
          >
            + Pridėti augintinį
          </button>
        )}
      />

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
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 active:opacity-90 active:scale-[0.98] transition duration-200 font-semibold"
            >
              Pridėti augintinį
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                onDelete={handleDelete}
                onEdit={setEditingPet}
              />
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

      {editingPet && (
        <EditPetModal
          pet={editingPet}
          onClose={() => {
            setEditingPet(null);
            loadPets();
          }}
          onSuccess={() => {
            setEditingPet(null);
            loadPets();
          }}
        />
      )}
    </div>
  );
}

function PetFormModal({
  mode,
  pet,
  onClose,
  onSuccess,
}: {
  mode: 'create' | 'edit';
  pet?: Pet;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const isEdit = mode === 'edit';
  const hasUserInteractedRef = useRef(false);
  const lastSavedToastAtRef = useRef(0);
  const savedStatusTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const lastSavedSnapshotRef = useRef<string>('');
  const autoSaveDebounceTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const [formData, setFormData] = useState<CreatePetData>(() => {
    if (isEdit && pet) {
      return {
        name: pet.name ?? '',
        type: pet.type ?? PetType.DOG,
        breed: pet.breed ?? '',
        age: pet.age ?? undefined,
        notes: pet.notes ?? '',
        medicalNotes: pet.medicalNotes ?? '',
      };
    }

    return {
      name: '',
      type: PetType.DOG,
      breed: '',
      age: undefined,
      notes: '',
      medicalNotes: '',
    };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (!isEdit || !pet) return;

    const snapshot = JSON.stringify({
      name: pet.name ?? '',
      type: pet.type ?? PetType.DOG,
      breed: pet.breed ?? '',
      age: pet.age ?? undefined,
      notes: pet.notes ?? '',
      medicalNotes: pet.medicalNotes ?? '',
    });

    lastSavedSnapshotRef.current = snapshot;
  }, [isEdit, pet]);

  const snapshotNow = JSON.stringify(formData);
  const canAutoSave = Boolean(formData.name?.trim()) && Boolean(formData.type);
  const unchanged = isEdit ? snapshotNow === lastSavedSnapshotRef.current : true;

  const saveNow = useCallback(
    async (payload: CreatePetData) => {
      if (!pet) return;

      setLoading(true);
      setError('');

      try {
        await petService.update(pet.id, payload);
        lastSavedSnapshotRef.current = JSON.stringify(payload);
        setSaveStatus('saved');

        if (savedStatusTimerRef.current) {
          window.clearTimeout(savedStatusTimerRef.current);
        }
        savedStatusTimerRef.current = window.setTimeout(() => {
          setSaveStatus('idle');
        }, 2500);

        const now = Date.now();
        if (now - lastSavedToastAtRef.current > 1500) {
          toast.success('Išsaugota');
          lastSavedToastAtRef.current = now;
        }
      } catch (err: unknown) {
        setSaveStatus('error');
        setError(getApiErrorMessage(err, 'Nepavyko atnaujinti augintinio'));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [pet, toast],
  );

  const requestClose = useCallback(() => {
    if (isEdit && pet && hasUserInteractedRef.current && canAutoSave && !unchanged) {
      if (autoSaveDebounceTimerRef.current) {
        window.clearTimeout(autoSaveDebounceTimerRef.current);
        autoSaveDebounceTimerRef.current = null;
      }

      void (async () => {
        try {
          await saveNow(formData);
          onClose();
        } catch {
          // keep modal open, error is shown
        }
      })();

      return;
    }

    onClose();
  }, [canAutoSave, formData, isEdit, onClose, pet, saveNow, unchanged]);

  useEffect(() => {
    const onKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape') {
        requestClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [requestClose]);

  useEffect(() => {
    if (!isEdit) return;
    if (!pet) return;
    if (!hasUserInteractedRef.current) return;
    if (!canAutoSave) return;
    if (unchanged) return;

    const timer = window.setTimeout(() => {
      void saveNow(formData);
    }, 700);
    autoSaveDebounceTimerRef.current = timer;

    return () => window.clearTimeout(timer);
  }, [canAutoSave, formData, isEdit, pet, saveNow, unchanged]);

  const handleSubmit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEdit) {
        if (!pet) {
          setError('Nepavyko atnaujinti augintinio');
          return;
        }
        await petService.update(pet.id, formData);
      } else {
        await petService.create(formData);
      }

      toast.success(isEdit ? 'Išsaugota' : 'Pridėta');
      onSuccess();
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          isEdit ? 'Nepavyko atnaujinti augintinio' : 'Nepavyko pridėti augintinio',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    formChangeEvent: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = formChangeEvent.target;

    if (isEdit) {
      hasUserInteractedRef.current = true;
      if (savedStatusTimerRef.current) {
        window.clearTimeout(savedStatusTimerRef.current);
        savedStatusTimerRef.current = null;
      }
      setSaveStatus('saving');
      setError('');
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'age' ? (value ? parseInt(value) : undefined) : value,
    }));
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onMouseDown={(mouseEvent) => {
        if (mouseEvent.target === mouseEvent.currentTarget) {
          requestClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isEdit ? 'Redaguoti augintinį' : 'Pridėti augintinį'}
              </h2>
              {isEdit && (
                <p className="text-sm text-gray-600 mt-1">
                  {!unchanged && saveStatus === 'saving' && 'Saugoma...'}
                  {!unchanged && saveStatus === 'saved' && 'Išsaugota'}
                  {saveStatus === 'error' && 'Klaida'}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={requestClose}
              className="text-gray-400 hover:text-gray-600 active:text-gray-700 transition"
              aria-label="Uždaryti"
              title="Uždaryti"
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

            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medicininės pastabos
                </label>
                <textarea
                  name="medicalNotes"
                  value={formData.medicalNotes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Alergijos, vaistai, ..."
                />
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={requestClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 active:scale-[0.98] active:opacity-90 transition"
              >
                {isEdit ? 'Uždaryti' : 'Atšaukti'}
              </button>
              {!isEdit && (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 active:opacity-90 active:scale-[0.98] disabled:opacity-50 transition font-semibold"
                >
                  {loading ? 'Pridedama...' : 'Pridėti'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function EditPetModal({
  pet,
  onClose,
  onSuccess,
}: {
  pet: Pet;
  onClose: () => void;
  onSuccess: () => void;
}) {
  return (
    <PetFormModal
      mode="edit"
      pet={pet}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

// Pet Card Component
function PetCard({
  pet,
  onDelete,
  onEdit,
}: {
  pet: Pet;
  onDelete: (id: string) => void;
  onEdit: (pet: Pet) => void;
}) {
  return (
    <div
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition duration-200 cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={() => onEdit(pet)}
      onKeyDown={(keyEvent) => {
        if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
          keyEvent.preventDefault();
          onEdit(pet);
        }
      }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{pet.name}</h3>
            <p className="text-sm text-gray-600">{getPetTypeLabel(pet.type)}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(clickEvent) => {
                clickEvent.stopPropagation();
                onEdit(pet);
              }}
              className="text-gray-500 hover:text-green-600 transition"
              aria-label="Redaguoti"
              title="Redaguoti"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687 1.687a1.5 1.5 0 010 2.121L7.5 19.343 3 21l1.657-4.5L16.862 4.487z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 6l3 3" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(clickEvent) => {
                clickEvent.stopPropagation();
                onDelete(pet.id);
              }}
              className="text-red-500 hover:text-red-700 transition"
              aria-label="Ištrinti"
              title="Ištrinti"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
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
  return <PetFormModal mode="create" onClose={onClose} onSuccess={onSuccess} />;
}
