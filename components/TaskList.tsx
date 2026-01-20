
import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, Filter, ArrowUpDown } from 'lucide-react';
import { Task } from '../types';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (title: string, priority: Task['priority']) => void;
}

type SortOption = 'date' | 'priority' | 'status';
type FilterOption = 'all' | 'high' | 'medium' | 'low';

export const TaskList: React.FC<TaskListProps> = ({ tasks, onToggle, onDelete, onAdd }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  const priorityWeight = { high: 3, medium: 2, low: 1 };

  const processedTasks = useMemo(() => {
    let result = [...tasks];

    // Filtering
    if (filterBy !== 'all') {
      result = result.filter(t => t.priority === filterBy);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'priority') {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      if (sortBy === 'status') {
        return (a.completed === b.completed) ? 0 : a.completed ? 1 : -1;
      }
      // default: date (newest first)
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    return result;
  }, [tasks, sortBy, filterBy]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onAdd(newTaskTitle.trim(), priority);
      setNewTaskTitle('');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 h-full flex flex-col transition-colors">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Minhas Tarefas</h2>
        <span className="text-xs font-semibold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full">
          {tasks.filter(t => !t.completed).length} pendentes
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <div className="relative">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="O que vamos estudar hoje?"
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 pl-4 pr-12 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 top-1.5 p-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="flex gap-2">
          {(['low', 'medium', 'high'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                priority === p
                  ? 'bg-white dark:bg-slate-700 border-indigo-200 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : 'Alta'}
            </button>
          ))}
        </div>
      </form>

      {/* Controls Area */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-50 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-1">
          <Filter size={14} className="text-slate-400" />
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className="bg-transparent text-xs font-semibold text-slate-500 dark:text-slate-400 focus:outline-none cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <option value="all">Todas Prioridades</option>
            <option value="high">Alta Prioridade</option>
            <option value="medium">Média Prioridade</option>
            <option value="low">Baixa Prioridade</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} className="text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-transparent text-xs font-semibold text-slate-500 dark:text-slate-400 focus:outline-none cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <option value="date">Mais Recentes</option>
            <option value="priority">Por Prioridade</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {processedTasks.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {filterBy !== 'all' ? 'Nenhuma tarefa com esta prioridade.' : 'Nenhuma tarefa por enquanto.'}
            </p>
          </div>
        ) : (
          processedTasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                task.completed ? 'bg-slate-50 dark:bg-slate-800 border-transparent opacity-60' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900'
              }`}
            >
              <button
                onClick={() => onToggle(task.id)}
                className={`transition-colors ${task.completed ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700 hover:text-indigo-500'}`}
              >
                {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </button>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${task.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${
                    task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onDelete(task.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
