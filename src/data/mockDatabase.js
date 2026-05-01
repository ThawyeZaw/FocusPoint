// ============================================================
// FocusPoint Mock Database (Simulates Supabase)
// ============================================================
import { v4 as uuidv4 } from 'uuid';
import { getCurriculumTemplate } from './curriculumData.js';

const STORAGE_KEY = 'focuspoint_db';
const DATA_SCHEMA_VERSION = 3;
const STUDY_DEFAULTS_SCHEMA_VERSION = 2;

// ---------- Topic Progress Mapping ----------
const STATUS_OPTIONS = [
  'not-started', 'beginner', 'in-progress',
  'reviewing', 'proficient', 'mastered',
];

const CONFIDENCE_TO_STATUS = {
  0: 'not-started',
  1: 'beginner',
  2: 'in-progress',
  3: 'reviewing',
  4: 'proficient',
  5: 'mastered',
};

const STATUS_TO_CONFIDENCE = {
  'not-started': 0,
  'beginner': 1,
  'in-progress': 2,
  'reviewing': 3,
  'proficient': 4,
  'mastered': 5,
};

function clampConfidence(value) {
  return Math.min(5, Math.max(0, Math.round(Number(value) || 0)));
}

function deriveStatusFromConfidence(confidence) {
  return CONFIDENCE_TO_STATUS[clampConfidence(confidence)] || 'not-started';
}

function deriveConfidenceFromStatus(status) {
  return STATUS_TO_CONFIDENCE[status] ?? 0;
}

function syncTopicFields(topic) {
  // If confidence is present (and maybe status missing or inconsistent), status follows confidence
  if (topic.hasOwnProperty('confidence')) {
    topic.confidence = clampConfidence(topic.confidence);
    topic.status = deriveStatusFromConfidence(topic.confidence);
  }
  // Else if only status is present, confidence follows status
  else if (topic.hasOwnProperty('status')) {
    topic.confidence = deriveConfidenceFromStatus(topic.status);
  }
  // Otherwise apply defaults
  else {
    topic.confidence = 0;
    topic.status = 'not-started';
  }
  return topic;
}

// ---------- Default Seed Data ----------

const defaultSubjects = [
  {
    id: 'subj-maths',
    name: 'Mathematics',
    level: 'A-Level',
    weighting: 1.2,
    color: '#f59e0b',
  },
  {
    id: 'subj-further-maths',
    name: 'Further Mathematics',
    level: 'A-Level',
    weighting: 1.4,
    color: '#8b5cf6',
  },
  {
    id: 'subj-physics',
    name: 'Physics',
    level: 'A-Level',
    weighting: 1.2,
    color: '#6366f1',
  },
  {
    id: 'subj-it',
    name: 'Information Technology',
    level: 'IGCSE',
    weighting: 1.0,
    color: '#06b6d4',
  },
];

const defaultSettings = {
  academicLevel: 'A-Level',
  examSittings: {
    mayJune2026: '2026-06-01',
    january2027: '2027-01-01',
  },
  preferences: {
    rowMethod: true,
    focusMethod: true,
    accentColor: '#6366f1',
  },
};

const defaultExams = [
  {
    id: 'exam-phys-p1',
    subjectId: 'subj-physics',
    paper: 'Paper 1 — Multiple Choice',
    date: '2026-05-06',
    color: '#818cf8',
  },
  {
    id: 'exam-phys-p2',
    subjectId: 'subj-physics',
    paper: 'Paper 2 — Structured Questions',
    date: '2026-05-13',
    color: '#a78bfa',
  },
  {
    id: 'exam-chem-p1',
    subjectId: 'subj-chemistry',
    paper: 'Paper 1 — Multiple Choice',
    date: '2026-05-08',
    color: '#22d3ee',
  },
  {
    id: 'exam-chem-p2',
    subjectId: 'subj-chemistry',
    paper: 'Paper 2 — Theory',
    date: '2026-05-20',
    color: '#67e8f9',
  },
  {
    id: 'exam-math-p1',
    subjectId: 'subj-maths',
    paper: 'Paper 1 — Pure Mathematics',
    date: '2026-05-10',
    color: '#fbbf24',
  },
  {
    id: 'exam-math-p3',
    subjectId: 'subj-maths',
    paper: 'Paper 3 — Mechanics',
    date: '2026-05-22',
    color: '#f59e0b',
  },
];

