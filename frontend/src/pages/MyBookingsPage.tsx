import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { bookingService, getStatusLabel, getStatusColor } from '../services/booking.service';
import { petService } from '../services/pet.service';
import { sitterService } from '../services/sitter.service';
import { useToast } from '../hooks/useToast';
import { getApiErrorMessage } from '../utils/apiError';
import type { Visit } from '../services/booking.service';
import type { Pet } from '../services/pet.service';
import type { SitterProfile } from '../services/sitter.service';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Visit | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const toastRef = useRef(toast);
  const hasShownLoadErrorRef = useRef(false);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const hasLoadedOnceRef = useRef(false);
  const isFetchingRef = useRef(false);

  const prefillSitterProfileId = searchParams.get('sitterProfileId') ?? '';

  const loadBookings = useCallback(async (options?: { silent?: boolean }) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const shouldBeSilent = options?.silent || hasLoadedOnceRef.current;

      if (shouldBeSilent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await bookingService.getMyBookings();
      setBookings(data);
      hasShownLoadErrorRef.current = false;
    } catch (err) {
      if (!hasShownLoadErrorRef.current) {
        const errorMsg = getApiErrorMessage(err, 'Nepavyko užkrauti rezervacijų');
        toastRef.current.error(errorMsg);
        hasShownLoadErrorRef.current = true;
      }
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      hasLoadedOnceRef.current = true;
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    if (prefillSitterProfileId) {
      setShowModal(true);

      const next = new URLSearchParams(searchParams);
      next.delete('sitterProfileId');
      setSearchParams(next, { replace: true });
    }
  }, [prefillSitterProfileId, searchParams, setSearchParams]);

  const handleCancel = async (id: string) => {
    if (!confirm('Ar tikrai norite atšaukti šią rezervaciją?')) return;

    try {
      await bookingService.cancelBooking(id);
      toast.success('Rezervacija atšaukta');
      await loadBookings({ silent: true });
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Nepavyko atšaukti rezervacijos'));
    }
  };

  const handleResubmit = async (id: string) => {
    if (!confirm('Pateikti šią rezervaciją iš naujo?')) return;

    try {
      await bookingService.resubmitBooking(id);
      toast.success('Rezervacija pateikta iš naujo');
      await loadBookings({ silent: true });
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Nepavyko pateikti iš naujo'));
    }
  };

  const handleDeleteRejected = async (id: string) => {
    if (!confirm('Ištrinti šią atmestą rezervaciją?')) return;

    try {
      await bookingService.deleteRejectedBooking(id);
      toast.success('Rezervacija ištrinta');
      await loadBookings({ silent: true });
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Nepavyko ištrinti rezervacijos'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">📅 Mano rezervacijos</h1>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition duration-200 font-semibold"
            >
              + Nauja rezervacija
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {refreshing && !loading && (
          <div className="mb-4">
            <p className="text-sm text-gray-500">Atnaujinama...</p>
          </div>
        )}
        {loading && bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Kraunama...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Dar neturite rezervacijų
            </h3>
            <p className="text-gray-600 mb-6">
              Sukurkite pirmąją rezervaciją!
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition duration-200 font-semibold"
            >
              Sukurti rezervaciją
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={handleCancel}
                onEditRejected={(target) => setEditingBooking(target)}
                onResubmit={handleResubmit}
                onDeleteRejected={handleDeleteRejected}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Booking Modal */}
      {showModal && (
        <CreateBookingModal
          onClose={() => {
            setShowModal(false);
            const next = new URLSearchParams(searchParams);
            next.delete('sitterProfileId');
            setSearchParams(next, { replace: true });
          }}
          onSuccess={() => {
            setShowModal(false);
            loadBookings({ silent: true });

            const next = new URLSearchParams(searchParams);
            next.delete('sitterProfileId');
            setSearchParams(next, { replace: true });
          }}
          prefillSitterProfileId={prefillSitterProfileId}
        />
      )}

      {editingBooking && (
        <EditRejectedBookingModal
          booking={editingBooking}
          onClose={() => setEditingBooking(null)}
          onSuccess={() => {
            setEditingBooking(null);
            loadBookings({ silent: true });
          }}
        />
      )}
    </div>
  );
}

