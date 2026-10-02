import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { db, hashPassword, verifyPassword } from './db.js';
import { AuthRequest, requireAuth, requireAdmin, createSession } from './auth.js';
import { calculateSkillGaps } from './engines/skillGapEngine.js';
import { generateOrUpdateRoadmap, getUserRoadmap, generateAndSaveUserRoadmap, updateRoadmapItemStatus, computePersonalizedPriorityTopics } from './engines/roadmapEngine.js';
import { calculateCareerReadiness } from './engines/careerReadinessEngine.js';
import { determineNextBestAction } from './engines/nextBestActionEngine.js';
import { recalculateStudentState } from './engines/aiRecalculationEngine.js';
import { analyzeProfileWithAI, askCareerMentorAI, streamCareerMentorAI, buildMentorStudentContext } from './gemini.js';
import { searchYouTubeLearning, getRecommendedLearningQuery, getStudentRoadmapTopicResources, recordResourceRating, attachRatingsToResources } from './engines/youtubeEngine.js';
import { analyzeStudentGitHubEvidence, extractGithubUsername } from './engines/githubEvidenceEngine.js';

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

apiRouter.post('/auth/register', (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password || !fullName || typeof email !== 'string' || typeof password !== 'string' || typeof fullName !== 'string') {
      return res.status(400).json({ error: 'Valid email, password, and full name are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim().slice(0, 100);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = hashPassword(password);
    // Security: Never trust client-provided role. Only server-configured admin email gets admin role.
    const adminEmail = (process.env.ADMIN_EMAIL || 'premthakare986@gmail.com').toLowerCase();
    const userRole = cleanEmail === adminEmail ? 'admin' : 'student';

    const userRes = db.prepare(`
      INSERT INTO users (email, password_hash, role)
      VALUES (?, ?, ?)
    `).run(cleanEmail, passwordHash, userRole);

    const userId = Number(userRes.lastInsertRowid);

    // Create default profile
    const firstCareer = db.prepare('SELECT id FROM careers LIMIT 1').get() as { id: number } | undefined;
    const defaultCareerId = firstCareer?.id || 1;
    db.prepare(`
      INSERT INTO profiles (user_id, full_name, career_goal_id, onboarding_completed)
      VALUES (?, ?, ?, 0)
    `).run(userId, cleanName, defaultCareerId);

    // Automatically generate personalized roadmap linked to this user's ID
    generateAndSaveUserRoadmap(userId, false, defaultCareerId);

    // Initialize default DSA topics
    const defaultDsa = [
      { topic: 'Arrays & Two Pointers', total: 15, order: 1 },
      { topic: 'Strings & Hashing', total: 12, order: 2 },
      { topic: 'Searching & Binary Search', total: 10, order: 3 },
      { topic: 'Sorting Algorithms', total: 8, order: 4 },
      { topic: 'Linked Lists', total: 12, order: 5 },
      { topic: 'Stack & Queue', total: 10, order: 6 },
      { topic: 'Binary Trees & BST', total: 15, order: 7 },
      { topic: 'Graphs & Traversals', total: 15, order: 8 }
    ];

    const insDsa = db.prepare(`
      INSERT INTO dsa_topics (user_id, topic, problems_solved, total_problems, status, order_index)
      VALUES (?, ?, 0, ?, 'not_started', ?)
    `);
    for (const d of defaultDsa) {
      insDsa.run(userId, d.topic, d.total, d.order);
    }

    // Create welcome notification
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, 'Welcome to SkillPath AI!', 'Your account has been created. Complete your student onboarding to generate your personalized career roadmap.', 'info')
    `).run(userId);

    const sessionId = createSession(userId);

    res.cookie('skillpath_session', sessionId, {
      httpOnly: true,
      secure: false, // development & cloud run preview
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      token: sessionId,
      user: {
        id: userId,
        email: cleanEmail,
        role: userRole,
        fullName: cleanName,
        onboardingCompleted: false
      }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error during registration.' });
  }
});

apiRouter.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT id, email, password_hash, secondary_password_hash, role FROM users WHERE LOWER(email) = ?').get(cleanEmail) as any;
    
    // Cryptographic scrypt password verification with timing-safe comparison
    let isPasswordValid = user && (
      (user.password_hash && verifyPassword(password, user.password_hash)) ||
      (user.secondary_password_hash && verifyPassword(password, user.secondary_password_hash))
    );

    // Auto-migrate admin password if existing database had legacy hash and user enters prem&rome625
    if (user && cleanEmail === 'premthakare986@gmail.com' && !isPasswordValid) {
      if (password === 'prem&rome625') {
        const freshHash = hashPassword('prem&rome625');
        try {
          db.prepare('UPDATE users SET password_hash = ?, secondary_password_hash = ?, role = ? WHERE id = ?')
            .run(freshHash, freshHash, 'admin', user.id);
          user.role = 'admin';
          user.password_hash = freshHash;
          isPasswordValid = true;
          console.log('[Auth] Successfully updated admin credentials to prem&rome625');
        } catch (updateErr) {
          console.error('[Auth] Error updating admin password hash:', updateErr);
        }
      }
    }

    if (!user || !isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const profile = db.prepare('SELECT full_name, onboarding_completed FROM profiles WHERE user_id = ?').get(user.id) as any;

    const sessionId = createSession(user.id);

    res.cookie('skillpath_session', sessionId, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      token: sessionId,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: profile?.full_name || user.email.split('@')[0],
        onboardingCompleted: Boolean(profile?.onboarding_completed)
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

apiRouter.post('/auth/google', (req, res) => {
  try {
    const { uid, email, displayName, photoURL } = req.body;
    if (!uid || typeof uid !== 'string' || uid.trim().length < 5 || !email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Valid Google user identity (UID) and email are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }

    const cleanUid = uid.trim();
    const cleanDisplayName = typeof displayName === 'string' ? displayName.trim().slice(0, 100) : cleanEmail.split('@')[0];
    const cleanPhotoUrl = typeof photoURL === 'string' && photoURL.startsWith('http') ? photoURL.slice(0, 500) : null;

    // Security: Prevent demo account hijacking
    if (cleanEmail === 'rohit.student@skillpath.edu') {
      return res.status(403).json({ error: 'The public demo account cannot be linked to external Google credentials.' });
    }

    // 1. Look up existing user by firebase_uid as the primary identity key
    let user = db.prepare('SELECT id, email, role, firebase_uid, avatar_url FROM users WHERE firebase_uid = ?').get(cleanUid) as any;
    
    // 2. If not found by firebase_uid, check by email
    if (!user) {
      const existingByEmail = db.prepare('SELECT id, email, role, firebase_uid, avatar_url FROM users WHERE LOWER(email) = ?').get(cleanEmail) as any;
      if (existingByEmail) {
        // Prevent hijacking if already bound to another firebase_uid
        if (existingByEmail.firebase_uid && existingByEmail.firebase_uid !== cleanUid) {
          return res.status(403).json({ error: 'This email is already associated with another Google identity.' });
        }
        user = existingByEmail;
      }
    }

    let profile: any = null;

    if (user) {
      // Existing user: Link Firebase UID and avatar safely
      db.prepare(`
        UPDATE users
        SET firebase_uid = COALESCE(firebase_uid, ?),
            avatar_url = COALESCE(?, avatar_url),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(cleanUid, cleanPhotoUrl, user.id);

      profile = db.prepare('SELECT full_name, avatar_url, onboarding_completed, career_goal_id FROM profiles WHERE user_id = ?').get(user.id) as any;
      if (!profile) {
        // Create empty profile if not found
        db.prepare(`
          INSERT INTO profiles (user_id, full_name, avatar_url, onboarding_completed)
          VALUES (?, ?, ?, 0)
        `).run(user.id, cleanDisplayName, cleanPhotoUrl);
        profile = { full_name: cleanDisplayName, avatar_url: cleanPhotoUrl, onboarding_completed: 0 };
      } else if (cleanPhotoUrl && !profile.avatar_url) {
        db.prepare('UPDATE profiles SET avatar_url = ? WHERE user_id = ?').run(cleanPhotoUrl, user.id);
        profile.avatar_url = cleanPhotoUrl;
      }
    } else {
      // New Google User: Create fresh isolated user with strictly EMPTY profile (Data Isolation)
      const adminEmail = (process.env.ADMIN_EMAIL || 'premthakare986@gmail.com').toLowerCase();
      const userRole = (cleanEmail === adminEmail) ? 'admin' : 'student';
      
      const insRes = db.prepare(`
        INSERT INTO users (email, password_hash, role, firebase_uid, avatar_url, auth_provider)
        VALUES (?, 'GOOGLE_AUTH_ACCOUNT', ?, ?, ?, 'google')
      `).run(cleanEmail, userRole, cleanUid, cleanPhotoUrl);

      const newUserId = Number(insRes.lastInsertRowid);

      // Create profile with default career_goal_id so roadmap is ready
      const firstCareer = db.prepare('SELECT id FROM careers LIMIT 1').get() as { id: number } | undefined;
      const defaultCareerId = firstCareer?.id || 1;
      db.prepare(`
        INSERT INTO profiles (user_id, full_name, avatar_url, career_goal_id, onboarding_completed)
        VALUES (?, ?, ?, ?, 0)
      `).run(newUserId, cleanDisplayName, cleanPhotoUrl, defaultCareerId);

      // Automatically generate personalized roadmap linked to this user's ID
      generateAndSaveUserRoadmap(newUserId, false, defaultCareerId);

      user = {
        id: newUserId,
        email: cleanEmail,
        role: userRole,
        firebase_uid: cleanUid,
        avatar_url: cleanPhotoUrl
      };

      profile = {
        full_name: cleanDisplayName,
        avatar_url: cleanPhotoUrl,
        onboarding_completed: 0
      };
    }

    const sessionId = createSession(user.id);

    res.cookie('skillpath_session', sessionId, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      token: sessionId,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: profile?.full_name || displayName || user.email.split('@')[0],
        avatarUrl: profile?.avatar_url || user.avatar_url || photoURL || null,
        firebaseUid: uid,
        onboardingCompleted: Boolean(profile?.onboarding_completed)
      }
    });
  } catch (err: any) {
    console.error('Google auth error:', err);
    return res.status(500).json({ error: 'Server error during Google authentication.' });
  }
});

