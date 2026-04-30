import React, { useState, useMemo } from 'react';
import {
  Clock,
  Plus,
  X,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Trash2,
} from 'lucide-react';
import { db } from '../data/mockDatabase.js';
import { daysUntil } from '../engine/priorityEngine.js';

export default function ExamCountdown({ onDataChange }) {
  const subjects = db.getSubjects();
  const [exams, setExams] = useState(() => db.getExams());
  const [showAddModal, setShowAddModal] = useState(false);

  const enrichedExams = useMemo(() => {
    return exams
      .map((exam) => {
        const subject = subjects.find((s) => s.id === exam.subjectId);
        const daysLeft = daysUntil(exam.date);
        return {
          ...exam,
          subjectName: subject?.name || 'Unknown',
          subjectColor: subject?.color || '#6366f1',
          daysLeft,
          urgencyLevel: daysLeft <= 7 ? 'critical' : daysLeft <= 14 ? 'warning' : 'normal',
          dateFormatted: new Date(exam.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [exams, subjects]);

  const handleDelete = (id) => {
    db.deleteExam(id);
    setExams(db.getExams());
    onDataChange?.();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Clock className="w-4.5 h-4.5 text-accent-rose" />
          Exam Countdown
        </h1>
        <button id="add-exam-btn" className="btn-primary text-xs touch-target" onClick={() => setShowAddModal(true)}>
          <Plus className="w-3.5 h-3.5" />
          Add Exam
        </button>
      </div>

      {/* Featured Countdown — Next Exam */}
      {enrichedExams.length > 0 && (
        <div
          className="glass-card exam-feature-card text-center animate-slide-up relative overflow-hidden"
          style={{ animationDelay: '0.1s', opacity: 0 }}
        >
          {/* Gradient bg accent */}
          <div
            className="absolute inset-0 opacity-10"
            style={{ background: `radial-gradient(circle at 50% 0%, ${enrichedExams[0].subjectColor}, transparent 70%)` }}
          />
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-accent-rose" />
              <span className="text-sm font-semibold text-accent-rose uppercase tracking-wider">Next Exam</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black" style={{ color: 'var(--text-primary)' }}>
              {enrichedExams[0].daysLeft}
              <span className="text-xl md:text-2xl font-medium ml-2" style={{ color: 'var(--text-muted)' }}>days</span>
            </h2>
            <p className="text-lg font-semibold mt-3" style={{ color: 'var(--text-primary)' }}>
              {enrichedExams[0].subjectName} — {enrichedExams[0].paper}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>{enrichedExams[0].dateFormatted}</p>
            {/* Circular progress */}
            <div className="flex justify-center mt-8">
              <CountdownRing daysLeft={enrichedExams[0].daysLeft} maxDays={60} color={enrichedExams[0].subjectColor} />
            </div>
          </div>
        </div>
      )}

      {/* All Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enrichedExams.map((exam, i) => {
          const maxDays = 60;
          const pct = Math.max(0, Math.min(100, ((maxDays - exam.daysLeft) / maxDays) * 100));
          const urgIcon =
            exam.urgencyLevel === 'critical' ? (
              <AlertTriangle className="w-4 h-4 text-accent-rose" />
            ) : exam.urgencyLevel === 'warning' ? (
              <Clock className="w-4 h-4 text-accent-amber" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-accent-emerald" />
            );
          const urgLabel =
            exam.urgencyLevel === 'critical' ? 'Critical' : exam.urgencyLevel === 'warning' ? 'Soon' : 'On Track';
          const urgClass =
            exam.urgencyLevel === 'critical'
              ? 'urgency-critical'
              : exam.urgencyLevel === 'warning'
                ? 'urgency-warning'
                : 'urgency-normal';
          const barColor =
            exam.urgencyLevel === 'critical' ? '#f43f5e' : exam.urgencyLevel === 'warning' ? '#f59e0b' : '#10b981';

          return (
            <div
              key={exam.id}
              className="glass-card relative group animate-slide-up"
              style={{ animationDelay: `${0.1 + i * 0.05}s`, opacity: 0 }}
            >
              <button
                className="absolute top-4 right-4 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete(exam.id)}
                title="Delete exam"
                style={{ color: 'var(--text-muted)' }}
              >
                <Trash2 className="w-3.5 h-3.5 hover:text-accent-rose transition-colors" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                {urgIcon}
                <span className={`text-xs font-semibold uppercase tracking-wider ${urgClass}`}>{urgLabel}</span>
              </div>

              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{exam.subjectName}</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{exam.paper}</p>

              <div className="flex items-end gap-2 mt-5">
                <span className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{exam.daysLeft}</span>
                <span className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>days left</span>
              </div>

              <div className="flex items-center gap-2 mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Calendar className="w-3 h-3" />
                {exam.dateFormatted}
              </div>

              <div className="progress-bar-track mt-5">
                <div className="progress-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
              </div>
            </div>
          );
        })}
      </div>

      {enrichedExams.length === 0 && (
        <div className="glass-card-static empty-state text-center">
          <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No exams scheduled</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Add your first exam to start the countdown.</p>
        </div>
      )}

      {/* Add Exam Modal */}
      {showAddModal && (
        <AddExamModal
          subjects={subjects}
          onClose={() => setShowAddModal(false)}
          onAdd={() => {
            setExams(db.getExams());
            onDataChange?.();
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

function CountdownRing({ daysLeft, maxDays, color }) {
  const size = 120;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, daysLeft / maxDays));
  const dashOffset = circumference * (1 - pct);

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--progress-track)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  );
}

function AddExamModal({ subjects, onClose, onAdd }) {
  const [form, setForm] = useState({
    subjectId: subjects[0]?.id || '',
    paper: '',
    date: '',
    color: '#6366f1',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.paper || !form.date) return;
    db.addExam(form);
    onAdd();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Add Exam Paper</h2>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>Subject</label>
            <select className="select-field" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
              {subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>Paper Name</label>
            <input className="input-field" placeholder="e.g. Paper 2 — Structured Questions" value={form.paper} onChange={(e) => setForm({ ...form, paper: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>Exam Date</label>
            <input type="date" className="input-field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </div>
          <div className="modal-form-actions flex gap-4 pt-2">
            <button type="button" className="btn-secondary flex-1 touch-target justify-center" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1 touch-target justify-center">
              <Clock className="w-4 h-4" />
              Add Exam
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
