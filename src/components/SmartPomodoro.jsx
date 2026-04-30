import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Timer, X } from 'lucide-react';

const PRESETS = [
  { id: '25-5', label: '25/5', focusMinutes: 25, breakMinutes: 5 },
  { id: '50-10', label: '50/10', focusMinutes: 50, breakMinutes: 10 },
];

const RESET_PROMPTS = [
  'Do a quick calisthenics set.',
  'Drink a glass of water.',
  'Spend a few minutes playing with your cat.',
  'Stretch your neck and shoulders.',
  'Step away from the screen and reset your eyes.',
  'Take ten slow breaths before the next block.',
];

const NOTES_KEY = 'focuspoint_pomodoro_notes';
const TIMER_KEY = 'focuspoint_pomodoro_timer';
const TIMER_VERSION = 1;
const notifiedTransitionKeys = new Set();

const findPreset = (id) => PRESETS.find((item) => item.id === id) || PRESETS[0];

const getPhaseSeconds = (preset, phase) =>
  (phase === 'break' ? preset.breakMinutes : preset.focusMinutes) * 60;

const randomBreakPrompt = () => RESET_PROMPTS[Math.floor(Math.random() * RESET_PROMPTS.length)];

const createDefaultTimerState = (presetId = PRESETS[0].id) => {
  const preset = findPreset(presetId);

  return {
    version: TIMER_VERSION,
    presetId: preset.id,
    phase: 'focus',
    isIdle: true,
    isRunning: false,
    remainingSeconds: preset.focusMinutes * 60,
    phaseEndsAt: null,
    breakPrompt: RESET_PROMPTS[0],
    showBreakOverlay: false,
    lastAlertedTransition: null,
    pendingAlert: null,
  };
};

const clampSeconds = (value, max) => {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return max;
  return Math.min(max, Math.ceil(seconds));
};

const normalizeTimerState = (raw) => {
  if (!raw || typeof raw !== 'object') return createDefaultTimerState();

  const preset = findPreset(raw.presetId);
  const phase = raw.phase === 'break' ? 'break' : 'focus';
  const maxSeconds = getPhaseSeconds(preset, phase);
  const remainingSeconds = clampSeconds(raw.remainingSeconds, maxSeconds);
  const isRunning = Boolean(raw.isRunning);
  const looksIdle =
    !isRunning &&
    phase === 'focus' &&
    remainingSeconds === preset.focusMinutes * 60 &&
    !raw.phaseEndsAt;
  const pendingAlert =
    raw.pendingAlert && typeof raw.pendingAlert.key === 'string' && typeof raw.pendingAlert.type === 'string'
      ? raw.pendingAlert
      : null;

  return {
    version: TIMER_VERSION,
    presetId: preset.id,
    phase,
    isIdle: !isRunning && (typeof raw.isIdle === 'boolean' ? raw.isIdle : looksIdle),
    isRunning,
    remainingSeconds,
    phaseEndsAt: isRunning && Number.isFinite(Number(raw.phaseEndsAt)) ? Number(raw.phaseEndsAt) : null,
    breakPrompt: typeof raw.breakPrompt === 'string' && raw.breakPrompt ? raw.breakPrompt : RESET_PROMPTS[0],
    showBreakOverlay: phase === 'break' && Boolean(raw.showBreakOverlay),
    lastAlertedTransition:
      typeof raw.lastAlertedTransition === 'string' ? raw.lastAlertedTransition : null,
    pendingAlert,
  };
};

const readTimerState = () => {
  try {
    const stored = window.localStorage.getItem(TIMER_KEY);
    return stored ? normalizeTimerState(JSON.parse(stored)) : createDefaultTimerState();
  } catch {
    return createDefaultTimerState();
  }
};

const writeTimerState = (state) => {
  try {
    window.localStorage.setItem(TIMER_KEY, JSON.stringify(state));
  } catch {
    // Persistence is best-effort; the timer still works for the current page session.
  }
};