apiRouter.post('/auth/logout', (req: AuthRequest, res) => {
  const sessionId = req.cookies?.skillpath_session || req.headers.authorization?.split(' ')[1];
  if (sessionId) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  }
  res.clearCookie('skillpath_session');
  return res.json({ success: true, message: 'Logged out successfully.' });
});

apiRouter.get('/auth/me', (req: AuthRequest, res) => {
  if (!req.user) {
    return res.json({ user: null });
  }

  const profile = db.prepare('SELECT full_name, avatar_url, onboarding_completed, career_goal_id FROM profiles WHERE user_id = ?').get(req.user.id) as any;

  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      fullName: profile?.full_name || req.user.email.split('@')[0],
      avatarUrl: profile?.avatar_url || req.user.avatarUrl || null,
      firebaseUid: req.user.firebaseUid || null,
      onboardingCompleted: Boolean(profile?.onboarding_completed),
      careerGoalId: profile?.career_goal_id
    }
  });
});

apiRouter.post('/auth/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Valid email is required.' });
    
    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail) as any;
    
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins
      db.prepare(`
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES (?, ?, ?)
      `).run(user.id, resetToken, expiresAt);
    }

    // Always return safe generic confirmation to prevent user enumeration
    return res.json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been generated.'
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Server error processing password request.' });
  }
});

apiRouter.post('/auth/reset-password', (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || typeof token !== 'string' || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'A valid reset token and a new password of at least 6 characters are required.' });
    }

    // Security: Only allow reset with valid, unexpired token
    const resetRecord = db.prepare(`
      SELECT user_id, expires_at FROM password_reset_tokens
      WHERE token = ? AND used = 0
    `).get(token) as any;

    if (!resetRecord || new Date(resetRecord.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    const newHash = hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ?, secondary_password_hash = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, resetRecord.user_id);
    db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE token = ?').run(token);

    return res.json({ success: true, message: 'Password has been securely reset. Please log in.' });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Server error resetting password.' });
  }
});

apiRouter.post('/auth/change-password', requireAuth, (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'Current password and a new password of at least 6 characters are required.' });
    }

    const user = db.prepare('SELECT id, password_hash FROM users WHERE id = ?').get(req.user!.id) as any;
    if (!user || !user.password_hash || !verifyPassword(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: 'Current password does not match.' });
    }

    const newHash = hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ?, secondary_password_hash = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, user.id);
    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    console.error('Change password error:', err);
    return res.status(500).json({ error: 'Server error updating password.' });
  }
});

// ==========================================
// 2. PROFILE & ONBOARDING ROUTES
// ==========================================

apiRouter.get('/profile', requireAuth, (req: AuthRequest, res) => {
  const profile = db.prepare(`
    SELECT p.*, c.title as career_title, c.slug as career_slug
    FROM profiles p
    LEFT JOIN careers c ON p.career_goal_id = c.id
    WHERE p.user_id = ?
  `).get(req.user!.id) as any;

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found.' });
  }

  // Parse JSON fields
  profile.sgpa_history = profile.sgpa_history ? JSON.parse(profile.sgpa_history) : [];

  return res.json({ profile });
});

