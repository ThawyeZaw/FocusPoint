<div align="center">

# 🎓 Focus Point

### The Academic Productivity Ecosystem for Myanmar Students

*Timetables · Flashcards · Classrooms · Grade Calculators · Exam Countdowns*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)](https://supabase.com/)
[![Status](https://img.shields.io/badge/Status-MVP%20Phase%201-amber)](.)

</div>

---

## What is Focus Point?

**Focus Point** is a curriculum-focused productivity and learning platform built specifically for Myanmar students pursuing international qualifications. Unlike generic study apps, Focus Point is wired directly into exam board criteria — so your timetables, flashcards, and grade calculators understand the difference between a CAIE IGCSE and an Edexcel IAL.

Whether you're targeting A* in IGCSE or A Levels, IELTS band 7+, or an OSSD diploma, Focus Point keeps your study life organised in one place.

---

## Supported Qualifications

| Exam Board | Qualifications |
|---|---|
| 🎓 **Cambridge CAIE** | IGCSE, A Levels  |
| 📘 **Pearson Edexcel** | IGCSE, International A Level (IAL) |
| 🍁 **OSSD** | Ontario Secondary School Diploma |
| 🌍 **IELTS** | Academic & General Training |
| 📝 **SAT** | College Board SAT (Math + Reading/Writing) |
| 💬 **Duolingo** | Duolingo English Test (DET) |

---

## Features

### 📅 Smart Timetable
- Manage your weekly self-study sessions, classes schedule and works with drag-and-drop time blocks. 
- Colour-code events by subject or event type (study session, class, school, gym, exam, break). 
- Events can be either a to-do or just an event, repeatable daily or weekly, have can have start and end time or all days or only have end time/day, such as assignments or homeworks.
- Events should be able to modified or deleted after creation. 
- Timetable have daily, weekly and monthly views .

### ⌛ Pomodoro Timer
- Launch a built-in Pomodoro timer directly from any study block or from study tools via dashboard, with customisable work/break intervals + choices of background music for the vibe. 
- Every completed session is automatically logged to your productivity history.

### 📈 Lesson Tracker
- Select one or many from a **library of subject and curriculum templates** created by contributors.
- Create your own templates or modify selected ones.
- Set confidence levels for each topic within every unit across each subject or curriculum.

### 📋 Course Manager
- Browse the library to select additional subjects or curriculums.
- Modify, manage, and remove your selected curriculums and subjects.

### 🃏 Flashcard Decks with Spaced Repetition 
- Create, edit and/or share your own flashcards or select ready made decks from **the library** categorized with category and subjec. 
- Study cards with a smooth flip animation and rate each card (Again / Hard / Good / Easy). 
- The spaced-repetition algorithm schedules your next review automatically so you never forget what you've learn.

### 📚 Curriculum Editor & Resource Library 
- Verified **Contributors** can build and maintain global curriculum and exam templates'.
- They can also create and edit syllabus or specification based notes by writing on their own or copy and pasting after creating with AI and notes can include svg for graphs, Latex for equations and images
- All materials go through a gatekeeper approval workflow before becoming publicly visible and selectable by students and teachers.
- **Students** can select from the templates or customize their own.

### 🏫 Virtual Classrooms & Assignments
- **Teachers** create virtual classrooms, link them to one or more curriculums, and share an invite code with students. 
- Issue assignments with deadlines and priorities. Monitor each student's progress within your classroom only.
- **Students** can join classrooms with an invite code, view and complete assigned tasks, and access related resources.

### ⏳ Exam Countdown 
Visual urgency indicators help you prioritise revision time across multiple subjects.
- Set countdowns for every upcoming exam and see exactly how many days, hours, and minutes remain. 
- Could be selected from library of specific subjects, curriculum and exam series.

### 🧮 Grade Calculator
Stop guessing your predicted grades. 
- Enter your raw marks across paper components and the calculator converts them to the correct grade using official boundary tables for IGCSE, A Level, IAL, and OSSD percentage scales. Supports weighted multi-component calculations.

---

## User Roles

| Role | Who | What they can do |
|---|---|---|
| **Student** | Primary users | Dashboard, Timetable, Lesson tracker and course manager, Study tools including Flashcards and Pomodoro timer, Grade Calculator, Exam Countdown, join Classrooms |
| **Teacher** | Paid tier | Everything above + create & manage Classrooms, issue Assignments, monitor student progress |
| **Contributor** | Verified experts | Everything above + Curriculum, exam datetime and Notes Editor / creator to the shared global library of templates |

> You select your role when you first sign up. One email can be used for multiple roles.

---

## Getting Started (Development)

### Prerequisites

- Node.js 18+
- npm 9+

### Install & Run

```bash
# Clone the repository
git clone https://github.com/your-org/focus-point.git
cd focus-point

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Language | TypeScript 5 |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| MVP Backend | `src/lib/mockDatabase.ts` (local typed mock) |
| Icons | lucide-react |
| Hosting | Vercel → `focuspoint.edu.mm` |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx            # Root layout (fonts, providers)
│   ├── page.tsx              # Public landing page
│   └── (app)/               # Authenticated app shell
│       ├── dashboard/        # Home dashboard
│       ├── timetable/        # Timetable
│       ├── pomodoro/         # Pomodoro Timer
│       ├── classrooms/       # Classrooms & Assignments
│       ├── flashcards/       # Flashcard Decks
│       ├── calculator/       # Grade Calculator
│       ├── countdown/        # Exam Countdown
│       ├── editor/           # Curriculum Editor
│       ├── lessons/          # Lesson Tracker
│       └── courses/          # Course Manager
│
├── components/
│   ├── Sidebar.tsx           # Navigation sidebar
│   ├── AuthModal.tsx         # Login / sign-up modal
│   ├── UnderDevelopment.tsx  # Placeholder for WIP features
│   ├── timetable/            # Timetable-specific components
│   ├── pomodoro/             # Pomodoro-specific components
│   ├── classrooms/           # Classroom-specific components
│   ├── flashcards/           # Flashcard-specific components
│   ├── dashboard/            # Dashboard-specific components
│   ├── calculator/           # Calculator-specific components
│   ├── lessons/              # Lesson-tracker components
│   └── courses/              # Course-manager components
│
├── context/
│   └── PersonaContext.tsx    # Global role/persona state
│
├── lib/
│   └── mockDatabase.ts       # Typed mock data (MVP phase)
│
└── types/
    └── supabase.ts           # Auto-generated Supabase types (prod)
```

---

## For Developers — Quick Reference

> **Full architecture, database schema, and AI prompting guidelines are in [`spec.md`](./spec.md).**
> Read it before writing any code.

### Your assigned directory
Work **only** inside your assigned `src/components/[feature]/` directory.

### Using mock data
Import helpers from `@/lib/mockDatabase` — never access the raw arrays directly:

```typescript
import { getTimetableEvents, getStudyStats } from '@/lib/mockDatabase';
```

### Client components
Any component with `useState`, `useEffect`, or event listeners **must** start with:

```typescript
'use client';
```

### AI prompt preamble
Start every Antigravity / Claude session with:

> *"You are building the [feature] component in `src/components/[folder]/`. Read `src/lib/mockDatabase.ts` for all type definitions and `spec.md` for architectural constraints. Do not invent column names or modify files outside my assigned directory."*

---

## Security Model

Row-Level Security (RLS) is enabled on **every table**. Privacy is enforced at the database layer:

- 🔒 Students can only see their own data.
- 🔒 Teachers can only see students within classrooms they own.
- 🔒 Public flashcard decks and approved materials are visible to all authenticated users.
- 🔒 Admin/merge access is restricted to the Project Manager only.

---

## Contributing

This project uses **feature-based branch isolation**. See [`spec.md`](./spec.md) Section 8 for the full Git workflow and PR checklist.

```bash
# Branch naming
feature/timetable-ui    # Dev 1
feature/classrooms-ui   # Dev 2
feature/assignments-ui  # Dev 3
feature/flashcards-ui   # Dev 4
feature/dashboard-ui    # Dev 5
feature/calculator-ui   # Dev 6
```

**Never push directly to `main` or `dev`.** All merges require PM gatekeeper sign-off after automated TypeScript checks pass.

---

## Roadmap

- [ ] Phase 1 — MVP feature placeholders & mock database ✅
- [ ] Phase 2 — Individual feature implementation (active 🚧)
- [ ] Phase 3 — Supabase backend connection & live auth
- [ ] Phase 4 — Mobile responsive polish & PWA support
- [ ] Phase 5 — Public launch on `focuspoint.edu.mm`

---

<div align="center">

Built with ❤️ for Myanmar students  
*Focus Point — MVP Phase 1*

</div>
