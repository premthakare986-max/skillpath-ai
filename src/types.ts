export interface User {
  id: number;
  email: string;
  role: 'student' | 'admin';
  fullName: string;
  onboardingCompleted: boolean;
  careerGoalId?: number;
  avatarUrl?: string | null;
  firebaseUid?: string | null;
  authProvider?: string;
}

export interface Profile {
  id: number;
  user_id: number;
  full_name: string;
  location?: string;
  degree?: string;
  branch?: string;
  college?: string;
  current_year?: string;
  current_semester?: string;
  cgpa?: number;
  sgpa_history?: { semester: string; sgpa: number }[];
  career_goal_id?: number;
  career_title?: string;
  career_slug?: string;
  custom_career_goal?: string;
  learning_pace: 'slow' | 'moderate' | 'intensive';
  weekly_hours: number;
  preferred_work_mode: 'remote' | 'hybrid' | 'onsite';
  github_url?: string;
  linkedin_url?: string;
  onboarding_completed: number;
  created_at: string;
  updated_at: string;
}

export interface Career {
  id: number;
  title: string;
  slug: string;
  description: string;
  icon: string;
  category: string;
  market_demand: string;
  avg_salary?: string;
  is_active: number;
  total_skills?: number;
}

export interface Skill {
  id: number;
  name: string;
  slug: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description?: string;
  career_relevance?: string;
  is_active: number;
}

export interface StudentSkill {
  id: number;
  user_id: number;
  skill_id: number;
  skill_name: string;
  category: string;
  difficulty: string;
  description?: string;
  self_proficiency: number;
  assessed_proficiency?: number | null;
  computed_proficiency: number;
  status: 'not_started' | 'in_progress' | 'completed';
  last_assessed_at?: string | null;
  updated_at: string;
}

