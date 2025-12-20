import { UserFilters, Recipe, Temperature, IngredientCorrection } from "./types";

// Вспомогательная функция для общения с нашим сервером
async function callGeminiAPI(payload: any) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Ошибка API");
  }

  return await response.json();
}

const recipeSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      title: { type: "string", description: 'Название блюда' },
      description: { type: "string", description: 'Краткое описание блюда' },
      cookingTimeMinutes: { type: "integer", description: 'Время приготовления в минутах' },
      instructions: { 
        type: "array", 
        items: { type: "string" },
        description: 'Пошаговая инструкция'
      },
      ingredients: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: 'Название ингредиента' },
            amount: { type: "string", description: 'Количество' },
            isAvailable: { type: "boolean", description: 'true если ингредиент есть в наличии' }
          },
          required: ['name', 'amount', 'isAvailable']
        }
      },
      isVegan: { type: "boolean" },
      isKosher: { type: "boolean" },
      temperature: { type: "string", description: 'warm, cold' }
    },
    required: ['title', 'description', 'cookingTimeMinutes', 'instructions', 'ingredients', 'isVegan', 'isKosher', 'temperature']
  }
};

const validationSchema = {
  type: "object",
  properties: {
    corrections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          original: { type: "string" },
          suggested: { type: "string" },
          reason: { type: "string" }
        },
        required: ['original', 'suggested', 'reason']
      }
    }
  },
  required: ['corrections']
};

export async function validateIngredients(list: string[]): Promise<IngredientCorrection[]> {
  const prompt = `Проверь ингредиенты на ошибки: ${list.join(", ")}. Верни JSON.`;
  
  try {
    const data = await callGeminiAPI({
      prompt,
      modelName: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: validationSchema,
      }
    });
    
    const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
    return parsed.corrections || [];
  } catch (error) {
    console.error("Validation error:", error);
    return [];
  }
}

export async function generateRecipes(filters: UserFilters): Promise<Recipe[]> {
  const prompt = `Сгенерируй ${filters.recipeCount} рецептов. Продукты: ${filters.availableIngredients.join(", ")}. Результат на русском.`;

  try {
    const data = await callGeminiAPI({
      prompt,
      modelName: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
      }
    });

    const results = JSON.parse(data.candidates[0].content.parts[0].text);
    
    return results.map((r: any, index: number) => ({
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
    const prompt = `Professional food photography of "${recipe.title}". High-end restaurant plating.`;

    const data = await callGeminiAPI({
      prompt,
      modelName: "gemini-1.5-flash", // Используем доступную модель для генерации
    });

    // Если модель вернула картинку в inlineData
    for (const part of data.candidates[0].content.parts) {
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
