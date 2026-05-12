import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  ListChecks,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  db,
  getConfiguredTimeZone,
  getCurrentDateInTimeZone,
  getNowMinutesInTimeZone,
  getTodayInTimeZone,
} from '@focuspoint/shared/study-data/mockDatabase';

const TimetableContext = createContext(null);

const VIEW_OPTIONS = ['daily', 'weekly', 'monthly'];
const TYPE_SUGGESTIONS = ['school', 'class', 'exam', 'tuition', 'gym'];
const DISPLAY_START_HOUR = 0;
const DISPLAY_END_HOUR = 24;
const DEFAULT_SCROLL_HOUR = 6;
const SNAP_MINUTES = 15;
const ZOOM_STORAGE_KEY = 'focuspoint_timetable_zoom';
const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;
const MONTH_FIT_ZOOM = 0.45;

const TYPE_META = {
  school: { label: 'School', bg: 'rgba(99,102,241,0.14)', border: '#6366f1', text: '#4f46e5' },
  class: { label: 'Class', bg: 'rgba(6,182,212,0.14)', border: '#06b6d4', text: '#0891b2' },
  exam: { label: 'Exam', bg: 'rgba(244,63,94,0.14)', border: '#f43f5e', text: '#e11d48' },
  tuition: { label: 'Tuition', bg: 'rgba(245,158,11,0.16)', border: '#f59e0b', text: '#d97706' },
  gym: { label: 'Gym', bg: 'rgba(16,185,129,0.14)', border: '#10b981', text: '#059669' },
  study: { label: 'Study', bg: 'rgba(139,92,246,0.13)', border: '#8b5cf6', text: '#7c3aed' },
};

const FALLBACK_META = { label: 'Custom', bg: 'rgba(100,116,139,0.14)', border: '#64748b', text: '#475569' };

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatDateOnly(date) {
  return format(date, 'yyyy-MM-dd');
}

function parseDateOnly(value) {
  return parseISO(`${value}T00:00:00`);
}

function normalizeType(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'self-study' || normalized === 'self study') return 'study';
  return normalized || 'study';
}

function normalizeKind(value) {
  return String(value || '').trim().toLowerCase() === 'todo' ? 'todo' : 'event';
}

function normalizeCompletedDates(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter(Boolean).map(String))).sort();
}

function clampZoom(value) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value) || DEFAULT_ZOOM));
}

function getMonthDensity(zoom) {
  const normalized = (clampZoom(zoom) - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM);
  return {
    cellMinHeight: Math.round(78 + normalized * 82),
    visibleEventCount: Math.round(2 + normalized * 4),
    density: normalized,
  };
}

function titleCase(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function normalizePattern(value, isRecurring) {
  if (!isRecurring) return 'None';
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'daily') return 'Daily';
  if (normalized === 'weekly') return 'Weekly';
  if (normalized === 'monthly') return 'Monthly';
  return 'None';
}

function patternToRepeat(pattern) {
  const normalized = String(pattern || '').trim().toLowerCase();
  if (normalized === 'daily' || normalized === 'weekly' || normalized === 'monthly') return normalized;
  return 'none';
}

function timeToMinutes(value) {
  if (!value) return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, minutes));
  return `${pad2(Math.floor(clamped / 60))}:${pad2(clamped % 60)}`;
}

function addMinutesToTime(time, minutesToAdd) {
  const start = timeToMinutes(time);
  if (start == null) return '';
  return minutesToTime(start + minutesToAdd);
}

function getEventDate(event) {
  if (event.date) return event.date;
  if (event.start) return event.start.slice(0, 10);
  return getTodayInTimeZone();
}

function toTimetableEvent(raw) {
  const date = getEventDate(raw);
  const type = normalizeType(raw.type || raw.category);
  const startTime = raw.isAllDay ? '' : (raw.startTime || raw.start?.slice(11, 16) || '');
  const endTime = raw.isAllDay ? '' : (raw.endTime || raw.end?.slice(11, 16) || (startTime ? addMinutesToTime(startTime, 60) : ''));
  const repeat = raw.repeat || patternToRepeat(raw.recurrencePattern);
  const isRecurring = Boolean(raw.isRecurring || repeat !== 'none');
  const recurrencePattern = normalizePattern(raw.recurrencePattern || repeat, isRecurring);

  return {
    ...raw,
    id: raw.id,
    title: raw.title || raw.label || 'Untitled Event',
    type,
    category: type,
    kind: normalizeKind(raw.kind),
    completedDates: normalizeCompletedDates(raw.completedDates),
    date,
    startTime,
    endTime,
    isAllDay: Boolean(raw.isAllDay || !startTime),
    isRecurring,
    recurrencePattern,
    recurrenceEndDate: isRecurring ? (raw.recurrenceEndDate || raw.repeatUntil || date) : null,
  };
}

