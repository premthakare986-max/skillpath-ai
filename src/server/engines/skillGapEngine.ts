import { db } from '../db.js';

export interface SkillGapItem {
  skillId: number;
  skillName: string;
  category: string;
  difficulty: string;
  selfProficiency: number;
  assessedProficiency: number | null;
  currentProficiency: number;
  requiredProficiency: number;
  gap: number; // e.g. 50%
  priority: 'High' | 'Medium' | 'Low';
  status: 'not_started' | 'in_progress' | 'completed';
  prerequisitesMet: boolean;
  missingPrerequisites: string[];
  relevance: string;
}

export function calculateSkillGaps(userId: number, careerId?: number): SkillGapItem[] {
  // Determine student career goal
  let targetCareerId = careerId;
  if (!targetCareerId) {
    const profile = db.prepare('SELECT career_goal_id FROM profiles WHERE user_id = ?').get(userId) as { career_goal_id: number } | undefined;
    targetCareerId = profile?.career_goal_id;
  }

  if (!targetCareerId) {
    // Default to first career if not selected yet
    const firstCareer = db.prepare('SELECT id FROM careers LIMIT 1').get() as { id: number } | undefined;
    if (!firstCareer) return [];
    targetCareerId = firstCareer.id;
  }

  // Get all career skills for target career
  const careerSkills = db.prepare(`
    SELECT cs.skill_id, cs.required_level, cs.is_optional, cs.order_index,
           s.name as skill_name, s.category, s.difficulty, s.career_relevance
    FROM career_skills cs
    JOIN skills s ON cs.skill_id = s.id
    WHERE cs.career_id = ? AND s.is_active = 1
    ORDER BY cs.order_index ASC
  `).all(targetCareerId) as {
    skill_id: number;
    required_level: number;
    is_optional: number;
    order_index: number;
    skill_name: string;
    category: string;
    difficulty: string;
    career_relevance: string;
  }[];

  // Get student current skills
  const studentSkills = db.prepare(`
    SELECT skill_id, self_proficiency, assessed_proficiency, computed_proficiency, status
    FROM student_skills
    WHERE user_id = ?
  `).all(userId) as {
    skill_id: number;
    self_proficiency: number;
    assessed_proficiency: number | null;
    computed_proficiency: number;
    status: 'not_started' | 'in_progress' | 'completed';
  }[];

  const studentSkillMap = new Map(studentSkills.map(s => [s.skill_id, s]));

  // Get all dependencies
  const dependencies = db.prepare(`
    SELECT sd.skill_id, sd.depends_on_skill_id, s.name as parent_name
    FROM skill_dependencies sd
    JOIN skills s ON sd.depends_on_skill_id = s.id
  `).all() as { skill_id: number; depends_on_skill_id: number; parent_name: string }[];

  const depMap = new Map<number, { id: number; name: string }[]>();
  for (const dep of dependencies) {
    if (!depMap.has(dep.skill_id)) {
      depMap.set(dep.skill_id, []);
    }
    depMap.get(dep.skill_id)!.push({ id: dep.depends_on_skill_id, name: dep.parent_name });
  }

  const results: SkillGapItem[] = [];

  for (const cs of careerSkills) {
    const studentSkill = studentSkillMap.get(cs.skill_id);
    const selfProficiency = studentSkill ? studentSkill.self_proficiency : 0;
    const assessedProficiency = studentSkill ? studentSkill.assessed_proficiency : null;
    const currentProficiency = studentSkill ? studentSkill.computed_proficiency : 0;
    const status = studentSkill ? studentSkill.status : 'not_started';
    const gap = Math.max(0, cs.required_level - currentProficiency);

    // Check prerequisites
    const reqParents = depMap.get(cs.skill_id) || [];
    const missingParents: string[] = [];

    for (const parent of reqParents) {
      const parentRecord = studentSkillMap.get(parent.id);
      // Prerequisite is satisfied if computed proficiency is at least 50% or marked completed
      if (!parentRecord || (parentRecord.computed_proficiency < 50 && parentRecord.status !== 'completed')) {
        missingParents.push(parent.name);
      }
    }

    const prerequisitesMet = missingParents.length === 0;

    let priority: 'High' | 'Medium' | 'Low' = 'Low';
    if (gap >= 40 || (!cs.is_optional && gap >= 30)) {
      priority = 'High';
    } else if (gap >= 15) {
      priority = 'Medium';
    }

    results.push({
      skillId: cs.skill_id,
      skillName: cs.skill_name,
      category: cs.category,
      difficulty: cs.difficulty,
      selfProficiency,
      assessedProficiency,
      currentProficiency,
      requiredProficiency: cs.required_level,
      gap,
      priority,
      status,
      prerequisitesMet,
      missingPrerequisites: missingParents,
      relevance: cs.career_relevance || 'Core role requirement'
    });
  }

  return results;
}
