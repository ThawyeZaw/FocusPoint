import {
  db,
  getConfiguredTimeZone,
  getCurrentDateInTimeZone,
  zonedWallTimeToDate,
} from '@focuspoint/shared/study-data/mockDatabase';
import { showAppNotification } from './notifications.js';

const SENT_KEY = 'focuspoint_timetable_notification_log';
const HORIZON_MS = 24 * 60 * 60 * 1000;
const STALE_MS = 3 * 24 * 60 * 60 * 1000;
const REMINDERS = [
  { id: '30m', offsetMs: 30 * 60 * 1000, label: '30 minutes' },
  { id: 'start', offsetMs: 0, label: 'now' },
];

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatDateOnly(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseDateOnly(value) {
  const [year, month, day] = String(value || '').split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function daysBetween(a, b) {
  return Math.floor((startOfDay(b) - startOfDay(a)) / (24 * 60 * 60 * 1000));
}

function normalizePattern(event) {
  const value = String(event.recurrencePattern || event.repeat || '').toLowerCase();
  if (value.includes('daily')) return 'daily';
  if (value.includes('weekly')) return 'weekly';
  if (value.includes('monthly')) return 'monthly';
  return 'none';
}

function occursOn(event, day) {
  const firstDay = parseDateOnly(event.date);
  if (!firstDay || day < startOfDay(firstDay)) return false;

  const pattern = normalizePattern(event);
  if (pattern === 'none') return formatDateOnly(day) === formatDateOnly(firstDay);

  const endDate = parseDateOnly(event.recurrenceEndDate || event.repeatUntil);
  if (endDate && day > startOfDay(endDate)) return false;

  const diff = daysBetween(firstDay, day);
  if (pattern === 'daily') return diff >= 0;
  if (pattern === 'weekly') return diff >= 0 && diff % 7 === 0;
  if (pattern === 'monthly') return day.getDate() === firstDay.getDate();
  return false;
}

function getUpcomingOccurrences(timeZone) {
  const rangeStart = startOfDay(getCurrentDateInTimeZone(timeZone));
  const rangeEnd = addDays(rangeStart, 2);
  const occurrences = [];

  db.getTimetable()
    .filter((event) => !event.isAllDay && event.startTime)
    .forEach((event) => {
      for (let day = new Date(rangeStart); day <= rangeEnd; day = addDays(day, 1)) {
        if (!occursOn(event, day)) continue;
        const startsAt = zonedWallTimeToDate(formatDateOnly(day), event.startTime, timeZone);
        if (!startsAt) continue;
        occurrences.push({ event, startsAt });
      }
    });

  return occurrences;
}

function readSentLog(now) {
  try {
    const parsed = JSON.parse(localStorage.getItem(SENT_KEY) || '{}');
    return Object.fromEntries(
      Object.entries(parsed).filter(([, timestamp]) => now - Number(timestamp) < STALE_MS)
    );
  } catch {
    return {};
  }
}

function writeSentLog(log) {
  localStorage.setItem(SENT_KEY, JSON.stringify(log));
}

function markSent(key, now) {
  const log = readSentLog(now);
  log[key] = now;
  writeSentLog(log);
}

function hasSent(key, now) {
  return Boolean(readSentLog(now)[key]);
}

function buildReminder(occurrence, reminder, timeZone) {
  const timestamp = occurrence.startsAt.getTime();
  const key = `${occurrence.event.id}:${timestamp}:${reminder.id}`;
  const eventTime = occurrence.startsAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone });
  const title = reminder.id === 'start' ? `${occurrence.event.title} starts now` : `${occurrence.event.title} starts soon`;
  const body = reminder.id === 'start'
    ? `${occurrence.event.title} is scheduled for ${eventTime}.`
    : `${occurrence.event.title} starts in ${reminder.label} at ${eventTime}.`;

  return {
    key,
    triggerAt: timestamp - reminder.offsetMs,
    title,
    body,
  };
}

export function scheduleTimetableNotifications() {
  const now = Date.now();
  const timeZone = getConfiguredTimeZone();
  const timers = [];

  getUpcomingOccurrences(timeZone).forEach((occurrence) => {
    REMINDERS.forEach((reminder) => {
      const payload = buildReminder(occurrence, reminder, timeZone);
      const delay = payload.triggerAt - now;

      if (delay < 0 || delay > HORIZON_MS || hasSent(payload.key, now)) return;

      const timerId = window.setTimeout(async () => {
        if (hasSent(payload.key, Date.now())) return;
        const didNotify = await showAppNotification(payload.title, {
          body: payload.body,
          tag: payload.key,
          data: { url: '/timetable' },
        });
        if (didNotify) markSent(payload.key, Date.now());
      }, delay);

      timers.push(timerId);
    });
  });

  return () => timers.forEach((timerId) => window.clearTimeout(timerId));
}
