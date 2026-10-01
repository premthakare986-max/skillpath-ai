import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot, Send, Sparkles, User, ArrowRight, Compass,
  RefreshCw, CheckCircle2, Shield, Copy, Check, Square,
  Plus, Trash2, PanelRightClose, PanelRightOpen, Code2,
  TrendingUp, GraduationCap, Briefcase, BookOpen, Layers,
  ExternalLink, HelpCircle, Terminal, FileText, CheckSquare,
  AlertCircle, Maximize2, Minimize2, ArrowDown, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { MarkdownRenderer } from '../../components/mentor/MarkdownRenderer.js';
import { smoothEase } from '../../components/common/AnimatedWrappers.js';
import { getApiUrl } from '../../lib/api.js';

interface MentorPageProps {
  onNavigate?: (path: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

interface MentorContext {
  isProfileComplete: boolean;
  fullName: string;
  location: string | null;
  degree: string | null;
  branch: string | null;
  college: string | null;
  currentYear: string | null;
  currentSemester: string | null;
  cgpa: number | null;
  careerTrack: string;
  careerTrackDescription: string | null;
  careerPriorities: string[];
  weeklyHours: number;
  learningPace: string;
  learningPreference: string;
  preferredWorkMode: string;
  readinessScore: number;
  readinessLabel: string;
  readinessComponents: any;
  nextBestAction: {
    actionTitle: string;
    skillName: string;
    phaseTitle: string;
    estimatedMinutes: number;
    whyExplanation: string;
    stepAfter: string;
    stepThen: string;
    ctaText: string;
    ctaLink: string;
  };
  topGap: {
    skillName: string;
    currentProficiency: number;
    requiredProficiency: number;
    gap: number;
    priority: string;
    status: string;
  } | null;
  allGaps: Array<{
    skill: string;
    current: string;
    required: string;
    gap: string;
    priority: string;
    status: string;
  }>;
  roadmapProgress: {
    title: string;
    completed: number;
    total: number;
    percentage: number;
    activeMilestone: string;
  };
  projects: Array<{
    title: string;
    status: string;
    tech: string;
    github?: string;
    live?: string;
  }>;
  github: {
    username: string | null;
    evidenceLevel: string;
    analyzedReposCount: number;
    detectedSkills: string[];
  };
}

export const MentorPage: React.FC<MentorPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showContextSidebar, setShowContextSidebar] = useState(false);
  const [showMobileContextDrawer, setShowMobileContextDrawer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mentorContext, setMentorContext] = useState<MentorContext | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Intelligent Scroll State
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMessageBadge, setShowNewMessageBadge] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('skillpath_token')}`,
    'Content-Type': 'application/json'
  });

  // Fetch real student context from backend
  const loadMentorContext = async () => {
    try {
      setLoadingContext(true);
      const res = await fetch(getApiUrl('/api/ai/mentor/context'), { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMentorContext(data.context);
      }
    } catch (err) {
      console.error('Failed to load mentor context:', err);
    } finally {
      setLoadingContext(false);
    }
  };

  useEffect(() => {
    loadMentorContext();
  }, []);

  // Set initial greeting
  useEffect(() => {
    const greetingMsg: ChatMessage = {
      id: 'greeting',
      role: 'model',
      content: `Hello! I am your **SkillPath AI Career Mentor**.\n\nI have access to your live career track, active skill gaps, current roadmap milestones, and project records.\n\nAsk me anything: how to write or debug code, what to learn today, which project to build next, or start a mock technical interview.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([greetingMsg]);
  }, [user]);

  // Handle Full Screen key shortcut (Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Scroll listener for intelligent auto-scroll
  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distFromBottom < 100;
    setIsAtBottom(nearBottom);
    if (nearBottom) {
      setShowNewMessageBadge(false);
    }
  };

  // Auto-scroll when new messages arrive IF user is near the bottom
  useEffect(() => {
    if (isAtBottom) {
      messagesContainerRef.current?.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      const last = messages[messages.length - 1];
      if (last && (last.role === 'model' || last.isStreaming)) {
        setShowNewMessageBadge(true);
      }
    }
  }, [messages, loading]);

  // Adjust textarea height automatically
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  // Scroll to bottom helper
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
    setIsAtBottom(true);
    setShowNewMessageBadge(false);
  };

  // Quick Prompt definitions
  const quickPrompts = [
    { title: 'Learn Today', prompt: 'What should I learn today based on my roadmap?', icon: BookOpen },
    { title: 'Top Skill Gap', prompt: 'Why is my top skill gap high priority?', icon: TrendingUp },
    { title: 'Next Project', prompt: 'What project should I build next to close my skill gaps?', icon: Code2 },
    { title: 'C Sorting Code', prompt: 'give me c code sorting', icon: Terminal },
    { title: 'Check Readiness', prompt: 'Am I ready for internships? What do I need to reach 75%?', icon: CheckSquare },
    { title: '2-Hour Study Plan', prompt: 'I have only 2 hours today. Create my personalized study plan.', icon: Compass },
    { title: 'Mock Interview', prompt: 'Start a mock technical interview for my career track.', icon: Bot },
    { title: 'Improve README', prompt: 'How can I improve my GitHub project README for recruiters?', icon: FileText }
  ];

  // Send message with real-time SSE streaming & abort support
  const handleSendMessage = async (textToSend?: string) => {
    const message = textToSend || input;
    if (!message.trim() || loading) return;

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMessageId = `user-${Date.now()}`;
    const modelMessageId = `model-${Date.now()}`;

    const userMsg: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const initialModelMsg: ChatMessage = {
      id: modelMessageId,
      role: 'model',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true
    };

    setMessages(prev => [...prev, userMsg, initialModelMsg]);
    setLoading(true);
    setIsAtBottom(true);
    setShowNewMessageBadge(false);

    // Scroll to bottom immediately on user send
    setTimeout(scrollToBottom, 30);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const historyPayload = messages
        .filter(m => m.id !== 'greeting')
        .map(m => ({ role: m.role, content: m.content }));

      const streamUrl = getApiUrl('/api/ai/mentor/stream');
      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          message: message.trim(),
          history: historyPayload
        }),
        signal: controller.signal
      });

      if (response.status === 401) {
        throw new Error('AUTH_401');
      }
      if (response.status === 403) {
        throw new Error('AUTH_403');
      }
      if (response.status === 429) {
        throw new Error('RATE_429');
      }
      if (!response.ok || !response.body) {
        throw new Error(`STREAM_FAIL_${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                accumulatedText += `\n\n*(Notice: ${parsed.error})*`;
              } else if (parsed.text) {
                accumulatedText += parsed.text;
                setMessages(prev =>
                  prev.map(m =>
                    m.id === modelMessageId
                      ? { ...m, content: accumulatedText }
                      : m
                  )
                );
              }
            } catch (jsonErr) {
              // Ignore partial JSON parse chunks
            }
          }
        }
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === modelMessageId
            ? { ...m, isStreaming: false, content: accumulatedText || 'I processed your request, but could not produce text. Please try again.' }
            : m
        )
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages(prev =>
          prev.map(m =>
            m.id === modelMessageId
              ? { ...m, isStreaming: false, content: m.content ? `${m.content}\n\n*(Generation stopped by user)*` : '*(Generation stopped)*' }
              : m
          )
        );
      } else if (err.message === 'AUTH_401') {
        setMessages(prev =>
          prev.map(m =>
            m.id === modelMessageId
              ? { ...m, isStreaming: false, content: 'Your session has expired or you are not logged in. Please log in again to interact with the AI Career Mentor.' }
              : m
          )
        );
      } else if (err.message === 'AUTH_403') {
        setMessages(prev =>
          prev.map(m =>
            m.id === modelMessageId
              ? { ...m, isStreaming: false, content: 'Access restricted: You do not have permission to access the AI Career Mentor.' }
              : m
          )
        );
      } else if (err.message === 'RATE_429') {
        setMessages(prev =>
          prev.map(m =>
            m.id === modelMessageId
              ? { ...m, isStreaming: false, content: 'The AI Career Mentor is experiencing high traffic (Rate limit reached). Please wait a few moments and try your question again.' }
              : m
          )
        );
      } else {
        console.warn('Mentor Stream connection note, falling back to standard chat API:', err?.message || err);
        // Fallback to standard non-streaming endpoint
        try {
          const chatUrl = getApiUrl('/api/ai/mentor');
          const fbRes = await fetch(chatUrl, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
              message: message.trim(),
              history: messages.map(m => ({ role: m.role, content: m.content }))
            })
          });

          const fbData = await fbRes.json().catch(() => null);

          if (fbRes.ok && (fbData?.reply || fbData?.text)) {
            setMessages(prev =>
              prev.map(m =>
                m.id === modelMessageId
                  ? { ...m, isStreaming: false, content: fbData.reply || fbData.text }
                  : m
              )
            );
          } else if (fbRes.status === 401) {
            setMessages(prev =>
              prev.map(m =>
                m.id === modelMessageId
                  ? { ...m, isStreaming: false, content: 'Your session has expired or you are not logged in. Please log in again to interact with the AI Career Mentor.' }
                  : m
              )
            );
          } else if (fbRes.status === 429) {
            setMessages(prev =>
              prev.map(m =>
                m.id === modelMessageId
                  ? { ...m, isStreaming: false, content: 'The AI Career Mentor is experiencing high traffic (Rate limit 429). Please wait a few seconds and try again.' }
                  : m
              )
            );
          } else {
            const errorDetail = fbData?.error || `Server responded with status ${fbRes.status}`;
            setMessages(prev =>
              prev.map(m =>
                m.id === modelMessageId
                  ? { ...m, isStreaming: false, content: `I encountered an issue connecting to the AI Mentor service (${errorDetail}). Please try again in a moment.` }
                  : m
              )
            );
          }
        } catch (netErr: any) {
          console.error('Mentor fallback error:', netErr);
          setMessages(prev =>
            prev.map(m =>
              m.id === modelMessageId
                ? { ...m, isStreaming: false, content: 'Unable to reach the AI Mentor service. Please check your network connection and verify the backend is running.' }
                : m
            )
          );
        }
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Stop Generation Handler
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Reset / New Chat Handler
  const handleNewChat = () => {
    if (loading && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const newGreeting: ChatMessage = {
      id: `new-${Date.now()}`,
      role: 'model',
      content: `New conversation started! Ask me anything about coding, algorithms, your **${mentorContext?.careerTrack || 'engineering'}** path, or active milestones.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([newGreeting]);
    setInput('');
    setIsAtBottom(true);
    setShowNewMessageBadge(false);
  };

  // Clear conversation
  const handleClearChat = () => {
    if (loading && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setIsAtBottom(true);
    setShowNewMessageBadge(false);
  };

  // Copy full message
  const handleCopyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Regenerate last response
  const handleRegenerate = () => {
    if (loading) return;
    const lastUserIndex = [...messages].reverse().findIndex(m => m.role === 'user');
    if (lastUserIndex !== -1) {
      const actualIndex = messages.length - 1 - lastUserIndex;
      const lastUserMsg = messages[actualIndex];
      setMessages(messages.slice(0, actualIndex));
      handleSendMessage(lastUserMsg.content);
    }
  };

  // Navigate helper
  const navigateTo = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  // Render context cards used in both desktop sidebar & mobile slide-over drawer
  const renderContextCards = () => {
    if (loadingContext) {
      return (
        <div className="py-12 text-center space-y-2">
          <RefreshCw className="h-5 w-5 animate-spin text-amber-500 mx-auto" />
          <p className="text-xs text-slate-400">Loading your profile context...</p>
        </div>
      );
    }

    if (!mentorContext) {
      return (
        <div className="p-4 text-center text-xs text-slate-400">
          Context details unavailable.
        </div>
      );
    }

    return (
      <div className="space-y-3.5 text-xs">
        {/* Career Track Card */}
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold block">Target Career</span>
          <div className="text-sm font-bold text-white flex items-center gap-1.5">
            <Briefcase className="h-4 w-4 text-blue-400" />
            <span>{mentorContext.careerTrack}</span>
          </div>
          {mentorContext.careerTrackDescription && (
            <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
              {mentorContext.careerTrackDescription}
            </p>
          )}
        </div>

        {/* Next Best Action Card */}
        <div className="p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-amber-400 uppercase font-mono font-bold">Next Best Action</span>
            <span className="text-[10px] text-slate-400">~{mentorContext.nextBestAction.estimatedMinutes}m</span>
          </div>
          <div className="text-xs font-bold text-white">
            {mentorContext.nextBestAction.actionTitle}
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {mentorContext.nextBestAction.whyExplanation}
          </p>
        </div>

        {/* Top Skill Gaps */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Active Skill Gaps</span>
            <span className="text-[10px] text-slate-500">{mentorContext.allGaps.length} total</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {mentorContext.allGaps.slice(0, 5).map((g, idx) => (
              <div key={idx} className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-200 truncate max-w-[120px]">{g.skill}</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-slate-400">{g.current} → {g.required}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    g.priority === 'High' ? 'bg-red-950 text-red-400 border border-red-800/40' : 'bg-slate-900 text-slate-400'
                  }`}>
                    -{g.gap}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Roadmap Progress */}
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Roadmap Progress</span>
            <span className="font-bold text-white font-mono">{mentorContext.roadmapProgress.percentage}%</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all"
              style={{ width: `${mentorContext.roadmapProgress.percentage}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Active Milestone:</span>
            <span className="text-white font-medium truncate max-w-[150px]">{mentorContext.roadmapProgress.activeMilestone}</span>
          </div>
        </div>

        {/* GitHub Evidence */}
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-[11px]">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold block">GitHub Evidence</span>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-slate-400">Strength:</span>
            <span className="font-bold text-emerald-400">{mentorContext.github.evidenceLevel}</span>
          </div>
          {mentorContext.github.username && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Handle:</span>
              <span className="text-slate-200 font-mono truncate max-w-[140px]">{mentorContext.github.username}</span>
            </div>
          )}
        </div>

        {/* Student Academic Identity */}
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-[11px]">
          <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold block">Academic Profile</span>
          <div className="text-slate-300 font-medium">{mentorContext.fullName}</div>
          <div className="text-slate-400">
            {mentorContext.degree || 'Degree'} · {mentorContext.branch || 'Branch'}
          </div>
          {mentorContext.college && (
            <div className="text-slate-400 truncate">{mentorContext.college}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950 p-2 sm:p-4 flex flex-col h-[100dvh] w-full overflow-hidden'
          : 'py-2 sm:py-3 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 h-[calc(100dvh-5.5rem)] sm:h-[calc(100vh-6.5rem)] flex flex-col overflow-hidden'
      }
    >
      {/* ==================================================== */}
      {/* MENTOR HEADER WITH FULL-SCREEN & CONTEXT TOGGLES */}
      {/* ==================================================== */}
      <div className="pb-2.5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-2.5 flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 text-slate-950 font-bold shadow-md shadow-amber-500/10 flex-shrink-0">
              <Bot className="h-4.5 w-4.5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">AI Career Mentor</h1>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 font-mono hidden xs:inline">
                  Interactive
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Your personal AI mentor for learning, coding, projects, and career growth.
              </p>
            </div>
          </div>

          {/* Mobile-only Context button */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              type="button"
              onClick={() => setShowMobileContextDrawer(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-300 hover:text-white text-xs font-semibold"
            >
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span>Context</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center ${
                isFullscreen
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'border-slate-800 bg-slate-900/90 text-slate-300'
              }`}
              title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Real Context Indicators & Header Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {mentorContext?.careerTrack && (
            <div className="hidden lg:flex px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 items-center gap-1.5 font-medium">
              <Briefcase className="h-3 w-3 text-blue-400" />
              <span>{mentorContext.careerTrack}</span>
            </div>
          )}

          {mentorContext?.topGap && (
            <div className="hidden lg:flex px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 items-center gap-1.5 font-medium">
              <TrendingUp className="h-3 w-3 text-amber-400" />
              <span>Top Gap: <strong className="text-amber-400">{mentorContext.topGap.skillName}</strong></span>
            </div>
          )}

          {mentorContext?.readinessScore !== undefined && (
            <div className="hidden sm:flex px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span>Readiness: <strong className="text-emerald-400">{mentorContext.readinessScore}%</strong></span>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 ml-auto">
            {/* FULL SCREEN / FOCUS MODE BUTTON */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer min-h-[34px] ${
                isFullscreen
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                  : 'border-slate-800 bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Expand to Full Screen'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span>Exit Full Screen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Full Screen</span>
                </>
              )}
            </button>

            {/* NEW CHAT BUTTON */}
            <button
              type="button"
              onClick={handleNewChat}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer min-h-[34px]"
              title="Start a new chat"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Chat</span>
            </button>

            {/* CLEAR CHAT BUTTON */}
            <button
              type="button"
              onClick={handleClearChat}
              className="p-1.5 rounded-xl border border-slate-800 bg-slate-900/90 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center"
              title="Clear messages"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>

            {/* DESKTOP CONTEXT TOGGLE */}
            <button
              type="button"
              onClick={() => setShowContextSidebar(!showContextSidebar)}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer min-h-[34px] ${
                showContextSidebar
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                  : 'border-slate-800 bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={showContextSidebar ? 'Hide context panel' : 'Show context panel'}
            >
              {showContextSidebar ? (
                <>
                  <PanelRightClose className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline">Hide Context</span>
                </>
              ) : (
                <>
                  <PanelRightOpen className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline">Show Context</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MAIN BODY: CHAT CONVERSATION + OPTIONAL CONTEXT PANEL */}
      {/* ==================================================== */}
      <div className="flex-1 flex overflow-hidden pt-2 gap-4 min-h-0 relative">
        
        {/* Left Column: GPT-Style Chat Conversation */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950/60 rounded-3xl border border-slate-800/80 backdrop-blur-md relative min-h-0">
          
          {/* Scrollable Message History Area (Isolated Scroll Container) */}
          <div
            ref={messagesContainerRef}
            onScroll={handleMessagesScroll}
            className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-5 min-h-0 scroll-smooth"
          >
            {/* When only greeting exists, display Next Best Action & Quick Prompts */}
            {messages.length <= 1 && (
              <div className="space-y-4 py-2">
                {/* Dynamic Next Best Action Card */}
                {mentorContext?.nextBestAction && (
                  <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 shadow-md space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                          NEXT BEST ACTION
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ~{mentorContext.nextBestAction.estimatedMinutes} mins
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                        Complete: &ldquo;{mentorContext.nextBestAction.actionTitle}&rdquo;
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {mentorContext.nextBestAction.whyExplanation}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => navigateTo(mentorContext.nextBestAction.ctaLink || '/resources')}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Start Learning</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigateTo('/assessments')}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckSquare className="h-3.5 w-3.5" />
                        <span>Practice</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendMessage(`Help me tackle my next best action: "${mentorContext.nextBestAction.actionTitle}". Explain the core concepts and give me a step-by-step roadmap to master it.`)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 text-xs font-semibold border border-blue-500/30 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Bot className="h-3.5 w-3.5 text-blue-400" />
                        <span>Ask Mentor</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick Prompts Grid */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Quick Inquiries:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {quickPrompts.map((qp, idx) => {
                      const Icon = qp.icon;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(qp.prompt)}
                          className="p-3 rounded-2xl border border-slate-800/90 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 text-left transition-all group cursor-pointer flex flex-col justify-between min-h-[72px]"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                              {qp.title}
                            </span>
                            <Icon className="h-3.5 w-3.5 text-slate-500 group-hover:text-amber-400 transition-colors flex-shrink-0" />
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {qp.prompt}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Chat Messages Log */}
            {messages.map((m, msgIdx) => {
              const isUser = m.role === 'user';
              const isCopied = copiedMessageId === m.id;

              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* AI Avatar */}
                  {!isUser && (
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 text-xs mt-1 shadow-sm">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className={`max-w-[94%] sm:max-w-3xl space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* Message Bubble Card */}
                    <div
                      className={`rounded-2xl p-3.5 sm:p-5 text-xs sm:text-[13px] leading-relaxed shadow-sm overflow-hidden ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-500/10'
                          : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      {isUser ? (
                        <div className="whitespace-pre-wrap font-sans text-white text-xs sm:text-sm">
                          {m.content}
                        </div>
                      ) : (
                        <div className="space-y-3 font-sans">
                          {m.content ? (
                            <MarkdownRenderer content={m.content} />
                          ) : m.isStreaming ? (
                            <div className="flex items-center gap-2 text-slate-400 py-1">
                              <div className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                              <span className="text-xs">Formulating answer...</span>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* Metadata & Contextual Action Toolbar */}
                    <div className={`flex flex-wrap items-center gap-2 text-[10px] text-slate-500 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <span className="font-mono">{m.timestamp}</span>

                      {!isUser && !m.isStreaming && m.content && (
                        <>
                          <span className="text-slate-700">·</span>
                          
                          {/* Copy Action */}
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(m.id, m.content)}
                            className="hover:text-slate-300 transition-colors cursor-pointer flex items-center gap-1"
                            title="Copy response text"
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-400" />
                                <span className="text-emerald-400 font-medium">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <span className="text-slate-700">·</span>

                          {/* Regenerate Action */}
                          <button
                            type="button"
                            onClick={handleRegenerate}
                            disabled={loading}
                            className="hover:text-slate-300 transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                            title="Regenerate this response"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Regenerate</span>
                          </button>

                          {/* Smart Follow-Ups operating on the current response */}
                          <span className="text-slate-700">·</span>
                          <button
                            type="button"
                            onClick={() => handleSendMessage('Explain your previous response simpler with a clear real-world analogy and beginner-friendly steps.')}
                            className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            Explain Simpler
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendMessage('Go deeper into the technical mechanics, memory execution, edge cases, and time/space complexity of your previous response.')}
                            className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            Go Deeper
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendMessage('Create a focused 2-hour study plan with coding practice based on your previous response.')}
                            className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            Create Study Plan
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-xl bg-blue-900/80 text-blue-200 border border-blue-700/50 text-xs font-bold mt-1 shadow-sm">
                      {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Floating "↓ New messages" pill button */}
          <AnimatePresence>
            {showNewMessageBadge && (
              <motion.button
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                type="button"
                onClick={scrollToBottom}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xl shadow-amber-500/25 transition-transform hover:scale-105 cursor-pointer"
              >
                <ArrowDown className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>↓ New messages</span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* ==================================================== */}
          {/* STICKY MESSAGE COMPOSER */}
          {/* ==================================================== */}
          <div className="p-2.5 sm:p-4 border-t border-slate-800/80 bg-slate-950/95 space-y-2 pb-[calc(0.6rem+env(safe-area-inset-bottom))]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-1.5 focus-within:border-amber-500/60 focus-within:ring-1 focus-within:ring-amber-500/20 transition-all shadow-inner"
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask about coding, algorithms, roadmap, or interview prep..."
                className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none resize-none max-h-36 min-h-[40px] leading-relaxed"
              />

              <div className="flex items-center gap-1.5 flex-shrink-0 pr-1 pb-1">
                {loading ? (
                  <button
                    type="button"
                    onClick={handleStopGeneration}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-xs font-semibold shadow-md transition-all cursor-pointer min-h-[38px]"
                    title="Stop generating"
                  >
                    <Square className="h-3.5 w-3.5 fill-white" />
                    <span className="hidden sm:inline">Stop</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="flex items-center justify-center h-10 w-10 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:hover:bg-amber-500 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer min-h-[40px] min-w-[40px]"
                    title="Send message (Enter)"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                )}
              </div>
            </form>

            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>Press <strong className="text-slate-400">Enter</strong> to send, <strong className="text-slate-400">Shift+Enter</strong> for newline</span>
              <span className="hidden sm:inline font-mono">SkillPath AI Mentor Workspace</span>
            </div>
          </div>

        </div>

        {/* ==================================================== */}
        {/* DESKTOP RIGHT COLUMN: LIVE CONTEXT PANEL */}
        {/* ==================================================== */}
        {showContextSidebar && !isFullscreen && (
          <div className="w-80 lg:w-88 flex-shrink-0 hidden md:flex flex-col h-full overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900/60 p-4 space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Live Student Context</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowContextSidebar(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
                title="Hide Context Panel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {renderContextCards()}
          </div>
        )}

      </div>

      {/* ==================================================== */}
      {/* MOBILE SLIDE-OVER DRAWER FOR CONTEXT */}
      {/* ==================================================== */}
      <AnimatePresence>
        {showMobileContextDrawer && (
          <div className="fixed inset-0 z-50 md:hidden flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileContextDrawer(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: smoothEase }}
              className="relative w-5/6 max-w-sm h-full bg-slate-950 border-l border-slate-800 p-4 overflow-y-auto z-10 flex flex-col space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">Student Context</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileContextDrawer(false)}
                  className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {renderContextCards()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