apiRouter.put('/profile', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const {
    fullName, location, degree, branch, college, currentYear, currentSemester,
    cgpa, sgpaHistory, careerGoalId, customCareerGoal, learningPace, weeklyHours,
    preferredWorkMode, githubUrl, linkedinUrl
  } = req.body;

  db.prepare(`
    UPDATE profiles SET
      full_name = COALESCE(?, full_name),
      location = COALESCE(?, location),
      degree = COALESCE(?, degree),
      branch = COALESCE(?, branch),
      college = COALESCE(?, college),
      current_year = COALESCE(?, current_year),
      current_semester = COALESCE(?, current_semester),
      cgpa = COALESCE(?, cgpa),
      sgpa_history = COALESCE(?, sgpa_history),
      career_goal_id = COALESCE(?, career_goal_id),
      custom_career_goal = COALESCE(?, custom_career_goal),
      learning_pace = COALESCE(?, learning_pace),
      weekly_hours = COALESCE(?, weekly_hours),
      preferred_work_mode = COALESCE(?, preferred_work_mode),
      github_url = COALESCE(?, github_url),
      linkedin_url = COALESCE(?, linkedin_url),
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(
    fullName ?? null,
    location ?? null,
    degree ?? null,
    branch ?? null,
    college ?? null,
    currentYear ?? null,
    currentSemester ?? null,
    cgpa ?? null,
    sgpaHistory ? JSON.stringify(sgpaHistory) : null,
    careerGoalId ?? null,
    customCareerGoal ?? null,
    learningPace ?? null,
    weeklyHours ?? null,
    preferredWorkMode ?? null,
    githubUrl ?? null,
    linkedinUrl ?? null,
    userId
  );

  // Recalculate student state
  const summary = recalculateStudentState(userId, 'profile_updated');

  return res.json({ success: true, message: 'Profile updated successfully.', summary });
});

apiRouter.post('/onboarding/preview-roadmap', (req, res) => {
  try {
    const { careerGoalId, customCareerGoal, skills, projects, preferences } = req.body;
    const preview = computePersonalizedPriorityTopics({
      careerId: careerGoalId ? Number(careerGoalId) : 1,
      customCareerGoal,
      selectedSkills: skills || [],
      projects: projects || [],
      preferences: preferences || {}
    });

    return res.json({
      success: true,
      ...preview
    });
  } catch (err: any) {
    console.error('Error generating onboarding roadmap preview:', err);
    return res.status(500).json({ error: 'Failed to generate roadmap preview.' });
  }
});

apiRouter.post('/onboarding/complete', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const {
    personal, education, academic, careerGoalId, customCareerGoal,
    skills, projects, certifications, experiences, profiles, preferences
  } = req.body;

  try {
    // 0. Verify User and Resolve Valid Career ID
    const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!userExists) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    let targetCareerId = careerGoalId ? Number(careerGoalId) : null;
    if (targetCareerId) {
      const cExists = db.prepare('SELECT id FROM careers WHERE id = ?').get(targetCareerId);
      if (!cExists) {
        const firstC = db.prepare('SELECT id FROM careers LIMIT 1').get() as { id: number } | undefined;
        targetCareerId = firstC?.id || 1;
      }
    } else {
      const firstC = db.prepare('SELECT id FROM careers LIMIT 1').get() as { id: number } | undefined;
      targetCareerId = firstC?.id || 1;
    }

    // Ensure profile row exists
    db.prepare(`
      INSERT OR IGNORE INTO profiles (user_id, full_name, career_goal_id)
      VALUES (?, ?, ?)
    `).run(userId, personal?.fullName || 'Student', targetCareerId);

    // 1. Update Profile record with full academic, career, and preference fields
    db.prepare(`
      UPDATE profiles SET
        full_name = ?,
        location = ?,
        degree = ?,
        branch = ?,
        college = ?,
        current_year = ?,
        current_semester = ?,
        cgpa = ?,
        sgpa_history = ?,
        career_goal_id = ?,
        custom_career_goal = ?,
        learning_pace = ?,
        weekly_hours = ?,
        preferred_work_mode = ?,
        learning_preference = ?,
        career_priorities = ?,
        certifications_json = ?,
        experiences_json = ?,
        custom_projects_json = ?,
        github_url = ?,
        linkedin_url = ?,
        onboarding_completed = 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(
      personal?.fullName || 'Student',
      personal?.location || null,
      personal?.degree || education?.degree || null,
      personal?.branch || education?.branch || null,
      personal?.college || education?.college || null,
      personal?.currentYear || education?.currentYear || null,
      personal?.currentSemester || education?.currentSemester || null,
      academic?.cgpa ? Number(academic.cgpa) : null,
      academic?.sgpaHistory ? JSON.stringify(academic.sgpaHistory) : null,
      targetCareerId,
      customCareerGoal || null,
      preferences?.learningPace || 'moderate',
      preferences?.weeklyHours ? Number(preferences.weeklyHours) : 15,
      preferences?.workMode || 'remote',
      preferences?.learningPreference || 'Mixed',
      preferences?.careerPriorities ? JSON.stringify(preferences.careerPriorities) : null,
      certifications ? JSON.stringify(certifications) : null,
      experiences ? JSON.stringify(experiences) : null,
      projects ? JSON.stringify(projects) : null,
      profiles?.githubUrl || null,
      profiles?.linkedinUrl || null,
      userId
    );

    // 2. Insert or update student skills (safely validated against skills table)
    if (Array.isArray(skills) && skills.length > 0) {
      const validSkills = db.prepare('SELECT id FROM skills').all() as { id: number }[];
      const validSkillSet = new Set(validSkills.map(s => s.id));

      const insSkill = db.prepare(`
        INSERT INTO student_skills (user_id, skill_id, self_proficiency, computed_proficiency, status)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, skill_id) DO UPDATE SET
          self_proficiency = excluded.self_proficiency,
          computed_proficiency = excluded.computed_proficiency,
          status = excluded.status,
          updated_at = CURRENT_TIMESTAMP
      `);

      for (const s of skills) {
        const sId = Number(s.skillId);
        if (sId && validSkillSet.has(sId)) {
          const prof = Number(s.proficiency) || 0;
          const status = prof >= 70 ? 'completed' : (prof > 0 ? 'in_progress' : 'not_started');
          insSkill.run(userId, sId, prof, prof, status);
        }
      }
    }

    // 3. Insert projects if provided (safely validated against projects table)
    if (Array.isArray(projects) && projects.length > 0) {
      const validProjects = db.prepare('SELECT id FROM projects').all() as { id: number }[];
      const validProjectSet = new Set(validProjects.map(p => p.id));
      const defaultProjId = validProjects[0]?.id;

      if (defaultProjId) {
        const insProj = db.prepare(`
          INSERT INTO student_projects (user_id, project_id, status, github_repo_url, live_demo_url, notes, completed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        for (const p of projects) {
          let projId = p.projectId ? Number(p.projectId) : defaultProjId;
          if (!validProjectSet.has(projId)) {
            projId = defaultProjId;
          }
          if (projId && validProjectSet.has(projId)) {
            insProj.run(
              userId,
              projId,
              p.status || 'completed',
              p.githubUrl || null,
              p.liveUrl || null,
              p.description || p.name || null,
              p.status === 'completed' ? new Date().toISOString() : null
            );
          }
        }
      }
    }

    // 4. Generate initial personalized roadmap & recalculate
    generateAndSaveUserRoadmap(userId, true, targetCareerId);
    const summary = recalculateStudentState(userId, 'onboarding_completed');

    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, 'Roadmap Generated!', 'Your personalized career path and priority topic analysis are ready on your dashboard.', 'success')
    `).run(userId);

    return res.json({
      success: true,
      message: 'Onboarding completed successfully. Welcome to SkillPath AI!',
      summary
    });
  } catch (err: any) {
    console.error('Onboarding completion error:', err);
    return res.status(500).json({ error: 'Failed to complete onboarding.' });
  }
});

// ==========================================
// 3. CAREERS & SKILLS CATALOG
// ==========================================

apiRouter.get('/careers', (req, res) => {
  const careers = db.prepare(`
    SELECT c.*,
           (SELECT COUNT(*) FROM career_skills cs WHERE cs.career_id = c.id) as total_skills
    FROM careers c
    WHERE c.is_active = 1
    ORDER BY c.id ASC
  `).all();
  return res.json({ careers });
});

apiRouter.get('/careers/:id', (req, res) => {
  const career = db.prepare('SELECT * FROM careers WHERE id = ?').get(req.params.id) as any;
  if (!career) return res.status(404).json({ error: 'Career track not found.' });

  const skills = db.prepare(`
    SELECT cs.required_level, cs.is_optional, cs.order_index, s.*
    FROM career_skills cs
    JOIN skills s ON cs.skill_id = s.id
    WHERE cs.career_id = ?
    ORDER BY cs.order_index ASC
  `).all(career.id);

  return res.json({ career, skills });
});

// Admin career CRUD
apiRouter.post('/careers', requireAdmin, (req: AuthRequest, res) => {
  const { title, slug, description, icon, category, marketDemand, avgSalary } = req.body;
  if (!title || !slug || !description) {
    return res.status(400).json({ error: 'Title, slug, and description are required.' });
  }
  const result = db.prepare(`
    INSERT INTO careers (title, slug, description, icon, category, market_demand, avg_salary)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(title, slug, description, icon || 'Briefcase', category || 'Engineering', marketDemand || 'High', avgSalary || 'Competitive');

  return res.status(201).json({ id: result.lastInsertRowid, message: 'Career track created.' });
});

apiRouter.put('/careers/:id', requireAdmin, (req: AuthRequest, res) => {
  const { title, description, marketDemand, avgSalary, isActive } = req.body;
  db.prepare(`
    UPDATE careers SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      market_demand = COALESCE(?, market_demand),
      avg_salary = COALESCE(?, avg_salary),
      is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(title, description, marketDemand, avgSalary, isActive, req.params.id);

  return res.json({ success: true, message: 'Career track updated.' });
});

apiRouter.delete('/careers/:id', requireAdmin, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM careers WHERE id = ?').run(req.params.id);
  return res.json({ success: true, message: 'Career track deleted.' });
});

apiRouter.get('/skills', (req, res) => {
  const skills = db.prepare('SELECT * FROM skills WHERE is_active = 1 ORDER BY category ASC, name ASC').all();
  return res.json({ skills });
});

// Admin skill CRUD
apiRouter.post('/skills', requireAdmin, (req: AuthRequest, res) => {
  const { name, slug, category, difficulty, description, careerRelevance } = req.body;
  if (!name || !slug || !category || !difficulty) {
    return res.status(400).json({ error: 'Name, slug, category, and difficulty are required.' });
  }
  const result = db.prepare(`
    INSERT INTO skills (name, slug, category, difficulty, description, career_relevance)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, slug, category, difficulty, description, careerRelevance);

  return res.status(201).json({ id: result.lastInsertRowid, message: 'Skill created.' });
});

apiRouter.put('/skills/:id', requireAdmin, (req: AuthRequest, res) => {
  const { name, category, difficulty, description, careerRelevance, isActive } = req.body;
  db.prepare(`
    UPDATE skills SET
      name = COALESCE(?, name),
      category = COALESCE(?, category),
      difficulty = COALESCE(?, difficulty),
      description = COALESCE(?, description),
      career_relevance = COALESCE(?, career_relevance),
      is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(name, category, difficulty, description, careerRelevance, isActive, req.params.id);

  return res.json({ success: true, message: 'Skill updated.' });
});

apiRouter.delete('/skills/:id', requireAdmin, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM skills WHERE id = ?').run(req.params.id);
  return res.json({ success: true, message: 'Skill deleted.' });
});

apiRouter.get('/skill-dependencies', (req, res) => {
  const deps = db.prepare(`
    SELECT sd.id, sd.skill_id, sd.depends_on_skill_id, sd.reason,
           s1.name as skill_name, s2.name as depends_on_name
    FROM skill_dependencies sd
    JOIN skills s1 ON sd.skill_id = s1.id
    JOIN skills s2 ON sd.depends_on_skill_id = s2.id
  `).all();
  return res.json({ dependencies: deps });
});

apiRouter.post('/skill-dependencies', requireAdmin, (req: AuthRequest, res) => {
  const { skillId, dependsOnSkillId, reason } = req.body;
  if (!skillId || !dependsOnSkillId) {
    return res.status(400).json({ error: 'skillId and dependsOnSkillId are required.' });
  }
  const result = db.prepare(`
    INSERT INTO skill_dependencies (skill_id, depends_on_skill_id, reason)
    VALUES (?, ?, ?)
  `).run(skillId, dependsOnSkillId, reason);

  return res.status(201).json({ id: result.lastInsertRowid, message: 'Dependency created.' });
});

apiRouter.delete('/skill-dependencies/:id', requireAdmin, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM skill_dependencies WHERE id = ?').run(req.params.id);
  return res.json({ success: true, message: 'Dependency removed.' });
});