function BookingCard({
  booking,
  onCancel,
  onEditRejected,
  onResubmit,
  onDeleteRejected,
}: {
  booking: Visit;
  onCancel: (id: string) => void;
  onEditRejected: (booking: Visit) => void;
  onResubmit: (id: string) => void;
  onDeleteRejected: (id: string) => void;
}) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('lt-LT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('lt-LT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const petsLabel = booking.pets?.length
    ? booking.pets.map((pet) => pet.name).join(', ')
    : 'Nežinomas';

  const canCancel = booking.status === 'PENDING' || booking.status === 'ACCEPTED';
  const canEditRejected = booking.status === 'REJECTED';

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-gray-900">
              {booking.sitter?.user?.name || 'Prižiūrėtojas'}
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
              {getStatusLabel(booking.status)}
            </span>
          </div>
          <p className="text-gray-600">🐾 Augintinys: {petsLabel}</p>
          <p className="text-gray-600">📍 Adresas: {booking.address}</p>
        </div>
        {canCancel && (
          <button
            onClick={() => onCancel(booking.id)}
            className="text-red-500 hover:text-red-700 transition text-sm font-semibold"
          >
            Atšaukti
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Data:</p>
          <p className="font-semibold">{formatDate(booking.date)}</p>
        </div>
        <div>
          <p className="text-gray-500">Laikas:</p>
          <p className="font-semibold">{booking.timeStart} - {booking.timeEnd}</p>
        </div>
        <div>
          <p className="text-gray-500">Kaina:</p>
          <p className="font-semibold">€{booking.totalPrice}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <p className="text-sm text-gray-500">Pateikta:</p>
        <p className="text-gray-700">{formatDateTime(booking.createdAt)}</p>
      </div>

      {booking.notesForSitter && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-500">Pastabos:</p>
          <p className="text-gray-700">{booking.notesForSitter}</p>
        </div>
      )}

      {booking.status === 'REJECTED' && booking.rejectionReason && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-500">Atmetimo priežastis:</p>
          <p className="text-gray-700">{booking.rejectionReason}</p>
        </div>
      )}

      {booking.sitter?.user?.phone && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-500">Kontaktas:</p>
          <p className="text-gray-700">📞 {booking.sitter.user.phone}</p>
        </div>
      )}

      {canEditRejected && (
        <div className="mt-4 pt-4 border-t flex gap-3">
          <button
            type="button"
            onClick={() => onEditRejected(booking)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
          >
            Redaguoti
          </button>
          <button
            type="button"
            onClick={() => onResubmit(booking.id)}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
          >
            Pateikti iš naujo
          </button>
          <button
            type="button"
            onClick={() => onDeleteRejected(booking.id)}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
          >
            Ištrinti
          </button>
        </div>
      )}
    </div>
  );
}

