import React, { useState, useMemo } from 'react';
import { TestRecord, SubjectType } from '../../types';
import { storageService, getTodayDateStr } from '../../services/storageService';
import { ProgressBar, Modal } from '../common/UIComponents';
import { 
  Plus, 
  ArrowLeft, 
  ArrowRight,
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  BookOpen, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

export const TestsScreen: React.FC = () => {
  const [tests, setTests] = useState<TestRecord[]>(() => storageService.getTests());
  const [selectedTest, setSelectedTest] = useState<TestRecord | null>(null);
  const [isAddTestOpen, setIsAddTestOpen] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [revisionPlanCreated, setRevisionPlanCreated] = useState<boolean>(false);

  // Form states for Add Test
  const [testName, setTestName] = useState('Full Syllabus Mock Test');
  const [testDate, setTestDate] = useState(getTodayDateStr());
  const [phyScore, setPhyScore] = useState<number>(120);
  const [chemScore, setChemScore] = useState<number>(130);
  const [bioScore, setBioScore] = useState<number>(280);
  const [maxMarks] = useState<number>(720);
  const [correct, setCorrect] = useState<number>(135);
  const [incorrect, setIncorrect] = useState<number>(20);
  const [unattempted, setUnattempted] = useState<number>(25);
  const [timeTaken, setTimeTaken] = useState<number>(180);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Sort tests descending by date/created
  const sortedTests = useMemo(() => {
    return [...tests].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tests]);

  // Top summary metrics
  const latestTest = sortedTests[0] || null;
  const previousTest = sortedTests[1] || null;

  const latestScore = latestTest
    ? latestTest.physics_score + latestTest.chemistry_score + latestTest.biology_score
    : null;

  const previousScore = previousTest
    ? previousTest.physics_score + previousTest.chemistry_score + previousTest.biology_score
    : null;

  const scoreChange = (latestScore !== null && previousScore !== null)
    ? latestScore - previousScore
    : null;

  const averageScore = useMemo(() => {
    if (sortedTests.length === 0) return null;
    const total = sortedTests.reduce(
      (acc, t) => acc + (t.physics_score + t.chemistry_score + t.biology_score),
      0
    );
    return Math.round(total / sortedTests.length);
  }, [sortedTests]);

  const bestScore = useMemo(() => {
    if (sortedTests.length === 0) return null;
    return Math.max(
      ...sortedTests.map(t => t.physics_score + t.chemistry_score + t.biology_score)
    );
  }, [sortedTests]);

  // Form calculated stats
  const modalTotalScore = Number(phyScore || 0) + Number(chemScore || 0) + Number(bioScore || 0);
  const modalPercentage = Math.round((modalTotalScore / maxMarks) * 100);
  const modalAccuracy = useMemo(() => {
    const attempted = Number(correct || 0) + Number(incorrect || 0);
    return attempted > 0 ? Math.round((Number(correct || 0) / attempted) * 100) : 0;
  }, [correct, incorrect]);

  const handleSaveTest = (e: React.FormEvent) => {
    e.preventDefault();
    const newTest = storageService.addTest({
      name: testName.trim() || 'Mock Test',
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
    const updated = storageService.getTests();
    setTests(updated);
    setIsAddTestOpen(false);
    showToast(`Logged ${newTest.name}: ${modalTotalScore}/720`);
  };

  // Find index of selected test to determine previous test comparison
  const selectedIndex = useMemo(() => {
    if (!selectedTest) return -1;
    return sortedTests.findIndex(t => t.id === selectedTest.id);
  }, [selectedTest, sortedTests]);

  const selectedPrevTest = useMemo(() => {
    if (selectedIndex === -1 || selectedIndex >= sortedTests.length - 1) return null;
    return sortedTests[selectedIndex + 1];
  }, [selectedIndex, sortedTests]);

  // Create Revision Plan from Test Breakdown
  const handleCreateRevisionPlan = (test: TestRecord) => {
    const phyRatio = test.physics_score / 180;
    const chemRatio = test.chemistry_score / 180;
    const bioRatio = test.biology_score / 360;

    let targetSubject: SubjectType = 'Physics';
    let chapter1 = 'Ray Optics & Optical Instruments';
    let chapter2 = 'Current Electricity & Circuits';

    if (chemRatio <= phyRatio && chemRatio <= bioRatio) {
      targetSubject = 'Chemistry';
      chapter1 = 'Chemical Bonding & Molecular Structure';
      chapter2 = 'Hydrocarbons & Reaction Mechanisms';
    } else if (bioRatio <= phyRatio && bioRatio <= chemRatio) {
      targetSubject = 'Biology';
      chapter1 = 'Principles of Inheritance & Variation';
      chapter2 = 'Human Reproduction & Hormonal Control';
    }

    const todayStr = getTodayDateStr();

    // Schedule 2 focused revision tasks
    storageService.addTask({
      date: todayStr,
      subject_name: targetSubject,
      subject_id: targetSubject,
      chapter_name: chapter1,
      title: `${targetSubject} Mock Mistake Review: ${chapter1}`,
      duration: 60,
      task_type: 'Revision',
      priority: 'High',
      completed: false
    });

    storageService.addTask({
      date: todayStr,
      subject_name: targetSubject,
      subject_id: targetSubject,
      chapter_name: chapter2,
      title: `${targetSubject} 40 MCQ Speed Drill: ${chapter2}`,
      duration: 45,
      task_type: 'MCQs',
      priority: 'High',
      completed: false
    });

    setRevisionPlanCreated(true);
    showToast(`Revision Plan created! 2 targeted tasks added to Plan for ${targetSubject}.`);
  };

  // =========================================================================
  // DEDICATED TEST BREAKDOWN SCREEN
  // =========================================================================
  if (selectedTest) {
    const totalScore = selectedTest.physics_score + selectedTest.chemistry_score + selectedTest.biology_score;
    const maxScore = selectedTest.maximum_marks || 720;
    const percent = Math.round((totalScore / maxScore) * 100);
    const attempted = (selectedTest.correct || 0) + (selectedTest.incorrect || 0);
    const accuracy = attempted > 0 ? Math.round((selectedTest.correct / attempted) * 100) : 0;

    const prevScore = selectedPrevTest
      ? selectedPrevTest.physics_score + selectedPrevTest.chemistry_score + selectedPrevTest.biology_score
      : null;
    const testScoreDiff = prevScore !== null ? totalScore - prevScore : null;

    // Diagnose lowest subject
    const phyPercent = Math.round((selectedTest.physics_score / 180) * 100);
    const chemPercent = Math.round((selectedTest.chemistry_score / 180) * 100);
    const bioPercent = Math.round((selectedTest.biology_score / 360) * 100);

    let lowestSub = 'Physics';
    if (chemPercent < phyPercent && chemPercent <= bioPercent) lowestSub = 'Chemistry';
    else if (bioPercent < phyPercent && bioPercent < chemPercent) lowestSub = 'Biology';

    return (
      <div className="space-y-5 pb-24 md:pb-12 max-w-xl mx-auto px-1 sm:px-0 animate-fade-in">
        {/* Toast */}
        {feedbackToast && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#6e3ff5] text-white font-bold text-xs py-2.5 px-5 rounded-full shadow-btn flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {feedbackToast}
          </div>
        )}

        {/* Top Back Navigation */}
        <div className="pt-1">
          <button
            onClick={() => {
              setSelectedTest(null);
              setRevisionPlanCreated(false);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition py-1 px-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tests
          </button>
        </div>

        {/* Title & Metadata */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {selectedTest.name}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
            <span>{selectedTest.date}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-500" />
              {selectedTest.time_taken || 180} mins
            </span>
          </p>
        </div>

        {/* 1. TOTAL SCORE & SCORE CHANGE */}
        <div className="bg-[#141419] rounded-3xl p-5 border border-white/[0.08] relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Total Score
            </span>
            {testScoreDiff !== null ? (
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                testScoreDiff >= 0
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}>
                {testScoreDiff >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {testScoreDiff > 0 ? `+${testScoreDiff}` : testScoreDiff} vs previous test
              </span>
            ) : (
              <span className="text-xs font-medium text-zinc-500">Baseline mock test</span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white tracking-tight">
              {totalScore}
            </span>
            <span className="text-sm font-semibold text-zinc-500">/ {maxScore}</span>
            <span className="text-sm font-bold text-primary-light ml-1">({percent}%)</span>
          </div>
        </div>

        {/* 2. SUBJECT-WISE PERFORMANCE */}
        <div className="bg-[#141419] rounded-2xl p-4 border border-white/[0.07] space-y-3.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
            Subject-wise Performance
          </span>

          <div className="space-y-3">
            {/* Physics */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                  <span className="font-semibold text-zinc-200">Physics</span>
                </div>
                <span className="font-black text-[#7dd3fc]">
                  {selectedTest.physics_score} / 180 ({phyPercent}%)
                </span>
              </div>
              <ProgressBar percentage={phyPercent} colorClass="bg-[#38bdf8]" height="h-1.5" />
            </div>

            {/* Chemistry */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#c084fc]" />
                  <span className="font-semibold text-zinc-200">Chemistry</span>
                </div>
                <span className="font-black text-[#e9d5ff]">
                  {selectedTest.chemistry_score} / 180 ({chemPercent}%)
                </span>
              </div>
              <ProgressBar percentage={chemPercent} colorClass="bg-[#c084fc]" height="h-1.5" />
            </div>

            {/* Biology */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#34d399]" />
                  <span className="font-semibold text-zinc-200">Biology</span>
                </div>
                <span className="font-black text-[#6ee7b7]">
                  {selectedTest.biology_score} / 360 ({bioPercent}%)
                </span>
              </div>
              <ProgressBar percentage={bioPercent} colorClass="bg-[#34d399]" height="h-1.5" />
            </div>
          </div>
        </div>

        {/* 3. ACCURACY & INCORRECT QUESTIONS */}
        <div className="bg-[#141419] rounded-2xl p-4 border border-white/[0.07] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Accuracy & Questions
            </span>
            <span className="text-xs font-bold text-emerald-400">{accuracy}% Accuracy</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 rounded-xl bg-[#1a1a22] border border-white/[0.04]">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Correct</span>
              <span className="text-lg font-black text-emerald-400 mt-0.5 block">{selectedTest.correct}</span>
              <span className="text-[10px] text-emerald-400/80">+{selectedTest.correct * 4} marks</span>
            </div>

            <div className="p-3 rounded-xl bg-[#1a1a22] border border-white/[0.04]">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Incorrect</span>
              <span className="text-lg font-black text-rose-400 mt-0.5 block">{selectedTest.incorrect}</span>
              <span className="text-[10px] text-rose-400/80">-{selectedTest.incorrect * 5} marks lost</span>
            </div>

            <div className="p-3 rounded-xl bg-[#1a1a22] border border-white/[0.04]">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Unattempted</span>
              <span className="text-lg font-black text-zinc-400 mt-0.5 block">{selectedTest.unattempted}</span>
              <span className="text-[10px] text-zinc-500">0 marks</span>
            </div>
          </div>
        </div>

        {/* 4. WEAK TOPICS IDENTIFIED & RECOMMENDED REVISION */}
        <div className="bg-[#141419] rounded-2xl p-4 border border-white/[0.07] space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs uppercase tracking-wider font-bold text-white">
              Identified Improvement Focus ({lowestSub})
            </h3>
          </div>

          <p className="text-xs text-zinc-400">
            Based on this test, your biggest score lever is <span className="text-white font-bold">{lowestSub}</span>. 
            Eliminating negative marking here can boost your score by ~30–45 marks.
          </p>

          <div className="space-y-2 pt-1">
            <div className="p-3 rounded-xl bg-[#1b1b24] border border-white/[0.05] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-primary-light uppercase">High-Yield Priority 1</span>
                <p className="text-xs font-bold text-white">
                  {lowestSub === 'Physics' ? 'Current Electricity & Circuit Formulas' : lowestSub === 'Chemistry' ? 'Chemical Bonding & Hybridization' : 'Genetics & Mendelian Inheritance'}
                </p>
              </div>
              <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                Weak Area
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#1b1b24] border border-white/[0.05] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-primary-light uppercase">High-Yield Priority 2</span>
                <p className="text-xs font-bold text-white">
                  {lowestSub === 'Physics' ? 'Ray Optics Sign Conventions & PYQs' : lowestSub === 'Chemistry' ? 'Hydrocarbons & Reaction Mechanisms' : 'Human Reproduction & Hormonal Control'}
                </p>
              </div>
              <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Targeted Drill
              </span>
            </div>
          </div>
        </div>

        {/* 5. THE ONE PRIMARY CTA: Create Revision Plan */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => handleCreateRevisionPlan(selectedTest)}
            disabled={revisionPlanCreated}
            className={`w-full py-3.5 px-6 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-btn transition active:scale-98 ${
              revisionPlanCreated
                ? 'bg-emerald-600 text-white cursor-default'
                : 'btn-primary'
            }`}
          >
            {revisionPlanCreated ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                ✓ Revision Plan Scheduled in Plan Tab
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Create Revision Plan
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN TESTS SCREEN
  // =========================================================================
  return (
    <div className="space-y-5 pb-24 md:pb-12 max-w-xl mx-auto px-1 sm:px-0">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#6e3ff5] text-white font-bold text-xs py-2.5 px-5 rounded-full shadow-btn animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {feedbackToast}
        </div>
      )}

      {/* 1. HEADER & THE ONE PRIMARY ACTION */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Tests</h1>
          <p className="text-xs text-zinc-400 mt-0.5">How am I performing & what can I learn?</p>
        </div>

        <button
          onClick={() => setIsAddTestOpen(true)}
          className="btn-primary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-btn transition active:scale-98 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          + Add Test
        </button>
      </div>

      {/* 2. SIMPLIFIED PERFORMANCE SUMMARY */}
      <div className="bg-[#141419] rounded-3xl p-5 border border-white/[0.08] space-y-3.5 shadow-md">
        {/* Latest Score (Largest metric) & Change from previous test */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Latest Score
          </span>
          {scoreChange !== null && (
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
              scoreChange >= 0
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
            }`}>
              {scoreChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {scoreChange > 0 ? `+${scoreChange}` : scoreChange} vs prev
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {latestScore !== null ? latestScore : '--'}
          </span>
          <span className="text-sm font-semibold text-zinc-500">/ 720</span>
          {latestScore !== null && (
            <span className="text-xs text-zinc-400 ml-1">
              ({Math.round((latestScore / 720) * 100)}%)
            </span>
          )}
        </div>

        {/* Average Score & Best Score in a clean 2-column strip */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.06]">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
              Average Score
            </span>
            <span className="text-base font-bold text-zinc-200 mt-0.5 block">
              {averageScore !== null ? `${averageScore} / 720` : '--'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
              Best Score
            </span>
            <span className="text-base font-bold text-emerald-400 mt-0.5 block">
              {bestScore !== null ? `${bestScore} / 720` : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. RECENT MOCK TESTS (Main content of the page) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs uppercase tracking-wider font-bold text-white">
            Recent Mock Tests
          </h2>
          <span className="text-xs text-zinc-400 font-medium">
            {sortedTests.length} logged
          </span>
        </div>

        {sortedTests.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3 rounded-2xl bg-[#141419] border border-white/[0.05]">
            <p className="text-sm font-bold text-white">No mock tests logged yet</p>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Track mock test results to analyze accuracy, spot weak areas, and generate targeted revision plans.
            </p>
            <button
              type="button"
              onClick={() => setIsAddTestOpen(true)}
              className="btn-primary py-2.5 px-4 text-xs font-bold inline-flex items-center gap-1.5 rounded-xl shadow-btn mt-1"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              + Add Test
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedTests.map((test, idx) => {
              const totalScore = test.physics_score + test.chemistry_score + test.biology_score;
              const attempted = (test.correct || 0) + (test.incorrect || 0);
              const testAccuracy = attempted > 0 ? Math.round((test.correct / attempted) * 100) : 0;

              // Change from previous test
              const prevTest = sortedTests[idx + 1];
              const prevScore = prevTest
                ? prevTest.physics_score + prevTest.chemistry_score + prevTest.biology_score
                : null;
              const diff = prevScore !== null ? totalScore - prevScore : null;

              return (
                <div
                  key={test.id}
                  onClick={() => setSelectedTest(test)}
                  className="bg-[#141419] hover:bg-[#1a1a22] border border-white/[0.07] hover:border-white/[0.13] rounded-2xl p-4 transition cursor-pointer space-y-3 group active:scale-[0.99]"
                >
                  {/* Test name + date */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white tracking-tight group-hover:text-primary-light transition truncate max-w-[240px]">
                      {test.name}
                    </h3>
                    <span className="text-xs text-zinc-400 font-medium shrink-0">{test.date}</span>
                  </div>

                  {/* Score / 720 & Accuracy + change from previous test */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-black text-white tracking-tight">{totalScore}</span>
                      <span className="text-xs text-zinc-500 font-semibold">/ 720</span>
                      <span className="text-xs text-zinc-400 ml-1">({Math.round((totalScore / 720) * 100)}%)</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-emerald-400 font-semibold">{testAccuracy}% acc</span>
                      {diff !== null && (
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          diff >= 0
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                        }`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Compact Physics / Chemistry / Biology scores & View Breakdown */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-xs">
                    <div className="flex items-center gap-3 text-[11px] font-medium">
                      <span className="text-[#7dd3fc]">P: {test.physics_score}</span>
                      <span className="text-[#e9d5ff]">C: {test.chemistry_score}</span>
                      <span className="text-[#6ee7b7]">B: {test.biology_score}</span>
                    </div>

                    <span className="text-xs font-bold text-primary-light flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      View Breakdown →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. ADD TEST MODAL */}
      <Modal
        isOpen={isAddTestOpen}
        onClose={() => setIsAddTestOpen(false)}
        title="Add Mock Test Score"
        subtitle="Automatic calculation of total score, % and accuracy"
      >
        <form onSubmit={handleSaveTest} className="space-y-4 pt-1">
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
                className="w-full px-3.5 py-2.5 rounded-xl dark-input text-xs text-white"
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
                className="w-full px-3.5 py-2.5 rounded-xl dark-input text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Subject Scores
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl border border-white/[0.08] bg-[#1a1a22] text-center">
                <span className="text-[11px] font-bold text-[#7dd3fc] block mb-1">Physics (/180)</span>
                <input
                  type="number"
                  max="180"
                  min="0"
                  value={phyScore}
                  onChange={e => setPhyScore(parseInt(e.target.value) || 0)}
                  className="w-full text-center font-black text-white dark-input py-1 text-sm rounded-lg"
                />
              </div>

              <div className="p-2.5 rounded-xl border border-white/[0.08] bg-[#1a1a22] text-center">
                <span className="text-[11px] font-bold text-[#e9d5ff] block mb-1">Chemistry (/180)</span>
                <input
                  type="number"
                  max="180"
                  min="0"
                  value={chemScore}
                  onChange={e => setChemScore(parseInt(e.target.value) || 0)}
                  className="w-full text-center font-black text-white dark-input py-1 text-sm rounded-lg"
                />
              </div>

              <div className="p-2.5 rounded-xl border border-white/[0.08] bg-[#1a1a22] text-center">
                <span className="text-[11px] font-bold text-[#6ee7b7] block mb-1">Biology (/360)</span>
                <input
                  type="number"
                  max="360"
                  min="0"
                  value={bioScore}
                  onChange={e => setBioScore(parseInt(e.target.value) || 0)}
                  className="w-full text-center font-black text-white dark-input py-1 text-sm rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                Correct Qs
              </label>
              <input
                type="number"
                min="0"
                max="180"
                value={correct}
                onChange={e => setCorrect(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl dark-input text-xs text-white text-center font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-1">
                Incorrect Qs
              </label>
              <input
                type="number"
                min="0"
                max="180"
                value={incorrect}
                onChange={e => setIncorrect(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl dark-input text-xs text-white text-center font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Unattempted
              </label>
              <input
                type="number"
                min="0"
                max="180"
                value={unattempted}
                onChange={e => setUnattempted(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl dark-input text-xs text-white text-center font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Time Taken (Minutes)
            </label>
            <input
              type="number"
              min="30"
              max="240"
              value={timeTaken}
              onChange={e => setTimeTaken(parseInt(e.target.value) || 180)}
              className="w-full px-3.5 py-2.5 rounded-xl dark-input text-xs text-white"
            />
          </div>

          {/* Computed Summary Preview */}
          <div className="p-3.5 rounded-xl bg-[#141419] border border-white/[0.06] flex items-center justify-between text-xs">
            <div>
              <span className="text-zinc-400 block text-[10px]">Calculated Score</span>
              <span className="text-lg font-black text-white">{modalTotalScore} / 720</span>
            </div>
            <div className="text-right">
              <span className="text-zinc-400 block text-[10px]">Percentage · Accuracy</span>
              <span className="font-bold text-primary-light">{modalPercentage}% · {modalAccuracy}% acc</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl btn-primary text-xs font-bold transition shadow-btn"
          >
            Save Mock Test
          </button>
        </form>
      </Modal>
    </div>
  );
};