function toDatabasePayload(event) {
  const date = event.date;
  const type = normalizeType(event.type);
  const isAllDay = Boolean(event.isAllDay || !event.startTime);
  const startTime = isAllDay ? '' : event.startTime;
  const endTime = isAllDay ? '' : (event.endTime || addMinutesToTime(event.startTime, 60));
  const repeat = event.isRecurring ? patternToRepeat(event.recurrencePattern) : 'none';

  return {
    id: event.id,
    title: event.title.trim(),
    type,
    category: type,
    kind: normalizeKind(event.kind),
    completedDates: normalizeCompletedDates(event.completedDates),
    date,
    startTime,
    endTime,
    isAllDay,
    start: isAllDay ? `${date}T00:00` : `${date}T${startTime}`,
    end: isAllDay ? `${date}T23:59` : `${date}T${endTime}`,
    isRecurring: repeat !== 'none',
    recurrencePattern: normalizePattern(repeat, repeat !== 'none'),
    recurrenceEndDate: repeat === 'none' ? null : event.recurrenceEndDate,
    repeat,
    repeatUntil: repeat === 'none' ? null : event.recurrenceEndDate,
    linkedExamId: event.linkedExamId || null,
  };
}

function intervalOverlapsDay(event, day) {
  return event.instanceDate === formatDateOnly(day);
}

export function getEventsForRange(viewStart, viewEnd, allEvents) {
  const rangeStart = startOfDay(viewStart);
  const rangeEnd = endOfDay(viewEnd);
  const occurrences = [];

  allEvents.map(toTimetableEvent).forEach((event) => {
    const firstDate = parseDateOnly(event.date);
    if (Number.isNaN(firstDate.getTime())) return;

    if (!event.isRecurring || event.recurrencePattern === 'None') {
      if (firstDate >= startOfDay(rangeStart) && firstDate <= startOfDay(rangeEnd)) {
        occurrences.push(createOccurrence(event, firstDate));
      }
      return;
    }

    const recurrenceEnd = event.recurrenceEndDate ? startOfDay(parseDateOnly(event.recurrenceEndDate)) : rangeEnd;
    if (Number.isNaN(recurrenceEnd.getTime())) return;

    let cursor = firstDate;
    const rangeStartDay = startOfDay(rangeStart);
    const rangeEndDay = startOfDay(rangeEnd);

    if (event.recurrencePattern === 'Daily' && cursor < rangeStartDay) {
      cursor = addDays(cursor, Math.max(0, differenceInCalendarDays(rangeStartDay, cursor)));
    } else if (event.recurrencePattern === 'Weekly' && cursor < rangeStartDay) {
      const diff = Math.max(0, differenceInCalendarDays(rangeStartDay, cursor));
      cursor = addWeeks(cursor, Math.floor(diff / 7));
      while (cursor < rangeStartDay) cursor = addWeeks(cursor, 1);
    } else if (event.recurrencePattern === 'Monthly') {
      while (cursor < rangeStartDay) cursor = addMonths(cursor, 1);
    }

    while (cursor <= rangeEndDay) {
      if (cursor > recurrenceEnd) break;
      if (cursor >= rangeStartDay) occurrences.push(createOccurrence(event, cursor));

      if (event.recurrencePattern === 'Daily') cursor = addDays(cursor, 1);
      else if (event.recurrencePattern === 'Weekly') cursor = addWeeks(cursor, 1);
      else if (event.recurrencePattern === 'Monthly') cursor = addMonths(cursor, 1);
      else break;
    }
  });

  return occurrences.sort((a, b) => {
    if (a.instanceDate !== b.instanceDate) return a.instanceDate.localeCompare(b.instanceDate);
    return (a.startTime || '00:00').localeCompare(b.startTime || '00:00');
  });
}

function createOccurrence(event, date) {
  const instanceDate = formatDateOnly(date);
  return {
    ...event,
    originalId: event.id,
    instanceDate,
    occurrenceId: `${event.id}-${instanceDate}`,
    isCompleted: normalizeKind(event.kind) === 'todo' && normalizeCompletedDates(event.completedDates).includes(instanceDate),
  };
}

function getTypeMeta(type) {
  return TYPE_META[normalizeType(type)] || FALLBACK_META;
}

function buildTimeMarks() {
  return Array.from({ length: DISPLAY_END_HOUR - DISPLAY_START_HOUR + 1 }, (_, index) => DISPLAY_START_HOUR + index);
}

function findFreeLane(active) {
  const used = new Set(active.map((item) => item.lane));
  let lane = 0;
  while (used.has(lane)) lane += 1;
  return lane;
}

