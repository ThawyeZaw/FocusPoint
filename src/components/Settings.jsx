import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Layers3,
  Moon,
  Plus,
  SlidersHorizontal,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import { curriculumTemplates } from '../data/curriculumData.js';
import { db } from '../data/mockDatabase.js';

const SUBJECT_COLORS = ['#f59e0b', '#8b5cf6', '#6366f1', '#06b6d4', '#10b981', '#f43f5e'];

export default function Settings({ onDataChange }) {
  const { isDark, toggleTheme } = useTheme();
  const [settings, setSettings] = useState(() => db.getSettings());
  const [subjects, setSubjects] = useState(() => db.getSubjects());
  const [userCourses, setUserCourses] = useState(() => db.getUserCourses());
  const [newSubjectName, setNewSubjectName] = useState('');
  const [subjectPendingDelete, setSubjectPendingDelete] = useState(null);

  const sortedSubjects = useMemo(
    () => [...subjects].sort((a, b) => a.name.localeCompare(b.name)),
    [subjects]
  );

  const addedTemplateIds = useMemo(
    () => new Set(userCourses.map((course) => course.templateId).filter(Boolean)),
    [userCourses]
  );

  useEffect(() => {
    if (window.location.hash !== '#curriculum-templates') return;
    const target = document.getElementById('curriculum-templates');
    window.setTimeout(() => {
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target?.focus({ preventScroll: true });
    }, 80);
  }, []);

  const refreshCourseState = () => {
    setSubjects(db.getSubjects());
    setUserCourses(db.getUserCourses());
    onDataChange?.();
  };

  const persistSettings = (updates) => {
    const next = db.updateSettings(updates);
    setSettings(next);
    onDataChange?.();
  };

  const updateAcademicLevel = (level) => {
    db.updateUser({ level });
    persistSettings({ academicLevel: level });
  };

  const updateExamSitting = (key, value) => {
    persistSettings({
      examSittings: {
        ...settings.examSittings,
        [key]: value,
      },
    });
  };

  const updatePreference = (key) => {
    persistSettings({
      preferences: {
        ...settings.preferences,
        [key]: !settings.preferences[key],
      },
    });
  };

  const updateSubject = (id, updates) => {
    db.updateSubject(id, updates);
    refreshCourseState();
  };

  const addSubject = (event) => {
    event.preventDefault();
    const name = newSubjectName.trim();
    if (!name) return;

    db.addSubject({
      name,
      level: settings.academicLevel,
      weighting: 1.0,
      color: SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length],
    });
    setNewSubjectName('');
    refreshCourseState();
  };

  const addTemplate = (templateId) => {
    db.addCourseFromTemplate(templateId);
    refreshCourseState();
  };

  const removeSubject = () => {
    if (!subjectPendingDelete) return;

    db.deleteSubject(subjectPendingDelete.id);
    setSubjectPendingDelete(null);
    refreshCourseState();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Control Center
          </p>
          <h1 className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
            Settings
          </h1>
        </div>
        <span className="dashboard-chip w-fit">
          <SlidersHorizontal className="w-3.5 h-3.5 text-accent-indigo" />
          <span>{subjects.length} active courses</span>
        </span>
      </div>

      <section className="glass-card-static space-y-5">
        <SectionHeader
          icon={<GraduationCap className="w-4 h-4 text-accent-indigo" />}
          title="Profile & Timeline"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="space-y-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
              Academic level
            </span>
            <select
              className="select-field"
              value={settings.academicLevel}
              onChange={(event) => updateAcademicLevel(event.target.value)}
            >
              <option value="A-Level">A-Level</option>
              <option value="IGCSE">IGCSE</option>
            </select>
          </label>

          <DateField
            label="May/June 2026 sitting"
            value={settings.examSittings.mayJune2026}
            onChange={(value) => updateExamSitting('mayJune2026', value)}
          />
          <DateField
            label="January 2027 sitting"
            value={settings.examSittings.january2027}
            onChange={(value) => updateExamSitting('january2027', value)}
          />
        </div>
      </section>

      <section
        id="curriculum-templates"
        tabIndex={-1}
        className="glass-card-static space-y-5 scroll-mt-24 focus:outline-none"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <SectionHeader
              icon={<GraduationCap className="w-4 h-4 text-accent-indigo" />}
              title="Curriculum Templates"
            />
            <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--text-secondary)' }}>
              Add blueprint curricula to your tracker. Templates stay read-only; your progress and custom topics live in your own courses.
            </p>
          </div>
          <span className="dashboard-chip w-fit">
            <BookOpen className="w-3.5 h-3.5 text-accent-cyan" />
            <span>{curriculumTemplates.length} templates</span>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {curriculumTemplates.map((template) => (
            <CurriculumTemplateCard
              key={template.id}
              template={template}
              isAdded={addedTemplateIds.has(template.id)}
              onAdd={() => addTemplate(template.id)}
            />
          ))}
        </div>
      </section>

      <section className="glass-card-static space-y-5">
        <SectionHeader
          icon={<SlidersHorizontal className="w-4 h-4 text-accent-cyan" />}
          title="Course Management"
        />

        <form className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-3" onSubmit={addSubject}>
          <input
            className="input-field"
            value={newSubjectName}
            onChange={(event) => setNewSubjectName(event.target.value)}
            placeholder="Add a subject"
          />
          <button type="submit" className="btn-primary justify-center touch-target">
            <Plus className="w-4 h-4" />
            Add Subject
          </button>
        </form>

        <div className="space-y-3">
          {sortedSubjects.map((subject) => (
            <div
              key={subject.id}
              className="rounded-xl border p-4"
              style={{ borderColor: 'var(--border-secondary)', background: 'var(--surface-tertiary)' }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_120px_minmax(160px,1fr)_auto] gap-3 items-center">
                <label className="space-y-2 min-w-0">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                    Subject
                  </span>
                  <input
                    className="input-field"
                    value={subject.name}
                    onChange={(event) => updateSubject(subject.id, { name: event.target.value })}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                    Level
                  </span>
                  <select
                    className="select-field"
                    value={subject.level}
                    onChange={(event) => updateSubject(subject.id, { level: event.target.value })}
                  >
                    <option value="A-Level">A-Level</option>
                    <option value="IGCSE">IGCSE</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="flex items-center justify-between gap-3 text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                    <span>Weighting</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{Number(subject.weighting).toFixed(1)}x</strong>
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="2"
                    step="0.1"
                    value={subject.weighting}
                    onChange={(event) => updateSubject(subject.id, { weighting: Number(event.target.value) })}
                    className="w-full accent-indigo-500"
                  />
                </label>

                <button
                  type="button"
                  className="btn-secondary justify-center touch-target"
                  onClick={() => setSubjectPendingDelete(subject)}
                  aria-label={`Remove ${subject.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card-static space-y-5">
        <SectionHeader
          icon={isDark ? <Moon className="w-4 h-4 text-accent-amber" /> : <Sun className="w-4 h-4 text-accent-amber" />}
          title="Preferences"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <PreferenceToggle
            label="Dark mode"
            checked={isDark}
            onClick={toggleTheme}
          />
          <PreferenceToggle
            label="Enable ROW Method formatting"
            checked={settings.preferences.rowMethod}
            onClick={() => updatePreference('rowMethod')}
          />
          <PreferenceToggle
            label="Enable FOCUS Method tracking"
            checked={settings.preferences.focusMethod}
            onClick={() => updatePreference('focusMethod')}
          />
        </div>
      </section>

      {subjectPendingDelete && (
        <SubjectDeleteDialog
          subject={subjectPendingDelete}
          onCancel={() => setSubjectPendingDelete(null)}
          onConfirm={removeSubject}
        />
      )}
    </div>
  );
}

function SubjectDeleteDialog({ subject, onCancel, onConfirm }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return (
    <div className="modal-overlay" onMouseDown={onCancel}>
      <div className="modal-content max-w-md" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div className="flex items-start gap-3">
            <span
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-accent-rose)' }}
            >
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2>Delete Subject?</h2>
              <p>This will remove {subject.name} from your courses.</p>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onCancel} aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Related study data may also be removed because FocusPoint cleans up items that no longer belong to an active subject.
        </p>

        <div className="modal-actions mt-6">
          <button type="button" className="btn-secondary touch-target" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn-danger touch-target" onClick={onConfirm}>
            <Trash2 className="w-4 h-4" />
            Delete Subject
          </button>
        </div>
      </div>
    </div>
  );
}

function CurriculumTemplateCard({ template, isAdded, onAdd }) {
  const sectionCount = template.sections.length;
  const topicCount = template.sections.reduce((total, section) => total + section.topics.length, 0);

  return (
    <article
      className="flex min-h-72 flex-col rounded-xl border p-4"
      style={{ borderColor: 'var(--border-secondary)', background: 'var(--surface-tertiary)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-indigo">{template.curriculum}</p>
          <h3 className="mt-2 text-lg font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
            {template.title}
          </h3>
        </div>
        <span
          className="shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold capitalize"
          style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)', background: 'var(--surface-secondary)' }}
        >
          {template.structureType}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <TemplateStat icon={<Layers3 className="h-4 w-4" />} label="Sections" value={sectionCount} />
        <TemplateStat icon={<BookOpen className="h-4 w-4" />} label="Topics" value={topicCount} />
      </div>

      <div className="mt-5 flex-1 space-y-2">
        {template.sections.slice(0, 4).map((section) => (
          <div
            key={section.id}
            className="rounded-lg border px-3 py-2 text-xs font-medium"
            style={{ borderColor: 'var(--border-secondary)', background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}
          >
            {section.title}
          </div>
        ))}
      </div>

      <button
        type="button"
        className={`mt-5 min-h-11 justify-center ${isAdded ? 'btn-secondary' : 'btn-primary'}`}
        onClick={onAdd}
        disabled={isAdded}
      >
        {isAdded ? <CheckCircle2 className="h-4 w-4 text-accent-emerald" /> : <Plus className="h-4 w-4" />}
        {isAdded ? 'Already Added' : 'Add to Tracker'}
      </button>
    </article>
  );
}

function TemplateStat({ icon, label, value }) {
  return (
    <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border-secondary)', background: 'var(--surface-secondary)' }}>
      <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
        {icon}
        <span className="text-[11px] font-bold uppercase">{label}</span>
      </div>
      <p className="mt-1 text-lg font-black" style={{ color: 'var(--text-primary)' }}>{value}</p>
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

function DateField({ label, value, onChange }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <div className="relative">
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          type="date"
          className="input-field pl-9"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </label>
  );
}

function PreferenceToggle({ label, checked, onClick }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="flex min-h-14 items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left"
      style={{
        borderColor: checked ? 'color-mix(in srgb, var(--color-accent-indigo) 45%, var(--border-primary))' : 'var(--border-secondary)',
        background: checked ? 'rgba(99, 102, 241, 0.1)' : 'var(--surface-tertiary)',
        color: 'var(--text-primary)',
      }}
      onClick={onClick}
    >
      <span className="text-sm font-semibold">{label}</span>
      <span
        className="relative h-7 w-12 shrink-0 rounded-full border transition-colors"
        style={{
          borderColor: checked ? 'var(--color-accent-indigo)' : 'var(--border-primary)',
          background: checked ? 'var(--color-accent-indigo)' : 'var(--surface-input)',
        }}
      >
        <span
          className="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? 'translateX(22px)' : 'translateX(4px)' }}
        />
      </span>
    </button>
  );
}
