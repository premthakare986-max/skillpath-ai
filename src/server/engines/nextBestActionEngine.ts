import { db } from '../db.js';
import { calculateSkillGaps } from './skillGapEngine.js';

export interface NextBestAction {
  actionTitle: string;
  skillName: string;
  skillId?: number;
  phaseTitle: string;
  actionType: 'learn_skill' | 'take_assessment' | 'build_project' | 'apply_internship' | 'solve_dsa';
  estimatedMinutes: number;
  whyExplanation: string;
  stepAfter: string;
  stepThen: string;
  ctaText: string;
  ctaLink: string;
  resourceId?: number;
  projectId?: number;
}

export function determineNextBestAction(userId: number, careerId?: number): NextBestAction {
  const gaps = calculateSkillGaps(userId, careerId);

  // 1. Check if student has incomplete onboarding or 0 skills
  const studentSkills = db.prepare('SELECT COUNT(*) as count FROM student_skills WHERE user_id = ?').get(userId) as { count: number };
  if (studentSkills.count === 0) {
    return {
      actionTitle: 'Configure Your Skills Matrix',
      skillName: 'Profile Setup',
      phaseTitle: 'Initial Setup',
      actionType: 'learn_skill',
      estimatedMinutes: 5,
      whyExplanation: 'SkillPath AI needs your initial skill self-ratings to personalize your roadmap.',
      stepAfter: 'Explore your customized Skill Gap Analysis.',
      stepThen: 'Start your first recommended learning module.',
      ctaText: 'Set Up Skills',
      ctaLink: '/skills'
    };
  }

  // 2. Check for the highest-priority skill where prerequisites are satisfied but skill is not completed
  const actionableGap = gaps.find(g => g.prerequisitesMet && g.currentProficiency < g.requiredProficiency && g.status !== 'completed');

  if (actionableGap) {
    // If student has learned basics (e.g. >= 40%) but hasn't taken the assessment yet, suggest assessment
    const hasAss = db.prepare('SELECT id FROM assessments WHERE skill_id = ?').get(actionableGap.skillId) as { id: number } | undefined;
    const hasAttempted = hasAss ? db.prepare('SELECT id FROM assessment_attempts WHERE user_id = ? AND assessment_id = ?').get(userId, hasAss.id) : null;

    if (actionableGap.currentProficiency >= 40 && hasAss && !hasAttempted) {
      return {
        actionTitle: `Validate ${actionableGap.skillName} Proficiency`,
        skillName: actionableGap.skillName,
        skillId: actionableGap.skillId,
        phaseTitle: 'Knowledge Verification',
        actionType: 'take_assessment',
        estimatedMinutes: 15,
        whyExplanation: `You have completed initial study in ${actionableGap.skillName}. Taking the 5-question technical quiz will update your verified proficiency rating and unlock advanced roadmap phases.`,
        stepAfter: `Compare self-assessment vs test score to update your skill matrix.`,
        stepThen: `Move forward to the next prerequisite in your career path.`,
        ctaText: 'Start Assessment (15 min)',
        ctaLink: `/assessments?skill=${actionableGap.skillId}`
      };
    }

    // Otherwise, recommend learning the skill
    const topResource = db.prepare(`
      SELECT id, title, platform, duration_minutes, url
      FROM resources
      WHERE skill_id = ? AND is_active = 1
      ORDER BY resource_type ASC
      LIMIT 1
    `).get(actionableGap.skillId) as { id: number; title: string; platform: string; duration_minutes: number; url: string } | undefined;

    return {
      actionTitle: `Strengthen ${actionableGap.skillName}`,
      skillName: actionableGap.skillName,
      skillId: actionableGap.skillId,
      phaseTitle: `${actionableGap.category} Core Track`,
      actionType: 'learn_skill',
      estimatedMinutes: topResource?.duration_minutes || 45,
      whyExplanation: `${actionableGap.skillName} is a high-priority requirement for your selected career. All prerequisites are satisfied, making this the optimal next milestone.`,
      stepAfter: `Practice 5 foundational ${actionableGap.skillName} coding exercises.`,
      stepThen: `Build a project milestone integrating ${actionableGap.skillName}.`,
      ctaText: topResource ? `Learn on ${topResource.platform}` : 'Open Learning Resources',
      ctaLink: `/resources?skill=${actionableGap.skillId}`,
      resourceId: topResource?.id
    };
  }

  // 3. If skills are largely covered, check if recommended project is pending
  const pendingProject = db.prepare(`
    SELECT p.id, p.title, p.difficulty
    FROM projects p
    WHERE p.id NOT IN (
      SELECT project_id FROM student_projects WHERE user_id = ? AND status = 'completed'
    )
    LIMIT 1
  `).get(userId) as { id: number; title: string; difficulty: string } | undefined;

  if (pendingProject) {
    return {
      actionTitle: `Build Project: ${pendingProject.title}`,
      skillName: 'Applied Engineering',
      phaseTitle: 'Portfolio Evidence',
      actionType: 'build_project',
      estimatedMinutes: 90,
      whyExplanation: `Your foundational skills are verified. Building ${pendingProject.title} demonstrates practical execution to recruiters and elevates your Career Readiness score.`,
      stepAfter: 'Create a GitHub repository with a detailed architecture README.',
      stepThen: 'Deploy your live project and connect it to your SkillPath portfolio.',
      ctaText: 'View Project Specifications',
      ctaLink: `/projects?id=${pendingProject.id}`,
      projectId: pendingProject.id
    };
  }

  // 4. Default: Apply to matched opportunities
  return {
    actionTitle: 'Review High-Match Internship Openings',
    skillName: 'Opportunity Pipeline',
    phaseTitle: 'Career Applications',
    actionType: 'apply_internship',
    estimatedMinutes: 20,
    whyExplanation: 'Your core skills and project evidence meet the eligibility threshold for active internship positions.',
    stepAfter: 'Tailor your resume highlighting your completed projects and skills.',
    stepThen: 'Track application stages in your Application Kanban board.',
    ctaText: 'Explore Opportunities',
    ctaLink: '/opportunities'
  };
}
