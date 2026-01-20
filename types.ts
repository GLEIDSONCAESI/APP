
export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  estimatedPomodoros: number;
  completedPomodoros: number;
  createdAt: number;
}

export interface ScheduleItem {
  id: string;
  time: string;
  subject: string;
  duration: number; // in minutes
}

export interface DailyGoal {
  id: string;
  date: string;
  targetMinutes: number;
  completedMinutes: number;
}

export interface StudySession {
  id: string;
  date: string;
  duration: number;
  mode: TimerMode;
  subject?: string;
}

export interface AppState {
  tasks: Task[];
  schedule: ScheduleItem[];
  sessions: StudySession[];
  dailyGoals: DailyGoal;
}
