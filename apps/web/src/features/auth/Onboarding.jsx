import React, { useMemo, useState } from 'react';
import { Check, GraduationCap, Sparkles } from 'lucide-react';
import { curriculumTemplateGroups } from '@focuspoint/shared/curriculum/curriculumData';
import { useAuth } from '../../shared/context/AuthContext.jsx';

const LEVELS = ['A-Level', 'IGCSE', 'Other'];
const ACCENTS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];

export default function Onboarding() {
  const { user, completeOnboarding, setupError } = useAuth();
  const [form, setForm] = useState({
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
    academicLevel: 'A-Level',
    curriculum: 'Edexcel IAL',
    courses: '',
    examSession: 'May/June 2026',
    examDate: '',
    weeklyStudyHours: '8',
    schoolHours: '',
    studyGoal: '',
    accentColor: '#6366f1',
    templateIds: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const templateGroups = useMemo(() => curriculumTemplateGroups.slice(0, 5), []);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleTemplate = (templateId) => {
    setForm((prev) => {
      const selected = new Set(prev.templateIds);
      if (selected.has(templateId)) selected.delete(templateId);
      else selected.add(templateId);
      return { ...prev, templateIds: Array.from(selected) };
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await completeOnboarding(form);
    } catch (err) {
      setError(err.message || 'Could not finish onboarding.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="onboarding-shell">
      <form className="onboarding-panel" onSubmit={submit}>
        <header className="onboarding-header">
          <span className="auth-brand-icon"><Sparkles className="h-5 w-5" /></span>
          <div>
            <p>Personal setup</p>
            <h1>Build your study workspace</h1>
          </div>
        </header>

        {(error || setupError) && <p className="auth-error">{error || setupError}</p>}

        <section className="onboarding-grid">
          <label>
            <span>Name</span>
            <input className="input-field" value={form.name} onChange={(event) => update('name', event.target.value)} required />
          </label>

          <label>
            <span>Academic level</span>
            <select className="select-field" value={form.academicLevel} onChange={(event) => update('academicLevel', event.target.value)}>
              {LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
          </label>

          <label>
            <span>Curriculum / exam board</span>
            <input className="input-field" value={form.curriculum} onChange={(event) => update('curriculum', event.target.value)} />
          </label>

          <label>
            <span>Exam session</span>
            <input className="input-field" value={form.examSession} onChange={(event) => update('examSession', event.target.value)} />
          </label>

          <label>
            <span>Exact exam date</span>
            <input className="input-field" type="date" value={form.examDate} onChange={(event) => update('examDate', event.target.value)} />
          </label>

          <label>
            <span>Weekly study hours</span>
            <input
              className="input-field"
              type="number"
              min="1"
              max="80"
              value={form.weeklyStudyHours}
              onChange={(event) => update('weeklyStudyHours', event.target.value)}
            />
          </label>

          <label className="onboarding-span">
            <span>Courses or subjects to track</span>
            <input
              className="input-field"
              value={form.courses}
              placeholder="Mathematics, Physics, Information Technology"
              onChange={(event) => update('courses', event.target.value)}
            />
          </label>

          <label className="onboarding-span">
            <span>School hours / unavailable time</span>
            <input
              className="input-field"
              value={form.schoolHours}
              placeholder="Mon-Fri 8:00-14:00"
              onChange={(event) => update('schoolHours', event.target.value)}
            />
          </label>

          <label className="onboarding-span">
            <span>Study goal or target grade</span>
            <textarea
              className="input-field onboarding-textarea"
              value={form.studyGoal}
              placeholder="e.g. Reach A grades in Physics and Maths before May exams"
              onChange={(event) => update('studyGoal', event.target.value)}
            />
          </label>
        </section>

        <section className="onboarding-template-section">
          <div className="onboarding-section-title">
            <GraduationCap className="h-4 w-4" />
            <h2>Starter templates</h2>
          </div>
          <div className="onboarding-template-grid">
            {templateGroups.flatMap((group) => group.templates.slice(0, 3).map((template) => {
              const isSelected = form.templateIds.includes(template.id);
              return (
                <button
                  type="button"
                  key={template.id}
                  className={`onboarding-template ${isSelected ? 'active' : ''}`}
                  onClick={() => toggleTemplate(template.id)}
                  aria-pressed={isSelected}
                >
                  <strong>{template.title}</strong>
                  <span>{template.curriculum}</span>
                  {isSelected && <Check className="h-4 w-4" />}
                </button>
              );
            }))}
          </div>
        </section>

        <section className="onboarding-accent-row" aria-label="Accent color">
          {ACCENTS.map((color) => (
            <button
              type="button"
              key={color}
              className={form.accentColor === color ? 'active' : ''}
              style={{ '--swatch-color': color }}
              onClick={() => update('accentColor', color)}
              aria-label={`Use accent ${color}`}
            />
          ))}
        </section>

        <button type="submit" className="btn-primary onboarding-submit" disabled={submitting}>
          <Check className="h-4 w-4" />
          {submitting ? 'Creating workspace...' : 'Start studying'}
        </button>
      </form>
    </main>
  );
}
