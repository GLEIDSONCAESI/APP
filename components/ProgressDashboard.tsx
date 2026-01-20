
import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StudySession, DailyGoal } from '../types';
import { Target, Clock, Zap, TrendingUp, Edit2, Check, X } from 'lucide-react';

interface ProgressDashboardProps {
  sessions: StudySession[];
  goal: DailyGoal;
  onUpdateGoal?: (targetMinutes: number) => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ sessions, goal, onUpdateGoal }) => {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(goal.targetMinutes);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayMinutes = sessions
      .filter(s => s.date === today && s.mode === 'focus')
      .reduce((acc, curr) => acc + curr.duration, 0);

    const totalMinutes = sessions
      .filter(s => s.mode === 'focus')
      .reduce((acc, curr) => acc + curr.duration, 0);

    const chartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const mins = sessions
        .filter(s => s.date === dateStr && s.mode === 'focus')
        .reduce((acc, curr) => acc + curr.duration, 0);
      return {
        name: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
        minutes: mins
      };
    });

    return { todayMinutes, totalMinutes, chartData };
  }, [sessions]);

  const progressPercentage = Math.min(100, (stats.todayMinutes / goal.targetMinutes) * 100);

  const handleSaveGoal = () => {
    if (onUpdateGoal) {
      onUpdateGoal(tempGoal);
    }
    setIsEditingGoal(false);
  };

  const handleCancelGoal = () => {
    setTempGoal(goal.targetMinutes);
    setIsEditingGoal(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors relative group">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Target size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Meta Diária</p>
              {!isEditingGoal && (
                <button 
                  onClick={() => setIsEditingGoal(true)}
                  className="p-1.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 transition-all rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/40"
                >
                  <Edit2 size={12} />
                </button>
              )}
            </div>
            
            {isEditingGoal ? (
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="number"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-20 bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-sm font-bold text-indigo-600 focus:ring-1 focus:ring-indigo-500 outline-none"
                  autoFocus
                />
                <button onClick={handleSaveGoal} className="text-emerald-500 hover:scale-110 transition-transform">
                  <Check size={18} />
                </button>
                <button onClick={handleCancelGoal} className="text-rose-500 hover:scale-110 transition-transform">
                  <X size={18} />
                </button>
              </div>
            ) : (
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.todayMinutes} / {goal.targetMinutes} min</p>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Acumulado</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{Math.round(stats.totalMinutes / 60)} horas</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Foco Streak</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">4 Dias</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-500" />
              Rendimento da Semana
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 12, fill: '#94a3b8'}} 
                  dy={10} 
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
                    color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#1e293b'
                  }}
                  itemStyle={{ color: '#6366f1' }}
                  cursor={{stroke: '#e2e8f0', strokeWidth: 2}}
                />
                <Area type="monotone" dataKey="minutes" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorMin)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col transition-colors">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6">Progresso do Objetivo</h3>
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90">
                <circle cx="80" cy="80" r="70" fill="transparent" stroke="#f1f5f9" className="dark:stroke-slate-800" strokeWidth="12" />
                <circle 
                  cx="80" cy="80" r="70" fill="transparent" stroke="#10b981" strokeWidth="12"
                  strokeDasharray={2 * Math.PI * 70}
                  strokeDashoffset={2 * Math.PI * 70 * (1 - progressPercentage / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{Math.round(progressPercentage)}%</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Concluído</span>
              </div>
            </div>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 max-w-[200px]">
              {progressPercentage >= 100 
                ? "Incrível! Você atingiu sua meta diária!" 
                : stats.todayMinutes >= goal.targetMinutes 
                  ? "Incrível! Você atingiu sua meta diária!" 
                  : `Faltam ${goal.targetMinutes - stats.todayMinutes} minutos para sua meta de hoje.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