const defaultTopics = [
  // Physics Units & Topics
  {
    id: 'topic-phys-1-1',
    subjectId: 'subj-physics',
    unit: 'Mechanics',
    topic: 'Kinematics',
    learningOutcome: 'Define displacement, speed, velocity and acceleration',
    status: 'mastered',
    confidence: 5,
  },
  {
    id: 'topic-phys-1-2',
    subjectId: 'subj-physics',
    unit: 'Mechanics',
    topic: 'Kinematics',
    learningOutcome: 'Use equations of uniformly accelerated motion',
    status: 'in-progress',
    confidence: 3,
  },
  {
    id: 'topic-phys-1-3',
    subjectId: 'subj-physics',
    unit: 'Mechanics',
    topic: 'Dynamics',
    learningOutcome: "Apply Newton's laws of motion",
    status: 'in-progress',
    confidence: 4,
  },
  {
    id: 'topic-phys-1-4',
    subjectId: 'subj-physics',
    unit: 'Mechanics',
    topic: 'Dynamics',
    learningOutcome: 'Solve problems involving friction and drag',
    status: 'not-started',
    confidence: 1,
  },
  {
    id: 'topic-phys-2-1',
    subjectId: 'subj-physics',
    unit: 'Waves',
    topic: 'Wave Properties',
    learningOutcome: 'Describe transverse and longitudinal waves',
    status: 'not-started',
    confidence: 2,
  },
  {
    id: 'topic-phys-2-2',
    subjectId: 'subj-physics',
    unit: 'Waves',
    topic: 'Wave Properties',
    learningOutcome: 'Explain superposition and interference',
    status: 'not-started',
    confidence: 1,
  },
  {
    id: 'topic-phys-3-1',
    subjectId: 'subj-physics',
    unit: 'Electricity',
    topic: 'Current & Voltage',
    learningOutcome: 'Define current, p.d. and resistance',
    status: 'in-progress',
    confidence: 3,
  },
  {
    id: 'topic-phys-3-2',
    subjectId: 'subj-physics',
    unit: 'Electricity',
    topic: 'D.C. Circuits',
    learningOutcome: "Apply Kirchhoff's laws to circuits",
    status: 'not-started',
    confidence: 1,
  },
  // Chemistry Units & Topics
  {
    id: 'topic-chem-1-1',
    subjectId: 'subj-chemistry',
    unit: 'Atomic Structure',
    topic: 'Electron Configuration',
    learningOutcome: 'Describe sub-shells and orbitals',
    status: 'mastered',
    confidence: 5,
  },
  {
    id: 'topic-chem-1-2',
    subjectId: 'subj-chemistry',
    unit: 'Atomic Structure',
    topic: 'Ionisation Energy',
    learningOutcome: 'Explain trends in ionisation energy',
    status: 'in-progress',
    confidence: 3,
  },
  {
    id: 'topic-chem-2-1',
    subjectId: 'subj-chemistry',
    unit: 'Chemical Bonding',
    topic: 'Ionic Bonding',
    learningOutcome: 'Describe ionic bonding and lattice structures',
    status: 'not-started',
    confidence: 2,
  },
  {
    id: 'topic-chem-2-2',
    subjectId: 'subj-chemistry',
    unit: 'Chemical Bonding',
    topic: 'Covalent Bonding',
    learningOutcome: 'Draw dot-and-cross diagrams',
    status: 'in-progress',
    confidence: 4,
  },
  {
    id: 'topic-chem-3-1',
    subjectId: 'subj-chemistry',
    unit: 'Organic Chemistry',
    topic: 'Alkanes',
    learningOutcome: 'Describe properties and reactions of alkanes',
    status: 'not-started',
    confidence: 1,
  },
  {
    id: 'topic-chem-3-2',
    subjectId: 'subj-chemistry',
    unit: 'Organic Chemistry',
    topic: 'Alkenes',
    learningOutcome: 'Describe electrophilic addition reactions',
    status: 'not-started',
    confidence: 1,
  },
  // Mathematics Units & Topics
  {
    id: 'topic-math-1-1',
    subjectId: 'subj-maths',
    unit: 'Pure Mathematics',
    topic: 'Algebra & Functions',
    learningOutcome: 'Simplify rational expressions and partial fractions',
    status: 'mastered',
    confidence: 5,
  },
  {
    id: 'topic-math-1-2',
    subjectId: 'subj-maths',
    unit: 'Pure Mathematics',
    topic: 'Coordinate Geometry',
    learningOutcome: 'Find equations of lines and circles',
    status: 'in-progress',
    confidence: 4,
  },
  {
    id: 'topic-math-2-1',
    subjectId: 'subj-maths',
    unit: 'Pure Mathematics',
    topic: 'Differentiation',
    learningOutcome: 'Differentiate polynomial, trig and exponential functions',
    status: 'in-progress',
    confidence: 3,
  },
  {
    id: 'topic-math-2-2',
    subjectId: 'subj-maths',
    unit: 'Pure Mathematics',
    topic: 'Integration',
    learningOutcome: 'Integrate standard functions and by substitution',
    status: 'not-started',
    confidence: 2,
  },
  {
    id: 'topic-math-3-1',
    subjectId: 'subj-maths',
    unit: 'Mechanics',
    topic: 'Forces & Equilibrium',
    learningOutcome: 'Resolve forces and solve equilibrium problems',
    status: 'not-started',
    confidence: 1,
  },
  {
    id: 'topic-math-3-2',
    subjectId: 'subj-maths',
    unit: 'Mechanics',
    topic: 'Momentum',
    learningOutcome: 'Apply conservation of momentum in collisions',
    status: 'not-started',
    confidence: 1,
  },
];

const defaultTimetable = [];

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_TO_INDEX = DAY_NAMES.reduce((acc, day, index) => {
  acc[day.toLowerCase()] = index;
  return acc;
}, {});

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatDateOnly(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatTimeOnly(date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function normalizeTime(value, fallback = '09:00') {
  const text = String(value || '').trim();
  if (/^\d{2}:\d{2}$/.test(text)) return text;
  return fallback;
}

function normalizeCategory(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'self-study' || normalized === 'self study') return 'study';
  return normalized || 'study';
}

function normalizeRepeat(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'daily' || normalized === 'weekly' || normalized === 'monthly') return normalized;
  return 'none';
}

function normalizeEventKind(value) {
  return String(value || '').trim().toLowerCase() === 'todo' ? 'todo' : 'event';
}

function normalizeCompletedDates(value) {
  if (!Array.isArray(value)) return [];
  const unique = new Set();
  value.forEach((date) => {
    const parsed = parseDateSafe(date);
    if (parsed) unique.add(formatDateOnly(parsed));
  });
  return Array.from(unique).sort();
}

function toRecurrencePattern(value) {
  const repeat = normalizeRepeat(value);
  if (repeat === 'daily') return 'Daily';
  if (repeat === 'weekly') return 'Weekly';
  if (repeat === 'monthly') return 'Monthly';
  return 'None';
}

function fromRecurrencePattern(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'daily' || normalized === 'weekly' || normalized === 'monthly') return normalized;
  return 'none';
}

function toLegacyType(category) {
  if (category === 'study') return 'self-study';
  return category;
}

