import React, { useState, useMemo } from 'react';
import { TestRecord, WeakTopic, RevisionCycle, SubjectType, PriorityLevel } from '../../types';
import { storageService, getTodayDateStr } from '../../services/storageService';
import { SubjectBadge, PriorityBadge, Modal, ProgressBar } from '../common/UIComponents';
import { 
  Award, 
  Plus, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  ChevronRight, 
  BookOpen, 
  Sparkles
} from 'lucide-react';

export const TestsScreen: React.FC = () => {
  const [tests, setTests] = useState<TestRecord[]>(() => storageService.getTests());
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>(() => storageService.getWeakTopics());
  const [revisions, setRevisions] = useState<RevisionCycle[]>(() => storageService.getRevisions());

  const [selectedTest, setSelectedTest] = useState<TestRecord | null>(null);
  const [isAddTestOpen, setIsAddTestOpen] = useState(false);
  const [isAddWeakTopicOpen, setIsAddWeakTopicOpen] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Auto-calculated summary metrics strictly from user's data
  const latestTest = tests[0];
  const latestScore = latestTest
    ? latestTest.physics_score + latestTest.chemistry_score + latestTest.biology_score
    : null;

  const bestScore = useMemo(() => {
    if (tests.length === 0) return null;
    return Math.max(
      ...tests.map(t => t.physics_score + t.chemistry_score + t.biology_score)
    );
  }, [tests]);

  const averageScore = useMemo(() => {
    if (tests.length === 0) return null;
    const total = tests.reduce(
      (acc, t) => acc + (t.physics_score + t.chemistry_score + t.biology_score),
      0
    );
    return Math.round(total / tests.length);
  }, [tests]);

  // Form states for Add Test
  const [testName, setTestName] = useState('Mock Test #1');
  const [testDate, setTestDate] = useState(getTodayDateStr());
  const [phyScore, setPhyScore] = useState<number>(120);
  const [chemScore, setChemScore] = useState<number>(130);
  const [bioScore, setBioScore] = useState<number>(280);
  const [maxMarks] = useState<number>(720);
  const [correct, setCorrect] = useState<number>(135);
  const [incorrect, setIncorrect] = useState<number>(20);
  const [unattempted, setUnattempted] = useState<number>(25);
  const [timeTaken, setTimeTaken] = useState<number>(180);

  // Form states for Add Weak Topic
  const [newWeakSubject, setNewWeakSubject] = useState<SubjectType>('Physics');
  const [newWeakTopicName, setNewWeakTopicName] = useState('');
  const [newWeakChapterName, setNewWeakChapterName] = useState('');
  const [newWeakPriority, setNewWeakPriority] = useState<PriorityLevel>('High');

  const modalTotalScore = Number(phyScore || 0) + Number(chemScore || 0) + Number(bioScore || 0);
  const modalPercentage = Math.round((modalTotalScore / maxMarks) * 100);
  const modalAccuracy = useMemo(() => {
    const attempted = Number(correct || 0) + Number(incorrect || 0);
    return attempted > 0 ? Math.round((Number(correct || 0) / attempted) * 100) : 0;
  }, [correct, incorrect]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const handleSaveTest = (e: React.FormEvent) => {
    e.preventDefault();
    const newTest = storageService.addTest({
      name: testName,
      date: testDate,
      physics_score: Number(phyScore),
      chemistry_score: Number(chemScore),
      biology_score: Number(bioScore),
      maximum_marks: maxMarks,
      correct: Number(correct),
      incorrect: Number(incorrect),
      unattempted: Number(unattempted),
      time_taken: Number(timeTaken)
    });
    setTests(storageService.getTests());
    setIsAddTestOpen(false);
    showToast(`Saved ${testName}: ${modalTotalScore}/720`);
  };

  const handleCreateRevisionTask = (topicId: string, topicName: string) => {
    const task = storageService.createRevisionTaskFromWeakTopic(topicId);
    if (task) {
      setWeakTopics(storageService.getWeakTopics());
      showToast(`Added revision task for "${topicName}" to Today's Plan!`);
    }
  };

  const handleSaveWeakTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeakTopicName.trim()) return;

    const todayDate = new Date();
    const nextDate = new Date(todayDate);
    nextDate.setDate(todayDate.getDate() + 3);

    storageService.addWeakTopic({
      subject_name: newWeakSubject,
      chapter_name: newWeakChapterName || newWeakSubject,
      topic_name: newWeakTopicName.trim(),
      priority: newWeakPriority,
      status: 'Needs Revision',
      last_studied: todayDate.toISOString().split('T')[0],
      next_revision: nextDate.toISOString().split('T')[0]
    });

    setWeakTopics(storageService.getWeakTopics());
    setNewWeakTopicName('');
    setIsAddWeakTopicOpen(false);
    showToast('Weak topic scheduled for revision.');
  };

  const handleToggleRevision = (
    revId: string,
    step: 'initial' | 'rev1' | 'rev2' | 'rev3' | 'rev4'
  ) => {
    storageService.toggleRevisionStep(revId, step);
    setRevisions(storageService.getRevisions());
  };

  return (
    <div className="space-y-6 pb-28 md:pb-10 max-w-2xl mx-auto relative">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#6e3ff5] text-white font-bold text-xs py-2.5 px-5 rounded-full shadow-btn animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {feedbackToast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Tests</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Mock performance, subject breakdown, and targeted revision</p>
        </div>
        <button
          onClick={() => setIsAddTestOpen(true)}
          className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 shadow-btn"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Add Test
        </button>
      </div>

      {/* 1. TOP SUMMARY CARDS */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="dark-card rounded-2xl p-4 border border-white/[0.07] text-center">
          <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Latest Score
          </span>
          <div className="text-xl sm:text-2xl font-black text-primary-light tracking-tight">
            {latestScore !== null ? (
              <>
                {latestScore} <span className="text-xs font-semibold text-zinc-400">/ 720</span>
              </>
            ) : (
              <span className="text-zinc-500 font-bold">--</span>
            )}
          </div>
          <span className="text-[10px] text-zinc-400 mt-0.5 block">
            {latestTest ? `${Math.round((latestScore! / 720) * 100)}%` : 'No tests'}
          </span>
        </div>

        <div className="dark-card rounded-2xl p-4 border border-white/[0.07] text-center">
          <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Average
          </span>
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {averageScore !== null ? (
              <>
                {averageScore} <span className="text-xs font-semibold text-zinc-400">/ 720</span>
              </>
            ) : (
              <span className="text-zinc-500 font-bold">--</span>
            )}
          </div>
          <span className="text-[10px] text-zinc-400 mt-0.5 block">
            {tests.length > 0 ? `${tests.length} tests` : 'No tests'}
          </span>
        </div>

        <div className="dark-card rounded-2xl p-4 border border-white/[0.07] text-center">
          <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            Best Score
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
            {bestScore !== null ? (
              <>
                {bestScore} <span className="text-xs font-semibold text-zinc-400">/ 720</span>
              </>
            ) : (
              <span className="text-zinc-500 font-bold">--</span>
            )}
          </div>
          <span className="text-[10px] text-emerald-400/90 mt-0.5 block">Target: 650+</span>
        </div>
      </div>

      {/* 2. RECENT TESTS LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs uppercase tracking-wider font-bold text-white">
            Recent Mock Tests
          </h2>
          <span className="text-xs text-zinc-400">Tap to view breakdown</span>
        </div>

        {tests.length === 0 ? (
          <div className="dark-card rounded-3xl p-8 text-center border border-white/[0.06] space-y-2">
            <p className="text-sm font-bold text-white">No mock tests logged yet.</p>
            <p className="text-xs text-zinc-400">Track your mock tests to identify weak areas and improve accuracy.</p>
            <div className="pt-2">
              <button
                onClick={() => setIsAddTestOpen(true)}
                className="btn-primary py-2 px-5 text-xs font-bold inline-flex items-center gap-1.5 shadow-btn"
              >
                <Plus className="w-3.5 h-3.5" />
                + Add Test
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tests.map(test => {
              const total = test.physics_score + test.chemistry_score + test.biology_score;
              const percent = Math.round((total / (test.maximum_marks || 720)) * 100);
              const attempted = (test.correct || 0) + (test.incorrect || 0);
              const testAccuracy = attempted > 0 ? Math.round((test.correct / attempted) * 100) : 0;

              return (
                <div
                  key={test.id}
                  onClick={() => setSelectedTest(test)}
                  className="dark-card dark-card-hover rounded-2xl p-4 border border-white/[0.08] cursor-pointer flex items-center justify-between gap-3 transition"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white tracking-tight truncate">
                        {test.name}
                      </span>
                      <span className="text-[11px] text-zinc-400">{test.date}</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs">
                      <span className="font-black text-primary-light">
                        {total} / {test.maximum_marks || 720}
                      </span>
                      <span className="text-zinc-400">({percent}%)</span>
                      <span>·</span>
                      <span className="text-emerald-400 font-semibold">{testAccuracy}% accuracy</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-0.5">
                      <span className="text-[#7dd3fc]">P: {test.physics_score}</span>
                      <span>·</span>
                      <span className="text-[#e9d5ff]">C: {test.chemistry_score}</span>
                      <span>·</span>
                      <span className="text-[#6ee7b7]">B: {test.biology_score}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-primary-light hidden sm:inline-block font-bold">Details</span>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. WEAK TOPICS SECTION */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs uppercase tracking-wider font-bold text-white">
              Weak Topics Focus
            </h2>
          </div>
          <button
            onClick={() => setIsAddWeakTopicOpen(true)}
            className="text-xs text-primary-light hover:underline font-bold"
          >
            + Add Weak Topic
          </button>
        </div>

        {weakTopics.length === 0 ? (
          <div className="dark-card rounded-2xl p-5 text-center border border-white/[0.06] space-y-1">
            <p className="text-sm font-bold text-white">Great! No weak topics added yet.</p>
            <p className="text-xs text-zinc-400">Flag difficult topics from mock tests to schedule focused revision.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {weakTopics.map(item => (
              <div
                key={item.id}
                className="dark-card rounded-2xl p-4 border border-white/[0.08] space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <SubjectBadge subject={item.subject_name} size="sm" />
                    <PriorityBadge priority={item.priority} />
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-tight">{item.topic_name}</h3>
                  <p className="text-xs text-zinc-400 truncate">{item.chapter_name}</p>

                  <div className="pt-1 text-[11px] text-zinc-400 space-y-0.5">
                    <div>Last studied: <span className="text-zinc-300">{item.last_studied || 'Recently'}</span></div>
                    <div>Next revision: <span className="text-primary-light font-medium">{item.next_revision || 'Pending'}</span></div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCreateRevisionTask(item.id, item.topic_name)}
                  className="w-full py-2 px-3 rounded-full bg-[#272730] hover:bg-[#6e3ff5] text-zinc-200 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-98 border border-white/[0.08]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#8b5cf6]" />
                  Create Revision Task
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. REVISION TRACKER */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs uppercase tracking-wider font-bold text-white">
              Spaced Revision Tracker
            </h2>
          </div>
          <span className="text-xs text-zinc-400">4-Stage Retention</span>
        </div>

        {revisions.length === 0 ? (
          <div className="dark-card rounded-2xl p-5 text-center border border-white/[0.06]">
            <p className="text-xs text-zinc-400">
              No active revision cycles yet. Topics scheduled from weak areas or tasks will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {revisions.map(rev => (
              <div key={rev.id} className="dark-card rounded-2xl p-4 border border-white/[0.08] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <SubjectBadge subject={rev.subject_name} size="sm" />
                      <span className="text-sm font-bold text-white tracking-tight">{rev.topic_name}</span>
                    </div>
                    <span className="text-xs text-zinc-400">{rev.chapter_name}</span>
                  </div>
                  <div className="text-xs text-primary-light font-bold">
                    Next: {rev.next_revision || 'Upcoming'}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-center">
                  {[
                    { key: 'initial', label: 'Initial', done: rev.initial_studied },
                    { key: 'rev1', label: 'Rev 1', done: rev.rev1_completed },
                    { key: 'rev2', label: 'Rev 2', done: rev.rev2_completed },
                    { key: 'rev3', label: 'Rev 3', done: rev.rev3_completed },
                    { key: 'rev4', label: 'Rev 4', done: rev.rev4_completed },
                  ].map(step => (
                    <button
                      key={step.key}
                      onClick={() => handleToggleRevision(rev.id, step.key as any)}
                      className={`p-2 rounded-full border text-xs font-bold transition flex items-center justify-center gap-1 ${
                        step.done
                          ? 'border-[#6e3ff5] bg-[#6e3ff5] text-white shadow-btn'
                          : 'border-white/[0.08] bg-[#222228] text-zinc-400'
                      }`}
                    >
                      {step.done && <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />}
                      {step.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TEST DETAIL MODAL */}
      <Modal
        isOpen={Boolean(selectedTest)}
        onClose={() => setSelectedTest(null)}
        title={selectedTest?.name || 'Test Breakdown'}
        subtitle={selectedTest?.date}
      >
        {selectedTest && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#222228] text-center border border-white/[0.08]">
              <span className="text-3xl font-black text-primary-light">
                {selectedTest.physics_score + selectedTest.chemistry_score + selectedTest.biology_score}
                <span className="text-sm font-semibold text-zinc-400"> / {selectedTest.maximum_marks || 720}</span>
              </span>
              <div className="flex items-center justify-center gap-3 mt-1 text-xs">
                <span className="font-bold text-white">
                  {Math.round(
                    ((selectedTest.physics_score + selectedTest.chemistry_score + selectedTest.biology_score) /
                      (selectedTest.maximum_marks || 720)) *
                      100
                  )}%
                </span>
                <span>·</span>
                <span className="text-emerald-400 font-bold">
                  {Math.round(
                    (selectedTest.correct / ((selectedTest.correct || 0) + (selectedTest.incorrect || 0))) * 100
                  )}% accuracy
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider">Subject Scores</span>
              
              <div className="p-3 rounded-2xl border border-white/[0.07] bg-[#222228] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#7dd3fc] block">Physics</span>
                  <span className="text-[11px] text-zinc-400">Max 180 marks</span>
                </div>
                <span className="text-base font-black text-[#7dd3fc]">{selectedTest.physics_score} / 180</span>
              </div>

              <div className="p-3 rounded-2xl border border-white/[0.07] bg-[#222228] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#e9d5ff] block">Chemistry</span>
                  <span className="text-[11px] text-zinc-400">Max 180 marks</span>
                </div>
                <span className="text-base font-black text-[#e9d5ff]">{selectedTest.chemistry_score} / 180</span>
              </div>

              <div className="p-3 rounded-2xl border border-white/[0.07] bg-[#222228] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#6ee7b7] block">Biology</span>
                  <span className="text-[11px] text-zinc-400">Max 360 marks</span>
                </div>
                <span className="text-base font-black text-[#6ee7b7]">{selectedTest.biology_score} / 360</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-2xl bg-[#222228] border border-white/[0.07]">
                <span className="text-zinc-400 block text-[10px]">Correct</span>
                <span className="text-emerald-400 font-bold">{selectedTest.correct}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#222228] border border-white/[0.07]">
                <span className="text-zinc-400 block text-[10px]">Incorrect</span>
                <span className="text-rose-400 font-bold">{selectedTest.incorrect}</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#222228] border border-white/[0.07]">
                <span className="text-zinc-400 block text-[10px]">Unattempted</span>
                <span className="text-zinc-400 font-bold">{selectedTest.unattempted}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTest(null)}
              className="w-full py-2.5 rounded-full bg-[#25252c] text-xs font-bold text-zinc-300 hover:text-white transition"
            >
              Close Breakdown
            </button>
          </div>
        )}
      </Modal>

      {/* ADD TEST MODAL */}
      <Modal
        isOpen={isAddTestOpen}
        onClose={() => setIsAddTestOpen(false)}
        title="Add Mock Test Score"
        subtitle="Automatic calculation of total score, % and accuracy"
      >
        <form onSubmit={handleSaveTest} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Test Name
              </label>
              <input
                type="text"
                value={testName}
                onChange={e => setTestName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl dark-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                value={testDate}
                onChange={e => setTestDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl dark-input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Subject Scores
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-2xl border border-white/[0.08] bg-[#222228] text-center">
                <span className="text-[11px] font-bold text-[#7dd3fc] block mb-1">Physics (/180)</span>
                <input
                  type="number"
                  max="180"
                  min="0"
                  value={phyScore}
                  onChange={e => setPhyScore(parseInt(e.target.value) || 0)}
                  className="w-full text-center font-black text-white dark-input py-1 text-sm rounded-xl"
                />
              </div>

              <div className="p-2.5 rounded-2xl border border-white/[0.08] bg-[#222228] text-center">
                <span className="text-[11px] font-bold text-[#e9d5ff] block mb-1">Chemistry (/180)</span>
                <input
                  type="number"
                  max="180"
                  min="0"
                  value={chemScore}
                  onChange={e => setChemScore(parseInt(e.target.value) || 0)}
                  className="w-full text-center font-black text-white dark-input py-1 text-sm rounded-xl"
                />
              </div>

              <div className="p-2.5 rounded-2xl border border-white/[0.08] bg-[#222228] text-center">
                <span className="text-[11px] font-bold text-[#6ee7b7] block mb-1">Biology (/360)</span>
                <input
                  type="number"
                  max="360"
                  min="0"
                  value={bioScore}
                  onChange={e => setBioScore(parseInt(e.target.value) || 0)}
                  className="w-full text-center font-black text-white dark-input py-1 text-sm rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] text-emerald-400 font-bold mb-1">Correct</label>
              <input
                type="number"
                min="0"
                value={correct}
                onChange={e => setCorrect(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-xs dark-input rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] text-rose-400 font-bold mb-1">Incorrect</label>
              <input
                type="number"
                min="0"
                value={incorrect}
                onChange={e => setIncorrect(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-xs dark-input rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-400 font-bold mb-1">Unattempted</label>
              <input
                type="number"
                min="0"
                value={unattempted}
                onChange={e => setUnattempted(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-xs dark-input rounded-xl"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#222228] border border-[#6e3ff5]/30 flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-400 block">Total Calculated Score</span>
              <span className="text-2xl font-black text-white">{modalTotalScore} / {maxMarks}</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-primary-light block">{modalPercentage}%</span>
              <span className="text-xs text-emerald-400 font-bold">{modalAccuracy}% accuracy</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-full btn-primary font-bold text-xs uppercase tracking-wider transition shadow-btn"
          >
            Save Test Result
          </button>
        </form>
      </Modal>

      {/* ADD WEAK TOPIC MODAL */}
      <Modal
        isOpen={isAddWeakTopicOpen}
        onClose={() => setIsAddWeakTopicOpen(false)}
        title="Add Weak Area"
        subtitle="Turn struggles into targeted revision cycles"
      >
        <form onSubmit={handleSaveWeakTopic} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Subject</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Physics', 'Chemistry', 'Biology'] as SubjectType[]).map(sub => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setNewWeakSubject(sub)}
                  className={`py-2 text-xs font-bold rounded-full border transition ${
                    newWeakSubject === sub
                      ? 'border-[#6e3ff5] bg-[#6e3ff5] text-white'
                      : 'border-white/[0.08] bg-[#222228] text-zinc-400'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Chapter / Unit
            </label>
            <input
              type="text"
              value={newWeakChapterName}
              onChange={e => setNewWeakChapterName(e.target.value)}
              placeholder="e.g. Ray Optics & Optical Instruments"
              className="w-full px-3.5 py-2.5 rounded-2xl dark-input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Specific Problem Topic
            </label>
            <input
              type="text"
              required
              value={newWeakTopicName}
              onChange={e => setNewWeakTopicName(e.target.value)}
              placeholder="e.g. Prism minimum deviation angle numericals"
              className="w-full px-3.5 py-2.5 rounded-2xl dark-input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Priority</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Low', 'Medium', 'High'] as PriorityLevel[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setNewWeakPriority(p)}
                  className={`py-2 text-xs font-bold rounded-full border transition ${
                    newWeakPriority === p
                      ? 'border-rose-500 bg-rose-500/25 text-rose-300'
                      : 'border-white/[0.08] bg-[#222228] text-zinc-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-full btn-primary font-bold text-xs transition shadow-btn"
          >
            Add Weak Topic
          </button>
        </form>
      </Modal>
    </div>
  );
};
