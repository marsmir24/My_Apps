
import React, { useState, useMemo } from 'react';
import { UserFilters, Recipe, Temperature, IngredientCorrection } from './types';
import { generateRecipes, validateIngredients } from './geminiService';
import TagInput from './components/TagInput';
import RecipeCard from './components/RecipeCard';

const App: React.FC = () => {
  const [filters, setFilters] = useState<UserFilters>({
    availableIngredients: [],
    excludedIngredients: [],
    temperature: Temperature.ANY,
    isVegan: false,
    isKosher: false,
    maxCookingTime: 30,
    recipeCount: 6,
    showImages: true,
  });

  const [rawInpAvailable, setRawInpAvailable] = useState('');
  const [rawInpExcluded, setRawInpExcluded] = useState('');

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [corrections, setCorrections] = useState<IngredientCorrection[]>([]);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);

  const applyCorrection = (original: string, suggested: string) => {
    setFilters(prev => ({
      ...prev,
      availableIngredients: prev.availableIngredients.map(i => i === original ? suggested : i)
    }));
    setCorrections(prev => prev.filter(c => c.original !== original));
  };

  const skipCorrection = (original: string) => {
    setCorrections(prev => prev.filter(c => c.original !== original));
  };

  const handleStartGeneration = async () => {
    let currentAvailable = [...filters.availableIngredients];
    if (rawInpAvailable.trim()) {
      const parts = rawInpAvailable.split(',').map(s => s.trim()).filter(Boolean);
      currentAvailable = Array.from(new Set([...currentAvailable, ...parts]));
      setFilters(prev => ({ ...prev, availableIngredients: currentAvailable }));
      setRawInpAvailable('');
    }

    if (currentAvailable.length === 0) {
      setError("Пожалуйста, введите хотя бы один ингредиент.");
      return;
    }

    setError(null);
    setValidating(true);
    
    // Step 1: Validate Ingredients
    const foundCorrections = await validateIngredients(currentAvailable);
    setValidating(false);

    if (foundCorrections.length > 0) {
      setCorrections(foundCorrections);
      setShowCorrectionModal(true);
    } else {
      executeGeneration(currentAvailable, filters.excludedIngredients);
    }
  };

  const executeGeneration = async (available: string[], excluded: string[]) => {
    setLoading(true);
    setShowCorrectionModal(false);
    try {
      const result = await generateRecipes({
        ...filters,
        availableIngredients: available,
        excludedIngredients: excluded
      });
      
      const rankedRecipes = result.map(recipe => {
        const missingCount = recipe.ingredients.filter(i => !i.isAvailable).length;
        const ingredientScore = Math.max(0, 5 - (missingCount * 1.5)); 
        const timeScore = Math.max(0, 5 * (1 - (recipe.cookingTimeMinutes / 90)));
        
        return {
          ...recipe,
          rating: Number((ingredientScore + timeScore).toFixed(1))
        };
      }).sort((a, b) => (b.rating || 0) - (a.rating || 0));

      setRecipes(rankedRecipes);
    } catch (err) {
      setError("Не удалось сгенерировать рецепты. Попробуйте еще раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 transition-all">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-2xl text-white shadow-lg shadow-blue-200 ring-2 ring-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">SmartChef <span className="text-blue-600">AI</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Твой умный помощник</p>
            </div>
          </div>
          <button 
            onClick={handleStartGeneration}
            disabled={loading || validating}
            className={`px-8 py-3 rounded-2xl font-bold text-white transition-all shadow-xl active:scale-95 flex items-center gap-2 ${loading || validating ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200'}`}
          >
            {loading || validating ? (
               <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : 'Найти рецепты'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6 sticky top-24">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
              Конфигуратор
            </h2>

            <TagInput 
              label="Что у тебя есть?"
              tags={filters.availableIngredients}
              inputValue={rawInpAvailable}
              onInputChange={setRawInpAvailable}
              onAdd={(tag) => setFilters(prev => ({ ...prev, availableIngredients: [...prev.availableIngredients, tag] }))}
              onRemove={(idx) => setFilters(prev => ({ ...prev, availableIngredients: prev.availableIngredients.filter((_, i) => i !== idx) }))}
              placeholder="лук, курица..."
              colorClass="bg-blue-50 text-blue-700 border border-blue-100"
            />

            <TagInput 
              label="Что исключить?"
              tags={filters.excludedIngredients}
              inputValue={rawInpExcluded}
              onInputChange={setRawInpExcluded}
              onAdd={(tag) => setFilters(prev => ({ ...prev, excludedIngredients: [...prev.excludedIngredients, tag] }))}
              onRemove={(idx) => setFilters(prev => ({ ...prev, excludedIngredients: prev.excludedIngredients.filter((_, i) => i !== idx) }))}
              placeholder="мясо, грибы..."
              colorClass="bg-slate-50 text-slate-500 border border-slate-100"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Блюд: {filters.recipeCount}</label>
                <input 
                  type="range" min="3" max="10" step="1"
                  value={filters.recipeCount}
                  onChange={(e) => setFilters(prev => ({ ...prev, recipeCount: parseInt(e.target.value) }))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Макс время: {filters.maxCookingTime}м</label>
                <input 
                  type="range" min="5" max="120" step="5"
                  value={filters.maxCookingTime}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxCookingTime: parseInt(e.target.value) }))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/50">
              <span className="text-xs font-bold text-slate-600">Картинки блюд</span>
              <button 
                onClick={() => setFilters(prev => ({ ...prev, showImages: !prev.showImages }))}
                className={`w-12 h-6 rounded-full transition-all relative ${filters.showImages ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${filters.showImages ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(Object.values(Temperature) as Temperature[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilters(prev => ({ ...prev, temperature: t }))}
                  className={`py-2 rounded-xl text-[10px] font-black border transition-all uppercase tracking-tighter ${filters.temperature === t ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'}`}
                >
                  {t === Temperature.WARM ? 'Теплое' : t === Temperature.COLD ? 'Холодное' : 'Любое'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setFilters(p => ({...p, isVegan: !p.isVegan}))}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${filters.isVegan ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-50 bg-slate-50 opacity-40 text-slate-400'}`}
              >
                <span className="text-xl">🥗</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Vegan</span>
              </button>
              <button 
                onClick={() => setFilters(p => ({...p, isKosher: !p.isKosher}))}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${filters.isKosher ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-50 bg-slate-50 opacity-40 text-slate-400'}`}
              >
                <span className="text-xl">🕍</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Kosher</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Results Area */}
        <div className="lg:col-span-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-3xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
              <div className="p-2 bg-red-100 rounded-full">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          {loading || validating ? (
            <div className="flex flex-col items-center justify-center py-40 space-y-6">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin shadow-inner"></div>
                <div className="absolute inset-0 flex items-center justify-center text-4xl animate-bounce">
                  {validating ? '🔍' : '🍳'}
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                  {validating ? 'Проверяем продукты...' : 'Создаем рецепты...'}
                </h3>
                <p className="text-slate-400 text-sm mt-1">Это займет всего несколько секунд</p>
              </div>
            </div>
          ) : recipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-700">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} showImage={filters.showImages} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] border-4 border-dashed border-slate-100 p-24 text-center">
              <div className="bg-slate-50 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <svg className="w-16 h-16 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-700 mb-4 uppercase tracking-tighter">Готовы начать?</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed font-medium">
                Введите продукты, которые у вас есть, и ИИ предложит до 10 идеальных блюд с учётом всех пожеланий.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Validation Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-blue-600 p-6 text-white text-center">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
              </div>
              <h3 className="text-lg font-black uppercase tracking-widest">Проверьте список</h3>
              <p className="text-blue-100 text-xs font-medium mt-1">Мы нашли несколько опечаток</p>
            </div>
            
            <div className="p-6 max-h-[400px] overflow-y-auto space-y-4">
              {corrections.map((c, i) => (
                <div key={i} className="flex flex-col gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-red-500 line-through">"{c.original}"</span>
                    <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    <span className="text-sm font-bold text-green-600 underline decoration-2 underline-offset-4">"{c.suggested}"</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.reason}</p>
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={() => applyCorrection(c.original, c.suggested)}
                      className="flex-grow py-2 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase hover:bg-blue-700"
                    >
                      Исправить
                    </button>
                    <button 
                      onClick={() => skipCorrection(c.original)}
                      className="px-4 py-2 bg-slate-200 text-slate-500 rounded-xl text-[10px] font-bold uppercase hover:bg-slate-300"
                    >
                      Оставить
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 flex gap-3">
              <button 
                onClick={() => executeGeneration(filters.availableIngredients, filters.excludedIngredients)}
                className="flex-grow py-4 bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-colors"
              >
                {corrections.length > 0 ? 'Продолжить как есть' : 'Начать генерацию'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
