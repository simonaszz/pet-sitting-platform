import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import { lt } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import { bookingService } from '../services/booking.service';
import { petService } from '../services/pet.service';
import { sitterService } from '../services/sitter.service';
import { useToast } from '../hooks/useToast';
import { getApiErrorMessage } from '../utils/apiError';
import type { BusySlot } from '../services/booking.service';
import type { Pet } from '../services/pet.service';
import type { SitterProfile } from '../services/sitter.service';
import { useAuthStore } from '../store/auth.store';

interface TimeInterval {
  id: string;
  timeStart: string;
  timeEnd: string;
  services: {
    feeding: boolean;
    litter: boolean;
    walking: boolean;
  };
  task: string;
}

type DayStatus = 'free' | 'partial' | 'full';

const WORKING_DAY_START = '07:00';
const WORKING_DAY_END = '22:00';

const DEFAULT_INTERVAL_SERVICES = {
  feeding: true,
  litter: true,
  walking: false,
};

type VisitPresetKey = 'short' | 'walk' | 'full';

const VISIT_PRESETS: Array<{
  key: VisitPresetKey;
  label: string;
  services: TimeInterval['services'];
}> = [
  {
    key: 'short',
    label: 'Trumpas (30 min)',
    services: { feeding: true, litter: true, walking: false },
  },
  {
    key: 'walk',
    label: 'Pasivaikščiojimas (60 min)',
    services: { feeding: false, litter: false, walking: true },
  },
  {
    key: 'full',
    label: 'Pilnas (90 min)',
    services: { feeding: true, litter: true, walking: true },
  },
];

interface CreateBookingModalProps {
  onClose: () => void;
  onSuccess: () => void;
  prefillSitterProfileId?: string;
  variant?: 'modal' | 'page';
}