const resolveTimerState = (state, now = Date.now()) => {
  const next = normalizeTimerState(state);
  if (!next.isRunning) return next;

  const preset = findPreset(next.presetId);
  let phaseEndsAt = Number(next.phaseEndsAt);
  if (!Number.isFinite(phaseEndsAt) || phaseEndsAt <= 0) {
    phaseEndsAt = now + next.remainingSeconds * 1000;
  }

  let pendingAlert = next.pendingAlert;
  let guard = 0;

  while (phaseEndsAt <= now && guard < 10000) {
    const transitionAt = phaseEndsAt;

    if (next.phase === 'focus') {
      next.phase = 'break';
      next.breakPrompt = randomBreakPrompt();
      next.showBreakOverlay = true;
      phaseEndsAt = transitionAt + preset.breakMinutes * 60 * 1000;
      pendingAlert = { key: `break-start:${transitionAt}`, type: 'break-start' };
    } else {
      next.phase = 'focus';
      next.showBreakOverlay = false;
      phaseEndsAt = transitionAt + preset.focusMinutes * 60 * 1000;
      pendingAlert = { key: `focus-start:${transitionAt}`, type: 'focus-start' };
    }

    guard += 1;
  }

  next.phaseEndsAt = phaseEndsAt;
  next.remainingSeconds = Math.max(0, Math.ceil((phaseEndsAt - now) / 1000));
  next.pendingAlert = pendingAlert;

  return next;
};

const requestNotificationPermission = () => {
  if (!('Notification' in window) || window.Notification.permission !== 'default') return;
  window.Notification.requestPermission().catch(() => {});
};

const playTimerSound = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, context.currentTime);
    oscillator.frequency.setValueAtTime(880, context.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.45);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.5);
    window.setTimeout(() => context.close().catch(() => {}), 700);
  } catch {
    // Some browsers block audio outside a fresh user gesture.
  }
};

const getAlertCopy = (pendingAlert, state) => {
  if (pendingAlert.type === 'break-start') {
    return {
      title: 'Break time',
      body: state.breakPrompt || 'Your focus session is complete. Take a short reset.',
    };
  }

  return {
    title: 'Focus time',
    body: 'Break is over. Your next focus session has started.',
  };
};

