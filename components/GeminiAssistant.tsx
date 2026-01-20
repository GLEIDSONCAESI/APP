
import React, { useState, useEffect } from 'react';
import { Sparkles, Send, Loader2, Quote, Search, BookOpen, ExternalLink, ChevronLeft, MapPin, Navigation } from 'lucide-react';
import { generateStudyPlan, getStudyMotivation, searchStudyTopic, findStudySpots } from '../services/geminiService';
import { ScheduleItem } from '../types';

interface GeminiAssistantProps {
  onPlanGenerated: (items: ScheduleItem[]) => void;
}

export const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ onPlanGenerated }) => {
  const [activeMode, setActiveMode] = useState<'plan' | 'search' | 'places'>('plan');
  const [prompt, setPrompt] = useState('');
  const [hours, setHours] = useState(4);
  const [loading, setLoading] = useState(false);
  const [motivation, setMotivation] = useState('');
  
  // Search and Places state
  const [searchResult, setSearchResult] = useState<{ 
    text: string, 
    sources?: { title: string, uri: string }[], 
    places?: { title: string, uri: string, snippets: string[] }[] 
  } | null>(null);

  useEffect(() => {
    fetchMotivation();
  }, []);

  const fetchMotivation = async () => {
    try {
      const m = await getStudyMotivation();
      setMotivation(m || '');
    } catch (e) {
      setMotivation("O sucesso é a soma de pequenos esforços repetidos dia após dia.");
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const plan = await generateStudyPlan(prompt, hours);
      const items: ScheduleItem[] = plan.map((p: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        ...p
      }));
      onPlanGenerated(items);
      setPrompt('');
    } catch (error) {
      alert("Erro ao gerar plano. Verifique sua chave de API.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setSearchResult(null);
    try {
      const result = await searchStudyTopic(prompt);
      setSearchResult({ text: result.text, sources: result.sources });
    } catch (error) {
      alert("Erro ao pesquisar tema. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleFindPlaces = async () => {
    setLoading(true);
    setSearchResult(null);
    
    let lat, lng;
    if ("geolocation" in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } catch (err) {
        console.warn("Geolocation denied or unavailable", err);
      }
    }

    try {
      const query = prompt.trim() || "bibliotecas e cafés silenciosos para estudar";
      const result = await findStudySpots(query, lat, lng);
      setSearchResult({ text: result.text, places: result.places });
    } catch (error) {
      alert("Erro ao encontrar locais. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-indigo-900 rounded-3xl p-6 text-white shadow-xl overflow-hidden relative transition-all duration-500 min-h-[300px]">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Sparkles size={120} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="text-amber-400" size={20} />
            <h2 className="text-lg font-bold tracking-tight uppercase">ANGELICADMC Assistant</h2>
          </div>
          <div className="flex bg-white/10 rounded-xl p-1 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => { setActiveMode('plan'); setSearchResult(null); setPrompt(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeMode === 'plan' ? 'bg-amber-400 text-indigo-900' : 'text-indigo-200 hover:text-white'}`}
            >
              Planejar
            </button>
            <button 
              onClick={() => { setActiveMode('search'); setSearchResult(null); setPrompt(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeMode === 'search' ? 'bg-amber-400 text-indigo-900' : 'text-indigo-200 hover:text-white'}`}
            >
              Pesquisar
            </button>
            <button 
              onClick={() => { setActiveMode('places'); setSearchResult(null); setPrompt(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeMode === 'places' ? 'bg-amber-400 text-indigo-900' : 'text-indigo-200 hover:text-white'}`}
            >
              Locais
            </button>
          </div>
        </div>

        {motivation && activeMode === 'plan' && !loading && !searchResult && (
          <div className="mb-6 bg-white/10 p-4 rounded-2xl italic text-sm flex gap-3 border border-white/5">
            <Quote size={18} className="text-indigo-300 flex-shrink-0" />
            <p className="text-indigo-50 leading-relaxed">{motivation}</p>
          </div>
        )}

        {searchResult ? (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <button 
              onClick={() => setSearchResult(null)}
              className="mb-4 flex items-center gap-1 text-xs font-bold text-indigo-300 hover:text-white transition-colors"
            >
              <ChevronLeft size={16} /> Voltar
            </button>
            
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 mb-4 max-h-80 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-2 mb-3 text-amber-400">
                {activeMode === 'search' ? <BookOpen size={18} /> : <MapPin size={18} />}
                <h3 className="font-bold text-sm uppercase tracking-wider">
                  {activeMode === 'search' ? 'Resultado da Pesquisa' : 'Sugestões de Locais'}
                </h3>
              </div>
              <div className="text-sm text-indigo-50 leading-relaxed whitespace-pre-wrap">
                {searchResult.text}
              </div>
            </div>

            {searchResult.sources && searchResult.sources.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Fontes</p>
                <div className="flex flex-wrap gap-2">
                  {searchResult.sources.map((source, i) => (
                    <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" 
                       className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all">
                      {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                      <ExternalLink size={10} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {searchResult.places && searchResult.places.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Links de Localização</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {searchResult.places.map((place, i) => (
                    <a key={i} href={place.uri} target="_blank" rel="noopener noreferrer" 
                       className="flex items-center justify-between bg-white/10 hover:bg-white/20 p-4 rounded-2xl border border-white/5 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-400/20 text-amber-400 rounded-lg group-hover:bg-amber-400 group-hover:text-indigo-900 transition-all">
                          <Navigation size={16} />
                        </div>
                        <span className="text-sm font-bold">{place.title}</span>
                      </div>
                      <ExternalLink size={14} className="opacity-50" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div>
              <label className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2 block">
                {activeMode === 'plan' ? 'O que você precisa estudar hoje?' : 
                 activeMode === 'search' ? 'Qual tema você quer explorar?' : 
                 'Qual ambiente você procura?'}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={activeMode === 'plan' 
                  ? "Ex: Revisar Cálculo I, estudar anatomia..." 
                  : activeMode === 'search' ? "Ex: Como funciona a fotossíntese?"
                  : "Ex: Cafés com Wi-Fi em São Paulo..."}
                className="w-full bg-white/10 border border-white/5 rounded-2xl p-4 text-sm placeholder:text-indigo-400 focus:ring-2 focus:ring-amber-400 transition-all outline-none resize-none h-24"
              />
            </div>

            <div className="flex items-center gap-4">
              {activeMode === 'plan' ? (
                <div className="flex-1">
                  <label className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2 block">Horas Disponíveis: {hours}h</label>
                  <input type="range" min="1" max="12" value={hours} onChange={(e) => setHours(parseInt(e.target.value))}
                    className="w-full accent-amber-400" />
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-3 text-indigo-300 opacity-60">
                   <Search size={18} />
                   <p className="text-[10px] uppercase font-bold tracking-widest">Informação em tempo real</p>
                </div>
              )}
              
              <button
                onClick={activeMode === 'plan' ? handleGenerate : activeMode === 'search' ? handleSearch : handleFindPlaces}
                disabled={loading || (activeMode !== 'places' && !prompt.trim())}
                className="bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-indigo-900 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2 flex-shrink-0"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 
                 activeMode === 'plan' ? <Send size={20} /> : <Sparkles size={20} />}
                {activeMode === 'plan' ? 'Gerar Plano' : activeMode === 'search' ? 'Pesquisar' : 'Ver Locais'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