function EditRejectedBookingModal({
  booking,
  onClose,
  onSuccess,
}: {
  booking: Visit;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const initialPetIds = booking.pets?.map((pet) => pet.id) ?? [];
  const initialDate = booking.date ? booking.date.slice(0, 10) : '';
  const [isDateToManuallyEdited, setIsDateToManuallyEdited] = useState(false);
  const [formData, setFormData] = useState({
    petIds: initialPetIds,
    address: booking.address ?? '',
    dateFrom: initialDate,
    dateTo: initialDate,
    timeStart: booking.timeStart ?? '09:00',
    timeEnd: booking.timeEnd ?? '17:00',
    totalPrice: typeof booking.totalPrice === 'number' ? booking.totalPrice : 0,
    notesForSitter: booking.notesForSitter ?? '',
  });

  const parseTimeToMinutes = (time: string) => {
    const [hh, mm] = time.split(':').map((n) => Number(n));
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return NaN;
    return hh * 60 + mm;
  };

  const parseDateToUtc = (date: string) => {
    return new Date(`${date}T00:00:00.000Z`);
  };

  const getDaysCount = () => {
    const from = parseDateToUtc(formData.dateFrom);
    const to = parseDateToUtc(formData.dateTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
    const diffDays = Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays + 1 : 0;
  };

  const getDateError = () => {
    const from = parseDateToUtc(formData.dateFrom);
    const to = parseDateToUtc(formData.dateTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return 'Neteisinga data';
    }
    if (to.getTime() < from.getTime()) {
      return 'Data iki turi būti ne ankstesnė nei data nuo';
    }
    if (from.getTime() !== to.getTime()) {
      return 'Redagavimas palaiko tik 1 dieną (data nuo turi sutapti su data iki)';
    }
    return '';
  };

  const getTimeError = () => {
    const startMinutes = parseTimeToMinutes(formData.timeStart);
    const endMinutes = parseTimeToMinutes(formData.timeEnd);
    if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) {
      return 'Neteisingas laikas';
    }
    if (endMinutes <= startMinutes) {
      return 'Pabaiga turi būti vėliau nei pradžia';
    }
    return '';
  };

  const timeError = getTimeError();
  const dateError = getDateError();
  const daysCount = getDaysCount();

  useEffect(() => {
    const loadPets = async () => {
      try {
        const petsData = await petService.getAll();
        setPets(petsData);
      } catch {
        setError('Nepavyko užkrauti augintinių');
      }
    };

    void loadPets();
  }, []);

  const handleSubmit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    setError('');

    if (formData.petIds.length === 0) {
      const errorMsg = 'Pasirinkite bent vieną augintinį';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (timeError) {
      setError(timeError);
      toast.error(timeError);
      return;
    }

    if (dateError) {
      setError(dateError);
      toast.error(dateError);
      return;
    }

    try {
      setLoading(true);
      await bookingService.updateRejectedBooking(booking.id, {
        petIds: formData.petIds,
        address: formData.address,
        date: formData.dateFrom,
        timeStart: formData.timeStart,
        timeEnd: formData.timeEnd,
        totalPrice: formData.totalPrice,
        notesForSitter: formData.notesForSitter || undefined,
      });
      toast.success('Rezervacija atnaujinta');
      onSuccess();
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Nepavyko atnaujinti rezervacijos');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Redaguoti rezervaciją</h2>
            <button
              type="button"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Augintinys *
              </label>
              <div className="space-y-2">
                {pets.map((pet) => {
                  const checked = formData.petIds.includes(pet.id);
                  return (
                    <label key={pet.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(changeEvent) => {
                          const nextChecked = changeEvent.target.checked;
                          setFormData((prev) => ({
                            ...prev,
                            petIds: nextChecked
                              ? Array.from(new Set([...prev.petIds, pet.id]))
                              : prev.petIds.filter((id) => id !== pet.id),
                          }));
                        }}
                        className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span>{pet.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresas *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(changeEvent) => setFormData({ ...formData, address: changeEvent.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data nuo *
              </label>
              <input
                type="date"
                required
                value={formData.dateFrom}
                onChange={(changeEvent) => {
                  const nextDateFrom = changeEvent.target.value;
                  setIsDateToManuallyEdited(false);
                  setFormData((prev) => ({
                    ...prev,
                    dateFrom: nextDateFrom,
                    dateTo: isDateToManuallyEdited ? prev.dateTo : nextDateFrom,
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data iki *
              </label>
              <input
                type="date"
                required
                value={formData.dateTo}
                onChange={(changeEvent) => {
                  setIsDateToManuallyEdited(true);
                  setFormData({ ...formData, dateTo: changeEvent.target.value });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Dienos: {daysCount > 0 ? daysCount : '-'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pradžia *
                </label>
                <input
                  type="time"
                  required
                  value={formData.timeStart}
                  onChange={(changeEvent) => setFormData({ ...formData, timeStart: changeEvent.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pabaiga *
                </label>
                <input
                  type="time"
                  required
                  value={formData.timeEnd}
                  onChange={(changeEvent) => setFormData({ ...formData, timeEnd: changeEvent.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {timeError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{timeError}</p>
              </div>
            )}

            {dateError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{dateError}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kaina (€) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.totalPrice}
                onChange={(changeEvent) => {
                  setFormData({
                    ...formData,
                    totalPrice: Number.isFinite(Number(changeEvent.target.value))
                      ? parseFloat(changeEvent.target.value)
                      : 0,
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pastabos prižiūrėtojui
              </label>
              <textarea
                rows={3}
                value={formData.notesForSitter}
                onChange={(changeEvent) => setFormData({ ...formData, notesForSitter: changeEvent.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

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
                disabled={loading || !!timeError || !!dateError}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition font-semibold"
              >
                {loading ? 'Saugoma...' : 'Išsaugoti'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function CreateBookingModal({
  onClose,
  onSuccess,
  prefillSitterProfileId,
}: {
  onClose: () => void;
  onSuccess: () => void;
  prefillSitterProfileId?: string;
}) {
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [sitters, setSitters] = useState<SitterProfile[]>([]);
  const [isPriceManuallyEdited, setIsPriceManuallyEdited] = useState(false);
  const [isSitterSelectorOpen, setIsSitterSelectorOpen] = useState(!prefillSitterProfileId);
  const today = new Date().toISOString().slice(0, 10);
  const [formData, setFormData] = useState({
    petIds: [] as string[],
    sitterProfileId: prefillSitterProfileId ?? '',
    address: '',
    dateFrom: today,
    dateTo: today,
    timeStart: '09:00',
    timeEnd: '17:00',
    totalPrice: 0,
    notesForSitter: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const selectedSitter = sitters.find((s) => s.id === formData.sitterProfileId);

  const parseTimeToMinutes = (time: string) => {
    const [hh, mm] = time.split(':').map((n) => Number(n));
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return NaN;
    return hh * 60 + mm;
  };

  const parseDateToUtc = (date: string) => {
    // date is YYYY-MM-DD
    return new Date(`${date}T00:00:00.000Z`);
  };

  const getDaysCount = () => {
    const from = parseDateToUtc(formData.dateFrom);
    const to = parseDateToUtc(formData.dateTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
    const diffDays = Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays + 1 : 0;
  };

  const getDateError = () => {
    const from = parseDateToUtc(formData.dateFrom);
    const to = parseDateToUtc(formData.dateTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return 'Neteisinga data';
    }
    if (to.getTime() < from.getTime()) {
      return 'Data iki turi būti ne ankstesnė nei data nuo';
    }
    return '';
  };

  const getTimeError = () => {
    const startMinutes = parseTimeToMinutes(formData.timeStart);
    const endMinutes = parseTimeToMinutes(formData.timeEnd);
    if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) {
      return 'Neteisingas laikas';
    }
    if (endMinutes <= startMinutes) {
      return 'Pabaiga turi būti vėliau nei pradžia';
    }
    return '';
  };

  const getSuggestedTotalPrice = () => {
    if (!selectedSitter) return null;
    const daysCount = getDaysCount();
    if (daysCount <= 0) return null;
    const startMinutes = parseTimeToMinutes(formData.timeStart);
    const endMinutes = parseTimeToMinutes(formData.timeEnd);
    if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) return null;
    const minutes = endMinutes - startMinutes;
    if (minutes <= 0) return null;

    const hours = minutes / 60;
    const hourlyRate = Number(selectedSitter.hourlyRate);
    if (!Number.isFinite(hourlyRate)) return null;

    return Math.round(hourlyRate * hours * daysCount * 100) / 100;
  };

  const timeError = getTimeError();
  const dateError = getDateError();
  const daysCount = getDaysCount();
  const suggestedTotalPrice = getSuggestedTotalPrice();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [petsData, sittersData] = await Promise.all([
          petService.getAll(),
          sitterService.getAll(),
        ]);
        setPets(petsData);
        setSitters(sittersData);

        if (!prefillSitterProfileId && sittersData.length === 1) {
          setIsSitterSelectorOpen(false);
        }

        if (prefillSitterProfileId && !sittersData.some((s) => s.id === prefillSitterProfileId)) {
          setError('Prižiūrėtojas nerastas');
        }

        setFormData((prev) => {
          const nextSitterProfileId =
            prev.sitterProfileId ||
            prefillSitterProfileId ||
            (sittersData.length === 1 ? sittersData[0].id : '');

          return {
            ...prev,
            sitterProfileId: nextSitterProfileId,
            petIds: petsData.map((pet) => pet.id),
          };
        });
      } catch {
        setError('Nepavyko užkrauti duomenų');
      }
    };

    try {
      void loadData();
    } catch {
      // no-op
    }
  }, [prefillSitterProfileId]);

  useEffect(() => {
    if (isPriceManuallyEdited) return;
    if (!suggestedTotalPrice) return;
    if (timeError) return;
    if (dateError) return;

    setFormData((prev) => ({
      ...prev,
      totalPrice: suggestedTotalPrice,
    }));
  }, [isPriceManuallyEdited, suggestedTotalPrice, timeError, dateError]);

  useEffect(() => {
    if (!prefillSitterProfileId) return;
    setFormData((prev) => ({
      ...prev,
      sitterProfileId: prefillSitterProfileId,
    }));
  }, [prefillSitterProfileId]);

  const handleSubmit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    setError('');
    setLoading(true);

    if (formData.petIds.length === 0) {
      setLoading(false);
      const errorMsg = 'Pasirinkite bent vieną augintinį';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (dateError) {
      setLoading(false);
      setError(dateError);
      toast.error(dateError);
      return;
    }

    if (timeError) {
      setLoading(false);
      setError(timeError);
      toast.error(timeError);
      return;
    }

    if (daysCount <= 0) {
      setLoading(false);
      const errorMsg = 'Pasirinkite teisingą datų intervalą';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      const from = parseDateToUtc(formData.dateFrom);

      const dailyPrice = Math.round((formData.totalPrice / daysCount) * 100) / 100;

      const createPromises: Promise<unknown>[] = [];
      for (let i = 0; i < daysCount; i += 1) {
        const date = new Date(from);
        date.setUTCDate(from.getUTCDate() + i);
        const dateIso = date.toISOString().slice(0, 10);

        createPromises.push(
          bookingService.createBooking({
            sitterProfileId: formData.sitterProfileId,
            petIds: formData.petIds,
            address: formData.address,
            date: dateIso,
            timeStart: formData.timeStart,
            timeEnd: formData.timeEnd,
            totalPrice: dailyPrice,
            notesForSitter: formData.notesForSitter || undefined,
          }),
        );
      }

      await Promise.all(createPromises);
      toast.success(`Rezervacija sėkmingai sukurta! (${daysCount} d.)`);
      onSuccess();
    } catch (err: unknown) {
      const errorMsg = getApiErrorMessage(err, 'Nepavyko sukurti rezervacijos');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Nauja rezervacija</h2>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Augintinys *
              </label>
              {pets.length > 0 && (
                <p className="text-xs text-gray-500 mb-2">
                  Pasirinkta: {formData.petIds.length}
                </p>
              )}
              <div className="space-y-2">
                {pets.length === 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Neturite augintinių. Pirma pridėkite augintinį.</p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate('/pets');
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-semibold"
                    >
                      + Pridėti augintinį
                    </button>
                  </div>
                ) : (
                  pets.map((pet) => {
                    const checked = formData.petIds.includes(pet.id);
                    return (
                      <label key={pet.id} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(changeEvent) => {
                            const nextChecked = changeEvent.target.checked;
                            setFormData((prev) => ({
                              ...prev,
                              petIds: nextChecked
                                ? Array.from(new Set([...prev.petIds, pet.id]))
                                : prev.petIds.filter((id) => id !== pet.id),
                            }));
                          }}
                          className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span>{pet.name}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prižiūrėtojas *
              </label>
              {selectedSitter && !isSitterSelectorOpen ? (
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {selectedSitter.user?.name || 'Prižiūrėtojas'}
                      </p>
                      <p className="text-xs text-gray-600">
                        €{selectedSitter.hourlyRate}/val  {selectedSitter.city}
                      </p>
                      {prefillSitterProfileId && (
                        <p className="text-xs text-gray-500 mt-1">Parinkta iš profilio</p>
                      )}
                      {!prefillSitterProfileId && sitters.length === 1 && (
                        <p className="text-xs text-gray-500 mt-1">Automatiškai parinktas vienintelis atitikmuo</p>
                      )}
                    </div>
                    {sitters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setIsSitterSelectorOpen(true)}
                        className="shrink-0 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
                      >
                        Keisti
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    required
                    value={formData.sitterProfileId}
                    onChange={(changeEvent) => {
                      setIsPriceManuallyEdited(false);
                      setFormData({
                        ...formData,
                        sitterProfileId: changeEvent.target.value,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Pasirinkite prižiūrėtoją</option>
                    {sitters.map((sitter) => (
                      <option key={sitter.id} value={sitter.id}>
                        {sitter.user?.name} - €{sitter.hourlyRate}/val ({sitter.city})
                      </option>
                    ))}
                  </select>
                  {selectedSitter && sitters.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setIsSitterSelectorOpen(false)}
                      className="w-full px-3 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      Palikti pasirinktą
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresas *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(changeEvent) => setFormData({ ...formData, address: changeEvent.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Gatvė 123, Vilnius"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data (nuo - iki) *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Nuo</label>
                  <input
                    type="date"
                    required
                    value={formData.dateFrom}
                    onChange={(changeEvent) => {
                      setIsPriceManuallyEdited(false);
                      setFormData({
                        ...formData,
                        dateFrom: changeEvent.target.value,
                        dateTo: changeEvent.target.value,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Iki</label>
                  <input
                    type="date"
                    required
                    value={formData.dateTo}
                    onChange={(changeEvent) => {
                      setIsPriceManuallyEdited(false);
                      setFormData({ ...formData, dateTo: changeEvent.target.value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              {daysCount > 0 && (
                <p className="text-xs text-gray-500 mt-2">Dienų skaičius: {daysCount}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pradžia *
                </label>
                <input
                  type="time"
                  required
                  value={formData.timeStart}
                  onChange={(changeEvent) => {
                    setIsPriceManuallyEdited(false);
                    setFormData({ ...formData, timeStart: changeEvent.target.value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pabaiga *
                </label>
                <input
                  type="time"
                  required
                  value={formData.timeEnd}
                  onChange={(changeEvent) => {
                    setIsPriceManuallyEdited(false);
                    setFormData({ ...formData, timeEnd: changeEvent.target.value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {timeError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{timeError}</p>
              </div>
            )}

            {dateError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{dateError}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bendra kaina (€) *
              </label>
              {suggestedTotalPrice !== null && (
                <p className="text-xs text-gray-500 mb-2">
                  Siūloma kaina: €{suggestedTotalPrice}
                </p>
              )}
              <input
                type="number"
                required
                min="0"
                step="0.5"
                value={formData.totalPrice}
                onChange={(changeEvent) => {
                  setIsPriceManuallyEdited(true);
                  setFormData({
                    ...formData,
                    totalPrice: Number.isFinite(Number(changeEvent.target.value))
                      ? parseFloat(changeEvent.target.value)
                      : 0,
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pastabos prižiūrėtojui
              </label>
              <textarea
                rows={3}
                value={formData.notesForSitter}
                onChange={(changeEvent) => setFormData({ ...formData, notesForSitter: changeEvent.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Papildoma informacija prižiūrėtojui..."
              />
            </div>

            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <p className="text-sm font-semibold text-gray-900 mb-2">Suvestinė</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                <div>
                  <p className="text-gray-500">Augintiniai</p>
                  <p className="font-semibold">{formData.petIds.length}</p>
                </div>
                <div>
                  <p className="text-gray-500">Dienos</p>
                  <p className="font-semibold">{daysCount > 0 ? daysCount : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Laikas</p>
                  <p className="font-semibold">{formData.timeStart} - {formData.timeEnd}</p>
                </div>
                <div>
                  <p className="text-gray-500">Kaina</p>
                  <p className="font-semibold">€{formData.totalPrice}</p>
                </div>
              </div>
            </div>

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
                disabled={loading || !!timeError || !!dateError}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition font-semibold"
              >
                {loading ? 'Kuriama...' : 'Sukurti'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
