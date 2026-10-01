import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckSquare, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft,
  Clock, Award, HelpCircle, RefreshCw, Sparkles
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext.js';
import {
  FadeIn, CardReveal, StaggerContainer, StaggerItem,
  MotionButton
} from '../../components/common/AnimatedWrappers.js';
import { Assessment, AssessmentQuestion } from '../../types.js';

interface AssessmentsPageProps {
  onNavigate: (path: string) => void;
}

export const AssessmentsPage: React.FC<AssessmentsPageProps> = ({ onNavigate }) => {
  const { showCelebration } = useNotifications();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [activeAssessment, setActiveAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: number]: number }>({});
  const [results, setResults] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('skillpath_token')}`,
    'Content-Type': 'application/json'
  });

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/assessments');
      if (res.ok) {
        const d = await res.json();
        setAssessments(d.assessments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  const handleStartQuiz = async (ass: Assessment) => {
    setLoading(true);
    setResults(null);
    setSelectedAnswers({});
    try {
      const res = await fetch(`/api/assessments/${ass.id}`, { headers: getHeaders() });
      if (res.ok) {
        const d = await res.json();
        setActiveAssessment(d.assessment);
        setQuestions(d.questions || []);
        setAttempts(d.attempts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    if (results) return; // locked after submission
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeAssessment) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/assessments/${activeAssessment.id}/submit`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ answers: selectedAnswers })
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data);
        showCelebration(
          `Assessment Completed: Score ${data.score}%`,
          `Verified proficiency recalculated to ${data.computedProficiency}%. Roadmap state refreshed!`,
          data.passed ? 'Assessment Passed' : 'Assessment Completed'
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-4 sm:py-8 max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 overflow-x-hidden">
      
      {/* Header */}
      <FadeIn className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">Technical Skill Assessments</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Validate practical mastery through verified quizzes. Tested scores transparently update your computed proficiency and unlock advanced roadmap milestones.
          </p>
        </div>

        {activeAssessment && (
          <MotionButton
            onClick={() => setActiveAssessment(null)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors self-start sm:self-auto min-h-[44px]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All Assessments</span>
          </MotionButton>
        )}
      </FadeIn>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading assessments...</div>
      ) : activeAssessment ? (
        
        /* Quiz Active Screen */
        <FadeIn className="space-y-6">
          <CardReveal className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                  {activeAssessment.skill_name} Assessment
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">{activeAssessment.title}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" /> {activeAssessment.duration_minutes} min
                </span>
                <span>Pass: {activeAssessment.passing_score}%</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{activeAssessment.description}</p>
          </CardReveal>

          {/* Results Summary Box if already submitted */}
          {results && (
            <CardReveal className={`rounded-2xl border p-4 sm:p-6 shadow-xl ${
              results.passed ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-amber-500/30 bg-amber-950/20'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${results.passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {results.passed ? 'Assessment Passed' : 'Needs Further Review'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
                    Score: {results.score}% ({results.correctCount} / {results.totalQuestions} correct)
                  </h3>
                </div>

                <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3 text-xs text-left max-w-sm">
                  <span className="font-semibold text-slate-200 block mb-1">Transparent Proficiency Formula:</span>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Self: {results.selfProficiency}% (40%) + Tested: {results.testedProficiency}% (60%) = <strong className="text-white">{results.computedProficiency}% Computed Proficiency</strong>
                  </p>
                </div>
              </div>
            </CardReveal>
          )}

          {/* Questions List */}
          <div className="space-y-5 sm:space-y-6">
            {questions.map((q, idx) => {
              const resItem = results?.results?.find((r: any) => r.questionId === q.id);
              const userChoice = selectedAnswers[q.id];

              return (
                <CardReveal
                  key={q.id}
                  delay={idx * 0.05}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6 space-y-4 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300 font-mono text-xs font-bold">
                      {idx + 1}
                    </span>
                    <h3 className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                      {q.questionText}
                    </h3>
                  </div>

                  <div className="space-y-2 pt-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = userChoice === optIdx;
                      let optionStyle = 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700';

                      if (results) {
                        if (optIdx === resItem?.correctAnswer) {
                          optionStyle = 'border-emerald-500/60 bg-emerald-950/40 text-emerald-200 font-semibold';
                        } else if (isSelected && !resItem?.isCorrect) {
                          optionStyle = 'border-red-500/60 bg-red-950/40 text-red-200';
                        }
                      } else if (isSelected) {
                        optionStyle = 'border-blue-500 bg-blue-950/50 text-white font-semibold shadow-sm shadow-blue-500/20';
                      }

                      return (
                        <motion.div
                          key={optIdx}
                          whileHover={!results ? { scale: 1.005 } : undefined}
                          whileTap={!results ? { scale: 0.99 } : undefined}
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between min-h-[48px] touch-manipulation ${optionStyle}`}
                        >
                          <span className="leading-snug">{opt}</span>
                          {results && optIdx === resItem?.correctAnswer && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 ml-2" />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {results && resItem?.explanation && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400">
                      <span className="font-semibold text-slate-300 block mb-0.5">Explanation:</span>
                      <p className="text-[11px] leading-relaxed">{resItem.explanation}</p>
                    </div>
                  )}
                </CardReveal>
              );
            })}
          </div>

          {/* Submission action */}
          {!results ? (
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Answered: {Object.keys(selectedAnswers).length} of {questions.length} questions
              </span>
              <MotionButton
                onClick={handleSubmitQuiz}
                disabled={submitting || Object.keys(selectedAnswers).length === 0}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all cursor-pointer min-h-[44px]"
              >
                <span>{submitting ? 'Submitting & Grading...' : 'Submit Assessment'}</span>
                <ArrowRight className="h-4 w-4" />
              </MotionButton>
            </div>
          ) : (
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <MotionButton
                onClick={() => setActiveAssessment(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white min-h-[44px] flex items-center justify-center"
              >
                Return to Assessment List
              </MotionButton>
              <MotionButton
                onClick={() => onNavigate('/roadmap')}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-500 min-h-[44px]"
              >
                <span>View Updated Roadmap</span>
                <ArrowRight className="h-4 w-4" />
              </MotionButton>
            </div>
          )}

        </FadeIn>

      ) : (

        /* Assessments Catalog List */
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {assessments.map((ass) => (
            <StaggerItem key={ass.id}>
              <CardReveal className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 flex flex-col justify-between hover:border-slate-700 transition-all backdrop-blur-sm h-full">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                        {ass.category} Track
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5">{ass.title}</h3>
                    </div>
                    <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {ass.duration_minutes} min
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {ass.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono text-slate-400">
                    <span>{ass.total_questions} Questions</span>
                    <span>·</span>
                    <span>Pass: {ass.passing_score}%</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Skill: {ass.skill_name}</span>
                  <MotionButton
                    onClick={() => handleStartQuiz(ass)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-sm shadow-blue-500/20 transition-all cursor-pointer min-h-[40px]"
                  >
                    <span>Start Quiz</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </MotionButton>
                </div>
              </CardReveal>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
};
