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

export function generateOrUpdateRoadmap(userId: number, careerId?: number): RoadmapPhase[] {
  let targetCareerId: number | undefined = careerId;
  if (!targetCareerId) {
    const profile = db.prepare('SELECT career_goal_id FROM profiles WHERE user_id = ?').get(userId) as { career_goal_id: number } | undefined;
    targetCareerId = profile?.career_goal_id;
  }

  let validCareerId: number;
  let careerTitle: string;

  const career = targetCareerId
    ? (db.prepare('SELECT id, title FROM careers WHERE id = ?').get(targetCareerId) as { id: number; title: string } | undefined)
    : undefined;

  if (career) {
    validCareerId = career.id;
    careerTitle = career.title;
  } else {
    const firstCareer = db.prepare('SELECT id, title FROM careers LIMIT 1').get() as { id: number; title: string } | undefined;
    if (!firstCareer) return [];
    validCareerId = firstCareer.id;
    careerTitle = firstCareer.title;
  }

  // Check if roadmap record exists
  let roadmap = db.prepare('SELECT id, career_id FROM roadmaps WHERE user_id = ?').get(userId) as { id: number; career_id: number } | undefined;

  if (!roadmap || roadmap.career_id !== validCareerId) {
    // Delete existing items if switching careers
    if (roadmap) {
      db.prepare('DELETE FROM roadmap_items WHERE roadmap_id = ?').run(roadmap.id);
      db.prepare('DELETE FROM roadmaps WHERE id = ?').run(roadmap.id);
    }

    const ins = db.prepare(`
      INSERT INTO roadmaps (user_id, career_id, title)
      VALUES (?, ?, ?)
    `).run(userId, validCareerId, `${careerTitle} Mastery Roadmap`);
    roadmap = { id: Number(ins.lastInsertRowid), career_id: validCareerId };

    // Generate initial items from career skills
    const careerSkills = db.prepare(`
      SELECT cs.skill_id, cs.order_index, s.name as skill_name, s.category, s.difficulty, s.description
      FROM career_skills cs
      JOIN skills s ON cs.skill_id = s.id
      WHERE cs.career_id = ?
      ORDER BY cs.order_index ASC
    `).all(validCareerId) as {
      skill_id: number;
      order_index: number;
      skill_name: string;
      category: string;
      difficulty: string;
      description: string;
    }[];

    const insertItem = db.prepare(`
      INSERT INTO roadmap_items (roadmap_id, phase_number, phase_title, skill_id, title, description, status, estimated_hours, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Group into phases
    for (const cs of careerSkills) {
      let phaseNumber = 1;
      let phaseTitle = 'Phase 1: Foundations & Markup';
      let estHours = 15;

      if (cs.category === 'Frontend' && (cs.skill_name.includes('HTML') || cs.skill_name.includes('CSS'))) {
        phaseNumber = 1;
        phaseTitle = 'Phase 1: Web Fundamentals';
        estHours = 12;
      } else if (cs.category === 'Frontend' || cs.category === 'Core CS' && cs.skill_name.includes('Git')) {
        phaseNumber = 2;
        phaseTitle = 'Phase 2: Modern Frontend & Scripting';
        estHours = 25;
      } else if (cs.category === 'Backend') {
        phaseNumber = 3;
        phaseTitle = 'Phase 3: Backend Services & APIs';
        estHours = 30;
      } else if (cs.category === 'Database' || cs.skill_name.includes('Security') || cs.skill_name.includes('Auth')) {
        phaseNumber = 4;
        phaseTitle = 'Phase 4: Database Systems & Authentication';
        estHours = 25;
      } else if (cs.category === 'DevOps') {
        phaseNumber = 5;
        phaseTitle = 'Phase 5: Containerization & Deployment';
        estHours = 20;
      } else if (cs.category === 'DSA') {
        phaseNumber = 6;
        phaseTitle = 'Phase 6: Data Structures & Algorithms Track';
        estHours = 35;
      } else {
        phaseNumber = 7;
        phaseTitle = 'Phase 7: Advanced Engineering Track';
        estHours = 30;
      }

      insertItem.run(
        roadmap.id,
        phaseNumber,
        phaseTitle,
        cs.skill_id,
        cs.skill_name,
        cs.description || `Master core principles of ${cs.skill_name} and apply them to real applications.`,
        'available',
        estHours,
        cs.order_index
      );
    }
  }

  if (!roadmap) {
    return [];
  }

  // Recalculate status of all items based on current student skills & dependencies
  const gaps = calculateSkillGaps(userId, validCareerId);
  const gapMap = new Map(gaps.map(g => [g.skillId, g]));

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
  `).all(roadmap.id) as {
    id: number;
    roadmap_id: number;
    phase_number: number;
    phase_title: string;
    skill_id: number;
    title: string;
    description: string;
    status: 'locked' | 'available' | 'in_progress' | 'completed';
    estimated_hours: number;
    order_index: number;
    completed_at: string | null;
    skill_name: string;
    resource_count: number;
    assessment_count: number;
  }[];

  const updateItemStatus = db.prepare('UPDATE roadmap_items SET status = ?, completed_at = ? WHERE id = ?');

  const itemsView: RoadmapItemView[] = [];

  for (const item of rawItems) {
    const gapInfo = gapMap.get(item.skill_id);
    let computedStatus = item.status;

    if (gapInfo) {
      if (gapInfo.status === 'completed' || gapInfo.currentProficiency >= gapInfo.requiredProficiency) {
        computedStatus = 'completed';
        if (!item.completed_at) {
          updateItemStatus.run('completed', new Date().toISOString(), item.id);
        }
      } else if (!gapInfo.prerequisitesMet) {
        computedStatus = 'locked';
        if (item.status !== 'locked') {
          updateItemStatus.run('locked', null, item.id);
        }
      } else {
        // Prerequisites met
        if (item.status === 'locked') {
          computedStatus = 'available';
          updateItemStatus.run('available', null, item.id);
        } else if (gapInfo.currentProficiency > 0 && item.status !== 'in_progress' && item.status !== 'completed') {
          computedStatus = 'in_progress';
          updateItemStatus.run('in_progress', null, item.id);
        }
      }
    }

    itemsView.push({
      id: item.id,
      skillId: item.skill_id,
      skillName: item.skill_name,
      phaseNumber: item.phase_number,
      phaseTitle: item.phase_title,
      title: item.title,
      description: item.description,
      status: computedStatus,
      estimatedHours: item.estimated_hours,
      orderIndex: item.order_index,
      completedAt: item.completed_at,
      prerequisitesMet: gapInfo ? gapInfo.prerequisitesMet : true,
      missingPrerequisites: gapInfo ? gapInfo.missingPrerequisites : [],
      resourcesCount: item.resource_count,
      hasAssessment: item.assessment_count > 0
    });
  }

  // Update recalculation timestamp
  db.prepare("UPDATE roadmaps SET recalculated_at = CURRENT_TIMESTAMP WHERE id = ?").run(roadmap.id);

  // Group by phases
  const phaseMap = new Map<number, RoadmapItemView[]>();
  for (const it of itemsView) {
    if (!phaseMap.has(it.phaseNumber)) {
      phaseMap.set(it.phaseNumber, []);
    }
    phaseMap.get(it.phaseNumber)!.push(it);
  }

  const phases: RoadmapPhase[] = [];
  const sortedPhaseKeys = Array.from(phaseMap.keys()).sort((a, b) => a - b);

  let prevPhaseComplete = true;

  for (const pNum of sortedPhaseKeys) {
    const pItems = phaseMap.get(pNum)!;
    const completed = pItems.filter(i => i.status === 'completed').length;
    const total = pItems.length;
    const isUnlocked = prevPhaseComplete || pNum === 1 || pNum === 6; // Phase 1 & DSA track are always accessible

    phases.push({
      phaseNumber: pNum,
      phaseTitle: pItems[0]?.phaseTitle || `Phase ${pNum}`,
      items: pItems,
      completedCount: completed,
      totalCount: total,
      isUnlocked
    });

    // A phase is complete if at least 70% of its required items are completed
    prevPhaseComplete = total > 0 && (completed / total >= 0.7);
  }

  return phases;
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
  topics.sort((a, b) => b.score - a.score);

  const priorityTopics = topics.slice(0, 10).map(({ score, ...rest }) => rest);

  const weeklySummary = `At ${weeklyHours} hours/week on a ${learningPace} schedule, your initial milestone target can be reached in approximately ${Math.max(4, Math.ceil(priorityTopics.reduce((acc, t) => acc + t.estimatedHours, 0) / weeklyHours))} weeks.`;

  return {
    careerTitle,
    priorityTopics,
    weeklySummary
  };
}