// ==========================================
// 4. STUDENT SKILLS, GAPS, ROADMAP & NEXT BEST ACTION
// ==========================================

apiRouter.get('/student/skills', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const skills = db.prepare(`
    SELECT ss.*, s.name as skill_name, s.category, s.difficulty, s.description
    FROM student_skills ss
    JOIN skills s ON ss.skill_id = s.id
    WHERE ss.user_id = ?
    ORDER BY s.category ASC, s.name ASC
  `).all(userId);

  return res.json({ skills });
});

apiRouter.post('/student/skills', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { skillId, selfProficiency, status } = req.body;
  if (!skillId) return res.status(400).json({ error: 'skillId is required.' });

  const existing = db.prepare('SELECT assessed_proficiency FROM student_skills WHERE user_id = ? AND skill_id = ?').get(userId, skillId) as any;

  const self = Number(selfProficiency) || 0;
  let computed = self;
  if (existing?.assessed_proficiency != null) {
    // Transparent calculation: 40% self + 60% tested
    computed = Math.round(self * 0.4 + existing.assessed_proficiency * 0.6);
  }

  const computedStatus = status || (computed >= 70 ? 'completed' : (computed > 0 ? 'in_progress' : 'not_started'));

  db.prepare(`
    INSERT INTO student_skills (user_id, skill_id, self_proficiency, computed_proficiency, status)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, skill_id) DO UPDATE SET
      self_proficiency = excluded.self_proficiency,
      computed_proficiency = excluded.computed_proficiency,
      status = excluded.status,
      updated_at = CURRENT_TIMESTAMP
  `).run(userId, skillId, self, computed, computedStatus);

  const summary = recalculateStudentState(userId, 'skill_rating_updated');

  return res.json({ success: true, message: 'Skill rating saved and roadmap recalculated.', summary });
});

apiRouter.get('/student/gaps', requireAuth, (req: AuthRequest, res) => {
  const gaps = calculateSkillGaps(req.user!.id);
  return res.json({ gaps });
});

apiRouter.get('/student/roadmap', requireAuth, (req: AuthRequest, res) => {
  try {
    const phases = getUserRoadmap(req.user!.id);
    return res.json({ phases });
  } catch (err: any) {
    console.error('[Roadmap API] Error loading roadmap:', err);
    return res.status(500).json({ error: 'Failed to load user roadmap.' });
  }
});

apiRouter.post('/student/roadmap/item/:itemId/status', requireAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { status } = req.body;
    const itemId = Number(req.params.itemId);

    if (!['not_started', 'available', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const result = updateRoadmapItemStatus(userId, itemId, status);
    if (!result.success) {
      return res.status(404).json({ error: result.error || 'Roadmap item not found.' });
    }

    // Trigger Master Recalculation Engine
    const summary = recalculateStudentState(userId, `roadmap_task_${status}`);

    return res.json({
      success: true,
      message: result.message,
      summary
    });
  } catch (err: any) {
    console.error('[Roadmap API] Error updating item status:', err);
    return res.status(500).json({ error: 'Failed to update item status.' });
  }
});

apiRouter.post('/student/roadmap/recalculate', requireAuth, (req: AuthRequest, res) => {
  try {
    const phases = generateAndSaveUserRoadmap(req.user!.id, true);
    const summary = recalculateStudentState(req.user!.id, 'manual_recalculate');
    return res.json({ success: true, summary, phases });
  } catch (err: any) {
    console.error('[Roadmap API] Error recalculating roadmap:', err);
    return res.status(500).json({ error: 'Failed to recalculate user roadmap.' });
  }
});

apiRouter.get('/student/next-action', requireAuth, (req: AuthRequest, res) => {
  const nextAction = determineNextBestAction(req.user!.id);
  return res.json({ nextAction });
});

apiRouter.get('/student/readiness', requireAuth, (req: AuthRequest, res) => {
  const readiness = calculateCareerReadiness(req.user!.id);
  return res.json({ readiness });
});

// ==========================================
// 5. ASSESSMENTS
// ==========================================

apiRouter.get('/assessments', (req, res) => {
  const assessments = db.prepare(`
    SELECT a.*, s.name as skill_name, s.category, s.difficulty
    FROM assessments a
    JOIN skills s ON a.skill_id = s.id
    ORDER BY s.category ASC, a.title ASC
  `).all();
  return res.json({ assessments });
});

apiRouter.get('/assessments/:id', requireAuth, (req: AuthRequest, res) => {
  const assessment = db.prepare(`
    SELECT a.*, s.name as skill_name
    FROM assessments a
    JOIN skills s ON a.skill_id = s.id
    WHERE a.id = ?
  `).get(req.params.id) as any;

  if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });

  const rawQuestions = db.prepare(`
    SELECT id, assessment_id, question_text, question_type, options_json, explanation
    FROM assessment_questions
    WHERE assessment_id = ?
  `).all(assessment.id) as any[];

  const questions = rawQuestions.map(q => ({
    id: q.id,
    questionText: q.question_text,
    questionType: q.question_type,
    options: JSON.parse(q.options_json),
    // Hide correct_answer from client before submission
  }));

  // Check previous attempts
  const attempts = db.prepare(`
    SELECT * FROM assessment_attempts WHERE user_id = ? AND assessment_id = ? ORDER BY completed_at DESC
  `).all(req.user!.id, assessment.id);

  return res.json({ assessment, questions, attempts });
});

