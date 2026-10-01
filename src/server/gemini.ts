import { GoogleGenAI } from '@google/genai';
import { db } from './db.js';
import { calculateSkillGaps } from './engines/skillGapEngine.js';
import { calculateCareerReadiness } from './engines/careerReadinessEngine.js';
import { determineNextBestAction } from './engines/nextBestActionEngine.js';

const apiKey = process.env.GEMINI_API_KEY;
const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  'gemini-flash-latest'
].filter((v, i, a) => a.indexOf(v) === i);

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Builds authentic, verified student context strictly from database records
 */
export function buildMentorStudentContext(userId: number) {
  const profile = db.prepare(`
    SELECT p.*, c.title as career_title, c.description as career_description
    FROM profiles p
    LEFT JOIN careers c ON p.career_goal_id = c.id
    WHERE p.user_id = ?
  `).get(userId) as any;

  const gaps = calculateSkillGaps(userId);
  const readiness = calculateCareerReadiness(userId);
  const nextAction = determineNextBestAction(userId);

  const projects = db.prepare(`
    SELECT sp.id, sp.status, sp.github_repo_url, sp.live_demo_url, sp.notes,
           p.title, p.description, p.technologies_json, p.difficulty
    FROM student_projects sp
    JOIN projects p ON sp.project_id = p.id
    WHERE sp.user_id = ?
  `).all(userId) as any[];

  let customProjects: any[] = [];
  try {
    if (profile?.custom_projects_json) {
      customProjects = JSON.parse(profile.custom_projects_json);
    }
  } catch {}

  const roadmap = db.prepare('SELECT id, career_id, title FROM roadmaps WHERE user_id = ?').get(userId) as any;
  let roadmapItems: any[] = [];
  if (roadmap) {
    roadmapItems = db.prepare(`
      SELECT id, phase_number, phase_title, title, status, estimated_hours, order_index
      FROM roadmap_items
      WHERE roadmap_id = ?
      ORDER BY phase_number, order_index
    `).all(roadmap.id) as any[];
  }
  const completedRoadmapCount = roadmapItems.filter(i => i.status === 'completed').length;
  const totalRoadmapCount = roadmapItems.length;
  const activeMilestoneItem = roadmapItems.find(i => i.status === 'available' || i.status === 'in_progress');
  const activeRoadmapMilestone = activeMilestoneItem?.title || (roadmapItems[0]?.title || 'Foundations Milestone');

  const ghCache = db.prepare('SELECT github_username, evidence_json FROM github_evidence_cache WHERE user_id = ?').get(userId) as any;
  let githubEvidence = null;
  if (ghCache?.evidence_json) {
    try {
      githubEvidence = JSON.parse(ghCache.evidence_json);
    } catch {}
  }

  let careerPriorities: string[] = [];
  try {
    if (profile?.career_priorities) {
      careerPriorities = JSON.parse(profile.career_priorities);
    }
  } catch {}

  const topGap = gaps.find(g => g.priority === 'High' && g.gap > 0) || gaps[0];
  const isProfileComplete = Boolean(profile?.onboarding_completed || (profile?.career_goal_id && gaps.length > 0));

  const allProjects = [
    ...projects.map(p => ({
      title: p.title,
      status: p.status,
      tech: p.technologies_json,
      github: p.github_repo_url,
      live: p.live_demo_url
    })),
    ...customProjects.map((p: any) => ({
      title: p.name || p.title,
      status: p.status || 'in_progress',
      tech: p.technologies,
      github: p.githubUrl,
      live: p.liveUrl
    }))
  ];

  return {
    isProfileComplete,
    fullName: profile?.full_name || 'Student',
    location: profile?.location || null,
    degree: profile?.degree || null,
    branch: profile?.branch || null,
    college: profile?.college || null,
    currentYear: profile?.current_year || null,
    currentSemester: profile?.current_semester || null,
    cgpa: profile?.cgpa || null,
    careerTrack: profile?.career_title || (profile?.custom_career_goal ? profile.custom_career_goal : 'Software Engineering'),
    careerTrackDescription: profile?.career_description || null,
    careerPriorities,
    weeklyHours: profile?.weekly_hours || 15,
    learningPace: profile?.learning_pace || 'moderate',
    learningPreference: profile?.learning_preference || 'Mixed',
    preferredWorkMode: profile?.preferred_work_mode || 'remote',
    readinessScore: readiness.overallScore,
    readinessLabel: readiness.label,
    readinessComponents: readiness.components,
    nextBestAction: nextAction,
    topGap: topGap ? {
      skillName: topGap.skillName,
      currentProficiency: topGap.currentProficiency,
      requiredProficiency: topGap.requiredProficiency,
      gap: topGap.gap,
      priority: topGap.priority,
      status: topGap.status
    } : null,
    allGaps: gaps.map(g => ({
      skill: g.skillName,
      current: `${g.currentProficiency}%`,
      required: `${g.requiredProficiency}%`,
      gap: `${g.gap}%`,
      priority: g.priority,
      status: g.status
    })),
    roadmapProgress: {
      title: roadmap?.title || 'Personalized Career Roadmap',
      completed: completedRoadmapCount,
      total: totalRoadmapCount,
      percentage: totalRoadmapCount > 0 ? Math.round((completedRoadmapCount / totalRoadmapCount) * 100) : 0,
      activeMilestone: activeRoadmapMilestone
    },
    projects: allProjects,
    github: {
      username: profile?.github_url || ghCache?.github_username || null,
      evidenceLevel: githubEvidence?.evidenceLevel || 'No Evidence Detected',
      analyzedReposCount: githubEvidence?.repos?.length || 0,
      detectedSkills: githubEvidence?.skillsDetected || []
    }
  };
}

