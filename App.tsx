
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Timer, ListTodo, Calendar, Bell, GraduationCap, Search, Plus, Trash2, X, BookOpen, ExternalLink, Loader2 } from 'lucide-react';
import { PomodoroTimer } from './components/PomodoroTimer';
import { TaskList } from './components/TaskList';
import { ProgressDashboard } from './components/ProgressDashboard';
import { GeminiAssistant } from './components/GeminiAssistant';
import { searchStudyTopic } from './services/geminiService';
import { Task, StudySession, ScheduleItem, DailyGoal, TimerMode } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pomodoro' | 'tasks' | 'planner'>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('edumind-theme') === 'dark');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [dailyGoal, setDailyGoal] = useState<DailyGoal>(() => {
    const saved = localStorage.getItem('edumind-daily-goal');
    if (saved) return JSON.parse(saved);
    return {
      id: 'goal-1',
      date: new Date().toISOString().split('T')[0],
      targetMinutes: 120,
      completedMinutes: 0
    };
  });

  // Manual Schedule Entry State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ time: '08:00', subject: '', duration: 60 });

  // Consultation State
  const [consultingTopic, setConsultingTopic] = useState<string | null>(null);
  const [consultationResult, setConsultationResult] = useState<{ text: string, sources: any[] } | null>(null);
  const [isConsulting, setIsConsulting] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('edumind-tasks');
    const savedSessions = localStorage.getItem('edumind-sessions');
    const savedSchedule = localStorage.getItem('edumind-schedule');
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedSessions) setSessions(JSON.parse(savedSessions));
    if (savedSchedule) setSchedule(JSON.parse(savedSchedule));
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('edumind-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('edumind-sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('edumind-schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem('edumind-daily-goal', JSON.stringify(dailyGoal));
  }, [dailyGoal]);

  useEffect(() => {
    localStorage.setItem('edumind-theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const addTask = (title: string, priority: Task['priority']) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      completed: false,
      priority,
      estimatedPomodoros: 1,
      completedPomodoros: 0,
      createdAt: Date.now()
    };
    setTasks([newTask, ...tasks]);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const updateDailyGoal = (targetMinutes: number) => {
    setDailyGoal(prev => ({ ...prev, targetMinutes }));
  };

  const handleSessionComplete = (duration: number, mode: TimerMode) => {
    const newSession: StudySession = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      duration,
      mode
    };
    setSessions([newSession, ...sessions]);
    
    if (mode === 'focus') {
      setDailyGoal(prev => ({
        ...prev,
        completedMinutes: prev.completedMinutes + duration
      }));
    }
  };

  const handlePlanGenerated = (newItems: ScheduleItem[]) => {
    setSchedule([...newItems, ...schedule]);
    setActiveTab('planner');
  };

  const addManualScheduleItem = () => {
    if (!newItem.subject.trim()) return;
    const item: ScheduleItem = {
      id: Math.random().toString(36).substr(2, 9),
      ...newItem
    };
    setSchedule([...schedule, item].sort((a, b) => a.time.localeCompare(b.time)));
    setNewItem({ time: '08:00', subject: '', duration: 60 });
    setIsAddingItem(false);
  };

  const deleteScheduleItem = (id: string) => {
    setSchedule(schedule.filter(s => s.id !== id));
  };

  const handleConsult = async (topic: string) => {
    setConsultingTopic(topic);
    setIsConsulting(true);
    setConsultationResult(null);
    try {
      const result = await searchStudyTopic(topic);
      setConsultationResult(result);
    } catch (e) {
      console.error(e);
      setConsultationResult({ text: "Não foi possível carregar informações sobre este tema no momento.", sources: [] });
    } finally {
      setIsConsulting(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Bom dia, Angélica Lucas Damasceno!</h1>
                <p className="text-slate-500 dark:text-slate-400">Vamos transformar esse tempo em conhecimento.</p>
              </div>
              <div className="flex gap-2">
                <button className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm relative">
                  <Bell size={20} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                </button>
              </div>
            </header>

            <GeminiAssistant onPlanGenerated={handlePlanGenerated} />

            <ProgressDashboard sessions={sessions} goal={dailyGoal} onUpdateGoal={updateDailyGoal} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <TaskList tasks={tasks.slice(0, 5)} onToggle={toggleTask} onDelete={deleteTask} onAdd={addTask} />
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 h-full">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Cronograma do Dia</h3>
                <div className="space-y-4">
                  {schedule.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8 italic">
                      Use a IA para gerar seu cronograma.
                    </p>
                  ) : (
                    schedule.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex gap-4 items-start border-l-2 border-indigo-200 dark:border-indigo-900 pl-4 py-1">
                        <span className="text-xs font-bold text-indigo-500 w-12 pt-1">{item.time}</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.subject}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.duration} MINUTOS</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 'pomodoro':
        return (
          <div className="max-w-2xl mx-auto py-8 animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-8 text-center">Foco Profundo</h2>
            <PomodoroTimer onSessionComplete={handleSessionComplete} />
            <div className="mt-12 bg-indigo-50 dark:bg-indigo-950/30 rounded-3xl p-8 border border-indigo-100 dark:border-indigo-900/50">
              <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-4">Dicas de Foco</h3>
              <ul className="space-y-3 text-indigo-700 dark:text-indigo-300 text-sm">
                <li className="flex gap-2">
                  <span className="font-bold">01.</span> Afaste seu celular e notificações.
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">02.</span> Beba água durante as pausas curtas.
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">03.</span> Alongue-se na pausa longa para manter a energia.
                </li>
              </ul>
            </div>
          </div>
        );
      case 'tasks':
        return (
          <div className="max-w-4xl mx-auto py-8 h-[calc(100vh-160px)]">
            <TaskList tasks={tasks} onToggle={toggleTask} onDelete={deleteTask} onAdd={addTask} />
          </div>
        );
      case 'planner':
        return (
          <div className="max-w-4xl mx-auto py-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Cronograma de Estudos</h2>
                <p className="text-sm text-slate-500">Organize sua rotina e consulte temas com IA.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsAddingItem(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all"
                >
                  <Plus size={18} /> Novo Item
                </button>
                <button 
                  onClick={() => setSchedule([])}
                  className="text-xs font-bold text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors"
                >
                  Limpar Tudo
                </button>
              </div>
            </div>

            {isAddingItem && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm animate-in slide-in-from-top-4 duration-300 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Horário</label>
                    <input 
                      type="time" 
                      value={newItem.time}
                      onChange={(e) => setNewItem({...newItem, time: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Matéria / Tema</label>
                    <input 
                      type="text" 
                      placeholder="O que você vai estudar?"
                      value={newItem.subject}
                      onChange={(e) => setNewItem({...newItem, subject: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Duração (min)</label>
                    <input 
                      type="number" 
                      value={newItem.duration}
                      onChange={(e) => setNewItem({...newItem, duration: parseInt(e.target.value) || 0})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setIsAddingItem(false)} className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
                  <button onClick={addManualScheduleItem} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold">Salvar Item</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {schedule.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 transition-colors">
                   <p className="text-slate-400">Nenhum plano definido. Use o Assistente na Home ou adicione manualmente!</p>
                </div>
              ) : (
                schedule.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between hover:border-indigo-100 dark:hover:border-indigo-900 transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold px-4 py-2 rounded-2xl text-lg min-w-[80px] text-center">
                        {item.time}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg">{item.subject}</h4>
                        <p className="text-xs font-semibold text-slate-400">{item.duration} minutos planejados</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleConsult(item.subject)}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all"
                      >
                        <Search size={14} /> Consultar Tema
                      </button>
                      <button 
                        onClick={() => deleteScheduleItem(item.id)}
                        className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${isDarkMode ? 'dark' : ''}`}>
      <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        {/* Sidebar Navigation */}
        <aside className="fixed bottom-0 left-0 w-full md:relative md:w-24 lg:w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 z-50 px-4 md:py-8 flex md:flex-col items-center">
          <div className="hidden md:flex flex-col items-center lg:items-start lg:px-4 mb-12 w-full text-center lg:text-left">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 mb-4 transition-all">
              <GraduationCap size={32} />
            </div>
            <span className="hidden lg:block text-xl font-black text-indigo-950 dark:text-indigo-100 tracking-tighter uppercase">ANGELICADMC</span>
          </div>

          <nav className="flex-1 w-full flex md:flex-col justify-around md:justify-start gap-2 py-4 md:py-0">
            <NavItem icon={<LayoutDashboard />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <NavItem icon={<Timer />} label="Pomodoro" active={activeTab === 'pomodoro'} onClick={() => setActiveTab('pomodoro')} />
            <NavItem icon={<ListTodo />} label="Tarefas" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
            <NavItem icon={<Calendar />} label="Cronograma" active={activeTab === 'planner'} onClick={() => setActiveTab('planner')} />
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 lg:p-12 mb-20 md:mb-0 overflow-y-auto max-h-screen">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Consultation Modal */}
      {consultingTopic && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="bg-indigo-600 p-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <BookOpen size={24} />
                <h3 className="text-xl font-bold truncate max-w-[400px]">Consulta: {consultingTopic}</h3>
              </div>
              <button 
                onClick={() => setConsultingTopic(null)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {isConsulting ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="animate-spin text-indigo-600" size={48} />
                  <p className="text-slate-500 font-medium animate-pulse">Buscando conhecimentos relevantes...</p>
                </div>
              ) : (
                <>
                  <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-lg">
                    {consultationResult?.text}
                  </div>
                  
                  {consultationResult?.sources && consultationResult.sources.length > 0 && (
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Fontes de Referência</h4>
                      <div className="flex flex-wrap gap-2">
                        {consultationResult.sources.map((source, i) => (
                          <a 
                            key={i} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all border border-transparent hover:border-indigo-100"
                          >
                            {source.title.length > 25 ? source.title.substring(0, 25) + '...' : source.title}
                            <ExternalLink size={14} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end">
              <button 
                onClick={() => setConsultingTopic(null)}
                className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
              >
                Entendido!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactElement;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-4 px-4 py-3 rounded-2xl transition-all w-full relative group ${
        active 
          ? 'text-indigo-600 lg:bg-indigo-50 dark:lg:bg-indigo-900/20' 
          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
      }`}
    >
      <div className={`transition-transform group-active:scale-90 ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
        {React.cloneElement(icon as React.ReactElement<any>, { size: 24 })}
      </div>
      <span className="text-[10px] lg:text-sm font-bold lg:font-semibold">{label}</span>
      {active && <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-l-full" />}
    </button>
  );
};

export default App;
