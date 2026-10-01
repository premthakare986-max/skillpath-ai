import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

// ============================================================================
// DATABASE STORAGE ARCHITECTURE NOTICE:
// In Vercel's serverless runtime (AWS Lambda), the root project filesystem is
// read-only (EROFS). The only writable location is '/tmp'.
// 
// IMPORTANT: Data stored in '/tmp' is EPHEMERAL and not shared across serverless
// instances or preserved across cold starts/container recycling.
// For evaluation and hackathon demos:
//   1. The bundled seed database ('./data/skillpath.db') is copied to '/tmp' on cold boot.
//   2. Runtime writes succeed in '/tmp' without throwing read-only filesystem errors.
//   3. For permanent production persistence, configure an external database
//      (e.g., PostgreSQL, Supabase, Cloud SQL, Neon, or Turso).
// ============================================================================
const isVercel = Boolean(process.env.VERCEL);
const dataDir = isVercel
  ? path.resolve('/tmp', 'skillpath-data')
  : path.resolve(process.cwd(), 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'skillpath.db');

// If running in Vercel serverless and /tmp does not have the database yet, copy initial pre-seeded database
if (isVercel && !fs.existsSync(dbPath)) {
  const sourceDbPath = path.resolve(process.cwd(), 'data', 'skillpath.db');
  if (fs.existsSync(sourceDbPath)) {
    try {
      fs.copyFileSync(sourceDbPath, dbPath);
    } catch (err) {
      console.warn('[SkillPath AI] Could not copy initial database to /tmp:', err);
    }
  }
}

const rawDb = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys for robust concurrency
rawDb.exec('PRAGMA journal_mode = WAL;');
rawDb.exec('PRAGMA foreign_keys = ON;');

// Helper to convert undefined values to null for SQLite parameter binding
function sanitizeParam(val: any): any {
  if (val === undefined) return null;
  if (val !== null && typeof val === 'object' && !ArrayBuffer.isView(val) && !(val instanceof Date)) {
    if (val.constructor === Object) {
      const sanitizedObj: Record<string, any> = {};
      for (const [k, v] of Object.entries(val)) {
        sanitizedObj[k] = v === undefined ? null : v;
      }
      return sanitizedObj;
    }
  }
  return val;
}

// Wrap db.prepare to intercept run, get, all, and iterate calls so undefined parameters never cause SQLite binding errors
const rawPrepare = rawDb.prepare.bind(rawDb);
rawDb.prepare = function (sql: string) {
  const stmt = rawPrepare(sql);
  const rawRun = stmt.run.bind(stmt);
  const rawGet = stmt.get.bind(stmt);
  const rawAll = stmt.all.bind(stmt);
  const rawIterate = stmt.iterate.bind(stmt);

  stmt.run = function (...args: any[]) {
    return rawRun(...args.map(sanitizeParam));
  };
  stmt.get = function (...args: any[]) {
    return rawGet(...args.map(sanitizeParam));
  };
  stmt.all = function (...args: any[]) {
    return rawAll(...args.map(sanitizeParam));
  };
  stmt.iterate = function (...args: any[]) {
    return rawIterate(...args.map(sanitizeParam));
  };

  return stmt;
} as any;

export const db = rawDb;

