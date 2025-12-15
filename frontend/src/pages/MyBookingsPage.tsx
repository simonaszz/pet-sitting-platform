import { useState, useEffect } from 'react';
import { bookingService, getStatusLabel, getStatusColor } from '../services/booking.service';
import { petService } from '../services/pet.service';
import { sitterService } from '../services/sitter.service';
import { useToast } from '../hooks/useToast';
import type { Visit } from '../services/booking.service';
import type { Pet } from '../services/pet.service';
import type { SitterProfile } from '../services/sitter.service';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getMyBookings();
      setBookings(data);
    } catch (err) {
      toast.error('Nepavyko užkrauti rezervacijų');
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Ar tikrai norite atšaukti šią rezervaciją?')) return;

    try {
      await bookingService.cancelBooking(id);
      toast.success('Rezervacija atšaukta');
      await loadBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Nepavyko atšaukti rezervacijos');
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
        {loading ? (
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
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Booking Modal */}
      {showModal && (
        <CreateBookingModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadBookings();
          }}
        />
      )}
    </div>
  );
}

function BookingCard({ booking, onCancel }: { booking: Visit; onCancel: (id: string) => void }) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('lt-LT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const canCancel = booking.status === 'PENDING' || booking.status === 'ACCEPTED';

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-gray-900">
              {booking.sitter?.user?.name || 'Priežiūrėtojas'}
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
              {getStatusLabel(booking.status)}
            </span>
          </div>
          <p className="text-gray-600">🐾 Augintinys: {booking.pet?.name || 'Nežinomas'}</p>
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

      {booking.notesForSitter && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-500">Pastabos:</p>
          <p className="text-gray-700">{booking.notesForSitter}</p>
        </div>
      )}

      {booking.sitter?.user?.phone && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-500">Kontaktas:</p>
          <p className="text-gray-700">📞 {booking.sitter.user.phone}</p>
        </div>
      )}
    </div>
  );
}

function CreateBookingModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [sitters, setSitters] = useState<SitterProfile[]>([]);
  const [formData, setFormData] = useState({
    petId: '',
    sitterProfileId: '',
    address: '',
    date: '',
    timeStart: '09:00',
    timeEnd: '17:00',
    totalPrice: 0,
    notesForSitter: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [petsData, sittersData] = await Promise.all([
        petService.getAll(),
        sitterService.getAll(),
      ]);
      setPets(petsData);
      setSitters(sittersData);
    } catch (err) {
      setError('Nepavyko užkrauti duomenų');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await bookingService.createBooking(formData);
      toast.success('Rezervacija sėkmingai sukurta!');
      onSuccess();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Nepavyko sukurti rezervacijos';
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
              <select
                required
                value={formData.petId}
                onChange={(e) => setFormData({ ...formData, petId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Pasirinkite augintinį</option>
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priežiūrėtojas *
              </label>
              <select
                required
                value={formData.sitterProfileId}
                onChange={(e) => setFormData({ ...formData, sitterProfileId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Pasirinkite priežiūrėtoją</option>
                {sitters.map((sitter) => (
                  <option key={sitter.id} value={sitter.id}>
                    {sitter.user?.name} - €{sitter.hourlyRate}/val ({sitter.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresas *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Gatvė 123, Vilnius"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
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
                  onChange={(e) => setFormData({ ...formData, timeStart: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, timeEnd: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bendra kaina (€) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.5"
                value={formData.totalPrice}
                onChange={(e) => setFormData({ ...formData, totalPrice: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pastabos priežiūrėtojui
              </label>
              <textarea
                rows={3}
                value={formData.notesForSitter}
                onChange={(e) => setFormData({ ...formData, notesForSitter: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Papildoma informacija..."
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
                disabled={loading}
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
