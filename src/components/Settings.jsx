import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Check,
  ExternalLink,
  GraduationCap,
  Mail,
  Moon,
  Palette,
  Send,
  SlidersHorizontal,
  Sun,
  User,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import { db } from '../data/mockDatabase.js';
import { getNotificationPermission, requestNotificationPermission } from '../utils/notifications.js';

const TELEGRAM_URL = 'https://t.me/Ko_Thorin';

export default function Settings({ onDataChange }) {
  const { isDark, toggleTheme, accentColor, setAccentColor, accentOptions } = useTheme();
  const [user, setUser] = useState(() => db.getUser());
  const [settings, setSettings] = useState(() => db.getSettings());
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission);
  const [savedMessage, setSavedMessage] = useState('');

  const selectedAccent = useMemo(
    () => accentOptions.find((option) => option.color === accentColor) || accentOptions[0],
    [accentColor, accentOptions]
  );

  useEffect(() => {
    const storedAccent = settings.preferences?.accentColor;
    if (storedAccent) setAccentColor(storedAccent);
  }, []);

  useEffect(() => {
    if (!savedMessage) return undefined;
    const timeoutId = window.setTimeout(() => setSavedMessage(''), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [savedMessage]);

  const persistUser = (updates) => {
    const nextUser = db.updateUser(updates);
    setUser(nextUser);
    onDataChange?.();
    setSavedMessage('Settings saved');
  };

  const persistSettings = (updates) => {
    const nextSettings = db.updateSettings(updates);
    setSettings(nextSettings);
    onDataChange?.();
    setSavedMessage('Settings saved');
  };

  const updateProfileField = (key, value) => {
    persistUser({ [key]: value });
    if (key === 'level') persistSettings({ academicLevel: value });
  };

  const chooseAccent = (color) => {
    setAccentColor(color);
    persistSettings({
      preferences: {
        ...settings.preferences,
        accentColor: color,
      },
    });
  };

  const enableNotifications = async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
  };

  const notificationCopy = (() => {
    if (notificationPermission === 'unsupported') return 'This browser does not support web notifications.';
    if (notificationPermission === 'granted') return 'Notifications are enabled for timetable reminders and Pomodoro sessions.';
    if (notificationPermission === 'denied') return 'Notifications are blocked. Re-enable them from your browser site settings.';
    return 'Enable notifications to receive timetable reminders and Pomodoro alerts.';
  })();

  return (
    <div className="settings-page animate-fade-in space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Control Center
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            <SlidersHorizontal className="h-5 w-5 text-accent-indigo" />
            Settings
          </h1>
          <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--text-secondary)' }}>
            Update your profile, appearance, notifications, and support contact in one place.
          </p>
        </div>
        {savedMessage && (
          <span className="dashboard-chip w-fit">
            <Check className="h-3.5 w-3.5 text-accent-emerald" />
            <span>{savedMessage}</span>
          </span>
        )}
      </header>

      <section className="glass-card-static settings-section">
        <SectionHeader icon={<User className="h-4 w-4 text-accent-indigo" />} title="Profile" />
        <div className="settings-form-grid">
          <label className="space-y-2">
            <span className="settings-field-label">Name</span>
            <input
              className="input-field !px-3"
              value={user.name || ''}
              onChange={(event) => updateProfileField('name', event.target.value)}
              placeholder="Your name"
            />
          </label>

          <label className="space-y-2">
            <span className="settings-field-label">Email</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                className="input-field pl-9"
                type="email"
                value={user.email || ''}
                onChange={(event) => updateProfileField('email', event.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="settings-field-label">Academic level</span>
            <div className="relative">
              <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <select
                className="select-field pl-9"
                value={user.level || settings.academicLevel || 'A-Level'}
                onChange={(event) => updateProfileField('level', event.target.value)}
              >
                <option value="A-Level">A-Level</option>
                <option value="IGCSE">IGCSE</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </label>
        </div>
      </section>

      <section className="glass-card-static settings-section">
        <SectionHeader
          icon={isDark ? <Moon className="h-4 w-4 text-accent-amber" /> : <Sun className="h-4 w-4 text-accent-amber" />}
          title="Appearance"
        />
        <div className="settings-preference-grid">
          <PreferenceToggle label={isDark ? 'Dark mode' : 'Light mode'} checked={isDark} onClick={toggleTheme} />
          <div className="settings-accent-panel">
            <div className="min-w-0">
              <p className="settings-field-label">Accent color</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Current: {selectedAccent.label}
              </p>
            </div>
            <div className="settings-color-grid" role="radiogroup" aria-label="Accent color">
              {accentOptions.map((option) => {
                const isSelected = option.color === accentColor;
                return (
                  <button
                    type="button"
                    key={option.id}
                    className={`settings-color-button ${isSelected ? 'active' : ''}`}
                    style={{ '--swatch-color': option.color }}
                    onClick={() => chooseAccent(option.color)}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`Use ${option.label}`}
                    title={option.label}
                  >
                    {isSelected && <Check className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card-static settings-section">
        <SectionHeader icon={<Bell className="h-4 w-4 text-accent-cyan" />} title="Notifications" />
        <div className="settings-action-panel">
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Timetable and Pomodoro alerts
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {notificationCopy}
            </p>
          </div>
          <button
            type="button"
            className="btn-primary min-h-11 justify-center"
            onClick={enableNotifications}
            disabled={notificationPermission === 'granted' || notificationPermission === 'unsupported'}
          >
            <Bell className="h-4 w-4" />
            {notificationPermission === 'granted' ? 'Enabled' : 'Enable'}
          </button>
        </div>
      </section>

      <section className="glass-card-static settings-section">
        <SectionHeader icon={<Send className="h-4 w-4 text-accent-emerald" />} title="Contact" />
        <div className="settings-action-panel">
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Need help or want to share feedback?
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Message me on Telegram at @Ko_Thorin.
            </p>
          </div>
          <a className="btn-secondary min-h-11 justify-center" href={TELEGRAM_URL} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" />
            Telegram
          </a>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
    </div>
  );
}

function PreferenceToggle({ label, checked, onClick }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="settings-toggle"
      onClick={onClick}
    >
      <span className="flex items-center gap-2 text-sm font-semibold">
        <Palette className="h-4 w-4" />
        {label}
      </span>
      <span className="settings-toggle-track">
        <span className="settings-toggle-thumb" />
      </span>
    </button>
  );
}