export default function CreateBookingModal({
  onClose,
  onSuccess,
  prefillSitterProfileId,
  variant = 'modal',
}: CreateBookingModalProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuthStore();

  const [pets, setPets] = useState<Pet[]>([]);
  const [sitters, setSitters] = useState<SitterProfile[]>([]);
  const [isPriceManuallyEdited, setIsPriceManuallyEdited] = useState(false);
  const [isSitterSelectorOpen, setIsSitterSelectorOpen] = useState(!prefillSitterProfileId);
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);
  const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
  const [busyLoading, setBusyLoading] = useState(false);
  const [busyError, setBusyError] = useState('');
  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const initialAddress = user?.address ?? '';

  const generateIntervalId = useCallback(
    () => `interval-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    [],
  );

  const [selectedDates, setSelectedDates] = useState<Date[]>([new Date()]);

  const [newVisitServices, setNewVisitServices] = useState(DEFAULT_INTERVAL_SERVICES);
  const [isNewVisitServicesAdvancedOpen, setIsNewVisitServicesAdvancedOpen] = useState(false);
  const [newVisitTaskTemplate, setNewVisitTaskTemplate] = useState('');

  const [selectedDayIntervalServicesOpenById, setSelectedDayIntervalServicesOpenById] = useState<Record<string, boolean>>({});
  const [defaultIntervalServicesOpenById, setDefaultIntervalServicesOpenById] = useState<Record<string, boolean>>({});

  const planningSectionRef = useRef<HTMLDivElement | null>(null);
  const timeIntervalsSectionRef = useRef<HTMLDivElement | null>(null);

  const [timeIntervals, setTimeIntervals] = useState<TimeInterval[]>([
    {
      id: generateIntervalId(),
      timeStart: '09:00',
      timeEnd: '09:30',
      services: DEFAULT_INTERVAL_SERVICES,
      task: 'Pamaitinti, pakeisti kraiką',
    },
  ]);

  const [timeIntervalsByDate, setTimeIntervalsByDate] = useState<Record<string, TimeInterval[]>>({});

  const [formData, setFormData] = useState({
    petIds: [] as string[],
    sitterProfileId: prefillSitterProfileId ?? '',
    address: initialAddress,
    totalPrice: 0,
    notesForSitter: '',
  });

  const selectedSitter = sitters.find((sitter) => sitter.id === formData.sitterProfileId);

  // Helper functions
  const parseTimeToMinutes = useCallback((time: string) => {
    const [hoursPart, minutesPart] = time.split(':').map((part) => Number(part));
    if (!Number.isFinite(hoursPart) || !Number.isFinite(minutesPart)) return NaN;
    return hoursPart * 60 + minutesPart;
  }, []);

  const getDurationMinutesForServices = useCallback(
    (services: TimeInterval['services']) => {
      const hasShortService = services.feeding || services.litter;
      const hasWalking = services.walking;

      if (hasWalking && hasShortService) return 90;
      if (hasWalking) return 60;
      if (hasShortService) return 30;
      return 60;
    },
    [],
  );

  const formatServicesLabel = useCallback((services: TimeInterval['services']) => {
    const parts: string[] = [];
    if (services.feeding) parts.push('Pamaitinti');
    if (services.litter) parts.push('Kraikas');
    if (services.walking) parts.push('Pavedžioti');
    return parts.length > 0 ? parts.join(', ') : 'Vizitas';
  }, []);

  const areServiceSelectionsEqual = useCallback(
    (firstServices: TimeInterval['services'], secondServices: TimeInterval['services']) => {
      return (
        firstServices.feeding === secondServices.feeding &&
        firstServices.litter === secondServices.litter &&
        firstServices.walking === secondServices.walking
      );
    },
    [],
  );

  const getPresetKeyForServices = useCallback(
    (services: TimeInterval['services']) => {
      for (const preset of VISIT_PRESETS) {
        if (areServiceSelectionsEqual(preset.services, services)) return preset.key;
      }
      return null;
    },
    [areServiceSelectionsEqual],
  );

  const activeNewVisitPresetKey = useMemo(() => {
    return getPresetKeyForServices(newVisitServices);
  }, [getPresetKeyForServices, newVisitServices]);

  const setNewVisitPreset = useCallback((presetKey: VisitPresetKey) => {
    const preset = VISIT_PRESETS.find((presetItem) => presetItem.key === presetKey);
    if (!preset) return;
    setNewVisitServices(preset.services);
    setIsNewVisitServicesAdvancedOpen(false);
  }, []);

  const mapServicesToApiValues = useCallback((services: TimeInterval['services']) => {
    const apiValues: string[] = [];
    if (services.feeding) apiValues.push('FEEDING');
    if (services.litter) apiValues.push('LITTER');
    if (services.walking) apiValues.push('WALKING');
    return apiValues;
  }, []);

  const normalizedNotesForSitter = useMemo(() => {
    const trimmed = formData.notesForSitter.trim();
    return trimmed ? trimmed : undefined;
  }, [formData.notesForSitter]);

  const formatMinutesToTime = useCallback((totalMinutes: number) => {
    const safeMinutes = Math.max(0, Math.min(24 * 60, Math.floor(totalMinutes)));
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }, []);


  const formatDateToIso = useCallback((date: Date) => {
    return date.toISOString().slice(0, 10);
  }, []);

  const getDateRangeDayIsos = useCallback(() => {
    const normalized = selectedDates
      .map((date) => ({ date, iso: formatDateToIso(date) }))
      .sort((firstItem, secondItem) => firstItem.iso.localeCompare(secondItem.iso));

    const uniqueIsos: string[] = [];
    for (const item of normalized) {
      const lastIso = uniqueIsos[uniqueIsos.length - 1];
      if (lastIso !== item.iso) uniqueIsos.push(item.iso);
    }

    return uniqueIsos;
  }, [formatDateToIso, selectedDates]);

  const getIntervalsForDate = useCallback(
    (dateIso: string) => {
      const overrideIntervals = timeIntervalsByDate[dateIso];
      return overrideIntervals ?? timeIntervals;
    },
    [timeIntervals, timeIntervalsByDate],
  );

  const getBusySlotsByDate = useCallback(() => {
    const byDate = new Map<string, BusySlot[]>();
    for (const slot of busySlots) {
      const existingSlots = byDate.get(slot.date);
      if (existingSlots) {
        existingSlots.push(slot);
      } else {
        byDate.set(slot.date, [slot]);
      }
    }
    for (const slotsForDay of byDate.values()) {
      slotsForDay.sort((firstSlot, secondSlot) => firstSlot.timeStart.localeCompare(secondSlot.timeStart));
    }
    return byDate;
  }, [busySlots]);

  // Computed values
  const dayIsos = getDateRangeDayIsos();
  const daysCount = dayIsos.length;

  const dateFromIso = dayIsos[0] ?? '';
  const dateToIso = dayIsos[dayIsos.length - 1] ?? '';

  const getDateError = useCallback(() => {
    if (dayIsos.length === 0) return 'Pasirinkite datą';
    return '';
  }, [dayIsos.length]);

  const dateError = getDateError();

  const getIntervalsError = useCallback(() => {
    if (dayIsos.length === 0) {
      if (timeIntervals.length === 0) return 'Pridėkite bent vieną laiko intervalą';
    }

    const validateIntervals = (intervalsToValidate: TimeInterval[], labelPrefix: string) => {
      if (intervalsToValidate.length === 0) {
        return `${labelPrefix}: pridėkite bent vieną laiko intervalą`;
      }

      const normalized = intervalsToValidate
        .map((interval) => ({
          id: interval.id,
          timeStart: interval.timeStart,
          timeEnd: interval.timeEnd,
          startMinutes: parseTimeToMinutes(interval.timeStart),
          endMinutes: parseTimeToMinutes(interval.timeEnd),
        }))
        .sort((firstInterval, secondInterval) => firstInterval.startMinutes - secondInterval.startMinutes);

      for (const interval of normalized) {
        if (!Number.isFinite(interval.startMinutes) || !Number.isFinite(interval.endMinutes)) {
          return `${labelPrefix}: neteisingas laikas`;
        }
        if (interval.endMinutes <= interval.startMinutes) {
          return `${labelPrefix}: intervalas ${interval.timeStart}–${interval.timeEnd} neteisingas (pabaiga turi būti vėliau)`;
        }
      }

      for (let index = 1; index < normalized.length; index += 1) {
        const previous = normalized[index - 1];
        const current = normalized[index];
        if (current.startMinutes < previous.endMinutes) {
          return `${labelPrefix}: intervalai persidengia (${previous.timeStart}–${previous.timeEnd} ir ${current.timeStart}–${current.timeEnd})`;
        }
      }

      return '';
    };

    const defaultError = validateIntervals(timeIntervals, 'Numatytieji laikai');
    if (defaultError) return defaultError;

    for (const dateIso of dayIsos) {
      const overrideIntervals = timeIntervalsByDate[dateIso];
      if (!overrideIntervals) continue;
      const overrideError = validateIntervals(overrideIntervals, `Diena ${dateIso}`);
      if (overrideError) return overrideError;
    }

    return '';
  }, [dayIsos, parseTimeToMinutes, timeIntervals, timeIntervalsByDate]);

  const intervalsError = getIntervalsError();

  const isPlanningEnabled = Boolean(formData.sitterProfileId);

  // Calculate total hours per day from all intervals
  const getTotalHoursForDate = useCallback(
    (dateIso: string) => {
      const intervalsForDate = getIntervalsForDate(dateIso);
      let totalMinutes = 0;
      for (const interval of intervalsForDate) {
        const startMinutes = parseTimeToMinutes(interval.timeStart);
        const endMinutes = parseTimeToMinutes(interval.timeEnd);
        if (Number.isFinite(startMinutes) && Number.isFinite(endMinutes) && endMinutes > startMinutes) {
          totalMinutes += endMinutes - startMinutes;
        }
      }
      return totalMinutes / 60;
    },
    [getIntervalsForDate, parseTimeToMinutes],
  );

  const getTotalHoursAcrossRange = useCallback(() => {
    return dayIsos.reduce((accumulatedHours, dateIso) => accumulatedHours + getTotalHoursForDate(dateIso), 0);
  }, [dayIsos, getTotalHoursForDate]);

  const getTotalVisitsAcrossRange = useCallback(() => {
    return dayIsos.reduce((accumulatedVisits, dateIso) => accumulatedVisits + getIntervalsForDate(dateIso).length, 0);
  }, [dayIsos, getIntervalsForDate]);

  const getSuggestedTotalPrice = useCallback(() => {
    if (!selectedSitter) return null;
    if (daysCount <= 0) return null;
    if (intervalsError) return null;

    const totalHours = getTotalHoursAcrossRange();
    if (totalHours <= 0) return null;

    const hourlyRate = Number(selectedSitter.hourlyRate);
    if (!Number.isFinite(hourlyRate)) return null;

    return Math.round(hourlyRate * totalHours * 100) / 100;
  }, [selectedSitter, daysCount, intervalsError, getTotalHoursAcrossRange]);

  const suggestedTotalPrice = getSuggestedTotalPrice();

  // Check for busy conflicts across all days and their intervals
  const busyConflicts = useMemo(() => {
    if (!formData.sitterProfileId) return [];
    if (dateError) return [];
    if (intervalsError) return [];

    const overlaps: BusySlot[] = [];
    const busySlotsByDate = getBusySlotsByDate();

    for (const dateIso of dayIsos) {
      const dayBusySlots = busySlotsByDate.get(dateIso) ?? [];
      if (dayBusySlots.length === 0) continue;

      const intervalsForDay = getIntervalsForDate(dateIso);
      for (const interval of intervalsForDay) {
        const selectedStart = parseTimeToMinutes(interval.timeStart);
        const selectedEnd = parseTimeToMinutes(interval.timeEnd);
        if (!Number.isFinite(selectedStart) || !Number.isFinite(selectedEnd)) continue;

        for (const slot of dayBusySlots) {
          const slotStart = parseTimeToMinutes(slot.timeStart);
          const slotEnd = parseTimeToMinutes(slot.timeEnd);
          if (!Number.isFinite(slotStart) || !Number.isFinite(slotEnd)) continue;

          if (selectedStart < slotEnd && selectedEnd > slotStart) {
            const alreadyAdded = overlaps.some(
              (existing) =>
                existing.date === slot.date &&
                existing.timeStart === slot.timeStart &&
                existing.timeEnd === slot.timeEnd,
            );
            if (!alreadyAdded) overlaps.push(slot);
          }
        }
      }
    }

    overlaps.sort((firstSlot, secondSlot) => {
      if (firstSlot.date !== secondSlot.date) {
        return firstSlot.date.localeCompare(secondSlot.date);
      }
      return firstSlot.timeStart.localeCompare(secondSlot.timeStart);
    });

    return overlaps;
  }, [dateError, formData.sitterProfileId, getBusySlotsByDate, dayIsos, getIntervalsForDate, intervalsError, parseTimeToMinutes]);

  const hasBusyConflict = busyConflicts.length > 0;

  const submitDisabledReason = useMemo(() => {
    if (loading) return 'Kuriama rezervacija...';
    if (!formData.sitterProfileId) return 'Pasirinkite prižiūrėtoją, kad galėtumėte planuoti vizitus.';
    if (formData.petIds.length === 0) return 'Pasirinkite bent vieną augintinį.';
    if (!formData.address.trim()) return 'Įveskite adresą.';
    if (busyLoading) return 'Tikrinamas užimtumas. Palaukite...';
    if (dateError) return dateError;
    if (intervalsError) return intervalsError;
    if (hasBusyConflict) return 'Yra laiko konfliktų. Pakoreguokite laikus.';
    return '';
  }, [busyLoading, dateError, formData.address, formData.petIds.length, formData.sitterProfileId, hasBusyConflict, intervalsError, loading]);

  const isSubmitDisabled = Boolean(submitDisabledReason);

  const openAdvancedSettings = useCallback(() => {
    setIsAdvancedSettingsOpen(true);
    requestAnimationFrame(() => {
      timeIntervalsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  // Calculate availability status for each day (for calendar coloring)
  const availabilityByDate = useMemo(() => {
    const result = new Map<string, DayStatus>();

    if (!formData.sitterProfileId || dateError || intervalsError) return result;

    const byDate = getBusySlotsByDate();

    for (const dateIso of dayIsos) {

      const dayBusySlots = byDate.get(dateIso) ?? [];

      let totalIntervalMinutes = 0;
      let conflictMinutes = 0;

      const intervalsForDay = getIntervalsForDate(dateIso);
      for (const interval of intervalsForDay) {
        const intervalStart = parseTimeToMinutes(interval.timeStart);
        const intervalEnd = parseTimeToMinutes(interval.timeEnd);
        if (!Number.isFinite(intervalStart) || !Number.isFinite(intervalEnd)) continue;

        const intervalDuration = intervalEnd - intervalStart;
        if (intervalDuration <= 0) continue;

        totalIntervalMinutes += intervalDuration;

        // Check overlap with busy slots
        for (const busySlot of dayBusySlots) {
          const busyStart = parseTimeToMinutes(busySlot.timeStart);
          const busyEnd = parseTimeToMinutes(busySlot.timeEnd);
          if (!Number.isFinite(busyStart) || !Number.isFinite(busyEnd)) continue;

          const overlapStart = Math.max(intervalStart, busyStart);
          const overlapEnd = Math.min(intervalEnd, busyEnd);
          if (overlapEnd > overlapStart) {
            conflictMinutes += overlapEnd - overlapStart;
          }
        }
      }

      if (totalIntervalMinutes === 0) {
        result.set(dateIso, 'free');
      } else if (conflictMinutes >= totalIntervalMinutes) {
        result.set(dateIso, 'full');
      } else if (conflictMinutes > 0) {
        result.set(dateIso, 'partial');
      } else {
        result.set(dateIso, 'free');
      }
    }

    return result;
  }, [dateError, dayIsos, formData.sitterProfileId, getBusySlotsByDate, getIntervalsForDate, intervalsError, parseTimeToMinutes]);

  const daySummaries = useMemo(() => {
    return dayIsos.map((dateIso) => {
      const status = availabilityByDate.get(dateIso) ?? 'free';
      const hasOverride = Boolean(timeIntervalsByDate[dateIso]);
      return { dateIso, status, hasOverride };
    });
  }, [availabilityByDate, dayIsos, timeIntervalsByDate]);

  const selectedDayBusySlots = useMemo(() => {
    if (!selectedDayIso) return [] as BusySlot[];
    const byDate = getBusySlotsByDate();
    return byDate.get(selectedDayIso) ?? [];
  }, [getBusySlotsByDate, selectedDayIso]);

  const selectedDayIntervals = useMemo(() => {
    if (!selectedDayIso) return null;
    return getIntervalsForDate(selectedDayIso);
  }, [getIntervalsForDate, selectedDayIso]);

  const selectedDayFreeIntervals = useMemo(() => {
    if (!selectedDayIso) {
      return [] as Array<{ start: string; end: string; startMinutes: number; endMinutes: number }>;
    }

    const workingStartMinutes = parseTimeToMinutes(WORKING_DAY_START);
    const workingEndMinutes = parseTimeToMinutes(WORKING_DAY_END);
    if (!Number.isFinite(workingStartMinutes) || !Number.isFinite(workingEndMinutes)) {
      return [];
    }

    const busyIntervals = selectedDayBusySlots
      .map((slot) => {
        const startMinutes = parseTimeToMinutes(slot.timeStart);
        const endMinutes = parseTimeToMinutes(slot.timeEnd);
        if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) return null;
        if (endMinutes <= startMinutes) return null;
        const clampedStart = Math.max(workingStartMinutes, startMinutes);
        const clampedEnd = Math.min(workingEndMinutes, endMinutes);
        if (clampedEnd <= clampedStart) return null;
        return { startMinutes: clampedStart, endMinutes: clampedEnd };
      })
      .filter((interval): interval is { startMinutes: number; endMinutes: number } => Boolean(interval))
      .sort((firstInterval, secondInterval) => firstInterval.startMinutes - secondInterval.startMinutes);

    const mergedBusyIntervals: Array<{ startMinutes: number; endMinutes: number }> = [];
    for (const interval of busyIntervals) {
      const lastInterval = mergedBusyIntervals[mergedBusyIntervals.length - 1];
      if (!lastInterval) {
        mergedBusyIntervals.push(interval);
        continue;
      }
      if (interval.startMinutes <= lastInterval.endMinutes) {
        lastInterval.endMinutes = Math.max(lastInterval.endMinutes, interval.endMinutes);
        continue;
      }
      mergedBusyIntervals.push(interval);
    }

    const freeIntervals: Array<{ start: string; end: string; startMinutes: number; endMinutes: number }> = [];
    let cursorMinutes = workingStartMinutes;
    for (const busyInterval of mergedBusyIntervals) {
      if (cursorMinutes < busyInterval.startMinutes) {
        freeIntervals.push({
          start: formatMinutesToTime(cursorMinutes),
          end: formatMinutesToTime(busyInterval.startMinutes),
          startMinutes: cursorMinutes,
          endMinutes: busyInterval.startMinutes,
        });
      }
      cursorMinutes = Math.max(cursorMinutes, busyInterval.endMinutes);
    }
    if (cursorMinutes < workingEndMinutes) {
      freeIntervals.push({
        start: formatMinutesToTime(cursorMinutes),
        end: formatMinutesToTime(workingEndMinutes),
        startMinutes: cursorMinutes,
        endMinutes: workingEndMinutes,
      });
    }

    return freeIntervals.filter((interval) => interval.startMinutes < interval.endMinutes);
  }, [formatMinutesToTime, parseTimeToMinutes, selectedDayBusySlots, selectedDayIso]);

  const setSelectedDayIntervals = useCallback(
    (dateIso: string, intervalsForDate: TimeInterval[]) => {
      setTimeIntervalsByDate((prev) => ({
        ...prev,
        [dateIso]: intervalsForDate,
      }));
      setIsPriceManuallyEdited(false);
    },
    [],
  );

  // Load initial data
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

        if (prefillSitterProfileId && !sittersData.some((sitter) => sitter.id === prefillSitterProfileId)) {
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

    void loadData();
  }, [prefillSitterProfileId]);

  const addIntervalForSelectedDay = () => {
    if (!selectedDayIso) return;
    const currentIntervals = getIntervalsForDate(selectedDayIso);
    const durationMinutes = getDurationMinutesForServices(newVisitServices);
    const defaultStart = '14:00';
    const startMinutes = parseTimeToMinutes(defaultStart);
    const nextEnd = Number.isFinite(startMinutes)
      ? formatMinutesToTime(startMinutes + durationMinutes)
      : '14:30';
    const nextIntervals = [
      ...currentIntervals,
      {
        id: generateIntervalId(),
        timeStart: defaultStart,
        timeEnd: nextEnd,
        services: { ...newVisitServices },
        task: newVisitTaskTemplate.trim() || formatServicesLabel(newVisitServices),
      },
    ];
    setSelectedDayIntervals(selectedDayIso, nextIntervals);
  };

  const removeIntervalForSelectedDay = (intervalId: string) => {
    if (!selectedDayIso) return;
    const currentIntervals = getIntervalsForDate(selectedDayIso);
    if (currentIntervals.length <= 1) return;
    setSelectedDayIntervals(
      selectedDayIso,
      currentIntervals.filter((interval) => interval.id !== intervalId),
    );
  };

  const updateIntervalForSelectedDay = (
    intervalId: string,
    field: 'timeStart' | 'timeEnd',
    value: string,
  ) => {
    if (!selectedDayIso) return;
    const currentIntervals = getIntervalsForDate(selectedDayIso);
    setSelectedDayIntervals(
      selectedDayIso,
      currentIntervals.map((interval) => {
        if (interval.id !== intervalId) return interval;
        if (field === 'timeEnd') {
          return { ...interval, timeEnd: value };
        }

        const startMinutes = parseTimeToMinutes(value);
        if (!Number.isFinite(startMinutes)) return { ...interval, timeStart: value };
        const durationMinutes = getDurationMinutesForServices(interval.services);
        return {
          ...interval,
          timeStart: value,
          timeEnd: formatMinutesToTime(startMinutes + durationMinutes),
        };
      }),
    );
  };

  const toggleServiceForSelectedDayInterval = (
    intervalId: string,
    serviceKey: keyof TimeInterval['services'],
  ) => {
    if (!selectedDayIso) return;
    const currentIntervals = getIntervalsForDate(selectedDayIso);

    setSelectedDayIntervals(
      selectedDayIso,
      currentIntervals.map((interval) => {
        if (interval.id !== intervalId) return interval;

        const nextServices = {
          ...interval.services,
          [serviceKey]: !interval.services[serviceKey],
        };

        const startMinutes = parseTimeToMinutes(interval.timeStart);
        if (!Number.isFinite(startMinutes)) {
          return {
            ...interval,
            services: nextServices,
          };
        }

        const durationMinutes = getDurationMinutesForServices(nextServices);
        return {
          ...interval,
          services: nextServices,
          timeEnd: formatMinutesToTime(startMinutes + durationMinutes),
        };
      }),
    );
  };

  const updateTaskForSelectedDayInterval = (intervalId: string, nextTask: string) => {
    if (!selectedDayIso) return;
    const currentIntervals = getIntervalsForDate(selectedDayIso);
    setSelectedDayIntervals(
      selectedDayIso,
      currentIntervals.map((interval) =>
        interval.id === intervalId ? { ...interval, task: nextTask } : interval,
      ),
    );
  };

  const resetSelectedDayOverride = () => {
    if (!selectedDayIso) return;
    setTimeIntervalsByDate((prev) => {
      const next = { ...prev };
      delete next[selectedDayIso];
      return next;
    });
    setIsPriceManuallyEdited(false);
  };

  const toggleNewVisitService = (serviceKey: keyof TimeInterval['services']) => {
    setIsNewVisitServicesAdvancedOpen(true);
    setNewVisitServices((prev) => ({
      ...prev,
      [serviceKey]: !prev[serviceKey],
    }));
  };

  const toggleSelectedDayIntervalServices = useCallback((intervalId: string) => {
    setSelectedDayIntervalServicesOpenById((prev) => ({
      ...prev,
      [intervalId]: !prev[intervalId],
    }));
  }, []);

  const toggleDefaultIntervalServices = useCallback((intervalId: string) => {
    setDefaultIntervalServicesOpenById((prev) => ({
      ...prev,
      [intervalId]: !prev[intervalId],
    }));
  }, []);

  const addVisitFromFreeIntervalForSelectedDay = (
    freeStartMinutes: number,
    freeEndMinutes: number,
  ) => {
    if (!selectedDayIso) return;

    const durationMinutes = getDurationMinutesForServices(newVisitServices);
    const visitEndMinutes = Math.min(freeEndMinutes, freeStartMinutes + durationMinutes);
    if (visitEndMinutes <= freeStartMinutes) return;

    const currentIntervals = getIntervalsForDate(selectedDayIso);
    const currentOverride = timeIntervalsByDate[selectedDayIso];
    const nextBaseIntervals = currentOverride ? currentIntervals : [...currentIntervals];

    setSelectedDayIntervals(selectedDayIso, [
      ...nextBaseIntervals,
      {
        id: generateIntervalId(),
        timeStart: formatMinutesToTime(freeStartMinutes),
        timeEnd: formatMinutesToTime(visitEndMinutes),
        services: { ...newVisitServices },
        task: newVisitTaskTemplate.trim() || formatServicesLabel(newVisitServices),
      },
    ]);
  };

  const setVisitsCountForSelectedDay = (visitsCount: number) => {
    if (!selectedDayIso) return;

    const durationMinutes = getDurationMinutesForServices(newVisitServices);
    const freeIntervals = selectedDayFreeIntervals;
    const generated: TimeInterval[] = [];

    for (const freeInterval of freeIntervals) {
      if (generated.length >= visitsCount) break;
      let cursorMinutes = freeInterval.startMinutes;
      while (
        generated.length < visitsCount &&
        cursorMinutes + durationMinutes <= freeInterval.endMinutes
      ) {
        generated.push({
          id: generateIntervalId(),
          timeStart: formatMinutesToTime(cursorMinutes),
          timeEnd: formatMinutesToTime(cursorMinutes + durationMinutes),
          services: { ...newVisitServices },
          task: newVisitTaskTemplate.trim() || formatServicesLabel(newVisitServices),
        });
        cursorMinutes += durationMinutes;
      }
    }

    if (generated.length === 0) {
      // fallback: keep current intervals
      return;
    }

    setSelectedDayIntervals(selectedDayIso, generated);
  };

  useEffect(() => {
    if (selectedDayIso) return;
    if (daySummaries.length === 0) return;

    const firstFullDay = daySummaries.find((summary) => summary.status === 'full');
    const firstPartialDay = daySummaries.find((summary) => summary.status === 'partial');
    const fallbackDay = daySummaries[0];
    setSelectedDayIso((firstFullDay ?? firstPartialDay ?? fallbackDay).dateIso);
  }, [daySummaries, selectedDayIso]);

  // Auto-update price
  useEffect(() => {
    if (isPriceManuallyEdited) return;
    if (!suggestedTotalPrice) return;
    if (intervalsError) return;
    if (dateError) return;

    setFormData((prev) => ({
      ...prev,
      totalPrice: suggestedTotalPrice,
    }));
  }, [isPriceManuallyEdited, suggestedTotalPrice, intervalsError, dateError]);

  // Load busy slots when sitter or date range changes
  useEffect(() => {
    if (!formData.sitterProfileId) {
      setBusySlots([]);
      setBusyError('');
      return;
    }
    if (!dateFromIso || !dateToIso) {
      setBusySlots([]);
      setBusyError('');
      return;
    }

    let canceled = false;
    const loadBusySlots = async () => {
      try {
        setBusyLoading(true);
        setBusyError('');
        const slots = await bookingService.getBusySlots({
          sitterProfileId: formData.sitterProfileId,
          dateFrom: dateFromIso,
          dateTo: dateToIso,
        });
        if (!canceled) setBusySlots(slots);
      } catch {
        if (!canceled) setBusyError('Nepavyko užkrauti užimtumo');
      } finally {
        if (!canceled) setBusyLoading(false);
      }
    };

    void loadBusySlots();

    return () => {
      canceled = true;
    };
  }, [dateFromIso, dateToIso, formData.sitterProfileId]);

  // Interval management
  const addInterval = () => {
    const durationMinutes = getDurationMinutesForServices(newVisitServices);
    const defaultStart = '14:00';
    const startMinutes = parseTimeToMinutes(defaultStart);
    const nextEnd = Number.isFinite(startMinutes)
      ? formatMinutesToTime(startMinutes + durationMinutes)
      : '14:30';
    setTimeIntervals((prev) => [
      ...prev,
      {
        id: generateIntervalId(),
        timeStart: defaultStart,
        timeEnd: nextEnd,
        services: { ...newVisitServices },
        task: newVisitTaskTemplate.trim() || formatServicesLabel(newVisitServices),
      },
    ]);
    setIsPriceManuallyEdited(false);
  };

  const removeInterval = (intervalId: string) => {
    if (timeIntervals.length <= 1) return;
    setTimeIntervals((prev) => prev.filter((interval) => interval.id !== intervalId));
    setIsPriceManuallyEdited(false);
  };

  const updateInterval = (intervalId: string, field: 'timeStart' | 'timeEnd', value: string) => {
    setTimeIntervals((prev) =>
      prev.map((interval) => {
        if (interval.id !== intervalId) return interval;
        if (field === 'timeEnd') {
          return { ...interval, timeEnd: value };
        }

        const startMinutes = parseTimeToMinutes(value);
        if (!Number.isFinite(startMinutes)) return { ...interval, timeStart: value };
        const durationMinutes = getDurationMinutesForServices(interval.services);
        return {
          ...interval,
          timeStart: value,
          timeEnd: formatMinutesToTime(startMinutes + durationMinutes),
        };
      }),
    );
    setIsPriceManuallyEdited(false);
  };

  const toggleServiceForDefaultInterval = (
    intervalId: string,
    serviceKey: keyof TimeInterval['services'],
  ) => {
    setTimeIntervals((prev) =>
      prev.map((interval) => {
        if (interval.id !== intervalId) return interval;

        const nextServices = {
          ...interval.services,
          [serviceKey]: !interval.services[serviceKey],
        };
        const startMinutes = parseTimeToMinutes(interval.timeStart);
        if (!Number.isFinite(startMinutes)) {
          return {
            ...interval,
            services: nextServices,
          };
        }

        const durationMinutes = getDurationMinutesForServices(nextServices);
        return {
          ...interval,
          services: nextServices,
          timeEnd: formatMinutesToTime(startMinutes + durationMinutes),
        };
      }),
    );
    setIsPriceManuallyEdited(false);
  };

  const updateTaskForDefaultInterval = (intervalId: string, nextTask: string) => {
    setTimeIntervals((prev) =>
      prev.map((interval) => (interval.id === intervalId ? { ...interval, task: nextTask } : interval)),
    );
    setIsPriceManuallyEdited(false);
  };

  // Submit handler
  const handleSubmit = async (submitEvent: React.FormEvent) => {
    submitEvent.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.sitterProfileId) {
      setLoading(false);
      const errorMsg = 'Pasirinkite prižiūrėtoją';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (formData.petIds.length === 0) {
      setLoading(false);
      const errorMsg = 'Pasirinkite bent vieną augintinį';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!formData.address.trim()) {
      setLoading(false);
      const errorMsg = 'Įveskite adresą';
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

    if (intervalsError) {
      setLoading(false);
      setError(intervalsError);
      toast.error(intervalsError);
      return;
    }

    if (daysCount <= 0) {
      setLoading(false);
      const errorMsg = 'Pasirinkite teisingą datų intervalą';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (busyLoading) {
      setLoading(false);
      const errorMsg = 'Tikrinamas užimtumas. Palaukite...';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (hasBusyConflict) {
      setLoading(false);
      const errorMsg = 'Pasirinktos datos/laikas užimti. Pasirinkite kitą laiką arba datą.';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      const totalVisits = getTotalVisitsAcrossRange();
      const pricePerVisit = totalVisits > 0
        ? Math.round((formData.totalPrice / totalVisits) * 100) / 100
        : 0;

      const createPromises: Promise<unknown>[] = [];

      for (const dateIso of dayIsos) {
        const intervalsForDay = getIntervalsForDate(dateIso);
        for (const interval of intervalsForDay) {
          createPromises.push(
            bookingService.createBooking({
              sitterProfileId: formData.sitterProfileId,
              petIds: formData.petIds,
              address: formData.address,
              date: dateIso,
              timeStart: interval.timeStart,
              timeEnd: interval.timeEnd,
              services: mapServicesToApiValues(interval.services),
              task: interval.task.trim() ? interval.task.trim() : undefined,
              totalPrice: pricePerVisit,
              notesForSitter: normalizedNotesForSitter,
            }),
          );
        }
      }

      await Promise.all(createPromises);
      toast.success(`Rezervacija sėkmingai sukurta! (${totalVisits} vizitai per ${daysCount} d.)`);
      onSuccess();
    } catch (err: unknown) {
      const errorMsg = getApiErrorMessage(err, 'Nepavyko sukurti rezervacijos');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };


  const totalVisitsCount = getTotalVisitsAcrossRange();
  const totalHoursAcrossRange = getTotalHoursAcrossRange();

  const formMainFields = (
    <>
      {error && (
        <div className="order-0 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

            <div ref={planningSectionRef} className="order-4 border border-gray-200 rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-sm font-semibold text-gray-900">Planavimas</p>
                <p className="text-xs text-gray-600">
                  Pasirinkite datas, tada dieną ir susidėliokite vizitus tai dienai.
                </p>
              </div>

              {!isPlanningEnabled && (
                <div className="mb-3 border border-blue-200 bg-blue-50 rounded-lg p-3">
                  <p className="text-sm font-semibold text-blue-900">Pirmiausia pasirinkite prižiūrėtoją</p>
                  <p className="text-xs text-blue-800">
                    Tada matysite užimtumą (laisva/dalinai/užimta) ir galėsite susidėlioti vizitus.
                  </p>
                </div>
              )}

              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${isPlanningEnabled ? '' : 'opacity-50'}`}>
                <div>
                  <p className="text-sm font-medium text-gray-800 mb-1">Kalendorius</p>
                  <p className="text-xs text-gray-600 mb-2">Pasirinkta: {daysCount} d.</p>
                  <div className="flex items-center gap-3 mb-3 text-xs text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-green-100 border border-green-300" />
                      Laisva
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-orange-100 border border-orange-300" />
                      Dalinai
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-red-100 border border-red-300" />
                      Užimta
                    </span>
                  </div>

                  <DayPicker
                    mode="multiple"
                    locale={lt}
                    selected={selectedDates}
                    onSelect={(dates) => {
                      if (!isPlanningEnabled) return;
                      setSelectedDates(dates ?? []);
                      setIsPriceManuallyEdited(false);
                      setSelectedDayIso(null);
                    }}
                    onDayClick={(day) => {
                      if (!isPlanningEnabled) return;
                      const dateIso = formatDateToIso(day);
                      setSelectedDayIso(dateIso);
                    }}
                    disabled={isPlanningEnabled ? { before: new Date() } : undefined}
                    modifiers={{
                      free: (date) => availabilityByDate.get(formatDateToIso(date)) === 'free',
                      partial: (date) => availabilityByDate.get(formatDateToIso(date)) === 'partial',
                      full: (date) => availabilityByDate.get(formatDateToIso(date)) === 'full',
                    }}
                    modifiersClassNames={{
                      free: 'bg-green-100 text-green-800',
                      partial: 'bg-orange-100 text-orange-800',
                      full: 'bg-red-100 text-red-800',
                    }}
                    classNames={{
                      month_caption: 'capitalize',
                      caption_label: 'capitalize',
                    }}
                    className="mx-auto"
                  />

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedDates([])}
                      className="text-xs font-semibold text-gray-700 hover:text-gray-900"
                    >
                      Išvalyti pasirinkimą
                    </button>
                    <button
                      type="button"
                      onClick={openAdvancedSettings}
                      className="text-xs font-semibold text-purple-700 hover:text-purple-800"
                    >
                      Keisti numatytuosius laikus
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-800 mb-2">Pasirinktos dienos</p>
                  {daySummaries.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {daySummaries.map((dayInfo) => {
                        const statusClasses =
                          dayInfo.status === 'full'
                            ? 'bg-red-50 border-red-200 text-red-800'
                            : dayInfo.status === 'partial'
                              ? 'bg-orange-50 border-orange-200 text-orange-800'
                              : 'bg-green-50 border-green-200 text-green-800';
                        const isSelected = dayInfo.dateIso === selectedDayIso;

                        return (
                          <button
                            key={dayInfo.dateIso}
                            type="button"
                            disabled={!isPlanningEnabled}
                            onClick={() => {
                              if (!isPlanningEnabled) return;
                              setSelectedDayIso(dayInfo.dateIso);
                            }}
                            className={`shrink-0 min-w-[150px] border rounded-lg p-2 text-left transition ${statusClasses} ${
                              isSelected ? 'ring-2 ring-purple-400' : 'hover:opacity-90'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold">{dayInfo.dateIso}</p>
                              <span className="text-[11px] font-semibold">
                                {dayInfo.status === 'full'
                                  ? 'Užimta'
                                  : dayInfo.status === 'partial'
                                    ? 'Dalinai'
                                    : 'Laisva'}
                              </span>
                            </div>
                            <p className="text-[11px] mt-1 text-current/80">
                              {dayInfo.hasOverride ? 'Turi savo laikus (override)' : 'Naudoja numatytuosius laikus'}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Pasirinkite bent vieną dieną kalendoriuje.</p>
                  )}

                  {isPlanningEnabled && selectedDayIso && selectedDayIntervals && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className="text-sm font-semibold text-gray-900">Laikai dienai: {selectedDayIso}</p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={resetSelectedDayOverride}
                            className="text-xs font-semibold text-gray-700 hover:text-gray-900"
                          >
                            Grąžinti numatytuosius
                          </button>
                          <button
                            type="button"
                            onClick={addIntervalForSelectedDay}
                            className="text-xs font-semibold text-purple-700 hover:text-purple-800"
                          >
                            + Pridėti intervalą
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 mb-3">
                        <p className="text-xs font-semibold text-gray-700">Vizitų skaičius šiai dienai:</p>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3].map((count) => (
                            <button
                              key={count}
                              type="button"
                              onClick={() => setVisitsCountForSelectedDay(count)}
                              className="text-[11px] px-2 py-1 rounded border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 transition"
                            >
                              {count}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Vizito tipas (lemia trukmę)</p>

                        <div className="flex flex-wrap gap-2">
                          {VISIT_PRESETS.map((presetItem) => {
                            const isActive = activeNewVisitPresetKey === presetItem.key;
                            return (
                              <button
                                key={presetItem.key}
                                type="button"
                                onClick={() => setNewVisitPreset(presetItem.key)}
                                className={`text-[11px] px-2 py-1 rounded border transition ${
                                  isActive
                                    ? 'bg-purple-600 border-purple-600 text-white'
                                    : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
                                }`}
                              >
                                {presetItem.label}
                              </button>
                            );
                          })}
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-3">
                          <p className="text-[11px] text-gray-500">
                            Paslaugos: {formatServicesLabel(newVisitServices)} · Trukmė: {getDurationMinutesForServices(newVisitServices)} min.
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsNewVisitServicesAdvancedOpen((prev) => !prev)}
                            className="text-[11px] font-semibold text-purple-700 hover:text-purple-800"
                          >
                            Keisti paslaugas
                          </button>
                        </div>

                        {isNewVisitServicesAdvancedOpen && (
                          <div className="mt-2 flex flex-wrap gap-3">
                            <label className="flex items-center gap-2 text-xs text-gray-700">
                              <input
                                type="checkbox"
                                checked={newVisitServices.feeding}
                                onChange={() => toggleNewVisitService('feeding')}
                                className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                              />
                              Pamaitinti
                            </label>
                            <label className="flex items-center gap-2 text-xs text-gray-700">
                              <input
                                type="checkbox"
                                checked={newVisitServices.litter}
                                onChange={() => toggleNewVisitService('litter')}
                                className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                              />
                              Kraikas
                            </label>
                            <label className="flex items-center gap-2 text-xs text-gray-700">
                              <input
                                type="checkbox"
                                checked={newVisitServices.walking}
                                onChange={() => toggleNewVisitService('walking')}
                                className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                              />
                              Pavedžioti
                            </label>
                          </div>
                        )}
                        <div className="mt-2">
                          <label className="block text-[11px] font-semibold text-gray-700 mb-1">Ką reikės padaryti (šablonas naujiems vizitams)</label>
                          <input
                            type="text"
                            value={newVisitTaskTemplate}
                            onChange={(changeEvent) => setNewVisitTaskTemplate(changeEvent.target.value)}
                            placeholder="Pvz: Pamaitinti + kraikas, duoti vandens"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          <p className="text-[11px] text-gray-500 mt-1">Jei paliksite tuščią, bus naudojamas automatinis tekstas pagal paslaugas.</p>
                        </div>

                        {selectedDayBusySlots.length > 0 ? (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 mt-3">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Užimti laikai šiai dienai:</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedDayBusySlots.map((slot, slotIndex) => (
                                <span
                                  key={`${slot.date}-${slot.timeStart}-${slotIndex}`}
                                  className="text-[11px] px-2 py-1 rounded bg-red-100 border border-red-200 text-red-800"
                                >
                                  {slot.timeStart}–{slot.timeEnd}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-600 mb-3">Šiai dienai užimtų laikų nėra.</p>
                        )}
                      </div>

                    {selectedDayFreeIntervals.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Laisvi laikai (pasirinkite vienu paspaudimu):</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedDayFreeIntervals
                            .filter((freeInterval) => freeInterval.endMinutes - freeInterval.startMinutes >= 30)
                            .slice(0, 10)
                            .map((freeInterval) => (
                              <button
                                key={`${freeInterval.start}-${freeInterval.end}`}
                                type="button"
                                onClick={() =>
                                  addVisitFromFreeIntervalForSelectedDay(
                                    freeInterval.startMinutes,
                                    freeInterval.endMinutes,
                                  )
                                }
                                className="text-[11px] px-2 py-1 rounded bg-green-100 border border-green-200 text-green-900 hover:bg-green-200 transition"
                              >
                                {freeInterval.start}–{freeInterval.end}
                              </button>
                            ))}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">Darbo laikas: {WORKING_DAY_START}–{WORKING_DAY_END}. Paspaudus pridedamas {getDurationMinutesForServices(newVisitServices)} min vizitas.</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      {selectedDayIntervals.map((interval) => (
                        <div key={interval.id} className="rounded-lg border border-gray-200 p-2 bg-white">
                          <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={interval.timeStart}
                            onChange={(changeEvent) =>
                              updateIntervalForSelectedDay(interval.id, 'timeStart', changeEvent.target.value)
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          />
                          <span className="text-gray-400">–</span>
                          <input
                            type="time"
                            value={interval.timeEnd}
                            disabled
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          />
                          {selectedDayIntervals.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeIntervalForSelectedDay(interval.id)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                              title="Pašalinti intervalą"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                          </div>

                          <div className="mt-2 flex items-center justify-between gap-3">
                            <p className="text-[11px] text-gray-500">
                              {formatServicesLabel(interval.services)} · Trukmė: {getDurationMinutesForServices(interval.services)} min.
                            </p>
                            <button
                              type="button"
                              onClick={() => toggleSelectedDayIntervalServices(interval.id)}
                              className="text-[11px] font-semibold text-purple-700 hover:text-purple-800"
                            >
                              Keisti paslaugas
                            </button>
                          </div>

                          {Boolean(selectedDayIntervalServicesOpenById[interval.id]) && (
                            <div className="mt-2 flex flex-wrap gap-3">
                              <label className="flex items-center gap-2 text-[11px] text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={interval.services.feeding}
                                  onChange={() => toggleServiceForSelectedDayInterval(interval.id, 'feeding')}
                                  className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                Pamaitinti
                              </label>
                              <label className="flex items-center gap-2 text-[11px] text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={interval.services.litter}
                                  onChange={() => toggleServiceForSelectedDayInterval(interval.id, 'litter')}
                                  className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                Kraikas
                              </label>
                              <label className="flex items-center gap-2 text-[11px] text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={interval.services.walking}
                                  onChange={() => toggleServiceForSelectedDayInterval(interval.id, 'walking')}
                                  className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                Pavedžioti
                              </label>
                            </div>
                          )}

                          <div className="mt-2">
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Ką reikės padaryti</label>
                            <input
                              type="text"
                              value={interval.task}
                              onChange={(changeEvent) => updateTaskForSelectedDayInterval(interval.id, changeEvent.target.value)}
                              placeholder="Pvz: pamaitinti, pakeisti kraiką, pavedžioti 30 min"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              </div>

              {/* Busy/Error messages */}
              <div className="mt-4 space-y-3">
                {busyError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{busyError}</p>
                  </div>
                )}

                {busyLoading && formData.sitterProfileId && !dateError && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-700">Tikrinamas užimtumas...</p>
                  </div>
                )}

                {hasBusyConflict && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-red-800 mb-2">Yra laiko konfliktų</p>
                    <div className="space-y-1">
                      {busyConflicts.slice(0, 3).map((slot, slotIndex) => (
                        <p key={`${slot.date}-${slot.timeStart}-${slotIndex}`} className="text-sm text-red-800">
                          {slot.date}: {slot.timeStart}–{slot.timeEnd}
                        </p>
                      ))}
                      {busyConflicts.length > 3 && (
                        <p className="text-sm text-red-700">Ir dar {busyConflicts.length - 3}...</p>
                      )}
                    </div>
                    <p className="text-xs text-red-800 mt-2">Pakoreguokite vizitų laikus, kad nepersidengtų su užimtais intervalais.</p>
                  </div>
                )}
              </div>

              {/* Time Intervals */}
              <div ref={timeIntervalsSectionRef} className="mt-4">
                <details
                  className="border border-gray-200 rounded-lg p-3 bg-white"
                  open={isAdvancedSettingsOpen || Boolean(intervalsError)}
                  onToggle={(toggleEvent) => {
                    const detailsElement = toggleEvent.currentTarget;
                    setIsAdvancedSettingsOpen(detailsElement.open);
                  }}
                >
                  <summary className="cursor-pointer select-none text-sm font-medium text-gray-800">
                    Numatytieji laiko intervalai (išplėstiniai nustatymai)
                  </summary>
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Numatytieji laiko intervalai (taikomi visoms dienoms) *
                      </label>
                      <button
                        type="button"
                        onClick={addInterval}
                        className="text-xs font-semibold text-purple-700 hover:text-purple-800 transition"
                      >
                        + Pridėti intervalą
                      </button>
                    </div>
                    <div className="space-y-2">
                      {timeIntervals.map((interval) => (
                        <div key={interval.id} className="rounded-lg border border-gray-200 p-2 bg-white">
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={interval.timeStart}
                              onChange={(changeEvent) => updateInterval(interval.id, 'timeStart', changeEvent.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                            />
                            <span className="text-gray-400">–</span>
                            <input
                              type="time"
                              value={interval.timeEnd}
                              disabled
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                            />
                            {timeIntervals.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeInterval(interval.id)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                title="Pašalinti intervalą"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>

                          <div className="mt-2 flex items-center justify-between gap-3">
                            <p className="text-[11px] text-gray-500">
                              {formatServicesLabel(interval.services)} · Trukmė: {getDurationMinutesForServices(interval.services)} min.
                            </p>
                            <button
                              type="button"
                              onClick={() => toggleDefaultIntervalServices(interval.id)}
                              className="text-[11px] font-semibold text-purple-700 hover:text-purple-800"
                            >
                              Keisti paslaugas
                            </button>
                          </div>

                          {Boolean(defaultIntervalServicesOpenById[interval.id]) && (
                            <div className="mt-2 flex flex-wrap gap-3">
                              <label className="flex items-center gap-2 text-[11px] text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={interval.services.feeding}
                                  onChange={() => toggleServiceForDefaultInterval(interval.id, 'feeding')}
                                  className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                Pamaitinti
                              </label>
                              <label className="flex items-center gap-2 text-[11px] text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={interval.services.litter}
                                  onChange={() => toggleServiceForDefaultInterval(interval.id, 'litter')}
                                  className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                Kraikas
                              </label>
                              <label className="flex items-center gap-2 text-[11px] text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={interval.services.walking}
                                  onChange={() => toggleServiceForDefaultInterval(interval.id, 'walking')}
                                  className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                Pavedžioti
                              </label>
                            </div>
                          )}

                          <div className="mt-2">
                            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Ką reikės padaryti</label>
                            <input
                              type="text"
                              value={interval.task}
                              onChange={(changeEvent) => updateTaskForDefaultInterval(interval.id, changeEvent.target.value)}
                              placeholder="Pvz: pamaitinti, pakeisti kraiką"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>

                {intervalsError && <p className="text-xs text-red-600 mt-1">{intervalsError}</p>}
              </div>
            </div>

            {/* Pets selection */}
            <div className="order-2 border border-gray-200 rounded-lg p-3 bg-white">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Augintiniai *
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
                      className="px-4 py-2 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition text-sm font-semibold"
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
                                : prev.petIds.filter((petId) => petId !== pet.id),
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

            {/* Sitter selection */}
            <div className="order-1 border border-gray-200 rounded-lg p-3 bg-white">
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
                        €{selectedSitter.hourlyRate}/val · {selectedSitter.city}
                      </p>
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
                <select
                  required
                  value={formData.sitterProfileId}
                  onChange={(changeEvent) => {
                    setIsPriceManuallyEdited(false);
                    setFormData((prev) => ({
                      ...prev,
                      sitterProfileId: changeEvent.target.value,
                    }));
                    if (changeEvent.target.value) {
                      setIsSitterSelectorOpen(false);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Pasirinkite prižiūrėtoją</option>
                  {sitters.map((sitterProfile) => (
                    <option key={sitterProfile.id} value={sitterProfile.id}>
                      {sitterProfile.user?.name} - €{sitterProfile.hourlyRate}/val ({sitterProfile.city})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Address */}
            <div className="order-3 border border-gray-200 rounded-lg p-3 bg-white">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresas *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(changeEvent) => setFormData((prev) => ({ ...prev, address: changeEvent.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Gatvė 123, Vilnius"
              />
            </div>

    </>
  );

  const formSidebarFields = (
    <>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bendra kaina (€) *
              </label>
              {suggestedTotalPrice !== null && (
                <p className="text-xs text-gray-500 mb-2">
                  Siūloma kaina: €{suggestedTotalPrice} ({totalHoursAcrossRange.toFixed(1)} val. viso)
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
                  setFormData((prev) => ({
                    ...prev,
                    totalPrice: Number.isFinite(Number(changeEvent.target.value))
                      ? parseFloat(changeEvent.target.value)
                      : 0,
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pastabos prižiūrėtojui
              </label>
              <textarea
                rows={2}
                value={formData.notesForSitter}
                onChange={(changeEvent) => setFormData((prev) => ({ ...prev, notesForSitter: changeEvent.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Papildoma informacija prižiūrėtojui..."
              />
            </div>

            {/* Summary */}
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
                  <p className="text-gray-500">Viso vizitų</p>
                  <p className="font-semibold">{totalVisitsCount > 0 ? totalVisitsCount : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Konfliktai</p>
                  <p className={`font-semibold ${hasBusyConflict ? 'text-red-700' : 'text-green-700'}`}>
                    {busyLoading && formData.sitterProfileId ? 'Tikrinama...' : hasBusyConflict ? 'Yra' : 'Nėra'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Valandos</p>
                  <p className="font-semibold">{totalHoursAcrossRange > 0 ? `${totalHoursAcrossRange.toFixed(1)} val.` : '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Bendra kaina</p>
                  <p className="font-semibold text-lg">€{formData.totalPrice}</p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              {isSubmitDisabled && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{submitDisabledReason}</p>
                </div>
              )}

              {variant === 'modal' && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Atšaukti
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Kuriama...' : 'Sukurti rezervaciją'}
              </button>
            </div>
    </>
  );

  if (variant === 'page') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">Nauja rezervacija</h1>
              <p className="text-sm text-gray-600">Susidėliokite vizitus, datas ir pateikite rezervaciją.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 px-3 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Grįžti
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-4">
                {formMainFields}
              </div>
              <aside className="lg:col-span-1">
                <div className="lg:sticky lg:top-6 space-y-4">
                  {formSidebarFields}
                </div>
              </aside>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const handleBackdropClick = (clickEvent: React.MouseEvent<HTMLDivElement>) => {
    if (clickEvent.target === clickEvent.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
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
            {formMainFields}
            {formSidebarFields}
          </form>
        </div>
      </div>
    </div>
  );
}
