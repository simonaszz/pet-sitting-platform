import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { bookingService, getStatusLabel, getStatusColor } from '../services/booking.service';
import { petService } from '../services/pet.service';
import { useToast } from '../hooks/useToast';
import { getApiErrorMessage } from '../utils/apiError';
import type { Visit } from '../services/booking.service';
import type { Pet } from '../services/pet.service';

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      navigate(`/bookings/new?sitterProfileId=${encodeURIComponent(prefillSitterProfileId)}`);

      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.delete('sitterProfileId');
      setSearchParams(nextSearchParams, { replace: true });
    }
  }, [navigate, prefillSitterProfileId, searchParams, setSearchParams]);

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
      <PageHeader
        title="📅 Mano rezervacijos"
        right={(
          <button
            onClick={() => navigate('/bookings/new')}
            className="px-4 py-2 bg-white text-purple-700 rounded-lg shadow hover:bg-purple-50 active:bg-purple-100 active:scale-[0.98] active:opacity-90 transition duration-200 font-semibold"
          >
            + Nauja rezervacija
          </button>
        )}
      />

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
              onClick={() => navigate('/bookings/new')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 active:opacity-90 active:scale-[0.98] transition duration-200 font-semibold"
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

      {editingBooking && (
        <EditRejectedBookingModal
          booking={editingBooking}
          onClose={() => {
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

  const servicesLabel = (booking.services ?? [])
    .map((service) => {
      if (service === 'FEEDING') return 'Pamaitinti';
      if (service === 'LITTER') return 'Kraikas';
      if (service === 'WALKING') return 'Pavedžioti';
      return service;
    })
    .join(', ');

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
          <p className="text-gray-600">🐾 Augintinis: {petsLabel}</p>
          <p className="text-gray-600">📍 Adresas: {booking.address}</p>
        </div>
        {canCancel && (
          <button
            onClick={() => onCancel(booking.id)}
            className="text-red-500 hover:text-red-700 active:text-red-800 transition text-sm font-semibold"
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

      {(booking.task || servicesLabel) && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-500">Vizito užduotis:</p>
          {booking.task ? (
            <p className="text-gray-700 whitespace-pre-wrap">{booking.task}</p>
          ) : (
            <p className="text-gray-700">{servicesLabel}</p>
          )}
        </div>
      )}

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
        <div className="mt-4 pt-4 border-t">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => onEditRejected(booking)}
              className="w-full sm:flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 active:scale-[0.98] active:opacity-90 transition font-semibold"
            >
              Redaguoti
            </button>
            <div className="w-full sm:flex-1 flex gap-3">
              <button
                type="button"
                onClick={() => onResubmit(booking.id)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 active:scale-[0.98] active:opacity-90 transition font-semibold"
              >
                Pateikti iš naujo
              </button>
              <button
                type="button"
                onClick={() => onDeleteRejected(booking.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 active:scale-[0.98] active:opacity-90 transition font-semibold"
              >
                Ištrinti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditRejectedBookingModal({
  booking,
  onClose,
}: {
  booking: Visit;
  onClose: () => void;
}) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const toast = useToast();

  const hasUserInteractedRef = useRef(false);
  const lastSavedToastAtRef = useRef(0);
  const savedStatusTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const lastSavedSnapshotRef = useRef<string>('');
  const autoSaveDebounceTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const initialPetIds = useMemo(() => booking.pets?.map((pet) => pet.id) ?? [], [booking.pets]);
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
    const [hoursPart, minutesPart] = time.split(':').map((part) => Number(part));
    if (!Number.isFinite(hoursPart) || !Number.isFinite(minutesPart)) return NaN;
    return hoursPart * 60 + minutesPart;
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

  const getSnapshot = useCallback(
    (data: typeof formData) =>
      JSON.stringify({
        petIds: [...data.petIds].sort(),
        address: data.address,
        dateFrom: data.dateFrom,
        dateTo: data.dateTo,
        timeStart: data.timeStart,
        timeEnd: data.timeEnd,
        totalPrice: data.totalPrice,
        notesForSitter: data.notesForSitter,
      }),
    [],
  );

  const snapshotNow = getSnapshot(formData);
  const unchanged = snapshotNow === lastSavedSnapshotRef.current;
  const canAutoSave =
    formData.petIds.length > 0 &&
    Boolean(formData.address.trim()) &&
    Boolean(formData.dateFrom) &&
    Boolean(formData.dateTo) &&
    Boolean(formData.timeStart) &&
    Boolean(formData.timeEnd) &&
    !timeError &&
    !dateError;

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

  useEffect(() => {
    lastSavedSnapshotRef.current = getSnapshot({
      petIds: initialPetIds,
      address: booking.address ?? '',
      dateFrom: initialDate,
      dateTo: initialDate,
      timeStart: booking.timeStart ?? '09:00',
      timeEnd: booking.timeEnd ?? '17:00',
      totalPrice: typeof booking.totalPrice === 'number' ? booking.totalPrice : 0,
      notesForSitter: booking.notesForSitter ?? '',
    });
  }, [booking.address, booking.notesForSitter, booking.timeEnd, booking.timeStart, booking.totalPrice, getSnapshot, initialDate, initialPetIds]);

  const saveNow = useCallback(
    async (payload: typeof formData) => {
      setLoading(true);
      setError('');

      try {
        await bookingService.updateRejectedBooking(booking.id, {
          petIds: payload.petIds,
          address: payload.address,
          date: payload.dateFrom,
          timeStart: payload.timeStart,
          timeEnd: payload.timeEnd,
          totalPrice: payload.totalPrice,
          notesForSitter: payload.notesForSitter || undefined,
        });

        lastSavedSnapshotRef.current = getSnapshot(payload);
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
        const msg = getApiErrorMessage(err, 'Nepavyko išsaugoti rezervacijos');
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [booking.id, getSnapshot, toast],
  );

  const requestClose = useCallback(() => {
    if (loading) return;
    if (hasUserInteractedRef.current && canAutoSave && !unchanged) {
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
  }, [canAutoSave, formData, loading, onClose, saveNow, unchanged]);

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
    if (!hasUserInteractedRef.current) return;
    if (!canAutoSave) return;
    if (unchanged) return;

    const timer = window.setTimeout(() => {
      void saveNow(formData);
    }, 700);
    autoSaveDebounceTimerRef.current = timer;

    return () => window.clearTimeout(timer);
  }, [canAutoSave, formData, saveNow, unchanged]);

  const markDirty = () => {
    hasUserInteractedRef.current = true;
    if (savedStatusTimerRef.current) {
      window.clearTimeout(savedStatusTimerRef.current);
      savedStatusTimerRef.current = null;
    }
    setSaveStatus('saving');
    setError('');
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
              <h2 className="text-2xl font-bold text-gray-900">Redaguoti rezervaciją</h2>
              <p className="text-sm text-gray-600 mt-1">
                {!unchanged && saveStatus === 'saving' && 'Saugoma...'}
                {!unchanged && saveStatus === 'saved' && 'Išsaugota'}
                {saveStatus === 'error' && 'Klaida'}
              </p>
            </div>
            <button
              type="button"
              onClick={requestClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 active:text-gray-700 transition disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={(submitEvent) => submitEvent.preventDefault()} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Augintinis *
              </label>
              <div className="space-y-2">
                {pets.map((pet) => {
                  const checked = formData.petIds.includes(pet.id);
                  return (
                    <label key={pet.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={loading}
                        onChange={(changeEvent) => {
                          markDirty();
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
                disabled={loading}
                value={formData.address}
                onChange={(changeEvent) => {
                  markDirty();
                  setFormData({ ...formData, address: changeEvent.target.value });
                }}
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
                disabled={loading}
                value={formData.dateFrom}
                onChange={(changeEvent) => {
                  markDirty();
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
                disabled={loading}
                value={formData.dateTo}
                onChange={(changeEvent) => {
                  markDirty();
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
                  disabled={loading}
                  value={formData.timeStart}
                  onChange={(changeEvent) => {
                    markDirty();
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
                  disabled={loading}
                  value={formData.timeEnd}
                  onChange={(changeEvent) => {
                    markDirty();
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
                Kaina (€) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                disabled={loading}
                value={formData.totalPrice}
                onChange={(changeEvent) => {
                  markDirty();
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
                disabled={loading}
                value={formData.notesForSitter}
                onChange={(changeEvent) => {
                  markDirty();
                  setFormData({ ...formData, notesForSitter: changeEvent.target.value });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={requestClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 active:scale-[0.98] active:opacity-90 transition"
              >
                Uždaryti
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