function parseDateSafe(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toDateTimeString(date, time) {
  return `${formatDateOnly(date)}T${normalizeTime(time)}`;
}

function getSeedWeekMonday() {
  return new Date('2026-01-05T00:00:00');
}

function getDateForDayName(dayName) {
  const monday = getSeedWeekMonday();
  const index = DAY_TO_INDEX[String(dayName || '').toLowerCase()] ?? 0;
  const date = new Date(monday);
  date.setDate(monday.getDate() + index);
  return date;
}

function normalizeRepeatUntil(value, fallbackDate) {
  const parsed = parseDateSafe(value);
  if (parsed) return formatDateOnly(parsed);
  return formatDateOnly(fallbackDate);
}

function getSubjectFromEvent(event, subjects) {
  const byId = subjects.find((subject) => subject.id === event.subjectId);
  if (byId) return byId;

  const eventName = String(event.subjectName || event.subject || '').trim().toLowerCase();
  if (!eventName) return null;
  return subjects.find((subject) => subject.name.toLowerCase() === eventName) || null;
}

function withLegacyFields(event) {
  const start = parseDateSafe(event.start);
  const end = parseDateSafe(event.end);
  const resolvedStart = start || new Date();
  const resolvedEnd = end || new Date(resolvedStart.getTime() + 60 * 60 * 1000);
  const dayIndex = (resolvedStart.getDay() + 6) % 7;
  const isAllDay = Boolean(event.isAllDay);

  return {
    ...event,
    label: event.title,
    type: toLegacyType(event.category),
    subject: event.subjectName || event.subject || 'General',
    day: DAY_NAMES[dayIndex],
    date: event.date || formatDateOnly(resolvedStart),
    startTime: isAllDay ? '' : formatTimeOnly(resolvedStart),
    endTime: isAllDay ? '' : formatTimeOnly(resolvedEnd),
    kind: normalizeEventKind(event.kind),
    completedDates: normalizeCompletedDates(event.completedDates),
    isRecurring: event.repeat !== 'none',
    recurrencePattern: toRecurrencePattern(event.repeat),
    recurrenceEndDate: event.repeat === 'none' ? null : event.repeatUntil,
  };
}

function normalizeTimetableEntry(entry, subjects) {
  const source = entry || {};
  const subject = getSubjectFromEvent(source, subjects);
  const category = normalizeCategory(source.category || source.type);
  const sourceDate = parseDateSafe(source.date);
  const fallbackDate = sourceDate || getDateForDayName(source.day);
  const hasExplicitStartTime = typeof source.startTime === 'string' && source.startTime.trim() !== '';
  const hasExplicitEndTime = typeof source.endTime === 'string' && source.endTime.trim() !== '';
  const isAllDay = Boolean(source.isAllDay) || (!source.start && !hasExplicitStartTime && Boolean(source.date));

  let start = parseDateSafe(source.start);
  let end = parseDateSafe(source.end);

  if (!start) {
    const startFallback = isAllDay ? '00:00' : (hasExplicitStartTime ? source.startTime : '09:00');
    start = parseDateSafe(toDateTimeString(fallbackDate, startFallback)) || new Date('2026-01-05T09:00');
  }

  if (!end) {
    if (isAllDay) {
      end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    } else if (hasExplicitEndTime) {
      end = parseDateSafe(toDateTimeString(fallbackDate, source.endTime));
    } else {
      end = new Date(start.getTime() + 60 * 60 * 1000);
    }
  }

  if (end <= start) {
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }

  const repeat = source.isRecurring === false
    ? 'none'
    : normalizeRepeat(source.repeat || fromRecurrencePattern(source.recurrencePattern) || (source.day ? 'weekly' : 'none'));
  const defaultRepeatUntil = new Date(start);
  defaultRepeatUntil.setMonth(defaultRepeatUntil.getMonth() + 6);
  const repeatUntilSource = source.repeatUntil || source.recurrenceEndDate;

  const normalized = {
    id: source.id || uuidv4(),
    title: String(source.title || source.label || 'Untitled Session').trim(),
    subjectId: subject?.id || source.subjectId || null,
    subjectName: subject?.name || source.subjectName || source.subject || 'General',
    category,
    date: formatDateOnly(start),
    start: `${formatDateOnly(start)}T${formatTimeOnly(start)}`,
    end: `${formatDateOnly(end)}T${formatTimeOnly(end)}`,
    startTime: isAllDay ? '' : formatTimeOnly(start),
    endTime: isAllDay ? '' : formatTimeOnly(end),
    isAllDay,
    kind: normalizeEventKind(source.kind),
    completedDates: normalizeCompletedDates(source.completedDates),
    linkedTopicId: source.linkedTopicId || null,
    repeat,
    repeatUntil: repeat === 'none' ? null : normalizeRepeatUntil(repeatUntilSource, defaultRepeatUntil),
    isRecurring: repeat !== 'none',
    recurrencePattern: toRecurrencePattern(repeat),
    recurrenceEndDate: repeat === 'none' ? null : normalizeRepeatUntil(repeatUntilSource, defaultRepeatUntil),
    notes: String(source.notes || '').trim(),
    systemSeed: Boolean(source.systemSeed),
    locked: typeof source.locked === 'boolean' ? source.locked : (Boolean(source.systemSeed) && category === 'school'),
  };

  return withLegacyFields(normalized);
}

function eventSignature(event) {
  return [
    String(event.title || '').trim().toLowerCase(),
    String(event.category || '').trim().toLowerCase(),
    String(event.start || '').slice(0, 16),
    String(event.end || '').slice(0, 16),
    String(event.repeat || 'none'),
    String(event.repeatUntil || ''),
    String(event.subjectName || '').trim().toLowerCase(),
  ].join('|');
}

function buildSchoolSeed(subject, dayName, id) {
  const date = getDateForDayName(dayName);
  const repeatUntil = new Date(date);
  repeatUntil.setFullYear(repeatUntil.getFullYear() + 1);
  return withLegacyFields({
    id,
    title: 'School Hours',
    subjectId: subject?.id || null,
    subjectName: subject?.name || 'General',
    category: 'school',
    start: toDateTimeString(date, '08:00'),
    end: toDateTimeString(date, '14:00'),
    linkedTopicId: null,
    repeat: 'weekly',
    repeatUntil: formatDateOnly(repeatUntil),
    notes: '',
    systemSeed: true,
    locked: true,
  });
}

function buildMechanicsTodaySeed(subject) {
  const now = new Date();
  const day = formatDateOnly(now);
  return withLegacyFields({
    id: 'seed-mechanics-today',
    title: 'Mechanics P3 Practice',
    subjectId: subject?.id || null,
    subjectName: subject?.name || 'Physics',
    category: 'study',
    start: `${day}T16:00`,
    end: `${day}T17:00`,
    linkedTopicId: null,
    repeat: 'none',
    repeatUntil: null,
    notes: '',
    systemSeed: true,
    locked: false,
  });
}

function ensureExamSeed(data) {
  if (!Array.isArray(data.exams)) data.exams = [];
  data.exams = data.exams.filter((exam) => exam.id !== 'exam-chem-unit1-seed');
}

function ensureTimetableSeeds(data) {
  if (!Array.isArray(data.timetable)) data.timetable = [];
  const physics = (data.subjects || []).find((subject) => subject.name.toLowerCase().includes('phys'));
  const schoolSubject = (data.subjects || []).find((subject) => subject.name.toLowerCase().includes('general')) || null;

  const required = [
    buildSchoolSeed(schoolSubject, 'Monday', 'seed-school-mon'),
    buildSchoolSeed(schoolSubject, 'Tuesday', 'seed-school-tue'),
    buildSchoolSeed(schoolSubject, 'Wednesday', 'seed-school-wed'),
    buildSchoolSeed(schoolSubject, 'Thursday', 'seed-school-thu'),
    buildSchoolSeed(schoolSubject, 'Friday', 'seed-school-fri'),
    buildMechanicsTodaySeed(physics),
  ];

  const ids = new Set(data.timetable.map((entry) => entry.id));
  const signatures = new Set(data.timetable.map(eventSignature));

  required.forEach((seed) => {
    if (ids.has(seed.id) || signatures.has(eventSignature(seed))) return;
    data.timetable.push(seed);
    ids.add(seed.id);
    signatures.add(eventSignature(seed));
  });
}

function migrateTimetable(data) {
  if (!Array.isArray(data.timetable)) data.timetable = [];
  const subjects = Array.isArray(data.subjects) ? data.subjects : [];
  const seenIds = new Set();

  data.timetable = data.timetable
    .map((entry) => normalizeTimetableEntry(entry, subjects))
    .filter((entry) => {
      if (seenIds.has(entry.id)) return false;
      seenIds.add(entry.id);
      return true;
    });
}

function migrateTopics(data) {
  if (!Array.isArray(data.topics)) data.topics = [];
  data.topics = data.topics.map(topic => {
    const updated = { ...topic };
    syncTopicFields(updated);
    return updated;
  });
}

function pruneOrphanedStudyData(data) {
  const courseSubjects = projectCoursesToSubjects(data.userCourses || []);
  const subjectIds = new Set([
    ...(data.subjects || []).map((subject) => subject.id),
    ...courseSubjects.map((subject) => subject.id),
  ]);
  data.topics = (data.topics || []).filter((topic) => subjectIds.has(topic.subjectId));
  data.exams = (data.exams || []).filter((exam) => subjectIds.has(exam.subjectId));

  const topicIds = new Set([
    ...(data.topics || []).map((topic) => topic.id),
    ...flattenUserCourses(data.userCourses || []).map((topic) => topic.id),
  ]);
  data.resources = (data.resources || []).filter((resource) => topicIds.has(resource.topicId));
}

function migrateStudyDefaults(data) {
  if ((data.schemaVersion || 0) >= STUDY_DEFAULTS_SCHEMA_VERSION) return;

  const currentById = new Map((data.subjects || []).map((subject) => [subject.id, subject]));
  data.subjects = defaultSubjects.map((subject) => ({
    ...subject,
    weighting: currentById.get(subject.id)?.weighting ?? subject.weighting,
  }));
  pruneOrphanedStudyData(data);
}

function migrateDatabase(data) {
  if (!data || typeof data !== 'object') return null;
  migrateTimetable(data);
  migrateTopics(data);
  ensureTimetableSeeds(data);
  ensureExamSeed(data);
  if (!data.settings || typeof data.settings !== 'object') data.settings = defaultSettings;
  data.settings = {
    ...defaultSettings,
    ...data.settings,
    examSittings: {
      ...defaultSettings.examSittings,
      ...(data.settings?.examSittings || {}),
    },
    preferences: {
      ...defaultSettings.preferences,
      ...(data.settings?.preferences || {}),
    },
  };
  migrateStudyDefaults(data);
  ensureUserCourses(data);
  data.schemaVersion = DATA_SCHEMA_VERSION;
  return data;
}
const defaultResources = [
  {
    id: 'res-1',
    topicId: 'topic-phys-1-1',
    name: 'Kinematics Formula Sheet.pdf',
    type: 'pdf',
    size: 245000,
    uploadedAt: '2026-04-10T09:30:00Z',
    url: '#',
  },
  {
    id: 'res-2',
    topicId: 'topic-chem-1-1',
    name: 'Electron Configuration Notes.pdf',
    type: 'pdf',
    size: 512000,
    uploadedAt: '2026-04-12T14:15:00Z',
    url: '#',
  },
  {
    id: 'res-3',
    topicId: 'topic-math-2-1',
    name: 'Differentiation Rules Cheat Sheet.pdf',
    type: 'pdf',
    size: 180000,
    uploadedAt: '2026-04-14T11:00:00Z',
    url: '#',
  },
];

const defaultUser = {
  id: 'user-1',
  name: 'Alex Chen',
  email: 'alex@focuspoint.study',
  avatar: null,
  level: 'A-Level',
  createdAt: '2026-03-01T00:00:00Z',
};

// ---------- Universal Course Helpers ----------

const COURSE_STATUS_LABELS = {
  'not-started': 'Not Started',
  beginner: 'Beginner',
  'in-progress': 'In Progress',
  reviewing: 'Reviewing',
  proficient: 'Proficient',
  mastered: 'Mastered',
};

const COURSE_CONFIDENCE_TO_STATUS = {
  0: 'Not Started',
  1: 'Beginner',
  2: 'In Progress',
  3: 'Reviewing',
  4: 'Proficient',
  5: 'Mastered',
};

const COURSE_STATUS_TO_CONFIDENCE = {
  'Not Started': 0,
  Beginner: 1,
  'In Progress': 2,
  Reviewing: 3,
  Proficient: 4,
  Mastered: 5,
};

const COURSE_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e'];

function slugify(value) {
  return String(value || 'item')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function clampCourseConfidence(value) {
  return Math.min(5, Math.max(0, Math.round(Number(value) || 0)));
}

function courseConfidenceToStatus(confidence) {
  return COURSE_CONFIDENCE_TO_STATUS[clampCourseConfidence(confidence)] || 'Not Started';
}

function normalizeCourseStatus(status) {
  const normalized = String(status || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
  return COURSE_STATUS_LABELS[normalized] || 'Not Started';
}

function courseStatusToLegacy(status) {
  const normalized = normalizeCourseStatus(status);
  return normalized.toLowerCase().replace(/\s+/g, '-');
}

function courseStatusToConfidence(status) {
  return COURSE_STATUS_TO_CONFIDENCE[normalizeCourseStatus(status)] ?? 0;
}

function normalizeCourseTopic(topic, fallbackTitle = 'Untitled Topic') {
  const source = typeof topic === 'string' ? { title: topic } : (topic || {});
  const confidence = source.hasOwnProperty('confidence')
    ? clampCourseConfidence(source.confidence)
    : courseStatusToConfidence(source.status);
  return {
    id: source.id || uuidv4(),
    title: String(source.title || source.learningOutcome || source.topic || fallbackTitle).trim() || fallbackTitle,
    status: courseConfidenceToStatus(confidence),
    confidence,
    lastReviewed: source.lastReviewed || null,
  };
}

function normalizeCourseSection(section, index = 0) {
  const title = String(section?.title || section?.unit || `Section ${index + 1}`).trim() || `Section ${index + 1}`;
  const topics = Array.isArray(section?.topics) ? section.topics : [];
  return {
    id: section?.id || `section-${slugify(title)}-${index + 1}`,
    title,
    topics: topics.map((topic, topicIndex) => normalizeCourseTopic(topic, `Topic ${topicIndex + 1}`)),
  };
}

function normalizeUserCourse(course, index = 0) {
  const title = String(course?.title || course?.name || `Course ${index + 1}`).trim() || `Course ${index + 1}`;
  return {
    id: course?.id || uuidv4(),
    templateId: course?.templateId || null,
    title,
    curriculum: course?.curriculum || course?.level || 'Custom',
    structureType: course?.structureType || 'custom',
    color: course?.color || COURSE_COLORS[index % COURSE_COLORS.length],
    weighting: Number(course?.weighting) || 1,
    createdAt: course?.createdAt || new Date().toISOString(),
    updatedAt: course?.updatedAt || new Date().toISOString(),
    sections: (Array.isArray(course?.sections) ? course.sections : []).map(normalizeCourseSection),
  };
}

function buildCourseFromSubject(subject, topics, index = 0) {
  const topicsByUnit = new Map();
  topics.forEach((topic) => {
    const unit = String(topic.unit || 'General').trim() || 'General';
    if (!topicsByUnit.has(unit)) topicsByUnit.set(unit, []);
    topicsByUnit.get(unit).push(topic);
  });

  const sections = Array.from(topicsByUnit.entries()).map(([unit, unitTopics], sectionIndex) => ({
    id: `section-${slugify(subject.id)}-${slugify(unit)}-${sectionIndex + 1}`,
    title: unit,
    topics: unitTopics.map((topic) => normalizeCourseTopic({
      id: topic.id,
      title: topic.learningOutcome || topic.topic,
      status: topic.status,
      confidence: topic.confidence,
      lastReviewed: topic.lastReviewed || null,
    })),
  }));

  return normalizeUserCourse({
    id: subject.id,
    templateId: null,
    title: subject.name,
    curriculum: subject.level || 'Custom',
    structureType: 'custom',
    color: subject.color,
    weighting: subject.weighting,
    sections,
  }, index);
}

function buildCourseFromTemplate(template, index = 0) {
  return normalizeUserCourse({
    id: uuidv4(),
    templateId: template.id,
    title: template.title,
    curriculum: template.curriculum,
    structureType: template.structureType,
    color: COURSE_COLORS[index % COURSE_COLORS.length],
    weighting: 1,
    sections: template.sections.map((section) => ({
      id: section.id,
      title: section.title,
      topics: section.topics.map((title) => ({
        id: uuidv4(),
        title,
        status: 'Not Started',
        confidence: 0,
        lastReviewed: null,
      })),
    })),
  }, index);
}

function projectCoursesToSubjects(courses) {
  return (courses || []).map((course, index) => ({
    id: course.id,
    name: course.title,
    level: course.curriculum,
    weighting: Number(course.weighting) || 1,
    color: course.color || COURSE_COLORS[index % COURSE_COLORS.length],
    curriculum: course.curriculum,
    structureType: course.structureType,
  }));
}

function flattenUserCourses(courses) {
  return (courses || []).flatMap((course) =>
    (course.sections || []).flatMap((section) =>
      (section.topics || []).map((topic) => ({
        id: topic.id,
        subjectId: course.id,
        courseId: course.id,
        sectionId: section.id,
        unit: section.title,
        topic: topic.title,
        learningOutcome: topic.title,
        status: courseStatusToLegacy(topic.status),
        confidence: clampCourseConfidence(topic.confidence),
        lastReviewed: topic.lastReviewed || null,
      }))
    )
  );
}

function syncCompatibilityTables(data) {
  data.subjects = projectCoursesToSubjects(data.userCourses || []);
  data.topics = flattenUserCourses(data.userCourses || []);
}

function ensureUserCourses(data) {
  if (!Array.isArray(data.userCourses) || data.userCourses.length === 0) {
    const subjects = Array.isArray(data.subjects) ? data.subjects : [];
    const topics = Array.isArray(data.topics) ? data.topics : [];
    data.userCourses = subjects.map((subject, index) =>
      buildCourseFromSubject(
        subject,
        topics.filter((topic) => topic.subjectId === subject.id),
        index
      )
    );
  } else {
    data.userCourses = data.userCourses.map(normalizeUserCourse);
  }

  syncCompatibilityTables(data);
}

function findCourseIndex(data, courseId) {
  return (data.userCourses || []).findIndex((course) => course.id === courseId);
}

function findTopicLocation(data, topicId) {
  for (const course of data.userCourses || []) {
    for (const section of course.sections || []) {
      const topicIndex = (section.topics || []).findIndex((topic) => topic.id === topicId);
      if (topicIndex > -1) return { course, section, topicIndex };
    }
  }
  return null;
}

function removeUserCourseFromData(data, courseId) {
  const course = (data.userCourses || []).find((item) => item.id === courseId);
  if (!course) return null;

  const topicIds = new Set((course.sections || []).flatMap((section) => (section.topics || []).map((topic) => topic.id)));
  data.userCourses = data.userCourses.filter((item) => item.id !== courseId);
  data.exams = (data.exams || []).filter((exam) => exam.subjectId !== courseId);
  data.resources = (data.resources || []).filter((resource) => !topicIds.has(resource.topicId));
  syncCompatibilityTables(data);
  return course;
}

// ---------- Database Helpers ----------

function getDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // corrupted, reset
  }
  return null;
}

function saveDB(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('focuspoint-db-change'));
  }
}