export interface SkillGapItem {
  skillId: number;
  skillName: string;
  category: string;
  difficulty: string;
  selfProficiency?: number;
  assessedProficiency?: number | null;
  currentProficiency: number;
  requiredProficiency: number;
  gap: number;
  priority: 'High' | 'Medium' | 'Low';
  status: 'not_started' | 'in_progress' | 'completed';
  prerequisitesMet: boolean;
  missingPrerequisites: string[];
  relevance: string;
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

export interface RoadmapPhase {
  phaseNumber: number;
  phaseTitle: string;
  items: RoadmapItemView[];
  completedCount: number;
  totalCount: number;
  isUnlocked: boolean;
}

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

export interface ReadinessBreakdown {
  overallScore: number;
  label: string;
  components: {
    skills: { score: number; weight: number; contribution: number; explanation: string };
    assessments: { score: number; weight: number; contribution: number; explanation: string };
    projects: { score: number; weight: number; contribution: number; explanation: string };
    dsa: { score: number; weight: number; contribution: number; explanation: string };
    profile: { score: number; weight: number; contribution: number; explanation: string };
  };
  disclaimer: string;
}

export interface Resource {
  id: number;
  skill_id: number;
  skill_name?: string;
  skill_category?: string;
  topic: string;
  title: string;
  resource_type: 'Learn' | 'Practice' | 'Build';
  platform: string;
  url: string;
  difficulty: string;
  language: string;
  duration_minutes: number;
  is_free: number;
  is_active: number;
}

export interface Project {
  id: number;
  career_id?: number;
  career_title?: string;
  title: string;
  slug: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  why_this_project: string;
  learning_outcomes: string;
  technologies: string[];
  checklist: string[];
  is_active: number;
}

export interface StudentProject {
  id: number;
  user_id: number;
  project_id: number;
  project_title: string;
  difficulty: string;
  description: string;
  why_this_project: string;
  learning_outcomes: string;
  technologies: string[];
  checklist: string[];
  status: 'in_progress' | 'completed';
  github_repo_url?: string;
  live_demo_url?: string;
  completedChecklist: string[];
  notes?: string;
  completed_at?: string;
}

export interface Opportunity {
  id: number;
  company: string;
  role: string;
  description: string;
  requiredSkills: string[];
  degree_eligibility?: string;
  year_eligibility?: string;
  location: string;
  work_mode: string;
  deadline: string;
  source: string;
  application_url: string;
  matchScore: number;
  missingSkills: string[];
  applicationStatus?: 'saved' | 'applied' | 'assessment' | 'interview' | 'selected' | 'rejected' | null;
}

export interface Application {
  id: number;
  user_id: number;
  opportunity_id: number;
  company: string;
  role: string;
  location: string;
  work_mode: string;
  deadline: string;
  application_url: string;
  status: 'saved' | 'applied' | 'assessment' | 'interview' | 'selected' | 'rejected';
  applied_date?: string;
  interview_date?: string;
  notes?: string;
  updated_at: string;
}

export interface Assessment {
  id: number;
  skill_id: number;
  skill_name: string;
  category: string;
  difficulty: string;
  title: string;
  description: string;
  duration_minutes: number;
  total_questions: number;
  passing_score: number;
}

export interface AssessmentQuestion {
  id: number;
  questionText: string;
  questionType: string;
  options: string[];
}

export interface DsaTopic {
  id: number;
  user_id: number;
  topic: string;
  order_index: number;
  status: 'not_started' | 'in_progress' | 'completed';
  problems_solved: number;
  total_problems: number;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'roadmap';
  read: number;
  created_at: string;
}

export interface YouTubeResourceItem {
  id: string;
  type: 'video' | 'playlist';
  title: string;
  description: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
  url: string;
  skillName?: string;
  topic?: string;
  averageRating?: number;
  ratingCount?: number;
  userRating?: number;
}

export interface YouTubeSearchResponse {
  success: boolean;
  configured: boolean;
  query: string;
  skillName?: string;
  contextReason?: string;
  results: YouTubeResourceItem[];
  cached?: boolean;
  error?: string;
  message?: string;
}

export interface TopicLearningResources {
  topicName: string;
  skillId?: number;
  phaseTitle?: string;
  resources: YouTubeResourceItem[];
}

export interface RoadmapTopicsResponse {
  success: boolean;
  configured: boolean;
  topics: TopicLearningResources[];
  cached?: boolean;
  error?: string;
  message?: string;
}

export type EvidenceLevel =
  | 'Strong Evidence'
  | 'Moderate Evidence'
  | 'Limited Evidence'
  | 'No Evidence Detected';

export interface SupportingRepository {
  name: string;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  stars: number;
  matchReason: string;
}

export interface SkillEvidenceItem {
  skillId: number;
  skillName: string;
  category: string;
  declaredProficiency: number;
  testedProficiency: number | null;
  computedProficiency: number;
  evidenceLevel: EvidenceLevel;
  supportingRepos: SupportingRepository[];
  factualInsight: string;
}

export interface DiscoveredTechItem {
  techName: string;
  repoCount: number;
  repos: { name: string; htmlUrl: string }[];
  recommendationMessage: string;
}

export interface GitHubEvidenceSummary {
  connected: boolean;
  username: string | null;
  profileUrl: string | null;
  analyzedAt: string;
  totalRepos: number;
  primaryLanguages: { [lang: string]: number };
  skillEvidence: SkillEvidenceItem[];
  discoveredTech: DiscoveredTechItem[];
  generalInsights: string[];
  available: boolean;
  error?: string;
  cached?: boolean;
}

export type InquiryStatus = 'New' | 'In Progress' | 'Resolved';
export type InquiryPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export interface ContactInquiry {
  id: number;
  inquiry_id: string;
  full_name: string;
  email: string;
  topic: string;
  message: string;
  status: InquiryStatus;
  priority: InquiryPriority;
  user_id?: number | null;
  firebase_uid?: string | null;
  submitted_at: string;
  updated_at: string;
}


