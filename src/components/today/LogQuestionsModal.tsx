import React, { useState, useMemo } from 'react';
import { SubjectType } from '../../types';
import { Modal } from '../common/UIComponents';
import { CheckCircle2, Target } from 'lucide-react';

interface LogQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: {
    physics: number;
    chemistry: number;
    biology: number;
    correct: number;
    incorrect: number;
    total: number;
    accuracy: number;
  }) => void;
}

export const LogQuestionsModal: React.FC<LogQuestionsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [physics, setPhysics] = useState<number>(60);
  const [chemistry, setChemistry] = useState<number>(70);
  const [biology, setBiology] = useState<number>(100);

  const totalAttempted = useMemo(() => {
    return Number(physics || 0) + Number(chemistry || 0) + Number(biology || 0);
  }, [physics, chemistry, biology]);

  const [correct, setCorrect] = useState<number>(198);
  const [incorrect, setIncorrect] = useState<number>(32);

  // Auto-calculated accuracy
  const accuracy = useMemo(() => {
    const attempted = Number(correct || 0) + Number(incorrect || 0);
    if (attempted === 0) return 0;
    return Math.round((Number(correct || 0) / attempted) * 100);
  }, [correct, incorrect]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      physics: Number(physics || 0),
      chemistry: Number(chemistry || 0),
      biology: Number(biology || 0),
      correct: Number(correct || 0),
      incorrect: Number(incorrect || 0),
      total: totalAttempted,
      accuracy
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Questions Solved"
      subtitle="Fast tracker for daily MCQ practice"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subject wise questions */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Questions by Subject
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl border border-white/[0.08] bg-[#222228] text-center">
              <span className="block text-xs font-bold text-[#7dd3fc] mb-1">Physics</span>
              <input
                type="number"
                min="0"
                value={physics}
                onChange={e => setPhysics(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-center text-lg font-black text-white dark-input py-1 rounded-xl"
              />
            </div>

            <div className="p-3 rounded-2xl border border-white/[0.08] bg-[#222228] text-center">
              <span className="block text-xs font-bold text-[#e9d5ff] mb-1">Chemistry</span>
              <input
                type="number"
                min="0"
                value={chemistry}
                onChange={e => setChemistry(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-center text-lg font-black text-white dark-input py-1 rounded-xl"
              />
            </div>

            <div className="p-3 rounded-2xl border border-white/[0.08] bg-[#222228] text-center">
              <span className="block text-xs font-bold text-[#6ee7b7] mb-1">Biology</span>
              <input
                type="number"
                min="0"
                value={biology}
                onChange={e => setBiology(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-center text-lg font-black text-white dark-input py-1 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Total attempted display */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#222228] border border-white/[0.08]">
          <span className="text-xs text-zinc-400 font-semibold">Total MCQs Attempted</span>
          <span className="text-xl font-black text-primary-light">{totalAttempted}</span>
        </div>

        {/* Accuracy Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
              Correct
            </label>
            <input
              type="number"
              min="0"
              value={correct}
              onChange={e => setCorrect(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3.5 py-2 text-base font-bold text-emerald-300 dark-input rounded-2xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
              Incorrect
            </label>
            <input
              type="number"
              min="0"
              value={incorrect}
              onChange={e => setIncorrect(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3.5 py-2 text-base font-bold text-rose-300 dark-input rounded-2xl"
            />
          </div>
        </div>

        {/* Calculated Accuracy banner */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#252530] border border-[#6e3ff5]/30">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#8b5cf6]" />
            <span className="text-xs text-zinc-200 font-bold">Calculated Accuracy</span>
          </div>
          <span className="text-lg font-black text-primary-light">{accuracy}%</span>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3 rounded-full btn-primary text-sm font-bold flex items-center justify-center gap-2 shadow-btn"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            Log {totalAttempted} Questions
          </button>
        </div>
      </form>
    </Modal>
  );
};