/**
 * Builds prompt instructions ensuring the AI answers the user question directly first
 */
function buildSystemInstruction(context: ReturnType<typeof buildMentorStudentContext>): string {
  return `You are SkillPath AI Career Mentor, an expert engineering mentor, coding tutor, and career strategist.
You guide university students toward technical mastery, coding excellence, and high-impact software careers.

AUTHENTIC STUDENT DATABASE RECORDS (FOR GROUNDING):
- Name: ${context.fullName}
- Target Career Track: ${context.careerTrack}
- Top Active Skill Gap: ${context.topGap ? `${context.topGap.skillName} (Current: ${context.topGap.currentProficiency}%, Required: ${context.topGap.requiredProficiency}%, Gap: ${context.topGap.gap}%)` : 'None'}
- Next Best Action: ${context.nextBestAction.actionTitle} (${context.nextBestAction.estimatedMinutes} mins)
- Career Readiness: ${context.readinessScore}% (${context.readinessLabel})
- Weekly Available Time: ${context.weeklyHours} hours/week
- Roadmap Progress: ${context.roadmapProgress.completed}/${context.roadmapProgress.total} completed (${context.roadmapProgress.percentage}%)

CRITICAL OPERATIONAL RULES:
1. ANSWER THE USER QUESTION DIRECTLY FIRST:
   - When the user asks for code, debugging, concepts, DSA, algorithms, or technical tutorials (e.g. "give me c code sorting", "explain pointers", "fix this error"):
     START DIRECTLY with the requested code, explanation, and technical solution.
   - NEVER start with a generic greeting, profile summary, or recitation of their name/readiness stats unless they explicitly ask for it!
   - The student context is SECONDARY context. Only connect to their career track or roadmap when naturally helpful (e.g., a 1-sentence note at the end).

2. CODE QUALITY:
   - For all code snippets, ALWAYS wrap in markdown code blocks with the exact language identifier (e.g. \`\`\`c, \`\`\`python, \`\`\`javascript, \`\`\`sql).
   - Write clean, idiomatic, fully functional code with clear comments.
   - Provide explanation, time/space complexity, and a small practice exercise or edge cases.

3. SPECIALIZED QUERIES:
   - "What should I learn today?": Give today's 4-part plan based on their Next Best Action (${context.nextBestAction.actionTitle}): 1. Learn, 2. Practice, 3. Build, 4. Review.
   - "Why is my top skill gap high priority?": Use their exact gap numbers (${context.topGap?.skillName}: ${context.topGap?.currentProficiency}% to ${context.topGap?.requiredProficiency}%).
   - "What project should I build next?": Recommend a project addressing their real skill gap with features, tech stack, and recruiter checklist.
   - "Explain simpler": Give a clear, intuitive explanation with a real-world analogy.
   - "Go deeper": Provide low-level mechanics, memory layout, time/space complexity, and production best practices.

4. TRUTH & INTEGRITY:
   - Distinguish real database facts from suggestions. Never invent fake completions, fake repositories, or fake certifications.`;
}

