
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Coffee, Brain, Timer, Volume2, Music, Upload, Check } from 'lucide-react';
import { TimerMode } from '../types';

interface PomodoroTimerProps {
  onSessionComplete: (duration: number, mode: TimerMode) => void;
}

const MODES: Record<TimerMode, { label: string; duration: number; color: string; icon: React.ReactNode }> = {
  focus: { label: 'Foco', duration: 25 * 60, color: 'bg-indigo-600', icon: <Brain size={20} /> },
  shortBreak: { label: 'Pausa Curta', duration: 5 * 60, color: 'bg-emerald-500', icon: <Coffee size={20} /> },
  longBreak: { label: 'Pausa Longa', duration: 15 * 60, color: 'bg-sky-500', icon: <Timer size={20} /> },
};

const PREDEFINED_SOUNDS = [
  { id: 'chime', name: 'Sino Suave', url: 'https://actions.google.com/sounds/v1/notifications/pizzicato.ogg' },
  { id: 'digital', name: 'Digital', url: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' },
  { id: 'nature', name: 'Pássaros', url: 'https://actions.google.com/sounds/v1/foley/bird_chirp_short.ogg' },
  { id: 'success', name: 'Sucesso', url: 'https://actions.google.com/sounds/v1/cartoon/clown_horn_accent.ogg' },
];

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ onSessionComplete }) => {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration);
  const [isActive, setIsActive] = useState(false);
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const [selectedSound, setSelectedSound] = useState(() => localStorage.getItem('edumind-timer-sound') || PREDEFINED_SOUNDS[0].url);
  const [customSoundName, setCustomSoundName] = useState(() => localStorage.getItem('edumind-timer-sound-name') || '');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let interval: number | undefined;
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = new Audio(selectedSound);
    audioRef.current = audio;
    audio.play().catch(e => console.error("Erro ao tocar som:", e));
  }, [selectedSound]);

  const handleComplete = useCallback(() => {
    setIsActive(false);
    playNotificationSound();
    onSessionComplete(MODES[mode].duration / 60, mode);
    
    if (Notification.permission === 'granted') {
      new Notification('Tempo esgotado!', { body: `Sua sessão de ${MODES[mode].label} terminou.` });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, [mode, onSessionComplete, playNotificationSound]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODES[mode].duration);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(MODES[newMode].duration);
    setIsActive(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSoundSelect = (url: string, name: string = '') => {
    setSelectedSound(url);
    setCustomSoundName(name);
    localStorage.setItem('edumind-timer-sound', url);
    localStorage.setItem('edumind-timer-sound-name', name);
    
    // Play a preview
    const audio = new Audio(url);
    audio.play().catch(e => console.error("Erro ao tocar preview:", e));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        handleSoundSelect(base64, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const progress = ((MODES[mode].duration - timeLeft) / MODES[mode].duration) * 100;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center relative overflow-hidden transition-colors">
      {/* Sound Settings Button */}
      <button 
        onClick={() => setShowSoundSettings(!showSoundSettings)}
        className={`absolute top-6 right-6 p-2 rounded-xl transition-all ${showSoundSettings ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
        title="Configurações de som"
      >
        <Volume2 size={20} />
      </button>

      {/* Sound Settings Panel */}
      {showSoundSettings && (
        <div className="absolute top-16 right-6 w-64 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl rounded-2xl p-4 z-20 animate-in fade-in zoom-in-95 duration-200">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Music size={14} /> Som da Notificação
          </h4>
          <div className="space-y-1">
            {PREDEFINED_SOUNDS.map((sound) => (
              <button
                key={sound.id}
                onClick={() => handleSoundSelect(sound.url)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                  selectedSound === sound.url && !customSoundName ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {sound.name}
                {selectedSound === sound.url && !customSoundName && <Check size={14} />}
              </button>
            ))}
            
            <div className="pt-2 mt-2 border-t border-slate-50 dark:border-slate-700">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="audio/*" 
                className="hidden" 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                  customSoundName ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Upload size={14} />
                  <span className="truncate">{customSoundName || 'Upload personalizado'}</span>
                </div>
                {customSoundName && <Check size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-8 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
        {(Object.keys(MODES) as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === m ? `${MODES[m].color} text-white shadow-md` : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {MODES[m].label}
          </button>
        ))}
      </div>

      <div className="relative w-64 h-64 flex items-center justify-center mb-8">
        <svg className="absolute w-full h-full -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-100 dark:text-slate-800"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
            className={`${MODES[mode].color.replace('bg-', 'text-')} transition-all duration-1000 ease-linear`}
            strokeLinecap="round"
          />
        </svg>
        <div className="text-center z-10">
          <span className="block text-5xl font-bold text-slate-800 dark:text-slate-100 tracking-tighter">
            {formatTime(timeLeft)}
          </span>
          <span className="text-slate-400 dark:text-slate-500 font-medium mt-1 block uppercase tracking-widest text-xs">
            {MODES[mode].label}
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={resetTimer}
          className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <RotateCcw size={24} />
        </button>
        <button
          onClick={toggleTimer}
          className={`px-10 py-4 rounded-2xl text-white font-bold text-lg shadow-lg transition-transform active:scale-95 ${MODES[mode].color}`}
        >
          {isActive ? <Pause size={28} /> : <Play size={28} />}
        </button>
        <button
          onClick={handleComplete}
          className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <SkipForward size={24} />
        </button>
      </div>
    </div>
  );
};
