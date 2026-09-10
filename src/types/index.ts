export type SubjectType = 'Physics' | 'Chemistry' | 'Biology';

export type TaskType = 
  | 'Study'
  | 'Lecture'
  | 'NCERT'
  | 'Notes'
  | 'MCQs'
  | 'Revision'
  | 'Test'
  | 'Other';

export type PriorityLevel = 'Low' | 'Medium' | 'High';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  target_exam: string; // e.g. "NEET 2027"
  exam_date: string; // YYYY-MM-DD
  daily_study_goal: number; // hours (e.g. 6)
  daily_question_goal: number; // questions (e.g. 200)
  created_at: string;
}

export interface Subject {
  id: string;
  name: SubjectType;
  user_id?: string;
  color: string;
  accent: string;
}

export interface Chapter {
  id: string;
  subject_id: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number; // 0 to 100
  total_topics: number;
  completed_topics: number;
  questions_solved: number;
  accuracy: number;
  last_studied?: string;
  revision_status?: string;
}

export interface Topic {
  id: string;
  chapter_id: string;
  name: string;
  status: 'not_started' | 'studying' | 'completed' | 'needs_revision';
  initial_studied?: boolean;
  rev1?: boolean;
  rev2?: boolean;
  rev3?: boolean;
  rev4?: boolean;
  next_revision?: string;
}

export interface Task {
  id: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  subject_id: string;
  subject_name: SubjectType;
  chapter_id?: string;
  chapter_name?: string;
  topic_id?: string;
  topic_name?: string;
  task_type: TaskType;
  title: string;
  duration: number; // minutes
  priority: PriorityLevel;
  completed: boolean;
  completed_at?: string;
  created_at: string;
}

export interface StudySession {
  id: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  subject_id: string;
  duration: number; // minutes
  created_at: string;
}

export interface QuestionLog {
  id: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  subject_id: string;
  subject_name: SubjectType;
  total: number;
  correct: number;
  incorrect: number;
  created_at: string;
}

export interface TestRecord {
  id: string;
  user_id?: string;
  name: string;
  date: string;
  physics_score: number;
  chemistry_score: number;
  biology_score: number;
  maximum_marks: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  time_taken: number; // minutes
  created_at: string;
}

export interface WeakTopic {
  id: string;
  user_id?: string;
  subject_name: SubjectType;
  topic_name: string;
  chapter_name?: string;
  priority: PriorityLevel;
  status: 'Needs Revision' | 'Scheduled' | 'Mastered';
  last_studied: string;
  next_revision: string;
  created_at: string;
}

export interface RevisionCycle {
  id: string;
  user_id?: string;
  topic_id: string;
  topic_name: string;
  subject_name: SubjectType;
  chapter_name: string;
  initial_studied: boolean;
  rev1_completed: boolean;
  rev2_completed: boolean;
  rev3_completed: boolean;
  rev4_completed: boolean;
  next_revision: string;
}

export interface Reflection {
  id: string;
  user_id?: string;
  type: 'weekly' | 'monthly';
  period: string; // e.g. "Week 36, 2026" or "September 2026"
  content: {
    q1: string; // What went well?
    q2: string; // What did I struggle with?
    q3: string; // Which subject needs more attention? / Which subject improved most?
    q4: string; // What will I improve next week? / What held me back?
    q5?: string; // Main goal for next month?
  };
  created_at: string;
}

export interface AppInsight {
  id: string;
  type: 'positive' | 'warning' | 'info';
  message: string;
  actionable?: string;
}