// Initialize Tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student', -- 'student' | 'admin'
      firebase_uid TEXT,
      avatar_url TEXT,
      auth_provider TEXT DEFAULT 'local', -- 'local' | 'google'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      location TEXT,
      degree TEXT,
      branch TEXT,
      college TEXT,
      current_year TEXT,
      current_semester TEXT,
      cgpa REAL,
      sgpa_history TEXT, -- JSON array
      career_goal_id INTEGER,
      custom_career_goal TEXT,
      learning_pace TEXT DEFAULT 'moderate', -- 'slow' | 'moderate' | 'intensive'
      weekly_hours INTEGER DEFAULT 15,
      preferred_work_mode TEXT DEFAULT 'remote', -- 'remote' | 'hybrid' | 'onsite'
      github_url TEXT,
      linkedin_url TEXT,
      onboarding_completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS careers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      category TEXT NOT NULL,
      market_demand TEXT DEFAULT 'High',
      avg_salary TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL, -- 'Frontend' | 'Backend' | 'Database' | 'Core CS' | 'DevOps' | 'DSA' | 'AI/ML'
      difficulty TEXT NOT NULL, -- 'Beginner' | 'Intermediate' | 'Advanced'
      description TEXT,
      career_relevance TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skill_dependencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skill_id INTEGER NOT NULL,
      depends_on_skill_id INTEGER NOT NULL,
      reason TEXT,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
      FOREIGN KEY (depends_on_skill_id) REFERENCES skills(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS career_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      career_id INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      required_level INTEGER DEFAULT 80, -- 1 to 100%
      is_optional INTEGER DEFAULT 0,
      order_index INTEGER DEFAULT 0,
      FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS student_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      self_proficiency INTEGER DEFAULT 0, -- 0 to 100%
      assessed_proficiency INTEGER, -- 0 to 100% or null
      computed_proficiency INTEGER DEFAULT 0,
      status TEXT DEFAULT 'not_started', -- 'not_started' | 'in_progress' | 'completed'
      last_assessed_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, skill_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skill_id INTEGER UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      duration_minutes INTEGER DEFAULT 15,
      total_questions INTEGER DEFAULT 5,
      passing_score INTEGER DEFAULT 60,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assessment_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT DEFAULT 'mcq',
      options_json TEXT NOT NULL, -- JSON array of strings
      correct_answer INTEGER NOT NULL, -- index
      explanation TEXT,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assessment_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      assessment_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      correct_count INTEGER NOT NULL,
      answers_json TEXT,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS roadmaps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      career_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      recalculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS roadmap_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      roadmap_id INTEGER NOT NULL,
      phase_number INTEGER NOT NULL,
      phase_title TEXT NOT NULL,
      skill_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'available', -- 'locked' | 'available' | 'in_progress' | 'completed'
      estimated_hours INTEGER DEFAULT 20,
      order_index INTEGER DEFAULT 0,
      completed_at DATETIME,
      FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skill_id INTEGER NOT NULL,
      topic TEXT NOT NULL,
      title TEXT NOT NULL,
      resource_type TEXT NOT NULL, -- 'Learn' | 'Practice' | 'Build'
      platform TEXT NOT NULL,
      url TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      language TEXT DEFAULT 'English',
      duration_minutes INTEGER DEFAULT 60,
      is_free INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      career_id INTEGER,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      difficulty TEXT NOT NULL, -- 'Beginner' | 'Intermediate' | 'Advanced'
      description TEXT NOT NULL,
      why_this_project TEXT NOT NULL,
      learning_outcomes TEXT NOT NULL,
      technologies_json TEXT NOT NULL, -- JSON array
      checklist_json TEXT NOT NULL, -- JSON array
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS student_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      status TEXT DEFAULT 'in_progress', -- 'in_progress' | 'completed'
      github_repo_url TEXT,
      live_demo_url TEXT,
      completed_checklist_json TEXT, -- JSON array
      notes TEXT,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      description TEXT NOT NULL,
      required_skills_json TEXT NOT NULL, -- JSON array of skill names
      degree_eligibility TEXT,
      year_eligibility TEXT,
      location TEXT NOT NULL,
      work_mode TEXT DEFAULT 'Remote', -- 'Remote' | 'Hybrid' | 'On-site'
      deadline TEXT NOT NULL,
      source TEXT NOT NULL,
      application_url TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      opportunity_id INTEGER NOT NULL,
      status TEXT DEFAULT 'saved', -- 'saved' | 'applied' | 'assessment' | 'interview' | 'selected' | 'rejected'
      applied_date TEXT,
      interview_date TEXT,
      notes TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, opportunity_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS dsa_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      topic TEXT NOT NULL,
      order_index INTEGER DEFAULT 0,
      status TEXT DEFAULT 'not_started', -- 'not_started' | 'in_progress' | 'completed'
      problems_solved INTEGER DEFAULT 0,
      total_problems INTEGER DEFAULT 15,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, topic),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info', -- 'info' | 'success' | 'warning' | 'roadmap'
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      current_profile_summary TEXT NOT NULL,
      strengths_json TEXT NOT NULL,
      skill_gaps_json TEXT NOT NULL,
      priority_gaps_json TEXT NOT NULL,
      career_readiness_score INTEGER NOT NULL,
      readiness_breakdown_json TEXT NOT NULL,
      next_best_action_json TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS youtube_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cache_key TEXT UNIQUE NOT NULL,
      query TEXT NOT NULL,
      results_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS github_evidence_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      github_username TEXT NOT NULL,
      evidence_json TEXT NOT NULL,
      analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS youtube_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      resource_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, resource_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS contact_inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inquiry_id TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      topic TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'New', -- 'New' | 'In Progress' | 'Resolved'
      priority TEXT NOT NULL DEFAULT 'Normal', -- 'Low' | 'Normal' | 'High' | 'Urgent'
      user_id INTEGER,
      firebase_uid TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_inquiries_status ON contact_inquiries(status);
    CREATE INDEX IF NOT EXISTS idx_inquiries_submitted_at ON contact_inquiries(submitted_at);

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_reset_token ON password_reset_tokens(token);
  `);

  // Safe schema migrations for Firebase / Google Auth & Security
  try { db.exec('ALTER TABLE users ADD COLUMN firebase_uid TEXT;'); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT;'); } catch {}
  try { db.exec("ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local';"); } catch {}
  try { db.exec('ALTER TABLE users ADD COLUMN secondary_password_hash TEXT;'); } catch {}
  try { db.exec('ALTER TABLE profiles ADD COLUMN avatar_url TEXT;'); } catch {}
}

// Password hashing utilities using scrypt
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    if (!password || !storedHash || typeof password !== 'string' || typeof storedHash !== 'string') {
      return false;
    }
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    if (keyBuffer.length !== derivedKey.length) return false;
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}
