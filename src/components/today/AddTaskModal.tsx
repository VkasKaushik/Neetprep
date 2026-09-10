import React, { useState, useMemo } from 'react';
import { SubjectType, TaskType, PriorityLevel } from '../../types';
import { NEET_SYLLABUS } from '../../data/neetSyllabus';
import { getTodayDateStr } from '../../services/storageService';
import { Modal } from '../common/UIComponents';
import { PlusCircle, Clock, Tag } from 'lucide-react';

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
  const [subject, setSubject] = useState<SubjectType>('Physics');
  const [chapter, setChapter] = useState('');
  const [topic, setTopic] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('MCQs');
  const [duration, setDuration] = useState<number>(45);
  const [priority, setPriority] = useState<PriorityLevel>('High');
  const [date, setDate] = useState<string>(defaultDate || getTodayDateStr());
  const [customTitle, setCustomTitle] = useState('');

  // Update chapter list when subject changes
  const chapters = useMemo(() => {
    return NEET_SYLLABUS[subject].chapters.map(c => c.name);
  }, [subject]);

  // Selected chapter's topics
  const currentChapterObj = useMemo(() => {
    return NEET_SYLLABUS[subject].chapters.find(c => c.name === (chapter || chapters[0]));
  }, [subject, chapter, chapters]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activeChapter = chapter || chapters[0];
    const generatedTitle = customTitle.trim() || `${activeChapter} - ${taskType}`;

    onAddTask({
      subject_name: subject,
      subject_id: subject,
      chapter_name: activeChapter,
      topic_name: topic.trim() || (currentChapterObj?.topics[0] || ''),
      task_type: taskType,
      title: generatedTitle,
      duration: Number(duration),
      priority,
      date
    });

    setCustomTitle('');
    setTopic('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Study Task" subtitle="Keep tasks concise & focused for maximum retention">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Subject Selector (Compact Pills matching Reference) */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Subject</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Physics', 'Chemistry', 'Biology'] as SubjectType[]).map(sub => {
              const isSelected = subject === sub;
              const activeStyle = {
                Physics: 'bg-[#0369a1] border-[#38bdf8] text-white',
                Chemistry: 'bg-[#6d28d9] border-[#c084fc] text-white',
                Biology: 'bg-[#047857] border-[#34d399] text-white',
              }[sub];

              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => {
                    setSubject(sub);
                    setChapter(NEET_SYLLABUS[sub].chapters[0].name);
                  }}
                  className={`py-2 px-3 rounded-full border text-xs font-bold transition ${
                    isSelected
                      ? activeStyle
                      : 'border-white/[0.08] bg-[#222228] text-zinc-400 hover:text-white'
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Chapter Selector */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Chapter</label>
          <select
            value={chapter || chapters[0]}
            onChange={e => {
              setChapter(e.target.value);
              setTopic('');
            }}
            className="w-full px-3.5 py-2.5 rounded-2xl dark-input text-xs sm:text-sm text-zinc-100"
          >
            {chapters.map(ch => (
              <option key={ch} value={ch} className="bg-[#18181e] text-white">
                {ch}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Topic Selection (Optional) */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Topic (Optional)</label>
          {currentChapterObj && currentChapterObj.topics.length > 0 ? (
            <select
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl dark-input text-xs text-zinc-300"
            >
              <option value="" className="bg-[#18181e]">Select specific topic or leave general</option>
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
              className="w-full px-3.5 py-2.5 rounded-2xl dark-input text-xs"
            />
          )}
        </div>

        {/* 4. Task Type (Pills) */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Task Type</label>
          <div className="flex flex-wrap gap-1.5">
            {(['Lecture', 'NCERT', 'Notes', 'MCQs', 'Revision', 'Test', 'Other'] as TaskType[]).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setTaskType(type)}
                className={`py-1.5 px-3 rounded-full text-xs font-semibold border transition ${
                  taskType === type
                    ? 'border-[#6e3ff5] bg-[#6e3ff5] text-white'
                    : 'border-white/[0.08] bg-[#222228] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Duration & Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Duration</label>
            <div className="grid grid-cols-4 gap-1">
              {[30, 45, 60, 90].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDuration(mins)}
                  className={`py-1.5 text-center rounded-xl border text-xs font-bold transition ${
                    duration === mins
                      ? 'border-[#6e3ff5] bg-[#6e3ff5] text-white'
                      : 'border-white/[0.08] bg-[#222228] text-zinc-400'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Priority</label>
            <div className="grid grid-cols-3 gap-1">
              {(['Low', 'Medium', 'High'] as PriorityLevel[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-1.5 text-center rounded-xl border text-xs font-bold transition ${
                    priority === p
                      ? p === 'High' ? 'border-rose-500 bg-rose-500/25 text-rose-300'
                        : p === 'Medium' ? 'border-amber-500 bg-amber-500/25 text-amber-300'
                        : 'border-zinc-500 bg-zinc-500/25 text-zinc-300'
                      : 'border-white/[0.08] bg-[#222228] text-zinc-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 6. Date */}
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-3.5 py-2 rounded-2xl dark-input text-xs"
          />
        </div>

        {/* Submit: Strong Bright Purple CTA */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3 rounded-full btn-primary text-sm font-bold flex items-center justify-center gap-2 shadow-btn"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            Add Task
          </button>
        </div>
      </form>
    </Modal>
  );
};
