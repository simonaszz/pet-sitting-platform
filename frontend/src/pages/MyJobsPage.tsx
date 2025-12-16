import { useState, useEffect, useCallback } from 'react';
import { bookingService, getStatusLabel, getStatusColor, VisitStatus } from '../services/booking.service';
import { useToast } from '../hooks/useToast';
import { getApiErrorMessage } from '../utils/apiError';
import type { Visit } from '../services/booking.service';

export default function MyJobsPage() {
  const [jobs, setJobs] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingVisitId, setRejectingVisitId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const toast = useToast();

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await bookingService.getMyJobs();
      setJobs(data);
    } catch (err) {
      toast.error('Nepavyko užkrauti darbų');
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleStatusUpdate = async (id: string, status: VisitStatus) => {
    try {
      await bookingService.updateStatus(id, status);
      toast.success(`Statusas pakeistas į "${getStatusLabel(status)}"`);
      await loadJobs();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Nepavyko atnaujinti statuso'));
    }
  };

  const handleReject = async () => {
    if (!rejectingVisitId) return;
    const reason = rejectionReason.trim();
    if (!reason) {
      toast.error('Įrašykite atmetimo priežastį');
      return;
    }

    try {
      setRejectLoading(true);
      await bookingService.rejectBooking(rejectingVisitId, reason);
      toast.success('Užsakymas atmestas');
      setRejectingVisitId(null);
      setRejectionReason('');
      await loadJobs();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Nepavyko atmesti užsakymo'));
    } finally {
      setRejectLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">💼 Mano darbai</h1>
          <p className="mt-1 text-gray-600">Rezervacijos, kuriose esu prižiūrėtojas</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Kraunama...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💼</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Dar neturite darbų
            </h3>
            <p className="text-gray-600">Kai kažkas jus užsakys, pamatysite rezervacijas čia</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onStatusUpdate={handleStatusUpdate}
                onReject={(jobId) => {
                  setRejectingVisitId(jobId);
                  setRejectionReason('');
                }}
              />
            ))}
          </div>
        )}
      </div>

      {rejectingVisitId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Atmetimo priežastis</h2>
                <button
                  type="button"
                  onClick={() => {
                    setRejectingVisitId(null);
                    setRejectionReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(changeEvent) => setRejectionReason(changeEvent.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Pvz. netinkamas laikas, per mažas įkainis, per daug augintinių, ..."
              />

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingVisitId(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Atšaukti
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={rejectLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition font-semibold"
                >
                  {rejectLoading ? 'Atmetama...' : 'Atmesti'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function JobCard({
  job,
  onStatusUpdate,
  onReject,
}: {
  job: Visit;
  onStatusUpdate: (id: string, status: VisitStatus) => void;
  onReject: (id: string) => void;
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

  const petsLabel = job.pets?.length
    ? job.pets.map((pet) => pet.name).join(', ')
    : 'Nežinomas';

  const canAccept = job.status === 'PENDING';
  const canReject = job.status === 'PENDING' || job.status === 'ACCEPTED';
  const canComplete = job.status === 'ACCEPTED' || job.status === 'PAID';

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-gray-900">
              {job.owner?.name || 'Šeimininkas'}
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(job.status)}`}>
              {getStatusLabel(job.status)}
            </span>
          </div>
          <p className="text-gray-600">🐾 Augintinys: {petsLabel}</p>
          <p className="text-gray-600">📍 Adresas: {job.address}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-purple-600">€{job.totalPrice}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <p className="text-gray-500">Data:</p>
          <p className="font-semibold">{formatDate(job.date)}</p>
        </div>
        <div>
          <p className="text-gray-500">Laikas:</p>
          <p className="font-semibold">{job.timeStart} - {job.timeEnd}</p>
        </div>
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500 mb-1">Pateikta:</p>
        <p className="text-gray-700">{formatDateTime(job.createdAt)}</p>
      </div>

      {job.notesForSitter && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Pastabos nuo šeimininko:</p>
          <p className="text-gray-700">{job.notesForSitter}</p>
        </div>
      )}

      {job.owner?.phone && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Kontaktas:</p>
          <p className="text-gray-700">📞 {job.owner.phone}</p>
          {job.owner.email && (
            <p className="text-gray-700">✉️ {job.owner.email}</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        {canAccept && (
          <button
            onClick={() => onStatusUpdate(job.id, 'ACCEPTED')}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
          >
            ✓ Priimti
          </button>
        )}
        {canReject && (
          <button
            onClick={() => onReject(job.id)}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
          >
            ✕ Atmesti
          </button>
        )}
        {canComplete && (
          <button
            onClick={() => onStatusUpdate(job.id, 'COMPLETED')}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            ✓ Pažymėti kaip baigtą
          </button>
        )}
      </div>
    </div>
  );
}
