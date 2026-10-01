import React, { useState, useEffect } from 'react';
import { User, Building, BookOpen, Award, Save, CheckCircle2, RefreshCw } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext.js';
import { Profile, Career } from '../../types.js';
import {
  FadeIn, CardReveal, MotionButton
} from '../../components/common/AnimatedWrappers.js';

interface ProfilePageProps {
  onNavigate: (path: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = () => {
  const { showCelebration } = useNotifications();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [degree, setDegree] = useState('');
  const [branch, setBranch] = useState('');
  const [college, setCollege] = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [currentSemester, setCurrentSemester] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [careerGoalId, setCareerGoalId] = useState<number>(1);
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('skillpath_token')}`,
    'Content-Type': 'application/json'
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [pRes, cRes] = await Promise.all([
        fetch('/api/profile', { headers: getHeaders() }),
        fetch('/api/careers')
      ]);

      if (pRes.ok) {
        const d = await pRes.json();
        const p: Profile = d.profile;
        setProfile(p);
        setFullName(p.full_name || '');
        setLocation(p.location || '');
        setDegree(p.degree || 'B.Tech');
        setBranch(p.branch || '');
        setCollege(p.college || '');
        setCurrentYear(p.current_year || '2nd Year');
        setCurrentSemester(p.current_semester || '4th Semester');
        setCgpa(p.cgpa ? String(p.cgpa) : '7.8');
        setCareerGoalId(p.career_goal_id || 1);
        setGithubUrl(p.github_url || '');
        setLinkedinUrl(p.linkedin_url || '');
      }

      if (cRes.ok) {
        const cd = await cRes.json();
        setCareers(cd.careers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          fullName,
          location,
          degree,
          branch,
          college,
          currentYear,
          currentSemester,
          cgpa: parseFloat(cgpa) || null,
          careerGoalId,
          githubUrl,
          linkedinUrl
        })
      });

      if (res.ok) {
        await loadProfile();
        showCelebration('Profile Saved', 'Academic and career goal updates recorded. Readiness re-evaluated!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-4 sm:py-8 max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 overflow-x-hidden">
      
      {/* Header */}
      <FadeIn className="pb-6 border-b border-slate-800/80">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">Student Profile & Academic Context</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Keep your university credentials and public developer profiles up to date.
        </p>
      </FadeIn>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading student profile...</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Personal Information */}
          <CardReveal className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 space-y-4 backdrop-blur-sm">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Personal & Location</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, Karnataka"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none min-h-[44px]"
                />
              </div>
            </div>
          </CardReveal>

          {/* Education & Academic Record */}
          <CardReveal delay={0.05} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 space-y-4 backdrop-blur-sm">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Education & CGPA</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Degree</label>
                <input
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Branch / Specialization</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">College / University</label>
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none min-h-[44px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Current Year</label>
                <input
                  type="text"
                  value={currentYear}
                  onChange={(e) => setCurrentYear(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Current Semester</label>
                <input
                  type="text"
                  value={currentSemester}
                  onChange={(e) => setCurrentSemester(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Cumulative CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none min-h-[44px]"
                />
              </div>
            </div>
          </CardReveal>

          {/* Career Target */}
          <CardReveal delay={0.1} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 space-y-4 backdrop-blur-sm">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Career Track Direction</h3>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Primary Target Role</label>
              <select
                value={careerGoalId}
                onChange={(e) => setCareerGoalId(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none min-h-[44px]"
              >
                {careers.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </CardReveal>

          {/* Developer Handles */}
          <CardReveal delay={0.15} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 space-y-4 backdrop-blur-sm">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Public Developer Handles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">GitHub URL</label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/rohit-sharma"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">LinkedIn URL</label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/rohit-sharma"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none min-h-[44px]"
                />
              </div>
            </div>
          </CardReveal>

          <div className="flex items-center justify-end">
            <MotionButton
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer min-h-[44px]"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Updating...' : 'Save Profile Changes'}</span>
            </MotionButton>
          </div>

        </form>
      )}

    </div>
  );
};