export default function SmartPomodoro({ open = true, onClose, embedded = false }) {
  const [timerState, setTimerState] = useState(() => resolveTimerState(readTimerState()));
  const [notes, setNotes] = useState(() => localStorage.getItem(NOTES_KEY) || '');
  const [statusMessage, setStatusMessage] = useState(null);
  const statusTimeoutRef = useRef(null);

  const preset = useMemo(
    () => findPreset(timerState.presetId),
    [timerState.presetId]
  );

  const persistTimerState = (nextState) => {
    writeTimerState(nextState);
    return nextState;
  };

  useEffect(() => {
    writeTimerState(timerState);
  }, [timerState]);

  useEffect(() => {
    if (!open) return undefined;

    const refreshTimer = () => {
      setTimerState((current) => persistTimerState(resolveTimerState(current)));
    };

    refreshTimer();
    window.addEventListener('focus', refreshTimer);
    document.addEventListener('visibilitychange', refreshTimer);

    return () => {
      window.removeEventListener('focus', refreshTimer);
      document.removeEventListener('visibilitychange', refreshTimer);
    };
  }, [open]);

  useEffect(() => {
    if (!timerState.isRunning || !open) return undefined;

    const intervalId = window.setInterval(() => {
      setTimerState((current) => persistTimerState(resolveTimerState(current)));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [timerState.isRunning, open]);

  useEffect(() => {
    if (!open || !timerState.pendingAlert) return;

    const pendingAlert = timerState.pendingAlert;
    if (
      timerState.lastAlertedTransition === pendingAlert.key ||
      notifiedTransitionKeys.has(pendingAlert.key)
    ) {
      setTimerState((current) => {
        if (current.pendingAlert?.key !== pendingAlert.key) return current;
        return persistTimerState({
          ...current,
          lastAlertedTransition: pendingAlert.key,
          pendingAlert: null,
        });
      });
      return;
    }

    notifiedTransitionKeys.add(pendingAlert.key);
    const copy = getAlertCopy(pendingAlert, timerState);

    playTimerSound();
    setStatusMessage(copy.body);

    if ('Notification' in window && window.Notification.permission === 'granted') {
      try {
        new window.Notification(copy.title, {
          body: copy.body,
          icon: '/pwa-192.png',
          badge: '/pwa-192.png',
        });
      } catch {
        // The in-app status message still covers browsers that block notifications.
      }
    }

    setTimerState((current) => {
      if (current.pendingAlert?.key !== pendingAlert.key) return current;
      return persistTimerState({
        ...current,
        lastAlertedTransition: pendingAlert.key,
        pendingAlert: null,
      });
    });
  }, [open, timerState]);

  useEffect(() => {
    if (!statusMessage) return undefined;

    window.clearTimeout(statusTimeoutRef.current);
    statusTimeoutRef.current = window.setTimeout(() => setStatusMessage(null), 6000);

    return () => window.clearTimeout(statusTimeoutRef.current);
  }, [statusMessage]);

  if (!open) return null;

  const totalSeconds = getPhaseSeconds(preset, timerState.phase);
  const remaining = Math.max(0, Math.min(timerState.remainingSeconds, totalSeconds));
  const progress = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeLabel = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const canChangePreset =
    timerState.isIdle &&
    !timerState.isRunning &&
    timerState.phase === 'focus' &&
    remaining === preset.focusMinutes * 60 &&
    !timerState.phaseEndsAt;

  const resetTimer = () => {
    setStatusMessage(null);
    setTimerState(persistTimerState(createDefaultTimerState(timerState.presetId)));
  };

  const toggleTimer = () => {
    setTimerState((current) => {
      const resolved = resolveTimerState(current);

      if (resolved.isRunning) {
        return persistTimerState({
          ...resolved,
          isRunning: false,
          phaseEndsAt: null,
        });
      }

      requestNotificationPermission();

      return persistTimerState({
        ...resolved,
        isIdle: false,
        isRunning: true,
        phaseEndsAt: Date.now() + resolved.remainingSeconds * 1000,
      });
    });
  };

  const changePreset = (id) => {
    if (!canChangePreset) return;
    setTimerState(persistTimerState(createDefaultTimerState(id)));
  };

  const updateNotes = (value) => {
    setNotes(value);
    localStorage.setItem(NOTES_KEY, value);
  };

  const dismissBreakOverlay = () => {
    setTimerState((current) =>
      persistTimerState({
        ...current,
        showBreakOverlay: false,
      })
    );
  };

  const timerContent = (
    <div className={embedded ? 'pomodoro-panel' : 'modal-content max-w-xl'}>
      <div className="modal-head">
        <div>
          <h2 className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-accent-indigo" />
            Smart Pomodoro
          </h2>
          <p>Focus timer with optional session notes</p>
        </div>
        {onClose && (
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close timer">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-5">
        <div className="view-toggle w-full">
          {PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={timerState.presetId === item.id ? 'active' : ''}
              onClick={() => changePreset(item.id)}
              disabled={!canChangePreset}
              title={canChangePreset ? undefined : 'Reset the timer before changing presets'}
            >
              {item.label}
            </button>
          ))}
        </div>

        {statusMessage && (
          <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)', background: 'var(--surface-tertiary)' }}>
            {statusMessage}
          </div>
        )}

        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            {timerState.phase === 'focus' ? 'Focus interval' : 'Break interval'}
          </p>
          <p className="mt-2 font-mono text-6xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>
            {timeLabel}
          </p>
          <div className="progress-bar-track mt-5 h-2">
            <div className="progress-bar-fill h-2" style={{ width: `${progress}%`, background: timerState.phase === 'focus' ? '#6366f1' : '#10b981' }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="btn-primary justify-center touch-target" onClick={toggleTimer}>
            {timerState.isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {timerState.isRunning ? 'Pause' : 'Start'}
          </button>
          <button type="button" className="btn-secondary justify-center touch-target" onClick={resetTimer}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>

        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Session notes
          </span>
          <textarea
            className="input-field min-h-28 resize-y"
            value={notes}
            onChange={(event) => updateNotes(event.target.value)}
            placeholder="Add notes for this focus session..."
          />
        </label>
      </div>
    </div>
  );

  return (
    <>
      {embedded ? (
        timerContent
      ) : (
        <div className="modal-overlay z-[55]" role="dialog" aria-modal="true" aria-label="Smart Pomodoro timer">
          {timerContent}
        </div>
      )}

      {timerState.showBreakOverlay && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: 'var(--modal-overlay)' }}>
          <div className="modal-content max-w-md text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent-emerald">Break reset</p>
            <h2 className="mt-3 text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{timerState.breakPrompt}</h2>
            <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {timeLabel} left before the next focus block.
            </p>
            <button type="button" className="btn-primary mx-auto mt-5 justify-center touch-target" onClick={dismissBreakOverlay}>
              Continue Break
            </button>
          </div>
        </div>
      )}
    </>
  );
}
