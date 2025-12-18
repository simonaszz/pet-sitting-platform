import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import SitterProfileSection from '../components/SitterProfileSection';
import { useAuthStore } from '../store/auth.store';
import { authService } from '../services/auth.service';
import { getApiErrorMessage } from '../utils/apiError';
import { useToast } from '../hooks/useToast';

function roleHas(userRole: string | undefined, required: 'OWNER' | 'SITTER') {
  if (!userRole) return false;
  if (userRole === 'BOTH') return true;
  return userRole === required;
}

export default function MyProfilePage() {
  const { user } = useAuthStore();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const lastSavedToastAtRef = useRef(0);
  const savedStatusTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const hasUserInteractedRef = useRef(false);

  const fullName = (user?.name ?? '').trim();
  const parts = fullName.split(/\s+/).filter(Boolean);
  const initialFirstName = parts[0] ?? '';
  const initialLastName = parts.slice(1).join(' ');

  const [firstName, setFirstName] = useState(() => initialFirstName);
  const [lastName, setLastName] = useState(() => initialLastName);
  const [phone, setPhone] = useState(() => user?.phone ?? '');
  const [address, setAddress] = useState(() => user?.address ?? '');

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');

  const isOwner = roleHas(user?.role, 'OWNER');
  const isSitter = roleHas(user?.role, 'SITTER');

  const tabParam = searchParams.get('tab');
  const activeTab: 'account' | 'sitter' = tabParam === 'sitter' && isSitter ? 'sitter' : 'account';

  const switchToTab = (tab: 'account' | 'sitter') => {
    if (tab === 'account') {
      setSearchParams({});
      return;
    }

    setSearchParams({ tab: 'sitter' });
  };

  const canSave = firstName.trim().length >= 2 && lastName.trim().length >= 2;
  const nextName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const nextPhone = phone.trim();
  const nextAddress = address.trim();
  const unchanged =
    nextName === (user?.name ?? '').trim() &&
    (nextPhone || null) === (user?.phone ?? null) &&
    (nextAddress || null) === (user?.address ?? null);

  useEffect(() => {
    if (!user) return;
    if (!canSave) return;
    if (unchanged) return;
    if (!hasUserInteractedRef.current) return;

    const timer = window.setTimeout(async () => {
      try {
        await authService.updateMe({
          name: nextName,
          phone: nextPhone || undefined,
          address: nextAddress || undefined,
        });
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
        setError(getApiErrorMessage(err, 'Nepavyko atnaujinti profilio'));
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [canSave, nextAddress, nextName, nextPhone, toast, unchanged, user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="👤 Mano profilis" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-md p-8">
            <p className="text-gray-600">Kraunama...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="👤 Mano profilis"
        subtitle={isOwner && !isSitter ? 'Augintinio savininkas' : isSitter && !isOwner ? 'Augintinių prižiūrėtojas' : 'Savininkas ir prižiūrėtojas'}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md p-2 sm:p-3 mb-6">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => switchToTab('account')}
              className={
                activeTab === 'account'
                  ? 'flex-1 px-4 py-2 rounded-lg bg-purple-100 text-purple-700 font-semibold'
                  : 'flex-1 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition'
              }
            >
              Paskyra
            </button>
            {isSitter && (
              <button
                type="button"
                onClick={() => switchToTab('sitter')}
                className={
                  activeTab === 'sitter'
                    ? 'flex-1 px-4 py-2 rounded-lg bg-purple-100 text-purple-700 font-semibold'
                    : 'flex-1 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition'
                }
              >
                Prižiūrėtojo profilis
              </button>
            )}
          </div>
        </div>

        {activeTab === 'sitter' ? (
          <SitterProfileSection />
        ) : (
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Paskyros informacija</h2>

            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                {!unchanged && saveStatus === 'saving' && 'Saugoma...'}
                {unchanged ? '' : saveStatus === 'saved' ? 'Išsaugota' : ''}
                {saveStatus === 'error' && 'Klaida'}
              </div>
              {!canSave && (
                <div className="text-sm text-gray-500">
                  Įveskite vardą ir pavardę (min. 2 simboliai)
                </div>
              )}
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Vardas</p>
                <input
                  type="text"
                  value={firstName}
                  onChange={(changeEvent) => {
                    hasUserInteractedRef.current = true;
                    if (savedStatusTimerRef.current) {
                      window.clearTimeout(savedStatusTimerRef.current);
                      savedStatusTimerRef.current = null;
                    }
                    setFirstName(changeEvent.target.value);
                    setSaveStatus('saving');
                    setError('');
                  }}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pavardė</p>
                <input
                  type="text"
                  value={lastName}
                  onChange={(changeEvent) => {
                    hasUserInteractedRef.current = true;
                    if (savedStatusTimerRef.current) {
                      window.clearTimeout(savedStatusTimerRef.current);
                      savedStatusTimerRef.current = null;
                    }
                    setLastName(changeEvent.target.value);
                    setSaveStatus('saving');
                    setError('');
                  }}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tel. nr.</p>
                <input
                  type="text"
                  value={phone}
                  onChange={(changeEvent) => {
                    hasUserInteractedRef.current = true;
                    if (savedStatusTimerRef.current) {
                      window.clearTimeout(savedStatusTimerRef.current);
                      savedStatusTimerRef.current = null;
                    }
                    setPhone(changeEvent.target.value);
                    setSaveStatus('saving');
                    setError('');
                  }}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+370..."
                />
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Adresas</p>
                <input
                  type="text"
                  value={address}
                  onChange={(changeEvent) => {
                    hasUserInteractedRef.current = true;
                    if (savedStatusTimerRef.current) {
                      window.clearTimeout(savedStatusTimerRef.current);
                      savedStatusTimerRef.current = null;
                    }
                    setAddress(changeEvent.target.value);
                    setSaveStatus('saving');
                    setError('');
                  }}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Pvz. Gatvė 1, Vilnius"
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">El. paštas</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 break-all">{user?.email || '-'}</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Greiti veiksmai</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  to="/pets"
                  className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-semibold text-center"
                >
                  🐾 Mano augintiniai
                </Link>
                <Link
                  to="/bookings"
                  className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-semibold text-center"
                >
                  📅 Mano rezervacijos
                </Link>

                {isSitter && (
                  <>
                    <Link
                      to="/my-profile?tab=sitter"
                      className="px-4 py-3 bg-white text-purple-700 rounded-lg shadow hover:bg-purple-50 transition font-semibold text-center"
                    >
                      🧑‍🦰 Prižiūrėtojo profilis
                    </Link>
                    <Link
                      to="/my-jobs"
                      className="px-4 py-3 bg-white text-purple-700 rounded-lg shadow hover:bg-purple-50 transition font-semibold text-center"
                    >
                      💼 Mano darbai
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
