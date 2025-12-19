
import { GoogleGenAI, Type } from "@google/genai";
import { UserFilters, Recipe, Temperature, IngredientCorrection } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const recipeSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Название блюда' },
      description: { type: Type.STRING, description: 'Краткое описание блюда' },
      cookingTimeMinutes: { type: Type.INTEGER, description: 'Время приготовления в минутах' },
      instructions: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: 'Пошаговая инструкция'
      },
      ingredients: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Название ингредиента' },
            amount: { type: Type.STRING, description: 'Количество' },
            isAvailable: { type: Type.BOOLEAN, description: 'true если ингредиент есть в наличии у пользователя, false если его нужно докупить' }
          },
          required: ['name', 'amount', 'isAvailable']
        }
      },
      isVegan: { type: Type.BOOLEAN },
      isKosher: { type: Type.BOOLEAN },
      temperature: { type: Type.STRING, description: 'warm, cold' }
    },
    required: ['title', 'description', 'cookingTimeMinutes', 'instructions', 'ingredients', 'isVegan', 'isKosher', 'temperature']
  }
};

const validationSchema = {
  type: Type.OBJECT,
  properties: {
    corrections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          original: { type: Type.STRING },
          suggested: { type: Type.STRING },
          reason: { type: Type.STRING }
        },
        required: ['original', 'suggested', 'reason']
      }
    }
  },
  required: ['corrections']
};

export async function validateIngredients(list: string[]): Promise<IngredientCorrection[]> {
  const prompt = `Проверь следующий список ингредиентов на наличие опечаток, несуществующих продуктов или странных названий: ${list.join(", ")}. 
  Если продукт написан неправильно (например 'лык' вместо 'лук') или это не съедобный продукт, предложи исправление. 
  Верни список исправлений в формате JSON. Если всё верно, верни пустой массив corrections.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: validationSchema,
      },
    });
    const data = JSON.parse(response.text);
    return data.corrections || [];
  } catch (error) {
    console.error("Validation error:", error);
    return [];
  }
}

export async function generateRecipes(filters: UserFilters): Promise<Recipe[]> {
  const prompt = `Сгенерируй ровно ${filters.recipeCount} уникальных рецептов на основе следующих данных:
  Имеющиеся продукты: ${filters.availableIngredients.join(", ")}
  Исключить ингредиенты: ${filters.excludedIngredients.join(", ")}
  Максимальное время: ${filters.maxCookingTime} минут
  Предпочтение по температуре: ${filters.temperature}
  Веганское: ${filters.isVegan}
  Кошерное: ${filters.isKosher}
  
  Для каждого ингредиента в рецепте ОБЯЗАТЕЛЬНО проверь, входит ли он в список "Имеющиеся продукты". 
  Если входит - isAvailable: true. 
  Если отсутствует - isAvailable: false (даже если это соль или вода, если их нет в списке имеющихся - ставь false).
  
  Результат должен быть на русском языке.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
      },
    });

    const results = JSON.parse(response.text) as any[];
    
    return results.map((r, index) => ({
      ...r,
      id: `recipe-${index}-${Date.now()}`,
      temperature: r.temperature as Temperature
    }));
  } catch (error) {
    console.error("Error generating recipes:", error);
    throw error;
  }
}

export async function generateRecipeImage(recipe: Recipe): Promise<string> {
  try {
    const ingredientsText = recipe.ingredients.map(i => i.name).join(", ");
    const prompt = `Professional food photography of "${recipe.title}". 
    The dish consists of: ${ingredientsText}. 
    Style: High-end restaurant plating, close-up, soft natural lighting, appetizing, macro photography. 
    Ensure the image accurately represents the specific ingredients listed. No people in frame.`;

    const aiImg = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const response = await aiImg.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: { aspectRatio: "4:3" }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return '';
  } catch (error) {
    console.error("Image gen error:", error);
    return '';
  }
}
