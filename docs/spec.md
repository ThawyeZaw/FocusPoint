# FocusPoint Project Specification

Developer handoff for the current FocusPoint implementation. This document describes the app as it exists in the repository, not a proposed rewrite.

## Purpose

FocusPoint is a client-side study management engine for students preparing for A-Level, IGCSE, and similar exams. It helps a student manage courses, track syllabus confidence, schedule study time, count down to exams, run focus sessions, and attach study resources.

The product idea is centered on turning course progress and exam dates into practical next actions. The Dashboard uses topic confidence, course weighting, and exam urgency to recommend what the student should study next.

## Tech Stack

- Runtime: React 19 with Vite.
- Routing: `react-router-dom` with `BrowserRouter`, `Routes`, `Route`, `NavLink`, and redirects.
- Styling: Tailwind CSS v4 plus a large custom CSS design system in `apps/web/src/styles/index.css`.
- Icons: `lucide-react`.
- Dates and calendar logic: `date-fns`.
- IDs: `uuid`.
- PWA: `vite-plugin-pwa`, configured in `apps/web/vite.config.js`.
- Persistence: browser `localStorage` cache plus Supabase auth/sync, wrapped by `packages/shared/src/study-data/mockDatabase.js`.
- Installed but currently unused or lightly used: `@dnd-kit/*` and `canvas-confetti`.

Build scripts are defined in `package.json`:

```json
{
  "dev": "npm --workspace @focuspoint/web run dev",
  "build": "npm --workspace @focuspoint/web run build",
  "preview": "npm --workspace @focuspoint/web run preview"
}
```

The web app allows JavaScript under TypeScript checking through `allowJs: true` in `apps/web/tsconfig.json`.

## Repository Layout

FocusPoint now uses a Supabase-first monorepo layout:

- `apps/web`: React/Vite frontend, PWA assets, app shell, routes, feature UI, browser-only utilities, and styles.
- `packages/shared`: curriculum templates, priority engine, and the localStorage/Supabase study-data facade.
- `supabase`: backend boundary for schema documentation, future migrations, generated database types, and seed SQL.
- `docs`: product and architecture documentation.

## App Architecture

`apps/web/src/app/main.jsx` is the entrypoint. It imports the app CSS, initializes the study-data facade with `db.init()`, and mounts React into `#root`.

The root component is wrapped in:

- `BrowserRouter` for client-side routing.
- `ThemeProvider` for light/dark mode state.
- `AuthProvider` for Supabase session state, workspace hydration, and onboarding completion.
- `React.StrictMode`.

`apps/web/src/app/App.jsx` owns the application shell:

- Desktop collapsible sidebar.
- Mobile top header that hides and shows based on scroll direction.
- Mobile bottom navigation.
- Theme toggle placement for desktop and mobile.
- Route registration and fallback redirects.

Data is not held in a global state manager. Screens generally read directly from the `db` facade, keep local React state for their current view, then refresh from `db` after writes.

## Routes

Active route wiring is in `apps/web/src/app/App.jsx`.

| Path | Component | Status |
| --- | --- | --- |
| `/` | `Dashboard` | Active |
| `/tracker` | `LessonTracker` | Active |
| `/courses` | `CourseManagement` | Active |
| `/countdown` | `ExamCountdown` | Active |
| `/pomodoro` | `Pomodoro` | Active |
| `/timetable` | `Timetable` | Active |
| `/settings` | `Settings` | Active |
| `*` | Redirects to `/` | Fallback |

`ResourceLibrary.jsx` exists under the settings feature as available component code, but it is not currently mounted as its own route.

## Component Map

### `Dashboard.jsx`

Dashboard is the heart screen. It reads subjects, topics, exams, and timetable entries from `db`, then uses `priorityEngine.js` to render:

- Greeting and progress chips.
- Progress stats: mastered, in progress, not started, total.
- Next Move: highest-priority unmastered topic.
- Recall Zone: low-confidence topics.
- Exam Countdown preview.
- Today schedule preview.
- Priority Queue table.