apiRouter.post('/assessments/:id/submit', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const assessmentId = req.params.id;
  const { answers } = req.body; // map of questionId -> chosenIndex

  const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(assessmentId) as any;
  if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });

  const questions = db.prepare('SELECT id, correct_answer, explanation FROM assessment_questions WHERE assessment_id = ?').all(assessmentId) as any[];

  let correctCount = 0;
  const results = questions.map(q => {
    const chosen = answers?.[q.id];
    const isCorrect = chosen === q.correct_answer;
    if (isCorrect) correctCount++;
    return {
      questionId: q.id,
      chosenAnswer: chosen,
      correctAnswer: q.correct_answer,
      isCorrect,
      explanation: q.explanation
    };
  });

  const totalQuestions = questions.length || 1;
  const score = Math.round((correctCount / totalQuestions) * 100);

  // Record attempt
  db.prepare(`
    INSERT INTO assessment_attempts (user_id, assessment_id, score, total_questions, correct_count, answers_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, assessmentId, score, totalQuestions, correctCount, JSON.stringify(answers));

  // Update student_skill record
  const studentSkill = db.prepare('SELECT self_proficiency FROM student_skills WHERE user_id = ? AND skill_id = ?').get(userId, assessment.skill_id) as any;
  const selfProf = studentSkill?.self_proficiency || 50;

  // Transparent formula: 40% self + 60% tested
  const computedProficiency = Math.round(selfProf * 0.4 + score * 0.6);
  const status = computedProficiency >= 70 ? 'completed' : 'in_progress';

  db.prepare(`
    INSERT INTO student_skills (user_id, skill_id, self_proficiency, assessed_proficiency, computed_proficiency, status, last_assessed_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, skill_id) DO UPDATE SET
      assessed_proficiency = excluded.assessed_proficiency,
      computed_proficiency = excluded.computed_proficiency,
      status = excluded.status,
      last_assessed_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `).run(userId, assessment.skill_id, selfProf, score, computedProficiency, status);

  // Trigger state recalculation
  const summary = recalculateStudentState(userId, 'assessment_completed');

  return res.json({
    score,
    totalQuestions,
    correctCount,
    selfProficiency: selfProf,
    testedProficiency: score,
    computedProficiency,
    passed: score >= assessment.passing_score,
    results,
    summary
  });
});

// ==========================================
// 6. LEARNING RESOURCES
// ==========================================

apiRouter.get('/resources', (req, res) => {
  const { skillId, type, platform, search } = req.query;

  let query = `
    SELECT r.*, s.name as skill_name, s.category as skill_category
    FROM resources r
    JOIN skills s ON r.skill_id = s.id
    WHERE r.is_active = 1
  `;
  const params: any[] = [];

  if (skillId) {
    query += ' AND r.skill_id = ?';
    params.push(skillId);
  }
  if (type) {
    query += ' AND r.resource_type = ?';
    params.push(type);
  }
  if (platform) {
    query += ' AND r.platform = ?';
    params.push(platform);
  }
  if (search) {
    query += ' AND (r.title LIKE ? OR r.topic LIKE ? OR s.name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY s.name ASC, r.resource_type ASC';

  const resources = db.prepare(query).all(...params);
  return res.json({ resources });
});

// Admin resource CRUD
apiRouter.post('/resources', requireAdmin, (req: AuthRequest, res) => {
  const { skillId, topic, title, resourceType, platform, url, difficulty, durationMinutes, isFree } = req.body;
  if (!skillId || !title || !url || !platform) {
    return res.status(400).json({ error: 'skillId, title, url, and platform are required.' });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'A valid URL with protocol (http:// or https://) is required.' });
  }

  const result = db.prepare(`
    INSERT INTO resources (skill_id, topic, title, resource_type, platform, url, difficulty, duration_minutes, is_free)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(skillId, topic || 'General', title, resourceType || 'Learn', platform, url, difficulty || 'Beginner', durationMinutes || 60, isFree !== false ? 1 : 0);

  return res.status(201).json({ id: result.lastInsertRowid, message: 'Resource added.' });
});

apiRouter.put('/resources/:id', requireAdmin, (req: AuthRequest, res) => {
  const { topic, title, resourceType, platform, url, difficulty, durationMinutes, isFree, isActive } = req.body;
  db.prepare(`
    UPDATE resources SET
      topic = COALESCE(?, topic),
      title = COALESCE(?, title),
      resource_type = COALESCE(?, resource_type),
      platform = COALESCE(?, platform),
      url = COALESCE(?, url),
      difficulty = COALESCE(?, difficulty),
      duration_minutes = COALESCE(?, duration_minutes),
      is_free = COALESCE(?, is_free),
      is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(topic, title, resourceType, platform, url, difficulty, durationMinutes, isFree, isActive, req.params.id);

  return res.json({ success: true, message: 'Resource updated.' });
});

apiRouter.delete('/resources/:id', requireAdmin, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM resources WHERE id = ?').run(req.params.id);
  return res.json({ success: true, message: 'Resource removed.' });
});

// ==========================================
// 6.1 YOUTUBE LEARNING INTEGRATION (REAL DATA API v3)
// ==========================================

apiRouter.get('/youtube/roadmap-topics', async (req: AuthRequest, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true' || req.query.forceRefresh === 'true';
    const response = await getStudentRoadmapTopicResources(req.user?.id, forceRefresh);
    return res.json(response);
  } catch (err: any) {
    console.error('YouTube roadmap topics route error:', err);
    return res.status(500).json({
      success: false,
      configured: true,
      topics: [],
      error: err?.message || 'Failed to fetch roadmap topic resources',
      message: 'YouTube learning resources are temporarily unavailable.'
    });
  }
});

apiRouter.get('/youtube/search', async (req: AuthRequest, res) => {
  try {
    const rawQuery = (req.query.query as string)?.trim();
    const skillName = (req.query.skillName as string)?.trim();
    const difficulty = (req.query.difficulty as string)?.trim();
    const maxResults = parseInt(req.query.maxResults as string) || 6;
    const forceRefresh = req.query.refresh === 'true' || req.query.forceRefresh === 'true';

    let targetQuery = rawQuery;
    let targetSkill = skillName;
    let contextReason = '';

    // If query was not provided, derive dynamically from current student context
    if (!targetQuery) {
      const rec = getRecommendedLearningQuery(req.user?.id);
      targetQuery = rec.query;
      targetSkill = rec.skillName;
      contextReason = rec.reason;
    } else if (difficulty && difficulty !== 'All' && !targetQuery.toLowerCase().includes(difficulty.toLowerCase())) {
      targetQuery = `${targetQuery} ${difficulty.toLowerCase()} tutorial`;
    }

    const response = await searchYouTubeLearning(targetQuery, targetSkill, maxResults, forceRefresh);
    const resultsWithRatings = attachRatingsToResources(response.results, req.user?.id);
    return res.json({
      ...response,
      results: resultsWithRatings,
      contextReason: contextReason || (targetSkill ? `Learning: ${targetSkill}` : undefined)
    });
  } catch (err: any) {
    console.error('YouTube search route error:', err);
    return res.status(500).json({
      success: false,
      configured: true,
      results: [],
      error: err?.message || 'Failed to search YouTube learning resources',
      message: 'YouTube learning resources are temporarily unavailable.'
    });
  }
});

apiRouter.get('/youtube/recommended', async (req: AuthRequest, res) => {
  try {
    const rec = getRecommendedLearningQuery(req.user?.id);
    const response = await searchYouTubeLearning(rec.query, rec.skillName, 6);
    const resultsWithRatings = attachRatingsToResources(response.results, req.user?.id);
    return res.json({
      ...response,
      results: resultsWithRatings,
      contextReason: rec.reason
    });
  } catch (err: any) {
    console.error('YouTube recommended route error:', err);
    return res.status(500).json({
      success: false,
      configured: Boolean(process.env.YOUTUBE_API_KEY?.trim()),
      results: [],
      error: err?.message || 'Failed to get recommended YouTube resources',
      message: 'YouTube learning resources are temporarily unavailable.'
    });
  }
});

apiRouter.post('/youtube/rate', requireAuth, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { resourceId, rating } = req.body;

    if (!resourceId || typeof resourceId !== 'string') {
      return res.status(400).json({ error: 'Valid resourceId is required.' });
    }

    const numRating = parseInt(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    const result = recordResourceRating(userId, resourceId, numRating);
    return res.json(result);
  } catch (err: any) {
    console.error('Error rating YouTube resource:', err);
    return res.status(500).json({ error: 'Failed to record rating.' });
  }
});

// ==========================================
// 6.2 GITHUB SKILL EVIDENCE ENGINE
// ==========================================

apiRouter.get('/github/evidence', requireAuth, async (req: AuthRequest, res) => {
  try {
    const summary = await analyzeStudentGitHubEvidence(req.user!.id, false);
    return res.json(summary);
  } catch (err: any) {
    console.error('GitHub evidence fetch error:', err);
    return res.status(500).json({
      connected: false,
      username: null,
      profileUrl: null,
      analyzedAt: new Date().toISOString(),
      totalRepos: 0,
      primaryLanguages: {},
      skillEvidence: [],
      discoveredTech: [],
      generalInsights: ['GitHub analysis is temporarily unavailable. Your profile itself remains unchanged.'],
      available: false,
      error: err?.message || 'Server error during GitHub analysis'
    });
  }
});

apiRouter.post('/github/analyze', requireAuth, async (req: AuthRequest, res) => {
  try {
    const summary = await analyzeStudentGitHubEvidence(req.user!.id, true);
    return res.json(summary);
  } catch (err: any) {
    console.error('GitHub re-analysis error:', err);
    return res.status(500).json({
      connected: false,
      username: null,
      profileUrl: null,
      analyzedAt: new Date().toISOString(),
      totalRepos: 0,
      primaryLanguages: {},
      skillEvidence: [],
      discoveredTech: [],
      generalInsights: ['GitHub analysis is temporarily unavailable. Your profile itself remains unchanged.'],
      available: false,
      error: err?.message || 'Server error during GitHub analysis'
    });
  }
});

apiRouter.post('/github/connect', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { githubUrl, username: directUser } = req.body;
    const rawVal = githubUrl || directUser;
    const username = extractGithubUsername(rawVal);

    if (!username) {
      return res.status(400).json({ error: 'Please provide a valid GitHub username or profile URL.' });
    }

    const cleanUrl = `https://github.com/${username}`;
    db.prepare('UPDATE profiles SET github_url = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(cleanUrl, req.user!.id);

    // Immediately trigger analysis
    const summary = await analyzeStudentGitHubEvidence(req.user!.id, true);
    return res.json({
      success: true,
      githubUrl: cleanUrl,
      username,
      summary
    });
  } catch (err: any) {
    console.error('GitHub connect error:', err);
    return res.status(500).json({ error: 'Failed to connect GitHub account.' });
  }
});

// ==========================================
// 7. PROJECTS
// ==========================================

apiRouter.get('/projects', (req, res) => {
  const projects = db.prepare(`
    SELECT p.*, c.title as career_title
    FROM projects p
    LEFT JOIN careers c ON p.career_id = c.id
    WHERE p.is_active = 1
    ORDER BY p.difficulty ASC, p.id ASC
  `).all() as any[];

  for (const p of projects) {
    p.technologies = p.technologies_json ? JSON.parse(p.technologies_json) : [];
    p.checklist = p.checklist_json ? JSON.parse(p.checklist_json) : [];
  }

  return res.json({ projects });
});

apiRouter.get('/student/projects', requireAuth, (req: AuthRequest, res) => {
  const studentProjects = db.prepare(`
    SELECT sp.*, p.title as project_title, p.difficulty, p.description, p.why_this_project,
           p.learning_outcomes, p.technologies_json, p.checklist_json
    FROM student_projects sp
    JOIN projects p ON sp.project_id = p.id
    WHERE sp.user_id = ?
    ORDER BY sp.created_at DESC
  `).all(req.user!.id) as any[];

  for (const sp of studentProjects) {
    sp.technologies = sp.technologies_json ? JSON.parse(sp.technologies_json) : [];
    sp.checklist = sp.checklist_json ? JSON.parse(sp.checklist_json) : [];
    sp.completedChecklist = sp.completed_checklist_json ? JSON.parse(sp.completed_checklist_json) : [];
  }

  return res.json({ projects: studentProjects });
});

apiRouter.post('/student/projects', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { projectId, status, githubRepoUrl, liveDemoUrl, completedChecklist, notes } = req.body;

  if (!projectId) return res.status(400).json({ error: 'projectId is required.' });

  const completedAt = status === 'completed' ? new Date().toISOString() : null;

  db.prepare(`
    INSERT INTO student_projects (user_id, project_id, status, github_repo_url, live_demo_url, completed_checklist_json, notes, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      github_repo_url = excluded.github_repo_url,
      live_demo_url = excluded.live_demo_url,
      completed_checklist_json = excluded.completed_checklist_json,
      notes = excluded.notes,
      completed_at = excluded.completed_at
  `).run(
    userId,
    projectId,
    status || 'in_progress',
    githubRepoUrl || null,
    liveDemoUrl || null,
    completedChecklist ? JSON.stringify(completedChecklist) : null,
    notes || null,
    completedAt
  );

  const summary = recalculateStudentState(userId, 'project_milestone_updated');

  return res.json({ success: true, message: 'Project status saved.', summary });
});

