import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Layers3,
  Plus,
} from 'lucide-react';
import { db } from '@focuspoint/shared/study-data/mockDatabase';

const STATUS_OPTIONS = ['Not Started', 'Beginner', 'In Progress', 'Reviewing', 'Proficient', 'Mastered'];

const STATUS_BADGE_CLASSES = {
  'Not Started': 'badge-not-started',
  Beginner: 'badge-beginner',
  'In Progress': 'badge-in-progress',
  Reviewing: 'badge-reviewing',
  Proficient: 'badge-proficient',
  Mastered: 'badge-mastered',
};

const CONFIDENCE_LABELS = {
  0: 'Not Started',
  1: 'Beginner',
  2: 'In Progress',
  3: 'Reviewing',
  4: 'Proficient',
  5: 'Mastered',
};

export default function LessonTracker({ onDataChange }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState(() => db.getUserCourses());
  const [activeCourseId, setActiveCourseId] = useState(() => db.getUserCourses()[0]?.id || null);
  const [expandedSections, setExpandedSections] = useState({});

  const activeCourse = useMemo(
    () => courses.find((course) => course.id === activeCourseId) || courses[0] || null,
    [courses, activeCourseId]
  );

  const refreshCourses = useCallback((nextActiveId) => {
    const nextCourses = db.getUserCourses();
    setCourses(nextCourses);
    setActiveCourseId(nextActiveId || nextCourses[0]?.id || null);
    onDataChange?.();
  }, [onDataChange]);

  const goToTemplates = () => {
    navigate('/courses');
  };

  const handleConfidenceChange = (sectionId, topic, confidence) => {
    if (!activeCourse) return;
    db.updateTopicStatus(activeCourse.id, sectionId, topic.id, topic.status, confidence);
    refreshCourses(activeCourse.id);
  };

  const handleCourseSelect = (courseId) => {
    setActiveCourseId(courseId);
  };

  const courseStats = getCourseStats(activeCourse);

  if (!activeCourse) {
    return (
      <div className="animate-fade-in">
        <EmptyTracker onManageTemplates={goToTemplates} />
      </div>
    );
  }

  return (
    <div className="tracker-page animate-fade-in">
      <header className="tracker-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Progress Workspace
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            <BookOpen className="h-5 w-5 text-accent-indigo" />
            Curriculum Tracker
          </h1>
          <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--text-secondary)' }}>
            Track each course by module, update topic status, and tune confidence as your revision changes.
          </p>
        </div>

        <button type="button" className="btn-secondary hidden min-h-11 justify-center sm:inline-flex" onClick={goToTemplates}>
          <Layers3 className="h-4 w-4" />
          Manage Courses
        </button>
      </header>

      <nav className="tracker-course-nav" aria-label="Active courses">
        <div className="tracker-course-nav-mobile">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Select course</span>
            <select
              className="select-field"
              value={activeCourse.id}
              onChange={(event) => handleCourseSelect(event.target.value)}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="tracker-course-pills">
          {courses.map((course) => {
            const isActive = activeCourse.id === course.id;
            return (
              <button
                type="button"
                key={course.id}
                className={`tracker-course-pill ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handleCourseSelect(course.id)}
              >
                {course.title}
              </button>
            );
          })}
          <button type="button" className="tracker-course-pill tracker-course-pill-action" onClick={goToTemplates}>
            <Plus className="h-4 w-4" />
            Add Course
          </button>
        </div>
      </nav>

      <section className="tracker-overview-card" style={{ borderColor: 'var(--border-primary)', background: 'var(--surface-secondary)' }}>
        <div className="tracker-overview-grid">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-accent-indigo">{activeCourse.curriculum}</p>
            <h2 className="mt-1 text-2xl font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
              {activeCourse.title}
            </h2>
            <p className="mt-2 text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
              {activeCourse.structureType} structure
            </p>
          </div>

          <div className="tracker-metrics-grid">
            <CourseMetric label="Topics" value={courseStats.total} />
            <CourseMetric label="Mastered" value={courseStats.mastered} />
            <CourseMetric label="Active" value={courseStats.inProgress} />
            <CourseMetric label="Complete" value={`${courseStats.percent}%`} />
          </div>
        </div>

        <div className="tracker-course-progress" style={{ background: 'var(--progress-track)' }}>
          <div className="h-full rounded-full bg-accent-indigo transition-all" style={{ width: `${courseStats.percent}%` }} />
        </div>
      </section>

      <section className="tracker-section-list" aria-label={`${activeCourse.title} sections`}>
        {activeCourse.sections.map((section, index) => {
          const sectionKey = `${activeCourse.id}:${section.id}`;
          const isOpen = expandedSections[sectionKey] ?? index === 0;
          const stats = getSectionStats(section);
          const panelId = `section-panel-${section.id}`;

          return (
            <article key={section.id} className="tracker-section-card" style={{ borderColor: 'var(--border-primary)', background: 'var(--surface-secondary)' }}>
              <button
                type="button"
                className="tracker-section-toggle"
                aria-expanded={Boolean(isOpen)}
                aria-controls={panelId}
                onClick={() => setExpandedSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }))}
              >
                {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} /> : <ChevronRight className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />}
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>{section.title}</h3>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {stats.mastered} of {stats.total} topics mastered
                  </p>
                </div>
                <div className="hidden w-36 items-center gap-2 sm:flex">
                  <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--progress-track)' }}>
                    <div className="h-full rounded-full bg-accent-emerald" style={{ width: `${stats.percent}%` }} />
                  </div>
                  <span className="w-9 text-right text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{stats.percent}%</span>
                </div>
              </button>

              {isOpen && (
                <div id={panelId} className="tracker-section-panel" style={{ borderColor: 'var(--border-secondary)', background: 'color-mix(in srgb, var(--surface-tertiary) 45%, transparent)' }}>
                  <div className="tracker-topic-list">
                    {section.topics.map((topic) => (
                      <TopicRow
                        key={topic.id}
                        topic={topic}
                        onConfidenceChange={(confidence) => handleConfidenceChange(section.id, topic, confidence)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </section>

    </div>
  );
}

function EmptyTracker({ onManageTemplates }) {
  return (
    <div className="rounded-2xl border border-dashed p-8 text-center sm:p-12" style={{ borderColor: 'var(--border-primary)', background: 'var(--surface-secondary)' }}>
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'var(--surface-tertiary)', color: 'var(--color-accent-indigo)' }}>
        <ClipboardList className="h-6 w-6" />
      </span>
      <h1 className="mt-5 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        No active courses yet
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: 'var(--text-secondary)' }}>
        Add a curriculum template or custom course, then come back here to track progress by module and topic.
      </p>
      <button type="button" className="btn-primary mx-auto mt-6 min-h-11 justify-center" onClick={onManageTemplates}>
        <Layers3 className="h-4 w-4" />
        Manage Courses
      </button>
    </div>
  );
}

function CourseMetric({ label, value }) {
  return (
    <div className="tracker-metric-card" style={{ borderColor: 'var(--border-secondary)', background: 'var(--surface-tertiary)' }}>
      <p className="text-lg font-black leading-none" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );
}

function TopicRow({ topic, onConfidenceChange }) {
  const confidence = clampConfidence(topic.confidence);
  const displayStatus = CONFIDENCE_LABELS[confidence] || topic.status || 'Not Started';
  const sliderId = `confidence-${topic.id}`;

  return (
    <div className="tracker-topic-row" style={{ borderColor: 'var(--border-secondary)', background: 'var(--surface-secondary)' }}>
      <div className="tracker-topic-layout">
        <div className="tracker-topic-title">
          <p className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--text-primary)' }}>{topic.title}</p>
          {topic.lastReviewed && (
            <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Reviewed {new Date(topic.lastReviewed).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="tracker-topic-controls">
          <div className="tracker-status-control">
            <span className="tracker-control-label" style={{ color: 'var(--text-tertiary)' }}>
              Status
            </span>
            <span className={`tracker-status-badge ${STATUS_BADGE_CLASSES[displayStatus] || 'badge-not-started'}`}>
              {displayStatus}
            </span>
          </div>

          <div className="tracker-confidence-control">
            <div className="tracker-confidence-head">
              <label className="tracker-control-label" htmlFor={sliderId} style={{ color: 'var(--text-tertiary)' }}>
                Confidence
              </label>
              <span className="confidence-value-badge">
                {confidence}/5
              </span>
            </div>
            <div className="confidence-slider-row">
              <input
                id={sliderId}
                className="confidence-range"
                type="range"
                min="0"
                max="5"
                step="1"
                value={confidence}
                onChange={(event) => onConfidenceChange(Number(event.target.value))}
                aria-valuetext={`${displayStatus}, ${confidence} out of 5`}
              />
              <div className="confidence-scale" aria-hidden="true">
                {STATUS_OPTIONS.map((status, index) => (
                  <span key={status}>{index}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getCourseStats(course) {
  if (!course) return { total: 0, mastered: 0, inProgress: 0, notStarted: 0, percent: 0 };
  const topics = course.sections.flatMap((section) => section.topics);
  const total = topics.length;
  const mastered = topics.filter((topic) => topic.status === 'Mastered').length;
  const notStarted = topics.filter((topic) => topic.status === 'Not Started').length;
  const inProgress = topics.filter((topic) => topic.status !== 'Mastered' && topic.status !== 'Not Started').length;
  return {
    total,
    mastered,
    inProgress,
    notStarted,
    percent: total > 0 ? Math.round((mastered / total) * 100) : 0,
  };
}

function clampConfidence(value) {
  return Math.min(5, Math.max(0, Math.round(Number(value) || 0)));
}

function getSectionStats(section) {
  const total = section.topics.length;
  const mastered = section.topics.filter((topic) => topic.status === 'Mastered').length;
  return {
    total,
    mastered,
    percent: total > 0 ? Math.round((mastered / total) * 100) : 0,
  };
}
