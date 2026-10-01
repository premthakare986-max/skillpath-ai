import { db } from '../db.js';

export interface GitHubRepository {
  name: string;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  updatedAt: string;
  isFork: boolean;
}

export interface SupportingRepository {
  name: string;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  language: string | null;
  stars: number;
  matchReason: string;
}

export type EvidenceLevel =
  | 'Strong Evidence'
  | 'Moderate Evidence'
  | 'Limited Evidence'
  | 'No Evidence Detected';

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

/**
 * Clean and extract a GitHub username from a URL or raw handle
 */
export function extractGithubUsername(rawInput?: string | null): string | null {
  if (!rawInput) return null;
  let str = rawInput.trim();
  if (!str) return null;

  // Handle formats like https://github.com/username, github.com/username/, @username, username
  str = str.replace(/^https?:\/\//i, '');
  str = str.replace(/^(www\.)?github\.com\//i, '');
  str = str.replace(/^@/, '');
  str = str.split('/')[0].split('?')[0].split('#')[0].trim();

  // Valid GitHub username check (alphanumeric with single hyphens, 1-39 chars)
  if (/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(str)) {
    return str;
  }
  return null;
}

/**
 * Technology keyword mapping dictionary for GitHub repository analysis
 */
const TECH_MATCHERS: { [skill: string]: { languages?: string[]; topics?: string[]; nameKeywords?: string[] } } = {
  'JavaScript': {
    languages: ['JavaScript'],
    topics: ['javascript', 'js', 'es6', 'vanilla-js'],
    nameKeywords: ['js', 'javascript']
  },
  'TypeScript': {
    languages: ['TypeScript'],
    topics: ['typescript', 'ts'],
    nameKeywords: ['typescript', 'ts']
  },
  'React': {
    languages: ['JavaScript', 'TypeScript'],
    topics: ['react', 'reactjs', 'react-native', 'nextjs', 'vite'],
    nameKeywords: ['react', 'nextjs']
  },
  'Node.js': {
    languages: ['JavaScript', 'TypeScript'],
    topics: ['nodejs', 'node', 'express', 'nest', 'fastify', 'backend'],
    nameKeywords: ['node', 'express', 'backend', 'api']
  },
  'HTML': {
    languages: ['HTML'],
    topics: ['html', 'html5'],
    nameKeywords: ['html']
  },
  'CSS': {
    languages: ['CSS', 'SCSS', 'Sass', 'Less'],
    topics: ['css', 'css3', 'tailwind', 'tailwindcss', 'bootstrap', 'sass'],
    nameKeywords: ['css', 'tailwind', 'style']
  },
  'Python': {
    languages: ['Python'],
    topics: ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy'],
    nameKeywords: ['python', 'py']
  },
  'SQL': {
    languages: ['SQL', 'PLpgSQL', 'TSQL'],
    topics: ['sql', 'postgres', 'postgresql', 'mysql', 'sqlite', 'prisma', 'drizzle', 'database'],
    nameKeywords: ['sql', 'postgres', 'database', 'db']
  },
  'Git': {
    topics: ['git', 'version-control'],
    nameKeywords: ['git']
  },
  'Docker': {
    topics: ['docker', 'dockerfile', 'containers', 'docker-compose'],
    nameKeywords: ['docker', 'container']
  },
  'Data Structures & Algorithms': {
    topics: ['dsa', 'leetcode', 'algorithms', 'data-structures', 'competitive-programming'],
    nameKeywords: ['leetcode', 'dsa', 'algo', 'algorithms']
  },
  'DSA': {
    topics: ['dsa', 'leetcode', 'algorithms', 'data-structures', 'competitive-programming'],
    nameKeywords: ['leetcode', 'dsa', 'algo', 'algorithms']
  }
};

/**
 * Check if a repository exhibits evidence of a target skill
 */
function checkRepoEvidence(repo: GitHubRepository, skillName: string): { matches: boolean; reason: string } {
  const normSkill = skillName.trim();
  const matcher = TECH_MATCHERS[normSkill] || {
    languages: [normSkill],
    topics: [normSkill.toLowerCase().replace(/[^a-z0-9]/g, '')],
    nameKeywords: [normSkill.toLowerCase().replace(/[^a-z0-9]/g, '')]
  };

  const repoLang = repo.language || '';
  const repoTopics = repo.topics.map(t => t.toLowerCase());
  const repoName = repo.name.toLowerCase();
  const repoDesc = (repo.description || '').toLowerCase();

  // 1. Git evidence: Any repository owned by the student is evidence of Git
  if (normSkill.toLowerCase() === 'git') {
    return { matches: true, reason: 'Repository source version-controlled with Git' };
  }

  // 2. Direct topic match (High confidence)
  if (matcher.topics) {
    for (const t of matcher.topics) {
      if (repoTopics.includes(t)) {
        return { matches: true, reason: `Tagged with repository topic "${t}"` };
      }
    }
  }

  // 3. Primary language match
  if (matcher.languages) {
    for (const l of matcher.languages) {
      if (repoLang.toLowerCase() === l.toLowerCase()) {
        return { matches: true, reason: `Primary repository language is ${repoLang}` };
      }
    }
  }

  // 4. Name keyword match
  if (matcher.nameKeywords) {
    for (const k of matcher.nameKeywords) {
      if (k.length >= 3 && (repoName.includes(k) || repoDesc.includes(k))) {
        return { matches: true, reason: `Repository name/description indicates ${skillName} implementation` };
      }
    }
  }

  return { matches: false, reason: '' };
}

/**
 * Fetch and analyze student's GitHub technical evidence
 */
export async function analyzeStudentGitHubEvidence(
  userId: number,
  forceRefresh: boolean = false
): Promise<GitHubEvidenceSummary> {
  // 1. Get user profile
  const profile = db.prepare('SELECT github_url FROM profiles WHERE user_id = ?').get(userId) as { github_url: string | null } | undefined;
  const username = extractGithubUsername(profile?.github_url);

  if (!username) {
    return {
      connected: false,
      username: null,
      profileUrl: null,
      analyzedAt: new Date().toISOString(),
      totalRepos: 0,
      primaryLanguages: {},
      skillEvidence: [],
      discoveredTech: [],
      generalInsights: ['Connect GitHub to analyze your project evidence.'],
      available: true
    };
  }

  const profileUrl = `https://github.com/${username}`;

  // 2. Check cache unless forceRefresh
  if (!forceRefresh) {
    try {
      const cached = db.prepare(`
        SELECT evidence_json, analyzed_at,
               (strftime('%s', 'now') - strftime('%s', analyzed_at)) as age_seconds
        FROM github_evidence_cache
        WHERE user_id = ? AND github_username = ?
      `).get(userId, username) as { evidence_json: string; age_seconds: number } | undefined;

      if (cached && cached.age_seconds < 4 * 3600) {
        const parsed = JSON.parse(cached.evidence_json);
        return {
          ...parsed,
          cached: true
        };
      }
    } catch (err) {
      console.error('Error reading GitHub cache:', err);
    }
  }

  // 3. Query GitHub REST API
  let rawRepos: any[] = [];
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'SkillPathAI-CareerEngine'
    };

    if (process.env.GITHUB_TOKEN?.trim()) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN.trim()}`;
    }

    const apiUrl = `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=30&type=owner`;
    const res = await fetch(apiUrl, { headers });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const errMsg = errJson?.message || `GitHub API responded with status ${res.status}`;
      console.error(`GitHub API error for ${username}:`, errMsg);

      return {
        connected: true,
        username,
        profileUrl,
        analyzedAt: new Date().toISOString(),
        totalRepos: 0,
        primaryLanguages: {},
        skillEvidence: [],
        discoveredTech: [],
        generalInsights: ['GitHub analysis is temporarily unavailable. Your profile itself remains unchanged.'],
        available: false,
        error: errMsg
      };
    }

    rawRepos = await res.json();
  } catch (netErr: any) {
    console.error('GitHub API network exception:', netErr);
    return {
      connected: true,
      username,
      profileUrl,
      analyzedAt: new Date().toISOString(),
      totalRepos: 0,
      primaryLanguages: {},
      skillEvidence: [],
      discoveredTech: [],
      generalInsights: ['GitHub analysis is temporarily unavailable. Your profile itself remains unchanged.'],
      available: false,
      error: netErr?.message || 'Network connection failed'
    };
  }

  // 4. Map sanitized repository list
  const repos: GitHubRepository[] = rawRepos
    .filter((r: any) => r && r.name && r.html_url)
    .map((r: any) => ({
      name: r.name,
      fullName: r.full_name || `${username}/${r.name}`,
      htmlUrl: r.html_url,
      description: r.description || null,
      language: r.language || null,
      topics: Array.isArray(r.topics) ? r.topics : [],
      stars: r.stargazers_count || 0,
      forks: r.forks_count || 0,
      updatedAt: r.updated_at || r.pushed_at || new Date().toISOString(),
      isFork: Boolean(r.fork)
    }));

  // Language count breakdown
  const primaryLanguages: { [lang: string]: number } = {};
  for (const r of repos) {
    if (r.language) {
      primaryLanguages[r.language] = (primaryLanguages[r.language] || 0) + 1;
    }
  }

  // 5. Retrieve student's declared skills from database
  const declaredSkills = db.prepare(`
    SELECT s.id, s.name, s.category,
           COALESCE(ss.self_proficiency, 0) as self_proficiency,
           ss.assessed_proficiency,
           COALESCE(ss.computed_proficiency, ss.self_proficiency, 0) as computed_proficiency
    FROM skills s
    LEFT JOIN student_skills ss ON s.id = ss.skill_id AND ss.user_id = ?
    WHERE s.is_active = 1
    ORDER BY s.category ASC, s.name ASC
  `).all(userId) as {
    id: number;
    name: string;
    category: string;
    self_proficiency: number;
    assessed_proficiency: number | null;
    computed_proficiency: number;
  }[];

  const skillEvidence: SkillEvidenceItem[] = [];
  const recognizedTechNames = new Set<string>();

  for (const skill of declaredSkills) {
    recognizedTechNames.add(skill.name.toLowerCase());

    const supportingRepos: SupportingRepository[] = [];

    for (const repo of repos) {
      const match = checkRepoEvidence(repo, skill.name);
      if (match.matches) {
        supportingRepos.push({
          name: repo.name,
          fullName: repo.fullName,
          htmlUrl: repo.htmlUrl,
          description: repo.description,
          language: repo.language,
          stars: repo.stars,
          matchReason: match.reason
        });
      }
    }

    let evidenceLevel: EvidenceLevel = 'No Evidence Detected';
    let factualInsight = '';

    if (supportingRepos.length >= 2) {
      evidenceLevel = 'Strong Evidence';
      factualInsight = `${skill.name} project evidence detected in ${supportingRepos.length} repositories.`;
    } else if (supportingRepos.length === 1) {
      evidenceLevel = 'Moderate Evidence';
      factualInsight = `${skill.name} project evidence detected in 1 repository (${supportingRepos[0].name}).`;
    } else {
      evidenceLevel = 'No Evidence Detected';
      if (skill.self_proficiency > 0) {
        factualInsight = `Your profile lists ${skill.name} as a skill (${skill.self_proficiency}%), but no repository with detectable ${skill.name} evidence was found in the available GitHub data.`;
      } else {
        factualInsight = `No ${skill.name} project evidence was detected in the available repositories.`;
      }
    }

    skillEvidence.push({
      skillId: skill.id,
      skillName: skill.name,
      category: skill.category,
      declaredProficiency: skill.self_proficiency,
      testedProficiency: skill.assessed_proficiency,
      computedProficiency: skill.computed_proficiency,
      evidenceLevel,
      supportingRepos,
      factualInsight
    });
  }

  // 6. Discover technologies present in GitHub but not listed by student
  const discoveredTech: DiscoveredTechItem[] = [];
  const candidateTechMap: Map<string, { count: number; repos: { name: string; htmlUrl: string }[] }> = new Map();

  for (const repo of repos) {
    // Check primary languages
    if (repo.language && !recognizedTechNames.has(repo.language.toLowerCase())) {
      const existing = candidateTechMap.get(repo.language) || { count: 0, repos: [] };
      existing.count += 1;
      existing.repos.push({ name: repo.name, htmlUrl: repo.htmlUrl });
      candidateTechMap.set(repo.language, existing);
    }

    // Check topics
    for (const topic of repo.topics) {
      const formattedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
      if (!recognizedTechNames.has(topic.toLowerCase()) && topic.length >= 3) {
        const existing = candidateTechMap.get(formattedTopic) || { count: 0, repos: [] };
        existing.count += 1;
        if (!existing.repos.some(r => r.name === repo.name)) {
          existing.repos.push({ name: repo.name, htmlUrl: repo.htmlUrl });
        }
        candidateTechMap.set(formattedTopic, existing);
      }
    }
  }

  for (const [techName, item] of candidateTechMap.entries()) {
    if (item.count >= 1 && !['Github', 'Readme', 'License'].includes(techName)) {
      discoveredTech.push({
        techName,
        repoCount: item.count,
        repos: item.repos,
        recommendationMessage: `${techName}-related project evidence detected in GitHub. Consider adding it to your skills/profile after verification.`
      });
    }
  }

  // General factual insights
  const generalInsights: string[] = [];
  const strongCount = skillEvidence.filter(e => e.evidenceLevel === 'Strong Evidence').length;
  const modCount = skillEvidence.filter(e => e.evidenceLevel === 'Moderate Evidence').length;

  if (strongCount > 0 || modCount > 0) {
    generalInsights.push(
      `Project evidence verified for ${strongCount + modCount} declared engineering skills across ${repos.length} public repositories.`
    );
  }

  if (discoveredTech.length > 0) {
    generalInsights.push(
      discoveredTech[0].recommendationMessage
    );
  }

  const resultSummary: GitHubEvidenceSummary = {
    connected: true,
    username,
    profileUrl,
    analyzedAt: new Date().toISOString(),
    totalRepos: repos.length,
    primaryLanguages,
    skillEvidence,
    discoveredTech: discoveredTech.slice(0, 5), // top 5 recommendations
    generalInsights,
    available: true
  };

  // 7. Save in cache
  try {
    db.prepare(`
      INSERT INTO github_evidence_cache (user_id, github_username, evidence_json, analyzed_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        github_username = excluded.github_username,
        evidence_json = excluded.evidence_json,
        analyzed_at = CURRENT_TIMESTAMP
    `).run(userId, username, JSON.stringify(resultSummary));
  } catch (cacheErr) {
    console.error('Error writing GitHub evidence cache:', cacheErr);
  }

  return resultSummary;
}