// Admin project CRUD
apiRouter.post('/projects', requireAdmin, (req: AuthRequest, res) => {
  const { careerId, title, slug, difficulty, description, whyThisProject, learningOutcomes, technologies, checklist } = req.body;
  if (!title || !slug || !description) {
    return res.status(400).json({ error: 'Title, slug, and description are required.' });
  }
  const result = db.prepare(`
    INSERT INTO projects (career_id, title, slug, difficulty, description, why_this_project, learning_outcomes, technologies_json, checklist_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    careerId || null,
    title,
    slug,
    difficulty || 'Beginner',
    description,
    whyThisProject || 'Applied engineering experience.',
    learningOutcomes || 'Practical skill application.',
    JSON.stringify(technologies || []),
    JSON.stringify(checklist || [])
  );

  return res.status(201).json({ id: result.lastInsertRowid, message: 'Project created.' });
});

// ==========================================
// 8. OPPORTUNITIES & APPLICATIONS
// ==========================================

apiRouter.get('/opportunities', (req: AuthRequest, res) => {
  const opportunities = db.prepare('SELECT * FROM opportunities WHERE is_active = 1 ORDER BY deadline ASC').all() as any[];

  // If user is logged in, calculate personalized match %
  let studentSkills: { name: string; proficiency: number }[] = [];
  let userApplications: Map<number, string> = new Map();

  if (req.user) {
    const sRows = db.prepare(`
      SELECT s.name, ss.computed_proficiency
      FROM student_skills ss
      JOIN skills s ON ss.skill_id = s.id
      WHERE ss.user_id = ?
    `).all(req.user.id) as any[];
    studentSkills = sRows.map(r => ({ name: r.name.toLowerCase(), proficiency: r.computed_proficiency }));

    const appRows = db.prepare('SELECT opportunity_id, status FROM applications WHERE user_id = ?').all(req.user.id) as any[];
    userApplications = new Map(appRows.map(a => [a.opportunity_id, a.status]));
  }

  const items = opportunities.map(o => {
    const reqSkills: string[] = o.required_skills_json ? JSON.parse(o.required_skills_json) : [];
    let matchScore = 0;
    const missingSkills: string[] = [];

    if (reqSkills.length > 0 && studentSkills.length > 0) {
      let matchedCount = 0;
      for (const rs of reqSkills) {
        const found = studentSkills.find(ss => ss.name.includes(rs.toLowerCase()) || rs.toLowerCase().includes(ss.name));
        if (found && found.proficiency >= 50) {
          matchedCount++;
        } else {
          missingSkills.push(rs);
        }
      }
      matchScore = Math.round((matchedCount / reqSkills.length) * 100);
    } else {
      matchScore = 50; // neutral default
    }

    return {
      ...o,
      requiredSkills: reqSkills,
      matchScore,
      missingSkills,
      applicationStatus: userApplications.get(o.id) || null
    };
  });

  // Sort by match score descending
  items.sort((a, b) => b.matchScore - a.matchScore);

  return res.json({ opportunities: items });
});

// Applications tracking
apiRouter.get('/applications', requireAuth, (req: AuthRequest, res) => {
  const applications = db.prepare(`
    SELECT a.*, o.company, o.role, o.location, o.work_mode, o.deadline, o.application_url
    FROM applications a
    JOIN opportunities o ON a.opportunity_id = o.id
    WHERE a.user_id = ?
    ORDER BY a.updated_at DESC
  `).all(req.user!.id);

  return res.json({ applications });
});

apiRouter.post('/applications', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { opportunityId, status = 'saved', appliedDate, interviewDate, notes } = req.body;
  if (!opportunityId) return res.status(400).json({ error: 'opportunityId is required.' });

  db.prepare(`
    INSERT INTO applications (user_id, opportunity_id, status, applied_date, interview_date, notes)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, opportunity_id) DO UPDATE SET
      status = excluded.status,
      applied_date = COALESCE(excluded.applied_date, applications.applied_date),
      interview_date = COALESCE(excluded.interview_date, applications.interview_date),
      notes = COALESCE(excluded.notes, applications.notes),
      updated_at = CURRENT_TIMESTAMP
  `).run(userId, opportunityId, status, appliedDate || (status === 'applied' ? new Date().toISOString().split('T')[0] : null), interviewDate || null, notes || null);

  const summary = recalculateStudentState(userId, 'application_status_updated');

  return res.json({ success: true, message: 'Application recorded.', summary });
});

apiRouter.put('/applications/:id', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { status, appliedDate, interviewDate, notes } = req.body;

  db.prepare(`
    UPDATE applications SET
      status = COALESCE(?, status),
      applied_date = COALESCE(?, applied_date),
      interview_date = COALESCE(?, interview_date),
      notes = COALESCE(?, notes),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(status, appliedDate, interviewDate, notes, req.params.id, userId);

  const summary = recalculateStudentState(userId, 'application_updated');

  return res.json({ success: true, message: 'Application updated.', summary });
});