function layoutTimedEvents(events, pixelsPerMinute) {
  const prepared = events
    .filter((event) => !event.isAllDay && event.startTime)
    .map((event) => {
      const start = timeToMinutes(event.startTime);
      const end = timeToMinutes(event.endTime) ?? (start + 60);
      if (start == null) return null;
      const safeEnd = end <= start ? start + 60 : end;
      const visibleStart = Math.max(start, DISPLAY_START_HOUR * 60);
      const visibleEnd = Math.min(safeEnd, DISPLAY_END_HOUR * 60);
      if (visibleEnd <= visibleStart) return null;
      return {
        event,
        start,
        end: safeEnd,
        visibleStart,
        visibleEnd,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.visibleStart - b.visibleStart || a.visibleEnd - b.visibleEnd);

  let cluster = -1;
  let active = [];
  const clusterMax = new Map();

  prepared.forEach((item) => {
    active = active.filter((entry) => entry.end > item.visibleStart);
    if (active.length === 0) cluster += 1;

    const lane = findFreeLane(active);
    item.cluster = cluster;
    item.lane = lane;
    active.push({ end: item.visibleEnd, lane });

    clusterMax.set(cluster, Math.max(clusterMax.get(cluster) || 1, active.length, lane + 1));
  });

  return prepared.map((item) => {
    const laneCount = clusterMax.get(item.cluster) || 1;
    return {
      ...item,
      laneCount,
      top: (item.visibleStart - DISPLAY_START_HOUR * 60) * pixelsPerMinute,
      height: Math.max(22, (item.visibleEnd - item.visibleStart) * pixelsPerMinute),
    };
  });
}

function groupEventsByDate(events) {
  const map = new Map();
  events.forEach((event) => {
    const key = event.instanceDate;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(event);
  });
  return map;
}

function getInitialZoom() {
  const stored = Number(localStorage.getItem(ZOOM_STORAGE_KEY));
  if (Number.isFinite(stored)) return clampZoom(stored);
  return DEFAULT_ZOOM;
}

function TimetableProvider({ children, onDataChange }) {
  const [events, setEvents] = useState(() => db.getTimetable().map(toTimetableEvent));

  const refreshEvents = useCallback(() => {
    setEvents(db.getTimetable().map(toTimetableEvent));
    onDataChange?.();
  }, [onDataChange]);

  const createEvent = useCallback((event) => {
    db.addTimetableEntry(toDatabasePayload(event));
    refreshEvents();
  }, [refreshEvents]);

  const updateEvent = useCallback((id, event) => {
    db.updateTimetableEntry(id, toDatabasePayload({ ...event, id }));
    refreshEvents();
  }, [refreshEvents]);

  const toggleTodoOccurrence = useCallback((id, instanceDate) => {
    const current = db.getTimetable().map(toTimetableEvent).find((event) => event.id === id);
    if (!current || normalizeKind(current.kind) !== 'todo') return;
    const completed = new Set(normalizeCompletedDates(current.completedDates));
    if (completed.has(instanceDate)) completed.delete(instanceDate);
    else completed.add(instanceDate);
    db.updateTimetableEntry(id, toDatabasePayload({
      ...current,
      completedDates: Array.from(completed).sort(),
    }));
    refreshEvents();
  }, [refreshEvents]);

  const deleteEvent = useCallback((id) => {
    db.deleteTimetableEntry(id);
    refreshEvents();
  }, [refreshEvents]);

  const value = useMemo(() => ({
    events,
    createEvent,
    updateEvent,
    toggleTodoOccurrence,
    deleteEvent,
    refreshEvents,
  }), [createEvent, deleteEvent, events, refreshEvents, toggleTodoOccurrence, updateEvent]);

  return <TimetableContext.Provider value={value}>{children}</TimetableContext.Provider>;
}

function useTimetableStore() {
  const context = useContext(TimetableContext);
  if (!context) throw new Error('useTimetableStore must be used within TimetableProvider');
  return context;
}

export default function Timetable({ onDataChange }) {
  return (
    <TimetableProvider onDataChange={onDataChange}>
      <TimetableScreen />
    </TimetableProvider>
  );
}

function TimetableScreen() {
  const { events, createEvent, updateEvent, deleteEvent, toggleTodoOccurrence } = useTimetableStore();
  const [view, setView] = useState('weekly');
  const [timeZone, setTimeZone] = useState(() => getConfiguredTimeZone());
  const [anchorDate, setAnchorDate] = useState(() => startOfDay(getCurrentDateInTimeZone()));
  const [modal, setModal] = useState({ open: false, mode: 'create', event: null });
  const [zoom, setZoom] = useState(getInitialZoom);
  const [dailyMode, setDailyMode] = useState('timeline');

  useEffect(() => {
    const refreshTimeZone = () => setTimeZone(getConfiguredTimeZone());
    window.addEventListener('focuspoint-db-change', refreshTimeZone);
    return () => window.removeEventListener('focuspoint-db-change', refreshTimeZone);
  }, []);

  useEffect(() => {
    localStorage.setItem(ZOOM_STORAGE_KEY, String(zoom));
  }, [zoom]);

  const fitDayToViewport = useCallback(() => {
    if (view === 'monthly') {
      setZoom(MONTH_FIT_ZOOM);
      return;
    }
    const isMobile = window.matchMedia?.('(max-width: 767px)').matches;
    const targetHeight = Math.min(isMobile ? 620 : 760, window.innerHeight * (isMobile ? 0.64 : 0.68));
    const nextZoom = targetHeight / ((DISPLAY_END_HOUR - DISPLAY_START_HOUR) * 60);
    setZoom(clampZoom(nextZoom));
  }, [view]);

  const range = useMemo(() => {
    if (view === 'daily') return { start: startOfDay(anchorDate), end: endOfDay(anchorDate) };
    if (view === 'weekly') {
      return {
        start: startOfWeek(anchorDate, { weekStartsOn: 1 }),
        end: endOfWeek(anchorDate, { weekStartsOn: 1 }),
      };
    }
    return {
      start: startOfWeek(startOfMonth(anchorDate), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(anchorDate), { weekStartsOn: 1 }),
    };
  }, [anchorDate, view]);

  const occurrences = useMemo(
    () => getEventsForRange(range.start, range.end, events),
    [events, range.end, range.start],
  );

  const todayDate = useMemo(() => startOfDay(getCurrentDateInTimeZone(timeZone)), [timeZone]);

  const todayOccurrences = useMemo(
    () => getEventsForRange(todayDate, endOfDay(todayDate), events),
    [events, todayDate],
  );

  const nextTodayEvent = useMemo(() => {
    const nowMinutes = getNowMinutesInTimeZone(timeZone);
    return todayOccurrences
      .filter((event) => event.isAllDay || (timeToMinutes(event.startTime) ?? 0) >= nowMinutes)
      .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'))[0] || null;
  }, [timeZone, todayOccurrences]);

  const typeOptions = useMemo(() => {
    const set = new Set(TYPE_SUGGESTIONS);
    events.forEach((event) => set.add(normalizeType(event.type)));
    return Array.from(set).filter(Boolean).sort();
  }, [events]);

  const openCreateModal = useCallback((date, minuteOfDay = null) => {
    const hasTime = minuteOfDay != null;
    const startTime = hasTime ? minutesToTime(minuteOfDay) : '';
    setModal({
      open: true,
      mode: 'create',
      event: {
        title: '',
        type: 'class',
        kind: 'event',
        completedDates: [],
        date: formatDateOnly(date),
        startTime,
        endTime: hasTime ? addMinutesToTime(startTime, 60) : '',
        isAllDay: !hasTime,
        isRecurring: false,
        recurrencePattern: 'None',
        recurrenceEndDate: '',
      },
    });
  }, []);

  const openEditModal = useCallback((occurrence) => {
    const original = events.find((event) => event.id === occurrence.originalId);
    if (!original) return;
    const isLinkedExam = Boolean(original.linkedExamId || original.locked);
    setModal({ open: true, mode: isLinkedExam ? 'readonly-exam' : 'edit', event: original });
  }, [events]);

  const closeModal = () => setModal({ open: false, mode: 'create', event: null });

  const saveModal = (event) => {
    if (modal.mode === 'edit') updateEvent(event.id, event);
    else createEvent(event);
    closeModal();
  };

  const removeEvent = (id) => {
    deleteEvent(id);
    closeModal();
  };

  const movePrevious = () => {
    if (view === 'daily') setAnchorDate((current) => subDays(current, 1));
    else if (view === 'weekly') setAnchorDate((current) => subWeeks(current, 1));
    else setAnchorDate((current) => subMonths(current, 1));
  };

  const moveNext = () => {
    if (view === 'daily') setAnchorDate((current) => addDays(current, 1));
    else if (view === 'weekly') setAnchorDate((current) => addWeeks(current, 1));
    else setAnchorDate((current) => addMonths(current, 1));
  };

  const title = view === 'daily'
    ? format(anchorDate, 'EEEE, MMM d')
    : view === 'weekly'
      ? `${format(range.start, 'MMM d')} - ${format(range.end, 'MMM d, yyyy')}`
      : format(anchorDate, 'MMMM yyyy');
  const showZoomControls = view !== 'daily' || dailyMode !== 'list';
  const fitButtonLabel = view === 'monthly' ? 'Fit month' : 'Fit day';

  return (
    <div className="timetable-page animate-fade-in">
      <header className="timetable-hero">
        <div className="timetable-title-wrap">
          <div className="timetable-title-icon"><CalendarDays className="w-5 h-5" /></div>
          <div>
            <h1>Timetable</h1>
            <p>Plan your classes, exam work, tuition, gym, and custom routines in one linked schedule.</p>
          </div>
        </div>
        <button className="btn-primary timetable-add-btn" onClick={() => openCreateModal(anchorDate)}>
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </header>

      <section className="timetable-summary">
        <div className="summary-item">
          <Sparkles className="w-4 h-4 text-accent-amber" />
          <div>
            <span>Next today</span>
            <strong>{nextTodayEvent ? `${nextTodayEvent.title} ${nextTodayEvent.startTime || 'All day'}` : 'No more events'}</strong>
          </div>
        </div>
        <div className="summary-item">
          <ListChecks className="w-4 h-4 text-accent-emerald" />
          <div>
            <span>This view</span>
            <strong>{occurrences.length} item{occurrences.length === 1 ? '' : 's'}</strong>
          </div>
        </div>
      </section>

      <section className={`timetable-toolbar ${view === 'daily' ? 'daily-toolbar' : ''}`}>
        <ViewSwitcher value={view} onChange={setView} />
        {view === 'daily' && <DailyModeSwitcher value={dailyMode} onChange={setDailyMode} />}
        <div className="timetable-nav">
          <button className="btn-secondary touch-target" onClick={movePrevious} aria-label="Previous">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="btn-secondary touch-target today-button" onClick={() => setAnchorDate(todayDate)}>
            Today
          </button>
          <button className="btn-secondary touch-target" onClick={moveNext} aria-label="Next">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <h2 className="timetable-range-title">{title}</h2>
        {showZoomControls && (
          <div className="zoom-cluster">
            <label className="zoom-control">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Zoom</span>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step="0.05"
                value={zoom}
                onChange={(event) => setZoom(clampZoom(event.target.value))}
              />
            </label>
            <button type="button" className="btn-secondary fit-day-button touch-target" onClick={fitDayToViewport}>
              <Clock className="w-4 h-4" />
              {fitButtonLabel}
            </button>
          </div>
        )}
      </section>

      <EventLegend />

      {view === 'daily' && (
        <DailyView
          date={anchorDate}
          events={occurrences}
          pixelsPerMinute={zoom}
          mode={dailyMode}
          todayDate={todayDate}
          onSlotClick={openCreateModal}
          onEventClick={openEditModal}
          onToggleTodo={toggleTodoOccurrence}
        />
      )}
      {view === 'weekly' && (
        <WeeklyView
          weekStart={range.start}
          events={occurrences}
          pixelsPerMinute={zoom}
          todayDate={todayDate}
          onSlotClick={openCreateModal}
          onEventClick={openEditModal}
          onToggleTodo={toggleTodoOccurrence}
        />
      )}
      {view === 'monthly' && (
        <MonthlyView
          anchorDate={anchorDate}
          monthStart={range.start}
          monthEnd={range.end}
          events={occurrences}
          zoom={zoom}
          todayDate={todayDate}
          onDayClick={openCreateModal}
          onEventClick={openEditModal}
          onToggleTodo={toggleTodoOccurrence}
        />
      )}

      {modal.open && (
        modal.mode === 'readonly-exam' ? (
          <ReadOnlyExamModal event={modal.event} onClose={closeModal} />
        ) : (
          <EventModal
            mode={modal.mode}
            event={modal.event}
            typeOptions={typeOptions}
            onSave={saveModal}
            onDelete={removeEvent}
            onClose={closeModal}
          />
        )
      )}
    </div>
  );
}

function ViewSwitcher({ value, onChange }) {
  return (
    <div className="view-toggle timetable-view-toggle" role="tablist" aria-label="Timetable view">
      {VIEW_OPTIONS.map((view) => (
        <button
          key={view}
          type="button"
          className={value === view ? 'active' : ''}
          onClick={() => onChange(view)}
        >
          {titleCase(view)}
        </button>
      ))}
    </div>
  );
}

function DailyModeSwitcher({ value, onChange }) {
  return (
    <div className="view-toggle daily-mode-toggle" role="tablist" aria-label="Daily display mode">
      {['timeline', 'list'].map((mode) => (
        <button
          key={mode}
          type="button"
          className={value === mode ? 'active' : ''}
          onClick={() => onChange(mode)}
        >
          {titleCase(mode)}
        </button>
      ))}
    </div>
  );
}

function EventLegend() {
  return (
    <div className="timetable-legend" aria-label="Event type legend">
      {TYPE_SUGGESTIONS.map((type) => {
        const meta = getTypeMeta(type);
        return (
          <span key={type} className="legend-pill">
            <i style={{ background: meta.border }} />
            {meta.label}
          </span>
        );
      })}
    </div>
  );
}

function DailyView({ date, events, pixelsPerMinute, mode, todayDate, onSlotClick, onEventClick, onToggleTodo }) {
  return (
    <section className="timetable-panel">
      {mode === 'list' ? (
        <DailyListView events={events} onEventClick={onEventClick} onToggleTodo={onToggleTodo} />
      ) : (
        <>
          <DayAllDayStrip date={date} events={events.filter((event) => event.isAllDay)} onEventClick={onEventClick} onEmptyClick={onSlotClick} onToggleTodo={onToggleTodo} />
          <TimeGrid
            days={[date]}
            events={events}
            pixelsPerMinute={pixelsPerMinute}
            onSlotClick={onSlotClick}
            onEventClick={onEventClick}
            onToggleTodo={onToggleTodo}
            todayDate={todayDate}
            compactHeaders={false}
          />
        </>
      )}
    </section>
  );
}

function WeeklyView({ weekStart, events, pixelsPerMinute, todayDate, onSlotClick, onEventClick, onToggleTodo }) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  return (
    <section className="timetable-panel">
      <WeekAllDayStrip days={days} events={events.filter((event) => event.isAllDay)} onEventClick={onEventClick} onEmptyClick={onSlotClick} onToggleTodo={onToggleTodo} />
      <TimeGrid
        days={days}
        events={events}
        pixelsPerMinute={pixelsPerMinute}
        onSlotClick={onSlotClick}
        onEventClick={onEventClick}
        onToggleTodo={onToggleTodo}
        todayDate={todayDate}
        compactHeaders
      />
    </section>
  );
}

function WeekAllDayStrip({ days, events, onEventClick, onEmptyClick, onToggleTodo }) {
  const grouped = useMemo(() => groupEventsByDate(events), [events]);

  return (
    <div className="week-all-day-strip">
      <span className="all-day-label">All day</span>
      <div className="week-all-day-grid">
        {days.map((day) => {
          const key = formatDateOnly(day);
          const dayEvents = grouped.get(key) || [];
          return (
            <div key={key} className="week-all-day-cell" onClick={() => onEmptyClick(day)}>
              {dayEvents.map((event) => (
                <EventChip key={event.occurrenceId} event={event} compact onClick={(clickEvent) => {
                  clickEvent.stopPropagation();
                  onEventClick(event);
                }} onToggleTodo={onToggleTodo} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayAllDayStrip({ date, events, onEventClick, onEmptyClick, onToggleTodo }) {
  return (
    <div className="all-day-strip">
      <span className="all-day-label">All day</span>
      <div className="all-day-events" onClick={() => onEmptyClick(date)}>
        {events.length === 0 && <span className="all-day-empty">Click to add a date-only event</span>}
        {events.map((event) => (
          <EventChip key={event.occurrenceId} event={event} compact onClick={(e) => {
            e.stopPropagation();
            onEventClick(event);
          }} onToggleTodo={onToggleTodo} />
        ))}
      </div>
    </div>
  );
}

function TimeGrid({ days, events, pixelsPerMinute, onSlotClick, onEventClick, onToggleTodo, todayDate, compactHeaders }) {
  const marks = useMemo(buildTimeMarks, []);
  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);
  const timelineHeight = (DISPLAY_END_HOUR - DISPLAY_START_HOUR) * 60 * pixelsPerMinute;
  const scrollRef = useRef(null);
  const daysKey = days.map(formatDateOnly).join('|');

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = (DEFAULT_SCROLL_HOUR - DISPLAY_START_HOUR) * 60 * pixelsPerMinute;
  }, [daysKey]);

  return (
    <div className={`time-grid-shell ${days.length === 7 ? 'week-mode' : 'day-mode'}`}>
      <div className="time-grid-header">
        <div className="time-gutter" />
        <div className="time-grid-days" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
          {days.map((day) => (
            <div key={formatDateOnly(day)} className={`time-day-header ${isSameDay(day, todayDate) ? 'today' : ''}`}>
              <span className="day-full">{format(day, 'EEE')}</span>
              <span className="day-compact">{compactHeaders ? format(day, 'EEEEE') : format(day, 'EEE')}</span>
              <strong>{format(day, 'd')}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="time-grid-scroll" ref={scrollRef}>
        <div className="time-grid-body" style={{ minHeight: timelineHeight }}>
          <TimeRail marks={marks} pixelsPerMinute={pixelsPerMinute} />
          <div className="time-grid-days" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
            {days.map((day) => {
              const key = formatDateOnly(day);
              const dayEvents = eventsByDate.get(key) || [];
              return (
                <TimeDayColumn
                  key={key}
                  day={day}
                  events={dayEvents}
                  pixelsPerMinute={pixelsPerMinute}
                  timelineHeight={timelineHeight}
                  onSlotClick={onSlotClick}
                  onEventClick={onEventClick}
                  onToggleTodo={onToggleTodo}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function TimeRail({ marks, pixelsPerMinute }) {
  return (
    <div className="time-rail">
      {marks.map((hour, index) => {
        const top = (hour - DISPLAY_START_HOUR) * 60 * pixelsPerMinute;
        const label = hour === 24 ? '12 AM' : format(parseISO(`2026-01-01T${pad2(hour)}:00:00`), 'h a');
        return (
          <span key={hour} style={{ top }} className={index === 0 ? 'first' : ''}>
            {label}
          </span>
        );
      })}
    </div>
  );
}

function TimeDayColumn({ day, events, pixelsPerMinute, timelineHeight, onSlotClick, onEventClick, onToggleTodo }) {
  const laidOut = useMemo(() => layoutTimedEvents(events, pixelsPerMinute), [events, pixelsPerMinute]);
  const marks = useMemo(buildTimeMarks, []);
  const slotCount = ((DISPLAY_END_HOUR - DISPLAY_START_HOUR) * 60) / SNAP_MINUTES;

  return (
    <div className="time-day-column" style={{ minHeight: timelineHeight }}>
      {marks.slice(0, -1).map((hour) => (
        <div key={hour} className="hour-line" style={{ top: (hour - DISPLAY_START_HOUR) * 60 * pixelsPerMinute }} />
      ))}
      {Array.from({ length: slotCount }, (_, index) => {
        const minute = DISPLAY_START_HOUR * 60 + index * SNAP_MINUTES;
        return (
          <button
            key={minute}
            className="time-slot-button"
            style={{ top: (minute - DISPLAY_START_HOUR * 60) * pixelsPerMinute, height: SNAP_MINUTES * pixelsPerMinute }}
            onClick={() => onSlotClick(day, minute)}
            aria-label={`Add event ${format(day, 'MMM d')} at ${minutesToTime(minute)}`}
          />
        );
      })}
      {laidOut.map((layout) => (
        <PositionedEvent key={layout.event.occurrenceId} layout={layout} onClick={() => onEventClick(layout.event)} onToggleTodo={onToggleTodo} />
      ))}
    </div>
  );
}

function PositionedEvent({ layout, onClick, onToggleTodo }) {
  const width = 100 / layout.laneCount;
  const style = {
    top: layout.top,
    height: layout.height,
    left: `${layout.lane * width}%`,
    width: `calc(${width}% - 3px)`,
  };

  return (
    <EventChip event={layout.event} style={style} timeline compact={layout.height < 42} onClick={onClick} onToggleTodo={onToggleTodo} />
  );
}

function DailyListView({ events, onEventClick, onToggleTodo }) {
  const sorted = useMemo(() => [...events].sort((a, b) => {
    if (a.isAllDay !== b.isAllDay) return a.isAllDay ? -1 : 1;
    return (a.startTime || '00:00').localeCompare(b.startTime || '00:00');
  }), [events]);

  return (
    <div className="daily-list-view">
      {sorted.length === 0 && (
        <div className="daily-list-empty">No events or to-dos for this day.</div>
      )}
      {sorted.map((event) => {
        const meta = getTypeMeta(event.type);
        return (
          <div
            key={event.occurrenceId}
            className={`daily-list-item ${event.kind === 'todo' ? 'todo' : ''} ${event.isCompleted ? 'completed' : ''}`}
            style={{ borderColor: meta.border }}
          >
            {event.kind === 'todo' && (
              <input
                type="checkbox"
                checked={Boolean(event.isCompleted)}
                onChange={() => onToggleTodo(event.originalId, event.instanceDate)}
                aria-label={`Mark ${event.title} done`}
              />
            )}
            <button type="button" onClick={() => onEventClick(event)}>
              <span>{event.isAllDay ? 'All day' : `${event.startTime}-${event.endTime}`}</span>
              <strong>{event.title}</strong>
              <small style={{ color: meta.text }}>{event.kind === 'todo' ? 'To-do' : titleCase(event.type)}</small>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function MonthlyView({ anchorDate, monthStart, monthEnd, events, zoom, todayDate, onDayClick, onEventClick, onToggleTodo }) {
  const cells = useMemo(() => {
    const result = [];
    for (let cursor = monthStart; cursor <= monthEnd; cursor = addDays(cursor, 1)) result.push(cursor);
    return result;
  }, [monthEnd, monthStart]);
  const grouped = useMemo(() => groupEventsByDate(events), [events]);
  const monthDensity = useMemo(() => getMonthDensity(zoom), [zoom]);

  return (
    <section
      className="monthly-panel"
      style={{
        '--month-cell-min-h': `${monthDensity.cellMinHeight}px`,
        '--month-density': monthDensity.density,
      }}
    >
      <div className="month-header-row">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="month-grid">
        {cells.map((day) => {
          const key = formatDateOnly(day);
          const dayEvents = grouped.get(key) || [];
          const visible = dayEvents.slice(0, monthDensity.visibleEventCount);
          const hidden = dayEvents.length - visible.length;
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              className={`month-cell ${isSameMonth(day, anchorDate) ? '' : 'muted'}`}
              onClick={() => onDayClick(day)}
              onKeyDown={(keyEvent) => {
                if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                  keyEvent.preventDefault();
                  onDayClick(day);
                }
              }}
            >
              <span className={`month-day-number ${isSameDay(day, todayDate) ? 'today' : ''}`}>{format(day, 'd')}</span>
              <div className="month-cell-events">
                {visible.map((event) => (
                  <EventChip
                    key={event.occurrenceId}
                    event={event}
                    compact
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      onEventClick(event);
                    }}
                    onToggleTodo={onToggleTodo}
                  />
                ))}
                {hidden > 0 && <span className="month-more">+{hidden} more</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EventChip({ event, onClick, onToggleTodo, style, timeline = false, compact = false }) {
  const meta = getTypeMeta(event.type);
  const isTodo = normalizeKind(event.kind) === 'todo';
  const className = `fp-event-chip ${timeline ? 'timeline' : ''} ${compact ? 'compact' : ''} ${isTodo ? 'todo' : ''} ${event.isCompleted ? 'completed' : ''}`;
  return (
    <div
      role="button"
      tabIndex={0}
      className={className}
      style={{ ...style, background: meta.bg, borderColor: meta.border, color: meta.text }}
      onClick={onClick}
      onKeyDown={(keyEvent) => {
        if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
          keyEvent.preventDefault();
          onClick?.(keyEvent);
        }
      }}
      title={`${event.title}${event.startTime ? `, ${event.startTime}` : ', all day'}`}
    >
      {isTodo && (
        <span
          className="todo-check-wrap"
          onClick={(clickEvent) => clickEvent.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={Boolean(event.isCompleted)}
            onChange={() => onToggleTodo?.(event.originalId, event.instanceDate)}
            aria-label={`Mark ${event.title} done`}
          />
        </span>
      )}
      {!compact && <span className="event-time">{event.isAllDay ? 'All day' : `${event.startTime}-${event.endTime}`}</span>}
      <strong>{event.title}</strong>
      {!compact && <span className="event-type">{isTodo ? 'To-do' : titleCase(event.type)}</span>}
      {compact && timeline && <small>{event.startTime}</small>}
    </div>
  );
}

function SearchableTypeCombobox({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.toLowerCase().includes(q));
  }, [options, value]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return (
    <div ref={containerRef} className="type-combobox">
      <Search className="w-4 h-4" />
      <input
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        placeholder="Search or type custom"
      />
      {open && filtered.length > 0 && (
        <div className="type-combobox-menu">
          {filtered.map((option) => (
            <button
              type="button"
              key={option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              {titleCase(option)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ReadOnlyExamModal({ event, onClose }) {
  const meta = getTypeMeta(event.type);
  const dateLabel = event.date
    ? format(parseDateOnly(event.date), 'EEEE, MMM d, yyyy')
    : 'No date set';
  const timeLabel = event.isAllDay ? 'All day' : `${event.startTime}-${event.endTime || addMinutesToTime(event.startTime, 60)}`;

  useEffect(() => {
    const onKeyDown = (keyEvent) => {
      if (keyEvent.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-content timetable-modal-v2" onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>Exam Details</h2>
            <p>Managed from Exam Countdown</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="readonly-exam-card" style={{ borderColor: meta.border, background: meta.bg }}>
          <span className="readonly-exam-type" style={{ color: meta.text }}>{titleCase(event.type)}</span>
          <h3>{event.title}</h3>
          <dl>
            <div>
              <dt>Date</dt>
              <dd>{dateLabel}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{timeLabel}</dd>
            </div>
          </dl>
        </div>

        <p className="readonly-exam-note">
          This timetable item is linked to Exam Countdown, so it is read-only here.
        </p>

        <div className="modal-actions">
          <button type="button" className="btn-primary touch-target" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function EventModal({ mode, event, typeOptions, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(() => ({ ...event }));
  const [error, setError] = useState('');

  useEffect(() => {
    const onKeyDown = (keyEvent) => {
      if (keyEvent.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const submit = (submitEvent) => {
    submitEvent.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setError('Event name is required.');
      return;
    }
    if (!form.date) {
      setError('Date is required.');
      return;
    }

    const startTime = form.startTime || '';
    let endTime = form.endTime || '';
    const isAllDay = !startTime;

    if (startTime && !endTime) endTime = addMinutesToTime(startTime, 60);
    if (startTime && timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setError('End time must be after start time.');
      return;
    }

    const repeat = form.isRecurring ? normalizePattern(form.recurrencePattern, true) : 'None';
    if (repeat !== 'None') {
      if (!form.recurrenceEndDate) {
        setError('Choose when the repeat should end.');
        return;
      }
      if (parseDateOnly(form.recurrenceEndDate) < parseDateOnly(form.date)) {
        setError('Repeat end date cannot be before the event date.');
        return;
      }
    }

    onSave({
      ...form,
      title,
      type: normalizeType(form.type),
      kind: normalizeKind(form.kind),
      completedDates: normalizeCompletedDates(form.completedDates),
      date: form.date,
      startTime: isAllDay ? '' : startTime,
      endTime: isAllDay ? '' : endTime,
      isAllDay,
      isRecurring: repeat !== 'None',
      recurrencePattern: repeat,
      recurrenceEndDate: repeat === 'None' ? null : form.recurrenceEndDate,
    });
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-content timetable-modal-v2" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>{mode === 'edit' ? 'Edit Event' : 'Add Event'}</h2>
            <p>{form.startTime ? `${form.date} at ${form.startTime}` : form.date}</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="event-form">
          <div className="kind-toggle" role="tablist" aria-label="Item kind">
            {['event', 'todo'].map((kind) => (
              <button
                type="button"
                key={kind}
                className={normalizeKind(form.kind) === kind ? 'active' : ''}
                onClick={() => setField('kind', kind)}
              >
                {kind === 'todo' ? 'To-do' : 'Event'}
              </button>
            ))}
          </div>

          <label>
            <span>Name</span>
            <input className="input-field" value={form.title} onChange={(event) => setField('title', event.target.value)} autoFocus />
          </label>

          <label>
            <span>Type / Subject</span>
            <SearchableTypeCombobox value={form.type} options={typeOptions} onChange={(value) => setField('type', value)} />
          </label>

          <div className="form-grid">
            <label>
              <span>Date</span>
              <input className="input-field" type="date" value={form.date} onChange={(event) => setField('date', event.target.value)} />
            </label>
            <label>
              <span>Start time</span>
              <input className="input-field" type="time" step={SNAP_MINUTES * 60} value={form.startTime || ''} onChange={(event) => setField('startTime', event.target.value)} />
            </label>
            <label>
              <span>End time</span>
              <input className="input-field" type="time" step={SNAP_MINUTES * 60} value={form.endTime || ''} onChange={(event) => setField('endTime', event.target.value)} disabled={!form.startTime} />
            </label>
          </div>

          <label className="repeat-toggle">
            <input
              type="checkbox"
              checked={Boolean(form.isRecurring)}
              onChange={(event) => {
                const checked = event.target.checked;
                setForm((current) => ({
                  ...current,
                  isRecurring: checked,
                  recurrencePattern: checked ? (current.recurrencePattern === 'None' ? 'Weekly' : current.recurrencePattern) : 'None',
                  recurrenceEndDate: checked ? (current.recurrenceEndDate || current.date) : '',
                }));
              }}
            />
            <span>Repeat this event</span>
          </label>

          <div className={`repeat-fields ${form.isRecurring ? 'open' : ''}`}>
            <label>
              <span>Repeats</span>
              <select className="select-field" value={form.recurrencePattern || 'Weekly'} onChange={(event) => setField('recurrencePattern', event.target.value)}>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </label>
            <label>
              <span>End repeat on</span>
              <input className="input-field" type="date" value={form.recurrenceEndDate || ''} onChange={(event) => setField('recurrenceEndDate', event.target.value)} />
            </label>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            {mode === 'edit' && (
              <button type="button" className="btn-danger touch-target" onClick={() => onDelete(form.id)}>
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            <button type="button" className="btn-secondary touch-target" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary touch-target">
              <Edit3 className="w-4 h-4" />
              {mode === 'edit' ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
