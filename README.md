# SkillPath AI - Career Guidance & Skill-Tracking Platform for Students

SkillPath AI is a personalized career guidance and skill-tracking platform for engineering and computer science students. It continuously tracks student proficiencies, calculates mathematical skill gaps against industry benchmarks, dynamically recalculates vertical milestones, and guides students with an objective **Next Best Action**.

---

## 1. Core Product Architecture

```
STUDENT PROFILE
       ↓
AI PROFILE ANALYSIS
       ↓
SKILL GAP ANALYSIS (Required - Current = Gap)
       ↓
SKILL DEPENDENCY GRAPH (Prerequisite Rules)
       ↓
PERSONALIZED ROADMAP (Dynamic Unlocking)
       ↓
LEARN (Verified Official Documentation)
       ↓
PRACTICE & ASSESSMENTS (Objective Quizzes)
       ↓
BUILD PROJECTS (Architecture Blueprints)
       ↓
GITHUB & PORTFOLIO (Evidence-backed)
       ↓
INTERNSHIPS & OPPORTUNITIES (Match Scoring)
       ↓
TRACK APPLICATIONS (Pipeline Kanban)
       ↓
AUTOMATED RECALCULATION
       ↓
NEXT BEST ACTION
```

### The Defining Innovation
The platform operates as a **closed-loop state engine**. Every assessment completion, skill update, or project submission triggers the centralized `recalculateStudentState()` engine:
1. Recalculates exact skill gaps.
2. Updates prerequisite status (locked vs unlocked) in roadmap phases.
3. Computes the composite **Prototype Career Readiness Indicator** (Skills: 30%, Quizzes: 20%, Projects: 20%, DSA: 15%, Profile: 15%).
4. Pinpoints the single, highest-leverage **Next Best Action** (action, time estimate, pedagogical "why", next steps).
5. Updates opportunity match ratings against verified company requirements.

---

## 2. Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Motion (Framer Motion), Lucide Icons.
- **Backend**: Node.js 22, Express, TypeScript (`tsx`).
- **Database**: SQLite with WAL mode via Node 22 native `DatabaseSync` (`data/skillpath.db`).
- **AI Intelligence**: Google Gemini API (`@google/genai` 2.4.0) with server-side proxy routes and configurable model selection (`process.env.GEMINI_MODEL || 'gemini-3.8-flash'`).
- **Authentication**: Password hashing with `crypto.scryptSync` & random salts, 7-day secure sessions, role-based access control (Student vs Admin).

---

## 3. Environment Variables (`.env`)

See `.env.example`:

| Variable | Description | Default / Required |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API key for AI Profile Analysis & Career Mentor | Injected automatically in AI Studio / Optional for local fallback |
| `GEMINI_MODEL` | Gemini model name | `gemini-3.8-flash` |
| `APP_URL` | Service URL for self-referential links | Injected automatically |
| `DATABASE_URL` | SQLite file location | `file:./data/skillpath.db` |
| `AUTH_SECRET` | Session encryption seed | `your-secret-key` |
| `ADMIN_EMAIL` | Initial seeded administrator email | Configured via environment variable (`premthakare986@gmail.com`) |
| `ADMIN_PASSWORD` | Administrator password | Configured securely via environment secret (Not in source/docs) |
| `GITHUB_CLIENT_ID` | Optional GitHub OAuth client | Optional (manual profile handle supported) |
| `GITHUB_CLIENT_SECRET` | Optional GitHub OAuth secret | Optional |
| `LINKEDIN_CLIENT_ID` | Optional LinkedIn OAuth client | Optional (manual profile handle supported) |
| `LINKEDIN_CLIENT_SECRET` | Optional LinkedIn OAuth secret | Optional |

---

## 4. Default Seed Credentials

For evaluation and testing:

### Administrator Account

* **Email**: `ADMIN_EMAIL` (configured through environment variables)
* **Password**: Not disclosed in source code or documentation.
* **Portal**: `/admin`
* **Access**: User management, career templates, skill prerequisites, verified resources, and opportunities.

> **Security:** Never commit or publish administrator passwords in the repository, README, frontend code, or `.env.example`. Configure the administrator password through environment variables or deployment secrets.

### Pre-Configured Student Profile (Rohit Sharma)

* **Email**: `rohit.student@skillpath.edu`
* **Password**: Demo password configured securely in the local/deployment environment.
* **Track**: Full Stack Developer
* **Shortcut**: Click **"Demo Student (Rohit)"** on the `/login` screen for one-click access.

---

## 5. Development & Production Run

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```
Runs full-stack Express server at `http://0.0.0.0:3000` with Vite middleware mounted.

### Build & Production Run
```bash
npm run build
npm start
```

---

## 6. What Works Immediately vs External APIs

### Immediate Functional Features (Zero External Keys Needed)
1. **Student Registration & Login**: Full cryptographic password hashing and session tokens.
2. **10-Step Student Onboarding**: Personal, education, academic CGPA, career tracks, skills with proficiency sliders, project entries, and preferences.
3. **Deterministic Skill-Gap Engine**: Mathematical gaps, dependency validation, and prerequisite locking.
4. **Dynamic Roadmap Recalculation**: Locking/unlocking items dynamically based on skill state.
5. **Technical Assessments**: Real multiple-choice quizzes with instant grading, explanations, and transparent proficiency updates (40% self + 60% tested).
6. **Verified Resource Catalog**: MDN, react.dev, nodejs.org, and PostgreSQL documentation links.
7. **Project Recommendation & Evidence Tracking**: Architectural checklists and GitHub/live demo submissions.
8. **Internship Match Scoring**: Real company roles with calculated match percentages.
9. **Application Pipeline Tracker**: Kanban stages for Saved, Applied, Assessment, Interview, Selected, and Rejected.
10. **DSA Progress Tracker**: 8 foundational topic tracks with problem-solving progress counters.
11. **Student Privacy Center**: Machine-readable JSON data export, disconnect handles, and account deletion.
12. **Admin Console**: Real-time DB metrics, user management, and CRUD for careers, skills, dependencies, and resources.

### AI Capabilities (Gemini API)
- When `GEMINI_API_KEY` is present, `/api/ai/analyze-profile` and `/api/ai/mentor` use Google's `gemini-3.8-flash` model with your live stored profile data.
- When `GEMINI_API_KEY` is absent, robust rule-based deterministic models provide contextual guidance and answers without crashing.
