import React, { useState, useMemo, useEffect } from 'react';
import { SubjectType, TaskType, PriorityLevel } from '../../types';
import { NEET_SYLLABUS } from '../../data/neetSyllabus';
import { getTodayDateStr } from '../../services/storageService';
import { Modal } from '../common/UIComponents';
import { Plus, ChevronDown, Clock } from 'lucide-react';

const LAST_SUBJECT_KEY = 'neet_last_subject';
const LAST_TASK_TYPE_KEY = 'neet_last_task_type';
const LAST_DURATION_KEY = 'neet_last_duration';
const LAST_PRIORITY_KEY = 'neet_last_priority';

// Simplified 4 core task types
const SIMPLIFIED_TASK_TYPES: TaskType[] = ['Study', 'MCQs', 'Revision', 'Test'];

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: {
    subject_name: SubjectType;
    subject_id: string;
    chapter_name: string;
    topic_name?: string;
    task_type: TaskType;
    title: string;
    duration: number;
    priority: PriorityLevel;
    date: string;
  }) => void;
  defaultDate?: string;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
  defaultDate
}) => {
  // Load remembered selections or use defaults
  const getInitialSubject = (): SubjectType => {
    try {
      const saved = localStorage.getItem(LAST_SUBJECT_KEY);
      if (saved === 'Physics' || saved === 'Chemistry' || saved === 'Biology') {
        return saved;
      }
    } catch {}
    return 'Physics';
  };

  const getInitialTaskType = (): TaskType => {
    try {
      const saved = localStorage.getItem(LAST_TASK_TYPE_KEY);
      if (saved && (SIMPLIFIED_TASK_TYPES as string[]).includes(saved)) {
        return saved as TaskType;
      }
    } catch {}
    return 'Study';
  };

  const getInitialDuration = (): number => {
    try {
      const saved = localStorage.getItem(LAST_DURATION_KEY);
      if (saved) return Number(saved);
    } catch {}
    return 45; // Default 45 min
  };

  const getInitialPriority = (): PriorityLevel => {
    try {
      const saved = localStorage.getItem(LAST_PRIORITY_KEY);
      if (saved === 'Low' || saved === 'Medium' || saved === 'High') {
        return saved;
      }
    } catch {}
    return 'Medium'; // Default Medium
  };

  const [subject, setSubject] = useState<SubjectType>(getInitialSubject);
  const [chapter, setChapter] = useState('');
  const [taskType, setTaskType] = useState<TaskType>(getInitialTaskType);
  const [duration, setDuration] = useState<number>(getInitialDuration);

  // Collapsed "More options" fields
  const [showMore, setShowMore] = useState(false);
  const [topic, setTopic] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>(getInitialPriority);
  const [date, setDate] = useState<string>(defaultDate || getTodayDateStr());

  // Chapters list for current subject
  const chapters = useMemo(() => {
    return NEET_SYLLABUS[subject].chapters.map(c => c.name);
  }, [subject]);

  // Sync / remember chapter when subject changes
  useEffect(() => {
    try {
      const lastChapter = localStorage.getItem(`neet_last_chapter_${subject}`);
      if (lastChapter && chapters.includes(lastChapter)) {
        setChapter(lastChapter);
        return;
      }
    } catch {}
    setChapter(chapters[0] || '');
  }, [subject, chapters]);

  // Sync date when defaultDate prop changes
  useEffect(() => {
    if (defaultDate) {
      setDate(defaultDate);
    } else {
      setDate(getTodayDateStr());
    }
  }, [defaultDate, isOpen]);

  // Selected chapter's topics
  const currentChapterObj = useMemo(() => {
    return NEET_SYLLABUS[subject].chapters.find(c => c.name === chapter);
  }, [subject, chapter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activeChapter = chapter || chapters[0];
    if (!activeChapter) return;

    const generatedTitle = topic.trim()
      ? `${activeChapter} (${topic.trim()}) - ${taskType}`
      : `${activeChapter} - ${taskType}`;

    onAddTask({
      subject_name: subject,
      subject_id: subject,
      chapter_name: activeChapter,
      topic_name: topic.trim() || undefined,
      task_type: taskType,
      title: generatedTitle,
      duration: Number(duration),
      priority,
      date: date || getTodayDateStr()
    });

    // Save recently used selections to speed up repeated task creation
    try {
      localStorage.setItem(LAST_SUBJECT_KEY, subject);
      localStorage.setItem(LAST_TASK_TYPE_KEY, taskType);
      localStorage.setItem(LAST_DURATION_KEY, String(duration));
      localStorage.setItem(LAST_PRIORITY_KEY, priority);
      localStorage.setItem(`neet_last_chapter_${subject}`, activeChapter);
    } catch {}

    setTopic('');
    setShowMore(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Study Task"
      subtitle="Schedule your next study block"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* 1. SUBJECT (Prominent) */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
            Subject
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Physics', 'Chemistry', 'Biology'] as SubjectType[]).map(sub => {
              const isSelected = subject === sub;
              const activeStyle = {
                Physics: 'bg-[#0369a1] border-[#38bdf8] text-white shadow-sm',
                Chemistry: 'bg-[#6d28d9] border-[#c084fc] text-white shadow-sm',
                Biology: 'bg-[#047857] border-[#34d399] text-white shadow-sm',
              }[sub];

              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSubject(sub)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition active:scale-98 ${
                    isSelected
                      ? activeStyle
                      : 'border-white/[0.08] bg-[#18181f] text-zinc-400 hover:text-white'
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. CHAPTER (Prominent & Required) */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
            Chapter <span className="text-rose-400">*</span>
          </label>
          <select
            required
            value={chapter}
            onChange={e => {
              setChapter(e.target.value);
              setTopic('');
            }}
            className="w-full px-3.5 py-2.5 rounded-xl dark-input text-xs sm:text-sm text-white font-medium cursor-pointer"
          >
            {chapters.map(ch => (
              <option key={ch} value={ch} className="bg-[#18181e] text-white">
                {ch}
              </option>
            ))}
          </select>
        </div>

        {/* 3. TASK TYPE (Prominent: Study / MCQs / Revision / Test) */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
            Task Type
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {SIMPLIFIED_TASK_TYPES.map(type => {
              const isSelected = taskType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTaskType(type)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition active:scale-98 ${
                    isSelected
                      ? 'border-[#6e3ff5] bg-[#6e3ff5] text-white shadow-btn'
                      : 'border-white/[0.08] bg-[#18181f] text-zinc-400 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. DURATION (Prominent presets: 30m, 45m, 60m, 90m) */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
            Duration
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[30, 45, 60, 90].map(mins => {
              const isSelected = duration === mins;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDuration(mins)}
                  className={`py-2 text-center rounded-xl border text-xs font-bold transition active:scale-98 ${
                    isSelected
                      ? 'border-[#6e3ff5] bg-[#6e3ff5] text-white shadow-btn'
                      : 'border-white/[0.08] bg-[#18181f] text-zinc-400 hover:text-white'
                  }`}
                >
                  {mins} min
                </button>
              );
            })}
          </div>
        </div>

        {/* COLLAPSED "MORE OPTIONS" (Topic, Priority, Date) */}
        <div className="pt-0.5">
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="flex items-center justify-between w-full py-2 px-1 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition"
          >
            <span className="flex items-center gap-1.5">
              <span>More options</span>
              {!showMore && (
                <span className="text-[11px] text-zinc-500 font-normal">
                  · {priority} · {date === getTodayDateStr() ? 'Today' : date}
                </span>
              )}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showMore ? 'rotate-180' : ''}`} />
          </button>

          {showMore && (
            <div className="space-y-3 pt-2.5 pb-1 border-t border-white/[0.05] animate-fade-in">
              {/* Topic (Optional) */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Topic (Optional)
                </label>
                {currentChapterObj && currentChapterObj.topics.length > 0 ? (
                  <select
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl dark-input text-xs text-zinc-200"
                  >
                    <option value="" className="bg-[#18181e]">
                      General / Entire chapter
                    </option>
                    {currentChapterObj.topics.map(t => (
                      <option key={t} value={t} className="bg-[#18181e]">
                        {t}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="e.g. Electric Dipole Moment"
                    className="w-full px-3 py-2 rounded-xl dark-input text-xs text-white"
                  />
                )}
              </div>

              {/* Priority & Date */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['Low', 'Medium', 'High'] as PriorityLevel[]).map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setPriority(lvl)}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition text-center ${
                          priority === lvl
                            ? lvl === 'High'
                              ? 'border-rose-500/60 bg-rose-500/20 text-rose-300'
                              : lvl === 'Medium'
                              ? 'border-amber-500/60 bg-amber-500/20 text-amber-300'
                              : 'border-zinc-500/60 bg-zinc-500/20 text-zinc-300'
                            : 'border-white/[0.06] bg-[#18181f] text-zinc-400'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl dark-input text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SINGLE PRIMARY CTA: Add Task */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl btn-primary text-sm font-bold flex items-center justify-center gap-2 shadow-btn transition active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Add Task
          </button>
        </div>
      </form>
    </Modal>
  );
};