/**
 * Intelligent deterministic fallback covering all intent categories
 */
function generateDeterministicMentorReply(context: ReturnType<typeof buildMentorStudentContext>, userMessage: string, history: { role: string; content: string }[] = []): string {
  const lower = userMessage.toLowerCase();

  // 1. Coding & DSA Intent: C Sorting Code
  if ((lower.includes('c code') || lower.includes('in c') || lower.includes('c program')) && (lower.includes('sort') || lower.includes('bubble') || lower.includes('algorithm'))) {
    return `### Sorting in C: Bubble Sort & Quick Sort Implementation

Here is a clean, complete C program demonstrating **Bubble Sort**, which is the foundational comparison-based sorting algorithm:

\`\`\`c
#include <stdio.h>

// Function to swap two integers
void swap(int *xp, int *yp) {
    int temp = *xp;
    *xp = *yp;
    *yp = temp;
}

// Function to implement Bubble Sort
void bubbleSort(int arr[], int n) {
    int i, j;
    int swapped;
    
    for (i = 0; i < n - 1; i++) {
        swapped = 0;
        // Last i elements are already in place
        for (j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(&arr[j], &arr[j + 1]);
                swapped = 1;
            }
        }
        // If no two elements were swapped by inner loop, array is sorted
        if (swapped == 0)
            break;
    }
}

// Function to print an array
void printArray(int arr[], int size) {
    for (int i = 0; i < size; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
}

int main() {
    int data[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(data) / sizeof(data[0]);

    printf("Original array: \\n");
    printArray(data, n);

    bubbleSort(data, n);

    printf("Sorted array: \\n");
    printArray(data, n);

    return 0;
}
\`\`\`

---

### How It Works:
1. **Adjacent Comparisons:** In every pass, adjacent elements are compared and swapped if they are in the wrong order.
2. **Bubbling Up:** The largest unsorted value &ldquo;bubbles up&rdquo; to its final position at the end of the array.
3. **Early Termination:** The \`swapped\` flag stops the algorithm early if the array becomes sorted before all passes finish.

### Complexity Analysis:
* **Time Complexity:**
  * **Best Case:** $O(n)$ (when already sorted)
  * **Average & Worst Case:** $O(n^2)$ (reverse sorted)
* **Space Complexity:** $O(1)$ (in-place sorting)

### Practice Challenge:
Try modifying the \`bubbleSort\` function to sort the elements in **descending order** by reversing the comparison operator (\`arr[j] < arr[j + 1]\`).`;
  }

  // 2. Simpler Explanation Intent
  if (lower.includes('simpler') || lower.includes('simple') || lower.includes('beginner') || lower.includes('analogy')) {
    return `### Simplified Explanation

Let's break this down using a simple real-world analogy:

Imagine you have a line of students of different heights standing in front of you, and you want to arrange them from shortest to tallest:

1. **Step 1 (First Pair):** Look at the first two students. If the person on the left is taller than the person on the right, have them swap places.
2. **Step 2 (Move Down the Line):** Move to the next pair (2nd and 3rd student) and do the same comparison.
3. **Step 3 (One Full Pass):** By the time you reach the end of the line, the tallest person is guaranteed to be standing at the very back.
4. **Step 4 (Repeat):** Go back to the front and repeat for the remaining students until no one needs to swap.

### Key Takeaway:
* We compare items in pairs.
* The biggest items move toward the back one step at a time.
* When a full pass happens without any swaps, everyone is in order!`;
  }

  // 3. Deeper / Architectural Intent
  if (lower.includes('deeper') || lower.includes('deeply') || lower.includes('under the hood') || lower.includes('architecture')) {
    return `### In-Depth Technical Mechanics & Edge Cases

When analyzing algorithm performance and systems-level execution:

1. **Cache Locality & Memory Access:**
   * Contiguous array access benefits from CPU L1/L2 cache prefetching because memory reads are sequential ($\text{arr}[j]$ followed by $\text{arr}[j+1]$).
   * However, excessive write operations (swaps) invalidate cache lines, making algorithms like QuickSort or MergeSort superior for larger datasets.

2. **Stability:**
   * The implementation is **stable** because identical elements are never swapped (\`arr[j] > arr[j + 1]\` uses strict inequality), preserving their original relative order.

3. **Production Standard ($O(n \\log n)$):**
   * For production C codebases, standard library \`qsort\` from \`<stdlib.h>\` should be preferred over $O(n^2)$ algorithms.

Would you like me to show how to use \`qsort\` with custom comparator functions in C?`;
  }

  // 4. Today / Study Plan Intent
  if (lower.includes('today') || lower.includes('what should i learn') || lower.includes('study plan') || lower.includes('what should i do')) {
    const act = context.nextBestAction;
    return `### 🎯 Today's Action Plan: ${act.actionTitle}
* **Target Track:** ${context.careerTrack}
* **Active Phase:** ${act.phaseTitle}
* **Estimated Time:** ${act.estimatedMinutes} minutes
* **Why this matters:** ${act.whyExplanation}

---

### Step-by-Step Breakdown:
1. **Learn (${Math.round(act.estimatedMinutes * 0.35)} mins):** Review foundational architectural concepts and syntax in the Learning Resources tab.
2. **Practice (${Math.round(act.estimatedMinutes * 0.35)} mins):** ${act.stepAfter}
3. **Build & Apply (${Math.round(act.estimatedMinutes * 0.30)} mins):** ${act.stepThen}

Would you like me to generate specific coding exercises or explain the core concepts of **${act.skillName}**?`;
  }

  // 5. Skill Gap Intent
  if (lower.includes('gap') || lower.includes('priority') || lower.includes('why is')) {
    const top = context.topGap;
    if (!top) {
      return `You currently have no critical skill gaps recorded for your **${context.careerTrack}** path. Keep building projects to maintain high readiness!`;
    }
    return `### Why ${top.skillName} is Your Highest Priority

* **Current Proficiency:** **${top.currentProficiency}%**
* **Target Industry Level:** **${top.requiredProficiency}%**
* **Active Gap:** **${top.gap} percentage points** (${top.priority} Priority)

---

### Why SkillPath Prioritizes This:
1. **Core Career Requirement:** ${top.skillName} is an essential prerequisite for junior to mid-level engineering roles in **${context.careerTrack}**.
2. **Roadmap Milestone Dependency:** Upcoming engineering milestones in your roadmap directly build on top of ${top.skillName}.
3. **Portfolio & Interview Value:** Technical interview rounds routinely assess real-world application of ${top.skillName}.

**Recommended Next Step:** Head over to **Learning Resources** to watch verified video tutorials or ask me to explain ${top.skillName} step-by-step!`;
  }

  // 6. Project Intent
  if (lower.includes('project') || lower.includes('build next') || lower.includes('portfolio')) {
    const targetSkill = context.topGap?.skillName || 'REST APIs';
    return `### Recommended Project: Production ${context.careerTrack} Service

* **Why this project:** Directly addresses your active skill gap in **${targetSkill}** and demonstrates full-cycle engineering.
* **Difficulty:** Intermediate
* **Estimated Build Time:** 12–16 hours (~2 weeks at ${context.weeklyHours} hrs/week)

---

### Core Specifications:
* **Tech Stack:** React, Tailwind CSS, TypeScript, Node.js, and ${targetSkill}
* **Key Features:**
  1. Responsive frontend with dynamic state management
  2. Integrated database with structured relational/document schema
  3. Secure token-based authentication and input sanitization
  4. Real-time metric filtering and responsive mobile layout

### Recruiter Checklist:
* Clean Git commits with descriptive messages
* Comprehensive \`README.md\` with architecture diagram and live demo link
* Automated component tests or endpoint tests`;
  }

  // 7. Readiness / Internship Intent
  if (lower.includes('ready') || lower.includes('readiness') || lower.includes('internship')) {
    const r = context.readinessComponents;
    return `### Career Readiness Breakdown (${context.readinessScore}% - ${context.readinessLabel})

Here is how your readiness score is computed from verified student evidence:
* **Technical Skills:** **${r.skills.score}%** (Weight: 30%) — *${r.skills.explanation}*
* **Project Evidence:** **${r.projects.score}%** (Weight: 20%) — *${r.projects.explanation}*
* **Skill Assessments:** **${r.assessments.score}%** (Weight: 20%) — *${r.assessments.explanation}*
* **DSA & Problem Solving:** **${r.dsa.score}%** (Weight: 15%) — *${r.dsa.explanation}*
* **Profile Completeness:** **${r.profile.score}%** (Weight: 15%)

**Action to Reach 75%+:** Focus on completing your active roadmap project and taking technical verification quizzes for high-priority skills.`;
  }

  // 8. General Coding & Technical Assistance
  return `### Technical Guidance: ${userMessage.slice(0, 40)}

Here are the key engineering principles for this topic:

1. **Core Concept:** Break the problem down into input constraints, expected output, and edge conditions (e.g. empty inputs, null pointers, boundary limits).
2. **Implementation:** Start with a clean, correct working implementation before attempting premature optimization.
3. **Verification:** Test against both standard test cases and edge cases.

Feel free to paste a specific code snippet or error message, and I'll debug and explain the exact fix!`;
}

