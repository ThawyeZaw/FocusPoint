import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Layers3,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { curriculumTemplateGroups, curriculumTemplates } from '../data/curriculumData.js';
import { db } from '../data/mockDatabase.js';

const COURSE_COLORS = ['#f59e0b', '#8b5cf6', '#6366f1', '#06b6d4', '#10b981', '#f43f5e'];

const STRUCTURE_OPTIONS = [
  { value: 'custom', label: 'Custom' },
  { value: 'modular', label: 'Modular' },
  { value: 'linear', label: 'Linear' },
  { value: 'skill-based', label: 'Skill-based' },
];

const DEFAULT_COURSE_FORM = {
  title: '',
  curriculum: 'Custom',
  structureType: 'custom',
};

export default function CourseManagement({ onDataChange }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState(() => db.getUserCourses());
  const [activeCourseId, setActiveCourseId] = useState(() => db.getUserCourses()[0]?.id || null);
  const [courseForm, setCourseForm] = useState(DEFAULT_COURSE_FORM);
  const [sectionDraft, setSectionDraft] = useState('');
  const [topicDrafts, setTopicDrafts] = useState({});
  const [selectedTemplateGroupId, setSelectedTemplateGroupId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const activeCourse = useMemo(
    () => courses.find((course) => course.id === activeCourseId) || courses[0] || null,
    [courses, activeCourseId]
  );

  const addedTemplateIds = useMemo(
    () => new Set(courses.map((course) => course.templateId).filter(Boolean)),
    [courses]
  );

  const selectedTemplateGroup = useMemo(
    () => curriculumTemplateGroups.find((group) => group.id === selectedTemplateGroupId) || null,
    [selectedTemplateGroupId]
  );

  const refreshCourses = (nextActiveId) => {
    const nextCourses = db.getUserCourses();
    const fallbackId = nextCourses.find((course) => course.id === activeCourseId)?.id || nextCourses[0]?.id || null;
    setCourses(nextCourses);
    setActiveCourseId(nextActiveId || fallbackId);
    onDataChange?.();
  };

  const addTemplate = (templateId) => {
    const course = db.addCourseFromTemplate(templateId);
    refreshCourses(course?.id);
  };

  const addCustomCourse = (event) => {
    event.preventDefault();
    const title = courseForm.title.trim();
    if (!title) return;

    const course = db.addCustomCourse({
      ...courseForm,
      title,
      color: COURSE_COLORS[courses.length % COURSE_COLORS.length],
    });
    setCourseForm(DEFAULT_COURSE_FORM);
    refreshCourses(course?.id);
  };

  const updateCourse = (updates) => {
    if (!activeCourse) return;
    const course = db.updateUserCourse(activeCourse.id, updates);
    refreshCourses(course?.id || activeCourse.id);
  };

  const addSection = (event) => {
    event.preventDefault();
    if (!activeCourse || !sectionDraft.trim()) return;

    db.addCourseSection(activeCourse.id, sectionDraft);
    setSectionDraft('');
    refreshCourses(activeCourse.id);
  };

  const updateSection = (sectionId, updates) => {
    if (!activeCourse) return;
    db.updateCourseSection(activeCourse.id, sectionId, updates);
    refreshCourses(activeCourse.id);
  };

  const addTopic = (event, sectionId) => {
    event.preventDefault();
    const title = topicDrafts[sectionId]?.trim();
    if (!activeCourse || !title) return;

    db.addCourseTopic(activeCourse.id, sectionId, title);
    setTopicDrafts((prev) => ({ ...prev, [sectionId]: '' }));
    refreshCourses(activeCourse.id);
  };

  const updateTopic = (sectionId, topicId, updates) => {
    if (!activeCourse) return;
    db.updateCourseTopic(activeCourse.id, sectionId, topicId, updates);
    refreshCourses(activeCourse.id);
  };

  const confirmDelete = () => {
    if (!pendingDelete || !activeCourse) return;

    if (pendingDelete.type === 'course') {
      db.removeUserCourse(pendingDelete.courseId);
      setPendingDelete(null);
      refreshCourses();
      return;
    }

    if (pendingDelete.type === 'section') {
      db.deleteCourseSection(activeCourse.id, pendingDelete.sectionId);
      setPendingDelete(null);
      refreshCourses(activeCourse.id);
      return;
    }

    if (pendingDelete.type === 'topic') {
      db.deleteCourseTopic(activeCourse.id, pendingDelete.sectionId, pendingDelete.topicId);
      setPendingDelete(null);
      refreshCourses(activeCourse.id);
    }
  };

  return (
    <div className="course-management-page animate-fade-in space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Curriculum Studio
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            <GraduationCap className="h-5 w-5 text-accent-indigo" />
            Courses
          </h1>
          <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--text-secondary)' }}>
            Choose templates, create custom courses, and keep the structure that powers your dashboard, tracker, and exams.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-secondary min-h-11 justify-center" onClick={() => navigate('/tracker')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Tracker
          </button>
          <span className="dashboard-chip w-fit">
            <BookOpen className="h-3.5 w-3.5 text-accent-cyan" />
            <span>{courses.length} active courses</span>
          </span>
        </div>
      </header>

      <div className="course-creation-layout">
        <section className="glass-card-static course-template-library space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <SectionTitle
              icon={<GraduationCap className="h-4 w-4 text-accent-indigo" />}
              title="Choose From Course Templates"
              description="Add a read-only blueprint, then personalize your own copy in the editor."
            />
            <span className="dashboard-chip w-fit">
              <Layers3 className="h-3.5 w-3.5 text-accent-emerald" />
              <span>{curriculumTemplates.length} templates</span>
            </span>
          </div>

          <div className="course-template-group-picker" role="list" aria-label="Course template groups">
            {curriculumTemplateGroups.map((group) => {
              const isSelected = selectedTemplateGroupId === group.id;
              return (
                <button
                  type="button"
                  key={group.id}
                  className={`course-template-group-button ${isSelected ? 'active' : ''}`}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedTemplateGroupId(group.id)}
                >
                  <span className="min-w-0">
                    <strong>{group.label}</strong>
                    {group.description && <small>{group.description}</small>}
                  </span>
                  <span>{group.templates.length}</span>
                </button>
              );
            })}
          </div>

          {selectedTemplateGroup && (
            <TemplateGroup
              group={selectedTemplateGroup}
              addedTemplateIds={addedTemplateIds}
              onAddTemplate={addTemplate}
            />
          )}
        </section>

        <section className="glass-card-static course-custom-panel space-y-5">
          <SectionTitle
            icon={<Plus className="h-4 w-4 text-accent-cyan" />}
            title="Add Your Own Course"
            description="Start blank, then add sections and topics in the editor so Tracker can follow it."
          />
          <form className="course-add-form" onSubmit={addCustomCourse}>
            <label className="space-y-2">
              <span className="course-field-label">Course name</span>
              <input
                className="input-field !px-3"
                value={courseForm.title}
                placeholder="e.g. Further Mathematics"
                onChange={(event) => setCourseForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </label>
            <label className="space-y-2">
              <span className="course-field-label">Curriculum</span>
              <input
                className="input-field !px-3"
                value={courseForm.curriculum}
                onChange={(event) => setCourseForm((prev) => ({ ...prev, curriculum: event.target.value }))}
              />
            </label>
            <label className="space-y-2">
              <span className="course-field-label">Structure</span>
              <select
                className="select-field"
                value={courseForm.structureType}
                onChange={(event) => setCourseForm((prev) => ({ ...prev, structureType: event.target.value }))}
              >
                {STRUCTURE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn-primary min-h-11 justify-center self-end">
              <Plus className="h-4 w-4" />
              Add Course
            </button>
          </form>
        </section>
      </div>

      <div className="course-management-layout">
        <section className="glass-card-static space-y-4">
          <SectionTitle
            icon={<ClipboardList className="h-4 w-4 text-accent-amber" />}
            title="Active Courses"
            description="Select a course to edit its details and syllabus."
          />

          {courses.length > 0 ? (
            <div className="course-list">
              {courses.map((course) => {
                const isActive = activeCourse?.id === course.id;
                const stats = getCourseStats(course);
                return (
                  <button
                    type="button"
                    key={course.id}
                    className={`course-list-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveCourseId(course.id)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="course-color-dot" style={{ background: course.color }} />
                    <span className="min-w-0 flex-1">
                      <strong>{course.title}</strong>
                      <small>{course.curriculum} / {stats.total} topics</small>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyCourses />
          )}
        </section>

        <section className="glass-card-static course-editor">
          {activeCourse ? (
            <CourseEditor
              course={activeCourse}
              sectionDraft={sectionDraft}
              topicDrafts={topicDrafts}
              onCourseUpdate={updateCourse}
              onSectionDraftChange={setSectionDraft}
              onTopicDraftChange={setTopicDrafts}
              onAddSection={addSection}
              onSectionUpdate={updateSection}
              onAddTopic={addTopic}
              onTopicUpdate={updateTopic}
              onDeleteCourse={() => setPendingDelete({
                type: 'course',
                courseId: activeCourse.id,
                title: `Remove ${activeCourse.title}?`,
                description: 'This deletes the course, its tracked topics, related exams, and linked resources.',
              })}
              onDeleteSection={(section) => setPendingDelete({
                type: 'section',
                sectionId: section.id,
                title: `Delete ${section.title}?`,
                description: 'This deletes every topic in this section and unlinks related resources.',
              })}
              onDeleteTopic={(section, topic) => setPendingDelete({
                type: 'topic',
                sectionId: section.id,
                topicId: topic.id,
                title: `Delete ${topic.title}?`,
                description: 'This removes the topic from this course and unlinks related resources.',
              })}
            />
          ) : (
            <EmptyEditor />
          )}
        </section>
      </div>

      {pendingDelete && (
        <DeleteDialog
          title={pendingDelete.title}
          description={pendingDelete.description}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function CourseEditor({
  course,
  sectionDraft,
  topicDrafts,
  onCourseUpdate,
  onSectionDraftChange,
  onTopicDraftChange,
  onAddSection,
  onSectionUpdate,
  onAddTopic,
  onTopicUpdate,
  onDeleteCourse,
  onDeleteSection,
  onDeleteTopic,
}) {
  const stats = getCourseStats(course);

  return (
    <div className="space-y-6">
      <div className="course-editor-head">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-indigo">{course.curriculum}</p>
          <h2>{course.title}</h2>
          <p>{stats.total} topics / {stats.mastered} mastered / {stats.percent}% complete</p>
        </div>
        <button type="button" className="btn-danger min-h-11 justify-center" onClick={onDeleteCourse}>
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      <div className="course-detail-grid">
        <label className="space-y-2">
          <span className="course-field-label">Course name</span>
          <input
            className="input-field !px-3"
            value={course.title}
            onChange={(event) => onCourseUpdate({ title: event.target.value })}
          />
        </label>
        <label className="space-y-2">
          <span className="course-field-label">Curriculum</span>
          <input
            className="input-field !px-3"
            value={course.curriculum}
            onChange={(event) => onCourseUpdate({ curriculum: event.target.value })}
          />
        </label>
        <label className="space-y-2">
          <span className="course-field-label">Structure</span>
          <select
            className="select-field"
            value={course.structureType}
            onChange={(event) => onCourseUpdate({ structureType: event.target.value })}
          >
            {STRUCTURE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="course-field-label">Weighting: {Number(course.weighting).toFixed(1)}x</span>
          <input
            className="course-range"
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={course.weighting}
            onChange={(event) => onCourseUpdate({ weighting: Number(event.target.value) })}
          />
        </label>
      </div>

      <div className="space-y-3">
        <span className="course-field-label">Course color</span>
        <div className="course-color-grid" role="group" aria-label="Course color">
          {COURSE_COLORS.map((color) => (
            <button
              type="button"
              key={color}
              className={`course-color-button ${course.color === color ? 'active' : ''}`}
              style={{ '--course-color': color }}
              onClick={() => onCourseUpdate({ color })}
              aria-label={`Use color ${color}`}
              aria-pressed={course.color === color}
            />
          ))}
        </div>
      </div>

      <form className="course-section-add" onSubmit={onAddSection}>
        <label className="min-w-0 space-y-2">
          <span className="course-field-label">New section or module</span>
          <input
            className="input-field !px-3"
            value={sectionDraft}
            placeholder="e.g. Paper 2: Structured Questions"
            onChange={(event) => onSectionDraftChange(event.target.value)}
          />
        </label>
        <button type="submit" className="btn-primary min-h-11 justify-center self-end">
          <Plus className="h-4 w-4" />
          Add Section
        </button>
      </form>

      <div className="space-y-4">
        {course.sections.length > 0 ? (
          course.sections.map((section) => (
            <article key={section.id} className="course-section-card">
              <div className="course-section-head">
                <label className="min-w-0 flex-1 space-y-2">
                  <span className="course-field-label">Section title</span>
                  <input
                    className="input-field !px-3"
                    value={section.title}
                    onChange={(event) => onSectionUpdate(section.id, { title: event.target.value })}
                  />
                </label>
                <button
                  type="button"
                  className="btn-secondary min-h-11 justify-center"
                  onClick={() => onDeleteSection(section)}
                  aria-label={`Delete ${section.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="course-topic-list">
                {section.topics.map((topic) => (
                  <div key={topic.id} className="course-topic-row">
                    <input
                      className="input-field !px-3"
                      value={topic.title}
                      onChange={(event) => onTopicUpdate(section.id, topic.id, { title: event.target.value })}
                      aria-label="Topic title"
                    />
                    <button
                      type="button"
                      className="btn-secondary min-h-11 justify-center"
                      onClick={() => onDeleteTopic(section, topic)}
                      aria-label={`Delete ${topic.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <form className="course-topic-add" onSubmit={(event) => onAddTopic(event, section.id)}>
                <label className="min-w-0">
                  <span className="sr-only">Add topic to {section.title}</span>
                  <input
                    className="input-field !px-3"
                    value={topicDrafts[section.id] || ''}
                    placeholder="Add topic"
                    onChange={(event) => onTopicDraftChange((prev) => ({ ...prev, [section.id]: event.target.value }))}
                  />
                </label>
                <button type="submit" className="btn-secondary min-h-11 justify-center">
                  <Plus className="h-4 w-4" />
                  Add Topic
                </button>
              </form>
            </article>
          ))
        ) : (
          <div className="course-empty-panel">
            <Layers3 className="h-5 w-5" />
            <p>Add a section to start building this course.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateGroup({ group, addedTemplateIds, onAddTemplate }) {
  return (
    <section className="course-template-group" aria-labelledby={`template-group-${group.id}`}>
      <div className="course-template-group-head">
        <div className="min-w-0">
          <h3 id={`template-group-${group.id}`}>{group.label}</h3>
          {group.description && <p>{group.description}</p>}
        </div>
        <span>{group.templates.length} {group.templates.length === 1 ? 'course' : 'courses'}</span>
      </div>

      <div className="course-template-grid">
        {group.templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isAdded={addedTemplateIds.has(template.id)}
            onAdd={() => onAddTemplate(template.id)}
          />
        ))}
      </div>
    </section>
  );
}

function TemplateCard({ template, isAdded, onAdd }) {
  const sectionCount = template.sections.length;
  const topicCount = template.sections.reduce((total, section) => total + section.topics.length, 0);

  return (
    <article className="course-template-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-accent-indigo">{template.curriculum}</p>
          <h3>{template.title}</h3>
        </div>
        <span>{template.structureType}</span>
      </div>

      <div className="course-template-stats">
        <TemplateStat label="Sections" value={sectionCount} />
        <TemplateStat label="Topics" value={topicCount} />
      </div>

      <div className="course-template-sections">
        {template.sections.slice(0, 4).map((section) => (
          <p key={section.id}>{section.title}</p>
        ))}
      </div>

      <button
        type="button"
        className={`mt-5 min-h-11 justify-center ${isAdded ? 'btn-secondary' : 'btn-primary'}`}
        onClick={onAdd}
        disabled={isAdded}
      >
        {isAdded ? <CheckCircle2 className="h-4 w-4 text-accent-emerald" /> : <Plus className="h-4 w-4" />}
        {isAdded ? 'Already Added' : 'Add Template'}
      </button>
    </article>
  );
}

function TemplateStat({ label, value }) {
  return (
    <div>
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  );
}

function SectionTitle({ icon, title, description }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      {description && (
        <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
      )}
    </div>
  );
}

function EmptyCourses() {
  return (
    <div className="course-empty-panel">
      <ClipboardList className="h-5 w-5" />
      <p>No courses yet. Add a template or create a custom course.</p>
    </div>
  );
}

function EmptyEditor() {
  return (
    <div className="course-empty-panel course-empty-panel-large">
      <BookOpen className="h-6 w-6" />
      <h2>Select or create a course</h2>
      <p>Course details, sections, and topics will appear here.</p>
    </div>
  );
}

function DeleteDialog({ title, description, onCancel, onConfirm }) {
  return (
    <div className="modal-overlay" role="presentation" onMouseDown={onCancel}>
      <div
        className="modal-content max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-delete-title"
        aria-describedby="course-delete-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div className="flex items-start gap-3">
            <span
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--color-accent-rose)' }}
            >
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 id="course-delete-title">{title}</h2>
              <p id="course-delete-description">{description}</p>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onCancel} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="modal-actions mt-6">
          <button type="button" className="btn-secondary touch-target" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn-danger touch-target" onClick={onConfirm}>
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function getCourseStats(course) {
  if (!course) return { total: 0, mastered: 0, percent: 0 };
  const topics = course.sections.flatMap((section) => section.topics);
  const total = topics.length;
  const mastered = topics.filter((topic) => topic.status === 'Mastered').length;
  return {
    total,
    mastered,
    percent: total > 0 ? Math.round((mastered / total) * 100) : 0,
  };
}
