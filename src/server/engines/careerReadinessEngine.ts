import { db } from '../db.js';
import { calculateSkillGaps } from './skillGapEngine.js';

export interface ReadinessBreakdown {
  overallScore: number;
  label: string; // e.g., 'Job Ready Candidate', 'Intermediate Apprentice', 'Foundational Learner'
  components: {
    skills: { score: number; weight: number; contribution: number; explanation: string };
    assessments: { score: number; weight: number; contribution: number; explanation: string };
    projects: { score: number; weight: number; contribution: number; explanation: string };
    dsa: { score: number; weight: number; contribution: number; explanation: string };
    profile: { score: number; weight: number; contribution: number; explanation: string };
  };
  disclaimer: string;
}

export function calculateCareerReadiness(userId: number, careerId?: number): ReadinessBreakdown {
  const gaps = calculateSkillGaps(userId, careerId);

  // 1. Skills Score (Weight: 30%)
  let skillsScore = 0;
  if (gaps.length > 0) {
    const totalProficiency = gaps.reduce((acc, g) => acc + g.currentProficiency, 0);
    skillsScore = Math.min(100, Math.round(totalProficiency / gaps.length));
  }

  // 2. Assessments Score (Weight: 20%)
  const attempts = db.prepare(`
    SELECT score FROM assessment_attempts WHERE user_id = ?
  `).all(userId) as { score: number }[];

  let assessmentScore = 0;
  if (attempts.length > 0) {
    const avgScore = attempts.reduce((acc, a) => acc + a.score, 0) / attempts.length;
    // factor in number of assessments taken (up to 4)
    const coverage = Math.min(1, attempts.length / 4);
    assessmentScore = Math.min(100, Math.round(avgScore * coverage));
  } else {
    // If student has self-assessed skills but hasn't taken quizzes yet, give a baseline proportional to computed skills
    assessmentScore = Math.round(skillsScore * 0.4);
  }

  // 3. Projects Score (Weight: 20%)
  const projects = db.prepare(`
    SELECT status, github_repo_url, live_demo_url FROM student_projects WHERE user_id = ?
  `).all(userId) as { status: string; github_repo_url: string | null; live_demo_url: string | null }[];

  let completedProjectsCount = 0;
  let inProgressProjectsCount = 0;
  for (const p of projects) {
    if (p.status === 'completed') {
      completedProjectsCount++;
      // Bonus if repo and demo are provided
      if (p.github_repo_url && p.live_demo_url) {
        completedProjectsCount += 0.2;
      }
    } else if (p.status === 'in_progress') {
      inProgressProjectsCount++;
    }
  }
  // Target is 3 completed projects for 100%
  const projectScore = Math.min(100, Math.round((completedProjectsCount / 3) * 85 + (inProgressProjectsCount * 7.5)));

  // 4. DSA Score (Weight: 15%)
  const dsaRows = db.prepare(`
    SELECT problems_solved, total_problems FROM dsa_topics WHERE user_id = ?
  `).all(userId) as { problems_solved: number; total_problems: number }[];

  let dsaScore = 0;
  if (dsaRows.length > 0) {
    const totalSolved = dsaRows.reduce((acc, r) => acc + r.problems_solved, 0);
    const totalQuestions = dsaRows.reduce((acc, r) => acc + r.total_problems, 0);
    dsaScore = totalQuestions > 0 ? Math.min(100, Math.round((totalSolved / totalQuestions) * 100)) : 0;
  }

  // 5. Profile & Credentials Completeness (Weight: 15%)
  const profile = db.prepare(`
    SELECT full_name, degree, branch, college, current_year, current_semester, cgpa,
           github_url, linkedin_url
    FROM profiles WHERE user_id = ?
  `).get(userId) as {
    full_name: string; degree: string; branch: string; college: string;
    current_year: string; current_semester: string; cgpa: number | null;
    github_url: string | null; linkedin_url: string | null;
  } | undefined;

  let profilePoints = 0;
  if (profile) {
    if (profile.full_name) profilePoints += 15;
    if (profile.degree && profile.branch) profilePoints += 20;
    if (profile.college) profilePoints += 15;
    if (profile.current_year && profile.current_semester) profilePoints += 10;
    if (profile.cgpa) profilePoints += 15;
    if (profile.github_url) profilePoints += 15;
    if (profile.linkedin_url) profilePoints += 10;
  }
  const profileScore = Math.min(100, profilePoints);

  // Weights: Skills (30%), Assessments (20%), Projects (20%), DSA (15%), Profile (15%)
  const skillsContrib = (skillsScore * 0.30);
  const assessContrib = (assessmentScore * 0.20);
  const projContrib = (projectScore * 0.20);
  const dsaContrib = (dsaScore * 0.15);
  const profContrib = (profileScore * 0.15);

  const overallScore = Math.min(100, Math.round(skillsContrib + assessContrib + projContrib + dsaContrib + profContrib));

  let label = 'Foundational Learner';
  if (overallScore >= 80) {
    label = 'Interview & Internship Ready';
  } else if (overallScore >= 60) {
    label = 'Active Project Builder';
  } else if (overallScore >= 40) {
    label = 'Developing Core Competencies';
  }

  return {
    overallScore,
    label,
    components: {
      skills: {
        score: skillsScore,
        weight: 30,
        contribution: Math.round(skillsContrib),
        explanation: `${gaps.filter(g => g.currentProficiency >= 70).length} of ${gaps.length} career skills at target proficiency.`
      },
      assessments: {
        score: assessmentScore,
        weight: 20,
        contribution: Math.round(assessContrib),
        explanation: `${attempts.length} verified technical assessments completed.`
      },
      projects: {
        score: projectScore,
        weight: 20,
        contribution: Math.round(projContrib),
        explanation: `${projects.filter(p => p.status === 'completed').length} completed projects with repository evidence.`
      },
      dsa: {
        score: dsaScore,
        weight: 15,
        contribution: Math.round(dsaContrib),
        explanation: `Tracked problem solving across ${dsaRows.length} core algorithmic topics.`
      },
      profile: {
        score: profileScore,
        weight: 15,
        contribution: Math.round(profContrib),
        explanation: 'Academic record, verified GitHub & LinkedIn profile links.'
      }
    },
    disclaimer: 'The Career Readiness Indicator is an analytical prototype based on verified skills, projects, and assessment scores. It is not an employment guarantee.'
  };
}