/**
 * Standard conversational response with automatic model fallback
 */
export async function askCareerMentorAI(userId: number, userMessage: string, history: { role: string; content: string }[] = []) {
  const context = buildMentorStudentContext(userId);
  const systemInstruction = buildSystemInstruction(context);

  if (!ai || !apiKey) {
    return generateDeterministicMentorReply(context, userMessage, history);
  }

  const formattedContents = [
    ...history.slice(-10).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    })),
    {
      role: 'user',
      parts: [{ text: userMessage }]
    }
  ];

  for (const m of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: m,
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.3,
        }
      });

      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`Model ${m} encountered error, trying next candidate:`, err?.status || err?.message?.slice(0, 80));
    }
  }

  return generateDeterministicMentorReply(context, userMessage, history);
}

/**
 * Streaming response generator with multi-model fallback and progressive chunking
 */
export async function streamCareerMentorAI(
  userId: number,
  userMessage: string,
  history: { role: string; content: string }[] = [],
  onChunk: (text: string) => void
) {
  const context = buildMentorStudentContext(userId);
  const systemInstruction = buildSystemInstruction(context);

  const formattedContents = [
    ...history.slice(-10).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    })),
    {
      role: 'user',
      parts: [{ text: userMessage }]
    }
  ];

  if (ai && apiKey) {
    for (const m of CANDIDATE_MODELS) {
      try {
        let streamWorked = false;
        const responseStream = await ai.models.generateContentStream({
          model: m,
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.3,
          }
        });

        for await (const chunk of responseStream) {
          if (chunk.text) {
            streamWorked = true;
            onChunk(chunk.text);
          }
        }

        if (streamWorked) {
          return;
        }
      } catch (err: any) {
        console.warn(`Streaming with model ${m} failed, trying next candidate:`, err?.status || err?.message?.slice(0, 80));
      }
    }
  }

  // Fallback progressive streaming
  const fallbackText = generateDeterministicMentorReply(context, userMessage, history);
  const words = fallbackText.split(' ');
  for (let i = 0; i < words.length; i += 4) {
    const slice = words.slice(i, i + 4).join(' ') + ' ';
    onChunk(slice);
    await new Promise(r => setTimeout(r, 20));
  }
}