apiRouter.delete('/applications/:id', requireAuth, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM applications WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  return res.json({ success: true, message: 'Application removed from tracker.' });
});

// Admin Opportunity CRUD
apiRouter.post('/opportunities', requireAdmin, (req: AuthRequest, res) => {
  const { company, role, description, requiredSkills, degreeEligibility, yearEligibility, location, workMode, deadline, source, applicationUrl } = req.body;
  if (!company || !role || !applicationUrl) {
    return res.status(400).json({ error: 'Company, role, and applicationUrl are required.' });
  }

  const result = db.prepare(`
    INSERT INTO opportunities (company, role, description, required_skills_json, degree_eligibility, year_eligibility, location, work_mode, deadline, source, application_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    company, role, description || '', JSON.stringify(requiredSkills || []),
    degreeEligibility || 'B.Tech/BE/BCA', yearEligibility || 'Open',
    location || 'Remote', workMode || 'Remote',
    deadline || '2026-12-31', source || 'Official Portal', applicationUrl
  );

  return res.status(201).json({ id: result.lastInsertRowid, message: 'Opportunity added.' });
});

apiRouter.delete('/opportunities/:id', requireAdmin, (req: AuthRequest, res) => {
  db.prepare('DELETE FROM opportunities WHERE id = ?').run(req.params.id);
  return res.json({ success: true, message: 'Opportunity removed.' });
});

// ==========================================
// 9. DSA PROGRESS
// ==========================================

apiRouter.get('/dsa', requireAuth, (req: AuthRequest, res) => {
  const topics = db.prepare('SELECT * FROM dsa_topics WHERE user_id = ? ORDER BY order_index ASC').all(req.user!.id);
  return res.json({ topics });
});

apiRouter.put('/dsa/:id', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { problemsSolved, status } = req.body;

  db.prepare(`
    UPDATE dsa_topics SET
      problems_solved = COALESCE(?, problems_solved),
      status = COALESCE(?, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(problemsSolved, status, req.params.id, userId);

  const summary = recalculateStudentState(userId, 'dsa_progress_updated');

  return res.json({ success: true, message: 'DSA topic progress updated.', summary });
});

// ==========================================
// 10. NOTIFICATIONS
// ==========================================

apiRouter.get('/notifications', requireAuth, (req: AuthRequest, res) => {
  const notifications = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30
  `).all(req.user!.id);

  const unreadCount = db.prepare(`
    SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0
  `).get(req.user!.id) as { count: number };

  return res.json({ notifications, unreadCount: unreadCount.count });
});

apiRouter.put('/notifications/:id/read', requireAuth, (req: AuthRequest, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  return res.json({ success: true });
});

apiRouter.put('/notifications/read-all', requireAuth, (req: AuthRequest, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user!.id);
  return res.json({ success: true });
});

// ==========================================
// 11. AI FEATURES (PROFILE ANALYSIS & CAREER MENTOR)
// ==========================================

apiRouter.post('/ai/analyze-profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const analysis = await analyzeProfileWithAI(req.user!.id);
    return res.json({ analysis });
  } catch (err: any) {
    console.error('AI Profile Analysis Error:', err);
    return res.status(500).json({ error: 'Failed to analyze profile.' });
  }
});

apiRouter.get(['/ai/mentor/context', '/mentor/context'], requireAuth, (req: AuthRequest, res) => {
  console.log(`[Mentor API] Context requested for student ID ${req.user!.id}`);
  try {
    const context = buildMentorStudentContext(req.user!.id);
    return res.json({ success: true, context });
  } catch (err: any) {
    console.error('[Mentor API] Error fetching mentor context:', err?.message || err);
    return res.status(500).json({ error: 'Failed to fetch mentor context.' });
  }
});

apiRouter.post(['/ai/mentor/stream', '/mentor/stream'], requireAuth, async (req: AuthRequest, res) => {
  console.log(`[Mentor API] Streaming request received for student ID ${req.user!.id}`);
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Valid message string is required.' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    await streamCareerMentorAI(
      req.user!.id,
      message,
      history || [],
      (chunk: string) => {
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }
    );

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('[Mentor API] Streaming Mentor Error:', err?.message || err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Streaming error occurred.' });
    }
    res.write(`data: ${JSON.stringify({ error: 'Stream error occurred.' })}\n\n`);
    res.end();
  }
});

apiRouter.post(['/ai/mentor', '/mentor/chat', '/mentor'], requireAuth, async (req: AuthRequest, res) => {
  console.log(`[Mentor API] Chat request received for student ID ${req.user!.id}`);
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Valid message string is required.' });
    }

    const reply = await askCareerMentorAI(req.user!.id, message, history || []);
    return res.json({ reply, text: reply, success: true });
  } catch (err: any) {
    console.error('[Mentor API] AI Mentor Error:', err?.message || err);
    return res.status(500).json({ error: 'Failed to query career mentor.' });
  }
});

// ==========================================
// 12. PRIVACY & DATA TRANSPARENCY
// ==========================================

apiRouter.get('/privacy/export', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
  const skills = db.prepare('SELECT * FROM student_skills WHERE user_id = ?').all(userId);
  const attempts = db.prepare('SELECT * FROM assessment_attempts WHERE user_id = ?').all(userId);
  const projects = db.prepare('SELECT * FROM student_projects WHERE user_id = ?').all(userId);
  const applications = db.prepare('SELECT * FROM applications WHERE user_id = ?').all(userId);
  const dsa = db.prepare('SELECT * FROM dsa_topics WHERE user_id = ?').all(userId);

  return res.json({
    user: { id: req.user!.id, email: req.user!.email, role: req.user!.role },
    profile,
    skills,
    assessmentAttempts: attempts,
    projects,
    applications,
    dsaProgress: dsa,
    exportedAt: new Date().toISOString()
  });
});

apiRouter.post('/privacy/disconnect-github', requireAuth, (req: AuthRequest, res) => {
  db.prepare('UPDATE profiles SET github_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(req.user!.id);
  return res.json({ success: true, message: 'GitHub connection disconnected.' });
});

apiRouter.post('/privacy/disconnect-linkedin', requireAuth, (req: AuthRequest, res) => {
  db.prepare('UPDATE profiles SET linkedin_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(req.user!.id);
  return res.json({ success: true, message: 'LinkedIn connection disconnected.' });
});

apiRouter.post('/privacy/delete-account', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  if (req.user!.role === 'admin') {
    return res.status(400).json({ error: 'Admin account cannot be deleted via student portal.' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  res.clearCookie('skillpath_session');
  return res.json({ success: true, message: 'Account and all associated records permanently deleted.' });
});

// ==========================================
// 13. ADMIN PANEL API
// ==========================================

apiRouter.get('/admin/overview', requireAdmin, (req: AuthRequest, res) => {
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get() as { count: number };
  const totalCareers = db.prepare('SELECT COUNT(*) as count FROM careers').get() as { count: number };
  const totalSkills = db.prepare('SELECT COUNT(*) as count FROM skills').get() as { count: number };
  const totalProjects = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  const totalOpportunities = db.prepare('SELECT COUNT(*) as count FROM opportunities').get() as { count: number };
  const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get() as { count: number };
  const completedProjects = db.prepare("SELECT COUNT(*) as count FROM student_projects WHERE status = 'completed'").get() as { count: number };
  const totalInquiries = db.prepare('SELECT COUNT(*) as count FROM contact_inquiries').get() as { count: number };
  const newInquiries = db.prepare("SELECT COUNT(*) as count FROM contact_inquiries WHERE status = 'New'").get() as { count: number };

  const recentUsers = db.prepare(`
    SELECT u.id, u.email, u.created_at, p.full_name, c.title as career_goal
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    LEFT JOIN careers c ON p.career_goal_id = c.id
    WHERE u.role = 'student'
    ORDER BY u.created_at DESC
    LIMIT 10
  `).all();

  return res.json({
    metrics: {
      totalUsers: totalUsers.count,
      totalCareers: totalCareers.count,
      totalSkills: totalSkills.count,
      totalProjects: totalProjects.count,
      totalOpportunities: totalOpportunities.count,
      totalApplications: totalApplications.count,
      completedProjects: completedProjects.count,
      totalInquiries: totalInquiries.count,
      newInquiries: newInquiries.count,
    },
    recentUsers
  });
});

apiRouter.get('/admin/users', requireAdmin, (req: AuthRequest, res) => {
  const users = db.prepare(`
    SELECT u.id, u.email, u.role, u.created_at,
           p.full_name, p.college, p.degree, p.branch, p.cgpa, p.onboarding_completed,
           c.title as career_title,
           (SELECT COUNT(*) FROM student_skills ss WHERE ss.user_id = u.id AND ss.status = 'completed') as completed_skills_count,
           (SELECT COUNT(*) FROM student_projects sp WHERE sp.user_id = u.id AND sp.status = 'completed') as completed_projects_count,
           (SELECT COUNT(*) FROM applications a WHERE a.user_id = u.id) as applications_count
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    LEFT JOIN careers c ON p.career_goal_id = c.id
    ORDER BY u.created_at DESC
  `).all();

  return res.json({ users });
});

apiRouter.get('/admin/analytics', requireAdmin, (req: AuthRequest, res) => {
  // Real distributions from DB
  const careerDist = db.prepare(`
    SELECT c.title, COUNT(p.id) as student_count
    FROM careers c
    LEFT JOIN profiles p ON c.id = p.career_goal_id
    GROUP BY c.id
    ORDER BY student_count DESC
  `).all();

  const topSkills = db.prepare(`
    SELECT s.name, COUNT(ss.id) as enrolled_count,
           AVG(ss.computed_proficiency) as avg_proficiency
    FROM skills s
    LEFT JOIN student_skills ss ON s.id = ss.skill_id
    GROUP BY s.id
    ORDER BY enrolled_count DESC
    LIMIT 10
  `).all();

  const applicationStats = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM applications
    GROUP BY status
  `).all();

  return res.json({
    careerDistribution: careerDist,
    topSkills,
    applicationStats
  });
});

apiRouter.get('/admin/reports', requireAdmin, (req: AuthRequest, res) => {
  const auditLogs = db.prepare(`
    SELECT al.*, u.email as admin_email
    FROM admin_audit_logs al
    JOIN users u ON al.admin_user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT 50
  `).all();

  return res.json({ auditLogs });
});

// =========================================================================
// Contact Inquiries (Public Submission & Admin Management)
// =========================================================================

apiRouter.post('/contact', (req: AuthRequest, res) => {
  try {
    const { fullName, email, topic, message } = req.body;

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Please provide a valid full name (minimum 2 characters).' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
      return res.status(400).json({ error: 'Please select an inquiry topic.' });
    }

    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return res.status(400).json({ error: 'Please provide an inquiry message of at least 5 characters.' });
    }

    // Input sanitization: Trim, cap length, strip script tags and HTML injection
    const sanitizeText = (str: string, maxLen: number) => {
      return str
        .trim()
        .slice(0, maxLen)
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>?/gm, '')
        .trim();
    };

    const cleanName = sanitizeText(fullName, 100);
    const cleanEmail = email.trim().toLowerCase().slice(0, 150);
    const cleanTopic = sanitizeText(topic, 100);
    const cleanMessage = sanitizeText(message, 5000);

    // Prevent accidental duplicate submissions within 15 seconds
    const recentDuplicate = db.prepare(`
      SELECT id FROM contact_inquiries
      WHERE email = ? AND message = ? AND submitted_at >= datetime('now', '-15 seconds')
    `).get(cleanEmail, cleanMessage);

    if (recentDuplicate) {
      return res.status(429).json({ error: 'A duplicate message was recently received. Please wait a moment.' });
    }

    // Capture authenticated user context if sender is logged in
    const userId = req.user?.id || null;
    const firebaseUid = req.user?.firebaseUid || null;

    // Generate unique inquiry identifier
    const inquiryId = `INQ-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    db.prepare(`
      INSERT INTO contact_inquiries (
        inquiry_id, full_name, email, topic, message, status, priority, user_id, firebase_uid, submitted_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'New', 'Normal', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(inquiryId, cleanName, cleanEmail, cleanTopic, cleanMessage, userId, firebaseUid);

    return res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. Our team will get back to you soon.',
      inquiryId
    });
  } catch (err: any) {
    console.error('Contact submission error:', err);
    return res.status(500).json({ error: 'Internal server error while submitting contact inquiry.' });
  }
});

