import { db } from '../db.js';
import { calculateSkillGaps } from './skillGapEngine.js';

export interface RoadmapPhase {
  phaseNumber: number;
  phaseTitle: string;
  items: RoadmapItemView[];
  completedCount: number;
  totalCount: number;
  isUnlocked: boolean;
}

export interface RoadmapItemView {
  id: number;
  skillId: number;
  skillName: string;
  phaseNumber: number;
  phaseTitle: string;
  title: string;
  description: string;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  estimatedHours: number;
  orderIndex: number;
  completedAt: string | null;
  prerequisitesMet: boolean;
  missingPrerequisites: string[];
  resourcesCount: number;
  hasAssessment: boolean;
}

/**
 * Retrieve the authenticated user's existing saved roadmap.
 * If no roadmap exists or if existing roadmap has 0 items, generates and saves a new one.
 * Never overwrites an existing user's progress on simple page loads.
 */
export function getUserRoadmap(userId: number): RoadmapPhase[] {
  // 1. Check if user already has a roadmap record
  const existingRoadmap = db.prepare('SELECT id, career_id, title FROM roadmaps WHERE user_id = ?').get(userId) as {
    id: number;
    career_id: number;
    title: string;
  } | undefined;

  if (existingRoadmap) {
    const itemCount = db.prepare('SELECT COUNT(*) as cnt FROM roadmap_items WHERE roadmap_id = ?').get(existingRoadmap.id) as { cnt: number };
    if (itemCount.cnt > 0) {
      return loadPhasesFromDatabase(existingRoadmap.id);
    }
  }

  // 2. No roadmap or 0 items: Generate, persist, and return
  return generateAndSaveUserRoadmap(userId, false);
}

/**
 * Main compatibility function used across routes and engine handlers.
 */
export function generateOrUpdateRoadmap(userId: number, careerId?: number): RoadmapPhase[] {
  if (careerId) {
    // If explicit career requested and differs from saved, regenerate for new career
    const current = db.prepare('SELECT career_id FROM roadmaps WHERE user_id = ?').get(userId) as { career_id: number } | undefined;
    if (current && current.career_id === careerId) {
      return getUserRoadmap(userId);
    }
    return generateAndSaveUserRoadmap(userId, true, careerId);
  }
  return getUserRoadmap(userId);
}

/**
 * Generate a personalized roadmap tailored to the student's profile, career goal, academic context,
 * and current skills. Saves directly into `roadmaps` and `roadmap_items` scoped to `user_id`.
 */