/**
 * Deep Profile analysis for the Analytics tab
 */
export async function analyzeProfileWithAI(userId: number) {
  const context = buildMentorStudentContext(userId);

  if (!ai || !apiKey) {
    return {
      currentProfile: `Enrolled in ${context.degree || 'Degree'} (${context.branch || 'Branch'}) at ${context.college || 'University'}. Target career track is ${context.careerTrack}.`,
      strengths: context.allGaps.filter(g => parseInt(g.current) >= 70).map(g => `${g.skill} (${g.current})`),
      skillGaps: context.allGaps.filter(g => parseInt(g.gap) > 0).map(g => ({
        skill: g.skill,
        gap: g.gap,
        priority: g.priority,
        action: `Complete ${g.skill} modules to unlock next phase`
      })),
      priorityFocus: context.allGaps.filter(g => g.priority === 'High').map(g => g.skill).slice(0, 3),
      recommendations: [
        `Focus immediate attention on ${context.nextBestAction.actionTitle} (${context.nextBestAction.estimatedMinutes} min estimated).`,
        `Build real project evidence to elevate your project readiness score from ${context.readinessComponents.projects.score}%.`,
        `Attempt verified technical assessments once basic skill modules reach 40%+ proficiency.`
      ],
      careerReadinessSummary: `Analytical Career Readiness: ${context.readinessScore}% (${context.readinessLabel}). Skills: ${context.readinessComponents.skills.score}%, Projects: ${context.readinessComponents.projects.score}%, Assessments: ${context.readinessComponents.assessments.score}%.`
    };
  }

  const prompt = `You are the lead career guidance intelligence inside SkillPath AI.
Analyze the following student profile and structured skill records strictly based on provided facts.
Do NOT invent fake skills, awards, or internship achievements.
Return a structured JSON object with keys:
- currentProfile: (concise 2-sentence summary)
- strengths: (array of strings)
- skillGaps: (array of objects with { skill, gap, priority, action })
- priorityFocus: (array of 3 strings representing the highest priority skills to tackle first)
- recommendations: (array of 3 specific, actionable recommendations)
- careerReadinessSummary: (concise assessment of current readiness and what moves the needle)

Student Context:
${JSON.stringify(context, null, 2)}`;

  for (const m of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: m,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.currentProfile) return parsed;
    } catch (err: any) {
      console.warn(`Profile analysis with model ${m} failed, trying next candidate`);
    }
  }

  return {
    currentProfile: `${context.fullName} is pursuing ${context.careerTrack} with a current readiness indicator of ${context.readinessScore}%.`,
    strengths: context.allGaps.filter(g => parseInt(g.current) >= 70).map(g => g.skill),
    skillGaps: context.allGaps.filter(g => parseInt(g.gap) > 0).map(g => ({ skill: g.skill, gap: g.gap, priority: g.priority, action: 'Review resources & practice' })),
    priorityFocus: context.allGaps.filter(g => g.priority === 'High').map(g => g.skill).slice(0, 3),
    recommendations: [`Execute next best action: ${context.nextBestAction.actionTitle}`, 'Take technical quizzes on in-progress skills'],
    careerReadinessSummary: `Readiness Score: ${context.readinessScore}% (${context.readinessLabel})`
  };
}