function initDB(forceReset = false) {
  const existing = getDB();
  if (forceReset || !existing) {
    const seeded = migrateDatabase({
      user: defaultUser,
      subjects: defaultSubjects,
      exams: defaultExams,
      topics: defaultTopics,
      timetable: defaultTimetable,
      resources: defaultResources,
      settings: defaultSettings,
      schemaVersion: 0,
    });
    saveDB(seeded);
    return seeded;
  }

  const migrated = migrateDatabase(existing);
  saveDB(migrated);
  return migrated;
}

// ---------- CRUD API (simulates Supabase client) ----------

export const db = {
  init: (forceReset) => initDB(forceReset),

  // --- User ---
  getUser: () => getDB()?.user || defaultUser,
  updateUser: (updates) => {
    const data = getDB();
    data.user = { ...(data.user || defaultUser), ...updates };
    saveDB(data);
    return data.user;
  },

  // --- Settings ---
  getSettings: () => getDB()?.settings || defaultSettings,
  updateSettings: (updates) => {
    const data = getDB();
    data.settings = {
      ...defaultSettings,
      ...(data.settings || {}),
      ...updates,
      examSittings: {
        ...defaultSettings.examSittings,
        ...(data.settings?.examSittings || {}),
        ...(updates.examSittings || {}),
      },
      preferences: {
        ...defaultSettings.preferences,
        ...(data.settings?.preferences || {}),
        ...(updates.preferences || {}),
      },
    };
    saveDB(data);
    return data.settings;
  },

  // --- User Courses ---
  getUserCourses: () => getDB()?.userCourses || [],
  addCourseFromTemplate: (templateId) => {
    const data = getDB();
    if (!Array.isArray(data.userCourses)) data.userCourses = [];

    const existing = data.userCourses.find((course) => course.templateId === templateId);
    if (existing) return existing;

    const template = getCurriculumTemplate(templateId);
    if (!template) return null;

    const newCourse = buildCourseFromTemplate(template, data.userCourses.length);
    data.userCourses.push(newCourse);
    syncCompatibilityTables(data);
    saveDB(data);
    return newCourse;
  },
  addCustomCourse: (course = {}) => {
    const data = getDB();
    if (!Array.isArray(data.userCourses)) data.userCourses = [];

    const newCourse = normalizeUserCourse({
      id: uuidv4(),
      templateId: null,
      title: course.title || course.name || 'Untitled Course',
      curriculum: course.curriculum || course.level || 'Custom',
      structureType: course.structureType || 'custom',
      color: course.color || COURSE_COLORS[data.userCourses.length % COURSE_COLORS.length],
      weighting: course.weighting || 1,
      sections: Array.isArray(course.sections) ? course.sections : [],
    }, data.userCourses.length);

    data.userCourses.push(newCourse);
    syncCompatibilityTables(data);
    saveDB(data);
    return newCourse;
  },
  updateUserCourse: (courseId, updates = {}) => {
    const data = getDB();
    const courseIndex = findCourseIndex(data, courseId);
    if (courseIndex < 0) return null;

    const current = data.userCourses[courseIndex];
    data.userCourses[courseIndex] = normalizeUserCourse({
      ...current,
      title: updates.title ?? updates.name ?? current.title,
      curriculum: updates.curriculum ?? updates.level ?? current.curriculum,
      structureType: updates.structureType ?? current.structureType,
      color: updates.color ?? current.color,
      weighting: updates.weighting ?? current.weighting,
      sections: current.sections,
      updatedAt: new Date().toISOString(),
    }, courseIndex);

    syncCompatibilityTables(data);
    saveDB(data);
    return data.userCourses[courseIndex];
  },
  removeUserCourse: (courseId) => {
    const data = getDB();
    const removed = removeUserCourseFromData(data, courseId);
    saveDB(data);
    return removed;
  },
  updateTopicStatus: (courseId, sectionId, topicId, status, confidence) => {
    const data = getDB();
    const course = (data.userCourses || []).find((item) => item.id === courseId);
    const section = course?.sections?.find((item) => item.id === sectionId);
    const topic = section?.topics?.find((item) => item.id === topicId);
    if (!topic) return null;

    const nextConfidence = confidence === undefined
      ? courseStatusToConfidence(status)
      : clampCourseConfidence(confidence);
    topic.confidence = nextConfidence;
    topic.status = courseConfidenceToStatus(nextConfidence);
    topic.lastReviewed = new Date().toISOString();
    course.updatedAt = new Date().toISOString();
    syncCompatibilityTables(data);
    saveDB(data);
    return topic;
  },
  addCourseSection: (courseId, sectionTitle) => {
    const data = getDB();
    const course = (data.userCourses || []).find((item) => item.id === courseId);
    const title = String(sectionTitle || '').trim();
    if (!course || !title) return null;

    const section = {
      id: `custom-section-${slugify(title)}-${uuidv4()}`,
      title,
      topics: [],
    };
    course.sections.push(section);
    course.updatedAt = new Date().toISOString();
    syncCompatibilityTables(data);
    saveDB(data);
    return section;
  },
  updateCourseSection: (courseId, sectionId, updates = {}) => {
    const data = getDB();
    const course = (data.userCourses || []).find((item) => item.id === courseId);
    const section = course?.sections?.find((item) => item.id === sectionId);
    if (!course || !section) return null;

    if (updates.hasOwnProperty('title')) {
      section.title = String(updates.title || section.title).trim() || section.title;
    }
    course.updatedAt = new Date().toISOString();
    syncCompatibilityTables(data);
    saveDB(data);
    return section;
  },
  deleteCourseSection: (courseId, sectionId) => {
    const data = getDB();
    const course = (data.userCourses || []).find((item) => item.id === courseId);
    const sectionIndex = course?.sections?.findIndex((item) => item.id === sectionId) ?? -1;
    if (!course || sectionIndex < 0) return null;

    const [removed] = course.sections.splice(sectionIndex, 1);
    const topicIds = new Set((removed.topics || []).map((topic) => topic.id));
    data.resources = (data.resources || []).filter((resource) => !topicIds.has(resource.topicId));
    course.updatedAt = new Date().toISOString();
    syncCompatibilityTables(data);
    saveDB(data);
    return removed;
  },
  addCourseTopic: (courseId, sectionId, topicTitle) => {
    const data = getDB();
    const course = (data.userCourses || []).find((item) => item.id === courseId);
    const section = course?.sections?.find((item) => item.id === sectionId);
    const title = String(topicTitle || '').trim();
    if (!course || !section || !title) return null;

    const topic = normalizeCourseTopic({
      id: uuidv4(),
      title,
      status: 'Not Started',
      confidence: 0,
      lastReviewed: null,
    });
    section.topics.push(topic);
    course.updatedAt = new Date().toISOString();
    syncCompatibilityTables(data);
    saveDB(data);
    return topic;
  },
  updateCourseTopic: (courseId, sectionId, topicId, updates = {}) => {
    const data = getDB();
    const course = (data.userCourses || []).find((item) => item.id === courseId);
    const section = course?.sections?.find((item) => item.id === sectionId);
    const topic = section?.topics?.find((item) => item.id === topicId);
    if (!course || !section || !topic) return null;

    if (updates.hasOwnProperty('title')) {
      topic.title = String(updates.title || topic.title).trim() || topic.title;
    }
    if (updates.hasOwnProperty('status')) {
      topic.status = normalizeCourseStatus(updates.status);
      if (!updates.hasOwnProperty('confidence')) {
        topic.confidence = courseStatusToConfidence(topic.status);
      }
    }
    if (updates.hasOwnProperty('confidence')) {
      topic.confidence = clampCourseConfidence(updates.confidence);
      topic.status = courseConfidenceToStatus(topic.confidence);
    }
    if (updates.hasOwnProperty('status') || updates.hasOwnProperty('confidence')) {
      topic.lastReviewed = new Date().toISOString();
    }
    course.updatedAt = new Date().toISOString();
    syncCompatibilityTables(data);
    saveDB(data);
    return topic;
  },
  deleteCourseTopic: (courseId, sectionId, topicId) => {
    const data = getDB();
    const course = (data.userCourses || []).find((item) => item.id === courseId);
    const section = course?.sections?.find((item) => item.id === sectionId);
    const topicIndex = section?.topics?.findIndex((item) => item.id === topicId) ?? -1;
    if (!course || !section || topicIndex < 0) return null;

    const [removed] = section.topics.splice(topicIndex, 1);
    data.resources = (data.resources || []).filter((resource) => resource.topicId !== topicId);
    course.updatedAt = new Date().toISOString();
    syncCompatibilityTables(data);
    saveDB(data);
    return removed;
  },
  addCustomSection: (courseId, sectionTitle) => {
    const data = getDB();
    const course = (data.userCourses || []).find((item) => item.id === courseId);
    const title = String(sectionTitle || '').trim();
    if (!course || !title) return null;

    const section = {
      id: `custom-section-${slugify(title)}-${uuidv4()}`,
      title,
      topics: [],
    };
    course.sections.push(section);
    course.updatedAt = new Date().toISOString();
    syncCompatibilityTables(data);
    saveDB(data);
    return section;
  },
  addCustomTopic: (courseId, sectionId, topicTitle) => {
    const data = getDB();
    const course = (data.userCourses || []).find((item) => item.id === courseId);
    const section = course?.sections?.find((item) => item.id === sectionId);
    const title = String(topicTitle || '').trim();
    if (!course || !section || !title) return null;

    const topic = normalizeCourseTopic({
      id: uuidv4(),
      title,
      status: 'Not Started',
      confidence: 0,
      lastReviewed: null,
    });
    section.topics.push(topic);
    course.updatedAt = new Date().toISOString();
    syncCompatibilityTables(data);
    saveDB(data);
    return topic;
  },

  // --- Subjects ---
  getSubjects: () => projectCoursesToSubjects(getDB()?.userCourses || []),
  addSubject: (subject) => {
    const data = getDB();
    if (!Array.isArray(data.userCourses)) data.userCourses = [];
    const course = normalizeUserCourse({
      id: uuidv4(),
      templateId: null,
      title: subject.name || 'Untitled Course',
      curriculum: subject.level || 'Custom',
      structureType: 'custom',
      color: subject.color || COURSE_COLORS[data.userCourses.length % COURSE_COLORS.length],
      weighting: subject.weighting || 1,
      sections: [],
    }, data.userCourses.length);
    data.userCourses.push(course);
    syncCompatibilityTables(data);
    saveDB(data);
    return projectCoursesToSubjects([course])[0];
  },
  updateSubject: (id, updates) => {
    const data = getDB();
    const idx = findCourseIndex(data, id);
    if (idx > -1) {
      data.userCourses[idx] = {
        ...data.userCourses[idx],
        title: updates.name ?? data.userCourses[idx].title,
        curriculum: updates.level ?? data.userCourses[idx].curriculum,
        weighting: updates.weighting ?? data.userCourses[idx].weighting,
        color: updates.color ?? data.userCourses[idx].color,
        updatedAt: new Date().toISOString(),
      };
      syncCompatibilityTables(data);
      saveDB(data);
      return projectCoursesToSubjects([data.userCourses[idx]])[0];
    }
    return null;
  },
  deleteSubject: (id) => {
    const data = getDB();
    removeUserCourseFromData(data, id);
    saveDB(data);
  },

  // --- Exams ---
  getExams: () => getDB()?.exams || [],
  addExam: (exam) => {
    const data = getDB();
    const newExam = { id: uuidv4(), ...exam };
    data.exams.push(newExam);
    saveDB(data);
    return newExam;
  },
  updateExam: (id, updates) => {
    const data = getDB();
    const idx = data.exams.findIndex((e) => e.id === id);
    if (idx > -1) { data.exams[idx] = { ...data.exams[idx], ...updates }; saveDB(data); }
    return data.exams[idx];
  },
  deleteExam: (id) => {
    const data = getDB();
    data.exams = data.exams.filter((e) => e.id !== id);
    saveDB(data);
  },

  // --- Topics ---
  getTopics: () => flattenUserCourses(getDB()?.userCourses || []),
  getTopicsBySubject: (subjectId) => flattenUserCourses(getDB()?.userCourses || []).filter((t) => t.subjectId === subjectId),

  updateTopic: (id, updates) => {
    const data = getDB();
    const location = findTopicLocation(data, id);
    if (location) {
      const topic = location.section.topics[location.topicIndex];
      if (updates.hasOwnProperty('title') || updates.hasOwnProperty('learningOutcome') || updates.hasOwnProperty('topic')) {
        topic.title = String(updates.title || updates.learningOutcome || updates.topic || topic.title).trim() || topic.title;
      }
      if (updates.hasOwnProperty('confidence')) {
        topic.confidence = clampCourseConfidence(updates.confidence);
        topic.status = courseConfidenceToStatus(topic.confidence);
      }
      if (updates.hasOwnProperty('status')) {
        topic.status = normalizeCourseStatus(updates.status);
        if (!updates.hasOwnProperty('confidence')) {
          topic.confidence = courseStatusToConfidence(topic.status);
        }
      }
      topic.lastReviewed = new Date().toISOString();
      location.course.updatedAt = new Date().toISOString();
      syncCompatibilityTables(data);
      saveDB(data);
      return flattenUserCourses([location.course]).find((item) => item.id === id) || null;
    }
    return null;
  },

  addTopic: (topic) => {
    const data = getDB();
    const course = (data.userCourses || []).find((item) => item.id === topic.subjectId);
    if (!course) return null;

    const sectionTitle = String(topic.unit || 'General').trim() || 'General';
    let section = course.sections.find((item) => item.title.toLowerCase() === sectionTitle.toLowerCase());
    if (!section) {
      section = { id: `custom-section-${slugify(sectionTitle)}-${uuidv4()}`, title: sectionTitle, topics: [] };
      course.sections.push(section);
    }

    const newTopic = normalizeCourseTopic({
      id: topic.id || uuidv4(),
      title: topic.learningOutcome || topic.topic || 'Untitled Topic',
      status: topic.status,
      confidence: topic.confidence,
      lastReviewed: topic.lastReviewed || null,
    });
    section.topics.push(newTopic);
    course.updatedAt = new Date().toISOString();
    syncCompatibilityTables(data);
    saveDB(data);
    return flattenUserCourses([course]).find((item) => item.id === newTopic.id) || null;
  },

  deleteTopic: (id) => {
    const data = getDB();
    const location = findTopicLocation(data, id);
    if (location) {
      location.section.topics.splice(location.topicIndex, 1);
      location.course.updatedAt = new Date().toISOString();
      data.resources = (data.resources || []).filter((resource) => resource.topicId !== id);
      syncCompatibilityTables(data);
    }
    saveDB(data);
  },

  // --- Timetable ---
  getTimetable: () => {
    const data = getDB();
    const subjects = data?.subjects || [];
    return (data?.timetable || []).map((entry) => normalizeTimetableEntry(entry, subjects));
  },
  getTimetableByDay: (day) => {
    const normalizedDay = String(day || '').toLowerCase();
    return (db.getTimetable() || []).filter((entry) => entry.day.toLowerCase() === normalizedDay);
  },
  addTimetableEntry: (entry) => {
    const data = getDB();
    const newEntry = normalizeTimetableEntry({ id: entry?.id || uuidv4(), ...entry }, data.subjects || []);
    data.timetable.push(newEntry);
    saveDB(data);
    return newEntry;
  },
  updateTimetableEntry: (id, updates) => {
    const data = getDB();
    const idx = data.timetable.findIndex((t) => t.id === id);
    if (idx > -1) {
      data.timetable[idx] = normalizeTimetableEntry({ ...data.timetable[idx], ...updates }, data.subjects || []);
      saveDB(data);
    }
    return data.timetable[idx];
  },
  deleteTimetableEntry: (id) => {
    const data = getDB();
    data.timetable = data.timetable.filter((t) => t.id !== id);
    saveDB(data);
  },

  // --- Resources ---
  getResources: () => getDB()?.resources || [],
  getResourcesByTopic: (topicId) => (getDB()?.resources || []).filter((r) => r.topicId === topicId),
  addResource: (resource) => {
    const data = getDB();
    const newResource = { id: uuidv4(), ...resource };
    data.resources.push(newResource);
    saveDB(data);
    return newResource;
  },
  deleteResource: (id) => {
    const data = getDB();
    data.resources = data.resources.filter((r) => r.id !== id);
    saveDB(data);
  },
};

export default db;

