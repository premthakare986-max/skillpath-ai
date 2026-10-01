import React, { useState, useEffect } from 'react';
import {
  User, GraduationCap, Briefcase, Award, Code2, FolderGit2,
  CheckCircle2, ChevronRight, ChevronLeft, ArrowRight, ArrowLeft,
  Sparkles, Clock, Globe, Shield, Terminal, Cpu, Database, Cloud,
  Smartphone, Palette, CheckSquare, Search, Plus, Trash2,
  ExternalLink, Sliders, Info, Check, Layers, Layout, Server,
  TrendingUp, BarChart3, GitBranch, Gamepad2, Coins, Wifi, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { Career, Skill } from '../../types.js';
import { PersonalizedPriorityTopic } from '../../server/engines/roadmapEngine.js';

interface OnboardingPageProps {
  onNavigate: (path: string) => void;
}

interface ProjectInput {
  name: string;
  description: string;
  technologies: string;
  githubUrl: string;
  liveUrl: string;
}

interface CertInput {
  name: string;
  issuer: string;
  completionDate: string;
  certificateUrl: string;
}

interface ExpInput {
  role: string;
  organization: string;
  duration: string;
  type: string;
  description: string;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onNavigate }) => {
  const { user, refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 10;
  const [saving, setSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Catalogs from backend
  const [careersList, setCareersList] = useState<Career[]>([]);
  const [skillsCatalog, setSkillsCatalog] = useState<Skill[]>([]);

  // Step 1: Personal Details
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [location, setLocation] = useState('Bengaluru, India');
  const [college, setCollege] = useState('National Institute of Technology');
  const [degree, setDegree] = useState('B.Tech / B.E.');
  const [branch, setBranch] = useState('Computer Science & Engineering');
  const [currentYear, setCurrentYear] = useState('2nd Year');
  const [currentSemester, setCurrentSemester] = useState('4th Semester');

  // Step 2: Academic Performance
  const [cgpa, setCgpa] = useState('8.2');
  const [semesterMarks, setSemesterMarks] = useState<Array<{ semester: string; gpa: string }>>([
    { semester: 'Semester 1', gpa: '8.0' },
    { semester: 'Semester 2', gpa: '8.2' },
    { semester: 'Semester 3', gpa: '8.4' },
    { semester: 'Semester 4', gpa: '8.3' }
  ]);

  // Step 3: Career Goal
  const [careerGoalId, setCareerGoalId] = useState<number>(1);
  const [customCareerGoal, setCustomCareerGoal] = useState('');
  const [isCustomCareer, setIsCustomCareer] = useState(false);

  // Step 4: Technical Skills (skillId -> proficiency percentage 0-100)
  const [skillRatings, setSkillRatings] = useState<Record<number, number>>({});
  const [skillCategoryFilter, setSkillCategoryFilter] = useState('All');
  const [skillSearch, setSkillSearch] = useState('');

  // Step 5: Projects
  const [projects, setProjects] = useState<ProjectInput[]>([
    {
      name: 'Interactive Developer Portfolio',
      description: 'Responsive personal portfolio showcasing projects, interactive animations, and responsive contact forms.',
      technologies: 'HTML5, CSS3, JavaScript, React',
      githubUrl: 'https://github.com/student/portfolio',
      liveUrl: 'https://student-portfolio.vercel.app'
    }
  ]);

  // Step 6: Certifications
  const [certifications, setCertifications] = useState<CertInput[]>([
    {
      name: 'Responsive Web Design Certification',
      issuer: 'freeCodeCamp',
      completionDate: '2025-11',
      certificateUrl: ''
    }
  ]);

  // Step 7: Experience
  const [experiences, setExperiences] = useState<ExpInput[]>([
    {
      role: 'Web Development Intern',
      organization: 'TechVibe Solutions',
      duration: '3 months',
      type: 'Internship',
      description: 'Built reusable frontend components and integrated REST APIs using React.'
    }
  ]);

  // Step 8: Developer Profiles
  const [githubUrl, setGithubUrl] = useState('https://github.com/rohit-sharma-dev');
  const [linkedinUrl, setLinkedinUrl] = useState('https://linkedin.com/in/rohit-sharma-student');

  // Step 9: Learning Preferences
  const [workMode, setWorkMode] = useState<string>('Remote');
  const [weeklyHours, setWeeklyHours] = useState<string>('15–20 hours');
  const [learningPace, setLearningPace] = useState<string>('Moderate');
  const [learningPreference, setLearningPreference] = useState<string>('Videos');
  const [careerPriorities, setCareerPriorities] = useState<string[]>(['Internship', 'Projects']);

  // Step 10: Dynamic Roadmap Preview State
  const [roadmapPreview, setRoadmapPreview] = useState<{
    careerTitle: string;
    priorityTopics: PersonalizedPriorityTopic[];
    weeklySummary: string;
  } | null>(null);

  // Fetch Careers & Skills on mount
  useEffect(() => {
    fetch('/api/careers')
      .then(res => res.json())
      .then(d => {
        if (d.careers) {
          setCareersList(d.careers);
          if (d.careers[0]?.id && !careerGoalId) {
            setCareerGoalId(d.careers[0].id);
          }
        }
      })
      .catch(err => console.error('Error fetching careers:', err));

    fetch('/api/skills')
      .then(res => res.json())
      .then(d => {
        if (d.skills && d.skills.length > 0) {
          setSkillsCatalog(d.skills);
          setSkillRatings(prev => {
            if (Object.keys(prev).length > 0) return prev;
            const initMap: Record<number, number> = {};
            const defaults: [string, number][] = [
              ['HTML', 80],
              ['CSS', 70],
              ['JavaScript', 65],
              ['React', 50],
              ['Git', 60]
            ];
            for (const [key, val] of defaults) {
              const match = d.skills.find((s: Skill) => s.name.toLowerCase().includes(key.toLowerCase()));
              if (match && !initMap[match.id]) {
                initMap[match.id] = val;
              }
            }
            return initMap;
          });
        }
      })
      .catch(err => console.error('Error fetching skills:', err));
  }, []);

  // Fetch Dynamic Roadmap Preview when reaching Step 10
  const fetchRoadmapPreview = async () => {
    setPreviewLoading(true);
    try {
      const skillsArray = Object.entries(skillRatings).map(([id, prof]) => ({
        skillId: Number(id),
        proficiency: prof
      }));

      // Parse weekly hours number
      let hoursNum = 15;
      if (weeklyHours.includes('5–10')) hoursNum = 8;
      else if (weeklyHours.includes('10–15')) hoursNum = 12;
      else if (weeklyHours.includes('15–20')) hoursNum = 18;
      else if (weeklyHours.includes('20–25')) hoursNum = 22;
      else if (weeklyHours.includes('25+')) hoursNum = 28;

      const payload = {
        careerGoalId: isCustomCareer ? null : careerGoalId,
        customCareerGoal: isCustomCareer ? customCareerGoal : '',
        skills: skillsArray,
        projects,
        preferences: {
          workMode,
          weeklyHours: hoursNum,
          learningPace: learningPace.toLowerCase(),
          learningPreference,
          careerPriorities
        }
      };

      const res = await fetch('/api/onboarding/preview-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setRoadmapPreview({
          careerTitle: data.careerTitle,
          priorityTopics: data.priorityTopics || [],
          weeklySummary: data.weeklySummary || ''
        });
      }
    } catch (err) {
      console.error('Error loading roadmap preview:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (currentStep === 10) {
      fetchRoadmapPreview();
    }
  }, [currentStep]);

  // Quick Pre-Fill Sample Profile for Testing
  const handlePreFillSample = () => {
    setFullName('Rohit Sharma');
    setLocation('Bengaluru, Karnataka');
    setCollege('National Institute of Technology');
    setDegree('B.Tech / B.E.');
    setBranch('Computer Science & Engineering');
    setCurrentYear('2nd Year');
    setCurrentSemester('4th Semester');
    setCgpa('8.2');
    setCareerGoalId(1);
    setIsCustomCareer(false);
    setCustomCareerGoal('');
    const sampleRatings: Record<number, number> = {};
    const samplePresets: [string, number][] = [
      ['HTML', 80],
      ['CSS', 75],
      ['Tailwind', 60],
      ['JavaScript', 55],
      ['React', 40],
      ['Git', 65],
      ['SQL', 35]
    ];
    for (const [key, val] of samplePresets) {
      const match = skillsCatalog.find(s => s.name.toLowerCase().includes(key.toLowerCase()));
      if (match) sampleRatings[match.id] = val;
    }
    setSkillRatings(sampleRatings);
    setProjects([
      {
        name: 'Full Stack E-Commerce Catalog',
        description: 'Online product showcase with search, filtering, shopping cart, and mock payment gateway.',
        technologies: 'React, Node.js, Express, MongoDB',
        githubUrl: 'https://github.com/rohit-sharma-dev/ecommerce-catalog',
        liveUrl: 'https://ecommerce-rohit.vercel.app'
      }
    ]);
    setCertifications([
      {
        name: 'Meta Frontend Developer Certificate',
        issuer: 'Coursera / Meta',
        completionDate: '2025-10',
        certificateUrl: 'https://coursera.org/verify/meta-sample'
      }
    ]);
    setExperiences([
      {
        role: 'Frontend Engineering Intern',
        organization: 'PixelCraft Labs',
        duration: '3 months',
        type: 'Internship',
        description: 'Developed modern responsive layouts and collaborated with senior engineers using Git.'
      }
    ]);
    setGithubUrl('https://github.com/rohit-sharma-dev');
    setLinkedinUrl('https://linkedin.com/in/rohit-sharma-student');
    setWorkMode('Remote');
    setWeeklyHours('15–20 hours');
    setLearningPace('Moderate');
    setLearningPreference('Videos');
    setCareerPriorities(['Internship', 'Projects']);
  };

  // Submit and Complete Onboarding
  const handleCompleteOnboarding = async () => {
    setSaving(true);

    const skillsArray = Object.entries(skillRatings).map(([id, prof]) => ({
      skillId: Number(id),
      proficiency: prof
    }));

    let hoursNum = 15;
    if (weeklyHours.includes('5–10')) hoursNum = 8;
    else if (weeklyHours.includes('10–15')) hoursNum = 12;
    else if (weeklyHours.includes('15–20')) hoursNum = 18;
    else if (weeklyHours.includes('20–25')) hoursNum = 22;
    else if (weeklyHours.includes('25+')) hoursNum = 28;

    const payload = {
      personal: {
        fullName: fullName || 'Student',
        location,
        college,
        degree,
        branch,
        currentYear,
        currentSemester
      },
      academic: {
        cgpa: parseFloat(cgpa) || null,
        sgpaHistory: semesterMarks.map(s => ({
          semester: s.semester,
          sgpa: parseFloat(s.gpa) || 0
        }))
      },
      careerGoalId: isCustomCareer ? null : careerGoalId,
      customCareerGoal: isCustomCareer ? customCareerGoal : '',
      skills: skillsArray,
      projects: projects.filter(p => p.name.trim()),
      certifications: certifications.filter(c => c.name.trim()),
      experiences: experiences.filter(e => e.role.trim()),
      profiles: {
        githubUrl: githubUrl.trim(),
        linkedinUrl: linkedinUrl.trim()
      },
      preferences: {
        workMode: workMode.toLowerCase(),
        weeklyHours: hoursNum,
        learningPace: learningPace.toLowerCase(),
        learningPreference,
        careerPriorities
      }
    };

    try {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('skillpath_token')}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await refreshUser();
        onNavigate('/dashboard');
      } else {
        alert('Failed to save profile. Please review your entries.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while completing onboarding.');
    } finally {
      setSaving(false);
    }
  };

  const stepTitles = [
    'Personal Details',
    'Academic Profile',
    'Career Goal',
    'Technical Skills',
    'Projects',
    'Certifications',
    'Experience',
    'Developer Profiles',
    'Learning Preferences',
    'Your Roadmap'
  ];

  // Helper for Career Icons
  const getCareerIcon = (iconName: string) => {
    switch (iconName) {
      case 'Layers': return <Layers className="h-5 w-5 text-blue-400" />;
      case 'Layout': return <Layout className="h-5 w-5 text-indigo-400" />;
      case 'Server': return <Server className="h-5 w-5 text-emerald-400" />;
      case 'Terminal': return <Terminal className="h-5 w-5 text-teal-400" />;
      case 'Cpu': return <Cpu className="h-5 w-5 text-purple-400" />;
      case 'TrendingUp': return <TrendingUp className="h-5 w-5 text-amber-400" />;
      case 'BarChart3': return <BarChart3 className="h-5 w-5 text-orange-400" />;
      case 'Database': return <Database className="h-5 w-5 text-cyan-400" />;
      case 'Cloud': return <Cloud className="h-5 w-5 text-sky-400" />;
      case 'GitBranch': return <GitBranch className="h-5 w-5 text-rose-400" />;
      case 'Shield': return <Shield className="h-5 w-5 text-red-400" />;
      case 'Smartphone': return <Smartphone className="h-5 w-5 text-green-400" />;
      case 'Gamepad2': return <Gamepad2 className="h-5 w-5 text-pink-400" />;
      case 'Palette': return <Palette className="h-5 w-5 text-fuchsia-400" />;
      case 'Coins': return <Coins className="h-5 w-5 text-yellow-400" />;
      case 'Wifi': return <Wifi className="h-5 w-5 text-violet-400" />;
      case 'CheckSquare': return <CheckSquare className="h-5 w-5 text-emerald-400" />;
      default: return <Briefcase className="h-5 w-5 text-blue-400" />;
    }
  };

  // 40 Skills Categories
  const skillCategories = [
    'All',
    'Programming',
    'Web Development',
    'Database',
    'Data & AI',
    'Core CS / DSA',
    'DevOps / Cloud'
  ];

  const filteredSkills = skillsCatalog.filter(s => {
    const matchesCat = skillCategoryFilter === 'All' || s.category.toLowerCase() === skillCategoryFilter.toLowerCase();
    const matchesQuery = s.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(skillSearch.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  return (
    <div className="py-8 sm:py-12 px-3 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      
      {/* Top Progress & Header Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 font-mono">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-slate-600">·</span>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {stepTitles[currentStep - 1]}
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Personalized setup for your SkillPath career plan.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePreFillSample}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-950/30 text-indigo-300 hover:bg-indigo-950/60 text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto min-h-[36px]"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Pre-fill Sample Profile</span>
          </button>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-900 border border-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Step Card Container */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-8 shadow-2xl backdrop-blur-sm min-h-[460px] flex flex-col justify-between">
        
        {/* ==================================================== */}
        {/* STEP 1: PERSONAL DETAILS */}
        {/* ==================================================== */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <User className="h-6 w-6 text-blue-400" />
                <span>Tell us about yourself</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Basic details to initialize your personalized student profile.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rohit Sharma"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none min-h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Current Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, India"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none min-h-[42px]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">University / College</label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="e.g. National Institute of Technology"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none min-h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Degree</label>
                <select
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none min-h-[42px] cursor-pointer"
                >
                  <option value="B.Tech / B.E.">B.Tech / B.E.</option>
                  <option value="BCA">BCA</option>
                  <option value="MCA">MCA</option>
                  <option value="B.Sc Computer Science">B.Sc Computer Science</option>
                  <option value="M.Tech">M.Tech</option>
                  <option value="Other">Other Degree</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Branch / Specialization</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none min-h-[42px] cursor-pointer"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Data Science & Artificial Intelligence">Data Science & Artificial Intelligence</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Other Specialization">Other Specialization</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Current Year</label>
                <select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none min-h-[42px] cursor-pointer"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Recent Graduate">Recent Graduate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Current Semester</label>
                <select
                  value={currentSemester}
                  onChange={(e) => setCurrentSemester(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none min-h-[42px] cursor-pointer"
                >
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                  <option value="3rd Semester">3rd Semester</option>
                  <option value="4th Semester">4th Semester</option>
                  <option value="5th Semester">5th Semester</option>
                  <option value="6th Semester">6th Semester</option>
                  <option value="7th Semester">7th Semester</option>
                  <option value="8th Semester">8th Semester</option>
                  <option value="Graduated">Graduated</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 2: ACADEMIC PROFILE */}
        {/* ==================================================== */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-indigo-400" />
                <span>Your Academic Profile</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Share your college marks for academic eligibility context.
              </p>
            </div>

            {/* Explanatory Note */}
            <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-900/40 text-xs text-blue-300 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <span>Academic performance is used for eligibility and academic context. It does not directly determine your technical skill level.</span>
            </div>

            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Cumulative Grade Point Average (CGPA / 10.0)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  placeholder="e.g. 8.2"
                  className="w-full sm:w-48 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none min-h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Semester-Wise Marks (SGPA / GPA)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {semesterMarks.map((s, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 font-medium block">{s.semester}</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={s.gpa}
                        onChange={(e) => {
                          const updated = [...semesterMarks];
                          updated[idx].gpa = e.target.value;
                          setSemesterMarks(updated);
                        }}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 3: CAREER GOAL */}
        {/* ==================================================== */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-emerald-400" />
                <span>What do you want to become?</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Choose your primary professional engineering role or specify a custom ambition.
              </p>
            </div>

            {/* Custom Career Toggle */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsCustomCareer(false)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[38px] ${
                  !isCustomCareer
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Standard Career Tracks (20)
              </button>
              <button
                type="button"
                onClick={() => setIsCustomCareer(true)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[38px] ${
                  isCustomCareer
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Other / Custom Career Goal
              </button>
            </div>

            {isCustomCareer ? (
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 space-y-3">
                <label className="block text-xs font-medium text-slate-300">
                  Enter Your Custom Career Target
                </label>
                <input
                  type="text"
                  value={customCareerGoal}
                  onChange={(e) => setCustomCareerGoal(e.target.value)}
                  placeholder="e.g. Distributed Systems Architect, Quantitative Developer, Robotics Engineer"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none min-h-[42px]"
                />
                <p className="text-[11px] text-slate-400">
                  SkillPath will dynamically map relevant technical skills and priority topics for your custom goal.
                </p>
              </div>
            ) : (
              /* Grid of 20 Careers */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {careersList.map((c) => {
                  const isSelected = careerGoalId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setCareerGoalId(c.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-500 bg-blue-950/30 shadow-md shadow-blue-500/10'
                          : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getCareerIcon(c.icon)}
                            <h3 className="text-xs font-bold text-white tracking-tight leading-snug">{c.title}</h3>
                          </div>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-400 flex-shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {c.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 4: TECHNICAL SKILLS */}
        {/* ==================================================== */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <Code2 className="h-6 w-6 text-teal-400" />
                <span>What skills do you already know?</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Select the skills you have learned and estimate your current level. You do not need to rate every skill.
              </p>
            </div>

            {/* Search and Category Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  placeholder="Search 40+ skills..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none min-h-[38px]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {skillCategories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSkillCategoryFilter(cat)}
                    className={`text-[11px] px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer min-h-[32px] ${
                      skillCategoryFilter === cat
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Skills Compact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
              {filteredSkills.map((s) => {
                const currentRating = skillRatings[s.id] || 0;
                const isSelected = currentRating > 0;

                return (
                  <div
                    key={s.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-blue-500/50 bg-blue-950/20'
                        : 'border-slate-800/80 bg-slate-950/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white tracking-tight">{s.name}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 font-mono">
                            {s.category}
                          </span>
                        </div>
                      </div>

                      {/* Quick Level Presets */}
                      <span className="text-xs font-mono font-bold text-blue-400">
                        {currentRating}%
                      </span>
                    </div>

                    {/* Quick Button Selector & Slider */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        {[
                          { label: 'None', val: 0 },
                          { label: 'Beginner', val: 35 },
                          { label: 'Mid', val: 65 },
                          { label: 'Adv', val: 90 }
                        ].map((lvl) => (
                          <button
                            key={lvl.label}
                            type="button"
                            onClick={() => {
                              const copy = { ...skillRatings };
                              if (lvl.val === 0) delete copy[s.id];
                              else copy[s.id] = lvl.val;
                              setSkillRatings(copy);
                            }}
                            className={`text-[10px] px-2 py-1 rounded-md transition-colors cursor-pointer ${
                              (lvl.val === 0 && currentRating === 0) || (lvl.val > 0 && Math.abs(currentRating - lvl.val) <= 10)
                                ? 'bg-blue-600 text-white font-bold'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            {lvl.label}
                          </button>
                        ))}
                      </div>

                      {/* Precision Slider */}
                      {isSelected && (
                        <input
                          type="range"
                          min="10"
                          max="100"
                          step="5"
                          value={currentRating}
                          onChange={(e) => {
                            setSkillRatings({
                              ...skillRatings,
                              [s.id]: parseInt(e.target.value)
                            });
                          }}
                          className="w-24 accent-blue-500 cursor-pointer"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 5: PROJECTS */}
        {/* ==================================================== */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <FolderGit2 className="h-6 w-6 text-purple-400" />
                  <span>Show what you&apos;ve built</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Add projects you have built. The first project acts as your main showcase.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setProjects([
                    ...projects,
                    { name: '', description: '', technologies: '', githubUrl: '', liveUrl: '' }
                  ]);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-500/30 bg-purple-950/30 text-purple-300 hover:bg-purple-950/60 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto min-h-[38px]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Another Project</span>
              </button>
            </div>

            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {projects.map((p, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-slate-800 bg-slate-950 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      {idx === 0 ? 'Project 1 (Main Showcase Project)' : `Project ${idx + 1}`}
                    </span>
                    {projects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setProjects(projects.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-red-400 cursor-pointer p-1"
                        title="Remove project"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Project Name</label>
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => {
                          const updated = [...projects];
                          updated[idx].name = e.target.value;
                          setProjects(updated);
                        }}
                        placeholder="e.g. Developer Portfolio"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Technologies Used</label>
                      <input
                        type="text"
                        value={p.technologies}
                        onChange={(e) => {
                          const updated = [...projects];
                          updated[idx].technologies = e.target.value;
                          setProjects(updated);
                        }}
                        placeholder="e.g. React, Tailwind CSS, Node.js"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Short Description</label>
                      <input
                        type="text"
                        value={p.description}
                        onChange={(e) => {
                          const updated = [...projects];
                          updated[idx].description = e.target.value;
                          setProjects(updated);
                        }}
                        placeholder="e.g. Built responsive web application with authentication and persistent cart."
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">GitHub Repository URL</label>
                      <input
                        type="text"
                        value={p.githubUrl}
                        onChange={(e) => {
                          const updated = [...projects];
                          updated[idx].githubUrl = e.target.value;
                          setProjects(updated);
                        }}
                        placeholder="https://github.com/..."
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Live Demo URL</label>
                      <input
                        type="text"
                        value={p.liveUrl}
                        onChange={(e) => {
                          const updated = [...projects];
                          updated[idx].liveUrl = e.target.value;
                          setProjects(updated);
                        }}
                        placeholder="https://my-app.vercel.app"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 6: CERTIFICATIONS */}
        {/* ==================================================== */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Award className="h-6 w-6 text-amber-400" />
                  <span>Certifications & Courses</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Optional certifications and verified technical training credentials.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCertifications([
                    ...certifications,
                    { name: '', issuer: '', completionDate: '', certificateUrl: '' }
                  ]);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-950/30 text-amber-300 hover:bg-amber-950/60 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto min-h-[38px]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Certification</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {certifications.map((c, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-slate-800 bg-slate-950 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Certification #{idx + 1}</span>
                    {certifications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setCertifications(certifications.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-red-400 cursor-pointer p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Certification Name</label>
                      <input
                        type="text"
                        value={c.name}
                        onChange={(e) => {
                          const updated = [...certifications];
                          updated[idx].name = e.target.value;
                          setCertifications(updated);
                        }}
                        placeholder="e.g. AWS Cloud Practitioner"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Issuing Organization</label>
                      <input
                        type="text"
                        value={c.issuer}
                        onChange={(e) => {
                          const updated = [...certifications];
                          updated[idx].issuer = e.target.value;
                          setCertifications(updated);
                        }}
                        placeholder="e.g. Amazon Web Services / Coursera"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Completion Date</label>
                      <input
                        type="month"
                        value={c.completionDate}
                        onChange={(e) => {
                          const updated = [...certifications];
                          updated[idx].completionDate = e.target.value;
                          setCertifications(updated);
                        }}
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Certificate URL (Optional)</label>
                      <input
                        type="text"
                        value={c.certificateUrl}
                        onChange={(e) => {
                          const updated = [...certifications];
                          updated[idx].certificateUrl = e.target.value;
                          setCertifications(updated);
                        }}
                        placeholder="https://..."
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 7: EXPERIENCE */}
        {/* ==================================================== */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Briefcase className="h-6 w-6 text-cyan-400" />
                  <span>Experience</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Internships, open source contributions, freelancing, or student clubs.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setExperiences([
                    ...experiences,
                    { role: '', organization: '', duration: '', type: 'Internship', description: '' }
                  ]);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-950/60 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto min-h-[38px]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Experience</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {experiences.map((exp, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-slate-800 bg-slate-950 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Experience #{idx + 1}</span>
                    {experiences.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setExperiences(experiences.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-red-400 cursor-pointer p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Role / Title</label>
                      <input
                        type="text"
                        value={exp.role}
                        onChange={(e) => {
                          const updated = [...experiences];
                          updated[idx].role = e.target.value;
                          setExperiences(updated);
                        }}
                        placeholder="e.g. Web Development Intern"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Organization / Company</label>
                      <input
                        type="text"
                        value={exp.organization}
                        onChange={(e) => {
                          const updated = [...experiences];
                          updated[idx].organization = e.target.value;
                          setExperiences(updated);
                        }}
                        placeholder="e.g. TechVibe / Open Source"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Type</label>
                      <select
                        value={exp.type}
                        onChange={(e) => {
                          const updated = [...experiences];
                          updated[idx].type = e.target.value;
                          setExperiences(updated);
                        }}
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                      >
                        <option value="Internship">Internship</option>
                        <option value="Open Source">Open Source</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Short Description</label>
                      <input
                        type="text"
                        value={exp.description}
                        onChange={(e) => {
                          const updated = [...experiences];
                          updated[idx].description = e.target.value;
                          setExperiences(updated);
                        }}
                        placeholder="e.g. Worked with frontend team to implement component tests and responsive UI."
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 8: DEVELOPER PROFILES */}
        {/* ==================================================== */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <Globe className="h-6 w-6 text-blue-400" />
                <span>Connect your developer profiles</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Link your active engineering profiles for portfolio verification.
              </p>
            </div>

            {/* Factual Note as specified */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
              <Shield className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>We use these links to understand your projects and experience. We do not increase your skill score without supporting evidence.</span>
            </div>

            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  GitHub Profile URL or Username
                </label>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username or @username"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none min-h-[42px]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  LinkedIn Profile URL
                </label>
                <input
                  type="text"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none min-h-[42px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 9: LEARNING PREFERENCES */}
        {/* ==================================================== */}
        {currentStep === 9 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <Sliders className="h-6 w-6 text-indigo-400" />
                <span>How do you want to learn?</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Your selections directly tailor the velocity and structure of your roadmap priorities.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Preferred Work Style */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">Preferred Work Style</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['Remote', 'Hybrid', 'On-site', 'No Preference'].map(style => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setWorkMode(style)}
                      className={`text-xs p-2.5 rounded-xl border transition-all cursor-pointer min-h-[38px] ${
                        workMode === style
                          ? 'border-blue-500 bg-blue-950/40 text-white font-semibold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weekly Learning Time */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">Weekly Learning Time</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['5–10 hours', '10–15 hours', '15–20 hours', '20–25 hours', '25+ hours'].map(hours => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setWeeklyHours(hours)}
                      className={`text-xs p-2.5 rounded-xl border transition-all cursor-pointer min-h-[38px] ${
                        weeklyHours === hours
                          ? 'border-indigo-500 bg-indigo-950/40 text-white font-semibold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {hours}
                    </button>
                  ))}
                </div>
              </div>

              {/* Learning Pace */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">Learning Pace</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['Steady', 'Moderate', 'Intensive'].map(pace => (
                    <button
                      key={pace}
                      type="button"
                      onClick={() => setLearningPace(pace)}
                      className={`text-xs p-2.5 rounded-xl border transition-all cursor-pointer min-h-[38px] ${
                        learningPace === pace
                          ? 'border-purple-500 bg-purple-950/40 text-white font-semibold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {pace}
                    </button>
                  ))}
                </div>
              </div>

              {/* Learning Preference */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">Learning Preference</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['Videos', 'Documentation', 'Projects', 'Practice / Coding', 'Mixed'].map(pref => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => setLearningPreference(pref)}
                      className={`text-xs p-2.5 rounded-xl border transition-all cursor-pointer min-h-[38px] ${
                        learningPreference === pref
                          ? 'border-teal-500 bg-teal-950/40 text-white font-semibold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>

              {/* Career Priority (Select up to 3) */}
              <div className="sm:col-span-2 space-y-1.5 pt-1">
                <label className="block text-xs font-medium text-slate-300">
                  Career Priority (Choose up to 3)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Internship',
                    'Placement',
                    'Skill Building',
                    'Projects',
                    'Competitive Programming',
                    'Freelancing',
                    'Higher Studies'
                  ].map(prio => {
                    const isSelected = careerPriorities.includes(prio);
                    return (
                      <button
                        key={prio}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setCareerPriorities(careerPriorities.filter(p => p !== prio));
                          } else {
                            if (careerPriorities.length < 3) {
                              setCareerPriorities([...careerPriorities, prio]);
                            }
                          }
                        }}
                        className={`text-xs px-3 py-2 rounded-xl border transition-all cursor-pointer min-h-[38px] flex items-center gap-1.5 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-950/40 text-white font-semibold'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-emerald-400" />}
                        <span>{prio}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* STEP 10: YOUR ROADMAP (PRIORITY TOPICS) */}
        {/* ==================================================== */}
        {currentStep === 10 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-amber-400" />
                <span>Your Priority Topics</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Personalized roadmap priorities synthesized from your target career, declared skills, and preferences.
              </p>
            </div>

            {previewLoading ? (
              <div className="py-16 text-center space-y-3">
                <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-300 font-medium">Generating your personalized roadmap priorities...</p>
              </div>
            ) : roadmapPreview ? (
              <div className="space-y-4">
                
                {/* Summary Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-800/40 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Your personalized career plan is ready.</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Target Role: <strong className="text-blue-300">{roadmapPreview.careerTitle}</strong> · {roadmapPreview.weeklySummary}
                  </p>
                </div>

                {/* Priority Topics List */}
                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {roadmapPreview.priorityTopics.map((topic, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/80 hover:border-slate-700 transition-all space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white tracking-tight">{topic.topicName}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-mono">
                            {topic.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            topic.priority === 'High'
                              ? 'text-red-400 bg-red-950/60 border-red-800/40'
                              : topic.priority === 'Medium'
                              ? 'text-amber-400 bg-amber-950/60 border-amber-800/40'
                              : 'text-slate-400 bg-slate-900 border-slate-800'
                          }`}>
                            {topic.priority} Priority
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Gap: <strong className="text-amber-400">{topic.gap}%</strong>
                          </span>
                        </div>
                      </div>

                      {/* Proficiency Bar & Time */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Current: <strong className="text-white">{topic.currentLevel}%</strong> → Target: <strong className="text-white">{topic.targetLevel}%</strong></span>
                        <span className="text-blue-400 font-medium">{topic.estimatedTimeText}</span>
                      </div>

                      {/* Reason & Recommended Method */}
                      <div className="pt-2 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 font-medium">Why it matters: </span>
                          <span className="text-slate-300">{topic.reason}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Method: </span>
                          <span className="text-emerald-400">{topic.recommendedMethod}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Unable to load preview. Click Save to complete onboarding.
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* BOTTOM ACTION BUTTONS BAR */}
        {/* ==================================================== */}
        <div className="pt-6 mt-6 border-t border-slate-800/80 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-semibold transition-colors cursor-pointer min-h-[42px] flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Skip Button on Optional Steps */}
            {[5, 6, 7, 8].includes(currentStep) && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => Math.min(totalSteps, prev + 1))}
                className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white cursor-pointer min-h-[42px]"
              >
                Skip for now
              </button>
            )}

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => Math.min(totalSteps, prev + 1))}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer min-h-[42px] flex items-center justify-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={handleCompleteOnboarding}
                className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer min-h-[42px] flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Finalizing Career Plan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Save & Open SkillPath Dashboard</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