export function generateAndSaveUserRoadmap(userId: number, forceRecalculate: boolean = false, overrideCareerId?: number): RoadmapPhase[] {
  // 1. Resolve Profile & Career
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId) as any;
  
  let targetCareerId = overrideCareerId || profile?.career_goal_id;
  if (!targetCareerId) {
    const firstCareer = db.prepare('SELECT id FROM careers LIMIT 1').get() as { id: number } | undefined;
    targetCareerId = firstCareer?.id || 1;
    // Persist default career goal if not yet set
    try {
      db.prepare('UPDATE profiles SET career_goal_id = ? WHERE user_id = ?').run(targetCareerId, userId);
    } catch {}
  }

  const career = db.prepare('SELECT id, title, slug FROM careers WHERE id = ?').get(targetCareerId) as { id: number; title: string; slug: string } | undefined;
  const careerTitle = career?.title || 'Full Stack Developer';
  const validCareerId = career?.id || 1;

  // 2. Fetch career skills
  let careerSkills = db.prepare(`
    SELECT cs.skill_id, cs.required_level, cs.order_index,
           s.name as skill_name, s.category, s.difficulty, s.description
    FROM career_skills cs
    JOIN skills s ON cs.skill_id = s.id
    WHERE cs.career_id = ?
    ORDER BY cs.order_index ASC
  `).all(validCareerId) as {
    skill_id: number;
    required_level: number;
    order_index: number;
    skill_name: string;
    category: string;
    difficulty: string;
    description: string;
  }[];

  // If this career has no skills attached (e.g., custom or unmapped career), pull foundational standard skills
  if (careerSkills.length === 0) {
    careerSkills = db.prepare(`
      SELECT s.id as skill_id, 80 as required_level, s.id as order_index,
             s.name as skill_name, s.category, s.difficulty, s.description
      FROM skills s
      ORDER BY s.id ASC
      LIMIT 10
    `).all() as any[];
  }

  // 3. Fetch student current skills and completed items (to preserve on recalculate)
  const studentSkills = db.prepare(`
    SELECT skill_id, self_proficiency, computed_proficiency, status
    FROM student_skills
    WHERE user_id = ?
  `).all(userId) as {
    skill_id: number;
    self_proficiency: number;
    computed_proficiency: number;
    status: string;
  }[];
  const skillProficiencyMap = new Map(studentSkills.map(s => [s.skill_id, s]));

  // Existing completed items to preserve if force recalculating
  const existingCompletedSkills = new Set<number>();
  if (forceRecalculate) {
    const prevRoadmap = db.prepare('SELECT id FROM roadmaps WHERE user_id = ?').get(userId) as { id: number } | undefined;
    if (prevRoadmap) {
      const prevItems = db.prepare("SELECT skill_id FROM roadmap_items WHERE roadmap_id = ? AND status = 'completed'").all(prevRoadmap.id) as { skill_id: number }[];
      for (const pi of prevItems) {
        existingCompletedSkills.add(pi.skill_id);
      }
    }
  }

  // 4. Calculate Phase Assignment Dynamically
  // Break into 4 or 5 cohesive engineering phases
  const totalSkills = careerSkills.length;
  const numPhases = totalSkills >= 10 ? 5 : Math.max(3, Math.min(4, totalSkills));
  const itemsPerPhase = Math.ceil(totalSkills / numPhases);

  const phaseTitles = getPhaseTitlesForCareer(careerTitle, numPhases);

  // Group items
  const itemsToInsert: {
    phaseNumber: number;
    phaseTitle: string;
    skillId: number;
    title: string;
    description: string;
    status: 'locked' | 'available' | 'in_progress' | 'completed';
    estimatedHours: number;
    orderIndex: number;
    completedAt: string | null;
  }[] = [];

  for (let idx = 0; idx < careerSkills.length; idx++) {
    const cs = careerSkills[idx];
    const phaseIndex = Math.min(numPhases - 1, Math.floor(idx / itemsPerPhase));
    const phaseNumber = phaseIndex + 1;
    const phaseTitle = phaseTitles[phaseIndex] || `Phase ${phaseNumber}: Milestone Track`;

    // Estimate hours based on difficulty & learning pace
    let estHours = 18;
    if (cs.difficulty === 'Beginner') estHours = 12;
    else if (cs.difficulty === 'Intermediate') estHours = 22;
    else if (cs.difficulty === 'Advanced') estHours = 32;

    if (profile?.learning_pace === 'intensive') estHours = Math.round(estHours * 0.85);
    else if (profile?.learning_pace === 'steady') estHours = Math.round(estHours * 1.2);

    // Initial Status Determination
    const existingSkill = skillProficiencyMap.get(cs.skill_id);
    let initialStatus: 'locked' | 'available' | 'in_progress' | 'completed' = 'available';
    let completedAt: string | null = null;

    if (existingCompletedSkills.has(cs.skill_id) || existingSkill?.status === 'completed' || (existingSkill?.computed_proficiency || 0) >= 70) {
      initialStatus = 'completed';
      completedAt = new Date().toISOString();
    } else if (existingSkill && (existingSkill.computed_proficiency > 0 || existingSkill.self_proficiency > 0)) {
      initialStatus = 'in_progress';
    } else if (phaseNumber === 1 || idx === 0) {
      initialStatus = 'available';
    } else if (phaseNumber === 2 && idx < 4) {
      initialStatus = 'available';
    } else {
      initialStatus = 'locked';
    }

    itemsToInsert.push({
      phaseNumber,
      phaseTitle,
      skillId: cs.skill_id,
      title: cs.skill_name,
      description: cs.description || `Master core principles and industry applications of ${cs.skill_name}.`,
      status: initialStatus,
      estimatedHours: estHours,
      orderIndex: idx + 1,
      completedAt
    });
  }

  // 5. Persist to Database with user isolation
  const upsertRoadmap = db.prepare(`
    INSERT INTO roadmaps (user_id, career_id, title, recalculated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      career_id = excluded.career_id,
      title = excluded.title,
      recalculated_at = CURRENT_TIMESTAMP
  `);
  upsertRoadmap.run(userId, validCareerId, `${careerTitle} Mastery Roadmap`);

  const userRoadmap = db.prepare('SELECT id FROM roadmaps WHERE user_id = ?').get(userId) as { id: number };

  // Delete previous items for this roadmap to ensure clean state
  db.prepare('DELETE FROM roadmap_items WHERE roadmap_id = ?').run(userRoadmap.id);

  const insertItem = db.prepare(`
    INSERT INTO roadmap_items (roadmap_id, phase_number, phase_title, skill_id, title, description, status, estimated_hours, order_index, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const it of itemsToInsert) {
    insertItem.run(
      userRoadmap.id,
      it.phaseNumber,
      it.phaseTitle,
      it.skillId,
      it.title,
      it.description,
      it.status,
      it.estimatedHours,
      it.orderIndex,
      it.completedAt
    );
  }

  // 6. Return grouped phases
  return loadPhasesFromDatabase(userRoadmap.id);
}

/**
 * Update the status of a specific roadmap item belonging to the authenticated user.
 * Ensures strict cross-user isolation: User A can only update items belonging to their roadmap.
 */
export function updateRoadmapItemStatus(userId: number, itemId: number, status: string): { success: boolean; message?: string; error?: string } {
  const item = db.prepare(`
    SELECT ri.*, s.name as skill_name, r.id as roadmap_id
    FROM roadmap_items ri
    JOIN roadmaps r ON ri.roadmap_id = r.id
    JOIN skills s ON ri.skill_id = s.id
    WHERE ri.id = ? AND r.user_id = ?
  `).get(itemId, userId) as any;

  if (!item) {
    return { success: false, error: 'Roadmap item not found or unauthorized.' };
  }

  const completedAt = status === 'completed' ? (item.completed_at || new Date().toISOString()) : null;

  db.prepare('UPDATE roadmap_items SET status = ?, completed_at = ? WHERE id = ?').run(status, completedAt, item.id);

  // If milestone is completed, sync to student_skills
  if (status === 'completed') {
    db.prepare(`
      INSERT INTO student_skills (user_id, skill_id, self_proficiency, computed_proficiency, status)
      VALUES (?, ?, 85, 85, 'completed')
      ON CONFLICT(user_id, skill_id) DO UPDATE SET
        computed_proficiency = CASE WHEN computed_proficiency < 80 THEN 85 ELSE computed_proficiency END,
        status = 'completed',
        updated_at = CURRENT_TIMESTAMP
    `).run(userId, item.skill_id);

    // Automatically unlock next items in subsequent phase if threshold met
    unlockSubsequentItemsIfReady(item.roadmap_id, item.phase_number);
  }

  db.prepare('UPDATE roadmaps SET recalculated_at = CURRENT_TIMESTAMP WHERE id = ?').run(item.roadmap_id);

  return {
    success: true,
    message: status === 'completed' ? `Milestone Completed: ${item.skill_name}!` : 'Roadmap item status updated.'
  };
}

/**
 * Internal helper to read items from database and format into RoadmapPhase structures.
 */
function loadPhasesFromDatabase(roadmapId: number): RoadmapPhase[] {
  const rawItems = db.prepare(`
    SELECT ri.id, ri.roadmap_id, ri.phase_number, ri.phase_title, ri.skill_id, ri.title,
           ri.description, ri.status, ri.estimated_hours, ri.order_index, ri.completed_at,
           s.name as skill_name,
           (SELECT COUNT(*) FROM resources r WHERE r.skill_id = ri.skill_id AND r.is_active = 1) as resource_count,
           (SELECT COUNT(*) FROM assessments a WHERE a.skill_id = ri.skill_id) as assessment_count
    FROM roadmap_items ri
    JOIN skills s ON ri.skill_id = s.id
    WHERE ri.roadmap_id = ?
    ORDER BY ri.phase_number ASC, ri.order_index ASC
  `).all(roadmapId) as any[];

  if (rawItems.length === 0) {
    return [];
  }

  const phaseMap = new Map<number, RoadmapItemView[]>();
  for (const it of rawItems) {
    if (!phaseMap.has(it.phase_number)) {
      phaseMap.set(it.phase_number, []);
    }
    phaseMap.get(it.phase_number)!.push({
      id: it.id,
      skillId: it.skill_id,
      skillName: it.skill_name,
      phaseNumber: it.phase_number,
      phaseTitle: it.phase_title,
      title: it.title,
      description: it.description,
      status: it.status,
      estimatedHours: it.estimated_hours,
      orderIndex: it.order_index,
      completedAt: it.completed_at,
      prerequisitesMet: it.status !== 'locked',
      missingPrerequisites: [],
      resourcesCount: it.resource_count,
      hasAssessment: it.assessment_count > 0
    });
  }

  const phases: RoadmapPhase[] = [];
  const sortedPhaseKeys = Array.from(phaseMap.keys()).sort((a, b) => a - b);

  let prevPhaseComplete = true;

  for (const pNum of sortedPhaseKeys) {
    const pItems = phaseMap.get(pNum)!;
    const completed = pItems.filter(i => i.status === 'completed').length;
    const total = pItems.length;

    // Phase 1 is always unlocked. Next phases unlock if preceding phase is >= 60% complete or has unlocked items
    const isUnlocked = pNum === 1 || prevPhaseComplete || pItems.some(i => i.status !== 'locked');

    phases.push({
      phaseNumber: pNum,
      phaseTitle: pItems[0]?.phaseTitle || `Phase ${pNum}`,
      items: pItems,
      completedCount: completed,
      totalCount: total,
      isUnlocked
    });

    prevPhaseComplete = total > 0 && (completed / total >= 0.6);
  }

  return phases;
}

/**
 * Helper to unlock subsequent phase items when preceding phase reaches completion threshold
 */
function unlockSubsequentItemsIfReady(roadmapId: number, completedPhaseNumber: number): void {
  const currentPhaseItems = db.prepare(`
    SELECT status FROM roadmap_items WHERE roadmap_id = ? AND phase_number = ?
  `).all(roadmapId, completedPhaseNumber) as { status: string }[];

  const completed = currentPhaseItems.filter(i => i.status === 'completed').length;
  const total = currentPhaseItems.length;

  if (total > 0 && completed / total >= 0.5) {
    // Unlock first 2 locked items of next phase
    const nextPhaseNumber = completedPhaseNumber + 1;
    const lockedNext = db.prepare(`
      SELECT id FROM roadmap_items
      WHERE roadmap_id = ? AND phase_number = ? AND status = 'locked'
      ORDER BY order_index ASC
      LIMIT 2
    `).all(roadmapId, nextPhaseNumber) as { id: number }[];

    for (const item of lockedNext) {
      db.prepare("UPDATE roadmap_items SET status = 'available' WHERE id = ?").run(item.id);
    }
  }
}

/**
 * Returns contextual titles for phases based on career domain
 */
function getPhaseTitlesForCareer(careerTitle: string, numPhases: number): string[] {
  const lower = careerTitle.toLowerCase();

  if (lower.includes('full stack') || lower.includes('frontend') || lower.includes('backend') || lower.includes('web')) {
    return [
      'Phase 1: Web Fundamentals & Core Scripting',
      'Phase 2: Modern Frontend & State Management',
      'Phase 3: Backend Services & API Architecture',
      'Phase 4: Database Systems & Authentication',
      'Phase 5: Containerization, Testing & Deployment'
    ].slice(0, numPhases);
  }

  if (lower.includes('ai') || lower.includes('machine learning') || lower.includes('data')) {
    return [
      'Phase 1: Programming & Math Bedrock',
      'Phase 2: Data Wrangling & Feature Analysis',
      'Phase 3: Machine Learning Models & Algorithms',
      'Phase 4: Deep Learning & Neural Architectures',
      'Phase 5: Generative AI, RAG & Production Deployment'
    ].slice(0, numPhases);
  }

  if (lower.includes('cloud') || lower.includes('devops')) {
    return [
      'Phase 1: Linux & Scripting Foundations',
      'Phase 2: Version Control & Networking',
      'Phase 3: Containerization & CI/CD Pipelines',
      'Phase 4: Cloud Architecture & Infrastructure as Code',
      'Phase 5: Production Kubernetes & Observability'
    ].slice(0, numPhases);
  }

  if (lower.includes('mobile') || lower.includes('android') || lower.includes('ios')) {
    return [
      'Phase 1: Language Fundamentals & SDK Setup',
      'Phase 2: UI Components & Responsive Layouts',
      'Phase 3: State Management & Offline Storage',
      'Phase 4: REST API Integration & Native Device APIs',
      'Phase 5: Performance Optimization & App Store Release'
    ].slice(0, numPhases);
  }

  // Default professional engineering phases
  return [
    'Phase 1: Core Engineering Foundations',
    'Phase 2: Domain Architecture & Tooling',
    'Phase 3: Advanced Development & System Design',
    'Phase 4: Data Systems, Security & Cloud',
    'Phase 5: Production Capstone, Testing & Deployment'
  ].slice(0, numPhases);
}

export interface PersonalizedPriorityTopic {
  skillId: number;
  topicName: string;
  category: string;
  currentLevel: number;
  targetLevel: number;
  gap: number;
  priority: 'High' | 'Medium' | 'Low';
  estimatedHours: number;
  estimatedTimeText: string;
  reason: string;
  recommendedMethod: string;
  isUnlocked: boolean;
}

export function computePersonalizedPriorityTopics(params: {
  careerId?: number;
  customCareerGoal?: string;
  selectedSkills?: { skillId?: number; skillName?: string; proficiency?: number }[];
  projects?: any[];
  preferences?: {
    workMode?: string;
    weeklyHours?: number;
    learningPace?: string;
    learningPreference?: string;
    careerPriorities?: string[];
  };
}): {
  careerTitle: string;
  priorityTopics: PersonalizedPriorityTopic[];
  weeklySummary: string;
} {
  const { careerId = 1, customCareerGoal, selectedSkills = [], preferences = {} } = params;

  // Resolve Career
  let careerTitle = 'Software Developer';
  if (customCareerGoal?.trim()) {
    careerTitle = customCareerGoal.trim();
  } else {
    const career = db.prepare('SELECT title FROM careers WHERE id = ?').get(careerId) as { title: string } | undefined;
    if (career) careerTitle = career.title;
  }

  // Get skills associated with this career
  let careerSkills = db.prepare(`
    SELECT cs.skill_id, cs.required_level, cs.order_index,
           s.name as skill_name, s.category, s.difficulty, s.description
    FROM career_skills cs
    JOIN skills s ON cs.skill_id = s.id
    WHERE cs.career_id = ?
    ORDER BY cs.order_index ASC
  `).all(careerId) as {
    skill_id: number;
    required_level: number;
    order_index: number;
    skill_name: string;
    category: string;
    difficulty: string;
    description: string;
  }[];

  // If none found (e.g. custom career), pull top skills across categories
  if (careerSkills.length === 0) {
    careerSkills = db.prepare(`
      SELECT s.id as skill_id, 80 as required_level, s.id as order_index,
             s.name as skill_name, s.category, s.difficulty, s.description
      FROM skills s
      ORDER BY s.id ASC
      LIMIT 12
    `).all() as any[];
  }

  // Build map of current proficiencies
  const currentMap = new Map<number, number>();
  const nameMap = new Map<string, number>();

  for (const s of selectedSkills) {
    const prof = Number(s.proficiency) || 0;
    if (s.skillId) currentMap.set(Number(s.skillId), prof);
    if (s.skillName) nameMap.set(s.skillName.toLowerCase(), prof);
  }

  // Learning preferences
  const weeklyHours = Number(preferences.weeklyHours) || 15;
  const learningPace = preferences.learningPace || 'moderate';
  const learningPreference = preferences.learningPreference || 'Mixed';
  const careerPriorities = preferences.careerPriorities || [];

  // Pace multiplier
  let paceMultiplier = 1.0;
  if (learningPace === 'intensive') paceMultiplier = 0.8;
  else if (learningPace === 'steady') paceMultiplier = 1.25;

  const topics: (PersonalizedPriorityTopic & { score: number })[] = [];

  for (const cs of careerSkills) {
    let current = currentMap.get(cs.skill_id);
    if (current === undefined && nameMap.has(cs.skill_name.toLowerCase())) {
      current = nameMap.get(cs.skill_name.toLowerCase());
    }
    const currentLevel = current !== undefined ? current : 0;
    const targetLevel = cs.required_level || 80;
    const gap = Math.max(0, targetLevel - currentLevel);

    // Calculate base hours based on difficulty and remaining gap
    let baseHours = 20;
    if (cs.difficulty === 'Beginner') baseHours = 14;
    else if (cs.difficulty === 'Intermediate') baseHours = 24;
    else if (cs.difficulty === 'Advanced') baseHours = 34;

    const gapRatio = gap / 100;
    let estHours = Math.max(4, Math.round(baseHours * Math.max(0.2, gapRatio) * paceMultiplier));

    const weeks = Math.max(1, Math.ceil(estHours / weeklyHours));
    const estimatedTimeText = `${estHours} hours (~${weeks} week${weeks > 1 ? 's' : ''} at ${weeklyHours} hrs/wk)`;

    // Calculate priority score
    let score = gap;

    // Career Priority modifiers
    if (careerPriorities.includes('Internship')) {
      if (['Git & GitHub', 'REST APIs', 'React', 'Node.js', 'Express.js', 'SQL', 'PostgreSQL', 'Tailwind CSS'].includes(cs.skill_name)) {
        score += 25;
      }
    }
    if (careerPriorities.includes('Placement')) {
      if (['Data Structures', 'Algorithms', 'Arrays & Strings', 'Trees & Graphs', 'SQL', 'Object-Oriented Programming'].includes(cs.skill_name) || cs.category.includes('DSA')) {
        score += 30;
      }
    }
    if (careerPriorities.includes('Competitive Programming')) {
      if (['Algorithms', 'Data Structures', 'Arrays & Strings', 'Trees & Graphs', 'C++'].includes(cs.skill_name)) {
        score += 35;
      }
    }
    if (careerPriorities.includes('Projects')) {
      if (['React', 'Next.js', 'Node.js', 'Express.js', 'MongoDB', 'Tailwind CSS'].includes(cs.skill_name)) {
        score += 20;
      }
    }

    let priority: 'High' | 'Medium' | 'Low' = 'Low';
    if (gap === 0) {
      priority = 'Low';
    } else if (score >= 45 || gap >= 40) {
      priority = 'High';
    } else if (score >= 20 || gap >= 15) {
      priority = 'Medium';
    }

    // Dynamic reason
    let reason = `Core requirement for your ${careerTitle} goal.`;
    if (careerPriorities.includes('Placement') && (cs.category.includes('DSA') || cs.category.includes('Core CS'))) {
      reason = `Crucial for ${careerTitle} campus placement rounds and live technical coding assessments.`;
    } else if (careerPriorities.includes('Internship') && (cs.skill_name.includes('Git') || cs.skill_name.includes('REST') || cs.skill_name.includes('React') || cs.skill_name.includes('API'))) {
      reason = `High-priority industry skill required immediately for ${careerTitle} internship readiness.`;
    } else if (gap >= 40) {
      reason = `Important for your ${careerTitle} goal and required before tackling advanced engineering milestones.`;
    } else if (currentLevel > 0 && currentLevel < targetLevel) {
      reason = `You have foundational knowledge (${currentLevel}%); leveling up to ${targetLevel}% will close your capability gap.`;
    } else if (gap === 0) {
      reason = `Already mastered at ${currentLevel}%. Continual practice recommended.`;
    }

    // Recommended learning method based on preference
    let recommendedMethod = 'Video lessons paired with practical coding';
    if (learningPreference === 'Videos') {
      recommendedMethod = 'Structured video course walkthroughs + visual tutorials';
    } else if (learningPreference === 'Projects') {
      recommendedMethod = 'Project-based builds and feature milestones';
    } else if (learningPreference === 'Practice / Coding') {
      recommendedMethod = 'Interactive coding challenges & hands-on algorithmic drills';
    } else if (learningPreference === 'Documentation') {
      recommendedMethod = 'Official architectural documentation & API specifications';
    } else {
      recommendedMethod = 'Video course walkthroughs combined with hands-on project builds';
    }

    topics.push({
      skillId: cs.skill_id,
      topicName: cs.skill_name,
      category: cs.category,
      currentLevel,
      targetLevel,
      gap,
      priority,
      estimatedHours: estHours,
      estimatedTimeText,
      reason,
      recommendedMethod,
      isUnlocked: true,
      score
    });
  }

  // Sort topics by score descending (high priority gaps first)
  topics.sort((b, a) => a.score - b.score);

  const priorityTopics = topics.slice(0, 10).map(({ score, ...rest }) => rest);

  const weeklySummary = `At ${weeklyHours} hours/week on a ${learningPace} schedule, your initial milestone target can be reached in approximately ${Math.max(4, Math.ceil(priorityTopics.reduce((acc, t) => acc + t.estimatedHours, 0) / weeklyHours))} weeks.`;

  return {
    careerTitle,
    priorityTopics,
    weeklySummary
  };
}
