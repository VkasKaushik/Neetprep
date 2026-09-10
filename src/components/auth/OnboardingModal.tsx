import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storageService';
import { SubjectType, Task } from '../../types';
import {
  Sparkles,
  Calendar,
  Clock,
  HelpCircle,
  Check,
  ChevronRight,
  ArrowLeft,
  BookOpen,
  Trash2,
  Plus
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (destinationTab?: 'today' | 'plan') => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete
}) => {
  const currentProfile = storageService.getProfile();

  // Resume from stored onboarding step if available (step 1 to 5)
  const [step, setStep] = useState<number>(() => {
    const saved = storageService.getOnboardingStep();
    return saved >= 1 && saved <= 5 ? saved : 1;
  });

  // Onboarding state
  const [targetExam, setTargetExam] = useState<string>(currentProfile.target_exam || 'NEET 2027');
  const [examDate, setExamDate] = useState<string>(currentProfile.exam_date || '2027-05-02');
  const [dailyHours, setDailyHours] = useState<number>(currentProfile.daily_study_goal || 6);
  const [dailyQuestions, setDailyQuestions] = useState<number>(currentProfile.daily_question_goal || 200);

  // Step 3 confirmation feedback
  const [hoursConfirmation, setHoursConfirmation] = useState<string | null>(null);

  // Step 5 First Plan state
  const [planChoice, setPlanChoice] = useState<'initial' | 'generate'>('initial');
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectType[]>(['Physics', 'Chemistry', 'Biology']);
  const [generatedTasks, setGeneratedTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (isOpen) {
      const savedStep = storageService.getOnboardingStep();
      if (savedStep >= 1 && savedStep <= 5) {
        setStep(savedStep);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const advanceStep = (nextStep: number) => {
    setStep(nextStep);
    storageService.setOnboardingStep(nextStep);
  };

  const goBack = () => {
    if (step === 5 && planChoice === 'generate') {
      setPlanChoice('initial');
      return;
    }
    if (step > 1) {
      advanceStep(step - 1);
    }
  };

  // Step 1: Target Exam Selection
  const handleSelectExam = (exam: string) => {
    setTargetExam(exam);
    if (exam === 'NEET 2026') setExamDate('2026-05-03');
    else if (exam === 'NEET 2027') setExamDate('2027-05-02');
    else if (exam === 'NEET 2028') setExamDate('2028-05-07');
    else if (exam === 'NEET Dropper') setExamDate('2026-05-03');

    setTimeout(() => {
      advanceStep(2);
    }, 220);
  };

  // Step 3: Daily Study Hours Selection
  const handleSelectHours = (hrs: number) => {
    setDailyHours(hrs);
    setHoursConfirmation(`Great. Your daily target is ${hrs} hours.`);

    setTimeout(() => {
      setHoursConfirmation(null);
      advanceStep(4);
    }, 550);
  };

  // Step 4: Daily MCQ Target Selection
  const handleSelectQuestions = (mcqs: number) => {
    setDailyQuestions(mcqs);
    setTimeout(() => {
      advanceStep(5);
    }, 220);
  };

  const handleSkipQuestions = () => {
    setDailyQuestions(200);
    advanceStep(5);
  };

  // Step 5: Choose "Create My First Plan"
  const handleChooseCreatePlan = () => {
    setPlanChoice('generate');
    const starter = storageService.createStarterPlan(selectedSubjects);
    setGeneratedTasks(starter);
  };

  // Step 5: Subject toggle in plan creation
  const toggleSubject = (sub: SubjectType) => {
    let updated: SubjectType[];
    if (selectedSubjects.includes(sub)) {
      if (selectedSubjects.length === 1) return; // Keep at least one
      updated = selectedSubjects.filter(s => s !== sub);
    } else {
      updated = [...selectedSubjects, sub];
    }
    setSelectedSubjects(updated);
    const starter = storageService.createStarterPlan(updated);
    setGeneratedTasks(starter);
  };

  // Step 5: Remove a task from proposed plan
  const handleRemoveTask = (taskId: string) => {
    setGeneratedTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Step 5: Finalize and finish onboarding with Starter Plan
  const handleStartMyPlan = () => {
    storageService.updateProfile({
      target_exam: targetExam,
      exam_date: examDate,
      daily_study_goal: dailyHours,
      daily_question_goal: dailyQuestions,
      onboarding_completed: true,
      onboarding_step: 5
    });
    storageService.setOnboardingCompleted(true);

    if (generatedTasks.length > 0) {
      storageService.saveStarterPlan(generatedTasks);
    }

    onComplete('today');
  };

  // Step 5: "I'll Do It Myself"
  const handleDoItMyself = () => {
    storageService.updateProfile({
      target_exam: targetExam,
      exam_date: examDate,
      daily_study_goal: dailyHours,
      daily_question_goal: dailyQuestions,
      onboarding_completed: true,
      onboarding_step: 5
    });
    storageService.setOnboardingCompleted(true);
    onComplete('plan');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#121216] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#6e3ff5]/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        {/* TOP PROGRESS BAR & BACK BUTTON */}
        <div className="flex items-center justify-between pb-5 mb-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={goBack}
                className="w-7 h-7 rounded-full bg-[#1c1c22] hover:bg-[#25252c] text-zinc-400 hover:text-white flex items-center justify-center transition border border-white/[0.06]"
                aria-label="Previous step"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="text-xs font-semibold text-zinc-400">
              Let's personalize NEETUp for you
            </span>
          </div>

          <span className="text-xs font-bold text-primary-light px-2.5 py-0.5 rounded-full bg-[#6e3ff5]/15 border border-[#6e3ff5]/25">
            {step} of 5
          </span>
        </div>

        {/* ======================================================= */}
        {/* STEP 1: EXAM TARGET                                    */}
        {/* ======================================================= */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-1.5">
              <div className="w-9 h-9 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[#8b5cf6] mb-3">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                What are you preparing for?
              </h2>
              <p className="text-xs text-zinc-400">
                Select your target NEET milestone to customize your tracker.
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                { label: 'NEET 2027', sub: 'Target date: May 2, 2027 · Standard 2-year prep' },
                { label: 'NEET 2028', sub: 'Target date: May 7, 2028 · Foundation prep' },
                { label: 'NEET Dropper', sub: 'Target date: May 3, 2026 · Intensive revision' }
              ].map(item => {
                const isSelected = targetExam === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleSelectExam(item.label)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all duration-150 active:scale-[0.99] ${
                      isSelected
                        ? 'border-[#6e3ff5] bg-[#6e3ff5]/15 text-white shadow-btn'
                        : 'border-white/[0.08] bg-[#1a1a20] text-zinc-300 hover:border-white/[0.16] hover:bg-[#202028]'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{item.label}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{item.sub}</p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#6e3ff5] flex items-center justify-center text-white shrink-0 shadow-sm animate-scale-up">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* STEP 2: EXAM DATE                                      */}
        {/* ======================================================= */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-1.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                <Calendar className="w-4 h-4" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                When is your exam?
              </h2>
              <p className="text-xs text-zinc-400">
                Powers your daily preparation countdown on the Home dashboard.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-bold mb-1.5">
                  Target Exam Date
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl dark-input text-sm text-white"
                  required
                />
              </div>

              <div className="p-3 rounded-2xl bg-[#1a1a20] border border-white/[0.06] text-[11px] text-zinc-400 leading-relaxed">
                Tip: NEET is officially scheduled on the first Sunday of May.
              </div>

              <button
                type="button"
                onClick={() => advanceStep(3)}
                className="w-full py-3.5 px-6 rounded-full btn-primary text-xs font-bold transition shadow-btn flex items-center justify-center gap-2"
              >
                Continue
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* STEP 3: DAILY STUDY TARGET                             */}
        {/* ======================================================= */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-1.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-3">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                How much can you realistically study each day?
              </h2>
              <p className="text-xs text-zinc-400">
                Consistency is key. Pick a pace you can sustain daily.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {[
                { hours: 4, label: '4 hours / day', note: 'Steady & manageable' },
                { hours: 6, label: '6 hours / day', note: 'Recommended for balanced progress' },
                { hours: 8, label: '8 hours / day', note: 'Focused intensive preparation' },
                { hours: 10, label: '10 hours / day', note: 'Rigorous full-time schedule' },
                { hours: 12, label: '12+ hours / day', note: 'Maximum revision sprint' }
              ].map(opt => {
                const isSelected = dailyHours === opt.hours;
                return (
                  <button
                    key={opt.hours}
                    type="button"
                    onClick={() => handleSelectHours(opt.hours)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all duration-150 active:scale-[0.99] ${
                      isSelected
                        ? 'border-[#6e3ff5] bg-[#6e3ff5]/15 text-white shadow-btn'
                        : 'border-white/[0.08] bg-[#1a1a20] text-zinc-300 hover:border-white/[0.16] hover:bg-[#202028]'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">{opt.label}</span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">{opt.note}</span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#6e3ff5] flex items-center justify-center text-white shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Subtle Confirmation Pill */}
            {hoursConfirmation && (
              <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-center font-bold text-xs animate-fade-in flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                {hoursConfirmation}
              </div>
            )}
          </div>
        )}

        {/* ======================================================= */}
        {/* STEP 4: DAILY MCQ TARGET                               */}
        {/* ======================================================= */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-1.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                How many MCQs do you want to target each day?
              </h2>
              <p className="text-xs text-zinc-400">
                Solving questions builds exam speed and accuracy.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {[100, 150, 200, 250, 300].map(mcqs => {
                const isSelected = dailyQuestions === mcqs;
                return (
                  <button
                    key={mcqs}
                    type="button"
                    onClick={() => handleSelectQuestions(mcqs)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all duration-150 active:scale-[0.99] ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-btn'
                        : 'border-white/[0.08] bg-[#1a1a20] text-zinc-300 hover:border-white/[0.16] hover:bg-[#202028]'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">{mcqs} MCQs / day</span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">
                        ~{Math.round(mcqs / 3)} per subject
                      </span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Skip Option */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleSkipQuestions}
                className="text-xs text-zinc-400 hover:text-white underline transition"
              >
                Skip for now (default 200 MCQs)
              </button>
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* STEP 5: FIRST PLAN                                     */}
        {/* ======================================================= */}
        {step === 5 && (
          <div className="space-y-5 animate-fade-in">
            {planChoice === 'initial' ? (
              <>
                <div className="space-y-1.5">
                  <div className="w-9 h-9 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[#8b5cf6] mb-3">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Let's create your first study plan.
                  </h2>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    NEETUp structures your day so you always know what to study next.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleChooseCreatePlan}
                    className="w-full p-4 rounded-2xl bg-[#6e3ff5] hover:bg-[#5b2ee0] text-white text-left transition shadow-btn group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold flex items-center gap-2">
                        ✨ Create My First Plan
                      </span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                    </div>
                    <p className="text-xs text-purple-100 mt-1">
                      Pick your focus subjects and we'll prepare a clean, manageable starter plan for today.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={handleDoItMyself}
                    className="w-full p-4 rounded-2xl bg-[#1a1a20] hover:bg-[#202028] border border-white/[0.08] text-left transition text-zinc-300 hover:text-white"
                  >
                    <span className="text-sm font-bold block">
                      I'll Do It Myself
                    </span>
                    <p className="text-xs text-zinc-400 mt-1">
                      Start with an empty canvas and plan custom tasks on the calendar.
                    </p>
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">
                    What do you want to focus on today?
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Select subjects to include in today's starter plan:
                  </p>
                </div>

                {/* Subject Selector Checkboxes */}
                <div className="flex gap-2">
                  {(['Physics', 'Chemistry', 'Biology'] as SubjectType[]).map(sub => {
                    const isChecked = selectedSubjects.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => toggleSubject(sub)}
                        className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-bold transition text-center flex items-center justify-center gap-1.5 ${
                          isChecked
                            ? 'border-[#6e3ff5] bg-[#6e3ff5]/20 text-white'
                            : 'border-white/[0.08] bg-[#1a1a20] text-zinc-400'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 text-primary-light stroke-[3]" />}
                        {sub}
                      </button>
                    );
                  })}
                </div>

                {/* TODAY'S PLAN PROPOSAL PREVIEW */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b5cf6] block">
                    Today's Plan ({generatedTasks.length} tasks)
                  </span>

                  {generatedTasks.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-[#1a1a20] border border-white/[0.06] text-center text-xs text-zinc-400">
                      Select at least one subject to generate your plan.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {generatedTasks.map(task => (
                        <div
                          key={task.id}
                          className="p-3 rounded-2xl bg-[#1a1a20] border border-white/[0.08] flex items-center justify-between group"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="text-[10px] font-bold text-primary-light uppercase tracking-wide block">
                              {task.subject_name}
                            </span>
                            <p className="text-xs font-bold text-white truncate">
                              {task.chapter_name}
                            </p>
                            <p className="text-[11px] text-zinc-400">
                              {task.duration} min · {task.task_type}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveTask(task.id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
                            aria-label="Remove task"
                            title="Remove from starter plan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Primary CTA */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleStartMyPlan}
                    disabled={generatedTasks.length === 0}
                    className="w-full py-3.5 rounded-full btn-primary text-xs font-bold transition shadow-btn flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    Start My Plan
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
