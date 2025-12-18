import { useCallback, useEffect, useRef, useState } from 'react';
import { AVAILABLE_SERVICES, getServiceLabel, sitterService } from '../services/sitter.service';
import { getApiErrorMessage } from '../utils/apiError';
import { useToast } from '../hooks/useToast';
import type { CreateSitterProfileData, SitterProfile } from '../services/sitter.service';

export default function SitterProfileSection() {
  const toast = useToast();

  const [profile, setProfile] = useState<SitterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileExists, setProfileExists] = useState<boolean | null>(null);
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

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const hasUserInteractedRef = useRef(false);
  const lastSavedToastAtRef = useRef(0);
  const savedStatusTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await sitterService.getMyProfile();
      setProfile(data);
      setProfileExists(true);
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
        setProfile(null);
        setProfileExists(false);
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

  const normalizeServices = (services?: string[]) => {
    return [...(services ?? [])].sort();
  };

  const cityValue = formData.city.trim();
  const addressValue = (formData.address ?? '').trim();
  const bioValue = (formData.bio ?? '').trim();
  const hourlyRateValue = Number(formData.hourlyRate);
  const maxPetsValue = Number(formData.maxPets ?? 1);
  const experienceYearsValue = Number(formData.experienceYears ?? 0);
  const servicesValue = normalizeServices(formData.services);
  const servicesKey = servicesValue.join('|');

  const canSave =
    cityValue.length >= 2 &&
    Number.isFinite(hourlyRateValue) &&
    hourlyRateValue >= 0 &&
    Number.isFinite(maxPetsValue) &&
    maxPetsValue >= 1 &&
    Number.isFinite(experienceYearsValue) &&
    experienceYearsValue >= 0;

  const profileCity = (profile?.city ?? '').trim();
  const profileAddress = (profile?.address ?? '').trim();
  const profileBio = (profile?.bio ?? '').trim();
  const profileHourlyRate = Number(profile?.hourlyRate ?? 0);
  const profileMaxPets = Number(profile?.maxPets ?? 1);
  const profileExperienceYears = Number(profile?.experienceYears ?? 0);
  const profileServicesKey = normalizeServices(profile?.services).join('|');

  const unchanged =
    cityValue === profileCity &&
    addressValue === profileAddress &&
    bioValue === profileBio &&
    hourlyRateValue === profileHourlyRate &&
    maxPetsValue === profileMaxPets &&
    experienceYearsValue === profileExperienceYears &&
    servicesKey === profileServicesKey;

  useEffect(() => {
    if (profileExists === null) return;
    if (!canSave) return;
    if (unchanged) return;
    if (!hasUserInteractedRef.current) return;

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const payload: CreateSitterProfileData = {
          city: cityValue,
          address: addressValue || undefined,
          hourlyRate: hourlyRateValue,
          bio: bioValue || undefined,
          services: servicesValue,
          maxPets: maxPetsValue,
          experienceYears: experienceYearsValue,
        };

        const nextProfile = profileExists
          ? await sitterService.updateProfile(payload)
          : await sitterService.createProfile(payload);

        setProfile(nextProfile);
        setProfileExists(true);
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
        setError(getApiErrorMessage(err, 'Klaida išsaugant profilį'));
      } finally {
        setLoading(false);
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [
    addressValue,
    bioValue,
    canSave,
    cityValue,
    experienceYearsValue,
    hourlyRateValue,
    maxPetsValue,
    profileExists,
    servicesKey,
    servicesValue,
    toast,
    unchanged,
  ]);

  const handleServiceToggle = (service: string) => {
    const services = formData.services || [];
    hasUserInteractedRef.current = true;
    if (savedStatusTimerRef.current) {
      window.clearTimeout(savedStatusTimerRef.current);
      savedStatusTimerRef.current = null;
    }
    setSaveStatus('saving');
    setError('');

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

  if (loading && profileExists === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Kraunama...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Prižiūrėtojo profilis</h2>
          <p className="text-gray-600 mt-1">Ši informacija bus matoma jūsų viešame profilyje</p>
        </div>
        <div className="text-sm text-gray-600 text-right">
          {!unchanged && saveStatus === 'saving' && 'Saugoma...'}
          {unchanged ? '' : saveStatus === 'saved' ? 'Išsaugota' : ''}
          {saveStatus === 'error' && 'Klaida'}
        </div>
      </div>

      {!canSave && (
        <div className="mb-6 text-sm text-gray-500">
          Užpildykite miestą ir įkainį (įkainis turi būti 0 arba daugiau)
        </div>
      )}

      {profileExists === false && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Prižiūrėtojo profilis bus sukurtas automatiškai, kai pradėsite pildyti ir sistema išsaugos pakeitimus.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Miestas *
          </label>
          <input
            type="text"
            required
            value={formData.city}
            onChange={(changeEvent) => {
              hasUserInteractedRef.current = true;
              if (savedStatusTimerRef.current) {
                window.clearTimeout(savedStatusTimerRef.current);
                savedStatusTimerRef.current = null;
              }
              setFormData({ ...formData, city: changeEvent.target.value });
              setSaveStatus('saving');
              setError('');
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Vilnius"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adresas
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(changeEvent) => {
              hasUserInteractedRef.current = true;
              if (savedStatusTimerRef.current) {
                window.clearTimeout(savedStatusTimerRef.current);
                savedStatusTimerRef.current = null;
              }
              setFormData({ ...formData, address: changeEvent.target.value });
              setSaveStatus('saving');
              setError('');
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="(nebūtina)"
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
            onChange={(changeEvent) => {
              hasUserInteractedRef.current = true;
              if (savedStatusTimerRef.current) {
                window.clearTimeout(savedStatusTimerRef.current);
                savedStatusTimerRef.current = null;
              }
              setFormData({ ...formData, hourlyRate: parseFloat(changeEvent.target.value) });
              setSaveStatus('saving');
              setError('');
            }}
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
            onChange={(bioChange) => {
              hasUserInteractedRef.current = true;
              if (savedStatusTimerRef.current) {
                window.clearTimeout(savedStatusTimerRef.current);
                savedStatusTimerRef.current = null;
              }
              setFormData({ ...formData, bio: bioChange.target.value });
              setSaveStatus('saving');
              setError('');
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Papasakokite apie save ir savo patirtį..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Paslaugos
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_SERVICES.map((service) => {
              const selected = Boolean(formData.services?.includes(service));
              return (
                <button
                  key={service}
                  type="button"
                  onClick={() => handleServiceToggle(service)}
                  className={
                    selected
                      ? 'px-3 py-2 rounded-full bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition'
                      : 'px-3 py-2 rounded-full bg-gray-100 text-gray-800 text-sm font-semibold hover:bg-gray-200 transition'
                  }
                >
                  {getServiceLabel(service)}
                </button>
              );
            })}
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
              onChange={(changeEvent) => {
                hasUserInteractedRef.current = true;
                if (savedStatusTimerRef.current) {
                  window.clearTimeout(savedStatusTimerRef.current);
                  savedStatusTimerRef.current = null;
                }
                setFormData({ ...formData, experienceYears: parseInt(changeEvent.target.value) });
                setSaveStatus('saving');
                setError('');
              }}
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
              onChange={(changeEvent) => {
                hasUserInteractedRef.current = true;
                if (savedStatusTimerRef.current) {
                  window.clearTimeout(savedStatusTimerRef.current);
                  savedStatusTimerRef.current = null;
                }
                setFormData({ ...formData, maxPets: parseInt(changeEvent.target.value) });
                setSaveStatus('saving');
                setError('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {profile && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Reitingas</p>
                <p className="text-xl">⭐ {profile.avgRating.toFixed(1)} ({profile.totalReviews} atsiliepimai)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