Navigation buttons route into Tracker and Exams.

### `LessonTracker.jsx`

Lesson Tracker is the syllabus progress workspace. It reads `userCourses`, lets the student select an active course, expands sections, and updates topic confidence with a 0-5 range control.

Topic status is derived from confidence:

- `0`: `Not Started`
- `1`: `Beginner`
- `2`: `In Progress`
- `3`: `Reviewing`
- `4`: `Proficient`
- `5`: `Mastered`

Writes go through `db.updateTopicStatus()`.

### `CourseManagement.jsx`

Course Management is the curriculum studio. It supports:

- Adding read-only curriculum templates into user-owned course copies.
- Creating custom courses.
- Editing course title, curriculum, structure type, weighting, and color.
- Adding, renaming, and deleting sections.
- Adding, renaming, and deleting topics.
- Deleting courses, with a confirmation modal.

Template source data comes from `packages/shared/src/curriculum/curriculumData.js`.

### `ExamCountdown.jsx`

Exam Countdown manages exam papers. It reads subjects and exams from `db`, calculates days remaining with `daysUntil()`, sorts by urgency, and renders:

- A featured next exam card.
- Countdown ring.
- Exam cards with critical, warning, or normal urgency.
- Add exam modal.
- Delete exam actions.

Writes go through `db.addExam()` and `db.deleteExam()`.

Every exam is linked into the timetable by the shared data facade as an all-day `exam` event. The exam record is the source of truth; generated timetable entries update when an exam date/paper changes and are removed when the exam is deleted.

### `Timetable.jsx`

Timetable is a self-contained scheduling module with its own context provider. It supports:

- Daily, weekly, and monthly views.
- Daily timeline and daily list modes.
- All-day and timed events.
- Events and to-do items.
- Completion tracking for to-do occurrences.
- Daily, weekly, and monthly recurrence with an end date.
- Zoom controls saved to localStorage.
- Event create, edit, and delete modal.
- Searchable/custom event type field.
- Linked all-day exam entries generated from Exam Countdown.
- A global timetable timezone preference, defaulting to `Asia/Yangon`.

The timetable normalizes database entries into UI events and converts UI events back to database payloads.

### `Pomodoro.jsx` and `SmartPomodoro.jsx`

`Pomodoro.jsx` is a wrapper screen. It renders `SmartPomodoro` in embedded mode.

`SmartPomodoro` supports:

- Presets: `25/5` and `50/10`.
- Focus and break phases.
- Persistent timer state across refreshes.
- Session notes.
- Browser notification permission request on start.
- Audio alert on phase transitions.
- Break overlay with a reset prompt.

### `Settings.jsx`

Settings is currently unmounted. The component includes:

- Academic level and exam sitting settings.
- Curriculum template cards.
- Course/subject management.
- Preference toggles for dark mode, ROW method, and FOCUS method.

`/settings` is mounted in the active navigation surface.

### `ResourceLibrary.jsx`

Resource Library is currently unmounted. The component includes:

- Resource listing.
- Search and subject filters.
- Drag/click upload modal.
- Topic linking.
- Delete resource action.

Resource upload is metadata-only in the current implementation. Files are not persisted; resources store `url: "#"`.

### `ThemeContext.jsx`

Theme context stores light/dark state in `focuspoint_theme`. Dark mode is the default when no stored preference exists. The provider toggles the `dark` class on `document.documentElement`.

## Data Model

`packages/shared/src/study-data/mockDatabase.js` is the main data facade. It keeps a localStorage cache, exposes CRUD helpers to the UI, and syncs authenticated workspaces to Supabase when `AuthContext` connects a Supabase client and user. The canonical modern structure is `userCourses`; `subjects` and `topics` are compatibility projections derived from `userCourses`.

### Database Envelope

