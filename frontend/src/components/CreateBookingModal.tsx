import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

const WORKING_DAY_START = '00:00';
const WORKING_DAY_END = '24:00';

const TRAVEL_BUFFER_MINUTES = 30;

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
  const toast = useToast();
  const { user } = useAuthStore();

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  const [, setPets] = useState<Pet[]>([]);
  const [sitters, setSitters] = useState<SitterProfile[]>([]);
  const [isPriceManuallyEdited, setIsPriceManuallyEdited] = useState(false);
  const [, setIsSitterSelectorOpen] = useState(!prefillSitterProfileId);
  const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
  const [busyLoading, setBusyLoading] = useState(false);
  const [, setBusyError] = useState('');
  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const initialAddress = user?.address ?? '';

  const generateIntervalId = useCallback(
    () => `interval-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    [],
  );

  const [selectedDates, setSelectedDates] = useState<Date[]>([new Date()]);

  const [visitTimeWindow, setVisitTimeWindow] = useState<'morning' | 'day' | 'evening' | 'custom'>('day');

  const [newVisitServices, setNewVisitServices] = useState(DEFAULT_INTERVAL_SERVICES);
  const [isNewVisitServicesAdvancedOpen, setIsNewVisitServicesAdvancedOpen] = useState(false);
  const [newVisitTaskTemplate, setNewVisitTaskTemplate] = useState('');

  const [showAllFreeTimeOptions, setShowAllFreeTimeOptions] = useState(false);

  const planningSectionRef = useRef<HTMLDivElement | null>(null);

  const [timeIntervalsByDate, setTimeIntervalsByDate] = useState<Record<string, TimeInterval[]>>({});

  const [formData, setFormData] = useState({
    petIds: [] as string[],
    sitterProfileId: prefillSitterProfileId ?? '',
    address: initialAddress,
    totalPrice: 0,
    notesForSitter: '',
  });

  const selectedSitter = sitters.find((sitter) => sitter.id === formData.sitterProfileId);

  const defaultStartTimeForWindow = useMemo(() => {
    if (visitTimeWindow === 'morning') return '09:00';
    if (visitTimeWindow === 'day') return '13:00';
    if (visitTimeWindow === 'evening') return '18:00';
    return '14:00';
  }, [visitTimeWindow]);

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
    const yearPart = date.getFullYear();
    const monthPart = String(date.getMonth() + 1).padStart(2, '0');
    const dayPart = String(date.getDate()).padStart(2, '0');
    return `${yearPart}-${monthPart}-${dayPart}`;
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

  useEffect(() => {
    const selectedIsoSet = new Set(getDateRangeDayIsos());
    setTimeIntervalsByDate((prev) => {
      const next: Record<string, TimeInterval[]> = {};
      for (const [dateIso, intervalsForDate] of Object.entries(prev)) {
        if (selectedIsoSet.has(dateIso)) {
          next[dateIso] = intervalsForDate;
        }
      }
      return next;
    });
  }, [getDateRangeDayIsos]);

  const getIntervalsForDate = useCallback(
    (dateIso: string) => {
      const overrideIntervals = timeIntervalsByDate[dateIso];
      return overrideIntervals ?? [];
    },
    [timeIntervalsByDate],
  );

  const getMergedBusyIntervalsByDate = useCallback(() => {
    const byDate = new Map<string, Array<{ startMinutes: number; endMinutes: number }>>();

    for (const slot of busySlots) {
      const startMinutes = parseTimeToMinutes(slot.timeStart);
      const endMinutes = parseTimeToMinutes(slot.timeEnd);
      if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) continue;
      if (endMinutes <= startMinutes) continue;

      const existing = byDate.get(slot.date);
      if (existing) {
        existing.push({ startMinutes, endMinutes });
      } else {
        byDate.set(slot.date, [{ startMinutes, endMinutes }]);
      }
    }

    for (const [dateIso, intervals] of byDate.entries()) {
      intervals.sort((first, second) => first.startMinutes - second.startMinutes);

      const merged: Array<{ startMinutes: number; endMinutes: number }> = [];
      for (const interval of intervals) {
        const last = merged[merged.length - 1];
        if (!last) {
          merged.push({ ...interval });
          continue;
        }

        if (interval.startMinutes <= last.endMinutes) {
          last.endMinutes = Math.max(last.endMinutes, interval.endMinutes);
          continue;
        }

        merged.push({ ...interval });
      }

      byDate.set(dateIso, merged);
    }

    return byDate;
  }, [busySlots, parseTimeToMinutes]);

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
    const validateIntervals = (intervalsToValidate: TimeInterval[], labelPrefix: string) => {
      if (intervalsToValidate.length === 0) {
        return '';
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
          return `${labelPrefix}: vizitas ${interval.timeStart}–${interval.timeEnd} neteisingas (pabaiga turi būti vėliau)`;
        }
      }

      for (let index = 1; index < normalized.length; index += 1) {
        const previous = normalized[index - 1];
        const current = normalized[index];
        if (current.startMinutes < previous.endMinutes) {
          return `${labelPrefix}: vizitai persidengia (${previous.timeStart}–${previous.timeEnd} ir ${current.timeStart}–${current.timeEnd})`;
        }
      }

      return '';
    };

    const totalVisitsAcrossSelectedDays = dayIsos.reduce((sum, dateIso) => sum + (timeIntervalsByDate[dateIso]?.length ?? 0), 0);
    if (dayIsos.length > 0 && totalVisitsAcrossSelectedDays === 0) {
      return 'Pridėkite bent vieną vizito laiką';
    }

    for (const dateIso of dayIsos) {
      const intervalsForDate = timeIntervalsByDate[dateIso] ?? [];
      const dateError = validateIntervals(intervalsForDate, `Diena ${dateIso}`);
      if (dateError) return dateError;
    }

    return '';
  }, [dayIsos, parseTimeToMinutes, timeIntervalsByDate]);

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
    const seen = new Set<string>();
    const busyIntervalsByDate = getMergedBusyIntervalsByDate();

    for (const dateIso of dayIsos) {
      const dayBusyIntervals = busyIntervalsByDate.get(dateIso) ?? [];
      if (dayBusyIntervals.length === 0) continue;

      const intervalsForDay = getIntervalsForDate(dateIso);
      for (const interval of intervalsForDay) {
        const selectedStart = parseTimeToMinutes(interval.timeStart);
        const selectedEnd = parseTimeToMinutes(interval.timeEnd);
        if (!Number.isFinite(selectedStart) || !Number.isFinite(selectedEnd)) continue;

        const selectedStartBuffered = Math.max(0, selectedStart - TRAVEL_BUFFER_MINUTES);
        const selectedEndBuffered = selectedEnd + TRAVEL_BUFFER_MINUTES;

        for (const busyInterval of dayBusyIntervals) {
          const busyStartBuffered = Math.max(0, busyInterval.startMinutes - TRAVEL_BUFFER_MINUTES);
          const busyEndBuffered = busyInterval.endMinutes + TRAVEL_BUFFER_MINUTES;

          if (selectedStartBuffered < busyEndBuffered && selectedEndBuffered > busyStartBuffered) {
            const timeStart = formatMinutesToTime(busyInterval.startMinutes);
            const timeEnd = formatMinutesToTime(busyInterval.endMinutes);
            const key = `${dateIso}|${timeStart}|${timeEnd}`;
            if (seen.has(key)) continue;
            seen.add(key);
            overlaps.push({ date: dateIso, timeStart, timeEnd });
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
  }, [dateError, formData.sitterProfileId, formatMinutesToTime, getIntervalsForDate, getMergedBusyIntervalsByDate, intervalsError, parseTimeToMinutes, dayIsos]);

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

  // Calculate availability status for each day (for calendar coloring)
  const availabilityByDate = useMemo(() => {
    const result = new Map<string, DayStatus>();

    if (!formData.sitterProfileId || dateError || intervalsError) return result;

    const byDate = getMergedBusyIntervalsByDate();

    for (const dateIso of dayIsos) {
      const dayBusyIntervals = byDate.get(dateIso) ?? [];

      let totalIntervalMinutes = 0;
      let conflictMinutes = 0;

      const intervalsForDay = getIntervalsForDate(dateIso);
      for (const interval of intervalsForDay) {
        const intervalStart = parseTimeToMinutes(interval.timeStart);
        const intervalEnd = parseTimeToMinutes(interval.timeEnd);
        if (!Number.isFinite(intervalStart) || !Number.isFinite(intervalEnd)) continue;

        const intervalStartBuffered = Math.max(0, intervalStart - TRAVEL_BUFFER_MINUTES);
        const intervalEndBuffered = intervalEnd + TRAVEL_BUFFER_MINUTES;

        const intervalDuration = intervalEndBuffered - intervalStartBuffered;
        if (intervalDuration <= 0) continue;

        totalIntervalMinutes += intervalDuration;

        // Check overlap with busy slots
        for (const busyInterval of dayBusyIntervals) {
          const busyStartBuffered = Math.max(0, busyInterval.startMinutes - TRAVEL_BUFFER_MINUTES);
          const busyEndBuffered = busyInterval.endMinutes + TRAVEL_BUFFER_MINUTES;

          const overlapStart = Math.max(intervalStartBuffered, busyStartBuffered);
          const overlapEnd = Math.min(intervalEndBuffered, busyEndBuffered);
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
  }, [dateError, dayIsos, formData.sitterProfileId, getIntervalsForDate, getMergedBusyIntervalsByDate, intervalsError, parseTimeToMinutes]);

  const daySummaries = useMemo(() => {
    return dayIsos.map((dateIso) => {
      const status = availabilityByDate.get(dateIso) ?? 'free';
      const hasOverride = Boolean(timeIntervalsByDate[dateIso]);
      return { dateIso, status, hasOverride };
    });
  }, [availabilityByDate, dayIsos, timeIntervalsByDate]);

  const selectedDayIntervals = useMemo(() => {
    if (!selectedDayIso) return null;
    return getIntervalsForDate(selectedDayIso);
  }, [getIntervalsForDate, selectedDayIso]);

  const selectedDayConflictingVisitId = useMemo(() => {
    if (!selectedDayIso) return null;
    if (!selectedDayIntervals) return null;

    const mergedBusyIntervals = getMergedBusyIntervalsByDate().get(selectedDayIso) ?? [];
    const normalizedIntervals = selectedDayIntervals
      .map((interval) => ({
        id: interval.id,
        startMinutes: parseTimeToMinutes(interval.timeStart),
        endMinutes: parseTimeToMinutes(interval.timeEnd),
      }))
      .filter((interval) => Number.isFinite(interval.startMinutes) && Number.isFinite(interval.endMinutes))
      .filter((interval) => interval.endMinutes > interval.startMinutes)
      .map((interval) => ({
        ...interval,
        startMinutesBuffered: Math.max(0, interval.startMinutes - TRAVEL_BUFFER_MINUTES),
        endMinutesBuffered: interval.endMinutes + TRAVEL_BUFFER_MINUTES,
      }))
      .sort((first, second) => first.startMinutesBuffered - second.startMinutesBuffered);

    for (const interval of normalizedIntervals) {
      const overlapsBusy = mergedBusyIntervals.some((busyInterval) => {
        const busyStartBuffered = Math.max(0, busyInterval.startMinutes - TRAVEL_BUFFER_MINUTES);
        const busyEndBuffered = busyInterval.endMinutes + TRAVEL_BUFFER_MINUTES;
        return interval.startMinutesBuffered < busyEndBuffered && interval.endMinutesBuffered > busyStartBuffered;
      });
      if (overlapsBusy) return interval.id;
    }

    for (let index = 1; index < normalizedIntervals.length; index += 1) {
      const previousInterval = normalizedIntervals[index - 1];
      const currentInterval = normalizedIntervals[index];
      if (currentInterval.startMinutesBuffered < previousInterval.endMinutesBuffered) {
        return currentInterval.id;
      }
    }

    return null;
  }, [getMergedBusyIntervalsByDate, parseTimeToMinutes, selectedDayIntervals, selectedDayIso]);

  const getMergedBlockedIntervalsForDate = useCallback(
    (dateIso: string) => {
      const workingStartMinutes = parseTimeToMinutes(WORKING_DAY_START);
      const workingEndMinutes = parseTimeToMinutes(WORKING_DAY_END);
      if (!Number.isFinite(workingStartMinutes) || !Number.isFinite(workingEndMinutes)) {
        return [] as Array<{ startMinutes: number; endMinutes: number }>;
      }

      const mergedBusyIntervalsRaw = getMergedBusyIntervalsByDate().get(dateIso) ?? [];
      const intervalsForDay = getIntervalsForDate(dateIso);

      const blockedIntervalsRaw: Array<{ startMinutes: number; endMinutes: number }> = [];

      for (const busyInterval of mergedBusyIntervalsRaw) {
        const bufferedStart = Math.max(0, busyInterval.startMinutes - TRAVEL_BUFFER_MINUTES);
        const bufferedEnd = busyInterval.endMinutes + TRAVEL_BUFFER_MINUTES;

        const clampedStart = Math.max(workingStartMinutes, bufferedStart);
        const clampedEnd = Math.min(workingEndMinutes, bufferedEnd);
        if (clampedEnd <= clampedStart) continue;
        blockedIntervalsRaw.push({ startMinutes: clampedStart, endMinutes: clampedEnd });
      }

      for (const visitInterval of intervalsForDay) {
        const startMinutes = parseTimeToMinutes(visitInterval.timeStart);
        const endMinutes = parseTimeToMinutes(visitInterval.timeEnd);
        if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) continue;
        if (endMinutes <= startMinutes) continue;

        const bufferedStart = Math.max(0, startMinutes - TRAVEL_BUFFER_MINUTES);
        const bufferedEnd = endMinutes + TRAVEL_BUFFER_MINUTES;

        const clampedStart = Math.max(workingStartMinutes, bufferedStart);
        const clampedEnd = Math.min(workingEndMinutes, bufferedEnd);
        if (clampedEnd <= clampedStart) continue;

        blockedIntervalsRaw.push({ startMinutes: clampedStart, endMinutes: clampedEnd });
      }

      blockedIntervalsRaw.sort((first, second) => first.startMinutes - second.startMinutes);

      const mergedBlockedIntervals: Array<{ startMinutes: number; endMinutes: number }> = [];
      for (const interval of blockedIntervalsRaw) {
        const lastInterval = mergedBlockedIntervals[mergedBlockedIntervals.length - 1];
        if (!lastInterval) {
          mergedBlockedIntervals.push({ ...interval });
          continue;
        }

        if (interval.startMinutes <= lastInterval.endMinutes) {
          lastInterval.endMinutes = Math.max(lastInterval.endMinutes, interval.endMinutes);
          continue;
        }

        mergedBlockedIntervals.push({ ...interval });
      }

      return mergedBlockedIntervals;
    },
    [getIntervalsForDate, getMergedBusyIntervalsByDate, parseTimeToMinutes],
  );

  const getFreeIntervalsFromBusyOnlyForDate = useCallback(
    (dateIso: string) => {
      const workingStartMinutes = parseTimeToMinutes(WORKING_DAY_START);
      const workingEndMinutes = parseTimeToMinutes(WORKING_DAY_END);
      if (!Number.isFinite(workingStartMinutes) || !Number.isFinite(workingEndMinutes)) {
        return [] as Array<{ startMinutes: number; endMinutes: number }>;
      }

      const mergedBusyIntervalsRaw = getMergedBusyIntervalsByDate().get(dateIso) ?? [];

      const blockedIntervalsRaw: Array<{ startMinutes: number; endMinutes: number }> = [];

      for (const busyInterval of mergedBusyIntervalsRaw) {
        const bufferedStart = Math.max(0, busyInterval.startMinutes - TRAVEL_BUFFER_MINUTES);
        const bufferedEnd = busyInterval.endMinutes + TRAVEL_BUFFER_MINUTES;

        const clampedStart = Math.max(workingStartMinutes, bufferedStart);
        const clampedEnd = Math.min(workingEndMinutes, bufferedEnd);
        if (clampedEnd <= clampedStart) continue;
        blockedIntervalsRaw.push({ startMinutes: clampedStart, endMinutes: clampedEnd });
      }

      blockedIntervalsRaw.sort((first, second) => first.startMinutes - second.startMinutes);

      const mergedBlockedIntervals: Array<{ startMinutes: number; endMinutes: number }> = [];
      for (const interval of blockedIntervalsRaw) {
        const lastInterval = mergedBlockedIntervals[mergedBlockedIntervals.length - 1];
        if (!lastInterval) {
          mergedBlockedIntervals.push({ ...interval });
          continue;
        }

        if (interval.startMinutes <= lastInterval.endMinutes) {
          lastInterval.endMinutes = Math.max(lastInterval.endMinutes, interval.endMinutes);
          continue;
        }

        mergedBlockedIntervals.push({ ...interval });
      }

      const freeIntervals: Array<{ startMinutes: number; endMinutes: number }> = [];
      let cursorMinutes = workingStartMinutes;

      for (const blockedInterval of mergedBlockedIntervals) {
        if (cursorMinutes < blockedInterval.startMinutes) {
          freeIntervals.push({
            startMinutes: cursorMinutes,
            endMinutes: blockedInterval.startMinutes,
          });
        }

        cursorMinutes = Math.max(cursorMinutes, blockedInterval.endMinutes);
        if (cursorMinutes >= workingEndMinutes) break;
      }

      if (cursorMinutes < workingEndMinutes) {
        freeIntervals.push({
          startMinutes: cursorMinutes,
          endMinutes: workingEndMinutes,
        });
      }

      return freeIntervals.filter((interval) => interval.startMinutes < interval.endMinutes);
    },
    [getMergedBusyIntervalsByDate, parseTimeToMinutes],
  );

  const findNextFreeStartMinutes = useCallback(
    (
      freeIntervals: Array<{ startMinutes: number; endMinutes: number }>,
      preferredStartMinutes: number,
      durationMinutes: number,
    ) => {
      if (!Number.isFinite(preferredStartMinutes)) return null;
      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return null;

      for (const freeInterval of freeIntervals) {
        const usableStartMinutes = freeInterval.startMinutes + TRAVEL_BUFFER_MINUTES;
        const usableEndMinutes = freeInterval.endMinutes - TRAVEL_BUFFER_MINUTES;
        if (usableEndMinutes - usableStartMinutes < durationMinutes) continue;

        const candidateStartMinutes = Math.max(preferredStartMinutes, usableStartMinutes);
        if (candidateStartMinutes + durationMinutes <= usableEndMinutes) {
          return candidateStartMinutes;
        }
      }

      return null;
    },
    [],
  );

  useEffect(() => {
    if (!formData.sitterProfileId) return;
    if (dayIsos.length === 0) return;

    const durationMinutes = getDurationMinutesForServices(newVisitServices);
    const preferredStartMinutes = parseTimeToMinutes(defaultStartTimeForWindow);

    setTimeIntervalsByDate((prev) => {
      const next = { ...prev };
      let didChange = false;

      for (const dateIso of dayIsos) {
        if (next[dateIso] && next[dateIso].length > 0) continue;

        const freeIntervals = getFreeIntervalsFromBusyOnlyForDate(dateIso);
        const nextStartMinutes = findNextFreeStartMinutes(
          freeIntervals,
          Number.isFinite(preferredStartMinutes) ? preferredStartMinutes : 0,
          durationMinutes,
        );

        const resolvedStartMinutes =
          nextStartMinutes ?? (Number.isFinite(preferredStartMinutes) ? preferredStartMinutes : 0);

        next[dateIso] = [
          {
            id: generateIntervalId(),
            timeStart: formatMinutesToTime(resolvedStartMinutes),
            timeEnd: formatMinutesToTime(resolvedStartMinutes + durationMinutes),
            services: { ...newVisitServices },
            task: newVisitTaskTemplate.trim() || formatServicesLabel(newVisitServices),
          },
        ];

        didChange = true;
      }

      return didChange ? next : prev;
    });
  }, [dayIsos, defaultStartTimeForWindow, findNextFreeStartMinutes, formData.sitterProfileId, formatMinutesToTime, formatServicesLabel, generateIntervalId, getDurationMinutesForServices, getFreeIntervalsFromBusyOnlyForDate, newVisitServices, newVisitTaskTemplate, parseTimeToMinutes]);

  const selectedDayFreeIntervals = useMemo(() => {
    if (!selectedDayIso) {
      return [] as Array<{ start: string; end: string; startMinutes: number; endMinutes: number }>;
    }

    const workingStartMinutes = parseTimeToMinutes(WORKING_DAY_START);
    const workingEndMinutes = parseTimeToMinutes(WORKING_DAY_END);
    if (!Number.isFinite(workingStartMinutes) || !Number.isFinite(workingEndMinutes)) {
      return [];
    }

    const mergedBlockedIntervals = getMergedBlockedIntervalsForDate(selectedDayIso);

    const freeIntervals: Array<{ start: string; end: string; startMinutes: number; endMinutes: number }> = [];
    let cursorMinutes = workingStartMinutes;

    for (const blockedInterval of mergedBlockedIntervals) {
      if (cursorMinutes < blockedInterval.startMinutes) {
        freeIntervals.push({
          start: formatMinutesToTime(cursorMinutes),
          end: formatMinutesToTime(blockedInterval.startMinutes),
          startMinutes: cursorMinutes,
          endMinutes: blockedInterval.startMinutes,
        });
      }

      cursorMinutes = Math.max(cursorMinutes, blockedInterval.endMinutes);
      if (cursorMinutes >= workingEndMinutes) break;
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
  }, [formatMinutesToTime, getMergedBlockedIntervalsForDate, parseTimeToMinutes, selectedDayIso]);

  const suggestedNextFreeVisitStartMinutes = useMemo(() => {
    if (!selectedDayIso) return null;

    const durationMinutes = getDurationMinutesForServices(newVisitServices);
    const preferredStartMinutes = parseTimeToMinutes(defaultStartTimeForWindow);
    if (!Number.isFinite(preferredStartMinutes)) return null;

    return findNextFreeStartMinutes(
      selectedDayFreeIntervals,
      preferredStartMinutes,
      durationMinutes,
    );
  }, [defaultStartTimeForWindow, findNextFreeStartMinutes, getDurationMinutesForServices, newVisitServices, parseTimeToMinutes, selectedDayFreeIntervals, selectedDayIso]);

  useEffect(() => {
    setShowAllFreeTimeOptions(false);
  }, [selectedDayIso]);

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

  const addVisitFromFreeIntervalForSelectedDay = useCallback(
    (freeStartMinutes: number, freeEndMinutes: number) => {
      if (!selectedDayIso) return;

      const durationMinutes = getDurationMinutesForServices(newVisitServices);
      const visitEndMinutes = Math.min(freeEndMinutes, freeStartMinutes + durationMinutes);
      if (visitEndMinutes <= freeStartMinutes) return;

      setSelectedDayIntervals(selectedDayIso, [
        ...getIntervalsForDate(selectedDayIso),
        {
          id: generateIntervalId(),
          timeStart: formatMinutesToTime(freeStartMinutes),
          timeEnd: formatMinutesToTime(visitEndMinutes),
          services: { ...newVisitServices },
          task: newVisitTaskTemplate.trim() || formatServicesLabel(newVisitServices),
        },
      ]);
    },
    [
      formatServicesLabel,
      formatMinutesToTime,
      generateIntervalId,
      getDurationMinutesForServices,
      getIntervalsForDate,
      newVisitServices,
      newVisitTaskTemplate,
      selectedDayIso,
      setSelectedDayIntervals,
    ],
  );

  const applyFreeTimeForSelectedDay = useCallback(
    (startMinutes: number) => {
      if (!selectedDayIso) return;
      if (!Number.isFinite(startMinutes)) return;

      const currentIntervals = getIntervalsForDate(selectedDayIso);

      // If there is a conflict, move the first conflicting visit to the chosen start.
      if (selectedDayConflictingVisitId) {
        const nextIntervals = currentIntervals.map((interval) => {
          if (interval.id !== selectedDayConflictingVisitId) return interval;

          const durationMinutes = getDurationMinutesForServices(interval.services);
          const nextEndMinutes = startMinutes + durationMinutes;

          return {
            ...interval,
            timeStart: formatMinutesToTime(startMinutes),
            timeEnd: formatMinutesToTime(nextEndMinutes),
          };
        });

        setSelectedDayIntervals(selectedDayIso, nextIntervals);
        return;
      }

      const durationMinutes = getDurationMinutesForServices(newVisitServices);
      const matchingFreeInterval = selectedDayFreeIntervals.find(
        (interval) => interval.startMinutes === startMinutes || (startMinutes >= interval.startMinutes && startMinutes < interval.endMinutes),
      );
      const freeEndMinutes = matchingFreeInterval ? matchingFreeInterval.endMinutes : startMinutes + durationMinutes;

      addVisitFromFreeIntervalForSelectedDay(startMinutes, freeEndMinutes);
    },
    [
      addVisitFromFreeIntervalForSelectedDay,
      formatMinutesToTime,
      getDurationMinutesForServices,
      getIntervalsForDate,
      newVisitServices,
      selectedDayConflictingVisitId,
      selectedDayFreeIntervals,
      selectedDayIso,
      setSelectedDayIntervals,
    ],
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

  const toggleNewVisitService = (serviceKey: keyof TimeInterval['services']) => {
    setIsNewVisitServicesAdvancedOpen(true);
    setNewVisitServices((prev) => ({
      ...prev,
      [serviceKey]: !prev[serviceKey],
    }));
  };

  const setVisitsCountForSelectedDay = (visitsCount: number) => {
    if (!selectedDayIso) return;

    const durationMinutes = getDurationMinutesForServices(newVisitServices);
    const freeIntervals = getFreeIntervalsFromBusyOnlyForDate(selectedDayIso);
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

        const normalizedSlots: BusySlot[] = [];
        const seenSlotKeys = new Set<string>();

        for (const slot of slots) {
          const normalizedDate = slot.date.length >= 10 ? slot.date.slice(0, 10) : slot.date;
          const normalizedTimeStart = slot.timeStart.length >= 5 ? slot.timeStart.slice(0, 5) : slot.timeStart;
          const normalizedTimeEnd = slot.timeEnd.length >= 5 ? slot.timeEnd.slice(0, 5) : slot.timeEnd;

          const startMinutes = parseTimeToMinutes(normalizedTimeStart);
          const endMinutes = parseTimeToMinutes(normalizedTimeEnd);
          if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) continue;
          if (endMinutes <= startMinutes) continue;

          const key = `${normalizedDate}|${normalizedTimeStart}|${normalizedTimeEnd}`;
          if (seenSlotKeys.has(key)) continue;
          seenSlotKeys.add(key);

          normalizedSlots.push({
            date: normalizedDate,
            timeStart: normalizedTimeStart,
            timeEnd: normalizedTimeEnd,
          });
        }

        normalizedSlots.sort((firstSlot, secondSlot) => {
          if (firstSlot.date !== secondSlot.date) return firstSlot.date.localeCompare(secondSlot.date);
          return firstSlot.timeStart.localeCompare(secondSlot.timeStart);
        });

        if (!canceled) setBusySlots(normalizedSlots);
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
  }, [dateFromIso, dateToIso, formData.sitterProfileId, parseTimeToMinutes]);

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

  const pricePerVisit = useMemo(() => {
    if (totalVisitsCount <= 0) return 0;
    return Math.round((formData.totalPrice / totalVisitsCount) * 100) / 100;
  }, [formData.totalPrice, totalVisitsCount]);

  const step1IsValid = useMemo(() => {
    return Boolean(formData.sitterProfileId && formData.petIds.length > 0 && formData.address.trim());
  }, [formData.address, formData.petIds.length, formData.sitterProfileId]);

  const step2IsValid = useMemo(() => {
    if (!step1IsValid) return false;
    if (busyLoading) return false;
    if (dateError) return false;
    if (intervalsError) return false;
    if (hasBusyConflict) return false;
    return true;
  }, [busyLoading, dateError, hasBusyConflict, intervalsError, step1IsValid]);

  const addressIsValid = Boolean(formData.address.trim());
  const priceIsValid = Number.isFinite(formData.totalPrice) && formData.totalPrice > 0;
  const step3IsValid = step2IsValid;
  const step4IsValid = !isSubmitDisabled;

  const goToStep = useCallback(
    (nextStep: 1 | 2 | 3 | 4) => {
      if (nextStep === 1) {
        setActiveStep(1);
        return;
      }

      if (nextStep === 2) {
        if (!step1IsValid) {
          toast.error('Užpildykite prižiūrėtoją, augintinius ir adresą.');
          return;
        }
        setActiveStep(2);
        requestAnimationFrame(() => {
          planningSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        return;
      }

      if (!step2IsValid) {
        toast.error('Patikrinkite datas/laikus — yra klaidų arba konfliktų.');
        return;
      }

      if (nextStep === 3) {
        setActiveStep(3);
        return;
      }

      setActiveStep(4);
    },
    [step1IsValid, step2IsValid, toast],
  );

  const formMainFields = (
    <>
      <div className="order-0 border border-rose-200 rounded-lg p-3 bg-white">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-gray-900">Rezervacija</p>
          <p className="text-xs text-gray-600">Žingsnis {activeStep} iš 4</p>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToStep(1)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              activeStep === 1
                ? 'bg-purple-600 border-purple-600 text-white'
                : step1IsValid
                  ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100'
                  : 'bg-white border-rose-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            1. Informacija
          </button>
          <button
            type="button"
            onClick={() => goToStep(2)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              activeStep === 2
                ? 'bg-purple-600 border-purple-600 text-white'
                : step2IsValid
                  ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100'
                  : 'bg-white border-rose-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            2. Datos ir laikai
          </button>
          <button
            type="button"
            onClick={() => goToStep(3)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              activeStep === 3
                ? 'bg-purple-600 border-purple-600 text-white'
                : step3IsValid
                  ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100'
                  : 'bg-white border-rose-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            3. Vizito nustatymai
          </button>
          <button
            type="button"
            onClick={() => goToStep(4)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              activeStep === 4
                ? 'bg-purple-600 border-purple-600 text-white'
                : step4IsValid
                  ? 'bg-green-50 border-green-300 text-green-800 hover:bg-green-100'
                  : 'bg-white border-rose-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            4. Patvirtinimas
          </button>
        </div>
      </div>

      {error && (
        <div className="order-0 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className={activeStep === 1 ? '' : 'hidden'}>
        <div className="order-1 border border-rose-200 rounded-lg p-3 bg-white">
          <p className="text-sm font-semibold text-gray-900 mb-2">Kliento informacija</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700">
            <div>
              <p className="text-gray-500">Vardas</p>
              <p className="font-semibold">{user?.name ?? '-'}</p>
            </div>
            <div>
              <p className="text-gray-500">El. paštas</p>
              <p className="font-semibold">{user?.email ?? '-'}</p>
            </div>
            <div>
              <p className="text-gray-500">Telefonas</p>
              <p className="font-semibold">{user?.phone ?? '-'}</p>
            </div>
          </div>
        </div>
      </div>

            <div
              ref={planningSectionRef}
              className={`${activeStep === 2 ? '' : 'hidden'} order-4 border ${step2IsValid ? 'border-green-200' : 'border-rose-200'} rounded-lg p-3 bg-white`}
            >
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

              <div className="relative">
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${isPlanningEnabled ? '' : 'opacity-40 pointer-events-none'}`}>
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Kalendorius</p>
                        <p className="text-xs text-gray-600">Pasirinkta: {daysCount} d.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isPlanningEnabled) return;
                          setSelectedDates([]);
                          setSelectedDayIso(null);
                        }}
                        disabled={!isPlanningEnabled || selectedDates.length === 0}
                        className={`text-[11px] font-semibold px-2 py-1 rounded-md border ${
                          !isPlanningEnabled || selectedDates.length === 0
                            ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'text-gray-700 border-rose-200 hover:text-gray-900 hover:border-rose-300 bg-white'
                        }`}
                      >
                        Išvalyti pasirinkimą
                      </button>
                    </div>

                    <div className="mx-auto w-fit">
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
                      />
                    </div>

                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Spalvų paaiškinimas</p>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
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
                    </div>
                  </div>

                  <div>
                    {!selectedDayIso && (
                      <div className="border border-dashed border-rose-300 rounded-lg p-4 text-center text-xs text-gray-600 bg-rose-50/30">
                        <p className="font-semibold text-gray-800 mb-1">Pasirinkite dieną kalendoriuje</p>
                        <p>Matysite tos dienos laisvus laikus ir galėsite sudėlioti vizitus.</p>
                      </div>
                    )}

                    {isPlanningEnabled && selectedDayIso && selectedDayIntervals && (
                      <div className="mt-4 border-t border-rose-200 pt-4 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-gray-700">Vizitai šiai dienai</p>
                            <p className="text-[11px] text-gray-500">
                              {selectedDayIntervals.length} viz. · rekomenduojama trukmė {getDurationMinutesForServices(newVisitServices)} min.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold text-gray-700">Kiek vizitų šią dieną?</p>
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

                        <div className="grid gap-3 lg:grid-cols-2">
                          <div className="border border-green-200 rounded-lg p-3 bg-green-50/60">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <p className="text-xs font-semibold text-gray-800">Automatinė rekomendacija</p>
                              {selectedDayConflictingVisitId ? (
                                <span className="text-[11px] font-semibold text-red-700">Yra konfliktas</span>
                              ) : (
                                <span className="text-[11px] font-semibold text-green-700">Visi vizitai telpa</span>
                              )}
                            </div>

                            {selectedDayFreeIntervals.length === 0 ? (
                              <p className="text-xs text-gray-600">Šiai dienai laisvų langų nebėra.</p>
                            ) : suggestedNextFreeVisitStartMinutes !== null ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => applyFreeTimeForSelectedDay(suggestedNextFreeVisitStartMinutes)}
                                  className="text-[11px] px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition"
                                >
                                  {selectedDayConflictingVisitId
                                    ? `Pataisyti laiką (${formatMinutesToTime(suggestedNextFreeVisitStartMinutes)})`
                                    : `Pridėti artimiausią (${formatMinutesToTime(suggestedNextFreeVisitStartMinutes)})`}
                                </button>
                                <span className="text-[11px] text-gray-600">
                                  Trukmė: {getDurationMinutesForServices(newVisitServices)} min.
                                </span>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-600">Šiai dienai laisvų langų nebėra.</p>
                            )}
                          </div>

                          <div className="border border-rose-200 rounded-lg p-3 bg-white">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <p className="text-xs font-semibold text-gray-800">
                                Visi laisvi intervalai ({selectedDayFreeIntervals.length})
                              </p>
                              {selectedDayFreeIntervals.length > 8 && (
                                <button
                                  type="button"
                                  onClick={() => setShowAllFreeTimeOptions((prev) => !prev)}
                                  className="text-[11px] font-semibold text-purple-700 hover:text-purple-800"
                                >
                                  {showAllFreeTimeOptions ? 'Rodyti mažiau' : 'Rodyti visą sąrašą'}
                                </button>
                              )}
                            </div>

                            {selectedDayFreeIntervals.length === 0 ? (
                              <p className="text-xs text-gray-600">Laisvų langų nėra – pabandykite kitą dieną.</p>
                            ) : (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {(showAllFreeTimeOptions ? selectedDayFreeIntervals : selectedDayFreeIntervals.slice(0, 8))
                                  .filter((freeInterval) => freeInterval.endMinutes - freeInterval.startMinutes >= getDurationMinutesForServices(newVisitServices))
                                  .map((freeInterval) => (
                                    <button
                                      key={`${freeInterval.start}-${freeInterval.end}`}
                                      type="button"
                                      onClick={() => applyFreeTimeForSelectedDay(freeInterval.startMinutes + TRAVEL_BUFFER_MINUTES)}
                                      className="text-[11px] px-2 py-1 rounded border border-rose-200 text-gray-800 hover:bg-gray-50 transition"
                                    >
                                      {formatMinutesToTime(freeInterval.startMinutes + TRAVEL_BUFFER_MINUTES)}–{formatMinutesToTime(
                                        freeInterval.endMinutes - TRAVEL_BUFFER_MINUTES,
                                      )}
                                    </button>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          {selectedDayIntervals.map((interval) => {
                            const intervalIsConflicting = selectedDayConflictingVisitId === interval.id;
                            return (
                              <div
                                key={interval.id}
                                className={`rounded-lg border p-2 ${
                                  intervalIsConflicting ? 'border-red-300 bg-red-50' : 'border-rose-200 bg-white'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="time"
                                    value={interval.timeStart}
                                    onChange={(changeEvent) =>
                                      updateIntervalForSelectedDay(interval.id, 'timeStart', changeEvent.target.value)
                                    }
                                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 text-sm ${
                                      intervalIsConflicting
                                        ? 'border-red-300 focus:ring-red-400 focus:border-red-400 bg-white'
                                        : 'border-rose-300 focus:ring-rose-500 focus:border-rose-500'
                                    }`}
                                  />
                                  <span className="text-gray-400">–</span>
                                  <input
                                    type="time"
                                    value={interval.timeEnd}
                                    onChange={(changeEvent) =>
                                      updateIntervalForSelectedDay(interval.id, 'timeEnd', changeEvent.target.value)
                                    }
                                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 text-sm ${
                                      intervalIsConflicting
                                        ? 'border-red-300 focus:ring-red-400 focus:border-red-400 bg-white'
                                        : 'border-rose-300 focus:ring-rose-500 focus:border-rose-500'
                                    }`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeIntervalForSelectedDay(interval.id)}
                                    className={`text-[11px] font-semibold text-red-700 hover:text-red-800`}
                                  >
                                    Šalinti
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div
              className={`${activeStep === 1 ? '' : 'hidden'} order-3 border ${addressIsValid ? 'border-green-200' : 'border-rose-200'} rounded-lg p-3 bg-white`}
            >
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresas *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(changeEvent) => setFormData((prev) => ({ ...prev, address: changeEvent.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${
                  addressIsValid
                    ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                    : 'border-rose-300 focus:ring-rose-500 focus:border-rose-500'
                }`}
                placeholder="Gatvė 123, Vilnius"
              />
            </div>

      <div className={`${activeStep === 3 ? '' : 'hidden'} order-8 border border-rose-200 rounded-lg p-3 bg-white`}>
        <p className="text-sm font-semibold text-gray-900 mb-2">Vizito nustatymai</p>

        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-700 mb-1">Laiko intervalas</p>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'morning' as const, label: 'Rytas' },
              { key: 'day' as const, label: 'Diena' },
              { key: 'evening' as const, label: 'Vakaras' },
              { key: 'custom' as const, label: 'Kita' },
            ].map((timeWindowOption) => {
              const isActive = visitTimeWindow === timeWindowOption.key;
              return (
                <button
                  key={timeWindowOption.key}
                  type="button"
                  onClick={() => setVisitTimeWindow(timeWindowOption.key)}
                  className={`text-[11px] px-2 py-1 rounded border transition ${
                    isActive
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'bg-white border-rose-200 text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {timeWindowOption.label}
                </button>
              );
            })}
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
                      : 'bg-white border-rose-200 text-gray-800 hover:bg-gray-50'
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
                  className="h-4 w-4 text-purple-600 border-rose-300 rounded focus:ring-rose-500"
                />
                Pamaitinti
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={newVisitServices.litter}
                  onChange={() => toggleNewVisitService('litter')}
                  className="h-4 w-4 text-purple-600 border-rose-300 rounded focus:ring-rose-500"
                />
                Kraikas
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={newVisitServices.walking}
                  onChange={() => toggleNewVisitService('walking')}
                  className="h-4 w-4 text-purple-600 border-rose-300 rounded focus:ring-rose-500"
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
              className="w-full px-3 py-2 border border-rose-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />

            <div className="mt-2 flex flex-wrap gap-2">
              {['Pamaitinti', 'Kraikas', 'Pavedžioti', 'Vanduo'].map((taskTag) => (
                <button
                  key={taskTag}
                  type="button"
                  onClick={() => {
                    setNewVisitTaskTemplate((prev) => {
                      const trimmed = prev.trim();
                      const nextValue = trimmed ? `${trimmed}, ${taskTag}` : taskTag;
                      return nextValue;
                    });
                  }}
                  className="text-[11px] px-2 py-1 rounded bg-gray-50 border border-rose-200 text-gray-800 hover:bg-gray-100 transition"
                >
                  {taskTag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`${activeStep === 4 ? '' : 'hidden'} order-9 border ${priceIsValid ? 'border-green-200' : 'border-rose-200'} rounded-lg p-3 bg-white`}
      >
        <label className="block text-sm font-medium text-gray-700 mb-1">Bendra kaina (€) *</label>
        {suggestedTotalPrice !== null && (
          <p className="text-xs text-gray-500 mb-2">Siūloma kaina: €{suggestedTotalPrice} ({totalHoursAcrossRange.toFixed(1)} val. viso)</p>
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
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 ${
            priceIsValid
              ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
              : 'border-rose-300 focus:ring-rose-500 focus:border-rose-500'
          }`}
        />

        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Pastabos prižiūrėtojui</label>
          <textarea
            rows={3}
            value={formData.notesForSitter}
            onChange={(changeEvent) => setFormData((prev) => ({ ...prev, notesForSitter: changeEvent.target.value }))}
            className="w-full px-3 py-2 border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            placeholder="Papildoma informacija prižiūrėtojui..."
          />
        </div>
      </div>
    </>
  );

  const formSidebarFields = (
    <>
            {/* Summary */}
            <div className="border border-rose-200 rounded-lg p-3 bg-gray-50">
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
                <div className="col-span-2">
                  <p className="text-gray-500">Skaičiavimas</p>
                  <p className="font-semibold">{daysCount} d. × €{pricePerVisit.toFixed(2)} = €{formData.totalPrice}</p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              {activeStep === 4 && isSubmitDisabled && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{submitDisabledReason}</p>
                </div>
              )}

              {activeStep > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveStep((prev) => {
                      if (prev === 4) return 3;
                      if (prev === 3) return 2;
                      return 1;
                    })
                  }
                  className="w-full px-4 py-2 border border-rose-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Atgal
                </button>
              )}

              {activeStep < 4 && (
                <button
                  type="button"
                  onClick={() => goToStep((activeStep + 1) as 2 | 3 | 4)}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  Toliau
                </button>
              )}

              {variant === 'modal' && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full px-4 py-2 border border-rose-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Atšaukti
                </button>
              )}

              <button
                type="submit"
                disabled={activeStep !== 4 || isSubmitDisabled}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Pateikiama...' : 'Pateikti rezervaciją'}
              </button>
            </div>
    </>
  );

  if (variant === 'page') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">Nauja rezervacija</h1>
              <p className="text-sm text-gray-600">Susidėliokite vizitus, datas ir pateikite rezervaciją.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 px-3 py-2 text-sm font-semibold text-gray-700 bg-white border border-rose-200 rounded-lg hover:bg-gray-50 transition"
            >
              Grįžti
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-rose-200 p-6">
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
