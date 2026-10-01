import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, CheckCircle2, Send, Building, AlertCircle, Hash } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export const ContactPage: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('Student Roadmap Guidance');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedInquiryId, setSubmittedInquiryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill user profile info if logged in
  useEffect(() => {
    if (user) {
      if (user.fullName && !name) setName(user.fullName);
      if (user.email && !email) setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('skillpath_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fullName: name.trim(),
          email: email.trim(),
          topic,
          message: message.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit message.');
      }

      setSubmittedInquiryId(data.inquiryId || null);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting your message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setSubmittedInquiryId(null);
    setMessage('');
    setError(null);
  };

  return (
    <div className="py-16 md:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Get In Touch</span>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Contact SkillPath AI
        </h1>
        <p className="mt-3 text-sm text-slate-300 max-w-lg mx-auto">
          Have questions about your roadmap, university partnerships, or verified opportunity integrations?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4 md:col-span-1">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <Mail className="h-5 w-5 text-blue-400 mb-2" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Email Support</h3>
            <p className="mt-1 text-xs text-slate-400">premthakare986@gmail.com</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <Building className="h-5 w-5 text-purple-400 mb-2" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">University Programs</h3>
            <p className="mt-1 text-xs text-slate-400">Institutional campus curriculum & skill tracking integration.</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <MessageSquare className="h-5 w-5 text-emerald-400 mb-2" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Engineering Office Hours</h3>
            <p className="mt-1 text-xs text-slate-400">Mon - Fri, 9:00 AM - 6:00 PM IST</p>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 md:p-8">
            {submitted ? (
              <div className="text-center py-10 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-800/60 mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Message Dispatched</h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Your message has been sent successfully. Our team will get back to you soon.
                </p>
                {submittedInquiryId && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-blue-400">
                    <Hash className="h-3.5 w-3.5 text-slate-500" />
                    <span>Reference ID: {submittedInquiryId}</span>
                  </div>
                )}
                <div>
                  <button
                    onClick={resetForm}
                    className="mt-4 text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
                  >
                    Send another inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-xl bg-red-950/40 border border-red-800/60 p-3 text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Rohit Sharma"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@college.edu"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Topic</label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Student Roadmap Guidance">Student Roadmap Guidance</option>
                    <option value="Skill Assessment Question">Skill Assessment Question</option>
                    <option value="Feedback">Feedback</option>
                    <option value="University / College Department">University / College Department</option>
                    <option value="License">License</option>
                    <option value="Employer Internship Verification">Employer Internship Verification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Your Message</label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your inquiry..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !name.trim() || !email.trim() || !message.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 disabled:opacity-50 transition-colors cursor-pointer min-h-[44px]"
                >
                  <Send className="h-4 w-4" />
                  <span>{loading ? 'Sending message...' : 'Send Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
