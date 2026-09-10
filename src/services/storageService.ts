import { 
  UserProfile, 
  Task, 
  TestRecord, 
  WeakTopic, 
  RevisionCycle, 
  QuestionLog, 
  Reflection, 
  AppInsight, 
  SubjectType,
  TaskType,
  Chapter,
  Topic
} from '../types';
import { NEET_SYLLABUS } from '../data/neetSyllabus';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// LocalStorage Keys
const KEYS = {
  PROFILE: 'neet_profile',
  TASKS: 'neet_tasks',
  TESTS: 'neet_tests',
  WEAK_TOPICS: 'neet_weak_topics',
  REVISIONS: 'neet_revisions',
  QUESTION_LOGS: 'neet_question_logs',
  REFLECTIONS: 'neet_reflections',
  CHAPTERS: 'neet_chapters',
  IS_LOGGED_IN: 'neet_is_logged_in',
  IS_DEMO: 'neet_is_demo',
  ONBOARDING_COMPLETED: 'neet_onboarding_completed',
  ONBOARDING_STEP: 'neet_onboarding_step',
};

// Clean Default Profile for New Users
const NEW_USER_PROFILE: UserProfile = {
  id: 'usr_new',
  name: 'Aspirant',
  email: '',
  target_exam: 'NEET 2027',
  exam_date: '2027-05-02',
  daily_study_goal: 6, // 6 hours
  daily_question_goal: 200,
  created_at: new Date().toISOString(),
  onboarding_completed: false,
  onboarding_step: 1,
};

// Demo Profile for UI Preview
const DEMO_PROFILE: UserProfile = {
  id: 'usr_demo',
  name: 'Aryan',
  email: 'aryan.neet2027@example.com',
  target_exam: 'NEET 2027',
  exam_date: '2027-05-02',
  daily_study_goal: 6,
  daily_question_goal: 200,
  created_at: '2026-08-01T00:00:00Z',
};

