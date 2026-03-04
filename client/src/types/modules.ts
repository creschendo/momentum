import type { FoodEntry, WaterEntry, WeightEntry } from '../api/nutrition';
import type { FitnessSplit } from '../api/fitness';

export type GoalKey = 'maintain' | 'mildWeightLoss' | 'weightLoss' | 'extremeWeightLoss';

export interface WaterSummary {
  period: 'daily' | 'weekly' | 'monthly' | string;
  start?: string;
  totalMl: number;
}

export interface WeightTrendStats {
  count: number;
  latestKg: number | null;
  startKg: number | null;
  changeKg: number;
}

export interface WeightTrend {
  days: number;
  points: Array<Pick<WeightEntry, 'id' | 'weightKg' | 'entryDate' | 'note'>>;
  stats: WeightTrendStats;
}

export interface CalorieGoal {
  goalKey: GoalKey;
  calories: number;
  goalValue?: number;
  goalLabel?: string;
}

export interface BmrFormData {
  age: number;
  sex: 'male' | 'female';
  height_cm: number;
  height_in: number;
  weight_kg: number;
  weight_lbs: number;
  activity_level: number;
}

export interface TdeeCalorieTargets {
  maintain?: number;
  mildWeightLoss?: number;
  weightLoss?: number;
  extremeWeightLoss?: number;
}

export interface TdeeMacros {
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

export interface TdeeResult {
  bmr: number;
  tdee: number;
  calorieTargets?: TdeeCalorieTargets;
  macros?: TdeeMacros;
}

export interface Meal extends Record<string, unknown> {
  id: number | string;
  name: string;
  foods: FoodEntry[];
  timestamp?: string;
}

export interface FoodsState {
  searchResults: { common: Array<Record<string, unknown>> } | null;
  meals: Meal[];
  currentMeal: FoodEntry[];
  mealName: string;
  editingMealId: number | string | null;
  summary: Record<string, unknown> | null;
  period: 'daily' | 'weekly' | 'monthly' | string;
  loading: boolean;
  error: string | null;
}

export interface WaterState {
  entries: WaterEntry[];
  summary: WaterSummary | null;
  loading: boolean;
  error: string | null;
}

export interface WeightState {
  entries: WeightEntry[];
  trend: WeightTrend;
  windowDays: number;
  loading: boolean;
  error: string | null;
}

export interface SplitsState {
  splits: FitnessSplit[];
  loading: boolean;
  error: string | null;
}
