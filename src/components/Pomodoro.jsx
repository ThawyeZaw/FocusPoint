import React from 'react';
import { Timer } from 'lucide-react';
import SmartPomodoro from './SmartPomodoro.jsx';

export default function Pomodoro() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Focus Session
          </p>
          <h1 className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
            Pomodoro
          </h1>
        </div>
        <span className="dashboard-chip w-fit">
          <Timer className="w-3.5 h-3.5 text-accent-indigo" />
          <span>25/5 or 50/10</span>
        </span>
      </div>

      <SmartPomodoro embedded />
    </div>
  );
}