// Helper to format today's date YYYY-MM-DD
export function getTodayDateStr(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

// Generate brand-new clean chapters for a fresh user (0% progress)
export function generateCleanChapters(): Record<SubjectType, Chapter[]> {
  const result: Record<SubjectType, Chapter[]> = {
    Physics: [],
    Chemistry: [],
    Biology: []
  };

  const subjectNames: SubjectType[] = ['Physics', 'Chemistry', 'Biology'];
  
  subjectNames.forEach(sub => {
    const list = NEET_SYLLABUS[sub].chapters;
    result[sub] = list.map((ch, idx) => ({
      id: `ch_${sub.toLowerCase()}_${idx}`,
      subject_id: sub,
      name: ch.name,
      status: 'not_started',
      progress: 0,
      total_topics: ch.topics.length,
      completed_topics: 0,
      questions_solved: 0,
      accuracy: 0,
      last_studied: undefined,
      revision_status: undefined
    }));
  });

  return result;
}

// Generate demo chapters for preview only
function generateDemoChapters(): Record<SubjectType, Chapter[]> {
  const result = generateCleanChapters();
  const subjectNames: SubjectType[] = ['Physics', 'Chemistry', 'Biology'];
  
  subjectNames.forEach(sub => {
    result[sub].forEach((ch, idx) => {
      let progress = 60;
      if (idx === 0) progress = 85;
      else if (idx === 1) progress = 72;
      else if (idx === 2) progress = 45;
      else if (idx === 3) progress = 60;
      else if (idx === 4) progress = 55;
      else progress = 40;

      ch.progress = progress;
      ch.status = progress >= 80 ? 'completed' : 'in_progress';
      ch.completed_topics = Math.round((progress / 100) * ch.total_topics);
      ch.questions_solved = 120 + idx * 45;
      ch.accuracy = 82 + (idx % 8);
      ch.last_studied = '2026-09-08';
      ch.revision_status = idx % 2 === 0 ? 'Revision 2' : 'Revision 1';
    });
  });

  return result;
}

export class StorageService {
  private static instance: StorageService;

  private constructor() {
    this.ensureInitialized();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * For a brand-new user, ensure the store exists completely clean (0 tasks, 0 tests, 0 questions)
   */
  private ensureInitialized() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(KEYS.PROFILE)) {
      localStorage.setItem(KEYS.PROFILE, JSON.stringify(NEW_USER_PROFILE));
    }
    if (!localStorage.getItem(KEYS.TASKS)) {
      localStorage.setItem(KEYS.TASKS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.TESTS)) {
      localStorage.setItem(KEYS.TESTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.WEAK_TOPICS)) {
      localStorage.setItem(KEYS.WEAK_TOPICS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.REVISIONS)) {
      localStorage.setItem(KEYS.REVISIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.REFLECTIONS)) {
      localStorage.setItem(KEYS.REFLECTIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.QUESTION_LOGS)) {
      localStorage.setItem(KEYS.QUESTION_LOGS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.CHAPTERS)) {
      localStorage.setItem(KEYS.CHAPTERS, JSON.stringify(generateCleanChapters()));
    }
    if (localStorage.getItem(KEYS.IS_LOGGED_IN) === null) {
      localStorage.setItem(KEYS.IS_LOGGED_IN, 'false');
    }
    if (localStorage.getItem(KEYS.ONBOARDING_COMPLETED) === null) {
      const p = this.getProfile();
      localStorage.setItem(KEYS.ONBOARDING_COMPLETED, p.onboarding_completed ? 'true' : 'false');
    }
    if (localStorage.getItem(KEYS.ONBOARDING_STEP) === null) {
      localStorage.setItem(KEYS.ONBOARDING_STEP, '1');
    }
  }

  // --- Auth State ---
  public isLoggedIn(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(KEYS.IS_LOGGED_IN) === 'true';
  }

  public setLoggedIn(value: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.IS_LOGGED_IN, value ? 'true' : 'false');
  }

  public isDemoMode(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(KEYS.IS_DEMO) === 'true';
  }

  // --- Onboarding State ---
  public isOnboardingCompleted(): boolean {
    if (typeof window === 'undefined') return false;
    const val = localStorage.getItem(KEYS.ONBOARDING_COMPLETED);
    if (val !== null) return val === 'true';
    const profile = this.getProfile();
    return !!profile.onboarding_completed;
  }

  public setOnboardingCompleted(completed: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.ONBOARDING_COMPLETED, completed ? 'true' : 'false');
    this.updateProfile({ onboarding_completed: completed });
  }

  public getOnboardingStep(): number {
    if (typeof window === 'undefined') return 1;
    const val = localStorage.getItem(KEYS.ONBOARDING_STEP);
    return val ? parseInt(val, 10) || 1 : 1;
  }

  public setOnboardingStep(step: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEYS.ONBOARDING_STEP, String(step));
    this.updateProfile({ onboarding_step: step });
  }

  // --- Clean User Account Creation ---
  public createCleanAccount(name: string, email: string, userId?: string) {
    this.clearAllData();
    const cleanProfile: UserProfile = {
      id: userId || `usr_${Date.now()}`,
      name: name.trim() || 'Aspirant',
      email: email.trim(),
      target_exam: 'NEET 2027',
      exam_date: '2027-05-02',
      daily_study_goal: 6,
      daily_question_goal: 200,
      created_at: new Date().toISOString(),
      onboarding_completed: false,
      onboarding_step: 1
    };
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(cleanProfile));
    localStorage.setItem(KEYS.IS_DEMO, 'false');
    localStorage.setItem(KEYS.IS_LOGGED_IN, 'true');
    localStorage.setItem(KEYS.ONBOARDING_COMPLETED, 'false');
    localStorage.setItem(KEYS.ONBOARDING_STEP, '1');

    // If signed up via Supabase, upsert profile
    if (supabase && isSupabaseConfigured && userId) {
      supabase.from('profiles').upsert({
        id: userId,
        name: cleanProfile.name,
        email: cleanProfile.email,
        target_exam: cleanProfile.target_exam,
        exam_date: cleanProfile.exam_date,
        daily_study_goal: cleanProfile.daily_study_goal,
        daily_question_goal: cleanProfile.daily_question_goal
      }).then();
    }

    return cleanProfile;
  }

  // --- Supabase Cloud Sync ---
  public async syncFromSupabase(): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Sync Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        const localProfile = this.getProfile();
        const merged: UserProfile = {
          ...localProfile,
          id: user.id,
          name: profileData.name || localProfile.name,
          email: profileData.email || user.email || '',
          target_exam: profileData.target_exam || localProfile.target_exam,
          exam_date: profileData.exam_date || localProfile.exam_date,
          daily_study_goal: profileData.daily_study_goal || localProfile.daily_study_goal,
          daily_question_goal: profileData.daily_question_goal || localProfile.daily_question_goal
        };
        localStorage.setItem(KEYS.PROFILE, JSON.stringify(merged));
      }

      // 2. Sync Tasks
      const { data: remoteTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (remoteTasks && remoteTasks.length > 0) {
        const mappedTasks: Task[] = remoteTasks.map(t => ({
          id: t.id,
          date: t.date,
          subject_name: t.subject_name,
          subject_id: t.subject_name,
          chapter_name: t.chapter_name,
          topic_name: t.topic_name,
          task_type: t.task_type,
          title: t.title,
          duration: t.duration,
          priority: t.priority,
          completed: t.completed,
          completed_at: t.completed_at,
          created_at: t.created_at
        }));
        localStorage.setItem(KEYS.TASKS, JSON.stringify(mappedTasks));
      }

      // 3. Sync Tests
      const { data: remoteTests } = await supabase
        .from('tests')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (remoteTests && remoteTests.length > 0) {
        const mappedTests: TestRecord[] = remoteTests.map(t => ({
          id: t.id,
          name: t.name,
          date: t.date,
          physics_score: t.physics_score,
          chemistry_score: t.chemistry_score,
          biology_score: t.biology_score,
          maximum_marks: t.maximum_marks,
          correct: t.correct,
          incorrect: t.incorrect,
          unattempted: t.unattempted,
          time_taken: t.time_taken,
          created_at: t.created_at
        }));
        localStorage.setItem(KEYS.TESTS, JSON.stringify(mappedTests));
      }

      // 4. Sync Question Logs
      const { data: remoteQ } = await supabase
        .from('question_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (remoteQ && remoteQ.length > 0) {
        const mappedQ: QuestionLog[] = remoteQ.map(q => ({
          id: q.id,
          date: q.date,
          subject_id: q.subject_name,
          subject_name: q.subject_name,
          total: q.total,
          correct: q.correct,
          incorrect: q.incorrect,
          created_at: q.created_at
        }));
        localStorage.setItem(KEYS.QUESTION_LOGS, JSON.stringify(mappedQ));
      }

      // 5. Sync Weak Topics
      const { data: remoteWT } = await supabase
        .from('weak_topics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (remoteWT && remoteWT.length > 0) {
        const mappedWT: WeakTopic[] = remoteWT.map(wt => ({
          id: wt.id,
          subject_name: wt.subject_name,
          chapter_name: wt.chapter_name,
          topic_name: wt.topic_name,
          priority: wt.priority,
          status: wt.status,
          last_studied: wt.last_studied,
          next_revision: wt.next_revision,
          created_at: wt.created_at
        }));
        localStorage.setItem(KEYS.WEAK_TOPICS, JSON.stringify(mappedWT));
      }
    } catch (e) {
      console.warn('Supabase sync notice:', e);
    }
  }

  // --- Completely Clear All Data to 0 ---
  public clearAllData() {
    localStorage.setItem(KEYS.TASKS, JSON.stringify([]));
    localStorage.setItem(KEYS.TESTS, JSON.stringify([]));
    localStorage.setItem(KEYS.WEAK_TOPICS, JSON.stringify([]));
    localStorage.setItem(KEYS.REVISIONS, JSON.stringify([]));
    localStorage.setItem(KEYS.REFLECTIONS, JSON.stringify([]));
    localStorage.setItem(KEYS.QUESTION_LOGS, JSON.stringify([]));
    localStorage.setItem(KEYS.CHAPTERS, JSON.stringify(generateCleanChapters()));
    localStorage.setItem(KEYS.IS_DEMO, 'false');
  }

  // --- Load Demo Dataset (Only when user explicitly clicks Explore Demo) ---
  public loadDemoData() {
    const today = getTodayDateStr();
    const demoTasks: Task[] = [
      {
        id: 'demo_task_1',
        date: today,
        subject_id: 'Physics',
        subject_name: 'Physics',
        chapter_name: 'Current Electricity',
        topic_name: 'Kirchhoffs Laws and Circuit Analysis',
        task_type: 'Lecture',
        title: 'Current Electricity - Lecture + Notes',
        duration: 90,
        priority: 'High',
        completed: false,
        created_at: new Date().toISOString()
      },
      {
        id: 'demo_task_2',
        date: today,
        subject_id: 'Chemistry',
        subject_name: 'Chemistry',
        chapter_name: 'Chemical Bonding & Molecular Structure',
        topic_name: 'Hybridization & MOT',
        task_type: 'MCQs',
        title: 'Chemical Bonding - 50 MCQs',
        duration: 45,
        priority: 'Medium',
        completed: true,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 'demo_task_3',
        date: today,
        subject_id: 'Biology',
        subject_name: 'Biology',
        chapter_name: 'Human Reproduction & Reproductive Health',
        topic_name: 'Menstrual Cycle and Hormonal Control',
        task_type: 'NCERT',
        title: 'Human Reproduction - NCERT Revision',
        duration: 45,
        priority: 'High',
        completed: true,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 'demo_task_4',
        date: today,
        subject_id: 'Physics',
        subject_name: 'Physics',
        chapter_name: 'Electrostatics & Capacitance',
        topic_name: 'Capacitance & Dielectrics',
        task_type: 'MCQs',
        title: 'Capacitance - 30 PYQs with speed timer',
        duration: 40,
        priority: 'High',
        completed: true,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 'demo_task_5',
        date: today,
        subject_id: 'Chemistry',
        subject_name: 'Chemistry',
        chapter_name: 'Solutions & Colligative Properties',
        topic_name: 'Colligative Properties & Van t Hoff Factor',
        task_type: 'Notes',
        title: 'Solutions - Formula revision & notes',
        duration: 35,
        priority: 'Medium',
        completed: true,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 'demo_task_6',
        date: today,
        subject_id: 'Biology',
        subject_name: 'Biology',
        chapter_name: 'Principles of Inheritance & Variation (Genetics)',
        topic_name: 'Mendelian Principles & Monohybrid Cross',
        task_type: 'NCERT',
        title: 'Genetics - Mendelian Crosses line by line',
        duration: 50,
        priority: 'High',
        completed: true,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 'demo_task_7',
        date: today,
        subject_id: 'Biology',
        subject_name: 'Biology',
        chapter_name: 'Principles of Inheritance & Variation (Genetics)',
        topic_name: 'Chromosomal Disorders',
        task_type: 'MCQs',
        title: 'Genetics - 40 Question Drill',
        duration: 40,
        priority: 'High',
        completed: true,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 'demo_task_8',
        date: today,
        subject_id: 'Chemistry',
        subject_name: 'Chemistry',
        chapter_name: 'Equilibrium (Chemical & Ionic)',
        topic_name: 'Buffer Solutions and Handerson Equation',
        task_type: 'Revision',
        title: 'Ionic Equilibrium - Buffer Solutions Formula Practice',
        duration: 30,
        priority: 'Low',
        completed: false,
        created_at: new Date().toISOString()
      }
    ];

    const demoTests: TestRecord[] = [
      {
        id: 'test_4',
        name: 'Full Syllabus Mock Test #4',
        date: '2026-09-07',
        physics_score: 132,
        chemistry_score: 148,
        biology_score: 302,
        maximum_marks: 720,
        correct: 149,
        incorrect: 14,
        unattempted: 17,
        time_taken: 180,
        created_at: '2026-09-07T14:00:00Z'
      },
      {
        id: 'test_3',
        name: 'Major Part Mock Test #3',
        date: '2026-08-30',
        physics_score: 120,
        chemistry_score: 140,
        biology_score: 288,
        maximum_marks: 720,
        correct: 141,
        incorrect: 16,
        unattempted: 23,
        time_taken: 180,
        created_at: '2026-08-30T14:00:00Z'
      },
      {
        id: 'test_2',
        name: 'Part Syllabus Mock Test #2',
        date: '2026-08-20',
        physics_score: 110,
        chemistry_score: 136,
        biology_score: 280,
        maximum_marks: 720,
        correct: 135,
        incorrect: 14,
        unattempted: 31,
        time_taken: 175,
        created_at: '2026-08-20T14:00:00Z'
      }
    ];

    const demoWeakTopics: WeakTopic[] = [
      {
        id: 'wt_1',
        subject_name: 'Physics',
        chapter_name: 'Ray Optics & Optical Instruments',
        topic_name: 'Ray Optics & Prism Dispersion',
        priority: 'High',
        status: 'Needs Revision',
        last_studied: '2026-09-08',
        next_revision: '2026-09-11',
        created_at: '2026-09-08T10:00:00Z'
      },
      {
        id: 'wt_2',
        subject_name: 'Chemistry',
        chapter_name: 'Chemical Bonding & Molecular Structure',
        topic_name: 'Molecular Orbital Theory (MOT) Paramagnetism',
        priority: 'High',
        status: 'Needs Revision',
        last_studied: '2026-09-07',
        next_revision: '2026-09-12',
        created_at: '2026-09-07T12:00:00Z'
      }
    ];

    const demoRevisions: RevisionCycle[] = [
      {
        id: 'rev_1',
        topic_id: 'top_1',
        topic_name: 'Chemical Bonding & Hybridization',
        subject_name: 'Chemistry',
        chapter_name: 'Chemical Bonding & Molecular Structure',
        initial_studied: true,
        rev1_completed: true,
        rev2_completed: true,
        rev3_completed: false,
        rev4_completed: false,
        next_revision: '2026-09-12'
      }
    ];

    const demoQuestionLogs: QuestionLog[] = [
      {
        id: 'qlog_demo_1',
        date: today,
        subject_id: 'Biology',
        subject_name: 'Biology',
        total: 180,
        correct: 155,
        incorrect: 25,
        created_at: new Date().toISOString()
      }
    ];

    localStorage.setItem(KEYS.PROFILE, JSON.stringify(DEMO_PROFILE));
    localStorage.setItem(KEYS.TASKS, JSON.stringify(demoTasks));
    localStorage.setItem(KEYS.TESTS, JSON.stringify(demoTests));
    localStorage.setItem(KEYS.WEAK_TOPICS, JSON.stringify(demoWeakTopics));
    localStorage.setItem(KEYS.REVISIONS, JSON.stringify(demoRevisions));
    localStorage.setItem(KEYS.QUESTION_LOGS, JSON.stringify(demoQuestionLogs));
    localStorage.setItem(KEYS.CHAPTERS, JSON.stringify(generateDemoChapters()));
    localStorage.setItem(KEYS.IS_DEMO, 'true');
    localStorage.setItem(KEYS.IS_LOGGED_IN, 'true');
    localStorage.setItem(KEYS.ONBOARDING_COMPLETED, 'true');
    localStorage.setItem(KEYS.ONBOARDING_STEP, '5');
  }

  // --- Starter Plan Generation for Onboarding Step 5 ---
  public createStarterPlan(subjects: SubjectType[]): Task[] {
    const today = getTodayDateStr();
    const starterTasks: Task[] = [];

    const foundationalTopics: Record<SubjectType, { chapter: string; topic: string; duration: number; type: TaskType }> = {
      Physics: {
        chapter: 'Electrostatics',
        topic: 'Coulombs Law & Field Foundations',
        duration: 45,
        type: 'Study'
      },
      Chemistry: {
        chapter: 'Chemical Bonding',
        topic: 'Hybridization & Molecular Geometry',
        duration: 45,
        type: 'Study'
      },
      Biology: {
        chapter: 'Cell Biology',
        topic: 'Cell Structure & Organelles',
        duration: 60,
        type: 'NCERT'
      }
    };

    subjects.forEach((sub, idx) => {
      const info = foundationalTopics[sub];
      if (info) {
        starterTasks.push({
          id: `task_starter_${Date.now()}_${idx}`,
          date: today,
          subject_id: sub,
          subject_name: sub,
          chapter_name: info.chapter,
          topic_name: info.topic,
          task_type: info.type,
          title: `${info.chapter} · ${info.duration} min`,
          duration: info.duration,
          priority: 'High',
          completed: false,
          created_at: new Date().toISOString()
        });
      }
    });

    return starterTasks;
  }

  public saveStarterPlan(tasks: Task[]): void {
    const existing = this.getTasks();
    const merged = [...tasks, ...existing];
    localStorage.setItem(KEYS.TASKS, JSON.stringify(merged));
  }

  // --- Profile ---
  public getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(KEYS.PROFILE);
      return data ? JSON.parse(data) : NEW_USER_PROFILE;
    } catch {
      return NEW_USER_PROFILE;
    }
  }

  public updateProfile(profile: Partial<UserProfile>): UserProfile {
    const current = this.getProfile();
    const updated = { ...current, ...profile };
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(updated));

    if (supabase && isSupabaseConfigured && current.id && !current.id.startsWith('usr_')) {
      supabase.from('profiles').upsert({
        id: current.id,
        name: updated.name,
        email: updated.email,
        target_exam: updated.target_exam,
        exam_date: updated.exam_date,
        daily_study_goal: updated.daily_study_goal,
        daily_question_goal: updated.daily_question_goal
      }).then();
    }

    return updated;
  }

  // --- Tasks ---
  public getTasks(): Task[] {
    try {
      const data = localStorage.getItem(KEYS.TASKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getTasksForDate(dateStr: string): Task[] {
    return this.getTasks().filter(t => t.date === dateStr);
  }

  public addTask(taskData: Omit<Task, 'id' | 'created_at'>): Task {
    const tasks = this.getTasks();
    const profile = this.getProfile();
    const isSupabaseUser = profile.id && !profile.id.startsWith('usr_');
    const newId = isSupabaseUser && typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `task_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const newTask: Task = {
      ...taskData,
      id: newId,
      created_at: new Date().toISOString()
    };
    tasks.unshift(newTask);
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));

    // Supabase cloud sync
    if (supabase && isSupabaseConfigured && isSupabaseUser) {
      supabase.from('tasks').insert({
        id: newTask.id,
        user_id: profile.id,
        date: newTask.date,
        subject_name: newTask.subject_name,
        chapter_name: newTask.chapter_name || null,
        topic_name: newTask.topic_name || null,
        task_type: newTask.task_type,
        title: newTask.title,
        duration: newTask.duration,
        priority: newTask.priority,
        completed: newTask.completed,
        completed_at: newTask.completed_at || null
      }).then();
    }

    return newTask;
  }

  public toggleTaskComplete(taskId: string): Task | null {
    const tasks = this.getTasks();
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return null;

    const completed = !tasks[idx].completed;
    tasks[idx].completed = completed;
    tasks[idx].completed_at = completed ? new Date().toISOString() : undefined;
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));

    // Supabase cloud sync
    if (supabase && isSupabaseConfigured && !taskId.startsWith('task_') && !taskId.startsWith('demo_')) {
      supabase.from('tasks').update({
        completed: completed,
        completed_at: tasks[idx].completed_at || null
      }).eq('id', taskId).then();
    }

    // Also update corresponding chapter's progress if applicable
    if (tasks[idx].chapter_name && tasks[idx].subject_name) {
      this.updateChapterProgressOnTaskToggle(
        tasks[idx].subject_name,
        tasks[idx].chapter_name!,
        completed
      );
    }

    return tasks[idx];
  }

  private updateChapterProgressOnTaskToggle(
    subject: SubjectType,
    chapterName: string,
    isCompleted: boolean
  ) {
    const chaptersMap = this.getChapters();
    const list = chaptersMap[subject] || [];
    const ch = list.find(c => c.name === chapterName);
    if (ch) {
      if (isCompleted) {
        ch.completed_topics = Math.min(ch.total_topics, ch.completed_topics + 1);
        ch.last_studied = getTodayDateStr();
      } else {
        ch.completed_topics = Math.max(0, ch.completed_topics - 1);
      }
      ch.progress = ch.total_topics > 0 ? Math.round((ch.completed_topics / ch.total_topics) * 100) : 0;
      ch.status = ch.progress === 100 ? 'completed' : ch.progress > 0 ? 'in_progress' : 'not_started';
      localStorage.setItem(KEYS.CHAPTERS, JSON.stringify(chaptersMap));
    }
  }

  public deleteTask(taskId: string): boolean {
    const tasks = this.getTasks();
    const filtered = tasks.filter(t => t.id !== taskId);
    localStorage.setItem(KEYS.TASKS, JSON.stringify(filtered));

    // Supabase cloud sync
    if (supabase && isSupabaseConfigured && !taskId.startsWith('task_') && !taskId.startsWith('demo_')) {
      supabase.from('tasks').delete().eq('id', taskId).then();
    }

    return true;
  }

  public updateTask(taskId: string, updates: Partial<Task>): Task | null {
    const tasks = this.getTasks();
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return null;

    tasks[idx] = { ...tasks[idx], ...updates };
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));

    // Supabase cloud sync
    if (supabase && isSupabaseConfigured && !taskId.startsWith('task_') && !taskId.startsWith('demo_')) {
      supabase.from('tasks').update(updates).eq('id', taskId).then();
    }

    return tasks[idx];
  }

  // --- Tests ---
  public getTests(): TestRecord[] {
    try {
      const data = localStorage.getItem(KEYS.TESTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public addTest(testData: Omit<TestRecord, 'id' | 'created_at'>): TestRecord {
    const tests = this.getTests();
    const profile = this.getProfile();
    const isSupabaseUser = profile.id && !profile.id.startsWith('usr_');
    const newId = isSupabaseUser && typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `test_${Date.now()}`;

    const newTest: TestRecord = {
      ...testData,
      id: newId,
      created_at: new Date().toISOString()
    };
    tests.unshift(newTest);
    localStorage.setItem(KEYS.TESTS, JSON.stringify(tests));

    // Supabase cloud sync
    if (supabase && isSupabaseConfigured && isSupabaseUser) {
      supabase.from('tests').insert({
        id: newTest.id,
        user_id: profile.id,
        name: newTest.name,
        date: newTest.date,
        physics_score: newTest.physics_score,
        chemistry_score: newTest.chemistry_score,
        biology_score: newTest.biology_score,
        maximum_marks: newTest.maximum_marks || 720,
        correct: newTest.correct,
        incorrect: newTest.incorrect,
        unattempted: newTest.unattempted,
        time_taken: newTest.time_taken
      }).then();
    }

    return newTest;
  }

  // --- Weak Topics ---
  public getWeakTopics(): WeakTopic[] {
    try {
      const data = localStorage.getItem(KEYS.WEAK_TOPICS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public addWeakTopic(item: Omit<WeakTopic, 'id' | 'created_at'>): WeakTopic {
    const list = this.getWeakTopics();
    const profile = this.getProfile();
    const isSupabaseUser = profile.id && !profile.id.startsWith('usr_');
    const newId = isSupabaseUser && typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `wt_${Date.now()}`;

    const newItem: WeakTopic = {
      ...item,
      id: newId,
      created_at: new Date().toISOString()
    };
    list.unshift(newItem);
    localStorage.setItem(KEYS.WEAK_TOPICS, JSON.stringify(list));

    // Supabase cloud sync
    if (supabase && isSupabaseConfigured && isSupabaseUser) {
      supabase.from('weak_topics').insert({
        id: newItem.id,
        user_id: profile.id,
        subject_name: newItem.subject_name,
        chapter_name: newItem.chapter_name || null,
        topic_name: newItem.topic_name,
        priority: newItem.priority,
        status: newItem.status,
        last_studied: newItem.last_studied || null,
        next_revision: newItem.next_revision || null
      }).then();
    }

    return newItem;
  }

  public createRevisionTaskFromWeakTopic(weakTopicId: string): Task | null {
    const list = this.getWeakTopics();
    const item = list.find(w => w.id === weakTopicId);
    if (!item) return null;

    const today = getTodayDateStr();
    const task = this.addTask({
      date: today,
      subject_id: item.subject_name,
      subject_name: item.subject_name,
      chapter_name: item.chapter_name || 'Weak Area Focus',
      topic_name: item.topic_name,
      task_type: 'Revision',
      title: `${item.topic_name} - Weak Topic Intensive Revision`,
      duration: 45,
      priority: 'High',
      completed: false
    });

    item.status = 'Scheduled';
    localStorage.setItem(KEYS.WEAK_TOPICS, JSON.stringify(list));

    return task;
  }

  // --- Revisions ---
  public getRevisions(): RevisionCycle[] {
    try {
      const data = localStorage.getItem(KEYS.REVISIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public toggleRevisionStep(revId: string, step: 'initial' | 'rev1' | 'rev2' | 'rev3' | 'rev4'): RevisionCycle | null {
    const list = this.getRevisions();
    const item = list.find(r => r.id === revId);
    if (!item) return null;

    if (step === 'initial') item.initial_studied = !item.initial_studied;
    if (step === 'rev1') item.rev1_completed = !item.rev1_completed;
    if (step === 'rev2') item.rev2_completed = !item.rev2_completed;
    if (step === 'rev3') item.rev3_completed = !item.rev3_completed;
    if (step === 'rev4') item.rev4_completed = !item.rev4_completed;

    localStorage.setItem(KEYS.REVISIONS, JSON.stringify(list));
    return item;
  }

  // --- Question Logs ---
  public logQuestions(entry: {
    subject_name: SubjectType;
    total: number;
    correct: number;
    incorrect: number;
  }): QuestionLog {
    const today = getTodayDateStr();
    const logs: QuestionLog[] = this.getQuestionLogs();
    const profile = this.getProfile();
    const isSupabaseUser = profile.id && !profile.id.startsWith('usr_');
    const newId = isSupabaseUser && typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `qlog_${Date.now()}`;

    const newLog: QuestionLog = {
      id: newId,
      date: today,
      subject_id: entry.subject_name,
      subject_name: entry.subject_name,
      total: entry.total,
      correct: entry.correct,
      incorrect: entry.incorrect,
      created_at: new Date().toISOString()
    };
    logs.unshift(newLog);
    localStorage.setItem(KEYS.QUESTION_LOGS, JSON.stringify(logs));

    // Supabase cloud sync
    if (supabase && isSupabaseConfigured && isSupabaseUser) {
      supabase.from('question_logs').insert({
        id: newLog.id,
        user_id: profile.id,
        date: newLog.date,
        subject_name: newLog.subject_name,
        total: newLog.total,
        correct: newLog.correct,
        incorrect: newLog.incorrect
      }).then();
    }

    return newLog;
  }

  public getQuestionLogs(): QuestionLog[] {
    try {
      const data = localStorage.getItem(KEYS.QUESTION_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // --- Reflections ---
  public getReflections(): Reflection[] {
    try {
      const data = localStorage.getItem(KEYS.REFLECTIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveReflection(reflection: Omit<Reflection, 'id' | 'created_at'>): Reflection {
    const list = this.getReflections();
    const newRef: Reflection = {
      ...reflection,
      id: `ref_${Date.now()}`,
      created_at: new Date().toISOString()
    };
    list.unshift(newRef);
    localStorage.setItem(KEYS.REFLECTIONS, JSON.stringify(list));
    return newRef;
  }

  // --- Chapters Data ---
  public getChapters(): Record<SubjectType, Chapter[]> {
    try {
      const data = localStorage.getItem(KEYS.CHAPTERS);
      return data ? JSON.parse(data) : generateCleanChapters();
    } catch {
      return generateCleanChapters();
    }
  }

  // --- Pure Dynamic Calculations Based Exclusively on User's Data ---

  /**
   * Overall Preparation:
   * Proportion of completed syllabus topics + test scores ratio
   */
  public calculateOverallPreparation(): number {
    const chaptersMap = this.getChapters();
    let totalTopics = 0;
    let completedTopics = 0;

    Object.values(chaptersMap).forEach(list => {
      list.forEach(ch => {
        totalTopics += ch.total_topics || 1;
        completedTopics += ch.completed_topics || 0;
      });
    });

    if (totalTopics === 0 || completedTopics === 0) {
      return 0;
    }

    return Math.min(100, Math.round((completedTopics / totalTopics) * 100));
  }

  /**
   * Subject-specific progress percentage based strictly on completed topics
   */
  public calculateSubjectProgress(subject: SubjectType): number {
    const chaptersMap = this.getChapters();
    const list = chaptersMap[subject] || [];
    let total = 0;
    let completed = 0;
    list.forEach(ch => {
      total += ch.total_topics || 1;
      completed += ch.completed_topics || 0;
    });

    if (total === 0 || completed === 0) return 0;
    return Math.min(100, Math.round((completed / total) * 100));
  }

  /**
   * Total Questions Solved strictly by this user
   */
  public getTotalQuestionsSolved(): { total: number; correct: number; incorrect: number; accuracy: number } {
    const logs = this.getQuestionLogs();
    const tests = this.getTests();

    let total = 0;
    let correct = 0;
    let incorrect = 0;

    logs.forEach(l => {
      total += l.total || 0;
      correct += l.correct || 0;
      incorrect += l.incorrect || 0;
    });

    tests.forEach(t => {
      total += (t.correct || 0) + (t.incorrect || 0);
      correct += t.correct || 0;
      incorrect += t.incorrect || 0;
    });

    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { total, correct, incorrect, accuracy };
  }

  /**
   * Total Study Hours strictly by this user
   */
  public getTotalStudyMinutes(): number {
    const tasks = this.getTasks();
    return tasks
      .filter(t => t.completed)
      .reduce((acc, t) => acc + (t.duration || 0), 0);
  }

  /**
   * Current Study Streak calculated strictly from actual task completion dates
   */
  public calculateStreak(): { currentStreak: number; longestStreak: number } {
    const tasks = this.getTasks().filter(t => t.completed && t.date);
    if (tasks.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const uniqueDates = Array.from(new Set(tasks.map(t => t.date))).sort().reverse();
    if (uniqueDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const today = getTodayDateStr();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if user has studied today or yesterday to keep active streak
    let streak = 0;
    let checkDate = new Date(uniqueDates[0]);

    if (uniqueDates[0] === today || uniqueDates[0] === yesterdayStr) {
      streak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const prev = new Date(uniqueDates[i]);
        const diffDays = Math.round((checkDate.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          streak++;
          checkDate = prev;
        } else {
          break;
        }
      }
    }

    return { currentStreak: streak, longestStreak: Math.max(streak, uniqueDates.length > 0 ? 1 : 0) };
  }

  // --- Automatic Actionable Insights (Generated only from real data) ---
  public generateInsights(): AppInsight[] {
    const tasks = this.getTasks();
    const tests = this.getTests();
    const questionStats = this.getTotalQuestionsSolved();
    const insights: AppInsight[] = [];

    if (tasks.length === 0 && tests.length === 0) {
      insights.push({
        id: 'ins_welcome',
        type: 'info',
        message: 'Welcome to NEET PREP! Add your first study task in Today to begin tracking your preparation velocity.',
        actionable: 'Tap "+ Add Task" to schedule your first high-yield lecture or MCQ practice.'
      });
      return insights;
    }

    const completedTasks = tasks.filter(t => t.completed);
    if (completedTasks.length > 0) {
      insights.push({
        id: 'ins_tasks',
        type: 'positive',
        message: `You have completed ${completedTasks.length} study tasks.`,
        actionable: 'Keep completing tasks consistently to build retention.'
      });
    }

    if (tests.length >= 2) {
      const latest = tests[0].physics_score + tests[0].chemistry_score + tests[0].biology_score;
      const prev = tests[1].physics_score + tests[1].chemistry_score + tests[1].biology_score;
      const diff = latest - prev;
      if (diff > 0) {
        insights.push({
          id: 'ins_test_diff',
          type: 'positive',
          message: `Your mock test score improved by ${diff} marks in your latest mock test.`,
          actionable: 'Review incorrect and unattempted questions to target weak topics.'
        });
      }
    } else if (tests.length === 1) {
      const score = tests[0].physics_score + tests[0].chemistry_score + tests[0].biology_score;
      insights.push({
        id: 'ins_test_first',
        type: 'info',
        message: `Baseline mock test logged: ${score} / ${tests[0].maximum_marks || 720}.`,
        actionable: 'Flag any challenging chapters under Weak Topics for scheduled revision.'
      });
    }

    if (questionStats.total > 0) {
      insights.push({
        id: 'ins_questions',
        type: questionStats.accuracy >= 80 ? 'positive' : 'warning',
        message: `You have solved ${questionStats.total} total questions with ${questionStats.accuracy}% accuracy.`,
        actionable: questionStats.accuracy >= 80 ? 'Solid accuracy rate.' : 'Aim for >80% accuracy by revisiting NCERT concepts.'
      });
    }

    return insights;
  }
}

export const storageService = StorageService.getInstance();
