export interface User {
  id: number;
  email: string;
  displayName: string;
  createdAt?: string | Date;
}

export interface AuthSession {
  userId: number;
  token: string;
  expiresAt?: Date;
}

export interface AuthRegisterBody {
  email: string;
  password: string;
  displayName?: string;
}

export interface AuthLoginBody {
  email: string;
  password: string;
}

export interface WaterEntry {
  id: number | string;
  volumeMl: number;
  timestamp: string | Date;
}

export interface NutritionFood {
  food_name: string;
  serving_weight_grams: number;
  nf_calories: number;
  nf_protein: number;
  nf_total_carbohydrate: number;
  nf_total_fat: number;
}

export interface NutritionSearchResult {
  common: NutritionFood[];
}

export interface NaturalLanguageResult extends NutritionSearchResult {}

export interface TdeeRequest {
  age: number;
  sex: 'male' | 'female' | string;
  height_cm: number;
  weight_kg: number;
  activity_level: number;
}

export interface TdeeResult {
  bmr: number;
  tdee: number;
  calorieTargets: {
    maintain: number;
    mildWeightLoss: number;
    weightLoss: number;
    extremeWeightLoss: number;
  };
  macros: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
}

export interface FitnessEntry {
  id: number | string;
  name?: string;
  [key: string]: unknown;
}

export interface ProductivityEntry {
  id: number | string;
  title?: string;
  [key: string]: unknown;
}