```ts
type FocusPointDatabase = {
  schemaVersion: number;
  user: User;
  settings: Settings;
  userCourses: Course[];
  subjects: Subject[];      // compatibility projection
  topics: Topic[];          // compatibility projection
  exams: Exam[];
  timetable: TimetableEntry[];
  resources: Resource[];
};
```

### User

```ts
type User = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  level: string;
  createdAt: string;
};
```

### Settings

```ts
type Settings = {
  academicLevel: string;
  examSittings: {
    mayJune2026: string;
    january2027: string;
  };
  preferences: {
    rowMethod: boolean;
    focusMethod: boolean;
    accentColor: string;
    timeZone: string;        // IANA timezone, defaults to Asia/Yangon
  };
};
```

### Course

```ts
type Course = {
  id: string;
  templateId: string | null;
  title: string;
  curriculum: string;
  structureType: "custom" | "modular" | "linear" | "skill-based" | string;
  color: string;
  weighting: number;
  createdAt: string;
  updatedAt: string;
  sections: Section[];
};
```

### Section

```ts
type Section = {
  id: string;
  title: string;
  topics: CourseTopic[];
};
```

### CourseTopic

```ts
type CourseTopic = {
  id: string;
  title: string;
  status: "Not Started" | "Beginner" | "In Progress" | "Reviewing" | "Proficient" | "Mastered";
  confidence: 0 | 1 | 2 | 3 | 4 | 5;
  lastReviewed: string | null;
};
```

### Subject Projection

Subjects are derived from `userCourses` by `projectCoursesToSubjects()`.

```ts
type Subject = {
  id: string;
  name: string;
  level: string;
  weighting: number;
  color: string;
  structureType: string;
};
```

### Topic Projection

Topics are flattened from all course sections by `flattenUserCourses()`. Legacy screens and the priority engine consume this shape.

```ts
type Topic = {
  id: string;
  subjectId: string;
  courseId: string;
  sectionId: string;
  unit: string;
  topic: string;
  learningOutcome: string;
  status: "not-started" | "beginner" | "in-progress" | "reviewing" | "proficient" | "mastered";
  confidence: number;
  lastReviewed: string | null;
};
```

### Exam

```ts
type Exam = {
  id: string;
  subjectId: string;
  paper: string;
  date: string;   // yyyy-mm-dd
  color: string;
};
```

### TimetableEntry

Timetable entries support both the newer event model and legacy fields.

```ts
type TimetableEntry = {
  id: string;
  title: string;
  subjectId: string | null;
  subjectName: string;
  category: string;
  date: string;              // yyyy-mm-dd
  start: string;             // yyyy-mm-ddTHH:mm
  end: string;               // yyyy-mm-ddTHH:mm
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  kind: "event" | "todo";
  completedDates: string[];
  linkedTopicId: string | null;
  linkedExamId: string | null;
  repeat: "none" | "daily" | "weekly" | "monthly";
  repeatUntil: string | null;
  notes: string;
  systemSeed: boolean;
  locked: boolean;

  // Legacy compatibility fields
  label: string;
  type: string;
  subject: string;
  day: string;
  isRecurring: boolean;
  recurrencePattern: "None" | "Daily" | "Weekly" | "Monthly";
  recurrenceEndDate: string | null;
};
```

### Resource

```ts
type Resource = {
  id: string;
  topicId: string;
  name: string;
  type: "pdf" | "image" | "other" | string;
  size: number;
  uploadedAt: string;
  url: string;
};
```

### Curriculum Templates

`packages/shared/src/curriculum/curriculumData.js` exports `curriculumTemplateGroups`, flattened `curriculumTemplates`, and `getCurriculumTemplate(templateId)`.

Templates are read-only blueprints. Adding a template creates a user-owned `Course` copy with new topic IDs and initial `Not Started` progress.

Current groups include IGCSE CIE, IGCSE Edexcel, Edexcel IAL, CIE A Levels, IELTS, SAT, GED, and OSSD.

## Persistence

Main app data is stored under:

```txt
focuspoint_db
```

