import { db } from '../db.js';
import { calculateSkillGaps } from './skillGapEngine.js';
import { generateOrUpdateRoadmap } from './roadmapEngine.js';
import { calculateCareerReadiness } from './careerReadinessEngine.js';
import { determineNextBestAction } from './nextBestActionEngine.js';

export interface RecalculationSummary {
  userId: number;
  careerReadiness: number;
  readinessLabel: string;
  nextBestAction: any;
  gapsCount: number;
  completedRoadmapItems: number;
  totalRoadmapItems: number;
  timestamp: string;
}

export function recalculateStudentState(userId: number, triggerEvent: string = 'manual_update'): RecalculationSummary {
  // 1. Calculate Skill Gaps
  const gaps = calculateSkillGaps(userId);

  // 2. Recalculate Roadmap (updates unlocked/locked statuses dynamically)
  const phases = generateOrUpdateRoadmap(userId);

  // 3. Recalculate Next Best Action
  const nextAction = determineNextBestAction(userId);

  // 4. Recalculate Career Readiness Breakdown
  const readiness = calculateCareerReadiness(userId);

  // 5. Store / Cache results in ai_analyses table
  const strengths = gaps
    .filter(g => g.currentProficiency >= 70)
    .map(g => `${g.skillName} (${g.currentProficiency}%)`);

  const priorityGaps = gaps
    .filter(g => g.priority === 'High')
    .map(g => `${g.skillName} (Gap: ${g.gap}%)`);

  const profileSummary = `Student has mastered ${strengths.length} core competencies with ${priorityGaps.length} critical skills pending. Current target readiness: ${readiness.overallScore}%.`;

  db.prepare(`
    INSERT INTO ai_analyses (
      user_id, current_profile_summary, strengths_json, skill_gaps_json,
      priority_gaps_json, career_readiness_score, readiness_breakdown_json,
      next_best_action_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      current_profile_summary = excluded.current_profile_summary,
      strengths_json = excluded.strengths_json,
      skill_gaps_json = excluded.skill_gaps_json,
      priority_gaps_json = excluded.priority_gaps_json,
      career_readiness_score = excluded.career_readiness_score,
      readiness_breakdown_json = excluded.readiness_breakdown_json,
      next_best_action_json = excluded.next_best_action_json,
      updated_at = CURRENT_TIMESTAMP
  `).run(
    userId,
    profileSummary,
    JSON.stringify(strengths),
    JSON.stringify(gaps),
    JSON.stringify(priorityGaps),
    readiness.overallScore,
    JSON.stringify(readiness),
    JSON.stringify(nextAction)
  );

  let totalItems = 0;
  let completedItems = 0;
  for (const p of phases) {
    totalItems += p.totalCount;
    completedItems += p.completedCount;
  }

  // Create notification if appropriate trigger
  if (triggerEvent !== 'manual_update') {
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, 'roadmap')
    `).run(
      userId,
      'Roadmap & Next Best Action Updated',
      `Triggered by ${triggerEvent}: Your Next Best Action is now "${nextAction.actionTitle}".`
    );
  }

  return {
    userId,
    careerReadiness: readiness.overallScore,
    readinessLabel: readiness.label,
    nextBestAction: nextAction,
    gapsCount: gaps.length,
    completedRoadmapItems: completedItems,
    totalRoadmapItems: totalItems,
    timestamp: new Date().toISOString()
  };
}
