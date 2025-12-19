
import React, { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { generateRecipeImage } from '../geminiService';

interface RecipeCardProps {
  recipe: Recipe;
  showImage: boolean;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, showImage }) => {
  const [image, setImage] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(false);

  const missingIngredients = recipe.ingredients.filter(i => !i.isAvailable);

  useEffect(() => {
    if (!showImage) return;
    
    let mounted = true;
    const loadImage = async () => {
      setImageLoading(true);
      const imgData = await generateRecipeImage(recipe);
      if (mounted) {
        setImage(imgData);
        setImageLoading(false);
      }
    };
    loadImage();
    return () => { mounted = false; };
  }, [recipe, showImage]);

  const renderStars = (rating: number = 0) => {
    const stars = Math.round(rating / 2);
    return (
      <div className="flex text-amber-400">
        {[...Array(5)].map((_, i) => (
          <svg key={i} className={`w-4 h-4 ${i < stars ? 'fill-current' : 'text-slate-200'}`} viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group h-full">
      {showImage && (
        <div className="relative h-48 overflow-hidden bg-slate-100 shrink-0">
          {imageLoading ? (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-200 to-slate-100 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : image ? (
            <img src={image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-slate-300 italic text-xs">Визуализация...</div>
          )}
        </div>
      )}

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2 gap-4">
          <h3 className="text-lg font-bold text-slate-800 leading-tight line-clamp-2">{recipe.title}</h3>
          <div className="flex flex-col items-end shrink-0">
             <div className="bg-amber-50 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded border border-amber-100">
               {recipe.rating?.toFixed(1)}
             </div>
             {renderStars(recipe.rating)}
          </div>
        </div>
        
        <p className="text-slate-500 text-xs mb-4 line-clamp-2">
          {recipe.description}
        </p>

        <div className="mb-4">
          <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-widest flex justify-between">
            <span>Нужно докупить:</span>
            <span className="text-slate-300 font-normal lowercase">{missingIngredients.length} шт.</span>
          </h4>
          {missingIngredients.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {missingIngredients.map((ing, idx) => (
                <span key={idx} className="bg-red-50 text-red-600 text-[10px] font-medium px-2 py-0.5 rounded-full border border-red-100">
                  + {ing.name} ({ing.amount})
                </span>
              ))}
            </div>
          ) : (
            <span className="text-green-600 text-[10px] font-bold flex items-center gap-1 uppercase tracking-tighter">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
              Всё в наличии!
            </span>
          )}
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-50 pt-3">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {recipe.cookingTimeMinutes} мин
            </span>
            <span className={`px-2 py-0.5 rounded ${recipe.isVegan ? 'bg-green-100 text-green-700' : 'bg-slate-100'}`}>
              {recipe.isVegan ? 'VEGAN' : 'STANDART'}
            </span>
          </div>

          <details className="group">
            <summary className="cursor-pointer list-none text-blue-600 text-xs font-bold flex items-center justify-between hover:text-blue-700 bg-slate-50 p-2 rounded-lg transition-colors active:scale-95">
              <span>ПОКАЗАТЬ РЕЦЕПТ</span>
              <svg className="w-3 h-3 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </summary>
            <div className="mt-3 text-xs text-slate-700 space-y-3 p-1 max-h-[300px] overflow-y-auto custom-scrollbar">
              <div className="space-y-1">
                {recipe.ingredients.map((ing, idx) => (
                  <div key={idx} className={`flex justify-between p-1 rounded ${ing.isAvailable ? 'text-slate-400' : 'bg-red-50/50 text-slate-800 font-semibold'}`}>
                    <span>{ing.name}</span>
                    <span className="shrink-0 ml-2">{ing.amount}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-100">
                {recipe.instructions.map((step, idx) => (
                  <div key={idx} className="mb-3 flex gap-2">
                    <span className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-[10px] font-bold shrink-0">{idx + 1}</span>
                    <p className="leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
