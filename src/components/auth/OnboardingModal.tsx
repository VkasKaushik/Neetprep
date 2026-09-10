import React, { useState } from 'react';
import { storageService } from '../../services/storageService';
import { Sparkles, Calendar, Clock, HelpCircle, CheckCircle2, ChevronRight, User } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const currentProfile = storageService.getProfile();
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState(currentProfile.name || '');
  const [targetExam, setTargetExam] = useState(currentProfile.target_exam || 'NEET 2027');
  const [examDate, setExamDate] = useState(currentProfile.exam_date || '2027-05-02');
  const [dailyHours, setDailyHours] = useState(currentProfile.daily_study_goal || 6);
  const [dailyQuestions, setDailyQuestions] = useState(currentProfile.daily_question_goal || 200);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      storageService.updateProfile({
        name: name.trim() || 'Aspirant',
        target_exam: targetExam,
        exam_date: examDate,
        daily_study_goal: Number(dailyHours),
        daily_question_goal: Number(dailyQuestions)
      });
      setStep(6);
    }
  };

  const handleFinish = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#16161c] rounded-3xl border border-white/[0.08] p-6 sm:p-8 shadow-2xl relative">
        {/* Progress Indicator */}
        {step <= 5 && (
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
              Step {step} of 5
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step
                      ? 'bg-[#6e3ff5] w-7'
                      : i < step
                      ? 'bg-[#6e3ff5]/40 w-3.5'
                      : 'bg-white/[0.08] w-3.5'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: What should we call you? */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#202028] border border-white/[0.08] flex items-center justify-center text-primary-light">
              <User className="w-5 h-5 text-[#8b5cf6]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">What should we call you?</h2>
              <p className="text-xs text-zinc-400 mt-1">Your personal study companion greets you every day.</p>
            </div>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Aryan"
              className="w-full px-4 py-3 rounded-2xl dark-input text-base text-white"
            />
          </div>
        )}

        {/* STEP 2: Which NEET attempt are you preparing for? */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#202028] border border-white/[0.08] flex items-center justify-center text-primary-light">
              <Sparkles className="w-5 h-5 text-[#8b5cf6]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Which NEET attempt are you preparing for?</h2>
              <p className="text-xs text-zinc-400 mt-1">Select your target exam milestone.</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {['NEET 2026', 'NEET 2027', 'NEET 2028', 'NEET Dropper'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setTargetExam(opt)}
                  className={`p-3.5 rounded-2xl border text-xs font-bold transition text-left ${
                    targetExam === opt
                      ? 'border-[#6e3ff5] bg-[#6e3ff5] text-white shadow-btn'
                      : 'border-white/[0.08] bg-[#202028] text-zinc-300 hover:border-white/[0.16]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Target exam date */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#202028] border border-white/[0.08] flex items-center justify-center text-primary-light">
              <Calendar className="w-5 h-5 text-[#8b5cf6]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">When is your target exam date?</h2>
              <p className="text-xs text-zinc-400 mt-1">Used to calculate your daily preparation countdown.</p>
            </div>
            <input
              type="date"
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl dark-input text-sm text-white"
            />
          </div>
        )}

        {/* STEP 4: Daily study hours */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#202028] border border-white/[0.08] flex items-center justify-center text-primary-light">
              <Clock className="w-5 h-5 text-[#8b5cf6]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">How many hours can you realistically study each day?</h2>
              <p className="text-xs text-zinc-400 mt-1">Consistency beats sporadic bursts.</p>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#202028] border border-white/[0.08]">
              <span className="text-3xl font-black text-primary-light">{dailyHours} hrs</span>
              <span className="text-xs text-zinc-400 font-semibold">Daily Study Target</span>
            </div>
            <input
              type="range"
              min="2"
              max="14"
              step="1"
              value={dailyHours}
              onChange={e => setDailyHours(Number(e.target.value))}
              className="w-full accent-[#6e3ff5] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-zinc-400 font-medium">
              <span>2 hours (Light)</span>
              <span>6 hours (Recommended)</span>
              <span>12+ hrs (Intense)</span>
            </div>
          </div>
        )}

        {/* STEP 5: Daily questions */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#202028] border border-white/[0.08] flex items-center justify-center text-primary-light">
              <HelpCircle className="w-5 h-5 text-[#8b5cf6]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">How many questions do you want to solve each day?</h2>
              <p className="text-xs text-zinc-400 mt-1">MCQs across Physics, Chemistry, and Biology.</p>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#202028] border border-white/[0.08]">
              <span className="text-3xl font-black text-emerald-400">{dailyQuestions}</span>
              <span className="text-xs text-zinc-400 font-semibold">Daily MCQs Target</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[100, 150, 200, 250, 300].map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setDailyQuestions(q)}
                  className={`py-2 px-3 rounded-full border text-xs font-bold transition ${
                    dailyQuestions === q
                      ? 'border-[#6e3ff5] bg-[#6e3ff5] text-white shadow-btn'
                      : 'border-white/[0.08] bg-[#202028] text-zinc-300'
                  }`}
                >
                  {q} MCQs
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: Completion Screen */}
        {step === 6 && (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#6e3ff5]/20 border border-[#6e3ff5]/40 text-primary-light mx-auto flex items-center justify-center shadow-btn">
              <CheckCircle2 className="w-8 h-8 text-[#8b5cf6]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Your NEET plan is ready.</h2>
              <p className="text-xs text-zinc-300 mt-2 max-w-xs mx-auto leading-relaxed">
                Personalized for {targetExam} with {dailyHours}h daily study goal and {dailyQuestions} MCQs target.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleFinish}
                className="w-full py-3.5 px-6 rounded-full btn-primary text-sm font-bold transition shadow-btn flex items-center justify-center gap-2"
              >
                Start Preparing
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* Action Button for Steps 1-5 */}
        {step <= 5 && (
          <div className="pt-4 mt-2">
            <button
              onClick={handleNext}
              className="w-full py-3 px-4 rounded-full btn-primary text-sm font-bold transition flex items-center justify-center gap-2 shadow-btn"
            >
              Continue
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
