
export enum Temperature {
  WARM = 'warm',
  COLD = 'cold',
  ANY = 'any'
}

export interface Ingredient {
  name: string;
  isAvailable: boolean;
  amount: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  cookingTimeMinutes: number;
  ingredients: Ingredient[];
  isVegan: boolean;
  isKosher: boolean;
  temperature: Temperature;
  rating?: number;
}

export interface UserFilters {
  availableIngredients: string[];
  excludedIngredients: string[];
  temperature: Temperature;
  isVegan: boolean;
  isKosher: boolean;
  maxCookingTime: number;
  recipeCount: number;
  showImages: boolean;
}

export interface IngredientCorrection {
  original: string;
  suggested: string;
  reason: string;
}