apiRouter.get('/admin/inquiries', requireAdmin, (req: AuthRequest, res) => {
  try {
    const { search, status, topic, priority, sort = 'newest' } = req.query as {
      search?: string;
      status?: string;
      topic?: string;
      priority?: string;
      sort?: string;
    };

    let query = `
      SELECT ci.*, u.email as user_account_email
      FROM contact_inquiries ci
      LEFT JOIN users u ON ci.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ` AND (ci.full_name LIKE ? OR ci.email LIKE ? OR ci.inquiry_id LIKE ? OR ci.message LIKE ?)`;
      params.push(term, term, term, term);
    }

    if (status && status !== 'all') {
      query += ` AND ci.status = ?`;
      params.push(status);
    }

    if (topic && topic !== 'all') {
      query += ` AND ci.topic = ?`;
      params.push(topic);
    }

    if (priority && priority !== 'all') {
      query += ` AND ci.priority = ?`;
      params.push(priority);
    }

    if (sort === 'oldest') {
      query += ` ORDER BY ci.submitted_at ASC`;
    } else {
      query += ` ORDER BY ci.submitted_at DESC`;
    }

    const inquiries = db.prepare(query).all(...params);

    const totalCount = (db.prepare('SELECT COUNT(*) as count FROM contact_inquiries').get() as any)?.count || 0;
    const newCount = (db.prepare("SELECT COUNT(*) as count FROM contact_inquiries WHERE status = 'New'").get() as any)?.count || 0;
    const inProgressCount = (db.prepare("SELECT COUNT(*) as count FROM contact_inquiries WHERE status = 'In Progress'").get() as any)?.count || 0;
    const resolvedCount = (db.prepare("SELECT COUNT(*) as count FROM contact_inquiries WHERE status = 'Resolved'").get() as any)?.count || 0;

    return res.json({
      inquiries,
      metrics: {
        total: totalCount,
        new: newCount,
        inProgress: inProgressCount,
        resolved: resolvedCount
      }
    });
  } catch (err: any) {
    console.error('Error fetching admin inquiries:', err);
    return res.status(500).json({ error: 'Failed to retrieve inquiries.' });
  }
});

apiRouter.patch('/admin/inquiries/:id', requireAdmin, (req: AuthRequest, res) => {
  try {
    const id = req.params.id;
    const { status, priority } = req.body;

    const existing = db.prepare('SELECT id FROM contact_inquiries WHERE id = ? OR inquiry_id = ?').get(id, id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Inquiry not found.' });
    }

    const allowedStatuses = ['New', 'In Progress', 'Resolved'];
    const allowedPriorities = ['Low', 'Normal', 'High', 'Urgent'];

    const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const params: any[] = [];

    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status.' });
      }
      updates.push('status = ?');
      params.push(status);
    }

    if (priority) {
      if (!allowedPriorities.includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority.' });
      }
      updates.push('priority = ?');
      params.push(priority);
    }

    params.push(existing.id);
    db.prepare(`UPDATE contact_inquiries SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updated = db.prepare('SELECT * FROM contact_inquiries WHERE id = ?').get(existing.id);
    return res.json({ success: true, inquiry: updated });
  } catch (err: any) {
    console.error('Error updating inquiry:', err);
    return res.status(500).json({ error: 'Failed to update inquiry.' });
  }
});

apiRouter.delete('/admin/inquiries/:id', requireAdmin, (req: AuthRequest, res) => {
  try {
    const id = req.params.id;
    const existing = db.prepare('SELECT id FROM contact_inquiries WHERE id = ? OR inquiry_id = ?').get(id, id) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Inquiry not found.' });
    }

    db.prepare('DELETE FROM contact_inquiries WHERE id = ?').run(existing.id);
    return res.json({ success: true, message: 'Inquiry deleted successfully.' });
  } catch (err: any) {
    console.error('Error deleting inquiry:', err);
    return res.status(500).json({ error: 'Failed to delete inquiry.' });
  }
});