`db.init()` loads this key, migrates it if needed, and seeds defaults if no database exists.

When a Supabase session is available, `AuthProvider` calls `db.connectSupabase()` and `db.hydrateFromSupabase()`. Writes are saved locally first and then debounced to Supabase through `db.saveLocalToSupabase()`.

Auxiliary localStorage keys:

```txt
focuspoint_theme
focuspoint_timetable_zoom
focuspoint_pomodoro_notes
focuspoint_pomodoro_timer
```

The exported `db` facade includes these CRUD groups:

- User: `getUser`, `updateUser`.
- Settings: `getSettings`, `updateSettings`.
- User Courses: add from template, add custom, update, remove, section/topic CRUD, topic status updates.
- Subjects: compatibility CRUD mapped onto courses.
- Exams: get, add, update, delete.
- Topics: flattened topic reads plus update, add, delete.
- Timetable: get, get by day, add, update, delete.
- Resources: get, get by topic, add, delete.

Migration behavior:

- Timetable entries are normalized to the current event shape.
- Exam records generate linked all-day timetable entries.
- Timetable wall-clock dates/times are preserved through the configured timezone.
- Topic status and confidence are synchronized.
- Default school timetable seeds are inserted when missing.
- Legacy subjects/topics are converted into `userCourses`.
- After user course normalization, `subjects` and `topics` compatibility tables are regenerated.

## Priority Engine

`packages/shared/src/priority/priorityEngine.js` drives the Dashboard recommendation logic.

The core score is:

```txt
priority = (subject weighting * (1 - normalized confidence)) / days to nearest exam
```

Implementation details:

- `daysUntil(dateStr)` floors the current day and target day before calculating whole calendar days.
- `normalizeConfidence(score)` maps confidence from 1-5 into 0-1.
- `calculatePriority(weighting, confidence, daysToExam)` guards against division by zero by using at least `0.5` days.
- `getPrioritizedTopics(topics, subjects, exams)` filters out mastered topics and topics without a future exam.
- `getNextMove()` returns the highest-priority topic.
- `getRecallZone()` returns up to two low-confidence prioritized topics.
- `getExamCountdowns()` enriches exams with subject data, days left, past/urgency flags, and sorting.
- `getTodaySchedule()` expands today's matching one-off or recurring timetable entries.
- `getProgressStats()` calculates aggregate topic progress.

## Styling/PWA Notes

The visual system is concentrated in `apps/web/src/styles/index.css`.

Key styling concepts:

- Tailwind v4 is imported with `@import "tailwindcss"`.
- Theme tokens are CSS custom properties on `:root` and `.dark`.
- Reusable classes include card, badge, button, input, modal, dashboard, tracker, course, timetable, and pomodoro styles.
- Dark mode is class-based through `ThemeContext`.
- The app uses responsive desktop sidebar and mobile bottom navigation patterns.

PWA configuration is in `apps/web/vite.config.js`:

- Uses `VitePWA`.
- Registers with `autoUpdate`.
- Includes favicon, SVG icon sprite, and PNG PWA icons.
- Manifest name and short name are `FocusPoint`.
- Display mode is `standalone`.
- Start URL and scope are `/`.

`public/_redirects` contains:

```txt
/* /index.html 200
```

This supports client-side routing on static hosts that honor Netlify-style redirects.

## Current Gaps

- Supabase is the backend boundary; there is no custom Node API server.
- Supabase migrations and generated database types are placeholders until schema history is added.
- `ResourceLibrary.jsx` is not mounted as its own route.
- Resource uploads store metadata only and do not persist uploaded file contents.
- Dashboard greeting uses the hard-coded name `Alex`.
- The mock database still maintains compatibility projections for older subject/topic APIs, so future changes should treat `userCourses` as canonical.
- `@dnd-kit/*` and `canvas-confetti` are installed but not actively used in the current source.
- There are no dedicated automated tests in the repository.
- `dist/` output is generated under the web app and ignored by git; generated builds should not be treated as source.
